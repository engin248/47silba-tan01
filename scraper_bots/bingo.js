/**
 * BİNGO BOT (ANA KARARGAH ORKESTRATÖRÜ VE GEMİNİ BAĞLANTISI) - TAM SİSTEM SENTEZİ
 * 
 * KRİTİK KURAL (MİMARİ):
 * - Bot 1, Bot 2, Bot 3 ve Bot 4 (Meta) -> Sadece Ham Veri/Sinyal Toplar.
 * - Bot 5 (Veri Süzgeci) -> Gürültüyü temizler. İade sayısını gerçeğe indirger, sahte trendse skoru çizer.
 * - Bot 6 (Gölge Zaman) -> Arşive (Supabase) gider, bu ürün eskiden kuluçkada iptal edilmiş mi diye bakar. Gelecek Tahmini çakar.
 *
 * En Son BİNGO (Bu dosya) -> Süzgeçten geçmiş o saf veriyi alır, Kendi 8 Kriter Algoritmasından (Hatasız) geçirir, 
 * ve "ÜRET / BEKLET / ÇÖPE AT" emrini veritabanına mühürler.
 */

const { tiktokTrendAnalizi } = require('./tiktok');
const { trendyolSatisAnalizi } = require('./trendyol');
const { aramaVeTalepAnalizi } = require('./arama_motoru');
const { metaReklamIncelemesi } = require('./meta_reklam'); // BOT 4
const { veriGürültüsünüSüzgeçle } = require('./veri_suzgeci'); // BOT 5
const { golgeGecmisKiyasiniBaslat } = require('./golge_zaman_makinesi'); // BOT 6

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

async function bingoMotorunuCalistir(hedefUrun) {
    console.log(`\n======================================================`);
    console.log(`[BİNGO MERKEZİ] 🔥 6 BOT + 1 ALGORİTMA TAM SİSTEM DEVREDE 🔥`);
    console.log(`[HEDEF]: ${hedefUrun}`);
    console.log(`======================================================\n`);

    console.log(`[>>] STAGE 1: SAHA ORDUSU SALDIRISI (Dış Botlar Görevde)...`);

    // Dört bot da asenkron şekilde aynı saniyede farklı yerlere saldırır. Kimse kimseyi beklemez.
    const [trendRaporu, satisRaporu, talepRaporu, metaRaporu] = await Promise.all([
        tiktokTrendAnalizi(hedefUrun),     // BOT 1 (TikTok)
        trendyolSatisAnalizi(hedefUrun),   // BOT 2 (Trendyol)
        aramaVeTalepAnalizi(hedefUrun),    // BOT 3 (Google/Pin)
        metaReklamIncelemesi(hedefUrun)    // BOT 4 (Meta Ads)
    ]);

    if (!trendRaporu || !satisRaporu || !talepRaporu || !metaRaporu) {
        console.error(`[BİNGO MERKEZİ] HATA: Botlardan biri dönmedi veya IP Ban var. Tüm Sentezi Durdur!`);
        return;
    }

    console.log(`\n[>>] STAGE 2: KİRLİ VERİLER LABORATUVARA İNDİ (Bot 5 ve Bot 6 Çalışıyor)...`);

    // BOT 6: Gölge Zaman Makinesi (Geçmişe dönük kontrol, ürün daha önce atıldıysa kıyasla)
    // Şimdilik mock olarak geçmiş skoru '40' veriyoruz.
    const eskiDurumVeKiyas = await golgeGecmisKiyasiniBaslat(hedefUrun, 40);

    // BOT 5: Ham verilerin illüzyonlarını törpüle, temiz ve saf Puan çıkar.
    const TemizKombinasyonSinyali = veriGürültüsünüSüzgeçle(trendRaporu, satisRaporu, talepRaporu, metaRaporu);

    console.log(`\n======================================================`);
    console.log(`[>>] STAGE 3: "8 ŞARTLI" KESİN BİNGO YARGI MASASI KURULDU`);
    console.log(`======================================================\n`);

    let eslesenKriterler = 0;
    const eslesenMaddeIsimleri = [];

    // --- 8 KRİTER ALGORİTMASI MÜHÜRÜ (Saf veriler, 8 şarta oturtulur) ---

    // 1. İvme Pisti (Sepet Deltası + IG Kaydetme)
    const kaydetmeOrani = parseFloat(trendRaporu.metrikler ? trendRaporu.metrikler.kaydetmeBegeniOrani : "0");
    if (kaydetmeOrani >= 8 || TemizKombinasyonSinyali.SüzülenFavori >= 300) {
        eslesenKriterler++; eslesenMaddeIsimleri.push("1. İvme Pisti (Sepet + Kaydetme Fırladı)");
    }

    // 2. Klonlama (Viral Çarpanı)
    if (trendRaporu.metrikler && trendRaporu.metrikler.klonSayisi >= 3) {
        eslesenKriterler++; eslesenMaddeIsimleri.push("2. Klonlama (Tabana Yayılma Var)");
    }

    // 3. Reklam Basıncı Yok (Organik Sağlık) -> BURAYA BOT 4 SİNYALİ ETKİ EDER!
    // Eğer Meta botu Reklam/Sahte demediyse:
    if (TemizKombinasyonSinyali.ReklamSismesiMi === false) {
        eslesenKriterler++; eslesenMaddeIsimleri.push("3. Organik Sağlık (Reklam Baskısı Yok, Doğal)");
    }

    // 4. Rakip Doygunluğu (Açık Alan)
    if (satisRaporu.DetayliMetrikler.arzTalepEgrisi !== "DOYGUN_PAZAR") {
        eslesenKriterler++; eslesenMaddeIsimleri.push("4. Rakip Doygunluğu (Pazarda Boşluk Var)");
    }

    // 5. İade Zırhı Geçilmiş -> BURAYA BOT 5 (SÜZGEÇ) SİNYALİ ETKİ EDER!
    if (TemizKombinasyonSinyali.ErkenUyari_Bina_Yikiliyor === "TEMİZ") {
        eslesenKriterler++; eslesenMaddeIsimleri.push("5. İade Zırhı Geçildi (Kalite Riski Yok)");
    }

    // 6. Maliyet & Marj Eşiği (Kâr)
    const tahminiSatisFiyati = parseInt(satisRaporu.DetayliMetrikler.ortalamaFiyat);
    if (tahminiSatisFiyati > 300) {
        eslesenKriterler++; eslesenMaddeIsimleri.push("6. Marj Eşiği (Kârlı Psikolojik Fiyat)");
    }

    // 7. Bant Kapasitesi (Skalabilite) - Simülasyon
    const uretimUzmaniOkeyMİ = true;
    if (uretimUzmaniOkeyMİ) { eslesenKriterler++; eslesenMaddeIsimleri.push("7. Bant Kapasitesi Müsait"); }

    // 8. Eğri (Zamanlama) -> BOT 6 BURAYA DESTEK ÇIKAR
    if (eskiDurumVeKiyas.GelecekSinyali.includes("PATLAMA_YASAMIŞ") || trendRaporu.Cikti.TREND_ASAMASI.includes("ERKEN") || trendRaporu.Cikti.TREND_ASAMASI.includes("PİK")) {
        eslesenKriterler++; eslesenMaddeIsimleri.push("8. Eğri ve Zamanlama (PİK Evresinde / Hata Tespiti İle Yön Onaylandı)");
    }

    // SONUÇ YAZDIRMA
    console.log(`[KARAR ORTALIĞI] Temizlenen Toplam Karşılanan Kriter: ${eslesenKriterler}/8\n`);
    eslesenMaddeIsimleri.forEach(madde => console.log(` ✔ ${madde}`));

    let kararMesaji, aksiyonMesaji, alarmSeviyesi, supabaseStatusDurum;

    if (eslesenKriterler === 8) {
        alarmSeviyesi = "🔴 8/8 (BİNGO - KESİN ÜRETİM)";
        kararMesaji = "Rakipler Reklam çakmamış, İade zırhı aşılmış, Gölge zamanında bu pazar büyüyor. Saat, Saniye Mükemmel.";
        supabaseStatusDurum = "uretim_onay";
    } else if (eslesenKriterler === 7) {
        alarmSeviyesi = "🟠 7/8 (Altın Aday)";
        kararMesaji = "Neredeyse Kusursuz. Üretime girmek için tek bir eksiğimiz kaldı. O da fiyat savaşları.";
        supabaseStatusDurum = "uretim_onay";
    } else if (eslesenKriterler === 6) {
        alarmSeviyesi = "🟡 6/8 (Sıcak Takip)";
        kararMesaji = "Uyanış başladı ancak favoriye alınan ürünler henüz kasa sepetine inmiyor. Riskli zaman. ÜRETİLMEZ.";
        supabaseStatusDurum = "inceleniyor";
    } else if (eslesenKriterler === 5) {
        alarmSeviyesi = "🟢 5/8 (Radar)";
        kararMesaji = "Ufak hareketler. Atölye meşgul edilecek ciddiyette değil.";
        supabaseStatusDurum = "inceleniyor";
    } else {
        alarmSeviyesi = "⚫ ÇÖP (İPTAL)";
        kararMesaji = "Yapay gürültü! Yanlış trend ihtimali (Reklam şişirme/Kötü kumaş vadesi dolmuş vb.)";
        supabaseStatusDurum = "iptal";
    }

    console.log(`\n[UYARI]   : ${alarmSeviyesi}`);
    console.log(`[DURUM]   : ${kararMesaji}`);

    // VERİTABANINA YAZIM 
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.log(`\n[BİNGO MERKEZİ] Veritabanı NİZAM sistemine kilitleniyor...`);
        let netSatarSkoru = TemizKombinasyonSinyali.OrganikTrendGercekligi + TemizKombinasyonSinyali.TemizlenmisSatisGucu;
        netSatarSkoru = netSatarSkoru > 100 ? 99 : netSatarSkoru;

        if (eslesenKriterler >= 7) netSatarSkoru = 98; // Garanti Kâr

        const payLoad = {
            title: hedefUrun,
            product_url: `TREND:${trendRaporu.Cikti.TREND_DURUMU} | SATIS:${satisRaporu.Cikti.SATIS_VAR_MI}`,
            status: supabaseStatusDurum,
            sepet_deltasi: satisRaporu.DetayliMetrikler.favoriler,
            yorum_deltasi: satisRaporu.DetayliMetrikler.yorumAdedi,
            satar_satmaz_skoru: netSatarSkoru,
            iade_risk_sinyali: TemizKombinasyonSinyali.ErkenUyari_Bina_Yikiliyor,
            satici_sayisi: satisRaporu.DetayliMetrikler.aramaUrunSayisi
        };

        const { error } = await supabase.from('b1_arge_products').insert([payLoad]);

        if (error) {
            console.error(`[BİNGO MERKEZİ] API HATASI: ${error.message}`);
        } else {
            console.log(`[BİNGO MERKEZİ] NİHAİ KARAR VERİLDİ. Ar-Ge İzleme Merkezine Mühürlendi.`);
        }
    } else {
        console.log(`\n[BİNGO MERKEZİ] Çevrimdışı Çalışıyor (DB yazılmadı).`);
    }
}

// Terminal Testi
if (require.main === module) {
    const urunIsmi = process.argv[2] || "Triko Kadife Fitilli Tayt";
    bingoMotorunuCalistir(urunIsmi);
}

module.exports = { bingoMotorunuCalistir };
