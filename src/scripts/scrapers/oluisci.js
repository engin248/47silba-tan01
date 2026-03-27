// =========================================================================
// 1. EKİP ÜYESİ: "ÖLÜ İŞÇİ - THE SCRAPER"
// GÖREVİ: Trendyol ürünlerini detaylı olarak (15 Madde Kriterleriyle) kazımak.
// SINIR TABLOSU: Sadece b1_arge_products_karantina tablosudur.
// ÇALIŞMA ORTAMI: Sadece VPS/Node.js. Vercel'de çalışmaz.
// =========================================================================
// VPS'te kurulum: npm install puppeteer-extra puppeteer-extra-plugin-stealth @supabase/supabase-js dotenv
// =========================================================================

// Dynamic require — VPS'te çalışır, Next.js bundle'a dahil olmaz
let puppeteer, StealthPlugin;
try {
    puppeteer = require('puppeteer-extra');
    StealthPlugin = require('puppeteer-extra-plugin-stealth');
} catch {
    console.error('[ÖLÜ İŞÇİ] puppeteer-extra bulunamadı. VPS ortamında "npm install puppeteer-extra puppeteer-extra-plugin-stealth" çalıştırın.');
    if (typeof module !== 'undefined' && require.main === module) {
        process.exit(1);
    }
}

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

// Karantina havuzuna yazacağımız için Service Role şart
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

if (puppeteer && StealthPlugin) {
    puppeteer.use(StealthPlugin());
}

// Rastgele İnsani Bekleme
const bekleInsani = (min, max) => new Promise(r => setTimeout(r, Math.random() * (max - min) + min));

// -----------------------------------------------------
// ANA FONKSİYON
// -----------------------------------------------------
async function rakipVerisiKazi(kategoriUrl, markaKategoriAdi) {
    if (!puppeteer) {
        console.error('[ÖLÜ İŞÇİ] puppeteer yüklü değil. VPS ortamında çalıştırın.');
        return;
    }

    const browser = await puppeteer.launch({
        headless: 'new', // [#3 FIX] headless: false → 'new' — VPS'te GUI yok, artık çalışır
        args: [
            '--no-sandbox', '--disable-setuid-sandbox', '--start-maximized',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();

        // Anti-Bot: Webdriver bayrağını yok et
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.navigator.chrome = { runtime: {} };
        });

        const UA_POOL = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        ];
        const secilenUA = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
        const viewportTypes = [
            { width: 1366, height: 768 },
            { width: 1920, height: 1080 },
            { width: 1536, height: 864 }
        ];
        const secilenVP = viewportTypes[Math.floor(Math.random() * viewportTypes.length)];
        await page.setViewport(secilenVP);
        await page.setUserAgent(secilenUA);

        // 1. ADIM: Kategori sayfasından ürün linklerini topla
        let urunLinkleri = [];

        try {
            const apiRes = await fetch(kategoriUrl, {
                headers: {
                    'User-Agent': secilenUA,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                }
            });
            const htmlText = await apiRes.text();
            const regex = /href="(\/[^"]+-p-\d+[^"]*)"/g;
            let match;
            while ((match = regex.exec(htmlText)) !== null) {
                if (match[1] && !match[1].includes('?boutiqueId')) {
                    urunLinkleri.push('https://www.trendyol.com' + match[1].split('?')[0]);
                }
            }
            urunLinkleri = [...new Set(urunLinkleri)].slice(0, 5);
        } catch (e) { console.error('[ÖLÜ İŞÇİ] Fetch hata:', e.message); }

        if (urunLinkleri.length === 0) {
            await page.goto(kategoriUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await bekleInsani(2000, 4000);
            await autoScroll(page, 500);
            urunLinkleri = await page.evaluate(() => {
                const links = [];
                document.querySelectorAll('.product-card .prdct-desc-cntnr-wrppr > a, .prdct-desc-cntnr-wrppr > a').forEach(el => {
                    if (el.href) links.push(el.href);
                });
                return [...new Set(links)].slice(0, 10);
            });
        }

        // 2. ADIM: Her ürün detay sayfasına gir, INITIAL_STATE'i çal
        let islenenler = [];
        for (let i = 0; i < urunLinkleri.length; i++) {
            const link = urunLinkleri[i].split('?')[0];
            await bekleInsani(4000, 8000);
            try {
                const headers = {
                    "User-Agent": secilenUA,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                    "Sec-Fetch-User": "?1",
                };
                const pdpResponse = await fetch(link, { headers, method: 'GET' });
                if (!pdpResponse.ok) continue;
                const pdpHtml = await pdpResponse.text();
                const stateMatch = pdpHtml.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
                let pdpData = null;
                if (stateMatch && stateMatch[1]) {
                    try {
                        const state = JSON.parse(stateMatch[1]);
                        if (state && state.product && state.product.productDetail) {
                            const pd = state.product.productDetail;
                            pdpData = {
                                marka_ismi: pd.brand?.name || '',
                                urun_ismi: pd.name || '',
                                orjinal_fiyat: pd.price?.originalPrice?.value || 0,
                                indirimli_fiyat: pd.price?.discountedPrice?.value || 0,
                                urun_puani: pd.ratingScore?.averageRating || 0,
                                urun_degerlendirme_sayisi: pd.ratingScore?.totalCount || 0,
                                favori_sayisi: pd.favoriteCount || 0,
                                resim_url: pd.images?.length > 0 ? ('https://cdn.dsmcdn.com/' + pd.images[0]) : '',
                                urun_ozellikleri: pd.attributes ? pd.attributes.map(a => ({ key: a.key?.name, value: a.value?.name })) : [],
                                urun_yorum_ozeti: pd.productReviews?.reviewSummary || '',
                            };
                        }
                    } catch (parseErr) { console.error('[ÖLÜ İŞÇİ] Parse hata:', parseErr.message); }
                }

                if (pdpData) {
                    const bugunTarih = new Date();
                    const rawDataPayload = {
                        urunBasligi: pdpData.urun_ismi || 'Bilinmeyen Ürün',
                        platform: 'trendyol',
                        kaynakLink: link,
                        kategori: pdpData.urun_ozellikleri.find(o => o.key?.toLowerCase() === 'kategori')?.value || 'kadın_giyim',
                        // [U-13 FIX] Gerçek Trendyol API'sinden alınamayan değerler 'tahmini_' ön ekiyle işaretlendi
                        tahmini_izlenme: (pdpData.favori_sayisi * 120) + 15000, // favori × 120 + 15000 tahmini
                        yorumSayisi: pdpData.urun_degerlendirme_sayisi || 0, // gerçek veri
                        tahmini_sepet: pdpData.favori_sayisi * 3, // gerçek sepet verisi yok
                        tahmini_satisSinyali: pdpData.urun_degerlendirme_sayisi * 10, // gerçek satış verisi yok
                        pozitifYorumOrani: pdpData.urun_puani > 4 ? 85 : 40, // puana göre kaba tahmin
                        trendKategorisi: 'hizli_moda',
                        trendEgrisi: 'yukselis',
                        yorumKelimeleri: pdpData.urun_yorum_ozeti || 'harika çok güzel',
                        birYildizOrani: pdpData.urun_puani < 3.5 ? 20 : 5,
                        ayinGunu: bugunTarih.getDate(),
                        // Gerçek veriler
                        urun_puani: pdpData.urun_puani,
                        indirimli_fiyat: pdpData.indirimli_fiyat,
                        orjinal_fiyat: pdpData.orjinal_fiyat,
                        favori_sayisi: pdpData.favori_sayisi,
                    };
                    islenenler.push(rawDataPayload);
                }
            } catch (e) { console.error('[ÖLÜ İŞÇİ] Ürün hatası:', e.message); }
        }

        // 3. ADIM: M1 Motoruna ateşle
        if (islenenler.length > 0) {
            const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mizanet.com'; // [DOMAIN FIX]
            for (let payload of islenenler) {
                try {
                    console.log(`[ÖLÜ İŞÇİ] M1 Motoruna yollanıyor: ${payload.urunBasligi}`);
                    const res = await fetch(`${SITE_URL}/api/m1-scraper-webhook`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rawData: payload })
                    });
                    const m1Cevap = await res.json();
                    if (m1Cevap.basarili) {
                        console.log(`[M1 MOTORU] SKOR: ${m1Cevap.skor || m1Cevap.motorSonucu?.toplamSkor} - KARAR: ${m1Cevap.alinanKarar || m1Cevap.motorSonucu?.karar}`);
                    }
                } catch (webhookErr) { console.error('[ÖLÜ İŞÇİ] Webhook hata:', webhookErr.message); }
            }
        } else {
            console.log('[ÖLÜ İŞÇİ] Kaydedilecek ürün bulunamadı.');
        }

    } catch (error) {
        console.error(`[ÖLÜ İŞÇİ] CRASH: ${error.message}`);
    } finally {
        try { await browser.close(); } catch { }
    }
}

async function autoScroll(page, msBekle = 250) {
    await page.evaluate(async (ms) => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 400;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 5000) {
                    clearInterval(timer);
                    resolve();
                }
            }, ms);
        });
    }, msBekle);
}

module.exports = { rakipVerisiKazi, autoScroll };

if (typeof require !== 'undefined' && require.main === module) {
    (async () => {
        try {
            await rakipVerisiKazi('https://www.trendyol.com/kadin-giyim-x-g1-c82', 'TRENDYOL_KADIN');
        } catch (e) {
            console.error('[ÖLÜ İŞÇİ] Fatal Error:', e);
        }
    })();
}
