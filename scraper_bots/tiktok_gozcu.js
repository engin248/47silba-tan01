const puppeteer = require('puppeteer');

/**
 * 2. DIŞ SAHA BOTU: TİKTOK GÖZCÜSÜ
 * Görev: TikTok linkine gider, videoyu izler gibi yapar, sağ paneldeki beğen/paylaş oranlarını 
 * ve yorumlardaki "nerden aldın" hacmini çeker.
 * 56 Noktalı Merkezin "Viral Kopma Skoru" damarıdır.
 */
async function tiktokGozetiBaslat(videoUrl) {
    console.log(`[TIKTOK SAHA BOTU] Operasyon: TikTok Viral Analizi. Hedef: ${videoUrl}`);
    const tarayici = await puppeteer.launch({ headless: false });
    const sayfa = await tarayici.newPage();

    await sayfa.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        await sayfa.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`[TIKTOK SAHA BOTU] Sahaya inildi, videoya başlandı.`);

        // Videonun play tuşuna bas / izler gibi yap
        await sayfa.waitForSelector('video', { timeout: 10000 }).catch(() => { });
        await new Promise(r => setTimeout(r, 3000));

        // Metrikleri DOM üzerinden emme işlemi
        const metrikler = await sayfa.evaluate(() => {
            const statTextler = Array.from(document.querySelectorAll('strong[data-e2e]'));
            let data = { begeni: 0, yorum: 0, kaydetme: 0, paylasim: 0 };

            statTextler.forEach(el => {
                const tur = el.getAttribute('data-e2e');
                const degerStr = el.innerText || '0';
                // "1.2M", "500K" gibi stringleri parse etme eklenecek, şimdilik ham kayıt
                if (tur === 'like-count') data.begeni = degerStr;
                if (tur === 'comment-count') data.yorum = degerStr;
                if (tur === 'share-count') data.paylasim = degerStr;
                // TikTok yeni yapısında kaydetleri bul
                if (tur === 'undefined' || !tur) data.kaydetme = degerStr; // Genelde etiketsiz kalabiliyor
            });
            return data;
        });

        // Etkileşim oranı (Engagement Rate) için Müzik ve Hashtag tespiti
        const metadata = await sayfa.evaluate(() => {
            const hashtagler = Array.from(document.querySelectorAll('.tiktok-1p1f7f-A')).map(h => h.innerText);
            return { hashtagler };
        });

        console.log('[TIKTOK SAHA BOTU] Viral veri kopyalandı. Üs bölgesine dönülüyor.');
        await tarayici.close();

        return {
            platform: 'TikTok',
            metrikler,
            hashtagler: metadata.hashtagler,
            status: 'Veri Çekildi'
        };

    } catch (error) {
        console.error(`[TIKTOK SAHA BOTU] Hedef video patlak: ${error.message}`);
        if (tarayici) await tarayici.close();
        return { error: error.message };
    }
}

module.exports = { tiktokGozetiBaslat };
