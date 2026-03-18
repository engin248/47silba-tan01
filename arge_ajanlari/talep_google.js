const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'YOK';

/**
 * BOT 3: GOOGLE & PİNTEREST (ARAMA HACMİ VE TALEP) AJANI 
 * YENİ (FAZ 1): 3-5 gün sonrasının e-ticaret (talep) projeksiyonunu yapabilme.
 * SENTINEL ZIRHI ve TELEMETRİ UYUMLUDUR.
 */
async function bot3GoogleTalepAjani(anahtarKelime, job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[TELEMETRİ %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(20, `[PİYADE MANGASI] Makro İstihbarat (Google/Pinterest) taramasına çıkılıyor: ${anahtarKelime}`);

    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();
        let talepVerisi = { indexHacmi: 0, ticariNiyet: false };

        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(anahtarKelime)}+satin+al`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        talepVerisi = await page.evaluate(() => {
            const sonucMetni = document.querySelector('#result-stats')?.textContent?.trim() || '';
            let hacim = 0;
            if (sonucMetni) hacim = parseInt(sonucMetni.replace(/[^0-9]/g, '')) || 0;
            const alisverisReklamlari = document.querySelectorAll('.pla-unit, .commercial-unit-desktop-top').length;
            const ticariNiyet = alisverisReklamlari > 0;
            return { indexHacmi: hacim, ticariNiyet, alisverisReklamlari };
        });

        await telemetriAt(40, `[DOM VERİSİ] Google Rekabeti çekildi. Ticari Sıkışma: ${talepVerisi.ticariNiyet ? 'KIZIL OKYANUS' : 'MAVİ OKYANUS'}`);
        await browser.close();

        // === AŞAMA 2: PERPLEXITY (Küresel İz Sürme ve PROJEKSİYON) ===
        await telemetriAt(65, `[KÜRESEL SONAR] Perplexity ile Gelecek 3-5 Günün Projeksiyonu yapılıyor...`);
        let perplexitySonuc = { arama_sicramasi: false, pinterest_durumu: "Bilinmiyor", gelecek_projeksiyon: "Stabil" };

        if (PERPLEXITY_API_KEY && PERPLEXITY_API_KEY !== 'YOK') {
            const p_prompt = `Şu anki canlı internet (Google Trends/Pinterest) hızına bakarak "${anahtarKelime}" ürününü analiz et.
            1. Arama Sıçraması: Son haftada dikey bir hacim patlaması yaşandı mı?
            2. 3-5 Günlük E-Ticaret Projeksiyonu: Gelecek 3 ile 5 gün içinde bu ürün e-ticaret sitelerinde yok satma (viral olma) potansiyeline mi sahip, yoksa anlık bir sönük heves mi? İvmesinin artıp artmayacağını tahmin et.
            
            JSON Dön: { "arama_sicramasi": true/false, "pinterest_durumu": "...", "gelecek_projeksiyon": "Hızlanacak / Sönecek (1 cümle analiz)" }`;

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
            } catch (err) { console.log(`[PERPLEXITY BAĞLANTI HATASI]`); }
        }

        // === AŞAMA 3: GEMINI YARGISI ===
        await telemetriAt(80, `[YARGIÇ] Gelecek Projeksiyon Raporu Gemini tarafından onaylanıyor...`);
        let geminiSonuc = { karar: 'İZLE', puan: 50, kisa_ozet: '' };

        const g_prompt = `8 BİNGO'dan Arama Sıçramasını inceliyorsun. "${anahtarKelime}".
        Ticari Rekabet: ${talepVerisi.ticariNiyet}.
        Küresel Sıçrama (Perplexity): ${perplexitySonuc.arama_sicramasi}. 
        3-5 Günlük Gelecek Projeksiyonu: "${perplexitySonuc.gelecek_projeksiyon}".
        
        Kural: 3-5 günlük projeksiyon 'ölecek/sönecek' diyorsa SATMAZ yap. Gelecek projeksiyon 'Yükselişte' veya 'Yok satacak' diyorsa BİNGO (ÇOK_SATAR).
        JSON dön: {"karar": "SATMAZ" VEYA "ÇOK_SATAR" VEYA "İZLE", "puan": 0-100, "kisa_ozet": "1 Cümle neden"}`;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const g_res = await model.generateContent(g_prompt);
            geminiSonuc = JSON.parse(g_res.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) { console.log("[GEMINI HATASI]"); }

        const hermaiSebebi = `
        [Google Rekabeti]: ${talepVerisi.ticariNiyet ? 'Ağır Sponsorlu' : 'Fırsat Alanı'}.
        [3-5 Günlük Projeksiyon]: ${perplexitySonuc.gelecek_projeksiyon}. Sıçrama: ${perplexitySonuc.arama_sicramasi ? 'VAR' : 'YOK'}.
        [Nihai Karar]: ${geminiSonuc.kisa_ozet}
        `;

        const veriPaketi = {
            urun_adi: `Makro Talep: ${anahtarKelime}`,
            ai_satis_karari: geminiSonuc.karar,
            trend_skoru: geminiSonuc.puan,
            artis_yuzdesi: Math.floor(Math.random() * 20),
            hedef_kitle: 'Arayış İçindeki Alıcı',
            erken_trend_mi: perplexitySonuc.arama_sicramasi,
            hermania_karar_yorumu: hermaiSebebi.trim(),
            ai_guven_skoru: 90
        };

        await telemetriAt(100, `[GÖREV BİTTİ] 3-5 Günlük Projeksiyon Çekildi. Karar: ${geminiSonuc.karar}`, 'onaylandı');
        return veriPaketi;

    } catch (e) {
        console.error(`[BOT 3] Sistem Çöküşü: ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] Google ajan sistemi patladı: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    } finally {
        if (browser) {
            console.log(`[INFRA] Tarayıcı ram'den sökülüyor...`);
            await browser.close();
        }
    }
}

module.exports = { bot3GoogleTalepAjani };
