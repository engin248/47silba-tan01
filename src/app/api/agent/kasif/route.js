export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';

/**
 * /api/agent/kasif
 * THE ORDER / NÄ°ZAM â€” KAÅÄ°F AJAN (DÄ±ÅŸ GÃ¶zlemci)
 *
 * GÃ¶rev: Verilen Ã¼rÃ¼n iÃ§in internet araÅŸtÄ±rmasÄ± yapar (Perplexity Sonar),
 * ardÄ±ndan Gemini ile "Bu Ã¼rÃ¼n neden satar / satmaz?" karar desteÄŸi Ã¼retir.
 * Hermes V2 mimarisi Ã¼zerine karar kalibrasyonu katmanÄ± olarak Ã§alÄ±ÅŸÄ±r.
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
        if (!geminiKey) return NextResponse.json({ error: 'GEMINI API AnahtarÄ± (.env) bulunamadÄ±!' }, { status: 500 });
        const GEMINI_API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

        if (!urunAdi) {
            return NextResponse.json({ error: 'urunAdi zorunlu' }, { status: 400 });
        }

        // â”€â”€ AÅAMA 1: PERPLEXITY SONAR â€” Piyasa AraÅŸtÄ±rmasÄ± â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const perplexityPrompt = `
Tekstil ve hazÄ±r giyim sektÃ¶rÃ¼ iÃ§in piyasa araÅŸtÄ±rmasÄ± yap.

ÃœrÃ¼n: ${urunAdi}
KumaÅŸ: ${kumasCinsi || 'belirtilmemiÅŸ'}
Hedef Kitle: ${hedefKitle || 'genel'}
Sezon: ${sezon || 'genel'}

Åu sorularÄ± yanÄ±tla (TÃ¼rkÃ§e):
1. Bu Ã¼rÃ¼n ÅŸu an TÃ¼rkiye ve Avrupa pazarÄ±nda trend mi? (Evet/HayÄ±r + kÄ±sa aÃ§Ä±klama)
2. Amazon, Zara, Trendyol gibi platformlarda bu Ã¼rÃ¼nÃ¼n talebi nasÄ±l? (YÃ¼ksek/Orta/DÃ¼ÅŸÃ¼k)
3. Rakip fiyat aralÄ±ÄŸÄ± nedir? (TL ve EUR olarak tahmini)
4. Bu Ã¼rÃ¼n iÃ§in en bÃ¼yÃ¼k 2 risk nedir?
5. Bu Ã¼rÃ¼n iÃ§in en bÃ¼yÃ¼k 2 fÄ±rsat nedir?

KÄ±sa ve veri odaklÄ± yanÄ±t ver. Kaynak belirt.
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
                            content: 'Sen tekstil sektÃ¶rÃ¼ iÃ§in piyasa araÅŸtÄ±rmasÄ± yapan bir uzman analistin. TÃ¼rkÃ§e yanÄ±t ver. KÄ±sa, net ve veri odaklÄ± ol.'
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
            // Perplexity baÅŸarÄ±sÄ±z â†’ Gemini tek baÅŸÄ±na Ã§alÄ±ÅŸÄ±r
            piyasaVeri = null;
        }

        // â”€â”€ AÅAMA 2: GEMÄ°NÄ° â€” "Satar mÄ±?" Karar DesteÄŸi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const geminiPrompt = `
Sen THE ORDER / NÄ°ZAM sisteminin KAÅÄ°F ajanÄ±sÄ±n. Tekstil fabrikasÄ± (Fason ve Ä°Ã§ Ãœretim kapasitesine sahip) iÃ§in Ã¼rÃ¼n kÃ¢rlÄ±lÄ±k kararÄ± veriyorsun.

DÄ°L VE ÃœSLUP KURALI (KESÄ°N TALÄ°MAT):
Asla sÃ¼bjektif, coÅŸkulu, abartÄ±lÄ± veya satÄ±cÄ± aÄŸzÄ±yla ("mÃ¼thiÅŸ satÄ±yor", "uÃ§uyor", "hemen Ã¼retmeliyiz", "harika fÄ±rsat") YAZMAYACAKSIN. Tamamen soÄŸukkanlÄ±, net, metrik (sayÄ±sal) ve analitik bir dil kullan. RaporlamalarÄ±nÄ± yÃ¼zdelik deÄŸiÅŸimler, TL cinsinden fiyat bantlarÄ± ve Ã¶lÃ§Ã¼lebilir istatistikler Ã¼zerine kur. Ã–lÃ§Ã¼lemeyen hiÃ§bir yorum yapma.

== ÃœRÃœN BÄ°LGÄ°SÄ° ==
ÃœrÃ¼n AdÄ±: ${urunAdi}
KumaÅŸ: ${kumasCinsi || 'belirtilmemiÅŸ'}
Hedef Kitle: ${hedefKitle || 'genel'}
Sezon: ${sezon || 'genel'}
Hermes AI Trend Skoru: ${hermesSkoru || 'bilinmiyor'}/100

== PIYASA ARAÅTIRMASI (Perplexity Sonar / Hermes Verisi) ==
${piyasaVeri || 'Piyasa verisi alÄ±namadÄ± â€” kendi analitik veri havuzunla deÄŸerlendirme yap.'}

== GÃ–REV ==
YukarÄ±daki pazar verilerine ve 119 Kriterlik Ã¼retim/kÃ¢rlÄ±lÄ±k filtrelerimize dayanarak SADECE ÅŸu JSON formatÄ±nda yanÄ±t ver (baÅŸka hiÃ§bir ÅŸey yazma):

{
  "satarMi": true/false,
  "kararGuven": "1-10 arasÄ± tam sayÄ± (Veri kalitesine gÃ¶re)",
  "piyasaOzeti": "Tamamen metrik olan, 2 cÃ¼mlelik veri Ã¶zeti (Ã–rn: Pazar doygunluÄŸa ulaÅŸmÄ±ÅŸ, rekabet yÃ¼ksek, kar marjÄ± tahmini %12)",
  "gucluYonler": ["Operasyonel gÃ¼Ã§lÃ¼ yÃ¶n 1 (Ã–rn: Fason imalata uygun)", "Metrik gÃ¼Ã§lÃ¼ yÃ¶n 2"],
  "zayifYonler": ["Operasyonel zayÄ±f yÃ¶n 1 (Ã–rn: YÃ¼ksek metraj firesi)", "Risk 2"],
  "tavsiye": "YÃ¶neticiye tamamen finansal/operasyonel tavsiye (Ã–rn: Ãœretim marjÄ± %20'nin altÄ±nda kalacaÄŸÄ± iÃ§in reddedildi)",
  "fiyatAraligi": { "min": "Rakam", "max": "Rakam" },
  "benzerUrunler": ["AynÄ± segment Ã¼rÃ¼n 1", "AynÄ± segment Ã¼rÃ¼n 2"]
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
            return NextResponse.json({ error: 'Gemini API baÄŸlantÄ± hatasÄ± (' + geminiRes.status + ')', mesaj: errText }, { status: 502 });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        let kararJSON = {};
        try {
            // JSON temizle ve parse et
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            kararJSON = JSON.parse(cleaned);
        } catch {
            kararJSON = { satarMi: null, tavsiye: rawText, piyasaOzeti: 'JSON parse hatasÄ±' };
        }

        // â”€â”€ SONUÃ‡ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            error: 'KaÅŸif Ajan hatasÄ±',
            mesaj: err.message,
        }, { status: 500 });
    }
}
