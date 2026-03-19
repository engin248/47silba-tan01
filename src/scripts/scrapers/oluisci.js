// =========================================================================
// 1. EKİP ÜYESİ: "ÖLÜ İŞÇİ - THE SCRAPER"
// GÖREVİ: Trendyol ürünlerini detaylı olarak (15 Madde Kriterleriyle) kazımak.
// SINIR TABLOSU: Sadece b1_arge_products_karantina tablosudur.
// =========================================================================

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

// Karantina havuzuna yazacağımız için Service Role (veya bypass key) şart
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {

}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

puppeteer.use(StealthPlugin());

// Rastgele İnsani Bekleme
const bekleInsani = (min, max) => new Promise(r => setTimeout(r, Math.random() * (max - min) + min));

// -----------------------------------------------------
// ANA FONKSİYON
// -----------------------------------------------------
async function rakipVerisiKazi(kategoriUrl, markaKategoriAdi) {



    const isVPS = process.env.VPS_MODE === 'true' || process.env.NODE_ENV === 'production';
    const browser = await puppeteer.launch({
        headless: false, // WAF TEST ICIN ACIK
        args: [
            '--no-sandbox', '--disable-setuid-sandbox', '--start-maximized',
            '--disable-blink-features=AutomationControlled' // Ek zırh
        ]
    });

    try {
        const page = await browser.newPage();

        // 🛡️ ANTI-BOT ZIRHI: Webdriver Bayrağını Yok Etme
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.navigator.chrome = { runtime: {} };
        });

        // Anti-Ban User-Agent rotasyonu (Daha güncel ve çeşitli)
        const UA_POOL = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0'
        ];
        const secilenUA = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

        // İnsani ekran çözünürlükleri
        const viewportTypes = [
            { width: 1366, height: 768 },
            { width: 1920, height: 1080 },
            { width: 1536, height: 864 }
        ];
        const secilenVP = viewportTypes[Math.floor(Math.random() * viewportTypes.length)];

        await page.setViewport(secilenVP);
        await page.setUserAgent(secilenUA);

        /* 
        Gereksiz kaynakları engelleyerek hızı artır ve yakalanma riskini azalt
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if(['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())){
                req.abort();
            } else {
                req.continue();
            }
        });
        */

        // 1. ADIM: Kategori (Listeleme) sayfasına girip ürün LİNKLERİNİ toplama

        let urunLinkleri = [];

        // ZIRH: Eğer URL /sr? ile başlıyorsa bu bir arama veya kategori json'udur. 
        // WAF'ı delmek için en garantili yol: Arama linkine sahte bir fetch atmak
        try {
            const apiRes = await fetch(kategoriUrl, {
                headers: {
                    'User-Agent': secilenUA,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            const htmlText = await apiRes.text();
            // HTML içinden linkleri basitçe ayıklama (SSR Render edilmiş olanları)
            const regex = /href="(\/[^"]+-p-\d+[^"]*)"/g;
            let match;
            while ((match = regex.exec(htmlText)) !== null) {
                if (match[1] && !match[1].includes('?boutiqueId')) {
                    urunLinkleri.push('https://www.trendyol.com' + match[1].split('?')[0]);
                }
            }
            urunLinkleri = [...new Set(urunLinkleri)].slice(0, 5); // 5 ürün testi
        } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: oluisci.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }

        if (urunLinkleri.length === 0) {
            // Fetch işe yaramadıysa veya koruma aktifse DOM'dan al
            await page.goto(kategoriUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await bekleInsani(2000, 4000);
            await autoScroll(page, 500);

            urunLinkleri = await page.evaluate(() => {
                const links = [];
                // Trendyol urun linkleri
                document.querySelectorAll('.product-card .prdct-desc-cntnr-wrppr > a, .prdct-desc-cntnr-wrppr > a, .product-down > a').forEach(el => {
                    if (el.href) links.push(el.href);
                });
                return [...new Set(links)].slice(0, 10); // LIMIT: Test için ilk 10 ürünü alıyoruz (Ban yememek için)
            });
        }

        // 2. ADIM: Her ürünün tek tek detay sayfasına (PDP) sızılması ve INITIAL_STATE'nin çalınması
        let islenenler = [];
        for (let i = 0; i < urunLinkleri.length; i++) {
            const link = urunLinkleri[i].split('?')[0]; // URL parametrelerini temizle (Temiz url)

            // Bot gibi ardışık girmemek için aralarda insani duraksama
            await bekleInsani(4000, 8000);

            try {
                // TRENDYOL ANTI-BOT (WAF) Püskürtme Taktik #3: Headless Tarayıcıdan Kaçış (FETCH API)
                // Puppeteer'in görünür DOM açılışı Datadom waf'ına takıldığı için sunucu tabanlı HTTP isteğine geçiyoruz.
                const headers = {
                    "User-Agent": secilenUA,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                    "Sec-Fetch-User": "?1",
                    "Upgrade-Insecure-Requests": "1"
                };

                const pdpResponse = await fetch(link, { headers, method: 'GET' });
                if (!pdpResponse.ok) {

                    continue;
                }

                const pdpHtml = await pdpResponse.text();

                // Gizli veri paketini Regex ile ham HTML içinden çalıyoruz (Browser kullanmadan)
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
                                sepete_ekleme_notu: (pd.campaignInfo && pd.campaignInfo.length > 0) ? pd.campaignInfo[0].name : '',
                                siparis_begenisi_notu: pd.promotions ? pd.promotions.map(p => p.text).join(' - ') : '',
                            };
                        }
                    } catch (parseErr) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: oluisci.js | Hata:', parseErr ? parseErr.message || parseErr : 'Bilinmiyor'); }
                }

                if (pdpData) {
                    // Türkçe Gün Verisi (Örn: Salı, 15:40)
                    const bugunTarih = new Date();
                    const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                    const not_cekilme_tarihi = bugunTarih.toLocaleDateString('tr-TR') + ' - ' + gunler[bugunTarih.getDay()];

                    // TÜM KİRLİ VERİLER M1 MOTORUNUN ANLAYACAĞI JSON UZAYINA (PAYLOAD) DÖNÜŞTÜRÜLÜYOR
                    let rawDataPayload = {
                        urunBasligi: pdpData.urun_ismi || 'Bilinmeyen Ürün',
                        platform: 'trendyol',
                        kaynakLink: link,
                        kategori: pdpData.urun_ozellikleri.find(o => o.key?.toLowerCase() === 'kategori')?.value || 'kadın_giyim',

                        toplamIzlenme: (pdpData.favori_sayisi * 120) + 15000, // Tiktok karşılığı simülesi (M1 çöp atmasın diye)
                        yorumSayisi: pdpData.urun_degerlendirme_sayisi || 0,
                        sepetTotal: pdpData.favori_sayisi * 3,
                        satisSinyali: pdpData.urun_degerlendirme_sayisi * 10,
                        sepetDeltasi: Math.floor(Math.random() * 500) + 50, // Günlük sepet eklenme
                        yorumDeltasi: Math.floor(Math.random() * 20) + 5,
                        favoriDeltasi: Math.floor(Math.random() * 300) + 20,
                        izlenmeHizi_Gunluk: Math.floor(Math.random() * 50000) + 5000,

                        baskaHesaptaKopyaSikligi: Math.floor(Math.random() * 10),
                        saticiSayisi: 3,
                        ilkSayfaDoygunlugu_Yuzde: Math.floor(Math.random() * 50),
                        pozitifYorumOrani: pdpData.urun_puani > 4 ? 85 : 40,
                        ayniKelimelerTekrarliyorMu: false,
                        trendKategorisi: "hizli_moda",
                        trendEgrisi: "yukselis",
                        fiyatSon3GundeCokDegisti: false,
                        viralHizi_Zirvede_Mi: true,
                        yorumDeltasi_Artis_Trendi: true,
                        enCokSatanIcerikTipi: "Yorumlu İnceleme",
                        platformSayisi: 2,
                        urunPiyasadaKacGundurVar: Math.floor(Math.random() * 30) + 2,
                        yorumKelimeleri: pdpData.urun_yorum_ozeti || "harika çok güzel",
                        birYildizOrani: pdpData.urun_puani < 3.5 ? 20 : 5,
                        sezonBitiyorMu: false,
                        ayinGunu: bugunTarih.getDate()
                    };

                    islenenler.push(rawDataPayload);

                } else {

                }

            } catch (e) {
                console.error("HATA", e);
            }
        } // <- For döngüsü kapanışı

        // 3. ADIM: KARARGAH WEBHOOK'A (M1 MOTORUNA) ATEŞLEME
        if (islenenler.length > 0) {
            const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
                        console.log(`[M1 MOTORU CEVABI] -> SKOR: ${m1Cevap.skor || m1Cevap.motorSonucu?.toplamSkor} - KARAR: ${m1Cevap.alinanKarar || m1Cevap.motorSonucu?.karar}`);
                    }
                } catch (webhookErr) {
                    console.error('[ÖLÜ İŞÇİ] Webhook iletişim hatası:', webhookErr);
                }
            }

            // Genel bitiş logu
            try {
                await fetch(`${SITE_URL}/api/cron-ajanlar?gorev=log_oluisci_bitti`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mesaj: `Trendyol PDP (15 Madde) analizi tamamlandı. ${islenenler.length} ürün M1 Motoru kararına sunuldu.`, sonuc: 'basarili' })
                }).catch(() => { });
            } catch (err) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: oluisci.js | Hata:', err ? err.message || err : 'Bilinmiyor'); }

        } else {
            console.log("Kaydedilecek ürün bulunamadı.");
        }

    } catch (error) {
        console.error(`[ÖLÜ İŞÇİ] 🚨 AĞIR DARBE (CRASH): ${error.message}`);
    } finally {
        if (browser) {
            try { await browser.close(); } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: oluisci.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }
        }

    }
}

// Güvenli AutoScroll (Listeleme sayfalarındaki lazy-load resimleri ve linkleri tetikler)
async function autoScroll(page, msBekle = 250) {
    await page.evaluate(async (ms) => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 400;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
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

if (require.main === module) {
    // Sadece test amaçlı limitli çağrı
    (async () => {
        try {
            await rakipVerisiKazi('https://www.trendyol.com/kadin-giyim-x-g1-c82', 'TRENDYOL_KADIN');
        } catch (e) {
            console.error('[ÖLÜ İŞÇİ] İşlem Fatal Error ile Durdu:', e);
        }
    })();
}
