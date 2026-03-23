/**
 * G4 SAHA TESTİ — SUPABASE DOĞRUDAN YAZMA (Next.js Bypass)
 * 
 * Kullanım: node scripts/g4-direkt-supabase.js
 * 
 * Bu script, kamera-sayac API'ye gerek kalmadan
 * doğrudan Supabase'e performans kaydı yazar.
 * Prim hesabını da burada yapar.
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('HATA: .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik!');
    process.exit(1);
}

function supabaseRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(SUPABASE_URL + path);
        const data = body ? JSON.stringify(body) : null;
        const req = https.request({
            hostname: url.hostname,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY,
                'Authorization': 'Bearer ' + SERVICE_KEY,
                'Prefer': 'return=representation',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        }, (res) => {
            let out = '';
            res.on('data', c => out += c);
            res.on('end', () => {
                try { resolve(JSON.parse(out)); }
                catch (e) { resolve(out); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
    console.log('\n🎬 G4 DOĞRUDAN SUPABASE SIMÜLASYONU BAŞLATILIYOR...\n');

    // 1. Personelleri çek
    const personeller = await supabaseRequest('GET', '/rest/v1/b1_personel?select=id,ad_soyad,aylik_maliyet_tl&limit=3');
    if (!Array.isArray(personeller) || personeller.length === 0) {
        console.error('❌ b1_personel tablosu boş veya erişilemiyor. Kontrol edin.');
        process.exit(1);
    }
    const personel = personeller[0];
    console.log(`👤 Personel: ${personel.ad_soyad} | Aylık Maliyet: ${personel.aylik_maliyet_tl || 0} TL`);

    // 2. Operasyonları çek
    const operasyonlar = await supabaseRequest('GET', '/rest/v1/b1_operasyon_tanimlari?select=id,operasyon_adi,isletmeye_kattigi_deger_tl,baz_prim_tl,zorluk_derecesi&limit=5');
    if (!Array.isArray(operasyonlar) || operasyonlar.length === 0) {
        console.error('❌ b1_operasyon_tanimlari boş. Önceki SQL adımını çalıştırdınız mı?');
        process.exit(1);
    }
    console.log(`📋 ${operasyonlar.length} operasyon bulundu.\n`);

    const aylikMaliyet = parseFloat(personel.aylik_maliyet_tl || 60000);
    let toplamBirikis = 0;

    // 3. 5 kez simüle et
    for (let i = 0; i < 5; i++) {
        const op = operasyonlar[i % operasyonlar.length];
        const adet = Math.floor(Math.random() * 150) + 50;
        const kalite = parseFloat((7.5 + Math.random() * 2.5).toFixed(1));
        const katilanDeger = adet * parseFloat(op.isletmeye_kattigi_deger_tl || 0);
        toplamBirikis += katilanDeger;

        // Prim hesabı
        const primHak = toplamBirikis >= aylikMaliyet;
        const kazanilanPrim = primHak
            ? parseFloat((adet * parseFloat(op.zorluk_derecesi || 1) * parseFloat(op.baz_prim_tl || 0)).toFixed(2))
            : 0;

        console.log(`📷 PING #${i + 1}: "${op.operasyon_adi}" — ${adet} adet`);

        const kayit = {
            personel_id: personel.id,
            operasyon_id: op.id,
            uretilen_adet: adet,
            isletmeye_katilan_deger: katilanDeger,
            kazanilan_prim: kazanilanPrim,
            kalite_puani: kalite,
            otonom_tespit: true,
            kaynak_cihaz: 'G4_Sim_Direkt'
        };

        const sonuc = await supabaseRequest('POST', '/rest/v1/b1_personel_performans', kayit);

        if (Array.isArray(sonuc) && sonuc.length > 0) {
            console.log(`   ✅ Kaydedildi! Değer: ${katilanDeger} TL | Amorti: %${((toplamBirikis / aylikMaliyet) * 100).toFixed(1)}`);
            console.log(`   🏆 Prim: ${primHak ? kazanilanPrim + ' TL ✨' : 'Henüz Yok (amorti tamam değil)'}`);
        } else {
            console.log(`   ⚠️  Yanıt:`, JSON.stringify(sonuc).substring(0, 100));
        }

        await sleep(500);
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log(`📊 TOPLAM KATma DEĞER: ${toplamBirikis.toFixed(2)} TL`);
    console.log(`💰 AYLIK MALİYET: ${aylikMaliyet} TL`);
    console.log(`📈 AMORTİ DURUMU: %${((toplamBirikis / aylikMaliyet) * 100).toFixed(1)}`);
    console.log('══════════════════════════════════════════════════');
    console.log('\n→ Şimdi mizanet.com/imalat adresine git, Sekme 5 (Karlılık ve Prim)\'i aç!\n');
}

main().catch(err => {
    console.error('Script hatası:', err.message);
    process.exit(1);
});
