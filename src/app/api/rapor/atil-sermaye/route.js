import { NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ============================================================
// ATİL SERMAYE UYANDIRICI — THE ORDER / NIZAM
// /api/rapor/atil-sermaye
//
// GET  → 180+ gün hareketsiz kumaş ve stok tespiti
// POST → Aksiyona bağla (fiyat indir, sat öner, iade et)
// ============================================================

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const esikGun = parseInt(url.searchParams.get('esik_gun') || '180');
        const esikTarih = new Date(Date.now() - esikGun * 86400000).toISOString();

        // ─ Hareketsiz kumaşlar ────────────────────────────────
        const { data: atilKumaslar } = await sb
            .from('b1_kumas_arsivi') // [K2 FIX] Hayalet tablo adı düzeltildi (sonda 'i' eksikti)
            .select('id, kumas_adi, renk, desen, miktar, birim, birim_fiyat, tedarikci, updated_at, created_at, durum, notlar')
            .lt('updated_at', esikTarih)
            .neq('durum', 'tukendi')
            .neq('durum', 'iade')
            .limit(200);

        // ─ Hareketsiz stok ürünleri ───────────────────────────
        const { data: atilStok } = await sb
            .from('b2_urun_katalogu')
            .select('id, urun_adi, stok_adedi, satis_fiyati, kategori, updated_at')
            .lt('updated_at', esikTarih)
            .gt('stok_adedi', 0)
            .limit(100);

        // ─ Değer hesabı ──────────────────────────────────────
        const kumasRaporlari = (atilKumaslar || []).map(k => {
            const esik = new Date(esikTarih).getTime();
            const guncelleme = new Date(k.updated_at).getTime();
            const hareketsiz_gun = Math.round((Date.now() - guncelleme) / 86400000);
            const sermaye_degeri = parseFloat(((k.miktar || 0) * (k.birim_fiyat || 0)).toFixed(2));

            return {
                id: k.id,
                tip: 'kumas',
                isim: `${k.kumas_adi} (${k.renk || '?'})`,
                miktar: k.miktar,
                birim: k.birim,
                birim_fiyat: k.birim_fiyat,
                sermaye_degeri,
                hareketsiz_gun,
                tedarikci: k.tedarikci,
                oneri: hareketsiz_gun > 365 ? '🚨 İade veya imha planla' :
                    hareketsiz_gun > 270 ? '⚠️ Fiyat indirerek sat' : '💡 Yakın modele dahil et',
            };
        });

        const stokRaporlari = (atilStok || []).map(s => {
            const hareketsiz_gun = Math.round((Date.now() - new Date(s.updated_at).getTime()) / 86400000);
            const sermaye_degeri = parseFloat(((s.stok_adedi || 0) * (s.satis_fiyati || 0)).toFixed(2));
            return {
                id: s.id,
                tip: 'stok',
                isim: s.urun_adi,
                miktar: s.stok_adedi,
                birim: 'adet',
                birim_fiyat: s.satis_fiyati,
                sermaye_degeri,
                hareketsiz_gun,
                oneri: hareketsiz_gun > 365 ? '🚨 Tasfiye et' : hareketsiz_gun > 270 ? '⚠️ İndirimli sat' : '💡 Kampanyaya dahil et',
            };
        });

        const tumAtillar = [...kumasRaporlari, ...stokRaporlari]
            .sort((a, b) => b.sermaye_degeri - a.sermaye_degeri);

        const yapiliBagliSermaye = tumAtillar.reduce((s, a) => s + (a.sermaye_degeri || 0), 0);
        const kritikler = tumAtillar.filter(a => a.hareketsiz_gun > 365);

        // ─ Log ───────────────────────────────────────────────
        if (kritikler.length > 0) {
            await sb.from('b1_agent_loglari').insert([{
                ajan_adi: 'Atıl Sermaye Uyandırıcısı',
                islem_tipi: 'atil_sermaye_tarama',
                kaynak_tablo: 'b1_kumas_arsivi + b2_urun_katalogu', // [K2 FIX]
                sonuc: 'uyari',
                mesaj: `${tumAtillar.length} hareketsiz kayıt tespit edildi. Bağlı sermaye: ${yapiliBagliSermaye.toLocaleString('tr-TR')} TL. ${kritikler.length} kritik (365+ gün).`,
            }]);

            await sb.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'atil_sermaye',
                seviye: 'uyari',
                baslik: `💤 ${kritikler.length} kalemde atıl sermaye (1 yılı aşkın)`,
                mesaj: `Tahmini bağlı sermaye: ${yapiliBagliSermaye.toLocaleString('tr-TR')} TL`,
                kaynak_tablo: 'b1_kumas_arsivi', // [K2 FIX]
                durum: 'aktif',
            }]);
        }

        return NextResponse.json({
            basarili: true,
            ozet: {
                toplam_atil_kayit: tumAtillar.length,
                atil_kumas_sayisi: kumasRaporlari.length,
                atil_stok_sayisi: stokRaporlari.length,
                tahmini_bagli_sermaye_tl: yapiliBagliSermaye,
                kritik_kayit: kritikler.length,
                esik_gun: esikGun,
            },
            atil_listesi: tumAtillar.slice(0, 50),
            tarih: new Date().toISOString(),
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
