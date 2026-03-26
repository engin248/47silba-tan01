'use client';
/**
 * features/siparisler/services/siparislerApi.js
 * M10 Siparişler — Supabase Servis Katmanı
 * Hook: useSiparisler.js | Barrel: features/siparisler/index.js
 */
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

// ── Veri Çekme ───────────────────────────────────────────────────────────────
export async function fetchSiparisler() {
    const [sRes, mRes, uRes] = await Promise.allSettled([
        supabase
            .from('b2_siparisler')
            .select('*, b2_musteriler:musteri_id(ad_soyad,musteri_kodu)')
            .order('created_at', { ascending: false })
            .limit(200),
        supabase.from('b2_musteriler').select('id,musteri_kodu,ad_soyad').eq('aktif', true).limit(500),
        supabase.from('b2_urun_katalogu').select('id,urun_kodu,urun_adi,satis_fiyati_tl,stok_adeti').eq('durum', 'aktif').limit(500),
    ]);
    return {
        siparisler: sRes.status === 'fulfilled' ? (sRes.value.data || []) : [],
        musteriler: mRes.status === 'fulfilled' ? (mRes.value.data || []) : [],
        urunler: uRes.status === 'fulfilled' ? (uRes.value.data || []) : [],
    };
}

export async function fetchSiparisDetay(siparisId) {
    const { data, error } = await supabase
        .from('b2_siparis_kalemleri')
        .select('*, b2_urun_katalogu:urun_id(urun_kodu,urun_adi)')
        .eq('siparis_id', siparisId);
    if (error) throw error;
    return data || [];
}

// ── Sipariş Kaydet (API route üzerinden — ZOD + Rate Limit + 409 kontrolü) ──
export async function siparisKaydet(form, kalemler) {
    const toplam = kalemlerToplam(kalemler);
    const payload = {
        siparis: {
            musteri_id: form.musteri_id || null,
            siparis_no: form.siparis_no.trim(),
            kanal: form.kanal,
            toplam_tutar_tl: toplam,
            notlar: form.notlar.trim() || null,
            acil: form.acil || false,
            para_birimi: form.para_birimi || 'TL',
        },
        kalemler: kalemler.map(k => ({
            urun_id: k.urun_id,
            beden: k.beden || null,
            renk: k.renk || null,
            adet: parseInt(k.adet),
            birim_fiyat_tl: parseFloat(k.birim_fiyat_tl),
            iskonto_pct: parseFloat(k.iskonto_pct) || 0,
        })),
    };
    const yanit = await fetch('/api/siparis-ekle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const sonuc = await yanit.json().catch(() => ({}));
    if (yanit.status === 409) throw new Error('⚠️ ' + sonuc.hata);
    if (yanit.status === 429) throw new Error('⏳ Çok fazla istek! Lütfen bekleyin.');
    if (yanit.status === 422) throw new Error('📛 ZOD SİBER KALKANI: Hatalı veri girişi engellendi!');
    if (!yanit.ok) throw new Error(sonuc.hata || 'Sunucu hatası');
    telegramBildirim(`📦 YENİ SİPARİŞ ALINDI!\nSipariş No: ${form.siparis_no}\nTutar: ₺${toplam.toFixed(2)}\nDurum: BEKLEMEDE`);
    return sonuc;
}

// ── Durum Güncelle ─────────────────────────────────────────────────────────────
export async function durumGuncelle(id, durum, ekstraBilgi = {}) {
    // Mükerrer işlem engeli (U Kriteri)
    const { data: mevcut } = await supabase.from('b2_siparisler').select('durum, siparis_no, toplam_tutar_tl, musteri_id, kanal, notlar').eq('id', id).single();
    if (mevcut?.durum === durum) throw new Error(`Sipariş zaten "${durum}" durumunda — mükerrer engellendi.`);

    const { error } = await supabase.from('b2_siparisler').update({ durum, ...ekstraBilgi }).eq('id', id);
    if (error) throw error;

    // ── [SI-02] ONAY → OTOMATİK ÜRETİM EMRİ ────────────────────────────────
    if (durum === 'onaylandi') {
        try {
            const { data: kalemler } = await supabase
                .from('b2_siparis_kalemleri')
                .select('urun_id, adet, beden, renk, b2_urun_katalogu:urun_id(urun_kodu, urun_adi)')
                .eq('siparis_id', id);

            if (kalemler && kalemler.length > 0) {
                const uretimEmirleri = kalemler.map(k => {
                    const urun = Array.isArray(k.b2_urun_katalogu) ? k.b2_urun_katalogu[0] : k.b2_urun_katalogu;
                    return {
                        siparis_id: id,
                        siparis_no: mevcut?.siparis_no,
                        urun_id: k.urun_id,
                        urun_kodu: urun?.urun_kodu || null,
                        urun_adi: urun?.urun_adi || null,
                        miktar: k.adet,
                        beden: k.beden || null,
                        renk: k.renk || null,
                        status: 'pending',
                        oncelik: 'normal',
                        aciklama: `[OTONOM] Sipariş onayından otomatik oluşturuldu — Kanal: ${mevcut?.kanal || 'bilinmiyor'}`,
                        created_at: new Date().toISOString(),
                    };
                });

                const { error: uretimErr } = await supabase.from('production_orders').insert(uretimEmirleri);

                if (!uretimErr) {
                    await supabase.from('b0_sistem_loglari').insert([{
                        tablo_adi: 'production_orders', islem_tipi: 'OTOMATIK_URETIM_EMRI',
                        kullanici_adi: 'SİSTEM (DELTA AJAN)',
                        eski_veri: { siparis_no: mevcut?.siparis_no, kalem_sayisi: kalemler.length }
                    }]);
                    telegramBildirim(`✅ SİPARİŞ ONAYLANDI \nSipariş No: ${mevcut?.siparis_no}\n${kalemler.length} kalem → ÜRETİM EMRİ oluşturuldu.`);
                } else {
                    console.error('[SI-02] Üretim emri hatası:', uretimErr);
                }
            }
        } catch (uretimHata) {
            console.error('[SI-02] Otomatik üretim emri exception:', uretimHata);
        }
    }

    if (durum === 'teslim') {
        await stokDus(id);

        // 🚨 VERİ BÜTÜNLÜĞÜ UZMANI: Sipariş ve Kasa Modülü Otomasyonu (Satış Tahsilatı)
        try {
            if (mevcut && mevcut.toplam_tutar_tl > 0) {
                const kasaPayload = {
                    hareket_tipi: 'tahsilat',
                    odeme_yontemi: 'nakit',
                    tutar_tl: mevcut.toplam_tutar_tl,
                    vade_tarihi: null,
                    aciklama: `[OTONOM] Sipariş Tahsilatı (Kanal: Sipariş API) - Sipariş No: ${mevcut.siparis_no || id}`,
                    musteri_id: null,
                    onay_durumu: 'onaylandi' // Otonom olduğu için direkt onaylanabilir
                };

                if (!navigator.onLine) {
                    await cevrimeKuyrugaAl('b2_kasa_hareketleri', 'INSERT', kasaPayload);
                } else {
                    await supabase.from('b2_kasa_hareketleri').insert([kasaPayload]);
                }

                // Otonom Sistem Logu
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b2_kasa_hareketleri', islem_tipi: 'OTOMATIK_KASA_GIRIS',
                    kullanici_adi: 'SİSTEM (GAMMA AJAN)',
                    eski_veri: { siparis_no: mevcut.siparis_no, tutar_tl: mevcut.toplam_tutar_tl }
                }]);
            }
        } catch (kasaErr) {
            console.error("Otomatik kasa kaydı atılırken hata oluştu (Sessiz Fallback):", kasaErr);
        }

        telegramBildirim(`🎉 SİPARİŞ TESLİM EDİLDİ!\nSipariş ID: ${mevcut?.siparis_no || id}\nStok çıkışı ve Finansal gelir tahakkuku yapıldı.`);
    } else if (durum === 'kargoda') {
        telegramBildirim(`🚚 SİPARİŞ KARGOYA VERİLDİ!\nSipariş ID: ${id}\nTakip: ${ekstraBilgi.kargo_takip_no || 'Belirtilmedi'}`);
    }
}

// ── Stoktan Düş (Teslim sonrası) ─────────────────────────────────────────────
async function stokDus(siparisId) {
    const { data: kalemler, error } = await supabase
        .from('b2_siparis_kalemleri').select('urun_id,adet').eq('siparis_id', siparisId);
    if (error) throw error;
    for (const k of (kalemler || [])) {
        await supabase.from('b2_stok_hareketleri').insert([{
            urun_id: k.urun_id, hareket_tipi: 'cikis', adet: k.adet,
            aciklama: `Sipariş teslimi (ID: ${siparisId})`,
        }]);
        const { data: urun } = await supabase
            .from('b2_urun_katalogu').select('urun_adi,urun_kodu,stok_adeti,min_stok').eq('id', k.urun_id).single();
        if (urun) {
            const yeniStok = Math.max(0, (urun.stok_adeti || 0) - k.adet);
            await supabase.from('b2_urun_katalogu').update({ stok_adeti: yeniStok }).eq('id', k.urun_id);
            if (yeniStok <= (urun.min_stok || 10)) {
                telegramBildirim(`🚨 KRİTİK STOK!\nÜrün: ${urun.urun_kodu} | ${urun.urun_adi}\nKalan: ${yeniStok} adet\nAcil üretim veya tedarik!`);
            }
        }
    }
}

// ── Sipariş Sil ───────────────────────────────────────────────────────────────
export async function siparisSil(id, siparisler) {
    const anaSiparis = siparisler.find(s => s.id === id);
    if (anaSiparis?.durum !== 'beklemede' && anaSiparis?.durum !== 'iptal') {
        throw new Error('🔒 DİJİTAL ADALET KİLİDİ: Onaylanmış sipariş silinemez!');
    }
    await supabase.from('b2_siparis_kalemleri').delete().eq('siparis_id', id);
    // Kara kutu logu (Kriter 25)
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b2_siparisler', islem_tipi: 'SILME',
        kullanici_adi: 'Yetkilendirilmiş Kullanıcı',
        eski_veri: { id, durum: anaSiparis?.durum },
    }]);
    const { error } = await supabase.from('b2_siparisler').delete().eq('id', id);
    if (error) throw error;
}

// ── Yardımcılar ───────────────────────────────────────────────────────────────
export function siparisNoUret() {
    return `SIP-${Date.now().toString().slice(-8)}`;
}

export function kalemlerToplam(kalemler) {
    return kalemler.reduce((s, k) =>
        s + (parseInt(k.adet) || 0) * parseFloat(k.birim_fiyat_tl || 0) * (1 - (parseFloat(k.iskonto_pct) || 0) / 100), 0);
}

// ── Sabitler ──────────────────────────────────────────────────────────────────
export const KANALLAR = ['trendyol', 'amazon', 'magaza', 'toptan', 'diger'];
export const DURUMLAR = ['beklemede', 'onaylandi', 'hazirlaniyor', 'kargoda', 'teslim', 'iptal', 'iade'];
export const DURUM_RENK = { beklemede: '#f59e0b', onaylandi: '#3b82f6', hazirlaniyor: '#8b5cf6', kargoda: '#f97316', teslim: '#10b981', iptal: '#ef4444', iade: '#64748b' };
export const DURUM_LABEL = { beklemede: '⏳ Beklemede', onaylandi: '✅ Onaylandı', hazirlaniyor: '⚙️ Hazırlanıyor', kargoda: '🚛 Kargoda', teslim: '🎉 Teslim', iptal: '❌ İptal', iade: '↩️ İade' };
export const PARA_BIRIMLERI = [{ kod: 'TL', simge: '₺', bayrak: '🇹🇷' }, { kod: 'USD', simge: '$', bayrak: '🇺🇸' }, { kod: 'EUR', simge: '€', bayrak: '🇪🇺' }];
export const BOSH_FORM = { musteri_id: '', siparis_no: '', kanal: 'magaza', notlar: '', acil: false, para_birimi: 'TL' };
