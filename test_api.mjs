import fetch from 'node-fetch'; // Veya native fetch (Node 18+)
const devUrl = 'http://localhost:3000/api/cron-ajanlar?gorev=sabah_ozeti';

async function testApi() {
    console.log('[TEST] Localhost API\'sine İstek Atılıyor: ' + devUrl);
    const start = Date.now();
    try {
        const res = await fetch(devUrl, {
            headers: {
                'Authorization': `Bearer undefined`,
                'x-internal-api-key': '23df147da42cde8d4643d01691b3efb36473fe348c73a34b1afcf84da5d6e489'
            }
        });
        const text = await res.text();
        const duration = (Date.now() - start) / 1000;
        console.log(`[BAŞARILI] SÜRE: ${duration} saniye`);
        console.log(`[YANIT] ${text.slice(0, 500)}`);
    } catch (e) {
        console.log('[HATA]', e.message);
    }
    process.exit(0);
}

testApi();
