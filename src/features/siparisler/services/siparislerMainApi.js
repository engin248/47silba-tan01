import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { idb } from '@/lib/idbKalkan';

export const siparisleriVeBilesenleriGetir = async (sayfaNo, SAYFA_BOYUTU, timeoutPromise) => {
    const from = sayfaNo * SAYFA_BOYUTU;
    const to = from + SAYFA_BOYUTU - 1;

    // 1. Otonom Sync Fonksiyonu
    const otonomSync = async () => {
        const reqs = Promise.allSettled([
            supabase.from('b2_siparisler').select('*, b2_musteriler:musteri_id(ad_soyad,musteri_kodu)').order('created_at', { ascending: false }).range(from, to),
            supabase.from('b2_musteriler').select('id,musteri_kodu,ad_soyad').eq('aktif', true).limit(500),
            supabase.from('b2_urun_katalogu').select('id,urun_kodu,urun_adi,satis_fiyati_tl,stok_adeti').eq('durum', 'aktif').limit(500)
        ]);
        const res = await Promise.race([reqs, timeoutPromise]);

        // 2. Local DB Güncelleniyor (Background)
        if (res[0]?.status === 'fulfilled' && res[0].value.data) {
            await idb.bulkUpsert('m8_siparis', res[0].value.data);
        }
        return res;
    };

    // 3. Local DB'den anında oku
    const localSiparisler = await idb.getAllWithLimit('m8_siparis', SAYFA_BOYUTU, from);

    if (!localSiparisler || localSiparisler.length === 0) {
        return await otonomSync();
    } else {
        otonomSync(); // UI bloklamadan arka planda güncelle (Lazy fetch)
        return [
            { status: 'fulfilled', value: { data: localSiparisler } },
            { status: 'fulfilled', value: { data: [] } },
            { status: 'fulfilled', value: { data: [] } }
        ];
    }
};

export const siparisDetayiniGetir = async (siparisId) => {
    return await supabase.from('b2_siparis_kalemleri').select('*, b2_urun_katalogu:urun_id(urun_kodu,urun_adi)').eq('siparis_id', siparisId);
};

export const siparisGercekZamanliKur = (onSiparisDegisti) => {
    return supabase.channel('siparis_gercek_zamanli')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_siparisler' }, onSiparisDegisti)
        .subscribe();
};

export const siparisKanaliniKapat = (kanal) => {
    if (kanal) supabase.removeChannel(kanal);
};

export const siparisDurumGuncelleVeOtonomTetikle = async (id, durum, ekstraBilgi = {}, mevcutSiparis) => {
    const result = { success: false, mesaj: '', telegram: '' };

    if (mevcutSiparis && mevcutSiparis.durum === durum) {
        throw new Error(`Sipariş zaten "${durum}" durumunda! Mükerrer işlem engellendi.`);
    }

    const { error } = await supabase.from('b2_siparisler').update({ durum, ...ekstraBilgi }).eq('id', id);
    if (error) throw error;

    // KURAL: Onaylandıysa Stok Rezerve Et ve Gerekirse Otonom Üretim Emri Ver!
    if (durum === 'onaylandi') {
        const { data: kalemler, error: kErr } = await supabase.from('b2_siparis_kalemleri').select('urun_id, adet').eq('siparis_id', id);
        if (kErr) throw kErr;

        for (const k of (kalemler || [])) {
            await supabase.from('b2_stok_hareketleri').insert([{
                urun_id: k.urun_id, hareket_tipi: 'cikis', adet: k.adet,
                aciklama: `Sipariş onayı - stok rezervasyonu (Sipariş ID: ${id})`,
            }]);

            const { data: urun } = await supabase.from('b2_urun_katalogu').select('urun_adi, urun_kodu, stok_adeti, min_stok, model_id').eq('id', k.urun_id).single();
            if (urun) {
                const yeniStok = Math.max(0, (urun.stok_adeti || 0) - k.adet);
                const stokFarki = (urun.stok_adeti || 0) - k.adet;
                await supabase.from('b2_urun_katalogu').update({ stok_adeti: yeniStok }).eq('id', k.urun_id);

                // OTONOM ÜRETİM EMRİ (Stok Eksiye Düştüyse)
                if (stokFarki < 0 && urun.model_id) {
                    const eksikAdet = Math.abs(stokFarki);
                    try {
                        await supabase.from('production_orders').insert([{
                            model_id: urun.model_id, quantity: eksikAdet, status: 'pending',
                            priority: mevcutSiparis?.acil ? 'high' : 'normal',
                            order_code: `SP-${mevcutSiparis?.siparis_no || id}-UR`
                        }]);
                        result.telegram += `\n🤖 SİSTEM MÜDAHALESİ!\nSipariş: ${mevcutSiparis?.siparis_no || id}\nÜrün stoku eksiye düştü: ${urun.urun_kodu}\nEksik ➔ ${eksikAdet} adet otonom olarak banda atıldı!`;
                    } catch (err) { console.error('Otonom üretim emri atılamadı:', err); }
                } else if (yeniStok <= (urun.min_stok || 10)) {
                    result.telegram += `\n🚨 KRİTİK STOK!\nÜrün: ${urun.urun_kodu} | ${urun.urun_adi}\nKalan: ${yeniStok} adet\nSınır: ${urun.min_stok || 10}`;
                }
            }
        }
        result.mesaj = 'Sipariş onaylandı. Stoklar otomatik rezerve edildi (düşüldü).';
        result.telegram = `✅ SİPARİŞ ONAYLANDI!\nSipariş ID: ${id}\nStok rezervasyonu yapıldı.` + result.telegram;
        result.success = true;

    } else if (durum === 'teslim') {
        const kasaPayload = {
            hareket_tipi: 'tahsilat',
            odeme_yontemi: mevcutSiparis?.odeme_yontemi || 'nakit',
            tutar_tl: mevcutSiparis?.toplam_tutar_tl || 0,
            aciklama: `Otonom Sipariş Tahsilatı (Sipariş No: ${mevcutSiparis?.siparis_no || id})`,
            musteri_id: mevcutSiparis?.musteri_id || null,
            onay_durumu: 'onaylandi'
        };

        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b2_kasa_hareketleri', 'INSERT', kasaPayload);
        } else {
            await supabase.from('b2_kasa_hareketleri').insert([kasaPayload]);
            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b2_kasa_hareketleri', islem_tipi: 'OTOMATIK_KASA_GIRIS',
                kullanici_adi: 'SİSTEM (GAMMA AJAN)',
                eski_veri: { siparis_no: mevcutSiparis?.siparis_no || id, tutar_tl: mevcutSiparis?.toplam_tutar_tl || 0 }
            }]);
        }
        result.mesaj = 'Sipariş teslim edildi ve tahsilat Kasa modülüne aktarıldı!';
        result.telegram = `🎉 SİPARİŞ TESLİM EDİLDİ!\nSipariş No: ${mevcutSiparis?.siparis_no || id}\nTahsilat Kasa'ya devredildi.`;
        result.success = true;

    } else if (durum === 'kargoda') {
        result.mesaj = 'Kargoya verildi.';
        result.telegram = `🚚 SİPARİŞ KARGOYA VERİLDİ!\nSipariş ID: ${id}\nTakip: ${ekstraBilgi.kargo_takip_no || 'Belirtilmedi'}`;
        result.success = true;

    } else if (durum === 'iptal' || durum === 'iade') {
        const oncekiDurum = mevcutSiparis?.durum;
        if (['onaylandi', 'hazirlaniyor', 'kargoda'].includes(oncekiDurum)) {
            const { data: kalemler } = await supabase.from('b2_siparis_kalemleri').select('urun_id, adet').eq('siparis_id', id);
            for (const k of (kalemler || [])) {
                await supabase.from('b2_stok_hareketleri').insert([{
                    urun_id: k.urun_id, hareket_tipi: 'iade', adet: k.adet,
                    aciklama: `Sipariş ${durum} - stok iadesi (Sipariş ID: ${id})`,
                }]);
                const { data: urun } = await supabase.from('b2_urun_katalogu').select('stok_adeti').eq('id', k.urun_id).single();
                if (urun) {
                    await supabase.from('b2_urun_katalogu').update({ stok_adeti: (urun.stok_adeti || 0) + k.adet }).eq('id', k.urun_id);
                }
            }
            result.mesaj = `Sipariş ${durum === 'iptal' ? 'iptal edildi' : 'iade alındı'}. Stoklar geri eklendi.`;
        } else {
            result.mesaj = `Durum güncellendi: ${durum}`;
        }
        result.success = true;
    } else {
        result.mesaj = 'Durum güncellendi.';
        result.success = true;
    }

    return result;
};

export const siparisVeBaglantilariSil = async (id, anaSiparis, kullanici) => {
    // Audit log
    try {
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b2_siparisler',
            islem_tipi: 'SILME',
            kullanici_adi: kullanici?.ad || kullanici?.email || 'Bilinmeyen Kullanici',
            eski_veri: {
                siparis_id: id,
                siparis_no: anaSiparis?.siparis_no || 'Bilinmiyor',
                toplam_tutar_tl: anaSiparis?.toplam_tutar_tl || 0,
                durum: anaSiparis?.durum || 'bilinmiyor',
                silme_zamani: new Date().toISOString()
            }
        }]);
    } catch (e) { console.warn('[AUDIT LOG HATA]', e); }

    await supabase.from('b2_siparis_kalemleri').delete().eq('siparis_id', id);
    const { error } = await supabase.from('b2_siparisler').delete().eq('id', id);
    if (error) throw error;
};

export const siparisGercekMaliyetVeyaTerminGuncelle = async (id, alan, deger) => {
    return await supabase.from('b2_siparisler').update({ [alan]: deger }).eq('id', id);
};
