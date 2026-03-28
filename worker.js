const { KuyrukUzunlugu, KuyruktanAl, KuyrugaEkle } = require('./src/lib/redis_kuyruk.js');
const { createClient } = require('@supabase/supabase-js');
const { SentinelZirhi } = require('./src/lib/sentinel_kalkan.js');

// Ekip 1 (Saha / İstihbarat)
const { bot1TiktokTrendAjani } = require('./arge_ajanlari/trend_tiktok.js');
const { bot2TrendyolPazarAjani } = require('./arge_ajanlari/vision_trendyol_ajani.js');

// Ekip 2 (Karar & Finans Kilitleri)
const { m2KarZararKilidi } = require('./arge_ajanlari/m2_finans_kar_ajani.js');
const { altinKriter138Ajani } = require('./arge_ajanlari/138_altin_kriter_ajani.js');

// Ekip 3 (Otonom Beyin & Tasarım)
const { hermaniaOtonomPazarlama } = require('./arge_ajanlari/hermania_seo_mail_ajani.js');
const { bot8BasTasarimci } = require('./arge_ajanlari/bas_tasarimci.js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOREV_LIMITI = 2; // Server yorulmaması için Max Concurrency
let aktifGorevler = 0;

/**
 * Siber İşçi Motoru:
 * ZİNCİRLEME KOMUTA (PIPELINE): 3 Ekip çakışmadan birbirini sıralı tetikler.
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
            ilerleme_yuzdesi: 5,
            durum: 'çalışıyor',
            son_mesaj: job.data.kati_siber_emir || 'Sentinel Telemetri aktifleştirildi, ajanlar zincirleme yollanıyor.'
        }]);

        try {
            let aktifAjanFnc = bot1TiktokTrendAjani;

            // --- SİMÜLASYON TEST ZIRHLARI ---
            if (job.data.test_modu === 'timeout') {
                aktifAjanFnc = async (hedef, j_id, telemetri) => {
                    if (telemetri) await telemetri(j_id, 20, "[ZEHİRLİ AJAN] Sonsuz döngü simülasyonu...", "çalışıyor");
                    await new Promise(resolve => setTimeout(resolve, 65000));
                    return { karar: 'ZAMAN_ASIMI_HİLESİ' };
                };
            }
            if (job.data.test_modu === 'crash') {
                aktifAjanFnc = async (hedef, j_id, telemetri) => {
                    if (telemetri) await telemetri(j_id, 10, "[PATLAYICI AJAN] Bomba pimi çekildi...", "çalışıyor");
                    throw new Error("Yapay Zeka Mantık Çökmesi (Kasıtlı Patlama)");
                };
            }

            // 1. FAZ (EKİP 1): Veri / İstihbarat Toplama
            const sonuc = await SentinelZirhi(job.id, job.data.hedef, aktifAjanFnc, 60);
            console.log(`[İŞÇİ - EKİP 1] ✅ Saha İstihbaratı Tamamlandı. Karar: ${sonuc ? sonuc.ai_satis_karari : 'BOŞ'}`);

            if (job.data.reenkarnasyon) {
                console.log(`[KURAL 16 BAŞARILI] Yeni asker inisiyatif almadan ilk adımı mühürledi.`);
            }

            // === 3 FAZLI ÇAKIŞMAZ ZİNCİRLEME KOMUTA (PIPELINE) ===
            // Sadece başarılı ve ÇOK_SATAR ürünleri diğer ekiplere geçir (Çöpleri diğer ekiplerin yolunu tıkamaması için kes)
            if (sonuc && sonuc.ai_satis_karari === 'ÇOK_SATAR') {
                console.log(`\n[ZİNCİRLEME KOMUTA] Ürün ÇOK_SATAR damgası yedi. EKİP 2 (M2 Kar ve Altın Kriter) tetikleniyor...`);
                const urunIsmi = sonuc.urun_adi || job.data.hedef;

                // [B-3 FİX]: Dinamik fiyat — Supabase'den çekil, olmasa .env fallback
                const { data: prms } = await supabase.from('sistem_parametreleri').select('anahtar,deger').in('anahtar', ['kumas_metre_fiyati', 'hedef_satis_fiyati']);
                const kumasFiyati = parseFloat(prms?.find(p => p.anahtar === 'kumas_metre_fiyati')?.deger) || parseFloat(process.env.DEFAULT_KUMAS_FIYATI) || 140;
                const satisFiyati = parseFloat(prms?.find(p => p.anahtar === 'hedef_satis_fiyati')?.deger) || parseFloat(process.env.DEFAULT_SATIS_FIYATI) || 900;

                // 2. FAZ (EKİP 2): Finans ve Altın Kriter Zırhı
                const m2Sonuc = await SentinelZirhi(job.id + "_m2", urunIsmi, async (hedef, j_id, t_fnc) => {
                    return await m2KarZararKilidi({
                        urun_adi: hedef, kategori: "Genel Toptan Tekstil", kumas_metre_fiyati: kumasFiyati, tahmini_satis_fiyati: satisFiyati
                    }, j_id, t_fnc);
                }, 40);

                if (m2Sonuc && m2Sonuc.finans_karari === 'KÂRLI_ÜRET') {
                    console.log(`[ZİNCİRLEME KOMUTA] M2 Kâr Kilidi Aşıldı! EKİP 3 (Otonom Beyin ve Tasarım) Başlatılıyor...`);

                    await SentinelZirhi(job.id + "_altin", urunIsmi, async (hedef, j_id, t_fnc) => {
                        return await altinKriter138Ajani("Küresel Arbitraj", "Premium E-Ticaret Ürünü", null, j_id, t_fnc);
                    }, 40);

                    // 3. FAZ (EKİP 3): Dışa Açılım (SEO / MAİL / TASARIM)
                    await SentinelZirhi(job.id + "_seo", urunIsmi, async (hedef, j_id, t_fnc) => {
                        return await hermaniaOtonomPazarlama(hedef, "Trend", "Kaliteli", "Siyah", "Arap ve Avrupa", j_id, t_fnc);
                    }, 60);

                    await SentinelZirhi(job.id + "_tasarim", urunIsmi, async (hedef, j_id, t_fnc) => {
                        return await bot8BasTasarimci(j_id, t_fnc);
                    }, 60);

                    console.log(`[PIPELINE BİTTİ] 3 Aşamalı zincir hiç çakışmadan başarıyla mühürlendi!`);
                } else {
                    console.log(`[ZİNCİRLEME İPTAL] Ürün çok satıyor ama ZARAR ETTİRECEĞİ için M2 kilidinden geçemedi. Üretim iptal.`);
                }
            } else {
                console.log(`[ZİNCİRLEME İPTAL] Ürün ÇOK_SATAR olmadığı için M2 Kâr analizine girmeden çöpe atıldı.`);
            }

        } catch (infazHatasi) {
            console.log(`\n[İŞÇİ - YENİ ASKER UYARISI] Zincirde kopma oldu! Kural 16 (Reincarnation) Devrede.`);
            console.log(`[HATA SEBEBİ] ${infazHatasi.message}`);

            await supabase.from('bot_tracking_logs').insert([{
                job_id: job.id, ajan_adi: 'ZOMBİ_AVCISI_SENTİNEL', hedef_kavram: job.data.hedef, ilerleme_yuzdesi: 0, durum: 'hata', son_mesaj: `Eski ajan ÇÖKTÜ/İNFAZ EDİLDİ (${infazHatasi.message}). Klonlanıyor.`
            }]);

            if (!job.data.reenkarnasyon) {
                console.log(`[REENKARNASYON] Klon (Yeni Asker) SIFIR İNİSİYATİFLE kuyruğa sürülüyor...`);
                await KuyrugaEkle('scraper_jobs', {
                    hedef: job.data.hedef, saha_ajani: job.data.saha_ajani, reenkarnasyon: true, kati_siber_emir: "MİZANET KURAL 16 UYARISI: İnsiyatif alırsan İNFAZ edilirsin! Yalnızca hedefe odaklan."
                });
            } else {
                console.log(`[SON İNFAZ] Klon da başaramadı. Düşman hattı çok riskli. GÖREV İPTAL.`);
                await supabase.from('bot_tracking_logs').insert([{
                    job_id: job.id, ajan_adi: 'KARARGAH_MERKEZ', hedef_kavram: job.data.hedef, ilerleme_yuzdesi: 100, durum: 'iptal', son_mesaj: `Hedef çok riskli. Reenkarne Asker de düştü. İPTAL.`
                }]);
            }
        }

        aktifGorevler--;

        // 🚨 KÖR NOKTA 3: API YANIKLARI (RATE LIMIT SOĞUTMA) 🚨
        // Ekip 3 (DALL-E, Gemini) peş peşe tetiklendiğinde API ban yemesin diye 6 sn Termal Soğutma süresi
        console.log(`[TERMAL ZIRH] API limitine takılmamak için 6 saniye termal soğutma (Rate Limit Cooldown) başlatıldı...`);
        await new Promise(resolve => setTimeout(resolve, 6000));

    } catch (err) {
        console.error("[İŞÇİ MOTOR ÇÖKMESİ]:", err.message);
        aktifGorevler--;
    }
}

setInterval(isciMotoru, 5000); // Havuz sorgulamasını da yavaşlattık
console.log("\n🛡️ OTONOM BEYİN ZİNCİRLEME (PIPELINE) KOMUTASI VE SENTINEL ZIRHI BAŞLATILDI...\n");
