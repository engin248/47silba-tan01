/**
 * BOT 6 - GÖLGE ZAMAN MAKİNESİ (GEÇMİŞ TREND KIYASLAMASI)
 * KRİTİK KURAL: Asla üretim kararı vermez. Sadece veri çıkarır, arşivi kazar.
 * Görev: Sistem bir ürünü reddettikten X gün sonra o ürünün kaderini ölçer.
 * "Biz üretmedik ama bak ne oldu?", "Erken mi reddettik, doğru mu yaptık?" diyerek
 * makinenin tahmin gücünü artıracak Kıyas Sinyallerini merkeze yollar.
 */

// Bu bot sadece veri üretip sinyal çıkarttığı için Supabase'in arşivine (Karargah Hafızasına) bağlanır.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

async function golgeGecmisKiyasiniBaslat(hedefKelime, eskiSatisSkoru = 0) {
    console.log(`\n[BOT 6 - GÖLGE] ZAMAN MAKİNESİ DEVREDE: Geçmiş Arşiv Taranıyor...`);

    // Gerçekte: Hedef ürünün güncel (bugünkü) favori/satış sayısını Trendyol'dan çeker
    // Ve bunu Sistem Hafızasındaki iptal edildiği günkü veri ile KIYASLAR.

    // MOCK: Ürünün son 30 gün içindeki değişimini simüle edelim.
    let guncelPerformansSinyali = "STABİL";
    let hataYaptikMi = false;

    const yeniFavHizi = Math.floor(Math.random() * 5000) + 100;

    if (yeniFavHizi > 3000 && eskiSatisSkoru < 50) {
        // Önceden kötüydü (50 altıydı), şimdi roketlemiş. Düşük/Yanlış Karar vermişiz.
        guncelPerformansSinyali = "PATLAMA_YASAMIŞ (Geciken Trend)";
        hataYaptikMi = true;
    } else if (yeniFavHizi < 500 && eskiSatisSkoru > 60) {
        // Önceden iyiydi, şimdi düşmüş.
        guncelPerformansSinyali = "BALON_SÖNMÜŞ";
    }

    const golgeSinyali = {
        SinyalId: `GLG_${Date.now()}`,
        DurumOzeti: hataYaptikMi
            ? "ERKEN REDDEDİLMİŞ TREND - ALGORİTMAYI İYİLEŞTİR"
            : "DOĞRU ÇÖPE ATILDI - RAKİPLERİN ELİNDE PATLAMAK ÜZERE",
        GelecekSinyali: guncelPerformansSinyali
    };

    console.log(`[BOT 6 - GÖLGE] Geçmiş Kıyas Bitti. Sinyal: ${golgeSinyali.DurumOzeti}`);

    return golgeSinyali;
}

module.exports = { golgeGecmisKiyasiniBaslat };
