const { createClient } = require('@supabase/supabase-js');
const { KuyrugaEkle } = require('../src/lib/redis_kuyruk');
require('dotenv').config({ path: '../.env.local' });

// Supabase Kurulumu
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

/**
 * BOT 7: KUMAŞ FIRSATI (ARBITRAJ) & BİNGO TASARIM AJANI
 */
async function bot7KumasFirsatiAjani(firsatKumasResmi_base64, kumasVerisi) {
    console.log(`\n[BOT 7 - KUMAŞ ARBİTRAJI] Kumaşçıdan düşen fırsat kumaş kuyruğa yollanıyor...`);
    console.log(`[BOT 7] Gelen Kumaş: ${kumasVerisi.renk} renk, ${kumasVerisi.metre} metre, ${kumasVerisi.cins}.`);

    try {
        const prompt = `
        Sen elit bir moda tasarımcısı, Bingo karar şefi ve pazar analistisin. 
        Tedarikçide yer tuttuğu için çok ucuza alabildiğimiz "Fırsat Kumaşı" şudur:
        Renk: ${kumasVerisi.renk}, Cins: ${kumasVerisi.cins}, Miktar: ${kumasVerisi.metre} Metre.
        
        GÖREVİN: 
        Dünya modasında (Pinterest, Zara Global, TikTok) bu renk ve cins kumaşla *ŞU AN* en çok hangi ürün/model ilgi görüyor? Biz bu bedavaya yakın kumaştan HANGİ MODELİ dikersek %100 kâr marjıyla en hızlı satarız?
        
        Lütfen şu JSON formatında cevapla:
        {
           "oneri_model": "Örn: Geniş Paça Cargo Pantolon veya Paraşüt Kumaş Etek",
           "analiz": "Neden bu model? Dünyada bu tarz kumaştan bu modelin patlamasının güncel/viral sebebi ne?",
           "test_karari": "TEST_URETIM",
           "tahmini_hiz_skoru": 0-100 arasi puan
        }`;

        // Veri paketi şablonu (AI Worker json sonucunu bu objeye 'ai_json_sonucu' olarak gömecek)
        const hedef_veri = {
            urun_adi: `[🧵 FIRSAT KUMAŞ: ${kumasVerisi.renk.toUpperCase()}] -> AI Kararı Bekleniyor`,
            ai_satis_karari: 'İZLE',
            trend_skoru: 0,
            artis_yuzdesi: 100,
            hedef_kitle: 'Numune / Test Kesim (Arbitraj)',
            erken_trend_mi: true,
            hermania_karar_yorumu: 'Analiz Redis Kuyruğunda Bekliyor',
            ai_guven_skoru: 92
        };

        // Doğrudan Gemini'ye gitmek yerine Redis Kuyruğuna (Job Queue) ekle (Fire & Forget)
        await KuyrugaEkle('ai_jobs', {
            ajan_adi: 'BOT 7: KUMAŞ ARBİTRAJ / BİNGO',
            istek_tipi: 'FIRSAT_KUMAŞ_DÖNÜŞÜMÜ',
            prompt: prompt,
            hedef_tablo: 'b1_arge_products',
            hedef_veri: hedef_veri
        });

        console.log(`[BAŞARILI] Bot 7 Görevi Redis Kuyruğuna Bıraktı. Worker işleyecek.`);
        return { durum: 'kuyrukta', mesaj: 'Görev kuyruğa eklendi' };

    } catch (e) {
        console.error(`[BOT 7] Hata: ${e.message}`);
        return null;
    }
}

if (require.main === module) {
    bot7KumasFirsatiAjani("base64_yok", { renk: "Bordo", cins: "İnce Kadife", metre: 500 });
}

module.exports = { bot7KumasFirsatiAjani };
