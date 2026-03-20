<<<<<<< HEAD
// ╔══════════════════════════════════════════════════════════════════╗
// ║ [ARŞİV] Bu dosya 16.03.2026'da oluisci.js ile birleştirildi.  ║
// ║ AKTİF DEĞİLDİR. Referans olarak korunmaktadır.                ║
// ║ Güncel versiyon: src/scripts/scrapers/oluisci.js                ║
// ╚══════════════════════════════════════════════════════════════════╝
=======
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
/**
 * NİZAM (THE ORDER) - 1. EKİP ÜYESİ: "ÖLÜ İŞÇİ" (THE SCRAPER)
 * DEPARTMAN: Ar-Ge (M1) Veri Toplama Katmanı
 * 
 * Görev Sınırları: Sadece internette (Trendyol, Zara, Instagram vb.) bir fare gibi dolaşır.
 * YORUM YAPMAZ. PUAN HESAPLAMAZ. KARAR VERMEZ. (Çakışma Kalkanı Aktif).
 * Bulduğu ham veriyi (fiyat, ürün adı, yıldız sayısı, model kalıbı) Supabase veritabanındaki 
 * 'products' (b1_arge_products) tablolarına fırlatır ve geri çekilir. Cansız ve hissizdir.
 *
 * Teknoloji: Node.js, Puppeteer (Web Kazıma Fare API'si), Supabase
 */

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer'; // İnsan hareketini taklit eden gezgin

// Supabase Bağlantısı (NİZAM Ana Veritabanı) Dışarıdan yetki ile bağlanır.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxxxxxxxxxxx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'gizli-admin-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export class OluIsciScraper {

    constructor() {
<<<<<<< HEAD

=======
        console.log("🛠️ Ölü İşçi (Scraper Ajanı) uyandı. Çakışma Kalkanı Devrede. Sadece VERİ TOPLANACAK.");
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    }

    /**
     * AJAN 1: E-TİCARET TARAYICI (Trendyol / Zara Örneği)
     * Görevi: Pazar yerinden ürün adı, güncel etiket fiyatı, yorum sayısını çekip M1 havuzuna yığar.
     */
    async eTicaretTara(aramaKelimesi, platform = 'Trendyol') {
<<<<<<< HEAD
=======
        console.log(`[Ajan 1] ${platform} platformunda "${aramaKelimesi}" kelimesi taranıyor...`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

        let browser;
        try {
            // Arka planda başsız tarayıcı açar (Gezgin Ajan iş başında)
            browser = await puppeteer.launch({ headless: "new" });
            const page = await browser.newPage();

            // Trendyol veya Zara URL'ine göre yönlendirme (Örnek Trendyol)
            const searchUrl = platform === 'Trendyol' ? `https://www.trendyol.com/sr?q=${encodeURIComponent(aramaKelimesi)}` : `https://www.zara.com/...`;

            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

            // Ürün kartlarından Cansız Varlık (Ölü İşçi) gibi veri süzme (DOM Scraping)
            const toplananVeriler = await page.evaluate(() => {
                const urunKartlari = Array.from(document.querySelectorAll('.p-card-wrppr')).slice(0, 10); // Veriyi sömür

                return urunKartlari.map(kart => {
                    const marka = kart.querySelector('.prdct-desc-cntnr-ttl')?.innerText || '';
                    const isim = kart.querySelector('.prdct-desc-cntnr-name')?.innerText || '';
                    const fiyatText = kart.querySelector('.prc-box-dscntd')?.innerText || '0';
                    const yorumSayisiText = kart.querySelector('.ratingCount')?.innerText || '0';

                    // Hissiz matematiksel dönüştürmeler (Örn: "1.250,50 TL" -> 1250.50)
                    const fiyat = parseFloat(fiyatText.replace(' TL', '').replace('.', '').replace(',', '.'));
                    const yorumSayisi = parseInt(yorumSayisiText.replace(/[^\d]/g, '')) || 0;

                    return {
                        product_name: `${marka} ${isim}`.trim(),
                        category: 'Kazınan Ham Veri',
                        price_range: fiyat.toString(),
                        ham_yorum_sayisi: yorumSayisi // Sadece sayıyı alır, 'çok satıyor' yorumu yapmaz!
                    };
                });
            });

<<<<<<< HEAD
=======
            console.log(`[Ajan 1] Toplam ${toplananVeriler.length} ham veri bloku çekildi. Supabase'e fırlatılıyor...`);

>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            // ÇAKIŞMA KALKANI: Karar yok, sadece Supabase insert işlemi
            for (const urun of toplananVeriler) {
                const { data, error } = await supabase
                    .from('products') // Mimarinizdeki ana şema / veya M1 tablonuz
                    .insert([{
                        product_name: urun.product_name,
                        category: aramaKelimesi,
                        price_range: urun.price_range
                    }])
                    .select();

                if (error) {
                    console.error("Veritabanı enjeksiyon hatası:", error.message);
                } else {
<<<<<<< HEAD

=======
                    console.log(`[Ölü İşçi] ID:${data[0].id} Veritabanına Başarıyla Bırakıldı.`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                    // Trend_data tablosuna (satış ivmesi için) kör ham veriyi yazar. Hesaplama Analist'e aittir.
                }
            }

            await browser.close();
            return true;

        } catch (err) {
            console.error("[Ajan 1] Tarama sırasında bot engele veya proxy hatasına takıldı:", err.message);
            if (browser) await browser.close();
            return false;
        }
    }

    /**
     * AJAN 2: SOKAK KÖPEĞİ (Sosyal Medya Hashtag / Viral Tarayıcı)
     * Görevi: Sadece ilgili hashtag'in kaç video/izlenme aldığına bakar. (Örn: #kargopantolon)
     * Yorum: YAPMAZ. Supabase'deki 'social_growth' sütununa sayıyı çarpar çıkar.
     */
    async sosyalMedyaTara(hashtag) {
<<<<<<< HEAD

=======
        console.log(`[Ajan 2] #${hashtag} etiketi TikTok/Insta üzerinden taranıyor... Veriler sepete (DB) konulacak.`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        // (Burada TikTok Unofficer API veya Apify Instagram Scraper kullanılır)
    }

    /**
     * AJAN 3: RAKİP SIZMASI (Yeni Koleksiyon İzleyici)
     * Görevi: Zara.com veya Rakip sitede "Yeni Gelenler" sayfasına bakar. 
     * Düne göre eklenen yeni ürünleri (URL ve resimi) çeker.
     */
    async rakipKoleksiyonIzle(rakipURL) {
<<<<<<< HEAD

=======
        console.log(`[Ajan 3] ${rakipURL} hedefine sızıldı. Sadece 'Yeni Eklenenler' HTML blokları kazınıyor.`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    }

    /**
     * AJAN 4: GÖMÜCÜ (Tüketici Şikayet ve 1-Yıldız Avcısı)
     * Görevi: Girdiği ürün sayfasında filtreden '1 Yıldız' olan yorumların metinlerini kopyalar.
     * Supabase'te bir text sütununa fırlatıp kaçar. Analizi o yapmaz.
     */
    async sikayetMetinleriniKazi(urunURL) {
<<<<<<< HEAD

=======
        console.log(`[Ajan 4] ${urunURL} üzerindeki tüm müşteri şikayet metinleri kopyalanıp depoya (DB) atılıyor.`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    }
}

// Sistemi çalıştırmak için örnek tetikleyici
// const isci = new OluIsciScraper();
// isci.eTicaretTara('kadın paraşüt pantolon', 'Trendyol');
