const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

// Supabase Kurulumu
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // [FIX] ANON_KEY fallback kaldırıldı
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');

/**
 * BOT 8: BAŞ TASARIMCI (M3 KALIPHANE JENERATÖRÜ)
 * Görev: Sistemin "ÇOK_SATAR" onayı verdiği dağınık trendleri birleştirip yepyeni, Türkiye'de üretilmemiş BİNGO ürünleri tasarlamak.
 * Aşama 1: Sentezleyici -> Farklı trend raporlarını (ör: Kumaş A, Model B, Renk C) profesyonel resim promptuna dönüştür.
 * Aşama 2: Jeneratör -> (Gelecekte DALL-E 3 / Midjourney API eklenecek, şimdilik mockup resim URL'si ve Prompt üretilecek).
 */
async function bot8BasTasarimci(job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[TELEMETRİ %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(10, `[YARININ TASARIMCISI] M1 İstihbarat Merkezindeki "ÇOK SATAR" Ürünleri Sentezlemeye Başladı...`);

    try {
        // En son onaylanan "ÇOK SATAR" 3 ürünü al (Kumaş, Model, Hacim vizyonunu birleştireceğiz)
        const { data: trendListe, error } = await supabase
            .from('b1_arge_products')
            .select('*')
            .eq('ai_satis_karari', 'ÇOK_SATAR')
            .order('created_at', { ascending: false })
            .limit(3);

        if (error || !trendListe || trendListe.length === 0) {
            await telemetriAt(100, `[İPTAL] Karargah Onaylı (BİNGO) İstihbarat Bulunamadı. Sentez iptal.`, 'onaylandı');
            return null;
        }

        const sentezHammadde = trendListe.map((u, i) => `Trend ${i + 1}: "${u.urun_adi}" (Hedef Kitle: ${u.hedef_kitle}, İlham/AI Gerekçesi: ${u.hermania_karar_yorumu})`).join("\n");
        await telemetriAt(40, `[SENTEZ] 3 Başarılı ajan raporu eritiliyor. Özgün Kalıp Şeması Hazırlanıyor...`);

        // GEMİNİ: PROMPT MÜHENDİSİ VE TASARIM SENTEZİ
        let tasarimRaporu = { tasarim_adi: "Bilinmiyor", kumas_kalip_kombinasyonu: "Bilinmiyor", midjourney_prompt: "Bilinmiyor", satis_avantaji: "Bilinmiyor" };

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const g_prompt = `Şu an dünyanın en iyi Baş Tasarımcısı ve Moda Prompt Mühendisisin.
        Sana M1 Karargahındaki 3 ayrı "ÇOK_SATAR" onaylı istihbaratı veriyorum. Senin görevin bu 3 parçanın en güçlü yanlarını (birinin kumaşı, birinin rengi, diğerinin modeli) alıp, TÜRKİYE'DE DAHA ÖNCE ÜRETİLMEMİŞ, YEP YENİ ve 'Kusursuz Arbitraj' fırsatı sunan BİRLEŞTİRİLMİŞ bir moda ürünü yaratmak. 
        M3 Kalıphane ekibine direkte bu ürünü dikebilmeleri için tarif edeceksin.
        
        [DİKKAT KURAL 22 - ETİK VE TELİF ZIRHI]: Asla ve asla sana verilen referans ürünleri 1'e 1 kopyalama veya taklit etme (No Plagiarism / No Copyright Infringement). Diğer markaların logolarını, patentli kesimlerini veya doğrudan tasarımlarını kullanma. Sen bir 'Fotokopi Makinesi' değil, 'Sentezci (Alchemist) Baş Mimar'sın. Pazardaki trend ilhamlarını (Renk, Kumaş) alıp tamamen ÖZGÜN, MİZANET markasına ait yepyeni bir şaheser yaratmalısın.
        
        [ONAYLI İSTİHBARATLAR]:
        ${sentezHammadde}

        Bana şunları SADECE geçerli bir JSON olarak ver:
        {
           "tasarim_adi": "Yeni Ürüne Verdiğin Vurucu İsim",
           "kumas_kalip_kombinasyonu": "M3 ustasına teknik tarif (Ne kumaşı, nasıl dikiş)",
           "midjourney_prompt": "Bu ürünü görselleştirmek için Midjourney/DALL-E 3'e verilecek İngilizce, ultra gerçekçi stüdyo moda fotoğrafı promptu (Fashion photography, 8k, cinematic lighting vs.)",
           "satis_avantaji": "Rakipler yapmadan bizim bunu üretip satmamızın Mizanet'e kazandıracağı vizyon (Patrona Not)"
        }`;

        const g_res = await model.generateContent(g_prompt);
        const analiz = JSON.parse(g_res.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
        tasarimRaporu = analiz;

        await telemetriAt(80, `[PROMPT ÜRETİLDİ] Yepyeni Tasarım: "${tasarimRaporu.tasarim_adi}". DALL-E 3 Otonom Çizimi (Sanal Manken) başlatılıyor...`);

        // GERÇEK DALL-E 3 API ENTEGRASYONU (FAZ 5.1)
        // Kural 21 (Maliyet Şeffaflığı): Bu API çağrısı DALL-E 3 (HD) modelini kullanır, her tetiklemede OpenAI bakiyesinden ~0.04$ düşer.
        let uretilenGorselUrl = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"; // Fallback

        try {
            await telemetriAt(85, `[DALL-E 3 ZİNCİRİ] Çizim Ağına bağlanılıyor (Bu işlem 12-18 saniye sürebilir, API tüketimi gerçekleşiyor)...`);

            const dalleCevap = await fetch("https://api.openai.com/v1/images/generations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "dall-e-3",
                    prompt: tasarimRaporu.midjourney_prompt,
                    n: 1,
                    size: "1024x1024",
                    quality: "standard"
                })
            });

            const dalleVeri = await dalleCevap.json();
            if (dalleCevap.ok && dalleVeri.data && dalleVeri.data.length > 0) {
                uretilenGorselUrl = dalleVeri.data[0].url;
                await telemetriAt(95, `[GÖRSEL TAMAM] Orijinal (Tümüyle Telifsiz) Manken Fotoğrafı başarıyla çizildi.`);
            } else {
                console.error("[DALL-E 3 FATAL ERROR]:", dalleVeri);
                await telemetriAt(95, `[GÖRSEL HATA] DALL-E bağlantısı reddedildi (Limit/Key hatası). Yedek (Mock) resim kullanılıyor.`);
            }
        } catch (imgErr) {
            console.error("[DALL-E ŞEBEKE KOPUŞU]:", imgErr);
            await telemetriAt(95, `[GÖRSEL HATA] DALL-E 3 Server yanıt vermedi. Yedek resim ile kalıphaneye iniliyor.`);
        }

        const tasarimKayit = {
            tasarim_adi: tasarimRaporu.tasarim_adi,
            kumas_dokusu: tasarimRaporu.kumas_kalip_kombinasyonu,
            ai_prompt: tasarimRaporu.midjourney_prompt,
            yapay_zeka_gorseli: uretilenGorselUrl, // Artık doğrudan OpenAI URL'sini gömer
            onay_durumu: 'BEKLIYOR', // Patron onayı
            patrona_not: tasarimRaporu.satis_avantaji,
            created_at: new Date().toISOString()
        };

        const { error: insErr } = await supabase.from('b3_uretilen_tasarimlar').insert([tasarimKayit]);

        if (insErr) {
            // Eğer tablo yoksa (migration yapılmadıysa) log at.
            console.error(`[TASARIM KAYDI HATASI] B3 Tablosu Yok:`, insErr.message);
        }

        await telemetriAt(100, `[GÖREV BİTTİ] Sentez Tamamlandı. Tasarım: ${tasarimRaporu.tasarim_adi}. Patron Ön-Sipariş Görüntüsü Hazır!`, 'onaylandı');
        return tasarimKayit;

    } catch (e) {
        console.error(`[BOT 8] Baş Tasarımcı Çöktü: ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] Tasarım sentezi patladı: ${e.message}`, 'INFAZ_EDILDI');
        return null;
    }
}

module.exports = { bot8BasTasarimci };
