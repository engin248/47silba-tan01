const puppeteer = require('puppeteer');

/**
 * 3. DIŞ SAHA BOTU: INSTAGRAM RADAR BOTU
 * Görev: Moda/Butik sayfalarına veya reels linklerine sızıp "Kaydetme Oranı" ve 
 * "Yorumlardaki DM İsteği" oranını emer.
 */
async function instagramRadariBaslat(postUrl) {
    console.log(`[IG SAHA BOTU] Radar Dönüyor, Hedef IG Post: ${postUrl}`);
    const tarayici = await puppeteer.launch({ headless: false });
    const sayfa = await tarayici.newPage();

    await sayfa.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        await sayfa.goto(postUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`[IG SAHA BOTU] Posta sızıldı, tarama başlıyor...`);

        // Kaydedenler ve Beğenenler (IG girişi olmadan gizli kalabilir, DOM scrape yetenekleri)
        const analiz = await sayfa.evaluate(() => {
            // Instagram DOM değişkin olabilir, sınıf veya aria labellere göre arama
            const favIconCount = document.querySelectorAll('svg[aria-label="Şimdi Değil"]').length; // Örnek placeholder logic

            // Yorumlardaki "Fiyat?", "DM okurmusun" yoğunluk
            const yorumElements = Array.from(document.querySelectorAll('ul li span'));
            const dmIhtiyaci = yorumElements.filter(el =>
            (el.innerText.toLowerCase().includes('fiyat') ||
                el.innerText.toLowerCase().includes('dm') ||
                el.innerText.toLowerCase().includes('ne kadar'))
            ).length;

            return { yorumlardakiSatinAlmaNiyeti: dmIhtiyaci };
        });

        console.log('[IG SAHA BOTU] Veri avlandı, üsse dönülüyor.');
        await tarayici.close();

        return {
            platform: 'Instagram',
            SatinAlmaNiyetiGostergesi: analiz.yorumlardakiSatinAlmaNiyeti,
            status: 'Veri Çekildi'
        };

    } catch (error) {
        console.error(`[IG SAHA BOTU] Postta duvar var (Hedef vurulamadı): ${error.message}`);
        if (tarayici) await tarayici.close();
        return { error: error.message };
    }
}

module.exports = { instagramRadariBaslat };
