export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';

/**
 * NÄ°ZAM KUM HAVUZU (SANDBOX) - AJAN 2: ANALÄ°ST (KANTAR & TERZÄ° BÄ°RLEÅÄ°MÄ°)
 * GÃ¶rev: Ajan 1'den (Ä°stihbarat) gelen ham veriyi alÄ±r, THE ORDER kurallarÄ±na (D2C, Fason Maliyeti, Kalite AÃ§Ä±ÄŸÄ±)
 * gÃ¶re deÄŸerlendirir ve 1-100 arasÄ± matematiksel bir "Risk/KÃ¢r PuanÄ±" Ã§Ä±karÄ±r.
 */

export async function POST(req) {
    try {
        const geminiKey = process.env.GEMINI_API_KEY?.trim();
        if (!geminiKey) return NextResponse.json({ error: 'GEMINI API AnahtarÄ± bulunamadÄ±!' }, { status: 500 });

        const GEMINI_API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

        // Ä°stihbarat (Ajan 1) tarafÄ±ndan saÄŸlanan ham veriler
        const { urunAdi, pazarTabanFiyati, guncelSatisHizi, rakipSikayetleri, tahminiMaliyet } = await req.json();

        if (!urunAdi) {
            return NextResponse.json({ error: 'ÃœrÃ¼n verisi (urunAdi) zorunludur.' }, { status: 400 });
        }

        const prompt = `
            Sen (NÄ°ZAM Ajan 2: Analist), "THE ORDER" tekstil imalat ÅŸirketinin acÄ±masÄ±z ve tavizsiz Ã¼retim analistisin.
            AmacÄ±mÄ±z: AracÄ±larÄ± Ã§Ä±karÄ±p D2C (DoÄŸrudan TÃ¼keticiye) yÃ¼ksek kaliteyi uygun fiyata sunmak.
            
            GELEN Ä°STÄ°HBARAT VERÄ°SÄ°:
            ÃœrÃ¼n: ${urunAdi}
            Pazar Taban FiyatÄ± (Rakiplerin En DÃ¼ÅŸÃ¼k SatÄ±ÅŸ FiyatÄ±): ${pazarTabanFiyati} TL
            SatÄ±ÅŸ Ä°vmesi: ${guncelSatisHizi}
            Rakip Åikayetleri (TÃ¼ketici Sorunu): ${rakipSikayetleri}
            Ä°Ã§ Sistem Tahmini Ãœretim Maliyetimiz (M5): ${tahminiMaliyet} TL
            
            GÃ–REV (KÃ–R NOKTA ANALÄ°ZÄ°):
            Veriyi maliyet ve kalite zafiyeti aÃ§Ä±sÄ±ndan analiz et. "Satar" demek yetmez, "Ne kadar kazandÄ±rÄ±r?" ve "Ne kadar risksizdir?" sorusunu cevapla.
            Rakiplerin yaptÄ±ÄŸÄ± (ve mÃ¼ÅŸterilerin ÅŸikayet ettiÄŸi) hatayÄ± nasÄ±l Ã§Ã¶zeriz ve bizim maliyetimizle piyasa tavan fiyatÄ± arasÄ±ndaki marj kÃ¢rlÄ± mÄ±?
            
            AÅŸaÄŸÄ±daki JSON formatÄ±nda (sadece JSON dÃ¶necek ÅŸekilde) sonuÃ§ ver:
            {
                "analiz_skoru": "1 ile 100 arasÄ± puan. (85 altÄ± Ã¼retim reddedilir)",
                "kar_marji_durumu": "Maliyet ve satÄ±ÅŸ fiyatÄ± makasÄ± kurtarÄ±yor mu? (Olumlu/Olumsuz/Riskli)",
                "uretim_firsati": "Rakibin ÅŸikayetini nasÄ±l fÄ±rsata Ã§evirip daha iyisini dikebiliriz? (ReÃ§ete)",
                "risk_raporu": "Bu Ã¼retim fasona verilirse Ã§Ä±kabilecek tek cÃ¼mlelik risk uyarÄ±sÄ±."
            }
        `.trim();

        const res = await fetch(GEMINI_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1, // Analitik ve tavizsiz karar vermesi iÃ§in dÃ¼ÅŸÃ¼k sÄ±caklÄ±k
                    maxOutputTokens: 500,
                    responseMimeType: 'application/json',
                },
            }),
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Gemini Analist motoru yanÄ±t vermedi.' }, { status: res.status });
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        let jsonSonuc = {};
        try {
            jsonSonuc = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        } catch {
            return NextResponse.json({ error: 'Analist Ajan JSON parse hatasÄ±', hamVeri: rawText }, { status: 500 });
        }

        return NextResponse.json({
            ajan: 'Ajan 2: Analist',
            girdiVerisi: { urunAdi, pazarTabanFiyati, rakipSikayetleri },
            sonuc: jsonSonuc,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        return NextResponse.json({ error: 'Analist Ajan Ã§Ã¶kmesi', detay: err.message }, { status: 500 });
    }
}
