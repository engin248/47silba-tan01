/**
 * G4 SAHA TESTİ — Kamera API Simülasyonu
 * Kullanım: node scripts/g4-kamera-simulasyon.js
 * 
 * Bu script, fabrikadaki bir kameranın "ürün gördüğünü" simüle eder.
 * 5 kez ping atarak /api/kamera-sayac'ı test eder.
 */

const http = require('http');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = 'https://mizanet.com';

function httpPost(url, body) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const mod = isHttps ? https : http;
        const data = JSON.stringify(body);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        const req = mod.request(options, (res) => {
            let out = '';
            res.on('data', chunk => out += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(out)); }
                catch (e) { resolve({ raw: out }); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function supabaseGet(tablo, select) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${tablo}?select=${select}&limit=3`);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        };
        const req = https.request(options, (res) => {
            let out = '';
            res.on('data', chunk => out += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(out)); }
                catch (e) { resolve([]); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function simulasyonYap() {
    console.log('\n🎬 G4 KAMERA SIMULASYONU BASLATILIYOR...\n');

    const personeller = await supabaseGet('b1_personel', 'id,ad_soyad,aylik_maliyet_tl');
    if (!personeller || personeller.length === 0 || personeller.code) {
        console.error('b1_personel tablosunda kayit bulunamadi. SQL testini once calistirin.');
        process.exit(1);
    }
    const personel = personeller[0];
    console.log('Isci: ' + personel.ad_soyad + ' | Aylik Maliyet: ' + personel.aylik_maliyet_tl + ' TL');

    const operasyonlar = await supabaseGet('b1_operasyon_tanimlari', 'id,operasyon_adi,baz_prim_tl');
    if (!operasyonlar || operasyonlar.length === 0 || operasyonlar.code) {
        console.error('b1_operasyon_tanimlari bos. SQL scriptini once calistirin.');
        process.exit(1);
    }

    let toplamDeger = 0;
    for (let i = 0; i < 5; i++) {
        const op = operasyonlar[i % operasyonlar.length];
        const adet = Math.floor(Math.random() * 100) + 50;
        const kalite = (7.5 + Math.random() * 2.5).toFixed(1);

        console.log('\nKAMERA PING #' + (i + 1) + ': "' + op.operasyon_adi + '" - ' + adet + ' adet...');

        try {
            const res = await httpPost(BASE_URL + '/api/kamera-sayac', {
                personel_id: personel.id,
                operasyon_id: op.id,
                adet,
                kalite_puani: parseFloat(kalite),
                kaynak_cihaz: 'Kamera_Sim_01'
            });

            if (res.success) {
                toplamDeger += res.isletmeyeKatilanDeger || 0;
                console.log('  Kayit basarili');
                console.log('  Bu islemden katilan deger: ' + (res.isletmeyeKatilanDeger || 0) + ' TL');
                console.log('  Amorti durumu: %' + res.amortiYuzdesi);
                console.log('  Prim yazildi mi: ' + (res.primYazildiMi ? 'EVET! ' + res.kazanilanPrim + ' TL' : 'Hayir'));
            } else {
                console.log('  API yaniti: ' + (res.error || JSON.stringify(res)));
            }
        } catch (err) {
            console.error('  Baglanti hatasi: ' + err.message);
            console.log('  -> localhost:3000 sunucusunun acik oldugunu kontrol edin (npm run dev)');
        }

        await sleep(1500);
    }

    console.log('\n==================================================');
    console.log('TOPLAM KATMA DEGER (Bu Oturumda): ' + toplamDeger.toFixed(2) + ' TL');
    console.log('SONRAC: /imalat sayfasini acin, Sekme 5 (Karlilik ve Prim) kontrol edin!');
    console.log('==================================================\n');
}

simulasyonYap().catch(console.error);
