const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');

/**
 * FAZ 3 (OTONOM BEYİN): HERMANIA SEO & B2B İHRACAT MAİL MİMARİSİ
 * Görev: Final ürün onaylandıktan sonra (Saha->M2Kilit->AltınKriter geçildikten sonra);
 * 1. mizanet.com'da satmak için Google uyumlu 100/100 Puan SEO (Arama Optimizasyonu) içeriği üretmek.
 * 2. Yurtdışı B2B toptancılarına (Arabistan, Katar, Avrupa vb.) atılacak İngilizce ve Arapça otonom teklif/katalog maillerini hazırlamak.
 */
async function hermaniaOtonomPazarlama(urunAdi, kategori, kumasTipi, urunRenk, ihracatPazari = "KÜRESEL", job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[HERMANIA (FAZ 3) %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(10, `[DIŞA AÇILIM] Otonom Beyin (Hermania) Ürün Pazarlama cephaneliğini derliyor: ${urunAdi}`);

    try {
        await telemetriAt(40, `[SEO MOTORU] Mizanet.com için Kumaş kalitesini öven, hikayeleştirilmiş SEO Ürün Açıklaması inşası...`);

        const prompt = `Sen Mizanet markasının Baş Metin Yazarı (Copywriter), Lüks Marka Hikayecisi ve Küresel B2B Satış Yöneticisisin. Mizanet, Türkiye (Merter) merkezli dünyanın her yerine elit kadın giyim ihracatı (toptan ve perakende) yapan premium bir tekstil devidir.
        
        Saha Ajanlarımızdan Yeni Onaylanıp M2 Kâr Kilidini Geçmiş Ürünümüz:
        - Ürün Adı: ${urunAdi}
        - Kategorisi: ${kategori}
        - Kumaş Cinsi / Doku: ${kumasTipi}
        - Hakim Renk: ${urunRenk}
        - Hedeflenen Ana İhracat Pazarı: ${ihracatPazari}

        Senden şu formatta PÜRÜZSÜZ BİR KATIKSIZ JSON istiyorum:
        {
           "meta_baslik": "SEO uyumlu en fazla 60 karakter olan çarpıcı ürün başlığı",
           "seo_aciklama": "Mizanet.com e-ticaret sitesine eklenecek, kumaşın lüks yapısını ve konforunu öven, müşteriyi (psikolojik sınırları yıkarak) satın almaya yönlendirecek, estetik ve profesyonel 2 paragraflık hikayeli ürün açıklaması.",
           "anahtar_kelimeler": "virgülle ayrılmış 10 adet çok aranan güçlü e-ticaret SEO keyword'ü",
           "b2b_ingilizce_mail": "Avrupalı toptancılara (Boutique owners) veya küresel alıcılara atılacak, Mizanet'i saygın bir fabrika/üretici olarak tanıtan ve bu ürünü kataloğa eklediklerini duyuran, LÜKS, KURUMSAL İngilizce Toptancı E-mail taslağı. ('Subject: ...' şeklinde konu başlığı dahil olsun)",
           "b2b_arapca_mail": "Ortadoğulu (Dubai/Katar/Kuveyt) toptancılara atılacak, premium (kaliteli kumaş vurgusu olan) Arapça E-mail taslağı ('Subject: ...' dahil)"
        }`;

        let pazarlamaCiktisi = { meta_baslik: "Hata", seo_aciklama: "Oluşturulamadı", anahtar_kelimeler: "", b2b_ingilizce_mail: "Hata", b2b_arapca_mail: "Hata" };

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Metin yazarlığı için pro model
            const res = await model.generateContent(prompt);
            pazarlamaCiktisi = JSON.parse(res.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (botErr) {
            console.log(`[PRO VERSİYON HATA VERDİ - FLASH'E DÜŞÜYOR]`);
            const backupModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const backupRes = await backupModel.generateContent(prompt);
            pazarlamaCiktisi = JSON.parse(backupRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
        }

        await telemetriAt(75, `[DİL SENTEZİ] Mizanet SEO yazıları (${pazarlamaCiktisi.meta_baslik}) ve İngilizce/Arapça Toptancı Mermi Mailleri kurgulandı.`);

        // B1_AGENT_LOGLARI'na yansıt
        await supabase.from('b1_agent_loglari').insert([{
            ajan_adi: 'BOT 11: HERMANIA (OTONOM BEYİN)',
            islem_tipi: 'SEO_VE_B2B_MAIL_OLUSTURMA',
            mesaj: `Dijital Pazarlama Çıktısı Kurşunlandı: ${pazarlamaCiktisi.meta_baslik}`,
            sonuc: 'basarili'
        }]);

        await telemetriAt(100, `[TAARRUZ HAZIR] Otonom Beyin (SEO & Mail) dünya pazarına çıkış mühimmatını üretti. Sistem Dışa Açıldı.`, 'onaylandı');

        return pazarlamaCiktisi;

    } catch (e) {
        console.error(`[HERMANIA ÇÖKÜŞÜ]: ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] SEO & B2B Mail oluşturucu beyin korteksi arızalandı: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    }
}

// Lokal test bloğu
if (require.main === module) {
    hermaniaOtonomPazarlama(
        "Zümrüt Yeşili İpek Saten Kaplı Şifon Abiye",
        "Abiye (Gece Elbisesi)",
        "Premium İpek Saten & Şifon",
        "Zümrüt Yeşili",
        "Arap Pazarı (Öncelikli) ve Avrupa"
    ).then(res => console.log("Oluşturulan Taslak:", res.meta_baslik)).catch(console.error);
}

module.exports = { hermaniaOtonomPazarlama };
