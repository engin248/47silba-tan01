import { NextResponse } from 'next/server';

/**
 * /api/perplexity-arama — Zamansal Doğrulama iin Perplexity Araması
 * Kullanım: zamanYenidenArastir() fonksiyonu tarafından ağrılır.
 * Trend-ara ile aynı motor, farklı prompt — karşılaştırmalı analiz yapar.
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
        return NextResponse.json({ error: 'ok fazla istek. 1 dakika bekleyin.' }, { status: 429 });
    }

    const { sorgu } = await request.json();
    if (!sorgu?.trim()) return NextResponse.json({ error: 'Sorgu boş olamaz' }, { status: 400 });

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey || apiKey.includes('BURAYA')) {
        // Demo modu — API key yoksa rnek karşılaştırma verisi dner
        return NextResponse.json({
            sonuc: `TREND: [GL]\nSATIS: [OK_SATTI]\nORTALAMA_FİYAT: 950 TL\nRAKİP_RETTİ: EVET (Zara, DeFacto)\nHermAI_KARAR_UYUM: DOĞRULANDI\nEN_NEMLİ_BULGU: rn Trendyol\'da 12.000+ aylık satışa ulaştı, fiyat ykselerek talep gcne işaret ediyor.\n\n️ Bu demo verisidir. Gerek analiz iin PERPLEXITY_API_KEY gereklidir.`,
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
                        content: 'Sen THE ORDER sisteminin zamansal doğrulama uzmanısın. Sana verilen detaylı soruları gerek piyasa verilerine dayanarak yanıtla. Yalnızca llebilir veri, rakam ve yzde kullan. Cevabın formatı: TREND/SATIS/ORTALAMA_FIYAT/RAKIP_URETTI/HermAI_KARAR_UYUM/EN_ONEMLI_BULGU şeklinde olmalı.'
                    },
                    { role: 'user', content: sorgu }
                ],
                max_tokens: 800,
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            const hata = await response.text();
            return NextResponse.json({ error: `Perplexity hatası: ${response.status} — ${hata}` }, { status: 500 });
        }

        const data = await response.json();
        const sonuc = data.choices?.[0]?.message?.content || 'Sonu alınamadı';
        return NextResponse.json({ sonuc, basarili: true });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
