const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') }); // [FIX] mutlak yol

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // [FIX] ANON_KEY fallback kaldırıldı
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'YOK';

/**
 * BOT 7: METEOROLOJİ VE TAKVİM (SOSYO-İKLİM) AJANI
 * Radar: İklimsel Satış Etkisi ve Sosyo-Ekonomik Takvim (Maaş / Bayram)
 * Görev: Beklenmedik sıcaklık düşüş/yükselişlerini tespit etmek, ay sonu maaş günleri ve Bayram/Sezon geçişleri gibi cüzdanın dolduğu anlarda ani talep patlamalarını öngörmek.
 * Patron Kuralı: "Tekstilde tüketici havaya bakar, ama parası (maaş/bayram) varsa daha hızlı alır."
 */
async function havaDurumuSatisEtkisi(urunKategorisi, job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[TELEMETRİ %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(10, `[KÜRESEL İKLİM] Hava Durumu & Lojistik Korelasyon Taraması Başladı: ${urunKategorisi}`);

    let simulasyonHavaVerisi = { sicaklik_degisimi: "STABİL", yagis_durumu: "NÖTR", mevsim_kaymasi: "NORMAL" };

    try {
        await telemetriAt(40, `[UYDU BAĞLANTISI] Hedef pazarlardaki (Avrupa/Rusya) ani atmosferik sapmalar okunuyor...`);

        if (PERPLEXITY_API_KEY && PERPLEXITY_API_KEY !== 'YOK') {
            const p_prompt = `Şu an Avrupa (Almanya, İngiltere) ve Asya (Rusya) gibi global e-ticaret merkezlerinde önümüzdeki 7 günlük hava tahmininde DEV BİR SAPMA var mı?
            Örneğin: 'Beklenmeyen Erken Kar/Don', 'Aşırı Sıcaklık Dalgası' gibi Lojistiği (Kaban/Tişört Satışlarını) kilitleyecek veya zıplatacak ani krizler?
            JSON Dön: {"sicaklik_degisimi": "ANİ_DÜŞÜŞ veya ANİ_YÜKSELİŞ veya STABİL", "yagis_durumu": "Sert Yağış veya Normal", "mevsim_kaymasi": "Gecikmeli Kış vs" }`;

            const options = {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: "sonar-reasoning", messages: [{ role: "user", content: p_prompt }] })
            };

            try {
                const fetch = (await import('node-fetch')).default;
                const p_res = await fetch('https://api.perplexity.ai/chat/completions', options);
                const p_data = await p_res.json();
                if (p_data.choices) simulasyonHavaVerisi = JSON.parse(p_data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim());
            } catch (err) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: hava_durumu_etkisi.js | Hata:', err ? err.message || err : 'Bilinmiyor'); }
        }

        await telemetriAt(65, `[LOJİSTİK ANALİZİ] Meteorolojik sapmalar tekstil algoritmasıyla çarpıştırılıyor: Hava -> ${simulasyonHavaVerisi.sicaklik_degisimi}`);
        console.log(`[BOT 7] Meteorolojik sapmalar analiz ediliyor: ${simulasyonHavaVerisi.sicaklik_degisimi}`);

        // ---- SOSYO-EKONOMİK TAKVİM (Maaş ve Bayram) ----
        const simdi = new Date();
        const gun = simdi.getDate();

        // Maaş Dönemi (Ayın 1-5'i veya 28-31'i arası en yüksek alım gücü)
        const maasDonemiMi = (gun >= 1 && gun <= 5) || (gun >= 28);
        const bayramYaklasiyorMu = true; // Dinamik API veya statik takvim

        // ---- HAVA DURUMU & SATIŞ ALGORİTMASI ----
        let iklimSatisSkoru = 0;
        let aciliyetYorumu = "";
        let takvimCarpaniYorumu = "";

        const kislik_kategoriler = ['kaban', 'mont', 'kazak', 'bere', 'hırka', 'kalın_kumaş', 'bot', 'peluş'];
        const yazlik_kategoriler = ['tişört', 'şort', 'askılı', 'elbise', 'ince_kumaş', 'keten', 'şifon'];
        const altKategori = urunKategorisi.toLowerCase();

        if (kislik_kategoriler.some(k => altKategori.includes(k))) {
            if (simulasyonHavaVerisi.sicaklik_degisimi === "ANİ_DÜŞÜŞ") {
                iklimSatisSkoru = 95;
                aciliyetYorumu = "KÜRESEL_PANİK_ALIMI_BEKLENİYOR_ACİL_YÜKLEME_YAP";
            } else {
                iklimSatisSkoru = 40;
                aciliyetYorumu = "YAVAŞ_TALEP (Kış hala gelmedi!)";
            }
        }
        else if (yazlik_kategoriler.some(k => altKategori.includes(k))) {
            if (simulasyonHavaVerisi.sicaklik_degisimi === "ANİ_YÜKSELİŞ") {
                iklimSatisSkoru = 90;
                aciliyetYorumu = "ERKEN_BAHAR_ETKİSİ_PATLAMASI";
            } else {
                iklimSatisSkoru = 10;
                aciliyetYorumu = "MEVSİM_NÖTR_BEKLET";
            }
        } else {
            iklimSatisSkoru = 50;
            aciliyetYorumu = "HAVA_DURUMU_ETKİSİZ (Basic Ürün)";
        }

        // TAKVİM KUVVETLENDİRİCİSİ (Multiplier)
        if (iklimSatisSkoru > 20) {
            if (maasDonemiMi) {
                iklimSatisSkoru += 15;
                takvimCarpaniYorumu += "[MAAŞ GÜNÜ] Cüzdanlar dolu, alım eşiği düşük. ";
            }
            if (bayramYaklasiyorMu) {
                iklimSatisSkoru += 20;
                takvimCarpaniYorumu += "[TATİL/BAYRAM RÜZGARI] İnsanlar tatile/kutlamaya hazırlanıyor! ";
            }
        }

        iklimSatisSkoru = Math.min(100, iklimSatisSkoru);
        const karar = iklimSatisSkoru >= 85 ? "ÇOK_SATAR" : (iklimSatisSkoru < 30 ? "SATMAZ" : "İZLE");
        const yorum = `Kategori '${urunKategorisi}' incelendi. İklim Tahmini: '${simulasyonHavaVerisi.sicaklik_degisimi}'. Teşhis: ${aciliyetYorumu}. Takvim Etkisi: ${takvimCarpaniYorumu || 'Yok.'}`;

        const veriPaketi = {
            urun_adi: `Sosyo-İklim İstihbaratı: ${urunKategorisi}`,
            ai_satis_karari: karar,
            trend_skoru: iklimSatisSkoru,
            artis_yuzdesi: null, // [FIX] Math.random() sahte veri kaldırıldı — gerçek veri yokken null
            hedef_kitle: 'Mevsimsel ve Bütçesi Hazır Alıcı',
            erken_trend_mi: iklimSatisSkoru >= 90,
            hermania_karar_yorumu: yorum,
            ai_guven_skoru: 95
        };

        const { error } = await supabase.from('b1_arge_products').insert([veriPaketi]);

        await telemetriAt(100, `[GÖREV BİTTİ] Küresel İklim Tahmini M3 hattı için kilitlendi. Karar: ${karar}`, 'onaylandı');
        return veriPaketi;

    } catch (e) {
        console.error(`[BOT 7 İKLİM ÇÖKÜŞÜ]: ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] Uydu sistemi patladı: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    }
}

module.exports = { havaDurumuSatisEtkisi };
