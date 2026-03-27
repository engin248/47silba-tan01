const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // [FIX] ANON_KEY fallback kaldırıldı
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');

/**
 * BOT 9: 138 ALTIN KRİTER AJANI (BÖLGESEL İHRACAT VE İADE ZIRHI)
 * Görev: Ürün ÇOK_SATAR onayını ve M2 Kâr sınırını geçti. Fakat HANGİ PAZARDA satacak?
 * Arap Pazarı (Ortadoğu) ve Avrupa Pazarı için ayrı ayrı "Mizanet 138 Altın Kriter" skorlaması yapar.
 * İnisiyatifi sıfıra indirmek için "İade Risk Tahmini" kilitler.
 */
async function altinKriter138Ajani(urunKategorisi, urunDetayi, base64Gorsel = null, job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[138 KRİTER %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(10, `[ALTIN KRİTER] Bölgesel İhracat Filtresi Başladı: ${urunKategorisi}`);

    try {
        let kriterVerisi = { arap_skoru: 0, avrupa_skoru: 0, iade_riski: "BİLİNMİYOR", ihracat_karari: "BELİRSİZ" };

        await telemetriAt(40, `[KÜRESEL PAZAR] 138 Altın Kriter kontrol ediliyor (Arap & Avrupa Kültür Analizi)...`);

        const prompt = `Sen Mizanet'in baş ihracat (B2B) denetçisisin. Önünde "138 Altın Kriter" kitapçığı var.
        Ürün Kategorisi: "${urunKategorisi}".
        Ürün Detayı/Doku: "${urunDetayi}".
        
        Senden şunu bulmanı istiyorum:
        1. Arap / Ortadoğu Pazarı Uyum Skoru (0-100): Muhafazakar kesim, uzun boy, lüks kumaş, parlak taş, abiye tarzı yüksek mi?
        2. Avrupa / Batı Pazarı Uyum Skoru (0-100): Minimalist, sürdürülebilir, günlük kullanım, rahat kalıp, pastel/sade renkler mi?
        3. İade Risk Tahmini: Bu kumaş/kalıp tipinde (Örn: dar kalıp saten, şifon, ya da oversize keten) doğası gereği yüksek iade ('Müşteri Beğenmedi/Terletti' şikayeti) yaşanır mı?
        
        LÜTFEN SADECE ŞU JSON FORMATINDA DÖNÜŞ YAP (Başka hiçbir kelime ekleme):
        {
           "arap_pazari_skoru_100": (Rakam),
           "avrupa_pazari_skoru_100": (Rakam),
           "iade_risk_tehlikesi": "YÜKSEK, ORTA veya DÜŞÜK",
           "iade_gerekcesi_tahmini": "Neden iade edilir? 1 cümle ile açıkla.",
           "ihracat_hedef_karari": "SADECE ARAP, SADECE AVRUPA, KÜRESEL (İkisi de uygun), VEYA SATMAZ"
        }`;

        let aiSonuc = null;

        if (base64Gorsel) {
            await telemetriAt(50, `[GÖRSEL KRİTER] Görüntü destekli 138 Kriter analizi yapılıyor...`);
            const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const imagePart = { inlineData: { data: base64Gorsel.replace(/^data:image\/\w+;base64,/, ''), mimeType: "image/jpeg" } };
            const res = await visionModel.generateContent([prompt, imagePart]);
            aiSonuc = res.response.text();
        } else {
            const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const res = await textModel.generateContent(prompt);
            aiSonuc = res.response.text();
        }

        const cleanJson = aiSonuc.replace(/```json/g, '').replace(/```/g, '').trim();
        const analiz = JSON.parse(cleanJson);

        await telemetriAt(75, `[İHRACAT HAKEMİ] Arap Skoru: ${analiz.arap_pazari_skoru_100}, Avrupa Skoru: ${analiz.avrupa_pazari_skoru_100}. Karar: ${analiz.ihracat_hedef_karari}`);

        // ZIRHLAMA KURALI (İNSİYATİF SIFIR)
        // Eğer iade riski "YÜKSEK" ise ve her iki pazar skoru da 70'in altındaysa YASAKLA.
        let mizanetSonKarar = analiz.ihracat_hedef_karari;
        if (analiz.iade_risk_tehlikesi === "YÜKSEK" && Math.max(analiz.arap_pazari_skoru_100, analiz.avrupa_pazari_skoru_100) < 70) {
            mizanetSonKarar = "SATMAZ_RISKLI_IADE";
            await telemetriAt(85, `[İPTAL - RİSK ZIRHI] İade tehlikesi çok yüksek ve kültürel pazar uyumu yetersiz. Üretim iptal edildi.`);
        }

        const rapor_metni = `
        [138 Altın Kriter]: Ortadoğu Uyum Skoru: ${analiz.arap_pazari_skoru_100}/100. Avrupa Uyum Skoru: ${analiz.avrupa_pazari_skoru_100}/100.
        [İade Tehlikesi]: ${analiz.iade_risk_tehlikesi} (${analiz.iade_gerekcesi_tahmini}).
        [Karargah Kararı]: ${mizanetSonKarar}.
        `;

        const paket = {
            urun_adi: urunKategorisi,
            arap_skoru: analiz.arap_pazari_skoru_100,
            avrupa_skoru: analiz.avrupa_pazari_skoru_100,
            kuresel_karar: mizanetSonKarar,
            rapor: rapor_metni.trim()
        };

        await telemetriAt(100, `[GÖREV BİTTİ] 138 Kriter Export Filtresi Sonuçlandı: ${mizanetSonKarar}`, 'onaylandı');
        return paket;

    } catch (e) {
        console.error(`[BOT 9 ALTIN KRİTER ÇÖKTÜ]: ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] 138 Kriter motorunda mantık hatası: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    }
}

module.exports = { altinKriter138Ajani };
