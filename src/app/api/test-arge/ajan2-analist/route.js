import { NextResponse } from 'next/server';

/**
 * NİZAM KUM HAVUZU (SANDBOX) - AJAN 2: ANALİST (KANTAR & TERZİ BİRLEŞİMİ)
 * Görev: Ajan 1'den (İstihbarat) gelen ham veriyi alır, Mizanet kurallarına (D2C, Fason Maliyeti, Kalite Açığı)
 * göre değerlendirir ve 1-100 arası matematiksel bir "Risk/Kâr Puanı" çıkarır.
 */

export async function POST(req) {
    try {
        const geminiKey = process.env.GEMINI_API_KEY?.trim();
        if (!geminiKey) return NextResponse.json({ error: 'GEMINI API Anahtarı bulunamadı!' }, { status: 500 });

        const GEMINI_API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

        // İstihbarat (Ajan 1) tarafından sağlanan ham veriler
        const { urunAdi, pazarTabanFiyati, guncelSatisHizi, rakipSikayetleri, tahminiMaliyet } = await req.json();

        if (!urunAdi) {
            return NextResponse.json({ error: 'Ürün verisi (urunAdi) zorunludur.' }, { status: 400 });
        }

        const prompt = `
            Sen (Mizanet Ajan 2: Analist), Mizanet tekstil imalat şirketinin acımasız ve tavizsis üretim analistisin.
            Amacımız: Aracıları çıkarıp D2C (Doğrudan Tüketiciye) yüksek kaliteyi uygun fiyata sunmak.
            
            GELEN İSTİHBARAT VERİSİ:
            Ürün: ${urunAdi}
            Pazar Taban Fiyatı (Rakiplerin En Düşük Satış Fiyatı): ${pazarTabanFiyati} TL
            Satış İvmesi: ${guncelSatisHizi}
            Rakip Şikayetleri (Tüketici Sorunu): ${rakipSikayetleri}
            İç Sistem Tahmini Üretim Maliyetimiz (M5): ${tahminiMaliyet} TL
            
            GÖREV (KÖR NOKTA ANALİZİ):
            Veriyi maliyet ve kalite zafiyeti açısından analiz et. "Satar" demek yetmez, "Ne kadar kazandırır?" ve "Ne kadar risksizdir?" sorusunu cevapla.
            Rakiplerin yaptığı (ve müşterilerin şikayet ettiği) hatayı nasıl çözeriz ve bizim maliyetimizle piyasa tavan fiyatı arasındaki marj kârlı mı?
            
            Aşağıdaki JSON formatında (sadece JSON dönecek şekilde) sonuç ver:
            {
                "analiz_skoru": "1 ile 100 arası puan. (85 altı üretim reddedilir)",
                "kar_marji_durumu": "Maliyet ve satış fiyatı makası kurtarıyor mu? (Olumlu/Olumsuz/Riskli)",
                "uretim_firsati": "Rakibin şikayetini nasıl fırsata çevirip daha iyisini dikebiliriz? (Reçete)",
                "risk_raporu": "Bu üretim fasona verilirse çıkabilecek tek cümlelik risk uyarısı."
            }
        `.trim();

        const res = await fetch(GEMINI_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1, // Analitik ve tavizsiz karar vermesi için düşük sıcaklık
                    maxOutputTokens: 500,
                    responseMimeType: 'application/json',
                },
            }),
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Gemini Analist motoru yanıt vermedi.' }, { status: res.status });
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        let jsonSonuc = {};
        try {
            jsonSonuc = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        } catch {
            return NextResponse.json({ error: 'Analist Ajan JSON parse hatası', hamVeri: rawText }, { status: 500 });
        }

        return NextResponse.json({
            ajan: 'Ajan 2: Analist',
            girdiVerisi: { urunAdi, pazarTabanFiyati, rakipSikayetleri },
            sonuc: jsonSonuc,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        return NextResponse.json({ error: 'Analist Ajan çökmesi', detay: err.message }, { status: 500 });
    }
}
