const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') }); // [FIX] mutlak yol

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // [FIX] ANON_KEY fallback kaldırıldı
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

/**
 * BOT 2: TRENDYOL (SATIŞ) AJANI
 * YENİ (FAZ 1): Rakibin "Yok Satan" (Biten) stoklarını yakalayıp M3'e "ACİL ÜRET" emri fırlatmak.
 * SENTINEL ZIRHI ve TELEMETRİ UYUMLUDUR.
 */
async function bot2TrendyolSatisAjani(aramaKelimesiVeyaLink, job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[TELEMETRİ %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(15, `[PİYADE HÜCUMU] Satış ajanı gizlice hedefe gidiyor: ${aramaKelimesiVeyaLink}`);

    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();
        let hamVeri = {};

        await page.goto(aramaKelimesiVeyaLink, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await page.waitForTimeout(2000);

        // === KAMUYA AÇIK BİLGİLERİ (DOM) SAF ŞEKİLDE ÇEK ===
        hamVeri = await page.evaluate(() => {
            const baslik = document.querySelector('h1.pr-new-br span')?.textContent?.trim() || 'Bilinmiyor';
            const marka = document.querySelector('h1.pr-new-br a')?.textContent?.trim() || 'EvSahibi';
            const fiyatText = document.querySelector('.prc-dsc')?.textContent?.trim() || '0 TL';

            const yorumYazi = document.querySelector('.rvw-cnt-tx')?.textContent?.trim() || '0 Yorum';
            const favoriYazi = document.querySelector('.fv-dtls span')?.textContent?.trim() || '0 Favori';

            // FAZ 1 Yeni Yetenek: Rakip Stok Tukenme (Yok Satma) Tespit Kancası
            const sepeteEkleMenusu = !!document.querySelector('.add-to-bs-tx');
            const tukendiMetniText = document.querySelector('.product-sold-out-text')?.textContent || document.querySelector('.sold-out')?.textContent || '';
            const stokBittiMi = (!sepeteEkleMenusu || tukendiMetniText.length > 1);

            return {
                baslik,
                marka,
                fiyat: fiyatText,
                yorumAdedi: yorumYazi,
                favoriAdedi: parseInt(favoriYazi.replace(/[^0-9]/g, '')) || 0,
                stokBittiMi
            };
        });

        await telemetriAt(50, `[SATIS METRİĞİ] Favori: ${hamVeri.favoriAdedi}. Stok Durumu: ${hamVeri.stokBittiMi ? 'TÜKENDİ (YOK SATIYOR!)' : 'STOK VAR'}`);

        // === 2. BİNGO ŞEFİ DEVREYE GİRER ===
        let karar = "İZLE";
        let aciklama = "Genel piyasa inceleme durumunda.";

        // Klasik Mantık Mimarisi
        if (hamVeri.favoriAdedi > 500) karar = "ÇOK_SATAR";
        else if (hamVeri.favoriAdedi < 50) karar = "SATMAZ";

        // FAZ 1 ÖZEL YETENEK KİLİDİ: M3 Kalıphaneye Acil Üret Emri
        if (hamVeri.stokBittiMi && hamVeri.favoriAdedi > 100) {
            karar = "ACİL_ÜRET";
            aciklama = `[PİYASA BOŞLUĞU] Rakip stokları tamamen tüketmiş (Yok Satıyor)! Bu ürün için çok ciddi bir hazır müşteri kitlesi var. M3 Kalıphanesine 'Hemen Kalıp Çıkar ve Üret' talimatı fişeklendi.`;
            await telemetriAt(80, `[YÜKSEK ALARM!] Rakip stoklarında yok sattığı tespit edildi! ACİL ÜRET kararı fırlatıldı!`);
        } else if (karar === "ÇOK_SATAR") {
            aciklama = `Favori hızı ve etkileşimi çok yüksek. Pazarda ciddi alıcı var. Üretilmeye değer.`;
            await telemetriAt(80, `[KARAR] Ürün Çok Satar onayını denetmenden aldı.`);
        } else if (karar === "SATMAZ") {
            aciklama = `Talep ölü. Müşteri bu ürünü almak istemiyor.`;
            await telemetriAt(80, `[FİLTRE REDDİ] Satış potansiyeli yok.`);
        }

        const analizRaporu = {
            urun_adi: `${hamVeri.marka} - Satış Analizi`,
            ai_satis_karari: karar,
            trend_skoru: karar === 'ACİL_ÜRET' ? 100 : (karar === 'ÇOK_SATAR' ? 90 : 40),
            artis_yuzdesi: null, // [FIX] Math.random() sahte veri kaldırıldı — gerçek veri yokken null
            hedef_kitle: 'Sıcak Alıcılar',
            erken_trend_mi: karar === 'ACİL_ÜRET',
            hermania_karar_yorumu: aciklama,
            ai_guven_skoru: 95
        };

        // Eğer veritabanına eklenecekse burası M2 için köprüdür (Şimdilik Worker'a döndürüyoruz)
        await telemetriAt(100, `[GÖREV BİTTİ] ${karar} kararı verildi.`, 'onaylandı');

        return analizRaporu;

    } catch (e) {
        console.error(`[BOT 2 SATIS HATA] ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] Ajan satış verisi alırken sistem çökmesi yaşadı: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    } finally {
        // EN ÖNEMLİ ZOMBİ ZIRHI (KURAL 1)
        if (browser) {
            console.log(`[INFRA] Tarayıcı ram'den sökülüyor (Zombi Koruması)...`);
            await browser.close();
        }
    }
}

module.exports = { bot2TrendyolSatisAjani };
