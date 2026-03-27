import { NextResponse } from 'next/server';

/**
 * /api/agent/kasif
 * THE ORDER / NİZAM — KAŞİF AJAN (Dış Gzlemci)
 *
 * Grev: Verilen rn iin internet araştırması yapar (Perplexity Sonar),
 * ardından Gemini ile "Bu rn neden satar / satmaz?" karar desteği retir.
 * Hermes V2 mimarisi zerine karar kalibrasyonu katmanı olarak alışır.
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

        //  AŞAMA 1: PERPLEXITY SONAR — Piyasa Araştırması 
        const perplexityPrompt = `
Tekstil ve hazır giyim sektr iin piyasa araştırması yap.

rn: ${urunAdi}
Kumaş: ${kumasCinsi || 'belirtilmemiş'}
Hedef Kitle: ${hedefKitle || 'genel'}
Sezon: ${sezon || 'genel'}

Şu soruları yanıtla (Trke):
1. Bu rn şu an Trkiye ve Avrupa pazarında trend mi? (Evet/Hayır + kısa aıklama)
2. Amazon, Zara, Trendyol gibi platformlarda bu rnn talebi nasıl? (Yksek/Orta/Dşk)
3. Rakip fiyat aralığı nedir? (TL ve EUR olarak tahmini)
4. Bu rn iin en byk 2 risk nedir?
5. Bu rn iin en byk 2 fırsat nedir?

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
                            content: 'Sen tekstil sektr iin piyasa araştırması yapan bir uzman analistin. Trke yanıt ver. Kısa, net ve veri odaklı ol.'
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
            // Perplexity başarısız → Gemini tek başına alışır
            piyasaVeri = null;
        }

        //  AŞAMA 2: GEMİNİ — "Satar mı?" Karar Desteği 
        const geminiPrompt = `
Sen THE ORDER / NİZAM sisteminin KAŞİF ajanısın. Tekstil fabrikası (Fason ve İ retim kapasitesine sahip) iin rn krlılık kararı veriyorsun.

DİL VE SLUP KURALI (KESİN TALİMAT):
Asla sbjektif, coşkulu, abartılı veya satıcı ağzıyla ("mthiş satıyor", "uuyor", "hemen retmeliyiz", "harika fırsat") YAZMAYACAKSIN. Tamamen soğukkanlı, net, metrik (sayısal) ve analitik bir dil kullan. Raporlamalarını yzdelik değişimler, TL cinsinden fiyat bantları ve llebilir istatistikler zerine kur. llemeyen hibir yorum yapma.

== RN BİLGİSİ ==
rn Adı: ${urunAdi}
Kumaş: ${kumasCinsi || 'belirtilmemiş'}
Hedef Kitle: ${hedefKitle || 'genel'}
Sezon: ${sezon || 'genel'}
Hermes AI Trend Skoru: ${hermesSkoru || 'bilinmiyor'}/100

== PIYASA ARAŞTIRMASI (Perplexity Sonar / Hermes Verisi) ==
${piyasaVeri || 'Piyasa verisi alınamadı — kendi analitik veri havuzunla değerlendirme yap.'}

== GREV ==
Yukarıdaki pazar verilerine ve 119 Kriterlik retim/krlılık filtrelerimize dayanarak SADECE şu JSON formatında yanıt ver (başka hibir şey yazma):

{
  "satarMi": true/false,
  "kararGuven": "1-10 arası tam sayı (Veri kalitesine gre)",
  "piyasaOzeti": "Tamamen metrik olan, 2 cmlelik veri zeti (rn: Pazar doygunluğa ulaşmış, rekabet yksek, kar marjı tahmini %12)",
  "gucluYonler": ["Operasyonel gl yn 1 (rn: Fason imalata uygun)", "Metrik gl yn 2"],
  "zayifYonler": ["Operasyonel zayıf yn 1 (rn: Yksek metraj firesi)", "Risk 2"],
  "tavsiye": "Yneticiye tamamen finansal/operasyonel tavsiye (rn: retim marjı %20'nin altında kalacağı iin reddedildi)",
  "fiyatAraligi": { "min": "Rakam", "max": "Rakam" },
  "benzerUrunler": ["Aynı segment rn 1", "Aynı segment rn 2"]
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

        //  SONU 
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
