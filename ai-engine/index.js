import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { getCameraFrame, analyzeMotion } from './lib/motionDetector.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') }); // [H3 FIX] mutlak path

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // [H4 FIX] ANON_KEY → SERVICE_ROLE_KEY (RLS bypass)
const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL || 'http://localhost:1984';
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL || '15000', 10); // 15 Saniye Varsayilan 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🤖 THE ORDER / NIZAM Faz 4: AI Uretim Analiz Motoru Baslatiliyor...');
console.log(`⏱️ Polling Calsima Araligi: ${POLLING_INTERVAL / 1000} saniye / Kamera\n`);

// Stateler
let kameralar = [];
const kameraDurumlari = {}; // Hareketsizlik suresi (bant durusu) vs

/**
 * 1. DB'den Aktif Kameralari Cek
 */
async function loadCameras() {
    try {
        const { data, error } = await supabase.from('cameras').select('*').eq('status', 'online');
        if (error) throw error;
        kameralar = data || [];
        console.log(`✅ ${kameralar.length} adet Aktif Kamera Sisteme Baglandi.`);
    } catch (e) {
        console.error('❌ Kamera yukleme hatasi:', e.message);
    }
}

/**
 * Anomali Veritabanina Yazdir ve Bildirim At (Bu mock ornegidir)
 */
async function triggerAnomaly(kamera, reason, photoUrl = null) {
    console.log(`\n🚨 [ANOMALI TESPITI] Kamera: ${kamera.name} (${kamera.work_center}) -> ${reason} 🚨`);

    try {
        await supabase.from('camera_events').insert([{
            camera_id: kamera.id,
            event_type: 'anomaly',
            video_url: photoUrl
        }]);
    } catch (e) {
        // [H5 FIX] sessiz catch kaldırıldı — anomali kaybı loglanıyor
        console.error(`[❌ ANOMALİ KAYIT HATASI] Kamera: ${kamera.name} | Sebep: ${e.message}`);
    }
}

/**
 * 2. Hybrid AI - Recursive Polling Taramasi (Race Condition Engellendi)
 */
async function monitorCameras() {
    if (kameralar.length > 0) {
        for (const kam of kameralar) {
            // Alt Yayin (Sub) kullanilir, ag yorulmasin!
            const src = `${kam.src}_sub`;

            try {
                const frame = await getCameraFrame(GO2RTC_URL, src);
                if (!frame) continue;

                const analysis = analyzeMotion(kam.id, frame);
                if (!analysis.motionScore) continue;

                const score = parseFloat(analysis.motionScore);
                const HAREKET_LIMITI = 0.05;

                if (!kameraDurumlari[kam.id]) {
                    kameraDurumlari[kam.id] = { idleCount: 0 };
                }

                if (score < HAREKET_LIMITI) {
                    kameraDurumlari[kam.id].idleCount += 1;
                    if (kameraDurumlari[kam.id].idleCount === 3) {
                        await triggerAnomaly(kam, 'BANT / ORTAM HAREKETSIZLIGI (45 Saniye İşçi Yok / Band Durdu)');
                    }
                } else {
                    kameraDurumlari[kam.id].idleCount = 0;
                }

                process.stdout.write(`\r👀 [RADAR] ${kam.name.padEnd(15)} | Hareket: %${analysis.motionScore.padStart(6)} | Frame: ${frame.width}x${frame.height} | Alert/Wait: ${kameraDurumlari[kam.id].idleCount}/3          `);

            } catch (error) {
                // Kamera anlik ulasilamaz
            }
        }
    }

    // Recursive delay for the next poll step
    setTimeout(monitorCameras, POLLING_INTERVAL);
}

// =======================
// SYSTEM BOOTSTRAP
// =======================
(async () => {
    await loadCameras();
    // 5 Dakikada bir kamera listesini yenile
    setInterval(loadCameras, 5 * 60 * 1000);

    // Initial launch of the polling loop
    monitorCameras();
})();
