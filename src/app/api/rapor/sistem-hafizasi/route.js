export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ============================================================
// SÄ°STEM HAFIZASI GERÄ° BÄ°LDÄ°RÄ°MÄ° â€” THE ORDER / NIZAM
// /api/rapor/sistem-hafizasi
//
// POST â†’ Ar-Ge form gÃ¶nderilmeden Ã–NCE Ã§aÄŸrÄ±lÄ±r.
//        GeÃ§miÅŸte zarar eden model/kumaÅŸ kombinasyonu varsa
//        BLOCK sinyali dÃ¶ner ve form engellenir.
// GET  â†’ Zarar kaydÄ± listesi (YÃ¶netim iÃ§in)
// ============================================================

// HermAI GerÃ§eklik Freni burada da devrede:
// EÅŸleÅŸme skoru %60'Ä±n altÄ±nda kalan benzerlik uyarÄ±ya dÃ¶nÃ¼ÅŸmez.

function basitBenzerlik(str1, str2) {
    if (!str1 || !str2) return 0;
    const a = str1.toLowerCase().trim();
    const b = str2.toLowerCase().trim();
    if (a === b) return 100;
    // Kelime bazlÄ± eÅŸleÅŸme
    const kelimelerA = a.split(/\s+/);
    const kelimelerB = b.split(/\s+/);
    const eslesenler = kelimelerA.filter(k => k.length > 2 && kelimelerB.includes(k));
    return Math.round((eslesenler.length / Math.max(kelimelerA.length, 1)) * 100);
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { baslik, kategori, kumas_turu, hedef_kitle } = body;

        if (!baslik) {
            return NextResponse.json({ engel: false, mesaj: 'BaÅŸlÄ±k boÅŸ, kontrol atlandÄ±.' });
        }

        // â”€ Son 3 yÄ±lÄ±n zarar eden / reddedilen trendlerini Ã§ek
        const ucYilOnce = new Date(Date.now() - 3 * 365 * 86400000).toISOString();

        const { data: reddedilenler } = await sb
            .from('b1_arge_trendler')
            .select('id, baslik, kategori, hedef_kitle, aciklama, created_at')
            .in('durum', ['reddedildi', 'basarisiz', 'zarar'])
            .gte('created_at', ucYilOnce)
            .limit(300);

        const { data: zararKayitlari } = await sb
            .from('b1_maliyet_kayitlari')
            .select('id, model_id, kar_zarar_tutari, notlar, created_at')
            .lt('kar_zarar_tutari', 0)
            .gte('created_at', ucYilOnce)
            .limit(100);

        // â”€ Benzerlik taramasÄ± â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const uyarilar = [];
        let maxBenzerlik = 0;

        for (const r of (reddedilenler || [])) {
            const baslikSkor = basitBenzerlik(baslik, r.baslik);
            const kategoriEsles = kategori && r.kategori === kategori ? 20 : 0;
            const hedefEsles = hedef_kitle && r.hedef_kitle === hedef_kitle ? 15 : 0;

            const toplamSkor = baslikSkor + kategoriEsles + hedefEsles;

            if (toplamSkor >= 60) {
                maxBenzerlik = Math.max(maxBenzerlik, toplamSkor);
                uyarilar.push({
                    kaynak_id: r.id,
                    benzer_baslik: r.baslik,
                    benzerlik_skoru: toplamSkor,
                    gecmis_durum: 'Reddedildi',
                    tarih: r.created_at,
                    mesaj: `âš ï¸ "${r.baslik}" geÃ§miÅŸte reddedildi (%${toplamSkor} benzerlik)`,
                });
            }
        }

        // â”€ HermAI GerÃ§eklik Freni: %90 Ã¼stÃ¼ â†’ TAM ENGEL â”€â”€â”€â”€â”€â”€
        const tamEngel = maxBenzerlik >= 90;
        const uyariEngel = maxBenzerlik >= 60 && maxBenzerlik < 90;

        // â”€ Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (uyarilar.length > 0) {
            await sb.from('b1_agent_loglari').insert([{
                ajan_adi: 'Sistem HafÄ±zasÄ± Geri Bildirimi',
                islem_tipi: 'hafiza_kontrol',
                kaynak_tablo: 'b1_arge_trendler',
                sonuc: tamEngel ? 'hata' : 'uyari',
                mesaj: `"${baslik}" iÃ§in ${uyarilar.length} geÃ§miÅŸ eÅŸleÅŸme. Max benzerlik: %${maxBenzerlik}. Engel: ${tamEngel ? 'EVET' : 'HAYIR'}`,
            }]);
        }

        return NextResponse.json({
            basarili: true,
            engel: tamEngel,
            uyari: uyariEngel,
            benzerlik_skoru: maxBenzerlik,
            uyarÄ±lar: uyarilar.slice(0, 5),
            mesaj: tamEngel
                ? `ğŸš« ENGELLENDI: Bu model/Ã¼rÃ¼n geÃ§miÅŸte %${maxBenzerlik} benzerliÄŸiyle baÅŸarÄ±sÄ±z oldu. Yeniden dÃ¼ÅŸÃ¼nÃ¼n.`
                : uyariEngel
                    ? `âš ï¸ UYARI: Benzer iÃ§erik geÃ§miÅŸte sorun yaÅŸadÄ± (%${maxBenzerlik}). Devam edebilirsiniz ama dikkatli olun.`
                    : 'âœ… GeÃ§miÅŸ hafÄ±zada sorun bulunamadÄ±. Devam edin.',
        });

    } catch (e) {
        return NextResponse.json({ error: e.message, engel: false }, { status: 500 });
    }
}

// â”€â”€â”€ GET: Zarar eden Ã¼rÃ¼n/model geÃ§miÅŸi listesi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function GET(req) {
    try {
        const { data: reddedilenler } = await sb
            .from('b1_arge_trendler')
            .select('id, baslik, kategori, durum, created_at, aciklama')
            .in('durum', ['reddedildi', 'basarisiz', 'zarar'])
            .order('created_at', { ascending: false })
            .limit(50);

        const { data: zararlar } = await sb
            .from('b1_maliyet_kayitlari')
            .select('id, model_id, kar_zarar_tutari, notlar, created_at')
            .lt('kar_zarar_tutari', 0)
            .order('kar_zarar_tutari', { ascending: true })
            .limit(30);

        return NextResponse.json({
            basarili: true,
            reddedilen_trendler: reddedilenler || [],
            zarar_eden_modeller: zararlar || [],
            toplam_kayit: (reddedilenler?.length || 0) + (zararlar?.length || 0),
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
