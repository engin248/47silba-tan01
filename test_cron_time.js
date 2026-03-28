const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// ES Module formatını çalıştırmak için dinamik import kullanıyoruz
async function runTest() {
    try {
        console.log('[TEST] ajanlar-v2 yükleniyor...');
        const ajanlarPath = 'file:///' + path.join(__dirname, 'src', 'lib', 'ajanlar-v2.js').replace(/\\/g, '/');

        // Next.js özel aliasları çözemeyebilir, ancak src/lib içindeki saf Node fonksiyonları çalışabilir, 
        // fakat projede ESM / CommonJS kargaşası olabilir. Test edeceğiz.
        const module = await import(ajanlarPath);

        if (!module.sabahSubayi) {
            console.log('sabahSubayi fonksiyonu bulunamadı.');
            return;
        }

        console.log('[TEST] sabahSubayi() başlatıldı. Süre ölçümü devrede...');
        const startTime = Date.now();

        const sonuc = await module.sabahSubayi();

        const testSuresi = (Date.now() - startTime) / 1000;
        console.log(`[TEST SONUCU] sabahSubayi() çalıştı! Toplam Süre: ${testSuresi} saniye.`);
        console.log(`[BİLGİ] Eğer süre 10-60 saniyeyi aşıyorsa Vercel Serverless Function'da kesin olarak Timeout'a düşer.`);

    } catch (error) {
        console.error('[TEST BAŞARISIZ]', error);
    }
}

runTest();
