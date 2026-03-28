const puppeteer = require('puppeteer');

/**
 * 1. DIŞ SAHA BOTU: TRENDYOL GÖLGE AVCISI
 * Görev: Sayfaya girer, sepete ekler, beden/renk varyantlarına tıklar, yorum sekmesini açar.
 * 56 Noktalı Karar Merkezi'nin "Sepet Deltası" ve "Yorum Zehri" verisi için çalışır.
 */
async function trendyolAviniBaslat(urunUrl) {
    console.log(`[TRENDYOL SAHA BOTU] Harekete Geçildi. Hedef: ${urunUrl}`);
    const tarayici = await puppeteer.launch({ headless: false }); // Gerçek tarayıcı gibi davranması için headless kapatılabilir
    const sayfa = await tarayici.newPage();

    // Bot yakalanmamak için insan gibi davranır
    await sayfa.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        await sayfa.goto(urunUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log(`[TRENDYOL SAHA BOTU] Sayfaya sızıldı, tarama başlıyor...`);

        // 1. Orijinal ve İndirimli Fiyatı Çek
        const fiyatlar = await sayfa.evaluate(() => {
            const indirimli = document.querySelector('.prc-dsc')?.innerText || '0';
            const orijinal = document.querySelector('.prc-org')?.innerText || indirimli;
            return { indirimli, orijinal };
        });

        // 2. Favori (Koleksiyon) Sayısını Çek
        const favoriSayisi = await sayfa.evaluate(() => {
            const favEl = document.querySelector('.fv-dtls span');
            return favEl ? parseInt(favEl.innerText.replace(/[^0-9]/g, '')) : 0;
        });

        // 3. İnsan gibi aşağı kaydır ve yorumlara tıkla (Yorum Zehri Analizi için)
        await sayfa.evaluate(() => window.scrollBy(0, 1000));
        await new Promise(r => setTimeout(r, 1000));

        // Yorumlar tabına tıkla
        const yorumTabBtn = await sayfa.$('.pr-rv-tab');
        if (yorumTabBtn) {
            await yorumTabBtn.click();
            await new Promise(r => setTimeout(r, 2000));
        }

        // Toplam yorum sayısını ve ilk sayfa yıldızları çek
        const yorumVerisi = await sayfa.evaluate(() => {
            const toplam = document.querySelector('.pr-r-nr')?.innerText || '0';
            // İlk sayfadaki 1-2 yıldızlı sitemkâr kırık yorumların tespitini al
            const yorumYildizlari = Array.from(document.querySelectorAll('.star-w')).map(e => e.style.width);
            const dusukYildizliPuanlar = yorumYildizlari.filter(w => w === '20%' || w === '40%').length;
            return {
                toplam: parseInt(toplam.replace(/[^0-9]/g, '')),
                ilkSayfaKotuYorum: dusukYildizliPuanlar
            };
        });

        console.log('[TRENDYOL SAHA BOTU] İstihbarat toplandı. Çıkış yapılıyor.');
        await tarayici.close();

        return {
            platform: 'Trendyol',
            fiyatlar,
            favoriSayisi,
            yorumToplam: yorumVerisi.toplam,
            yorumZehri_1_ve_2_Yildiz: yorumVerisi.ilkSayfaKotuYorum,
            // Sepete Ekleme butonuna tıklayıp stoğu düşüren ileri seviye delta işlemi için ayrılan yer (Şef Bot yönetecek)
            status: 'Veri Çekildi'
        };

    } catch (error) {
        console.error(`[TRENDYOL SAHA BOTU] Hedef vurulamadı: ${error.message}`);
        if (tarayici) await tarayici.close();
        return { error: error.message };
    }
}

module.exports = { trendyolAviniBaslat };
