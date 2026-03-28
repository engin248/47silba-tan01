const cluster = require('cluster');
const os = require('os');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const numCPUs = os.cpus().length;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// EĞER ÇALIŞILAN ORTAM PRODUCTION İSE VE ANA İŞLEM (MASTER) İYSE
if (cluster.isPrimary && !dev) {
    console.log(`[🚀 OTONOM CLUSTER] Sistem Başlatılıyor... Toplam Çekirdek Sayısı: ${numCPUs}`);

    // Her bir işlemci çekirdeği için Node.js'i kopyala (Klonla)
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Eğer ajanların veya ağır scraping/kamera işlemlerinin olduğu bir çekirdek çökerse
    // Otonom olarak o çekirdeği yeniden ayaklandır.
    cluster.on('exit', (worker, code, signal) => {
        console.log(`[⚠️ DİKKAT] İşçi (PID: ${worker.process.pid}) çöktü! Yeni bir Karargah çekirdeği klonlanıyor...`);
        cluster.fork();
    });
} else {
    // ÇEKİRDEKLER (WORKERS)
    app.prepare().then(() => {
        createServer((req, res) => {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        }).listen(3000, (err) => {
            if (err) throw err;
            console.log(`[✅ Aktif Çekirdek PID: ${process.pid}] V2 Mizanet Port 3000 üzerinde devrede.`);
        });
    });
}
