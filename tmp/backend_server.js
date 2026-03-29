require('dotenv').config({ path: __dirname + '/.env.local' });
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// Guvenlik: Sadece yetkili cron veya frontend istekleri
const AUTH_SECRET = `Bearer ${process.env.CRON_SECRET || 'dev_secret'}`;

// Basit Kuyruk ve Isletim Kilidi
let isJobRunning = false;

app.post('/api/kuyruk-motoru', (req, res) => {
    // 1. GUVENLIK KONTROLU (Auth Bypass Onlemi)
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== AUTH_SECRET) {
        console.warn(`[DIKKAT] Yetkisiz eylem girisimi engellendi. Gelen Header: ${authHeader}`);
        return res.status(403).json({ error: 'Erisim Reddedildi: Askeri Seviye Yonetici Izni Gerektirir' });
    }

    // 2. DARBOGAZ / BELLEK KONTROLU (Bottleneck Onlemi)
    if (isJobRunning) {
        console.warn('[DIKKAT] Yeni eylem engellendi. Mevcut gorev kuyrukta islenirken eszamanli eylem yasaklanmistir.');
        return res.status(429).json({ error: 'Mevcut gorev isleniyor, kuyruk dolu. Ajan yorulmasi (Memory Leak) engellendi.' });
    }

    // 3. EYLEM
    try {
        isJobRunning = true;
        console.log('[BACKEND] kuyruk-motoru yetkilendirildi ve tetiklendi. oluisci.js baslatiliyor...');

        exec('node scraper_bots/oluisci.js', (err, stdout, stderr) => {
            isJobRunning = false; // Islem bitince kilidi kaldir
            if (err) console.error('[HATA] oluisci.js:', err);
            if (stdout) console.log(stdout);
            console.log('[BACKEND] oluisci.js gorevini tamamladi. Kilit acildi.');
        });

        res.json({ success: true, message: 'Backend oluisci.js botu yetkilendirildi ve kuyruga basariyla alindi.' });
    } catch (e) {
        isJobRunning = false; // Hata durumunda kilidi mutlaka kaldir
        res.status(500).json({ error: e.message });
    }
});

// Diger botlarin apileri gerekirse buraya eklenecektir

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`[BACKEND SERVER] Aktif. Port: ${PORT} uzerinde dinleniyor.`);
});
