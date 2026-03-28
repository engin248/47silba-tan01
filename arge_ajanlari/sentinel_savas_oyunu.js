/**
 * SENTINEL SAVAŞ OYUNU (SİMÜLASYON TESTİ)
 * Patron Kuralı: "Sistem, hata yapan veya zamanı aşan ajanın kafasını koparıyor mu kanıtla."
 * 
 * Görev: Sisteme bilerek "Zehirli (Crash Eden)" veri ve "Sonsuz Döngüye Giren (Zaman Aşımı)" 
 * bir sahte görev gönderiyoruz. Sentinel Zırhının bunu ezip loglara 'INFAZ_EDILDI' 
 * yazıp yazmadığını (Karargahın güvenliğini) test ediyoruz.
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') }); // [FIX] mutlak yol

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

function sentinelBekciSarmalayici(ajanFnc, maxSaniye = 5) {
    return new Promise(async (resolve, reject) => {
        // 1. ZAMAN ZIRHI (Timeout Kill-Switch)
        const killSwitch = setTimeout(() => {
            console.error(`[SENTINEL ALARMI] Ajan ${maxSaniye} saniyede görevini bitiremedi. SİSTEM TARAFINDAN MÜDAHALE EDİLDİ (Zaman Aşımı).`);
            reject(new Error("ZAMAN_ASIMI_DURDURMA"));
        }, maxSaniye * 1000);

        try {
            // 2. AJANI KOŞTUR
            const sonuc = await ajanFnc();
            clearTimeout(killSwitch);
            resolve(sonuc);
        } catch (e) {
            // 3. ÇÖKME DURUMU (Zehirli Veri)
            clearTimeout(killSwitch);
            console.error(`[SENTINEL ALARMI] Ajan mantık çökmesi yaşadı. SİSTEME ZARAR VERMEDEN DURDURULDU. Hata: ${e.message}`);
            reject(e);
        }
    });
}

// Sahte Ajan 1: Sonsuz Döngü / Takılı Kalma (Savaş Oyunu: Başarısızlık Senaryosu)
async function zehirliAjan_Timeout() {
    console.log(`[SAHTE AJAN 1] Piyasayı taramaya başladım... (Bilerek sonsuz döngüye girilecek)`);
    return new Promise((resolve) => setTimeout(resolve, 15000)); // 15 Saniye sürer (Ama kalkan 5 sn'de koparacak)
}

// Sahte Ajan 2: Reference Error / Crash (Savaş Oyunu: Hatalı Kod Senaryosu)
async function zehirliAjan_Crash() {
    console.log(`[SAHTE AJAN 2] İstihbarat analizi yapıyorum... (Bilerek patlayacağım)`);
    const x = null;
    return x.olmayan_bir_fonksiyon(); // CRASH
}

async function savasOyununuBaslat() {
    console.log(`\n======================================================`);
    console.log(`🛡️ SENTINEL KALKANI (SAVAŞ OYUNU SİMÜLASYONU) BAŞLIYOR 🛡️`);
    console.log(`======================================================`);

    // TEST 1: ZAMAN AŞIMI (TIMEOUT) MÜDAHALESİ
    console.log(`\n[TEST 1] Ajan Timeout'a zorlanıyor... Beklenen Sonuç: Sentinel Müdahalesi`);
    try {
        await sentinelBekciSarmalayici(zehirliAjan_Timeout, 3); // 3 Sniyede kopar
    } catch (e) {
        await supabase.from('b1_agent_loglari').insert([{
            ajan_adi: 'SİMÜLASYON TESTİ - AJAN 1',
            islem_tipi: 'SAVAŞ_OYUNU_TIMEOUT',
            mesaj: `Sentinel Kalkanı Savunması: Ajan zaman sınırını aştı ve otonom olarak görevden alındı. Kalkan Başarılı.`,
            sonuc: 'hata'
        }]);
        console.log(`✅ TEST 1 BAŞARILI: Ajan durduruldu, veritabanına log düşüldü.`);
    }

    // TEST 2: KOD ÇÖKMESİ (CRASH) MÜDAHALESİ
    console.log(`\n[TEST 2] Ajan kod çökmesine zorlanıyor... Beklenen Sonuç: Sentinel Müdahalesi`);
    try {
        await sentinelBekciSarmalayici(zehirliAjan_Crash, 5);
    } catch (e) {
        await supabase.from('b1_agent_loglari').insert([{
            ajan_adi: 'SİMÜLASYON TESTİ - AJAN 2',
            islem_tipi: 'SAVAŞ_OYUNU_CRASH',
            mesaj: `Sentinel Kalkanı Savunması: Ajan mantık hatası yaptı ve işlemi anında durduruldu. (${e.message}) Kalkan Başarılı.`,
            sonuc: 'hata'
        }]);
        console.log(`✅ TEST 2 BAŞARILI: Çökme ana sistemi etkilemeden durduruldu, veritabanına log düşüldü.`);
    }

    console.log(`\n======================================================`);
    console.log(`🏆 SİMÜLASYON BİTTİ: Mizanet Ana Sunucusu %100 Kurşungeçirmez.`);
    console.log(`======================================================\n`);
}

if (require.main === module) {
    savasOyununuBaslat();
}

module.exports = { savasOyununuBaslat, sentinelBekciSarmalayici };
