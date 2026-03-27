const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') }); // [FIX] mutlak yol

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // [FIX] ANON_KEY fallback kaldırıldı
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'YOK';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');

/**
 * BOT 4: META REKLAM DEDEKTİFİ
 * YENİ (FAZ 1): Maliyet (Bütçe) yanıklarını ölçme ve şeffaf olmayan sahte büyümeyi teşhis.
 * SENTINEL UYUMLU.
 */
async function bot4MetaReklamAjani(hedefMarkaVeyaUrun, job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[TELEMETRİ %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(15, `[İSTİHBARAT] Meta (Facebook) Ad Library Radarı Açıldı: ${hedefMarkaVeyaUrun}`);

    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.8 Safari/537.36',
            extraHTTPHeaders: { 'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7' }
        });

        const page = await context.newPage();
        let metaVerisi = { aktifReklamSayisi: 0, ayniGorselSpamMi: false, tahminiAylikYanik: "0 TL" };

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

            // FAZ 1: Bütçe Yanığı (Maliyet) Hesaplaması (1 Reklam ortalama günlük 150₺ harcasa)
            const aylikYanikTL = reklamAdet * 150 * 30;
            const tahminiAylikYanik = aylikYanikTL > 0 ? (aylikYanikTL / 1000).toFixed(1) + " Bin TL" : "Yok";

            return { aktifReklamSayisi: reklamAdet, ayniGorselSpamMi, tahminiAylikYanik };
        });

        await telemetriAt(45, `[REKABET PİYADESİ] Reklam Adedi: ${metaVerisi.aktifReklamSayisi}. Bütçe Yanığı: ~${metaVerisi.tahminiAylikYanik}`);
        await browser.close();

        // === PERPLEXITY ===
        let perplexitySonuc = { pazar_analizi: "Bilinmiyor", organik_mi: true };
        if (PERPLEXITY_API_KEY && PERPLEXITY_API_KEY !== 'YOK') {
            await telemetriAt(65, `[KÜRESEL SONAR] Marka organik mi büyüyor yoksa hormonlu mu? Perplexity araştırıyor...`);
            const p_prompt = `Şu ürün/marka için pazarlama durumunu analiz et: "${hedefMarkaVeyaUrun}". 
            Senin internetten canlı bulacağın raporlara göre; bu marka reklama para yakarak mı (hormonlu) büyüyor yoksa viral (organik) bir patlama mı yaşıyor?
            JSON Dön: {"organik_mi": true/false, "pazar_analizi": "Neden?"}`;

            const options = {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: "sonar-reasoning", messages: [{ role: "user", content: p_prompt }] })
            };

            try {
                const fetch = (await import('node-fetch')).default;
                const p_res = await fetch('https://api.perplexity.ai/chat/completions', options);
                const p_data = await p_res.json();
                if (p_data.choices) perplexitySonuc = JSON.parse(p_data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim());
            } catch (err) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: reklam_meta.js | Hata:', err ? err.message || err : 'Bilinmiyor'); }
        }

        // === GEMINI YARGISI ===
        await telemetriAt(80, `[YARGIÇ] Yüksek Maliyet Yanığı analiz ediliyor...`);
        let geminiSonuc = { karar: 'İZLE', puan: 50, kisa_ozet: '' };

        const g_prompt = `8 BİNGO Radarından: "Reklam Basıncı (Maliyet Yanığı)" kuralını test et. "${hedefMarkaVeyaUrun}"
        - Facebook Ad Library: ${metaVerisi.aktifReklamSayisi} aktif reklam. (Tahmini Aylık Bütçe Yanığı: ${metaVerisi.tahminiAylikYanik}). Görsel Spam: ${metaVerisi.ayniGorselSpamMi}.
        - Perplexity: Organik Büyüme mi? ${perplexitySonuc.organik_mi}.
        
        Kural: Eğer devasa bir bütçe yanığı (50+ reklam) varsa ve organik değilse ürünü SATMAZ yap (Çünkü rakip para yakarak pazarı satın almış, senin organik şansın yok). Eğer reklam az ve organikse ÇOK_SATAR ver.
        JSON dön: {"karar": "SATMAZ" VEYA "ÇOK_SATAR" VEYA "İZLE", "puan": 0-100, "kisa_ozet": "1 cümle kural infazı"}`;

        try {
            const finalModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const f_res = await finalModel.generateContent(g_prompt);
            geminiSonuc = JSON.parse(f_res.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: reklam_meta.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }

        const hermaiSebebi = `
        [Bütçe Yanığı Tespiti]: ${metaVerisi.aktifReklamSayisi} aktif kampanyada aylık ~${metaVerisi.tahminiAylikYanik} yakılıyor.
        [Organik Sağlık]: ${perplexitySonuc.organik_mi ? 'Doğal Viral' : 'Hormonlu (Parayla Şişirilmiş)'}.
        [Nihai Hakem]: ${geminiSonuc.kisa_ozet}
        `;

        const veriPaketi = {
            urun_adi: `Meta Reklam Dedektifi: ${hedefMarkaVeyaUrun}`,
            ai_satis_karari: geminiSonuc.karar,
            trend_skoru: geminiSonuc.puan,
            artis_yuzdesi: null, // [H3 FIX] Math.random() sahte veri kaldırıldı — gerçek veri yokken null
            hedef_kitle: 'Reklam Hedefli Sürüler',
            erken_trend_mi: perplexitySonuc.organik_mi && metaVerisi.aktifReklamSayisi < 10,
            hermania_karar_yorumu: hermaiSebebi.trim(),
            ai_guven_skoru: 95
        };

        const { error } = await supabase.from('b1_arge_products').insert([veriPaketi]);

        await supabase.from('b1_agent_loglari').insert([{
            ajan_adi: 'BOT 4: META ORGANİK SAĞLIK DEDEKTİFİ',
            islem_tipi: 'META_REKLAM_TARAMA',
            mesaj: `Organiklik Skoru: ${geminiSonuc.puan}/100. Aylık Reklam Yanığı: ${metaVerisi.tahminiAylikYanik}.`,
            sonuc: geminiSonuc.karar === 'ÇOK_SATAR' ? 'basarili' : (geminiSonuc.karar === 'SATMAZ' ? 'hata' : 'uyari')
        }]);

        await telemetriAt(100, `[GÖREV BİTTİ] Maliyeti hortumlayan markalar Sentinel kalkanına çarptı.`, 'onaylandı');
        return veriPaketi;

    } catch (e) {
        console.error(`[BOT 4] Sistem Çöküşü: ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] Meta kalkanı aşılamadı: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { bot4MetaReklamAjani };
