import { NextResponse } from 'next/server';

/**
 * /api/serp-trend
 * SerpAPI — Google Trend Doğrulama Servisi
 *
 * Grev: Verilen rn/trend iin Google arama sonularından
 *        gerek piyasa sinyali eker. Perplexity'nin gremediği
 *        Google Shopping, Google Trends datası gelir.
 *
 * Input:  POST { sorgu: string, kategori?: string }
 * Output: { sonuclar, alışverisSonuclari, ilgiliAramalar, googleTrendsSkoru }
 */

// Rate limit: basit in-memory (production iin Upstash Redis nerilir)
const sonAramaMap = new Map();
const BEKLEME_MS = 5000; // 5 saniye bekleme arası aramalar

export async function POST(req) {
    try {
        const SERPAPI_KEY = process.env.SERPAPI_API_KEY?.replace(/[\r\n]+/g, '').trim();

        if (!SERPAPI_KEY) {
            return NextResponse.json({ error: 'SERPAPI_API_KEY tanımlı değil.' }, { status: 500 });
        }

        const body = await req.json();
        const { sorgu, kategori } = body;

        if (!sorgu?.trim()) {
            return NextResponse.json({ error: 'sorgu parametresi zorunlu.' }, { status: 400 });
        }

        // Basit rate limit (IP başına)
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const sonArama = sonAramaMap.get(ip) || 0;
        if (Date.now() - sonArama < BEKLEME_MS) {
            return NextResponse.json({
                error: `Ltfen ${Math.ceil((BEKLEME_MS - (Date.now() - sonArama)) / 1000)} saniye bekleyin.`
            }, { status: 429 });
        }
        sonAramaMap.set(ip, Date.now());

        // Trkiye pazarı iin arama sorgusu
        const arama = `${sorgu.trim()} ${kategori ? kategori : ''} Trkiye`.trim();

        //  AŞAMA 1: Google Organic Arama 
        const organikUrl = new URL('https://serpapi.com/search.json');
        organikUrl.searchParams.set('q', arama);
        organikUrl.searchParams.set('location', 'Turkey');
        organikUrl.searchParams.set('hl', 'tr');
        organikUrl.searchParams.set('gl', 'tr');
        organikUrl.searchParams.set('api_key', SERPAPI_KEY);
        organikUrl.searchParams.set('num', '5');

        //  AŞAMA 2: Google Shopping 
        const shoppingUrl = new URL('https://serpapi.com/search.json');
        shoppingUrl.searchParams.set('engine', 'google_shopping');
        shoppingUrl.searchParams.set('q', arama);
        shoppingUrl.searchParams.set('location', 'Turkey');
        shoppingUrl.searchParams.set('hl', 'tr');
        shoppingUrl.searchParams.set('gl', 'tr');
        shoppingUrl.searchParams.set('api_key', SERPAPI_KEY);
        shoppingUrl.searchParams.set('num', '5');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const [organikRes, shoppingRes] = await Promise.allSettled([
            fetch(organikUrl.toString(), { signal: controller.signal }),
            fetch(shoppingUrl.toString(), { signal: controller.signal }),
        ]);

        clearTimeout(timeout);

        // Organik sonular
        let sonuclar = [];
        let ilgiliAramalar = [];
        if (organikRes.status === 'fulfilled' && organikRes.value.ok) {
            const data = await organikRes.value.json();
            sonuclar = (data.organic_results || []).slice(0, 5).map(r => ({
                baslik: r.title,
                link: r.link,
                ozet: r.snippet,
                kaynak: r.displayed_link,
            }));
            ilgiliAramalar = (data.related_searches || []).slice(0, 6).map(r => r.query);
        }

        // Shopping sonuları
        let alisverisler = [];
        if (shoppingRes.status === 'fulfilled' && shoppingRes.value.ok) {
            const data = await shoppingRes.value.json();
            alisverisler = (data.shopping_results || []).slice(0, 5).map(r => ({
                baslik: r.title,
                fiyat: r.price,
                kaynak: r.source,
                puan: r.rating,
                yorumSayisi: r.reviews,
                gorselUrl: r.thumbnail,
            }));
        }

        //  Basit Google Trend Skoru Hesabı 
        // Shopping sonucu sayısı + organik sonu kalitesine gre 0-100 skor
        const shoppingSkor = Math.min(alisverisler.length * 15, 60);
        const organikSkor = Math.min(sonuclar.length * 8, 40);
        const googleTrendsSkoru = shoppingSkor + organikSkor;

        // Fiyat aralığı analizi (shopping'den)
        let fiyatAraligi = null;
        if (alisverisler.length > 0) {
            const fiyatlar = alisverisler
                .map(a => parseFloat(a.fiyat?.replace(/[^0-9.,]/g, '').replace(',', '.')))
                .filter(f => !isNaN(f) && f > 0);
            if (fiyatlar.length > 0) {
                fiyatAraligi = {
                    min: Math.min(...fiyatlar),
                    max: Math.max(...fiyatlar),
                    ortalama: Math.round(fiyatlar.reduce((a, b) => a + b, 0) / fiyatlar.length),
                };
            }
        }

        return NextResponse.json({
            sorgu,
            googleTrendsSkoru,
            sonuclar,
            alisverisler,
            ilgiliAramalar,
            fiyatAraligi,
            piyasaYorumu: googleTrendsSkoru >= 70
                ? 'Gl pazar talebi — Google\'da yoğun alışveriş trafiği'
                : googleTrendsSkoru >= 40
                    ? 'Orta dzey talep — pazar var ama rekabet izlenebilir'
                    : 'Dşk Google sinyali — niş rn veya yeterli veri yok',
            timestamp: new Date().toISOString(),
        });

    } catch (err) {
        if (err.name === 'AbortError') {
            return NextResponse.json({ error: 'SerpAPI zaman aşımı (12sn).' }, { status: 504 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
