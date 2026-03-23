require('dotenv').config({ path: '.env.local' });
const { KuyruktanAl } = require('../src/lib/redis_kuyruk');
const { bot3GoogleTalepAjani } = require('../arge_ajanlari/talep_google');
const { bot4MetaReklamAjani } = require('../arge_ajanlari/reklam_meta');
const { bot5MerkeziSorguHakemi } = require('../arge_ajanlari/filtre_suzgec');
const { Sentinel } = require('../src/lib/sentinel');

// Kurallar Gereği Sunucu Boğulmaması İçin Maksimum Sekme/Ajan Kuralı
const GOREV_LIMITI = 2;
let aktifGorevler = 0;

/**
 * Siber İşçi Motoru: 
 * Upstash Redis Kuyruğunu dinler, görevi devralır ve Supabase'e durum raporlar.
 */
async function isciMotoru() {
    try {
        if (aktifGorevler >= GOREV_LIMITI) {
            return; // Sınır dolu, sıradakini bekle
        }

        const job = await KuyruktanAl('scraper_jobs');
        if (!job) return; // Kuyruk boşsa motor dinlenir

        aktifGorevler++;
        const hedef = job.data.hedef;
        const jobId = job.id;
        console.log(`\n[İŞÇİ] 🎯 Yeni Görev Alındı: ${hedef} | Job ID: ${jobId}`);

        // İşlemi paralel başlat (Event Loop'u kitlememek için asenkron IFFE kullanıyoruz)
        (async () => {
            try {
                // ─── Adım 1: Sentinel Korumalı Google Bot Taraması ───
                const sGoogle = new Sentinel(jobId, 'BOT 3: GOOGLE', hedef);
                await sGoogle.baslat(45000);
                try {
                    await sGoogle.guncelle(25, 'Google Trends verisi kazılıyor...', 'google.com/trends');
                    await bot3GoogleTalepAjani(hedef);
                    await sGoogle.bitir('Makro Talep verisi başarıyla alındı.');
                } catch (e) {
                    await sGoogle.infaz(e.message);
                    throw new Error(`Google Bot Çöktü: ${e.message}`);
                }

                // ─── Adım 2: Sentinel Korumalı Meta Reklam Taraması ───
                const sMeta = new Sentinel(jobId, 'BOT 4: META', hedef);
                await sMeta.baslat(45000);
                try {
                    await sMeta.guncelle(50, 'Facebook/Instagram reklam havuzu taranıyor...', 'facebook.com/ads');
                    await bot4MetaReklamAjani(hedef);
                    await sMeta.bitir('Meta sıcak satış sinyalleri yakalandı.');
                } catch (e) {
                    await sMeta.infaz(e.message);
                    throw new Error(`Meta Bot Çöktü: ${e.message}`);
                }

                // ─── Adım 3: Sentinel Korumalı Merkezi Süzgeç (Hermania) ───
                const sHermania = new Sentinel(jobId, 'BOT 5: HERMANIA', hedef);
                await sHermania.baslat(60000);
                try {
                    await sHermania.guncelle(75, 'Ajanların ham verisi 138 Altın Kritere vuruluyor...', 'karar_motoru');
                    await bot5MerkeziSorguHakemi(hedef);
                    await sHermania.bitir('Tüm Süzgeç Testleri Bitti. KARAR VERİLDİ.');
                } catch (e) {
                    await sHermania.infaz(e.message);
                    throw e;
                }

                console.log(`[İŞÇİ] ✅ ${hedef} görevi %100 onaylandı.`);
            } catch (err) {
                console.error("[İŞÇİ ZİNCİR KIRILMASI] Görev Zinciri Koptu:", err.message);
            } finally {
                aktifGorevler--; // Kontenjan serbest bırakılır
            }
        })();

    } catch (err) {
        console.error("[İŞÇİ HATA İNFAZI] Kuyruk İşleme Hatası:", err.message);
    }
}

// Kalp atışı: İşçi her 1 saniyede bir kuyruk ağını dinler
setInterval(isciMotoru, 1000);
console.log("\n🛡️ SİBER İŞÇİ (Otonom Worker) BAŞLATILDI. Yüzde 100 Sentinel Zırhı ile Kuyruk Dinleniyor...\n");
