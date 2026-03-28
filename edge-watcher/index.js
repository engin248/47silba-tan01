const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') }); // [H3-edge FIX] mutlak path

// ─── NIZAM AKILLI MELEZ (HYBRID) MİMARİ — EDGE WATCHER ──────────
// SIFIRA YAKIN FİNANSAL YÜK PRENSİBİ İLE ÇALIŞIR
// Sadece hareket algısına (bedava-yerel) bakar.
// 2 dakika hareketsizlik varsa fotoğrafı buluta (Karargah API) gönderip analiz (ücretli AI) ister.

// --- AYARLAR ---
// 1 kare örnekleme sıklığı (her 3 saniyede 1 kez)
const INTERVAL_MS = 3000;
// Hareketsizlik limiti = 2 dakika (120 saniye)
const NO_MOTION_LIMIT_MS = 120000;
// Piksel farkı oranı %X ise "hareket var" sayılır (çok ufak oynamaları rüzgar sayar). Rakam küçükse hassastır.
const MOTION_THRESHOLD = 0.05;

// Karargah Vercel Sunucu URL'i:
const KARARGAH_API = process.env.KARARGAH_API_URL || 'http://localhost:3000/api/ajan-tetikle';
if (!process.env.INTERNAL_API_KEY) { console.error('❌ INTERNAL_API_KEY eksik! .env.local dosyasına ekleyin.'); process.exit(1); } // [H1 FIX] hardcoded fallback kaldırıldı
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// Geçici fotoğraf dizini
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// [H2 FIX] RTSP URL'ler .env.local'dan okunuyor — şifreler kod içinde değil
if (!process.env.RTSP_CAM_2 || !process.env.RTSP_CAM_3) { console.error('❌ RTSP_CAM_2 veya RTSP_CAM_3 .env.local eksik!'); process.exit(1); }
const KAMERALAR = [
    { id: 2, nvr: 'D2', name: 'Kesim Masası A', url: process.env.RTSP_CAM_2 },
    { id: 3, nvr: 'D3', name: 'Dikim Bandı 1', url: process.env.RTSP_CAM_3 },
];

let lastMotionTimes = {};
let lastImages = {};

// 1. FFMPEG ile RTSP'den 1 kare resim çek (Düşük çözünürlüklü)
const captureFrame = (camId, rtspUrl) => {
    return new Promise((resolve, reject) => {
        const outPath = path.join(TEMP_DIR, `cam_${camId}_latest.jpg`);
        // -y : overwrite, -vframes 1 : 1 kare al, -s 320x240 : cpu yormasın diye ufalt
        const cmd = `ffmpeg -rtsp_transport tcp -i "${rtspUrl}" -y -vframes 1 -q:v 5 -s 320x240 "${outPath}" -loglevel error`;

        exec(cmd, (err) => {
            if (err) return reject(err);
            resolve(outPath);
        });
    });
};

// 2. İki fotoğraf arasındaki hareket miktarını hesapla (Bedava %1 CPU ile)
const checkMotion = async (camId, newImagePath) => {
    try {
        const newBuf = await sharp(newImagePath).greyscale().raw().toBuffer();
        const oldBuf = lastImages[camId];

        lastImages[camId] = newBuf; // Sonrasını kaydet
        if (!oldBuf) return true; // İlk karede karşılaştırma olmaz

        let diffPixels = 0;
        const totalPixels = newBuf.length;

        // Çok basit piksel değişimi kontrolü (Sıfır maliyet)
        for (let i = 0; i < totalPixels; i++) {
            // İki gri ton arası 30 birim fark varsa piksel değişmiş say (gölgeleri eler)
            if (Math.abs(newBuf[i] - oldBuf[i]) > 30) {
                diffPixels++;
            }
        }

        const diffRatio = diffPixels / totalPixels;
        return diffRatio > MOTION_THRESHOLD; // Örneğin %5 değişim varsa hareket vardır.
    } catch (e) {
        console.error(`Görüntü işleme hatası (Cam ${camId}):`, e.message);
        return false;
    }
};

// 3. Buluta (Karargah GPT) fotoğraf at ve alarm ver (Sıfıra Yakın Maliyet)
const reportAnomalyToCloud = async (kamera) => {
    console.log(`\n🚨 Kriz Analizi (Sıfıra Yakın Finansal Yük): ${kamera.name} kamerasında 2 dakikadır HAREKET YOK! AI'a gönderiliyor...`);
    const imgPath = path.join(TEMP_DIR, `cam_${kamera.id}_latest.jpg`);

    // Fotoğrafı base64 yapıp Karargah'a atacağız, Karargah da GPT Vision'a atacak
    let base64Image = '';
    if (fs.existsSync(imgPath)) {
        base64Image = fs.readFileSync(imgPath, { encoding: 'base64' });
    }

    try {
        // Karargah API'sine POST
        await axios.post(KARARGAH_API, {
            ajanTipi: 'KAMERA_GIZLI_EDGE',
            kameraId: kamera.id,
            kameraAdi: kamera.name,
            sebep: '2_DK_IDLE',
            image: base64Image,
        }, {
            headers: {
                'x-internal-api-key': INTERNAL_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ ${kamera.name} için AI analizi tetiklendi. Telegram'a düşmesi bekleniyor.\n`);

        // Yeniden saymaya başlaması için süreyi sıfırla (Spam engeli)
        lastMotionTimes[kamera.id] = Date.now();

    } catch (err) {
        console.error('❌ Karargah (Bulut) sistemine bağlanılamadı:', err.message);
    }
};

// ── ANA DÖNGÜ (Main Loop) ──
const startWatcher = async () => {
    console.log(`\n======================================================`);
    console.log(`     THE ORDER / NIZAM — EDGE AI WATCHER BAŞLADI      `);
    console.log(` Felsefe: "Sıfıra Yakın Finansal Yük (Near-Zero Cost)"`);
    console.log(` İzlenen Bağımsız Bantlar: ${KAMERALAR.length}`);
    console.log(` İşlemci Yükü: ~%1 | AI API Maliyeti: Sadece Krizde`);
    console.log(`======================================================\n`);

    // Başlangıç zamanlarını ata
    const now = Date.now();
    KAMERALAR.forEach(k => { lastMotionTimes[k.id] = now; });

    setInterval(async () => {
        for (const cam of KAMERALAR) {
            try {
                const imgPath = await captureFrame(cam.id, cam.url);
                const hasMotion = await checkMotion(cam.id, imgPath);

                if (hasMotion) {
                    process.stdout.write(`\r[${new Date().toLocaleTimeString('tr-TR')}] ${cam.name} | Hareket: VAR   (Sistem Normal)     `);
                    lastMotionTimes[cam.id] = Date.now();
                } else {
                    const elapsedIdleMs = Date.now() - lastMotionTimes[cam.id];
                    process.stdout.write(`\r[${new Date().toLocaleTimeString('tr-TR')}] ${cam.name} | Hareket: YOK   (Bekleniyor: ${Math.floor(elapsedIdleMs / 1000)} sn)`);

                    // Kriz sınırına ulaştı mı?
                    if (elapsedIdleMs >= NO_MOTION_LIMIT_MS) {
                        await reportAnomalyToCloud(cam);
                    }
                }
            } catch (err) {
                // RTSP offline olabilir, sessiz kal
                process.stdout.write(`\r[${new Date().toLocaleTimeString('tr-TR')}] ${cam.name} | RTSP KAMERA ERİŞİLEMEDİ!     `);
            }
        }
    }, INTERVAL_MS);
};

startWatcher();
