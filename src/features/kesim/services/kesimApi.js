import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { idb } from '@/lib/idbKalkan';

export async function kesimVerileriniGetir(timeoutPromise) {
    const localZirh = await idb.getAllWithLimit('m3_kesim', 1, 0);

    const otonomSync = async () => {
        let results = [];
        try {
            const p1 = supabase.from('b1_kesim_operasyonlari').select('*, b1_model_taslaklari(model_kodu, model_adi)').order('created_at', { ascending: false }).limit(200);
            const p2 = supabase.from('b1_model_taslaklari').select('id, model_kodu, model_adi').eq('durum', 'uretime_hazir').limit(500);
            const p3 = supabase.from('b1_kumas_arsivi').select('id, kumas_kodu, renk_tanimi').limit(200);

            results = await Promise.race([Promise.allSettled([p1, p2, p3]), timeoutPromise || new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000))]);
        } catch (error) {
            console.error('[KÖR NOKTA ZIRHI - Kesim] timeout:', error);
            return { kesimler: [], modeller: [], kumaslar: [] };
        }

        const [kesimRes, modelRes, kumasRes] = results;
        const kesimler = kesimRes?.status === 'fulfilled' ? (kesimRes.value.data || []) : [];
        const modeller = modelRes?.status === 'fulfilled' ? (modelRes.value.data || []) : [];
        const kumaslar = kumasRes?.status === 'fulfilled' ? (kumasRes.value.data || []) : [];

        const paket = { id: 'kesim_veri_zirhi', kesimler, modeller, kumaslar };
        // Yalnızca anlamlı veri varsa kaydet
        if (kesimler.length > 0 || modeller.length > 0) {
            await idb.bulkUpsert('m3_kesim', [paket]);
        }

        return paket;
    };

    if (!localZirh || localZirh.length === 0) {
        return await otonomSync();
    } else {
        otonomSync(); // Arkada asenkron bırak
        return localZirh[0];
    }
}

export async function kesimKaydet(payload, duzenleId) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_kesim_operasyonlari', duzenleId ? 'UPDATE' : 'INSERT', { ...payload, id: duzenleId });
        return { offline: true };
    }

    if (duzenleId) {
        const { error } = await supabase.from('b1_kesim_operasyonlari').update(payload).eq('id', duzenleId);
        if (error) throw error;
        return { isUpdate: true };
    } else {
        const { error } = await supabase.from('b1_kesim_operasyonlari').insert([payload]);
        if (error) throw error;
        return { isUpdate: false };
    }
}

export async function uretimIsEmriOlustur(kesimKaydi) {
    const { data: mevcut } = await supabase.from('production_orders')
        .select('id').eq('model_id', kesimKaydi.model_taslak_id).in('status', ['pending', 'in_progress']);

    if (mevcut && mevcut.length > 0) throw new Error('⚠️ Bu model için zaten aktif bir iş emri var!');

    const { data: yeniEmir, error } = await supabase.from('production_orders').insert([{
        order_code: 'KSM-ORD-' + Date.now(),
        model_id: kesimKaydi.model_taslak_id,
        quantity: kesimKaydi.kesilen_net_adet || 0,
        status: 'pending'
    }]).select().single();
    if (error) throw error;

    const fireYuzde = parseFloat(kesimKaydi.fire_orani) || 0;
    if (fireYuzde > 0) {
        const toplamKumasMt = parseFloat(kesimKaydi.kullanilan_kumas_mt) || 0;
        let kayipKumasMt = toplamKumasMt > 0
            ? (toplamKumasMt * fireYuzde) / 100
            : (kesimKaydi.kesilen_net_adet * 1.2 * fireYuzde) / 100;

        let kumasMtFiyat = 250;
        try {
            if (kesimKaydi.kumas_topu_no) {
                const { data: kmData } = await supabase.from('b1_kumas_arsivi')
                    .select('birim_maliyet_tl')
                    .eq('kumas_kodu', kesimKaydi.kumas_topu_no.trim())
                    .single();
                if (kmData && parseFloat(kmData.birim_maliyet_tl) > 0) kumasMtFiyat = parseFloat(kmData.birim_maliyet_tl);
            }
        } catch (e) { }

        const gercekZararTl = kayipKumasMt * kumasMtFiyat;

        await supabase.from('b1_maliyet_kayitlari').insert([{
            order_id: yeniEmir.id,
            maliyet_tipi: 'fire_kaybi',
            kalem_aciklama: `KSM-${kesimKaydi.id} Kesim Firesi (%${fireYuzde.toFixed(1)}) — ${kayipKumasMt.toFixed(1)} MT Kumaş Kaybı`,
            tutar_tl: gercekZararTl > 0 ? gercekZararTl : fireYuzde,
            onay_durumu: 'hesaplandi'
        }]);

        if (fireYuzde > 5) {
            await supabase.from('b1_sistem_uyarilari').insert([{
                baslik: `🚨 Kritik Kesim Firesi (%${fireYuzde.toFixed(1)}) - Model: ${kesimKaydi.b1_model_taslaklari?.model_kodu || 'Bilinmiyor'}`,
                mesaj: `${kesimKaydi.kesilen_net_adet} adetlik kesimde ${kayipKumasMt.toFixed(1)} metre kumaş israf oldu. Beklenmeyen Zarar Tutarı: ₺${gercekZararTl.toFixed(0)}.`,
                onem_derecesi: 'yuksek',
                durum: 'aktif'
            }]);
        }
    }
}

export async function kesimDurumunuGuncelleVeStokDus(id, yeniDurum) {
    const { error } = await supabase.from('b1_kesim_operasyonlari').update({ durum: yeniDurum }).eq('id', id);
    if (error) throw error;

    if (yeniDurum === 'tamamlandi') {
        const { data: kData } = await supabase.from('b1_kesim_operasyonlari').select('kumas_topu_no, kullanilan_kumas_mt').eq('id', id).single();
        if (kData && kData.kumas_topu_no && parseFloat(kData.kullanilan_kumas_mt) > 0) {
            const kumasKodu = kData.kumas_topu_no.trim();
            const dusulecek = parseFloat(kData.kullanilan_kumas_mt);

            const { data: kumas } = await supabase.from('b1_kumas_arsivi').select('id, stok_mt').eq('kumas_kodu', kumasKodu).single();
            if (kumas) {
                const yeniStok = Math.max(0, parseFloat(kumas.stok_mt || 0) - dusulecek);
                await supabase.from('b1_kumas_arsivi').update({ stok_mt: yeniStok }).eq('id', kumas.id);
                return { stokDusuldu: true, kumasKodu, dusulecek, yeniStok };
            }
        }
    }
    return { stokDusuldu: false };
}

export async function kesimSilVeArsivle(id, model_kodu, kullaniciAdi) {
    try {
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b1_kesim_operasyonlari', islem_tipi: 'ARŞİVLEME', kullanici_adi: kullaniciAdi,
            eski_veri: { durum: 'Soft Delete / Arşive alındı.', model_kodu: model_kodu, id: id }
        }]);
    } catch (e) { }

    const { error } = await supabase.from('b1_kesim_operasyonlari').update({ durum: 'iptal' }).eq('id', id);
    if (error) throw error;
}

export function kesimKanaliKur(onChange) {
    return supabase.channel('islem-gercek-zamanli-ai-kesim')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_kesim_operasyonlari' }, onChange)
        .subscribe();
}
