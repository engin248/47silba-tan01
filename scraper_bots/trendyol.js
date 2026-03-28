const puppeteer = require('puppeteer');

/**
 * BOT 2 - PAZAR YERİ AJANI (TRENDYOL)
 * Görev: Satış ve finansal metrikleri analiz etmek.
 * Amaç: Gerçek satış var mı? Kategori arz-talep dengesi nedir? Fiyat rekabeti durumu nedir?
 */
async function trendyolSatisAnalizi(aramaKelimesi) {
    console.log(`\n[TRENDYOL AJANI] Göreve Başladı. Hedef: ${aramaKelimesi}`);
    console.log(`[TRENDYOL AJANI] Zırh Giyiliyor... (Headless Tarayıcı Aktif)`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        console.log(`[TRENDYOL AJANI] ${aramaKelimesi} araması simüle ediliyor...`);
        // await page.goto(`https://www.trendyol.com/sr?q=${aramaKelimesi}`, { waitUntil: 'networkidle2' });

        // MOCK VERİ TOPLAMA. DOM elemanları puppeteer ile seçilmiş gibi simüle ediliyor.

        // 1. Yorum sayısı + artış hızı
        const toplamYorum = Math.floor(Math.random() * (5000 - 50) + 50);
        const haftalikYorumArtisi = Math.floor(toplamYorum * (Math.random() * (0.15 - 0.05) + 0.05)); // Haftalık %5-15 artış

        // 2. Favori / sepete ekleme
        const favoriSayisi = toplamYorum * Math.floor(Math.random() * (12 - 4) + 4); // Yorumun 4 ile 12 katı favori
        const sepeteEklemeTahmini = Math.floor(favoriSayisi * 0.25); // Favorinin %25'i kadar sepete ekleme

        // 3. Stok değişimi ("son X adet") & 13. Rakip stok out
        const sonKalanAdetAlerti = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0; // %30 ihtimalle son 1-5 ürün kaldı uyarısı
        const rakipStokOut = Math.random() > 0.8 ? true : false; // %20 ihtimalle muadil rakiplerin stoku bitmiş

        // 4. Fiyat dağılımı & 15. Fiyat psikolojisi
        let fiyatTavan = 899;
        let fiyatTaban = 199;
        let ortalamaFiyat = Math.floor(Math.random() * (fiyatTavan - fiyatTaban) + fiyatTaban);

        // Psikolojik fiyat kontrolü (örn: 299, 499)
        const fiyatSonuDokuzaBitiyorMu = ortalamaFiyat % 10 === 9; // x9 ile biten psikolojik fiyatlar

        // 5. İlk 10 satıcı + satış gücü
        const populerSaticilar = ["X_Store", "Moda_A", "Toptanci_B"];
        const saticiGucuSkoru = Math.floor(Math.random() * 100); // 100 üzerinden pazar hakimiyeti

        // 6. Yorum puanı + 1-3 yıldız oranı
        const ortalamaPuan = (Math.random() * (4.8 - 3.5) + 3.5).toFixed(1);
        const dusukYildizOrani = (Math.random() * (25 - 5) + 5).toFixed(1) + "%"; // %5 ile %25 arası şikayet

        // 7. Ana şikayet (kalıp/kumaş)
        const sikayetKategorileri = ["Kalıp Dar", "Kumaş İnce", "Rengi Soluk", "Defolu", "Kargo Gecikti"];
        const enCokSikayetEdilenKategori = sikayetKategorileri[Math.floor(Math.random() * sikayetKategorileri.length)];

        // 8. İade sinyali (Şikayet oranı yüksekse iade de yüksektir)
        const iadeSinyaliRiskeGirdiMi = parseFloat(dusukYildizOrani) > 15 ? "YÜKSEK RİSK" : "GÜVENLİ";

        // 9. En çok satan sıralama değişimi
        const listeyeGirisineGoreSira = Math.floor(Math.random() * (50 - 1) + 1); // Aramada kaçıncı sırada? (1-50 arası)
        const siralamaDegisimi = Math.floor(Math.random() * (10 - (-5)) + (-5)); // -5 ile +10 arası sıra değişimi (+lar yükseliş)

        // 10. Soru-cevap artışı
        const musteriSorulari = Math.floor(toplamYorum * (Math.random() * (0.3 - 0.1) + 0.1));

        // 11. Sepeti terk oranı (dolaylı) - Fiyat yüksekse ve son adet kalmadıysa terk oranı artar
        const sepetiTerkTahmini = ortalamaFiyat > 500 && sonKalanAdetAlerti === 0 ? "YÜKSEK" : "DÜŞÜK/NORMAL";

        // 12. Sosyal kanıt (fotoğraflı yorum)
        const fotografliYorumOrani = Math.floor(toplamYorum * (Math.random() * (0.4 - 0.1) + 0.1));

        // 14. Arama -> ürün sayısı (arz-talep boşluğu)
        const pazardaBenzerUrunSayisi = Math.floor(Math.random() * (15000 - 500) + 500);
        let arzTalepBoslugu = "NORMAL";
        if (pazardaBenzerUrunSayisi < 1000 && haftalikYorumArtisi > 100) {
            arzTalepBoslugu = "AÇIK_FIRSAT_VAR"; // Az satan var, ama yorum çok hızlı artıyor (Yalın talep)
        } else if (pazardaBenzerUrunSayisi > 10000) {
            arzTalepBoslugu = "DOYGUN_PAZAR";
        }

        // 16. İndirim algısı
        const urundeIndirimVarMi = Math.random() > 0.4 ? true : false;
        const indirimOrani = urundeIndirimVarMi ? Math.floor(Math.random() * (50 - 10) + 10) : 0;

        // 17. Kategori sıçraması (Çok Satanlar listesine sıçrama var mı?)
        const kategoriSicramaBasarisi = siralamaDegisimi > 5 ? "EVET_YUKSELTİDE" : "HAYIR_STABİL";


        // MATEMATİKSEL SONUÇ (KARAR ALGORİTMASI)
        let motorSkoru = 0;

        if (haftalikYorumArtisi > 200) motorSkoru += 20; // Hızlı satış sinyali
        else if (haftalikYorumArtisi > 50) motorSkoru += 10;

        if (favoriSayisi > 5000) motorSkoru += 15; // Müşteri listeye almış
        if (arzTalepBoslugu === "AÇIK_FIRSAT_VAR") motorSkoru += 25; // Büyük kâr noktası
        if (rakipStokOut) motorSkoru += 15; // Rakip satamıyor, pazar sana kaldı
        if (sonKalanAdetAlerti > 0) motorSkoru += 5; // Kıtlık psikolojisi
        if (fotografliYorumOrani > 50) motorSkoru += 10; // Ciddi sosyal güven
        if (parseFloat(dusukYildizOrani) < 10) motorSkoru += 10; // Ürün kaliteli (İade az)

        // SATIŞ DURUMU VE HIZINI BELİRLEME
        let satisVarMi = "YOK";
        let satisHizi = "DÜŞÜK";

        if (motorSkoru >= 70) {
            satisVarMi = "VAR";
            satisHizi = "YÜKSEK";
        } else if (motorSkoru >= 40 && motorSkoru < 70) {
            satisVarMi = "VAR";
            satisHizi = "ORTA";
        } else if (motorSkoru > 20 && motorSkoru < 40) {
            satisVarMi = "ZAYIF_BAŞLANGIÇ";
            satisHizi = "DÜŞÜK";
        } else {
            satisVarMi = "YOK";
            satisHizi = "ÖLÜ";
        }

        const analizSonucu = {
            bot: "TRENDYOL_AJANI_V1",
            hedef: aramaKelimesi,
            zaman: new Date().toISOString(),
            DetayliMetrikler: {
                yorumAdedi: toplamYorum,
                haftalikYorumHizi: `+${haftalikYorumArtisi}`,
                favoriler: favoriSayisi,
                stokDurumu: sonKalanAdetAlerti > 0 ? `Son ${sonKalanAdetAlerti} Adet` : "Stok Bol",
                rakipStok: rakipStokOut ? "TÜKENDİ" : "VAR",
                ortalamaFiyat: `${ortalamaFiyat} TL`,
                psikolojikFiyatMi: fiyatSonuDokuzaBitiyorMu ? "EVET" : "HAYIR",
                aramaUrunSayisi: pazardaBenzerUrunSayisi,
                arzTalepEgrisi: arzTalepBoslugu,
                indirim: urundeIndirimVarMi ? `%${indirimOrani} İndirimde` : "Standart Fiyat",
                saticiGucuSkoru: saticiGucuSkoru,
                urunPuanArtisi: ortalamaPuan,
                kötüYorumOrani: dusukYildizOrani,
                enBuyukSikayet: enCokSikayetEdilenKategori,
                iadeTehlikesi: iadeSinyaliRiskeGirdiMi,
                kategoriSiralamasi: `${listeyeGirisineGoreSira}. Sırada`,
                siraAtlama: kategoriSicramaBasarisi,
                soruCevapArtis: musteriSorulari,
                sepetiTerkEtme: sepetiTerkTahmini,
                fotografliYorumlar: fotografliYorumOrani
            },
            Cikti: {
                SATIS_VAR_MI: satisVarMi,
                SATIS_HIZI: satisHizi,
                Genel_Pazar_Skoru: motorSkoru + "/100"
            }
        };

        console.log(`[TRENDYOL AJANI] Operasyon Başarılı. Koordinatlar alındı.`);
        console.table({
            "SATIŞ VAR/YOK": analizSonucu.Cikti.SATIS_VAR_MI,
            "SATIŞ HIZI": analizSonucu.Cikti.SATIS_HIZI,
            "PAZAR SKORU": analizSonucu.Cikti.Genel_Pazar_Skoru
        });

        await browser.close();
        return analizSonucu;

    } catch (error) {
        console.error(`[TRENDYOL AJANI] Analiz Hatası: ${error.message}`);
        await browser.close();
        return null;
    }
}

if (require.main === module) {
    trendyolSatisAnalizi("Oversize Siyah Kadın Kazak");
}

module.exports = { trendyolSatisAnalizi };
