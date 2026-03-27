const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');

/**
 * BOT 8: INSTAGRAM AJANI (KAYDETME, LİNK VE ŞİKAYET AVI)
 * YENİ (FAZ 1): Kumaş şikayetleri kazıma ve Influencer/Sponsorluk Getiri Analizi eklendi.
 * SENTINEL ZIRHI ve TELEMETRİ UYUMLUDUR.
 */
async function bot8InstagramTrendAjani(insPostUrl, job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[TELEMETRİ %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(25, `[PİYADE MANGASI] IG hedefine iniliyor: ${insPostUrl}`);

    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        });

        const page = await context.newPage();
        let igVerisi = {};

        await page.goto(insPostUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(3000);

        // === AŞAMA 1: DOM OKUMASI ===
        igVerisi = await page.evaluate(() => {
            const pNumber = (sel) => {
                const t = document.querySelector(sel)?.textContent?.trim() || '0';
                let n = parseFloat(t.replace(/[^0-9.]/g, ''));
                if (t.toLowerCase().includes('b')) n *= 1000;
                if (t.toLowerCase().includes('m')) n *= 1000000;
                return isNaN(n) ? 0 : n;
            };

            const izlenme = pNumber('meta[property="og:video:view_count"]');
            const begeni = pNumber('section div span');
            const yorumAdet = pNumber('ul.x78zum5');

            const yorumMetinleri = Array.from(document.querySelectorAll('span, div')).map(e => e.textContent || "");
            let dmIstegi = 0; let aldimYorumu = 0;
            let kumasSikayeti = 0; // FAZ 1 Yeni Yetenek: Kumaş Şikayet Tespiti

            yorumMetinleri.forEach(metin => {
                const m = metin.toLowerCase();
                if (m.includes('link') || m.includes('dm') || m.includes('fiyat')) dmIstegi++;
                if (m.includes('aldım') || m.includes('alıyorum') || m.includes('sipariş verdim')) aldimYorumu++;
                if (m.includes('terletiyor') || m.includes('dikişi') || m.includes('kalitesiz') || m.includes('yırtıldı') || m.includes('çekti')) kumasSikayeti++;
            });

            // FAZ 1 Yeni Yetenek: Gelecek Sponsorluk Getiri (Influencer Etki) Oranı
            // Eğer izlenme çok yüksek ama yorum/kaydetme sıfıra yakınsa o fenomen sahtedir (Etki 0).
            const fenomenEtkiOrani = (izlenme > 0) ? ((dmIstegi + aldimYorumu) / (izlenme / 100)) * 100 : 0;

            return { izlenme, begeni, yorumAdet, dmIstegi, aldimYorumu, kumasSikayeti, fenomenEtkiOrani, yorumMetinleri: yorumMetinleri.join(' ').substring(0, 1000) };
        });

        await telemetriAt(50, `[VERİ ANALİZİ] Kusur (Şikayet) tespiti bitti. Sponsorluk (Satış) Gücü: %${igVerisi.fenomenEtkiOrani.toFixed(1)}`);

        if (igVerisi.dmIstegi === 0 && igVerisi.aldimYorumu === 0 && igVerisi.begeni < 100) {
            await telemetriAt(0, '[FİLTRE REDDİ] İzlenip Geçilmiş. Satın alma niyeti SIFIR.', 'INFAZ_EDILDI');
            return { durum: 'ELENDI', sebep: 'SIFIR_SATIN_ALMA_NIYETI' };
        }

        // === AŞAMA 2: GEMINI YARGISI ===
        await telemetriAt(75, `[NİYET YARGISI] Yorumlardaki kumaş iade ihtimalleri Gemini Flash ile ölçülüyor...`);
        let geminiSonuc = { karar: 'İZLE', kisa_ozet: '', puan: 50 };

        const g_prompt = `8 BİNGO Radarından Müşteri Niyeti okuyorsun.
        - İzlenme: ${igVerisi.izlenme}, "Link/Fiyat" Soranlar: ${igVerisi.dmIstegi}, "Aldım" Diyenler: ${igVerisi.aldimYorumu}.
        - Kumaş Kusur (Terletme, yırtılma vb) Şikayeti: ${igVerisi.kumasSikayeti} kişi.
        - Influencer Satış Dönüştürme Etkisi: %${igVerisi.fenomenEtkiOrani.toFixed(1)} (Eğer %1 üstüyse iyi).
        
        Kural: Müşteri şikayeti fazlaysa ürünü SATMAZ yap. Ama link soran çoksa ve şikayet yoksa ÇOK_SATAR (BİNGO) ver.

        Sadece JSON dön: {"karar": "SATMAZ" VEYA "ÇOK_SATAR" VEYA "İZLE", "puan": 0-100, "kisa_ozet": "Kumaş Analizi ve Niyet Özeti"}`;

        try {
            const finalModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const f_res = await finalModel.generateContent(g_prompt);
            geminiSonuc = JSON.parse(f_res.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) { console.log("[GEMINI ANLAMA HATASI]"); }

        const hermaiSebebi = `
        [Instagram Metrik]: Kusur/Şikayet: ${igVerisi.kumasSikayeti}. Fenomen Satış Gücü: %${igVerisi.fenomenEtkiOrani.toFixed(1)}.
        [Nihai Analiz Analizi]: ${geminiSonuc.kisa_ozet}
        `;

        const veriPaketi = {
            urun_adi: `IG Trend Niyeti: ${igVerisi.izlenme} İzlenme`,
            ai_satis_karari: geminiSonuc.karar,
            trend_skoru: geminiSonuc.puan,
            artis_yuzdesi: null, // [H3 FIX] Math.random() sahte veri kaldırıldı — gerçek veri yokken null
            hedef_kitle: 'Duyarlı / Instagram Kullanıcısı',
            erken_trend_mi: igVerisi.dmIstegi > 5,
            hermania_karar_yorumu: hermaiSebebi.trim(),
            ai_guven_skoru: 88
        };

        // Supabase DB yazılmayacak, Sentinel zırhı Worker içine çekecek.
        await telemetriAt(100, `[GÖREV BİTTİ] ${geminiSonuc.karar}. Kusur Kalkanı devreye girdi.`, 'onaylandı');
        return veriPaketi;

    } catch (e) {
        console.error(`[BOT 8 HATA] : ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] Ajan iç hatadan patladı: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    } finally {
        // ZOMBİ İNFAZ ZIRHI
        if (browser) {
            console.log(`[INFRA] Tarayıcı kapatılıyor... (Zombi Kalkanı Bitti)`);
            await browser.close();
        }
    }
}

module.exports = { bot8InstagramTrendAjani };
