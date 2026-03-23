/**
 * ==========================================================
 * M4 Otonom Edge Vision Bridge - LOKAL KURYE (NODE.JS)
 * ==========================================================
 * 
 * Bu dosya fabrikanın iç ağında (192.168.x.x) örneğin bir bilgisayarda
 * veya kameraya bağlı bir Raspberry Pi'de çalıştırılır.
 * 
 * Görevi: UNV Kameralarından veya AI modelinden (Python/YOLO vb) 
 * gelen anlık sayım olaylarını yakalamak ve Karargah'a (Bulut/Vercel) postalamaktır.
 * 
 * -- KULLANIM --
 * 1. Eğer Node.js yüklüyse terminali açıp şu komutu girin:
 *    node scripts/m4_edge_vision_bridge.mjs
 */

import http from 'http';
import https from 'https';

// --- AYARLAR (Lütfen Canlı Ortama Göre Değiştirin) ---
// Karargah Vercel Adresiniz
const VERCEL_API_URL = process.env.VERCEL_API_URL || 'http://localhost:3000/api/m4-vision';
// Next.js uygulamanızdaki .env dosyanızda yer alan CRON_SECRET veya özel bir Bearer Token
const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret';

// Kameranın Kimliği
const KAMERA_IP = '192.168.1.104';
const KAMERA_ADI = 'Üretim Bandı - Son Kontrol';

console.log(`[M4-EDGE] Vision Bridge Başlatıldı 🚀`);
console.log(`[M4-EDGE] Hedef Karargah: ${VERCEL_API_URL}`);

/**
 * Kamera veya AI motorundan gelen olayı Vercel'e (Buluta) kuryeler.
 * @param {string} olayTipi - Örn: 'gecis_basarili', 'gecis_hatali', 'personel_tespiti'
 * @param {object} ekstraTespiter - Modelden gelen ek veriler
 */
function sendEventToCloud(olayTipi, ekstraTespiter = {}) {
    console.log(`[M4-EDGE] Olay yakalandı [${olayTipi}]. Buluta kuryeleniyor...`);

    const payload = JSON.stringify({
        kamera_ip: KAMERA_IP,
        kamera_adi: KAMERA_ADI,
        olay_tipi: olayTipi,
        guven_skoru: parseFloat((0.95 + (Math.random() * 0.04)).toFixed(3)), // %95-%99 Arası Skoru Simüle Et
        ek_bilgi: ekstraTespiter
    });

    const parsedUrl = new URL(VERCEL_API_URL);
    const requestModule = parsedUrl.protocol === 'https:' ? https : http;

    const req = requestModule.request(VERCEL_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CRON_SECRET}`, // Güvenlik Kimliği
            'Content-Length': Buffer.byteLength(payload)
        }
    }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`[M4-EDGE] ✅ Bulut Onayı: Veri başarıyla işlendi.`);
            } else {
                console.error(`[M4-EDGE] ❌ Bulut Reddi (${res.statusCode}): ${data}`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`[M4-EDGE] ⚠️ Karargaha (Vercel) Ulaşılamıyor: ${e.message}`);
    });

    req.write(payload);
    req.end();
}

// === UYGULAMA DÖNGÜSÜ (DEMO SİMÜLASYONU) ===
// Gerçek ortamda burası RTSP Frame Parser veya Python'dan gelen TCP tetikleyicisi olur.
// Şu an için sistemin çalıştığını test etmek adına her 10 saniyede bir sahte (mock) veri atılır.

console.log(`[M4-EDGE] Sensörler dinlemede. Görüntüler (RTSP) işleniyor ve 10 saniyede bir buluta veri basılacak.`);

setInterval(() => {
    // 5 ihtimalden birini rastgele seç (Simülasyon)
    const islemTipleri = ['gecis_basarili', 'gecis_basarili', 'gecis_basarili', 'hata_tespiti', 'gecis_basarili'];
    const rastgeleOlay = islemTipleri[Math.floor(Math.random() * islemTipleri.length)];

    sendEventToCloud(rastgeleOlay, {
        tespit_zamani_ms: Date.now(),
        isik_durumu: 'Iyi (Simüle Edilen Frame)'
    });

}, 10000); // 10 Saniye
