require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Supabase Bağlantısı (Kasa/Hafıza)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function sicakSatisRadari() {
    console.log('🔥 [SICAK SATIŞ RADARI] Motorlar Ateşlendi. Trendyol\'a Gidiliyor...');
    console.log('Hedef: Orijinal görseller, güncel satış hızları (Sadece OKUYARAK analiz)...');

    const browser = await puppeteer.launch({
        headless: false, // İlk etapta gözle görmek için (tarayıcıyı açacak)
        defaultViewport: { width: 1366, height: 768 },
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();

    // Abiye - Kadın Elbise kategorisi (Burası yarının parlayan yıldızlarının çıktığı yerdir)
    const hedefKategoriUrl = 'https://www.trendyol.com/kadin-elbise-x-g1-c56';
    console.log(`Radar Hedefi Kilitlendi: ${hedefKategoriUrl}`);

    try {
        // 1. AŞAMA: İNSAN GİBİ GİRİŞ VE OKUMA YAP
        await page.goto(hedefKategoriUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('✅ Kategori sayfası açıldı. Resimler ve verilerin yüklenmesi bekleniyor...');

        // Sayfayı biraz aşağı kaydırarak resimlerin (lazy load) tam yüklenmesini sağla (İnsan taklidi)
        await page.evaluate(async () => {
            for (let i = 0; i < 12; i++) {
                window.scrollBy(0, 600);
                await new Promise(resolve => setTimeout(resolve, 400));
            }
        });

        // 2. AŞAMA: EKrandaki VERİYİ "OKU"
        const urunler = await page.evaluate(() => {
            // İlk 15 ürünü "Vitrin" olarak alalım
            const items = Array.from(document.querySelectorAll('.p-card-wrppr')).slice(0, 15);
            return items.map(item => {
                const id = item.dataset.id;
                const link = item.querySelector('a')?.href;
                const ad = item.querySelector('.prdct-desc-cntnr-name')?.textContent?.trim() || '';
                const marka = item.querySelector('.prdct-desc-cntnr-ttl')?.textContent?.trim() || '';
                const resim = item.querySelector('img.p-card-img')?.src;

                // Verileri parçalama
                const ratingCount = item.querySelector('.ratingCount')?.textContent?.trim().replace(/[{()}]/g, '') || '0';
                const fiyat = item.querySelector('.prc-box-dscntd')?.textContent?.trim() || '0 TL';
                const sonZamanSatis = item.querySelector('.social-proof-text')?.textContent?.trim() || 'Veri Yok';

                return {
                    urun_id: id,
                    ad: `${marka} - ${ad}`,
                    fiyat: fiyat,
                    resim_url: resim,
                    link,
                    rating_count: parseInt(ratingCount) || 0,
                    sicak_satis_bilgisi: sonZamanSatis
                };
            });
        });

        console.log(`\n📦 ${urunler.length} ürün TERTEMİZ OKUNDU! Şimdi DÜNKÜ verilerle (DELTA) Kıyaslıyoruz...\n`);

        // 3. AŞAMA: SİSTEM HAFIZASIYLA (SUPABASE) KIYASLAMA VE KARAR
        for (let urun of urunler) {
            if (!urun.urun_id) continue;

            // Kendi zihnimizden (Ar-Ge tablosundan) dünkü halini soralım
            const { data: eskiVeri } = await supabase
                .from('b1_arge_products')
                .select('*')
                .eq('product_id', urun.urun_id)
                .single();

            let karar = "BEKLE";
            let mesaj = "";

            if (eskiVeri) {
                // DÜN VARDI, BUGÜN DE VAR: HIZI ÖLÇ!
                const yorumFarki = urun.rating_count - (eskiVeri.review_count || 0);

                if (yorumFarki > 5) {
                    karar = "ÜRET (BİNGO!! 🎉)";
                    mesaj = `Son 24 saatte ${yorumFarki} yeni yorum/favori patlaması var! Bu YARIN SATACAK!`;
                } else {
                    karar = "İZLE";
                    mesaj = `Hız stabil (Yorum Artışı: ${yorumFarki}). Satışlar rutin.`;
                }
            } else {
                karar = "RADARA AL (YENİ)";
                mesaj = "Keşif yapıldı. İlk gün verisi olarak hafızaya yazılıyor.";

                // Yeni ürünü veritabanımıza (ArGe zihnimize) "Okuduk" diyerek kaydediyoruz
                try {
                    await supabase.from('b1_arge_products').insert([{
                        product_id: urun.urun_id,
                        name: urun.ad,
                        price: parseFloat(urun.fiyat.replace(' TL', '').replace(/\./g, '').replace(',', '.')) || 0,
                        image_url: urun.resim_url,
                        product_url: urun.link,
                        review_count: urun.rating_count,
                        last_checked_at: new Date().toISOString()
                    }]);
                } catch (e) { /* Tablo eksikse devam et, çöktürme */ }
            }

            console.log(`[${karar}] ${urun.ad.substring(0, 35)}...`);
            console.log(`    ↳ Fiyat: ${urun.fiyat} | Ekran Okuması: ${urun.sicak_satis_bilgisi}`);
            console.log(`    ↳ Orijinal Görsel: ${urun.resim_url}`);
            console.log(`    ↳ Sinyal: ${mesaj}\n`);
        }

        console.log('✅ Mizanet VİZYONU BAŞARIYLA TAMAMLANDI: Yarının modası ekranınızda şifrelendi.');

    } catch (err) {
        console.error('❌ Radar Vizyon Hatası: ', err.message);
    } finally {
        console.log('Tarayıcı iz bırakmamak için 8 saniye sonra kapatılıyor...');
        setTimeout(async () => await browser.close(), 8000);
    }
}

sicakSatisRadari();
