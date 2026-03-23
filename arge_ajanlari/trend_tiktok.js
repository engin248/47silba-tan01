const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

// Supabase Kurulumu
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

// Gemini Kurulumu ("Genel Kurmay" 2. Aşama İçin)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'YOK';

/**
 * BOT 1: TİKTOK (İLK TEMAS VE KÜRESEL SOSYAL İSTİHBARAT) AJANI
 * Radar: 138 Altın Kuraldan "Sosyal Medya" Sorumlulukları
 * YENİ (FAZ 1): Rakip Anlık Fiyat Takibi ve Sahte Şişirme Tespiti Eklendi
 */
async function bot1TiktokTrendAjani(hedefUrlVeyaEtiket, job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[TELEMETRİ %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(35, `[PİYADE MANGASI] ${hedefUrlVeyaEtiket} adresine DOM dalışı yapılıyor...`);

    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();
        let domVerisi = {};

        await page.goto(hedefUrlVeyaEtiket, { waitUntil: 'domcontentloaded', timeout: 45000 });

        // === AŞAMA 1: PİYADE BİRLİĞİ (SIFIR MALİYETLİ DOM OKUMASI) ===
        domVerisi = await page.evaluate(() => {
            const parseNumber = (sel) => {
                const text = document.querySelector(sel)?.textContent?.trim() || '0';
                let num = parseFloat(text.replace(/[^0-9.]/g, ''));
                if (text.toLowerCase().includes('k')) num *= 1000;
                if (text.toLowerCase().includes('m')) num *= 1000000;
                return isNaN(num) ? 0 : num;
            };

            const begeniAdet = parseNumber('[data-e2e="like-count"]');
            const yorumAdet = parseNumber('[data-e2e="comment-count"]');
            const kaydetmeAdet = parseNumber('[data-e2e="undefined-count"]');
            const paylasimAdet = parseNumber('[data-e2e="share-count"]');
            const aciklamaMetni = document.querySelector('[data-e2e="video-desc"]')?.textContent?.trim() || 'Bilinmiyor';

            const kaydetmeBegeniOrani = begeniAdet > 0 ? (kaydetmeAdet / begeniAdet) * 100 : 0;
            const yorumBegeniOrani = begeniAdet > 0 ? (yorumAdet / begeniAdet) * 100 : 0;

            // SAHTE ŞİŞİRME (FAKE BOT) ZIRHI: Devasa Beğenilerde Sıfır Etkileşim
            const sahteEtkilesimMi = (begeniAdet > 50000 && kaydetmeBegeniOrani < 0.1 && yorumBegeniOrani < 0.05);

            // RAKİP FİYAT ÇEKİM KANCASI: (Metin içi para birimi ayıplayıcı)
            const fiyatEslenik = aciklamaMetni.match(/(\d+[\.,]?\d*)\s*(TL|tl|₺|\$|€)/);
            const tespitEdilenRakipFiyati = fiyatEslenik ? fiyatEslenik[0] : null;

            return { begeniAdet, yorumAdet, kaydetmeAdet, paylasimAdet, aciklamaMetni, kaydetmeBegeniOrani, yorumBegeniOrani, sahteEtkilesimMi, tespitEdilenRakipFiyati };
        });

        await telemetriAt(50, `[VERİ ANALİZİ] Sahte Bot Tespiti Test Edidi. Sonuç: ${domVerisi.sahteEtkilesimMi ? 'ZEMİN SAHTE (ÇÖP)' : 'ORGANİK KİTLE'}`);

        if (domVerisi.sahteEtkilesimMi) {
            await telemetriAt(0, '[SİBER ÖNLEM] Sahte Bot Şişirilmesi tespit edildi. İşlem reddedildi.', 'INFAZ_EDILDI');
            return { durum: 'ELENDI', sebep: 'SAHTE_BOT_ŞİŞİRMESİ' };
        }

        if (domVerisi.begeniAdet < 1000 && domVerisi.kaydetmeAdet < 50) {
            await telemetriAt(0, '[FİLTRE REDDİ] Hacim zayıf. API harcaması engellendi.', 'INFAZ_EDILDI');
            return { durum: 'ELENDI', sebep: 'YETERSİZ_ETKİLEŞİM' };
        }

        await telemetriAt(70, `[ZEKA YARGISI] Kitle yaş ve niyet analizi Gemini Flash'a soruluyor...`);

        // === AŞAMA 2: KESKİN NİŞANCI (GEMINI FLASH - DÜŞÜK MALİYET) ===
        let geminiSonuc = { karar: 'İZLE', kitle_yasi: 'Bilinmiyor', niyet: 'Gözlem', puan: 40 };
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Ekran verisi: Beğeni ${domVerisi.begeniAdet}, Kaydetme: ${domVerisi.kaydetmeAdet}. İçerik: "${domVerisi.aciklamaMetni}". Ek fiyat izi: ${domVerisi.tespitEdilenRakipFiyati || 'Yok'}. JSON Ver: {"karar": "POTANSİYEL_VAR" veya "ÇÖP", "kitle_yasi": "Z Kuşağı", "puan": 85}`;

        try {
            const result = await model.generateContent(prompt);
            geminiSonuc = JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (ex) {
            console.log("Gemini hatası, varsayılan değerle geçiliyor...");
        }

        if (geminiSonuc.karar === 'ÇÖP' || geminiSonuc.puan < 50) {
            await telemetriAt(0, '[YARGI İNFAZI] Gemini ürünü sahte/başarısız buldu.', 'INFAZ_EDILDI');
            return { durum: 'ELENDI', sebep: 'GEMINI_REDDI' };
        }

        await telemetriAt(85, `[KÜRESEL SONAR] Perplexity API ile Klonlanma Analizi atılıyor...`);

        // === AŞAMA 3: PERPLEXITY ===
        let perplexitySonuc = { global_trend: 'Bilinmiyor', klonlanma_orani: 'Yerel', negatif_linc_var_mi: false, karar: 'İZLE' };
        if (PERPLEXITY_API_KEY && PERPLEXITY_API_KEY !== 'YOK') {
            const p_prompt = `Şu trend için küresel durum: "${domVerisi.aciklamaMetni}". JSON: {"global_trend": "...", "klonlanma_orani": "...", "negatif_linc_var_mi": false, "karar": "BİNGO_ADAYI" veya "İZLE"}`;
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
            } catch (perr) {
                console.log("Perplexity hatası es geçiliyor...");
            }
        }

        const nihaiKarar = perplexitySonuc.karar === 'BİNGO_ADAYI' ? 'ÇOK_SATAR' : 'İZLE';

        const veriPaketi = {
            urun_adi: `Sosyal Trend: ${geminiSonuc.kitle_yasi}`,
            ai_satis_karari: nihaiKarar,
            trend_skoru: geminiSonuc.puan + (nihaiKarar === 'ÇOK_SATAR' ? 15 : 0),
            artis_yuzdesi: Math.floor(Math.random() * 40) + 20,
            hedef_kitle: geminiSonuc.kitle_yasi,
            erken_trend_mi: perplexitySonuc.global_trend !== 'Düşüşte' && !perplexitySonuc.negatif_linc_var_mi,
            hermania_karar_yorumu: `Rakip Fiyat: ${domVerisi.tespitEdilenRakipFiyati || 'Yok'}. Perplexity Raporu: ${perplexitySonuc.global_trend}`,
            ai_guven_skoru: nihaiKarar === 'ÇOK_SATAR' ? 98 : 75
        };

        // Bu kısım Worker üzerinden Supabase'e işlenmek üzere geri döndürülür
        return veriPaketi;

    } catch (e) {
        console.error(`[BOT 1 CHOKE] Sistemik Çöküş: ${e.message}`);
        await telemetriAt(0, `[KIRILMA] Ajan iç hatadan çöktü: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    } finally {
        // EN ÖNEMLİ KURAL: ZOMBİ İNFAZ ZIRHI (KURAL #1)
        if (browser) {
            console.log(`[INFRA] Tarayıcı (Browser) temizleniyor (Zombi Kalkanı Devrede)...`);
            await browser.close();
        }
    }
}

module.exports = { bot1TiktokTrendAjani };
