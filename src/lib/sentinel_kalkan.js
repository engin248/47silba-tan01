const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') }); // [FIX] kısmi yol → mutlak yol

// Supabase Sunucu Bağlantısı
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',    // [FIX] undefined geçme engellendi
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''    // [FIX] aynı
);

/**
 * Karargaha (M1) anlık telemetri (hayatta kalma sinyali ve yüzdelik) basar.
 */
async function telemetriGuncelle(job_id, ilerleme, mesaj, durum = 'çalışıyor') {
    try {
        await supabase.from('bot_tracking_logs')
            .update({ ilerleme_yuzdesi: ilerleme, son_mesaj: mesaj, durum: durum, son_guncelleme: new Date().toISOString() })
            .eq('job_id', job_id);
    } catch (err) {
        console.error("[TELEMETRİ HATASI]:", err.message);
    }
}

/**
 * Sentinel Zırhı: Siber İnfaz ve Çapraz Denetim Başlatıcısı (Kill Switch)
 * @param {string} job_id - Redis Görev ID'si
 * @param {string} hedef - Hedef Kavram
 * @param {Function} botFonksiyonu - Çalıştırılacak sahadaki ajan
 * @param {number} zamanAsimiSaniye - Ajanın hayatta kalma limiti (Varsayılan 45 sn)
 */
async function SentinelZirhi(job_id, hedef, botFonksiyonu, zamanAsimiSaniye = 45) {
    let killSwitchTetiklendi = false;

    // 1. Ekip 3 (Tester/Güvenlik) Gözlem Başlatır
    await telemetriGuncelle(job_id, 30, `[SENTINEL ZIRHI] ${hedef} için ajan Serbest Bırakıldı. İmha Sayacı: ${zamanAsimiSaniye}s.`);

    return new Promise(async (resolve, reject) => {
        // İNFAZ (KILL SWITCH) MANTIGI: Zombi Bot Süresi Dolduğunda Parçalanır
        const infazZamanlayici = setTimeout(async () => {
            killSwitchTetiklendi = true;
            console.error(`[SENTINEL İNFAZ TİMİ] ⚡ Ajan ${zamanAsimiSaniye} saniyeyi aştı. Hedefte kayboldu. Kellesi Alındı!`);

            await telemetriGuncelle(job_id, 0, `[İNFAZ] Ajan kontrolden çıktığı için Sentinel tarafından (Zaman Aşımı) mermi ile öldürüldü.`, 'INFAZ_EDILDI');

            // Yeni Asker (Reincarnation) için Error fırlat
            reject(new Error("SENTINEL_KILL_SWITCH_TETIKLENDI"));
        }, zamanAsimiSaniye * 1000);

        try {
            // Ajanı sahaya salıp döndürdüğü veriyi bekleriz
            // Not: Botun kendi içinde try/catch/finally (browser.close) yapması mecburi KURAL 1'dir.
            const botSonucu = await botFonksiyonu(hedef, job_id, telemetriGuncelle);

            clearTimeout(infazZamanlayici); // Ajan başarıyla dönerse silahı (İnfazı) indir.

            if (!killSwitchTetiklendi) {
                await telemetriGuncelle(job_id, 100, `[SENTINEL ONAYI] Başarılı Veri Sağlandı. Çapraz Test'ten Geçti.`, 'onaylandı');
                resolve(botSonucu);
            }
        } catch (botHatasi) {
            clearTimeout(infazZamanlayici); // İç hata varsa infaz sayacını iptal et, çünkü bot kendi öldü
            if (!killSwitchTetiklendi) {
                console.error("[SENTINEL HATA TESPİTİ] Ajan iç çökme ile parçalandı:", botHatasi.message);
                await telemetriGuncelle(job_id, 0, `[ÇÖKME] Ajan iç hatadan dolayı kalbinden patladı: ${botHatasi.message}`, 'INFAZ_EDILDI');
                reject(botHatasi);
            }
        }
    });
}

module.exports = { telemetriGuncelle, SentinelZirhi };
