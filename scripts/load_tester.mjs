import { parseArgs } from 'util';

const args = parseArgs({
    options: {
        url: { type: 'string', short: 'u' },
        count: { type: 'string', short: 'c', default: '100' },
        concurrency: { type: 'string', short: 'w', default: '10' }
    }
});

const { url, count: countStr, concurrency: concurrencyStr } = args.values;

if (!url) {
    console.error("❌ Hedef URL belirtilmek zorundadır. Kullanım: node scripts/load_tester.mjs --url=http://localhost:3000/api/cron-ajanlar --count=500 --concurrency=20");
    process.exit(1);
}

const count = parseInt(countStr, 10);
const concurrency = parseInt(concurrencyStr, 10);

console.log(`🚀 [NİZAM Yük Testi] Başlıyor...`);
console.log(`🎯 Hedef: ${url}`);
console.log(`📦 Toplam İstek: ${count}`);
console.log(`⚡ Eşzamanlı İşlem (Worker): ${concurrency}\n`);

const startTime = Date.now();
let completed = 0;
let success = 0;
let failed = 0;
const statusCodes = {};
const latencies = [];

// Worker fonksiyonu
async function worker(workerId) {
    while (completed < count) {
        completed++;
        const currentReq = completed;
        const reqStart = Date.now();

        try {
            // Vercel/Node Cache'lerini kırmak için rastgele parametre ekleniyor
            const noCacheUrl = new URL(url);
            noCacheUrl.searchParams.append('_nocache', Date.now().toString() + Math.random().toString(36).substring(7));

            const res = await fetch(noCacheUrl.toString(), {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'User-Agent': 'Nizam-Load-Tester/1.0'
                },
                signal: AbortSignal.timeout(15000) // 15 sn timeout
            });

            const latency = Date.now() - reqStart;
            latencies.push(latency);

            statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;

            if (res.ok) {
                success++;
            } else {
                failed++;
            }

            // Progress bar (basit)
            if (completed % Math.ceil(count / 10) === 0) {
                console.log(`[İlerleme] %${Math.round((completed / count) * 100)} (${completed}/${count}) tamamlandı.`);
            }

        } catch (err) {
            const latency = Date.now() - reqStart;
            latencies.push(latency);
            failed++;

            let errorType = err.name || 'Bilinmeyen Hata';
            if (err.name === 'TimeoutError') errorType = 'ZamanAşımı';
            if (err.cause?.code) errorType = err.cause.code;

            statusCodes[errorType] = (statusCodes[errorType] || 0) + 1;
        }
    }
}

async function run() {
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
        workers.push(worker(i));
    }

    await Promise.allSettled(workers);

    const totalTime = Date.now() - startTime;
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    // %95. Persentil (P95) Gecikme Skoru
    latencies.sort((a, b) => a - b);
    const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;

    const reqPerSec = (count / (totalTime / 1000)).toFixed(2);

    console.log(`\n==========================================`);
    console.log(`📋 [STRES TESTİ SONUÇ RAPORU]`);
    console.log(`==========================================`);
    console.log(`⏱️ Toplam Süre      : ${(totalTime / 1000).toFixed(2)} Saniye`);
    console.log(`📈 İstek / Saniye (RPS) : ${reqPerSec} req/sec`);
    console.log(`✅ Başarılı İstek     : ${success}`);
    console.log(`❌ Hatalı İstek     : ${failed}`);
    console.log(`------------------------------------------`);
    console.log(`📊 Ortalama Gecikme   : ${avgLatency} ms`);
    console.log(`📊 P95 Gecikme (Max)  : ${p95} ms`);
    console.log(`------------------------------------------`);
    console.log(`HTTP Durum Kodları:`);
    Object.entries(statusCodes).forEach(([code, c]) => {
        console.log(`  - ${code} : ${c} adet`);
    });
    console.log(`==========================================\n`);
}

run().catch(console.error);
