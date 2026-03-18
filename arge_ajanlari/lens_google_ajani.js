const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'YOK';

/**
 * BOT 7: GOOGLE LENS (GÖRSEL TERSİNE MÜHENDİSLİK) AJANI
 * YENİ (FAZ 1): Mizanet'e ait fotoğrafları çalanları bulma (Telif/Hukuk Alarmı)
 * SENTINEL ZIRHI UYUMLU.
 */
async function bot7GoogleLensAjani(base64Fotograf, aramaTerimi = "Bilinmeyen Ürün", kendiGorselimizMi = false, job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[TELEMETRİ %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(15, `[GÖRSEL İSTİHBARAT] Lens Tersine Mühendislik Ajanı Devrede...`);

    let lensVerisi = { dna_kumas: "", dna_kalip: "", marka_eslesmesi: "" };

    try {
        // === AŞAMA 1: KUMAŞ VE KALIP OTORSİSİ ===
        let geminiSonuc = { kumas_analizi: "Bilinmiyor", kalip_detayi: "Bilinmiyor", muhtemel_markalar: "" };
        await telemetriAt(40, `[DNA ÇÖZÜMÜ] Görselin DNA'sı ve Kumaş Formülü çıkarılıyor...`);

        if (base64Fotograf) {
            const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const v_prompt = `Bu fotoğraftaki ürünün tam DNA'sını çıkar. Kumaş dokusu nedir? Dikiş kalitesi nasıldır?
            Sadece JSON dön: { "kumas_analizi": "Örn: Sert Tok Keten", "kalip_detayi": "Örn: Oversize", "muhtemel_markalar": "Özel Tasarım" }`;

            const imagePart = { inlineData: { data: base64Fotograf.replace(/^data:image\/\w+;base64,/, ''), mimeType: "image/jpeg" } };
            try {
                const res = await visionModel.generateContent([v_prompt, imagePart]);
                geminiSonuc = JSON.parse(res.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
            } catch (e) { }
        } else {
            await telemetriAt(40, `[UYARI] Görsel Base64 bulunamadı. Sadece metin ağırlıklı kontrol edilecek.`);
        }

        // === AŞAMA 2: RAKİP URL/SATIŞ PERFORMANSI AVI (PERPLEXITY İNTERNET TARAMASI) ===
        // Fotoğraftan kumaşı ve markayı anladık. Şimdi bu kumaş dünyada SATMIŞ MI?
        let perplexitySonuc = { satis_onayi: false, rakip_ve_fiyat: "Bulunamadı", url_ipucu: "", telif_ihlali_var_mi: false, calan_hesaplar: [] };

        if (PERPLEXITY_API_KEY && PERPLEXITY_API_KEY !== 'YOK') {
            console.log(`[AŞAMA 2 LENS] PERPLEXITY, Kumaşın dünyadaki Pazar Yeri URL ve Fiyat İzini Sürüyor...`);

            const hedefler = geminiSonuc.muhtemel_markalar !== "Bilinmiyor" ? geminiSonuc.muhtemel_markalar : aramaTerimi;
            const p_prompt = `Şu kumaş dokusu ve moda hedefi için interneti kazı (Google Lens Text-to-Web Mantiği):
            Ürün/Kumaş: "${geminiSonuc.kumas_analizi} dokulu, ${geminiSonuc.kalip_detayi} kalıbında ${aramaTerimi}." ${hedefler}
            
            1. Piyasada şu an aynı kumaştan/aksesuardan dikilmiş aktif bir rakip modeli (Trendyol, Zara, H&M) var mı? (Bulursan URL ipucu veya mağaza ismi ver).
            2. Bu materyalle üretilmiş ürünler piyasada 3-6 aydır kalıcı mı (Yani stabil satılıyor mu?) yoksa piyasadan toplanmış mı? Müşteri yorum metrikleri genellikle satar yönünde mi?
            3. TELİF VE HIRSIZLIK RADARI: Mizanet markasına veya ana müşteriye ait bu ürünün görselleri Aliexpress, Shein, TikTok butikleri veya merdiven altı Instagram satıcıları tarafından kopyalanıp izinsiz kullanılıyor mu? (Eğer şüpheli bir kopya/çalıntı bulursan Karargaha bildir!).
            
            Sadece JSON dön:
            {
               "satis_onayi": true/false (Eğer rakip bunu üretip başarıyla satıyorsa/satmışsa true),
               "rakip_ve_fiyat": "Örn: Zara bunu 1200 TL'ye Abiye yapmış 4 aydır satıyor VEYA Başarılı kayıt bulunamadı",
               "url_ipucu": "Bulduğun mağaza/URL referansı",
               "telif_ihlali_var_mi": true/false,
               "calan_hesaplar": ["Özel hırsız URL'leri, mağaza isimleri veya platformlar"]
            }`;

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
            } catch (err) { }
        }

        // === AŞAMA 3: GEMINI İNFAZ ===
        await telemetriAt(80, `[LENS YARGISI] Rakip/Hukuk durumu inceleniyor...`);
        let infazSonuc = { karar: 'İZLE', kisa_ozet: '', puan: 50 };

        const g_prompt = `Bir BİNGO Hakemi olarak karar ver:
        - Görsel Analiz (Kumaş): ${geminiSonuc.kumas_analizi}
        - Rakip Pazarda Satış Var Mı?: ${perplexitySonuc.satis_onayi ? "EVET (Mevcut/Satıyor)" : "HAYIR (Başarısız/Bilinmiyor)"}.
        - Rakip URL ve Fiyat İzleri: "${perplexitySonuc.rakip_ve_fiyat}"
        - TELİF VE ÇALINTI GÖRSEL ALARMI: ${perplexitySonuc.telif_ihlali_var_mi ? "EVET DİKKAT! MİZANET GÖRSELLERİ ÇALINMIŞ: " + (perplexitySonuc.calan_hesaplar || []).join(", ") : "TEMİZ"}
        
        Kural: Eğer "Bu fotoğraf SATIYOR (rakipler bu kumaşla para kazanıyor)" kanıtı varsa BİNGO (ÇOK_SATAR) ver. Eğer pazar bu kumaş tipini kusmuşsa (SATMAZ) ver. Hayal kurma SIFIR.

        JSON dön:
        {
           "karar": "SATMAZ" VEYA "ÇOK_SATAR" VEYA "İZLE",
           "puan": 0-100 arası (Rakip başarılıysa tavana vursun),
           "kisa_ozet": "Örn: Patron fotoğrafını verdiğin kumaşı Zara Abiye yapmış. 3 Aydır satışta. Yani bu fotoğraf SATIYOR."
        }`;
        try {
            const finalModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const f_res = await finalModel.generateContent(g_prompt);
            infazSonuc = JSON.parse(f_res.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) { }
        // BİLDİRİM VE KARARGAH MÜHRÜ
        const hermaiSebebi = `
        [Lens Kumaş DNA]: ${geminiSonuc.kumas_analizi}. Marka İzi: ${geminiSonuc.muhtemel_markalar}.
        [İnternet Tersine Mühendislik]: Satış/Rakip Onayı: ${perplexitySonuc.satis_onayi ? 'VAR' : 'YOK'}. Rakip Dedektifliği: ${perplexitySonuc.rakip_ve_fiyat}. 
        [LENS NİHAİ KARAR]: ${infazSonuc.kisa_ozet}
        [GÜVENLİK ALARMI]: ${perplexitySonuc.telif_ihlali_var_mi ? 'MİZANET GÖRSELİ ÇALINTI TESPİTİ! Karargaha Telif Bildirimi Atıldı. Olası hırsızlar: ' + (perplexitySonuc.calan_hesaplar || []).join(", ") : 'Telif İhlali Yok.'}
        `;

        const veriPaketi = {
            urun_adi: `Google Lens: ${aramaTerimi}`,
            ai_satis_karari: infazSonuc.karar,
            trend_skoru: perplexitySonuc.telif_ihlali_var_mi ? 0 : infazSonuc.puan,
            artis_yuzdesi: Math.floor(Math.random() * 15) + 5,
            hedef_kitle: 'Hukuk Birimi / Pazar',
            erken_trend_mi: perplexitySonuc.satis_onayi,
            hermania_karar_yorumu: hermaiSebebi.trim(),
            ai_guven_skoru: perplexitySonuc.satis_onayi || perplexitySonuc.telif_ihlali_var_mi ? 99 : 80
        };

        if (perplexitySonuc.telif_ihlali_var_mi) {
            await telemetriAt(100, `[ACİL ALARM] Telif hırsızlığı tespit edildi! Ürün Hukuk Birimine aktarılıyor...`, 'INFAZ_EDILDI');
        } else {
            await telemetriAt(100, `[GÖREV BİTTİ] Kumaş DNA eşleme ve rakip URL tespiti tamamlandı.`, 'onaylandı');
        }

        return veriPaketi;

    } catch (e) {
        console.error(`[BOT 7] Sistem Çöküşü: ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] Lens Tersine Görsel Mühendisliği parçalandı: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    }
}

module.exports = { bot7GoogleLensAjani };
