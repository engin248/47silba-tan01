const { chromium } = require('playwright');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 1. Ortam Değişkenleri
const cleanEnv = (val) => val ? val.replace(/\r?\n|\r/g, '').trim() : val;
const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const geminiKey = cleanEnv(process.env.GEMINI_API_KEY);

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("HATA: Gerekli API anahtarları eksik!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenerativeAI(geminiKey);

// 2. 18 Kriter Çıkarma İstemi (Zorunlu Sözleşme)
const EXTRACTION_PROMPT = `
Sen profesyonel bir e-ticaret veri analiz ajanısın.
Görev: Aşağıdaki Trendyol ürün sayfası ekran görüntüsünü dikkatlice incele.
Sayfada yer alan bilgileri eksiksiz ve DOĞRU bir şekilde aşağıdaki 18 kritere göre JSON formatında çıkar.
Eğer bir bilgi ekranda yoksa veya okunamıyorsa, kesinlikle uydurma, karşısına null veya "Bulunamadı" yaz.

Çıkarman Gereken 18 Kriter (Tam Liste):
1. Ürün Adı (urun_ismi)
2. Fırsat/İndirimli Fiyat (indirimli_fiyat) - Sadece rakam, örn: 599.99
3. Orijinal/Üstü Çizili Fiyat (orijinal_fiyat) - Varsa, örn: 899.99
4. İndirim Oranı - Varsa % olarak
5. Satıcı / Marka (marka_ismi)
6. Değerlendirme Puanı (urun_puani) - 1 ile 5 arası
7. Yorum Sayısı (urun_yorumlari) - Örn: "1250 Değerlendirme"
8. Satış Adedi - Örn: "1000+ kere favorilendi" veya "Bugün 50 kişi aldı"
9. Favori Sayısı (urun_favorisi)
10. Kategori / Ekmek Kırıntısı (Breadcrumb) - Örn: Kadın > Giyim > Elbise
11. Kumaş / Materyal İçeriği - Örn: %80 Pamuk, %20 Polyester
12. Renk Seçenekleri
13. Beden Seçenekleri (Mevcut olanlar)
14. Kargo Süresi - Örn: "2 Gün İçinde Kargoda"
15. İade Politikası - Örn: "15 Gün İçinde Ücretsiz İade"
16. "Trendyol Bu Ürünü Seviyor" / Trend Etiketi var mı? (Evet/Hayır)
17. Ürün Açıklaması (Büyük fontlu kısa açıklama metni)
18. Fotoğraf Linki veya Görsel Var mı? (urun_fotografi)

LÜTFEN ÇIKTIYI SADECE GEÇERLİ BİR JSON OLARAK VER! İçinde Markdown (\`\`\`json vb.) olmasın!

JSON Şablonu:
{
  "marka_ismi": "...",
  "urun_ismi": "...",
  "orijinal_fiyat": ...,
  "indirimli_fiyat": ...,
  "urun_puani": ...,
  "urun_yorumlari": "...",
  "satis_adedi": "...",
  "urun_favorisi": "...",
  "kategori": "...",
  "materyal": "...",
  "renkler": "...",
  "bedenler": "...",
  "kargo_suresi": "...",
  "iade_politikasi": "...",
  "trend_etiketi": "...",
  "urun_aciklamasi": "...",
  "urun_fotografi_durumu": "...",
  "urun_fotografi_url": "..."
}
`;

// 3. Dosyayı Base64 Çevirici (Gemini Vision İçin)
function fileToGenerativePart(buffer, mimeType) {
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType
        },
    };
}

// 4. Ana Ajan Fonksiyonu
async function runBrowserAgent(targetUrl) {
    const sessionId = `SESSION_${Date.now()}`;
    console.log(`\n================================`);
    console.log(`🕵️ BROWSER AGENT BAŞLATILDI`);
    console.log(`📌 Oturum: ${sessionId}`);
    console.log(`🔗 Hedef: ${targetUrl}`);
    console.log(`================================\n`);

    let browser;
    try {
        console.log("-> [Playwright] Tarayıcı başlatılıyor...");
        // Headless: false yaparsak ekranda tarayıcının açıldığını görürüz (VPS'te true olmalı)
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 1280, height: 1024 },
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        });
        const page = await context.newPage();

        console.log(`-> [Playwright] Sayfaya gidiliyor... Mümkün olan tüm veriler bekleniyor.`);
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

        // Çerez veya modal pencereleri varsa kapatmak için bekleyebiliriz:
        // await page.waitForTimeout(2000); 

        console.log("-> [Playwright] Sayfanın TAM EKRAN GÖRÜNTÜSÜ alınıyor...");
        const imageBuffer = await page.screenshot({ fullPage: true });

        // Ürünün fotoğraf URL'sini kod üzerinden almaya çalışalım (AI daha net görsün diye):
        let imgUrl = null;
        try {
            imgUrl = await page.getAttribute('img[alt="Ürün Görseli"], .product-image-container img', 'src');
        } catch (e) { /* ignore */ }

        console.log("-> [Gemini Vision] Ekran görüntüsü analiz ediliyor... (18 Kriter Aranıyor)");
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" }); // Vision yeteneği olan model
        const imagePart = fileToGenerativePart(imageBuffer, "image/png");

        const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
        const responseText = result.response.text();

        // 5. JSON Temizleme ve Parse Etme
        let cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        let extractedData;
        try {
            extractedData = JSON.parse(cleanJsonStr);
            if (imgUrl && !extractedData.urun_fotografi_url) {
                extractedData.urun_fotografi_url = imgUrl; // Koddan bulduğumuzu ekle
            }
            console.log("✅ JSON Başarıyla Çözümlendi (Elde Edilen Özellikler):", Object.keys(extractedData).length);
            console.dir(extractedData, { depth: null, colors: true });
        } catch (e) {
            console.error("❌ AI geçerli bir JSON döndüremedi! Ham metin:\n", responseText);
            throw new Error("JSON Parse Error");
        }

        // 6. Supabase Kaydı
        console.log("-> [Supabase] Veriler b1_arge_products tablosuna yazılıyor...");
        const dbRecord = {
            product_name: extractedData.urun_ismi || "Tanımsız Ürün",
            source_url: targetUrl,
            ham_veri: extractedData,
            islenen_durum: "bekliyor",
            isleyen_ajan: "Ajan1_Browser_Scout",
            extracted_data: extractedData,
            agent_session_id: sessionId
        };

        const { data, error } = await supabase.from('b1_arge_products').insert([dbRecord]).select();

        if (error) {
            console.error("❌ Supabase Kayıt Hatası:", error.message);
        } else {
            console.log("🟢 BAŞARILI! Veri Veritabanına Eklendi. Kayıt ID:", data[0]?.id);
        }

    } catch (e) {
        console.error("🚨 KRİTİK HATA:", e);
    } finally {
        if (browser) {
            console.log("-> [Playwright] Tarayıcı kapatılıyor...");
            await browser.close();
        }
        console.log("\nGörev Tamamlandı. Oturum sonlandı.");
    }
}

// TEST: Sizin bilgisayarda denemek için örnek bir link
const ornekLink = "https://www.trendyol.com/stradivarius/kadin-siyah-uzun-kollu-yirtmacli-elbise-p-781525433";
runBrowserAgent(ornekLink);
