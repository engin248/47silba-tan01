import { NextResponse } from 'next/server';

/**
 * /api/agent/kasif
 * THE ORDER / NİZAM — KAŞİF AJAN (Dış Gözlemci)
 *
 * Görev: Verilen ürün için internet araştırması yapar (Perplexity Sonar),
 * ardından Gemini ile "Bu ürün neden satar / satmaz?" karar desteği üretir.
 * Hermes V2 mimarisi üzerine karar kalibrasyonu katmanı olarak çalışır.
 *
 * Input:  { urunAdi, kumasCinsi, hedefKitle, sezon, hermesSkoru }
 * Output: { piyasaOzeti, satarMi, gucluYonler, zayifYonler, tavsiye, kaynaklar }
 */

const PERPLEXITY_API = 'https://api.perplexity.ai/chat/completions';

export async function POST(req) {
    try {
        const body = await req.json();
        const { urunAdi, kumasCinsi, hedefKitle, sezon, hermesSkoru } = body;

        const geminiKey = process.env.GEMINI_API_KEY?.trim();
        if (!geminiKey) return NextResponse.json({ error: 'GEMINI API Anahtarı (.env) bulunamadı!' }, { status: 500 });
        const GEMINI_API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

        if (!urunAdi) {
            return NextResponse.json({ error: 'urunAdi zorunlu' }, { status: 400 });
        }

        // ── AŞAMA 1: PERPLEXITY SONAR — Piyasa Araştırması ──────────
        const perplexityPrompt = `
Tekstil ve hazır giyim sektörü için piyasa araştırması yap.

Ürün: ${urunAdi}
Kumaş: ${kumasCinsi || 'belirtilmemiş'}
Hedef Kitle: ${hedefKitle || 'genel'}
Sezon: ${sezon || 'genel'}

Şu soruları yanıtla (Türkçe):
1. Bu ürün şu an Türkiye ve Avrupa pazarında trend mi? (Evet/Hayır + kısa açıklama)
2. Amazon, Zara, Trendyol gibi platformlarda bu ürünün talebi nasıl? (Yüksek/Orta/Düşük)
3. Rakip fiyat aralığı nedir? (TL ve EUR olarak tahmini)
4. Bu ürün için en büyük 2 risk nedir?
5. Bu ürün için en büyük 2 fırsat nedir?

Kısa ve veri odaklı yanıt ver. Kaynak belirt.
`.trim();

        let piyasaVeri = null;
        let kaynaklar = [];

        try {
            const perplexityRes = await fetch(PERPLEXITY_API, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'sonar',
                    messages: [
                        {
                            role: 'system',
                            content: 'Sen tekstil sektörü için piyasa araştırması yapan bir uzman analistin. Türkçe yanıt ver. Kısa, net ve veri odaklı ol.'
                        },
                        { role: 'user', content: perplexityPrompt }
                    ],
                    max_tokens: 800,
                    temperature: 0.2,
                    return_citations: true,
                }),
                signal: AbortSignal.timeout(15000),
            });

            if (perplexityRes.ok) {
                const perplexityData = await perplexityRes.json();
                piyasaVeri = perplexityData.choices?.[0]?.message?.content || null;
                kaynaklar = perplexityData.citations || [];
            }
        } catch (perplexityErr) {
            // Perplexity başarısız → Gemini tek başına çalışır
            piyasaVeri = null;
        }

        // ── AŞAMA 2: GEMİNİ — "Satar mı?" Karar Desteği ───────────
        const geminiPrompt = `
Sen THE ORDER / NİZAM sisteminin KAŞİF ajanısın. Tekstil fabrikası (Fason ve İç Üretim kapasitesine sahip) için ürün kârlılık kararı veriyorsun.

DİL VE ÜSLUP KURALI (KESİN TALİMAT):
Asla sübjektif, coşkulu, abartılı veya satıcı ağzıyla ("müthiş satıyor", "uçuyor", "hemen üretmeliyiz", "harika fırsat") YAZMAYACAKSIN. Tamamen soğukkanlı, net, metrik (sayısal) ve analitik bir dil kullan. Raporlamalarını yüzdelik değişimler, TL cinsinden fiyat bantları ve ölçülebilir istatistikler üzerine kur. Ölçülemeyen hiçbir yorum yapma.

== ÜRÜN BİLGİSİ ==
Ürün Adı: ${urunAdi}
Kumaş: ${kumasCinsi || 'belirtilmemiş'}
Hedef Kitle: ${hedefKitle || 'genel'}
Sezon: ${sezon || 'genel'}
Hermes AI Trend Skoru: ${hermesSkoru || 'bilinmiyor'}/100

== PIYASA ARAŞTIRMASI (Perplexity Sonar / Hermes Verisi) ==
${piyasaVeri || 'Piyasa verisi alınamadı — kendi analitik veri havuzunla değerlendirme yap.'}

== GÖREV ==
Yukarıdaki pazar verilerine ve 119 Kriterlik üretim/kârlılık filtrelerimize dayanarak SADECE şu JSON formatında yanıt ver (başka hiçbir şey yazma):

{
  "satarMi": true/false,
  "kararGuven": "1-10 arası tam sayı (Veri kalitesine göre)",
  "piyasaOzeti": "Tamamen metrik olan, 2 cümlelik veri özeti (Örn: Pazar doygunluğa ulaşmış, rekabet yüksek, kar marjı tahmini %12)",
  "gucluYonler": ["Operasyonel güçlü yön 1 (Örn: Fason imalata uygun)", "Metrik güçlü yön 2"],
  "zayifYonler": ["Operasyonel zayıf yön 1 (Örn: Yüksek metraj firesi)", "Risk 2"],
  "tavsiye": "Yöneticiye tamamen finansal/operasyonel tavsiye (Örn: Üretim marjı %20'nin altında kalacağı için reddedildi)",
  "fiyatAraligi": { "min": "Rakam", "max": "Rakam" },
  "benzerUrunler": ["Aynı segment ürün 1", "Aynı segment ürün 2"]
}
`.trim();

        const geminiRes = await fetch(GEMINI_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: geminiPrompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 600,
                    responseMimeType: 'application/json',
                },
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            return NextResponse.json({ error: 'Gemini API bağlantı hatası (' + geminiRes.status + ')', mesaj: errText }, { status: 502 });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        let kararJSON = {};
        try {
            // JSON temizle ve parse et
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            kararJSON = JSON.parse(cleaned);
        } catch {
            kararJSON = { satarMi: null, tavsiye: rawText, piyasaOzeti: 'JSON parse hatası' };
        }

        // ── SONUÇ ──────────────────────────────────────────────────
        return NextResponse.json({
            ajan: 'kasif',
            urun: urunAdi,
            ...kararJSON,
            piyasaArastirmasi: piyasaVeri,
            kaynaklar: kaynaklar.slice(0, 5),
            timestamp: new Date().toISOString(),
        });

    } catch (err) {
        return NextResponse.json({
            error: 'Kaşif Ajan hatası',
            mesaj: err.message,
        }, { status: 500 });
    }
}
