// =========================================================================
// 1. EKİP ÜYESİ: "ÖLÜ İŞÇİ - THE SCRAPER"
// GÖREVİ: Trendyol, Zara ve Sosyal Medyadan ürün verisi çekmek.
// SINIR TABLOSU: Sadece b1_arge_products tablosudur.
// =========================================================================

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// İlk olarak yerel dosyadaki env'ye, yoksa .env.local'e bakar
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

// ─── GÜVENLİK DÜZELTME: Anon key yerine Service Role Key kullanılıyor ───
// ESKİ: NEXT_PUBLIC_SUPABASE_ANON_KEY (public, client-side'da açık)
// YENİ: SUPABASE_SERVICE_ROLE_KEY (gizli, sadece sunucu tarafında)
// Bu script zaten Node.js ortamında çalıştığı için Service Role Key güvenle kullanılabilir.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[ÖLÜ İŞÇİ] ⚠️ UYARI: SUPABASE_SERVICE_ROLE_KEY bulunamadı, anon key ile devam ediliyor.');
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

puppeteer.use(StealthPlugin());

async function rakipVerisiKazi(hedefUrl, markaAdi) {
    console.log(`[ÖLÜ İŞÇİ] Uyanıyor... Hedef: ${markaAdi}`);

    // IP ban yememek için donanım gizleme (Stealth) modunda Headless tarayıcı açılışı
    // VPS (Linux) ortamında çökmeyi önlemek için headless: 'new' aktiftir.
    const isVPS = process.env.VPS_MODE === 'true' || process.env.NODE_ENV === 'production';
    const browser = await puppeteer.launch({
        headless: isVPS ? 'new' : false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    const page = await browser.newPage();

    // User-Agent Havuzu (Trendyol Firewall atlatan güncel profiller)
    const UA_POOL = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];
    const secilenUA = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

    // Gerçek bir kullanıcı gibi davranmak için viewport ve rastgele U-A manipülasyonu
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(secilenUA);

    // Rastgele İnsani Bekleme Fonksiyonu (Soğutma/Throttle)
    const bekleInsani = (min, max) => new Promise(r => setTimeout(r, Math.random() * (max - min) + min));

    try {
        console.log(`[ÖLÜ İŞÇİ] ${hedefUrl} hedefine sızılıyor...`);
        // Siteye gidilir, ağı yormamak için load yerine domcontentloaded beklenir
        await page.goto(hedefUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log(`[ÖLÜ İŞÇİ] Ana sayfa yüklendi, ${secilenUA.includes('Mac') ? 'Mac' : 'Windows'} kamuflajıyla insan gibi inceleniyor...`);

        // Rastgele bekleme (Bot tespitini kırar)
        await bekleInsani(2500, 5000);

        // Gerçek insan simülasyonu (Aşağı kaydırma)
        await autoScroll(page);
        await bekleInsani(1000, 2500); // Kaydırma sonrası ürünlerin tam oturmasını bekle

        // --- VERİ ÇEKME MANTIĞI (Örn: Trendyol / Zara HTML yapısına göre) ---
        // Not: Selector'lar siteler güncellendikçe değişir, bu bir şablondur.
        const urunler = await page.evaluate((marka) => {
            let toplananVeriler = [];
            // Örnek bir grid içindeki ürün kartlarını bul
            let kartlar = document.querySelectorAll('.product-card, .product-item, ._product');

            kartlar.forEach(kart => {
                let isim = kart.querySelector('.product-name, .name, h3')?.innerText || 'Bilinmeyen Ürün';
                let fytMetin = kart.querySelector('.price, .prc-box-dscntd, .current-price')?.innerText || '0';
                // 1.250,00 TL gibi metinleri saf sayıya çevirme
                let fiyatSayi = parseFloat(fytMetin.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;

                let resimUrl = kart.querySelector('img')?.src || '';
                let urunLink = kart.querySelector('a')?.href || '';

                // M1 AI ajanlarının okuyacağı ham veri standardı
                toplananVeriler.push({
                    veri_kaynagi: marka,
                    ham_veri: JSON.stringify({ isim, fytMetin, resimUrl, urunLink, fiyatSayi }),
                    islenen_durum: 'bekliyor'
                });
            });
            return toplananVeriler;
        }, markaAdi);

        console.log(`[ÖLÜ İŞÇİ] Operasyon Tamamlandı. ${urunler.length} adet ham veri yakalandı.`);

        // --- SINIR ÇİZGİSİ (ÇAKIŞMA KALKANI) ---
        // 🚨 EKİP BETA: VPS/Cron Uyumlu Scraper Refactorizasyonu 
        // Vercel uyuşmazlığı nedeniyle script bağımsız çalışabilir hale getirildi. 
        if (urunler.length > 0) {

            const eklenecek_veriler = urunler.map(urun => ({
                veri_kaynagi: urun.veri_kaynagi,
                ham_veri: { ...JSON.parse(urun.ham_veri), markaAdi },
                islenen_durum: 'bekliyor',
                isleyen_ajan: 'bot_oluisci', // NİZAM Okyanus Ajanı 1
                created_at: new Date().toISOString()
            }));

            const { error } = await supabase.from('b1_arge_products').insert(eklenecek_veriler);
            if (error) {
                console.error('[ÖLÜ İŞÇİ] Veritabanı Reddi! Sınır ihlali veya format hatası:', error.message);
            } else {
                console.log(`[ÖLÜ İŞÇİ] Başarıyla NİZAM'ın midesine (${urunler.length} ürün) bırakıldı.`);

                // ─── KARARGAH (VERCEL) BİLDİRİMİ (WEBHOOK) ───
                // İşlem bittikten sonra Karargah'a (ve dolayısıyla Ajan Komuta merkezine) log bırak
                const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
                try {
                    if (typeof fetch === 'function') {
                        await fetch(`${SITE_URL}/api/cron-ajanlar?gorev=log_oluisci_bitti`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ mesaj: 'Trendyol veri kazıma tamamlandı. ' + urunler.length + ' ürün eklendi.', sonuc: 'basarili' })
                        }).catch(() => { });
                    }
                } catch (err) {
                    console.log(`[ÖLÜ İŞÇİ] Webhook atılamadı (Önemli değil):`, err.message);
                }

                console.log(`[ÖLÜ İŞÇİ] VPS üzerinde Uyku moduna geçiliyor.`);
            }
        }

    } catch (error) {
        console.error(`[ÖLÜ İŞÇİ] Tuzağa Düşüldü (Ban/Hata): ${error.message}`);
    } finally {
        await browser.close();
    }
}

// Otomatik Aşağı Kaydırma Fonksiyonu (Resimlerin ve ürünlerin yüklenmesini tetikler)
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 250;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 300); // Milisaniye (İnsan gibi yavaş)
        });
    });
}

// BU DOSYA KENDİ BAŞINA ÇALIŞACAK BİR BETİKTİR. NEXT.JS DEV ORTAMINDA DEĞİL.
// Node ortamında direkt çağırarak çalıştırabilirsiniz: node src/scripts/scrapers/oluisci.js

module.exports = { rakipVerisiKazi, autoScroll };

// Eğer script doğrudan Node ile çalıştırılmışsa (require ile çağrılmamışsa)
if (require.main === module) {
    console.log('[ÖLÜ İŞÇİ] Ana script olarak başlatıldı...');
    // Örnek Çağrı: Trendyol Kadın Giyim
    rakipVerisiKazi('https://www.trendyol.com/kadin-giyim-x-g1-c82', 'TRENDYOL_KADIN');
}
