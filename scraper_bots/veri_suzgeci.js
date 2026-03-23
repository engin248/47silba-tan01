/**
 * BOT 5 - VERİ SÜZGEÇ (GÜRÜLTÜ TEMİZLEYİCİ)
 * KRİTİK KURAL: Asla karar vermez. Sadece dışarıdan (Bot 1, 2, 3, 4'ten) gelen ham (kirli) veriyi, 
 * gereksiz satırları ve hatalı sayıları ayıklar, "Saf Sinyale" dönüştürür.
 * Görev: Fazla ve çöp veriyi kesip hatalı yatırım kararını önlemektir.
 */
function veriGürültüsünüSüzgeçle(trendHam, satisHam, talepHam, metaHam) {
    console.log(`\n[BOT 5] VERİ SÜZGECİ ÇALIŞIYOR: Çöp sinyaller dışarı atılıyor...`);

    // Güvenlik
    if (!trendHam || !satisHam || !talepHam || !metaHam) {
        return { SinyalHatasi: "TAMAMLANMAMIŞ RAPOR - EKSİK AYAĞI VAR" };
    }

    // 1. Botlardan gelen çöpleri kes (Sayısal Anomali Temizliği)
    // Örn: Bot 1 milyar beğeni dediyse (sahte) sınırla
    const gerceklesenFavoriSkoru = parseInt(satisHam.DetayliMetrikler?.favoriler || 0);
    const inandiricilikFiltresi = gerceklesenFavoriSkoru > 1000000 ? 500000 : gerceklesenFavoriSkoru; // Anti-Bot/Hile koruması

    // 2. Paralı Şişirilme Puanını Süz (Meta botu sahte diyorsa, Trend botunun oranını kırp)
    let netTrendSkoru = parseInt(trendHam.Cikti.Genel_Skor.split('/')[0]) || 0;
    if (metaHam.Sinyal.SAHTE_TREND_RISKI.includes("YÜKSEK")) {
        // Pırasa gibi kes (organik olmadığı için trend skorunu yarı yarıya düşür)
        netTrendSkoru = Math.floor(netTrendSkoru * 0.5);
        console.log(`[BOT 5 - FİLTRE DİKKAT] Sahte/Paralı trend tespiti! Ham trend skoru %50 tıraşlandı.`);
    }

    // 3. Kalite Histerisi Süzgeci
    // Ürünün satışı uçuyor ama kumaş şikayeti aşırı yüksekiyse satış hızına frenleme uygula
    const iadeTehlikesiVar = satisHam.DetayliMetrikler.iadeTehlikesi.includes("YÜKSEK");
    let gercekSatisGucuPuan = parseInt(satisHam.Cikti.Genel_Pazar_Skoru.split('/')[0]) || 0;

    if (iadeTehlikesiVar) {
        gercekSatisGucuPuan = Math.floor(gercekSatisGucuPuan * 0.6); // Şikayet yüksekse satışı törpüle
        console.log(`[BOT 5 - FİLTRE DİKKAT] İade Tehlikesi Sınırda! Pazar Sinerjisi %40 törpülendi.`);
    }

    // 4. SAF BİRLEŞTİRİLMİŞ SİNYAL PAKETİ (Karar deðil, sadece Saf Kan Veri)
    const TemizSinyal = {
        SüzülenFavori: inandiricilikFiltresi,
        OrganikTrendGercekligi: netTrendSkoru,
        TemizlenmisSatisGucu: gercekSatisGucuPuan,
        TalepSkoru: parseInt(talepHam.Cikti.TalepZekaSkoru.split('/')[0]) || 0,
        ErkenUyari_Bina_Yikiliyor: iadeTehlikesiVar ? "DIKKAT(KALİTE)" : "TEMİZ",
        ReklamSismesiMi: metaHam.Sinyal.SAHTE_TREND_RISKI.includes("YÜKSEK"),
    };

    console.log(`[BOT 5] Gürültü ve İllüzyon Süzüldü. Salt Matematiğe Doğru Yol Açıldı.`);
    return TemizSinyal;
}

module.exports = { veriGürültüsünüSüzgeçle };
