// =========================================================================
// 1. EKİP ÜYESİ: "ÖLÜ İŞÇİ - THE SCRAPER"
// GÖREVİ: Trendyol, Zara ve Sosyal Medyadan ürün verisi çekmek.
// SINIR TABLOSU: Sadece b1_arge_products tablosudur.
// =========================================================================

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env.local' });

// Supabase Bağlantısı (Sadece INSERT yetkisine sahip API anahtarı kullanılmalıdır!)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

puppeteer.use(StealthPlugin());

async function rakipVerisiKazi(hedefUrl, markaAdi) {
    console.log(`[ÖLÜ İŞÇİ] Uyanıyor... Hedef: ${markaAdi}`);

    // IP ban yememek için donanım gizleme (Stealth) modunda Headless tarayıcı açılışı
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    const page = await browser.newPage();

    // Gerçek bir kullanıcı gibi davranmak için viewport ve User-Agent manipülasyonu
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        console.log(`[ÖLÜ İŞÇİ] ${hedefUrl} hedefine sızılıyor...`);
        // Siteye gidilir, ağı yormamak için load yerine domcontentloaded beklenir
        await page.goto(hedefUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Gerçek insan simülasyonu (Aşağı kaydırma)
        await autoScroll(page);

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
        // Sadece ve sadece b1_arge_products'a fırlatır. Asla analiz yapmaz, karar vermez!
        // Not: Tablo yapısı b1_arge_products (id, aranan_kelime, veri_kaynagi, ham_veri, islenen_durum, created_at, isleyen_ajan, islendigi_tarih, extracted_data)
        if (urunler.length > 0) {
            const { error } = await supabase.from('b1_arge_products').insert(urunler);
            if (error) {
                console.error('[ÖLÜ İŞÇİ] Veritabanı Reddi! Sınır ihlali veya format hatası:', error.message);
            } else {
                console.log(`[ÖLÜ İŞÇİ] Başarıyla NİZAM'ın midesine (${urunler.length} ürün) bırakıldı. Uyku moduna geçiliyor.`);
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
// Örnek Çağrı:
// rakipVerisiKazi('https://www.zara.com/tr/tr/kadin-yeni-l1180.html', 'ZARA');
