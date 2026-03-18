const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const { KuyrugaEkle } = require('../src/lib/redis_kuyruk');
require('dotenv').config({ path: '../.env.local' });

// Supabase Kurulumu
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'YOK';

/**
 * BOT 4: META REKLAM DEDEKTİFİ
 */
async function bot4MetaReklamAjani(hedefMarkaVeyaUrun) {
    console.log(`\n[BOT 4 - META] Sahte Büyüme (Reklam Basıncı) Tarayıcısı Aktif: ${hedefMarkaVeyaUrun}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.8 Safari/537.36',
        extraHTTPHeaders: { 'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7' }
    });

    const page = await context.newPage();
    let metaVerisi = { aktifReklamSayisi: 0, ayniGorselSpamMi: false, domErisimi: false };

    try {
        const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=TR&q=${encodeURIComponent(hedefMarkaVeyaUrun)}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await page.waitForTimeout(3500);

        metaVerisi = await page.evaluate(() => {
            const bodyText = document.body.innerText || "";
            const sonucSatiri = bodyText.match(/([0-9.,]+)\s*(sonuç|results|reklam)/i);
            let reklamAdet = 0;
            if (sonucSatiri && sonucSatiri[1]) {
                reklamAdet = parseInt(sonucSatiri[1].replace(/[^0-9]/g, '')) || 0;
            }
            const imgElements = Array.from(document.querySelectorAll('img'));
            const srcList = imgElements.map(img => img.src).filter(src => src.includes('scontent'));
            const unq = new Set(srcList);
            const ayniGorselSpamMi = (srcList.length - unq.size) > 5;
            return { aktifReklamSayisi: reklamAdet, ayniGorselSpamMi, domErisimi: true };
        });

        await browser.close();
        console.log(`[AŞAMA 1 PİYADE] Meta Ad Library Verisi: Toplam ${metaVerisi.aktifReklamSayisi} Adet Sponsorlu Reklam. Spam İzi: ${metaVerisi.ayniGorselSpamMi}`);

        let perplexitySonuc = { pazar_analizi: "Bilinmiyor", organik_mi: true };
        if (PERPLEXITY_API_KEY && PERPLEXITY_API_KEY !== 'YOK') {
            const p_prompt = `Şu ürün/marka için dijital pazarlama durumunu analiz et: "${hedefMarkaVeyaUrun}". 
            Senin internetten canlı bulacağın güncel raporlara göre; bu marka devasa reklamla mı büyütülüyor, yoksa organik mi?
            JSON Dön: {"organik_mi": true/false, "pazar_analizi": "Neden?"}`;

            const options = {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "sonar-reasoning",
                    messages: [{ role: "user", content: p_prompt }]
                })
            };

            try {
                const fetch = (await import('node-fetch')).default;
                const p_res = await fetch('https://api.perplexity.ai/chat/completions', options);
                const p_data = await p_res.json();
                if (p_data.choices && p_data.choices[0]) {
                    const p_text = p_data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
                    perplexitySonuc = JSON.parse(p_text);
                }
            } catch (err) {
                console.log(`[PERPLEXITY BAĞLANTI HATASI]`, err.message);
            }
        }

        const g_prompt = `8 BİNGO Radar Kuralı: "Reklam Basıncı Yok (Organik Sağlık)" maddesini test ediyorsun.
        Hedef Ürün: "${hedefMarkaVeyaUrun}"
        - Facebook Ad Library Verisi: ${metaVerisi.aktifReklamSayisi} aktif reklam. (Bütçe Yakma/Görsel Spam: ${metaVerisi.ayniGorselSpamMi})
        - Küresel İstihbarat (Perplexity): Organik Büyüme mi? ${perplexitySonuc.organik_mi}. Derin Rapor: "${perplexitySonuc.pazar_analizi}"
        
        Sadece geçerli JSON dön:
        {
           "karar": "SATMAZ" VEYA "ÇOK_SATAR" VEYA "İZLE",
           "puan": 0-100 arası hakiki (saf) viral skoru,
           "kisa_ozet": "1 cümlelik infaz kararı"
        }`;

        const hermaiSebebi = `
        [Piyade Ad]: ${metaVerisi.aktifReklamSayisi} sonuç. Bütçe Yakma: ${metaVerisi.ayniGorselSpamMi ? "VAR" : "YOK"}.
        [Perplexity]: ${perplexitySonuc.pazar_analizi}.
        [Nihai İnfaz]: AI Kararı Bekleniyor
        `;

        const hedef_veri = {
            urun_adi: `Meta Ads Radarı: ${hedefMarkaVeyaUrun}`,
            ai_satis_karari: 'İZLE',
            trend_skoru: 50,
            artis_yuzdesi: Math.floor(Math.random() * 5),
            hedef_kitle: 'Duyarlı / Organik Müşteri',
            erken_trend_mi: false,
            hermania_karar_yorumu: hermaiSebebi.trim(),
            ai_guven_skoru: 95
        };

        await KuyrugaEkle('ai_jobs', {
            ajan_adi: 'BOT 4: META ORGANİK SAĞLIK DEDEKTİFİ',
            istek_tipi: 'META_REKLAM_TARAMA',
            prompt: g_prompt,
            hedef_tablo: 'b1_arge_products',
            hedef_veri: hedef_veri
        });

        console.log(`[BAŞARILI] Bot 4 Görevi Redis Kuyruğuna Bıraktı.`);
        return { durum: 'kuyrukta' };

    } catch (e) {
        console.error(`[BOT 4] Sistem Çöküşü: ${e.message}`);
        if (browser) await browser.close();
        return null;
    }
}

if (require.main === module) {
    bot4MetaReklamAjani("Saten Abiye");
}

module.exports = { bot4MetaReklamAjani };
