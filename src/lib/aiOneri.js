/**
 * lib/aiOneri.js — KN-7: AI Öneri Motoru (Yerel, API gerektirmez)
 *
 * Mevcut Supabase verilerinden pattern çıkararak öneri üretir:
 *   - En çok satan ürün segmenti
 *   - Kritik stok önceliği
 *   - Trend + sipariş korelasyonu
 *   - Prim hakkı doğan personel
 *   - Düşük performanslı model önerileri
 */
import { supabase } from './supabase';

export async function aiOneriUret() {
    const [sipRes, stokRes, trendRes, personelRes] = await Promise.allSettled([
        supabase.from('b2_siparisler').select('kanal,toplam_tutar_tl,created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('b2_urun_katalogu').select('urun_kodu,urun_adi,stok_adeti,min_stok,satis_fiyati_tl').limit(200),
        supabase.from('b1_arge_trendler').select('baslik,platform,talep_skoru,durum').eq('durum', 'onaylandi').limit(20),
        supabase.from('b1_personel').select('ad_soyad,rol,saatlik_ucret_tl,gunluk_calisma_dk').eq('durum', 'aktif').limit(50),
    ]);

    const siparisler = sipRes.status === 'fulfilled' ? sipRes.value.data || [] : [];
    const stoklar = stokRes.status === 'fulfilled' ? stokRes.value.data || [] : [];
    const trendler = trendRes.status === 'fulfilled' ? trendRes.value.data || [] : [];
    const personeller = personelRes.status === 'fulfilled' ? personelRes.value.data || [] : [];

    const oneriler = [];

    // 1. Kanal Analizi — Hangi kanal en çok gelir?
    const kanalToplam = {};
    siparisler.forEach(s => { kanalToplam[s.kanal] = (kanalToplam[s.kanal] || 0) + parseFloat(s.toplam_tutar_tl || 0); });
    const enIyiKanal = Object.entries(kanalToplam).sort((a, b) => b[1] - a[1])[0];
    if (enIyiKanal) {
        oneriler.push({ tip: 'kanal', oncelik: 'yuksek', mesaj: `📊 En kârlı kanal: ${enIyiKanal[0].toUpperCase()} (₺${enIyiKanal[1].toLocaleString('tr-TR')}). Bu kanala odaklanın.` });
    }

    // 2. Kritik Stok Önceliği
    const kritikler = stoklar.filter(s => (s.stok_adeti || 0) <= (s.min_stok || 10) * 1.2);
    if (kritikler.length > 0) {
        oneriler.push({ tip: 'stok', oncelik: 'acil', mesaj: `🚨 ${kritikler.length} ürün kritik stokta. Öncelik: ${kritikler.slice(0, 3).map(k => k.urun_kodu).join(', ')}` });
    }

    // 3. Trend Fırsatı — Onaylı ama henüz üretilmeyen trendler
    const trenFirsat = trendler.filter(t => t.talep_skoru >= 8);
    if (trenFirsat.length > 0) {
        oneriler.push({ tip: 'trend', oncelik: 'normal', mesaj: `💡 ${trenFirsat.length} yüksek puanlı trend üretimde değil: ${trenFirsat.slice(0, 2).map(t => t.baslik).join(', ')}` });
    }

    // 4. Prim Hakkı Analizi
    const DAKIKA_BASI = 2.50;
    const PRIM_ORANI = 0.15;
    const primAdaylar = personeller.filter(p => {
        const gunluk = parseFloat(p.saatlik_ucret_tl || 0) * (parseInt(p.gunluk_calisma_dk || 480) / 60);
        const aylik = gunluk * 22;
        const uretim = parseInt(p.gunluk_calisma_dk || 480) * 22 * DAKIKA_BASI;
        return uretim > aylik;
    });
    if (primAdaylar.length > 0) {
        oneriler.push({ tip: 'prim', oncelik: 'normal', mesaj: `💰 ${primAdaylar.length} personel prim hakkı kazanıyor. Kasa çıkışı planlanmalı.` });
    }

    // 5. Son 7 gün sipariş trendi
    const yediGunOnce = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sonSiparisler = siparisler.filter(s => s.created_at >= yediGunOnce);
    if (sonSiparisler.length === 0 && siparisler.length > 0) {
        oneriler.push({ tip: 'satis', oncelik: 'yuksek', mesaj: '⚠️ Son 7 günde yeni sipariş yok. Satış kanallarını kontrol edin!' });
    } else if (sonSiparisler.length >= 5) {
        oneriler.push({ tip: 'satis', oncelik: 'dusuk', mesaj: `✅ Son 7 günde ${sonSiparisler.length} sipariş. Sistem aktif.` });
    }

    return oneriler;
}
