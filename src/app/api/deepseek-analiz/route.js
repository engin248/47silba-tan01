export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';

/**
 * /api/deepseek-analiz
 * DeepSeek V3 â€” DÃ¼ÅŸÃ¼k Maliyetli ÃœrÃ¼n Analiz Servisi
 *
 * GÃ¶rev: Gemini'ye alternatif, daha ucuz Ã¼rÃ¼n analizi.
 *        Tekstil/moda sektÃ¶rÃ¼ iÃ§in Ã¼retim kararÄ±, maliyet tahmini,
 *        rekabet analizi ve pazar yorum Ã¼retir.
 *
 * Input:  POST { urunAdi, kategori?, fiyat?, notlar? }
 * Output: { karar, skor, maliyet, riskler, oneriler, analiz }
 */

export async function POST(req) {
    try {
        const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY?.replace(/[\r\n]+/g, '').trim();

        if (!DEEPSEEK_KEY) {
            return NextResponse.json({ error: 'DEEPSEEK_API_KEY tanÄ±mlÄ± deÄŸil.' }, { status: 500 });
        }

        const body = await req.json();
        const { urunAdi, kategori, fiyat, notlar } = body;

        if (!urunAdi?.trim()) {
            return NextResponse.json({ error: 'urunAdi parametresi zorunlu.' }, { status: 400 });
        }

        const prompt = `Sen THE ORDER / NÄ°ZAM sisteminin tekstil fabrikasÄ± analisti'sin.
GÃ¶revin: Verilen Ã¼rÃ¼n iÃ§in Ã¼retim kararÄ± ve maliyet analizi yap.

DÄ°L KURALI: Tamamen soÄŸukkanlÄ±, metrik odaklÄ± TÃ¼rkÃ§e yaz. AbartÄ±lÄ± ifade kullanma.

ÃœRÃœN BÄ°LGÄ°SÄ°:
- ÃœrÃ¼n AdÄ±: ${urunAdi.trim()}
- Kategori: ${kategori || 'belirtilmemiÅŸ'}
- Hedef Fiyat: ${fiyat ? fiyat + ' TL' : 'belirtilmemiÅŸ'}
- Notlar: ${notlar || 'yok'}

GÃ–REV:
AÅŸaÄŸÄ±daki JSON formatÄ±nda yanÄ±t ver (baÅŸka hiÃ§bir ÅŸey yazma):

{
  "karar": "ÃœRET | TEST_URETIM | IZLE | REDDET",
  "karar_skoru": 0-100,
  "tahmini_maliyet_tl": sayÄ±,
  "tahmini_kar_marji": "yÃ¼zde olarak",
  "uretim_zorlugu": "Kolay | Orta | Zor",
  "tahmini_iscilik_gun": sayÄ±,
  "riskler": ["Risk 1", "Risk 2"],
  "guclu_yonler": ["GÃ¼Ã§lÃ¼ yÃ¶n 1", "GÃ¼Ã§lÃ¼ yÃ¶n 2"],
  "pazar_yorumu": "2 cÃ¼mle, metrik bazlÄ±",
  "oneri": "Fabrika yÃ¶neticisine 1 cÃ¼mle net tavsiye"
}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_KEY}`,
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: 'deepseek-chat',  // DeepSeek-V3
                messages: [
                    {
                        role: 'system',
                        content: 'Sen bir tekstil fabrikasÄ± yapay zeka analistsin. TÃ¼rkÃ§e konuÅŸ. YalnÄ±zca geÃ§erli JSON dÃ¶n.',
                    },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 800,
                temperature: 0.2,
                response_format: { type: 'json_object' },
            }),
        });

        clearTimeout(timeout);

        if (!res.ok) {
            const errText = await res.text();
            return NextResponse.json({
                error: `DeepSeek API hatasÄ± (${res.status})`,
                detay: errText,
            }, { status: 502 });
        }

        const data = await res.json();
        const rawText = data.choices?.[0]?.message?.content || '{}';

        let analiz = {};
        try {
            analiz = JSON.parse(rawText);
        } catch {
            analiz = { oneri: rawText, karar: 'IZLE', karar_skoru: 50 };
        }

        // Token maliyet logu (opsiyonel bilgi)
        const tokenKullanimi = data.usage || {};

        return NextResponse.json({
            ajan: 'deepseek-analiz',
            urun: urunAdi,
            model: 'deepseek-chat (v3)',
            ...analiz,
            token_kullanimi: tokenKullanimi,
            timestamp: new Date().toISOString(),
        });

    } catch (err) {
        if (err.name === 'AbortError') {
            return NextResponse.json({ error: 'DeepSeek zaman aÅŸÄ±mÄ± (15sn).' }, { status: 504 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
