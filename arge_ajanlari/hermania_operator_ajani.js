/**
 * BOT 11: HERMANİA (OTONOM BEYİN VE DIŞARI AÇILAN KAPI)
 * Patron Kuralı: "Tasarım bitti, 138 Kriter onayladı, Sentinel korudu. Şimdi bu ürünü satmamız lazım."
 * 
 * Görev: Sistemin tamamen onayladığı kusursuz ürünü alır ve:
 * 1. Mizanet.com (B2C) e-ticaret sitesi için SEO uyumlu, psikolojik satış metni (Blog/Açıklama) yazar.
 * 2. Yurtdışındaki toptancı B2B müşterilere (Örn: Dubai'deki mağazalara Arapça, Avrupa'ya İngilizce)
 *    "Yeni Sezon Ön Siparişi" konulu profesyonel Pazarlama E-Mailleri / WhatsApp şablonları oluşturur.
 */

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');

async function hermaniaSeoVeMailOperatoru(urunBasligi = "Zümrüt Yeşili Saten Abiye", urunOzellikleri = "Dar Kesim, Taş İşlemeli, Parlak", urunFiyati = "1200 TL") {
    console.log(`\n[BOT 11 - HERMANİA OTONOM BEYİN] B2B ve B2C Dış İletişim Pazarlaması Tetiklendi...`);
    console.log(`[HEDEF ÜRÜN]: ${urunBasligi}`);

    try {
        const prompt = `Sen Mizanet'in baş İletişim, Pazarlama ve SEO Uzmanısın (Hermania).
        Sistemimiz yeni, rekabet edilemez bir ürünü onayladı ve kalıphaneye gönderdi.
        Ürün: ${urunBasligi}
        Detaylar: ${urunOzellikleri}
        Hedef Fiyat: ${urunFiyati}
        
        GÖREVİN:
        Bu ürün için bana 3 farklı içerik üret:
        1. "mizanet_seo_aciklama": Mizanet perakende e-ticaret sitemizde kullanılacak, müşterinin duygularına hitap eden, Google'da (SEO) üst sıralara çıkacak anahtar kelimelerle dolu Türkçe ürün açıklaması (1 paragraf kısa).
        2. "b2b_mail_avrupa_ingilizce": İngiltere/Almanya'daki toptancı (B2B) butik müşterilerimize atılacak profesyonel, "Toptan Özel Ön Sipariş" konulu resmi bir satış teklif maili (İngilizce).
        3. "b2b_whatsapp_arapca": Dubai/Katar'daki toptancı müşterilerimize WhatsApp'tan atılacak sıcak, premium hissettiren "Yeni Koleksiyonumuz Çıktı" mesajı (Arapça).

        SADECE AŞAĞIDAKİ JSON ŞABLONUNU DÖN, DIŞINA ÇIKMA:
        {
           "mizanet_seo_aciklama": "SEO metni...",
           "b2b_mail_avrupa_ingilizce": "İngilizce mail metni...",
           "b2b_whatsapp_arapca": "Arapça WP metni..."
        }`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const g_res = await model.generateContent(prompt);

        const f_text = g_res.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const pazarlamaİcerikleri = JSON.parse(f_text);

        console.log(`\n--- 📝 HERMANİA PAZARLAMA ÇIKTILARI ---`);
        console.log(`\n[SEO MİZANET.COM]:\n${pazarlamaİcerikleri.mizanet_seo_aciklama}`);
        console.log(`\n[AVRUPA B2B E-MAİL - İNGİLİZCE]:\n${pazarlamaİcerikleri.b2b_mail_avrupa_ingilizce}`);
        console.log(`\n[ORTADOĞU B2B WHATSAPP - ARAPÇA]:\n${pazarlamaİcerikleri.b2b_whatsapp_arapca}\n`);

        // Karargah veritabanına log (Gelecekte CMS veya Mailing servisi bağlandığında tabloya yazılabilir)
        await supabase.from('b1_agent_loglari').insert([{
            ajan_adi: 'BOT 11: HERMANİA (SEO & PR OPERATÖRÜ)',
            islem_tipi: 'OTOMATİK_MAİL_VE_SEO',
            mesaj: `Ürün: ${urunBasligi} için SEO, İngilizce Mail ve Arapça Whatsapp şablonları başarıyla oluşturuldu.`,
            sonuc: 'basarili'
        }]);

        return pazarlamaİcerikleri;

    } catch (e) {
        console.error(`[HERMANİA ÇÖKÜŞÜ] Pazarlama metinleri üretilemedi: ${e.message}`);
        return null;
    }
}

if (require.main === module) {
    hermaniaSeoVeMailOperatoru();
}

module.exports = { hermaniaSeoVeMailOperatoru };
