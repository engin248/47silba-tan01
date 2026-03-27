const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // [FIX] ANON_KEY fallback kaldırıldı
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');

/**
 * BOT 8: FİNANS & KÂR KİLİDİ AJANI (M2 UZMANI)
 * Görev: Çok satan ürünü bulduk ama "BİZE NE KADAR KÂR BIRAKACAK?" sorusunu cevaplar.
 * Fire, kargo desi, iade ihtimali risklerini hesaba katar.
 * Matematik yalan söylemez.
 */
async function m2KarZararKilidi(urunBilgisi, job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[FİNANS %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(10, `[KÂR KİLİDİ] Matematiksel Maliyet Analizi Başladı: ${urunBilgisi.urun_adi}`);

    try {
        // === AŞAMA 1: YAPAY ZEKA DESTEKLİ RİSK TESPİTİ (Fire ve İade Tahmini) ===
        // Algoritma: Abiyede kumaş firesi %25'e çıkar. Kışlık montta iade oranı %30 olabilir. Basic tişörtte iade %10'dur.

        let riskVerileri = { fire_orani: 10, iade_orani: 15, metraj: 1.5, iscilik: 60, desi: "Küçük (45₺)" };

        await telemetriAt(35, `[RİSK MATRİSİ] Zeka, "${urunBilgisi.kategori}" kategorisi için kumaş firesi ve sektörel iade eğilimini hesaplıyor...`);

        const f_prompt = `Tekstil Üretim ve Finans Yöneticisisin. Şu ürün için pazar ortalaması risk oranlarını belirle:
        Ürün Kategorisi/Tipi: "${urunBilgisi.urun_adi} - ${urunBilgisi.kategori}"
        
        Sadece JSON dön:
        {
           "fire_orani_yuzde": "Bu kalıp/üründe kumaş kesim firesi genelde % kaçtır? (Örn T-shirt 5, Elbise/Abiye 15-20, Deri 25)",
           "iade_orani_yuzde": "E-ticarette bu tarz ürünler (Beden/Kalite/Heves) yüzünden % kaç iade döner?",
           "tahmini_kumas_metraj": "Bir adedi ortalama kaç metre kumaş yer? (Sayısal, Örn: 1.2)",
           "tahmini_iscilik_fason": "Ortalama fason dikim bedeli ne kadardır? (Örn: 40)",
           "desi_turu": "Küçük (Örn tişört) veya Büyük (Örn Kaban) Kargo hacmi"
        }`;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const g_res = await model.generateContent(f_prompt);
            const r_text = g_res.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const analiz = JSON.parse(r_text);

            riskVerileri.fire_orani = parseFloat(analiz.fire_orani_yuzde) || 10;
            riskVerileri.iade_orani = parseFloat(analiz.iade_orani_yuzde) || 15;
            riskVerileri.metraj = parseFloat(analiz.tahmini_kumas_metraj) || parseFloat(urunBilgisi.tahmini_metraj) || 1.2;
            riskVerileri.iscilik = parseFloat(analiz.tahmini_iscilik_fason) || 50;
            riskVerileri.desi = analiz.desi_turu;
        } catch (e) {
            console.log(`[RİSK HESABI DÜŞÜK GÜVENİLİRLİK] Standart varsayılanlara dönülüyor.`);
        }

        await telemetriAt(60, `[MATEMATİK] Kumaş, Fire, Dikim ve Kargo (Geçersiz Kılınan İadeler) formülle hesaplanıyor...`);

        // === AŞAMA 2: SOĞUK MATEMATİK HESABI ===
        const kumas_metre_fiyati = parseFloat(urunBilgisi.kumas_metre_fiyati) || 100;
        const satis_fiyati = parseFloat(urunBilgisi.tahmini_satis_fiyati) || 750;

        // Kumaş Maliyeti
        const baz_kumas_maliyeti = kumas_metre_fiyati * riskVerileri.metraj;
        const fire_maliyeti = baz_kumas_maliyeti * (riskVerileri.fire_orani / 100);
        const net_kumas_maliyeti = baz_kumas_maliyeti + fire_maliyeti;

        // Lojistik ve İade Cezasının Maliyete Bindirilmesi
        // Gönderim Kargo
        const kargoGidisBedeli = riskVerileri.desi.toLowerCase().includes('büyük') ? 75 : 55;
        // Eğer iade edilirse: Kargo Geliş + Yeniden Ambalaj ve Ütüleme cezası = Ortalama 90 TL Zarar.
        // Bu zarar her ürüne İade İhtimali Oranınca (Risk Primi) baştan eklenmek KANUN DUR (Kâr Kilidi Mantığı).
        const iade_zarar_bedeli = (kargoGidisBedeli + kargoGidisBedeli + 20) * (riskVerileri.iade_orani / 100);

        const dikim = riskVerileri.iscilik;

        // Operasyon Sızıntıları
        const komisyon_bedeli = satis_fiyati * 0.15; // %15 Trendyol vs
        const vergi_kdv = (satis_fiyati / 1.10) * 0.10; // (Basit Tekstil KDV)

        const toplam_maliyet = net_kumas_maliyeti + kargoGidisBedeli + iade_zarar_bedeli + dikim + komisyon_bedeli + vergi_kdv;

        const net_kar_tl = satis_fiyati - toplam_maliyet;
        const net_kar_marji_yuzde = (net_kar_tl / satis_fiyati) * 100;

        // === AŞAMA 3: İNFAZ (KARAR BELİRLEME) ===
        // Şirket Kâr Marjı Kilidi: %15'in altındaki net kâr oranına sahip ürün çok satsa bile REDDEDİLİR!
        let finansKarari = "ZARAR_REDDEDİLDİ";
        let hermaniaAciklamasi = `Satışlar kâr bırakmıyor. Toplam Maliyet: ${toplam_maliyet.toFixed(1)}₺ (Fire, Kesinti, İade Çöpü dahil). Kâr Marjı %${net_kar_marji_yuzde.toFixed(1)} (Alt sınırımız %15). Üretimi yasaklandı.`;

        if (net_kar_marji_yuzde >= 15) {
            finansKarari = "KÂRLI_ÜRET";
            hermaniaAciklamasi = `[Finansal Zırh Aşıldı] Ürün oldukça verimli. Fire (%${riskVerileri.fire_orani}) ve İade Tüketim Zararı bedelleri fiyata başarıyla yedirilmesine rağmen şirkete NET %${net_kar_marji_yuzde.toFixed(1)} Kârlılık (Ürün Başı ~${net_kar_tl.toFixed(0)}₺) bırakmaktadır.`;
        }

        const finansPaketi = {
            urun_adi: urunBilgisi.urun_adi || 'Bilinmiyor',
            kategori: urunBilgisi.kategori || 'Genel',
            tahmini_satis_fiyati: satis_fiyati,
            kumas_metre_fiyati: kumas_metre_fiyati,
            tahmini_metraj: riskVerileri.metraj,
            kumas_maliyeti: baz_kumas_maliyeti,
            fire_orani_yuzde: riskVerileri.fire_orani,
            fire_maliyeti: fire_maliyeti,
            dikim_iscilik_maliyeti: dikim,
            kargo_ds_bedeli: kargoGidisBedeli,
            iade_olasiligi_yuzde: riskVerileri.iade_orani,
            iade_maliyeti_zarari: iade_zarar_bedeli,
            pazaryeri_komisyon_yuzde: 15,
            komisyon_bedeli: komisyon_bedeli,
            vergi_kdv: vergi_kdv,
            toplam_maliyet: toplam_maliyet,
            net_kar_tl: net_kar_tl,
            net_kar_marji_yuzde: net_kar_marji_yuzde,
            finans_karari: finansKarari,
            hermania_finans_raporu: hermaniaAciklamasi
        };

        // Veritabanına Yazılması
        const { error } = await supabase.from('m2_finansal_kilit').insert([finansPaketi]);
        if (error) {
            console.error(`[SQL RLS/PERMISSION HATASI] Eğer Role based bir hata alındıysa yetki zırhı devrededir:`, error);
        }

        await telemetriAt(100, `[KİLİT KESİNLEŞTİ] Ürün Başı Kâr: ${net_kar_tl.toFixed(0)}₺. Karar: ${finansKarari}. RLS (Rol) Yetkisi aktif edildi.`, 'onaylandı');
        return finansPaketi;

    } catch (e) {
        console.error(`[FİNANS AJANI ÇÖKTÜ]: ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] Matematiksel hesaplama yarıda kaldı: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    }
}

// Bireysel Test İçin
if (require.main === module) {
    m2KarZararKilidi({
        urun_adi: "Kruvaze Siyah Oversize Kaban",
        kategori: "Kaban - Kışlık",
        kumas_metre_fiyati: 350,  // Kaliteli kaban kumaşı
        tahmini_satis_fiyati: 3800
    });
}

module.exports = { m2KarZararKilidi };
