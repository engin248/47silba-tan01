const { KuyrukUzunlugu, KuyruktanAl, KuyrugaEkle } = require('./src/lib/redis_kuyruk.js');
const { createClient } = require('@supabase/supabase-js');
const { SentinelZirhi } = require('./src/lib/sentinel_kalkan.js');

// Ajan Referansları (Dağıtıcı tarafından hangi bot kullanılacaksa onu çağıracağız)
const { bot1TiktokTrendAjani } = require('./arge_ajanlari/trend_tiktok.js');
const { bot2TrendyolPazarAjani } = require('./arge_ajanlari/vision_trendyol_ajani.js');
require('dotenv').config({ path: '.env.local' });

// Supabase Sunucu Bağlantısı
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOREV_LIMITI = 2; // Server yorulmaması için Max Concurrency
let aktifGorevler = 0;

/**
 * Siber İşçi Motoru: 
 * Sentinel İnfaz (Kill Switch) Zırhı ile donatılmış yeni sistem.
 */
async function isciMotoru() {
    try {
        if (aktifGorevler >= GOREV_LIMITI) return;

        const job = await KuyruktanAl('scraper_jobs');
        if (!job) return;

        aktifGorevler++;
        console.log(`\n[İŞÇİ] 🎯 Yeni Görev Alındı: ${job.data.hedef} | Job ID: ${job.id}`);
        console.log(`[EMİR TİPİ] ${job.data.reenkarnasyon ? "⚠️ YENİ ASKER (SIFIR İNİSİYATİF)" : "NORMAL DEVREYE ALMA"}`);

        await supabase.from('bot_tracking_logs').insert([{
            job_id: job.id,
            ajan_adi: job.data.reenkarnasyon ? 'YENİ_ASKER (Reenkarne)' : 'DAĞITICI_MİMAR',
            hedef_kavram: job.data.hedef,
            ilerleme_yuzdesi: 10,
            durum: 'çalışıyor',
            son_mesaj: job.data.kati_siber_emir || 'Sentinel Telemetri zırhı aktifleştirildi, ajan hedefe yollanıyor.'
        }]);

        // AŞAMA 2: Güvenlik Ajanı (Sentinel) Zırhıyla Ajanın Tetiklenmesi
        try {
            // Şimdilik varsayılan Tiktok ajanı atıyoruz, ilerde hedefe göre dinamik olacak
            let aktifAjanFnc = bot1TiktokTrendAjani;

            // --- SİMÜLASYON TEST ZIRHLARI (SAVAŞ OYUNU İÇİN) ---
            if (job.data.test_modu === 'timeout') {
                aktifAjanFnc = async (hedef, j_id, telemetri) => {
                    if (telemetri) await telemetri(j_id, 20, "[ZEHİRLİ AJAN] Kasıtlı sonsuz döngüye girildi...", "çalışıyor");
                    await new Promise(resolve => setTimeout(resolve, 65000));
                    return { karar: 'ZAMAN_ASIMI_HİLESİ_FARK_EDİLEMEDİ' };
                };
            }
            if (job.data.test_modu === 'crash') {
                aktifAjanFnc = async (hedef, j_id, telemetri) => {
                    if (telemetri) await telemetri(j_id, 10, "[PATLAYICI AJAN] Hedefe yaklaşıldı. Bomba pimi çekildi...", "çalışıyor");
                    throw new Error("Yapay Zeka Mantık Çökmesi (Test Simülasyonu Kasıtlı Patlaması)");
                };
            }
            // ---------------------------------------------------

            // Eğer reenkarnasyon ise ajana ekstra kuralları yedirecek şekilde sargı (wrapper) yapılabilir
            const sonuc = await SentinelZirhi(job.id, job.data.hedef, aktifAjanFnc, 60);

            console.log(`[İŞÇİ] ✅ Etki başarıyla tamamlandı. Karar: ${sonuc ? sonuc.ai_satis_karari : 'BOŞ'}`);

            // İş başarılıysa, eğer Yeni Asker idiyse Karargaha başarı logu at
            if (job.data.reenkarnasyon) {
                console.log(`[KURAL 16 BAŞARILI] Yeni asker inisiyatif almadan görevi mühürledi.`);
            }

        } catch (infazHatasi) {
            console.log(`[İŞÇİ - YENİ ASKER UYARISI] Ajan sahadan dönemedi veya İnfaz edildi. Kural 16 (Reincarnation) Devrede.`);
            console.log(`[HATA SEBEBİ] ${infazHatasi.message}`);

            await supabase.from('bot_tracking_logs').insert([{
                job_id: job.id,
                ajan_adi: 'ZOMBİ_AVCISI_SENTİNEL',
                hedef_kavram: job.data.hedef,
                ilerleme_yuzdesi: 0,
                durum: 'hata',
                son_mesaj: `Eski ajan ÇÖKTÜ/İNFAZ EDİLDİ (${infazHatasi.message}). Yeni Asker Klonlanıyor.`
            }]);

            // KURAL 16: Eğer bot ölürse, inisiyatif alması yasaklanan YENİ ASKER işi devralacak.
            if (!job.data.reenkarnasyon) {
                console.log(`[REENKARNASYON] Görev sıfır inisiyatif (kesin emirlere) bağlanarak yeniden kuyruğa sürülüyor...`);
                await KuyrugaEkle('scraper_jobs', {
                    hedef: job.data.hedef,
                    saha_ajani: job.data.saha_ajani,
                    reenkarnasyon: true,
                    kati_siber_emir: "MİZANET KURAL 16 UYARISI: İnsiyatif alırsan İNFAZ edilirsin! Yalnızca hedefe odaklan, hata yapma."
                });
            } else {
                console.log(`[SON İNFAZ] Yeni Asker de başaramadı. Görev tamamen MÜHÜRLENDİ. Düşman hattı çok güçlü.`);
                await supabase.from('bot_tracking_logs').insert([{
                    job_id: job.id,
                    ajan_adi: 'KARARGAH_MERKEZ',
                    hedef_kavram: job.data.hedef,
                    ilerleme_yuzdesi: 100,
                    durum: 'iptal',
                    son_mesaj: `Hedef çok riskli. Reenkarne Asker de çöktü. GÖREV İPTAL EDİLDİ.`
                }]);
            }
        }

        aktifGorevler--;
    } catch (err) {
        console.error("[İŞÇİ MOTOR ÇÖKMESİ]:", err.message);
        aktifGorevler--;
    }
}

// Kalp atışı
setInterval(isciMotoru, 2000);
console.log("\n🛡️ SİBER İŞÇİ VE (AŞAMA 2) SENTINEL İNFAZ ZIRHI BAŞLATILDI...\n");
