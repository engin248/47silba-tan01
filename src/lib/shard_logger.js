const fs = require('fs');
const path = require('path');

// Log dizinini garanti altına al
const LOG_DIR = path.join(process.cwd(), 'logs', 'raw_scraper_data');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Supabase yerine kullanılacak Ham Veri (Çöp Veri) Havuzu.
 * Verileri NDJSON (Newline Delimited JSON) formatında kaydeder.
 * Çok yüksek I/O hızına sahiptir, veritabanı kilitlenmesi yapmaz.
 * 
 * @param {string} kaynak Ajanın veya modülün adı (örn: 'tiktok_scraper')
 * @param {object} veri Kaydedilecek ham JSON data
 */
function HamVeriYaz(kaynak, veri) {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString();
        // Günlük log dosyası (örn: 2026-03-18.log - Rotate edilmesi kolay)
        const tarih = timestamp.split('T')[0];
        const dosyaYolu = path.join(LOG_DIR, `${kaynak}_${tarih}.log`);

        const satir = JSON.stringify({ rcv_time: timestamp, payload: veri }) + '\n';

        // Dosyaya ekleme (Event Loop'u bloklamamak için async)
        fs.appendFile(dosyaYolu, satir, 'utf8', (err) => {
            if (err) {
                console.error(`[SHARD LOGGER] Ham Veri yazılamadı (${kaynak}):`, err);
                return reject(err);
            }
            resolve(true);
        });
    });
}

/**
 * İstenilen kaynağın loglarını okur (İleride AI'a veya Dezenfektana beslemek için)
 */
function HamVeriOku(kaynak, tarih) {
    const dosyaYolu = path.join(LOG_DIR, `${kaynak}_${tarih}.log`);
    if (!fs.existsSync(dosyaYolu)) return [];

    const icerik = fs.readFileSync(dosyaYolu, 'utf8');
    const satirlar = icerik.split('\n').filter(s => s.trim() !== '');
    return satirlar.map(s => JSON.parse(s));
}

module.exports = {
    HamVeriYaz,
    HamVeriOku
};
