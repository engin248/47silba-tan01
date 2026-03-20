<<<<<<< HEAD
/**
 * /src/lib/ai/visionAjanCore.js
 * THE ORDER — KÖR NOKTA VİSİON (Görü) ANALİZ MOTORU
 *
 * KÖK SORUN ONARIM:
 * ÖNCE: Math.random() ile sahte (simülasyon) veri üretiyordu. Hiçbir analiz yapılmıyordu.
 * ŞIMDI: Google Gemini Vision API ile gerçek görüntü analizi yapılıyor.
 *         GEMINI_API_KEY yoksa temiz hata mesajı döner (sessiz simülasyon değil).
 *
 * @param {string} resimBase64 - Base64 veya URL formatında kumaş/ürün fotoğrafı
 * @returns {Promise<{onay: boolean, yorum: string, kumasHataOrani: number, tespit_edilen_hatalar: string[], tavsiye: string, kaynak: string}>}
 */
export async function videoVeResimDenetle(resimBase64) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

    // ─── GEMİNİ VİSİON MOTORU ──────────────────────────────────────
    if (GEMINI_API_KEY) {
        try {
            const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

            // Base64 veya URL belirle
            const isUrl = resimBase64.startsWith('http');
            const imagePart = isUrl
                ? { file_data: { mime_type: 'image/jpeg', file_uri: resimBase64 } }
                : { inline_data: { mime_type: 'image/jpeg', data: resimBase64.replace(/^data:image\/\w+;base64,/, '') } };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000); // 20sn timeout

            const res = await fetch(GEMINI_VISION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `Sen THE ORDER tekstil fabrikasının kalite kontrol uzmanısın.
Bu kumaş veya ürün fotoğrafını incele ve aşağıdaki JSON formatında yanıt ver (SADECE JSON):

{
  "onay": true/false,
  "yorum": "Tek cümlelik kalite yorumu (Türkçe)",
  "kumasHataOrani": 0-100 arası sayı (hata oranı yüzdesi),
  "tespit_edilen_hatalar": ["hata1", "hata2"] veya [],
  "tavsiye": "Kalite uzmanı tavsiyesi"
}

Kontrol noktaları:
1. İp çekmesi, abraj (renk eşitsizliği), tüylülük var mı?
2. Dikiş hatası, atlama, asimetri var mı?
3. Lekeleme, renk bozulması var mı?
4. Genel kalite seviyesi nedir?`
                            },
                            imagePart
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 300,
                        responseMimeType: 'application/json'
                    }
                })
            });

            clearTimeout(timeout);

            if (!res.ok) throw new Error(`Gemini Vision HTTP ${res.status}`);

            const data = await res.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const sonuc = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

            return {
                onay: Boolean(sonuc.onay),
                yorum: String(sonuc.yorum || 'Analiz tamamlandı.'),
                kumasHataOrani: Math.min(100, Math.max(0, Number(sonuc.kumasHataOrani) || 0)),
                tespit_edilen_hatalar: Array.isArray(sonuc.tespit_edilen_hatalar) ? sonuc.tespit_edilen_hatalar : [],
                tavsiye: String(sonuc.tavsiye || ''),
                kaynak: 'gemini_vision'
            };

        } catch (err) {
            // Gemini erişilemez → Hata açıkça bildir (sessiz simülasyon değil)
            return {
                onay: false,
                yorum: `⚠️ Gemini Vision analiz hatası: ${err.message}. Görüntü manuel incelenmeli.`,
                kumasHataOrani: -1,
                tespit_edilen_hatalar: [],
                tavsiye: 'Vision API bağlantısı kurulamadı. Manuel kalite kontrolü yapın.',
                kaynak: 'hata'
            };
        }
    }

    // ─── GEMİNİ API KEY YOK → AÇIK HATA (Sessiz değil) ──────────
    return {
        onay: false,
        yorum: '🔴 GEMINI_API_KEY tanımlı değil. Vision analizi devre dışı.',
        kumasHataOrani: -1,
        tespit_edilen_hatalar: ['API_KEY_EKSIK'],
        tavsiye: 'Vercel ortam değişkenlerine GEMINI_API_KEY ekleyin.',
        kaynak: 'api_key_yok'
    };
=======
// KÖR NOKTA ENVANTERİ : M14 Denetmen (Yapay Zeka Görü analiz motoru simülasyonu)

/**
 * 47 SİL BAŞTAN — THE ORDER
 * Yapay Zeka (Vision) Fotoğraf/Video Analiz Motoru
 * (Şu an test için simülasyon dönmektedir. OpenAI GPT-4 Vision veya Google Gemini entegre edilebilir.)
 * 
 * @param {string} resimBase64 (Base64 Kumaş Fotoğrafı veya Video karesi)
 * @returns {object} { onay: boolean, yorum: string, kumasHataOrani: number }
 */
export async function videoVeResimDenetle(resimBase64) {
    // BURASI GERÇEK AI MOTORUNA (ÖRN: OpenAI) BAĞLANACAK:
    /*
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
           model: "gpt-4-vision-preview",
           messages: [{ role: "user", content: [ { type: "text", text: "Bu kumaşta defo veya dikiş hatası var mı?" }, { type: "image_url", image_url: { url: resimBase64 } } ] }]
        })
    });
    */

    // ŞİMDİLİK ZAMAN/MALİYET KÖR NOKTASI İÇİN SİMÜLASYON YANITI DÖNÜLÜYOR:
    return new Promise((resolve) => {
        setTimeout(() => {
            const yuzdeSansi = Math.random() * 100;
            // %80 Onaylı Kumaş, %20 Hatalı Kumaş (Simüle)
            if (yuzdeSansi > 20) {
                resolve({
                    onay: true,
                    yorum: "Atölyeden gelen görüntü temiz. İp çekmesi veya renk solması (abraj) tespit edilemedi. Onaylıdır.",
                    kumasHataOrani: 2.1
                });
            } else {
                resolve({
                    onay: false,
                    yorum: "DİKKAT! Yaka dikişinde asimetri ve yan çatmalarda atlama tespit edildi. Fasona İade kararı önerilir.",
                    kumasHataOrani: 38.4
                });
            }
        }, 3500); // 3.5 saniye AI işlem süresi kurgusu
    });
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
}
