const { KuyrugaEkle } = require('./src/lib/redis_kuyruk.js');

async function savasOyunuBaslat() {
    console.log(`\n⚔️ [SAVAŞ SİMÜLASYONU] Sentinel Kalkanı, Kill Switch ve Kural 16 (Reenkarnasyon) Testi Başlıyor...`);

    // 1. Zehirli Mermi (Timeout / Sonsuz Döngü)
    console.log(`[ATILAN YEM 1] Zehirli Hedef (65s Timeout) kuyruğa ekleniyor...`);
    await KuyrugaEkle('scraper_jobs', {
        hedef: 'SIMULASYON_ZEHIRLI_TIMEOUT',
        saha_ajani: 'TestAjan_Timeout',
        test_modu: 'timeout'
    });

    // 2. Patlayıcı Mermi (Anında Crash)
    console.log(`[ATILAN YEM 2] Patlayıcı Hedef (Anında Crash) kuyruğa ekleniyor...`);
    await KuyrugaEkle('scraper_jobs', {
        hedef: 'SIMULASYON_PATLAYICI_CRASH',
        saha_ajani: 'TestAjan_Crash',
        test_modu: 'crash'
    });

    console.log(`\n🎯 Savaş Simülasyonu Mermileri Redis Kuyruğuna Sürüldü!`);
    console.log(`Testi izlemek için Terminalden 'node worker.js' çalıştırılarak Sentinel'in infaz yeteneği ve Karargah yansımaları izlenecektir.`);

    // Upstash Redis REST asenkron tamamlanması için ufak bir bekleme
    setTimeout(() => { process.exit(0); }, 3000);
}

savasOyunuBaslat();
