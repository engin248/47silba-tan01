import { NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ============================================================
// SİSTEM HAFIZASI GERİ BİLDİRİMİ — MİZANET
// /api/rapor/sistem-hafizasi
//
// POST → Ar-Ge form gönderilmeden ÖNCE çağrılır.
//        Geçmişte zarar eden model/kumaş kombinasyonu varsa
//        BLOCK sinyali döner ve form engellenir.
// GET  → Zarar kaydı listesi (Yönetim için)
// ============================================================

// HermAI Gerçeklik Freni burada da devrede:
// Eşleşme skoru %60'ın altında kalan benzerlik uyarıya dönüşmez.

function basitBenzerlik(str1, str2) {
    if (!str1 || !str2) return 0;
    const a = str1.toLowerCase().trim();
    const b = str2.toLowerCase().trim();
    if (a === b) return 100;
    // Kelime bazlı eşleşme
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
            return NextResponse.json({ engel: false, mesaj: 'Başlık boş, kontrol atlandı.' });
        }

        // ─ Son 3 yılın zarar eden / reddedilen trendlerini çek
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

        // ─ Benzerlik taraması ──────────────────────────────────
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
                    mesaj: `⚠️ "${r.baslik}" geçmişte reddedildi (%${toplamSkor} benzerlik)`,
                });
            }
        }

        // ─ HermAI Gerçeklik Freni: %90 üstü → TAM ENGEL ──────
        const tamEngel = maxBenzerlik >= 90;
        const uyariEngel = maxBenzerlik >= 60 && maxBenzerlik < 90;

        // ─ Log ───────────────────────────────────────────────
        if (uyarilar.length > 0) {
            await sb.from('b1_agent_loglari').insert([{
                ajan_adi: 'Sistem Hafızası Geri Bildirimi',
                islem_tipi: 'hafiza_kontrol',
                kaynak_tablo: 'b1_arge_trendler',
                sonuc: tamEngel ? 'hata' : 'uyari',
                mesaj: `"${baslik}" için ${uyarilar.length} geçmiş eşleşme. Max benzerlik: %${maxBenzerlik}. Engel: ${tamEngel ? 'EVET' : 'HAYIR'}`,
            }]);
        }

        return NextResponse.json({
            basarili: true,
            engel: tamEngel,
            uyari: uyariEngel,
            benzerlik_skoru: maxBenzerlik,
            uyarılar: uyarilar.slice(0, 5),
            mesaj: tamEngel
                ? `🚫 ENGELLENDI: Bu model/ürün geçmişte %${maxBenzerlik} benzerliğiyle başarısız oldu. Yeniden düşünün.`
                : uyariEngel
                    ? `⚠️ UYARI: Benzer içerik geçmişte sorun yaşadı (%${maxBenzerlik}). Devam edebilirsiniz ama dikkatli olun.`
                    : '✅ Geçmiş hafızada sorun bulunamadı. Devam edin.',
        });

    } catch (e) {
        return NextResponse.json({ error: e.message, engel: false }, { status: 500 });
    }
}

// ─── GET: Zarar eden ürün/model geçmişi listesi ──────────────
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
