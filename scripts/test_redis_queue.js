const { KuyrugaEkle } = require('../src/lib/redis_kuyruk');

async function STRESS_TEST() {
    console.log("[STRESS TEST] Redis Kuyruğuna 10 adet sahte AI işi basılıyor...");
    for (let i = 1; i <= 10; i++) {
        await KuyrugaEkle('ai_jobs', {
            ajan_adi: 'STRESS_TEST_BOT',
            istek_tipi: 'TEST_YUKU',
            prompt: `Sen bir Test asistanısın. Bana sadece '${i}. Test Tamamlandı' yaz.`,
            hedef_tablo: null, // Sadece b1_agent_loglari'na yazsın
            hedef_veri: null
        });
    }
    console.log("[STRESS TEST] Başarıyla kuyruğa eklendi. Şimdi worker'ı başlatmalısınız.");
    process.exit(0);
}

STRESS_TEST();
