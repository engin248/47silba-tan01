export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';

/**
 * /api/perplexity-arama â€” Zamansal DoÄŸrulama iÃ§in Perplexity AramasÄ±
 * KullanÄ±m: zamanYenidenArastir() fonksiyonu tarafÄ±ndan Ã§aÄŸrÄ±lÄ±r.
 * Trend-ara ile aynÄ± motor, farklÄ± prompt â€” karÅŸÄ±laÅŸtÄ±rmalÄ± analiz yapar.
 */

const istekSayaci = new Map();
function rateLimitKontrol(ip) {
    const simdi = Date.now();
    const kayit = istekSayaci.get(ip) || { sayi: 0, baslangic: simdi };
    if (simdi - kayit.baslangic > 60 * 1000) {
        istekSayaci.set(ip, { sayi: 1, baslangic: simdi });
        return true;
    }
    if (kayit.sayi >= 20) return false;
    istekSayaci.set(ip, { ...kayit, sayi: kayit.sayi + 1 });
    return true;
}

export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!rateLimitKontrol(ip)) {
        return NextResponse.json({ error: 'Ã‡ok fazla istek. 1 dakika bekleyin.' }, { status: 429 });
    }

    const { sorgu } = await request.json();
    if (!sorgu?.trim()) return NextResponse.json({ error: 'Sorgu boÅŸ olamaz' }, { status: 400 });

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey || apiKey.includes('BURAYA')) {
        // Demo modu â€” API key yoksa Ã¶rnek karÅŸÄ±laÅŸtÄ±rma verisi dÃ¶ner
        return NextResponse.json({
            sonuc: `TREND: [GÃœÃ‡LÃœ]\nSATIS: [Ã‡OK_SATTI]\nORTALAMA_FÄ°YAT: 950 TL\nRAKÄ°P_ÃœRETTÄ°: EVET (Zara, DeFacto)\nHermAI_KARAR_UYUM: DOÄRULANDI\nEN_Ã–NEMLÄ°_BULGU: ÃœrÃ¼n Trendyol\'da 12.000+ aylÄ±k satÄ±ÅŸa ulaÅŸtÄ±, fiyat yÃ¼kselerek talep gÃ¼cÃ¼ne iÅŸaret ediyor.\n\nâš ï¸ Bu demo verisidir. GerÃ§ek analiz iÃ§in PERPLEXITY_API_KEY gereklidir.`,
            demo: true,
        });
    }

    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'Sen THE ORDER sisteminin zamansal doÄŸrulama uzmanÄ±sÄ±n. Sana verilen detaylÄ± sorularÄ± gerÃ§ek piyasa verilerine dayanarak yanÄ±tla. YalnÄ±zca Ã¶lÃ§Ã¼lebilir veri, rakam ve yÃ¼zde kullan. CevabÄ±n formatÄ±: TREND/SATIS/ORTALAMA_FIYAT/RAKIP_URETTI/HermAI_KARAR_UYUM/EN_ONEMLI_BULGU ÅŸeklinde olmalÄ±.'
                    },
                    { role: 'user', content: sorgu }
                ],
                max_tokens: 800,
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            const hata = await response.text();
            return NextResponse.json({ error: `Perplexity hatasÄ±: ${response.status} â€” ${hata}` }, { status: 500 });
        }

        const data = await response.json();
        const sonuc = data.choices?.[0]?.message?.content || 'SonuÃ§ alÄ±namadÄ±';
        return NextResponse.json({ sonuc, basarili: true });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
