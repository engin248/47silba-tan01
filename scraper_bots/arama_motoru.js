const puppeteer = require('puppeteer');

/**
 * BOT 3 - ARAMA & GÖRSEL İSTİHBARAT AJANI (Google Trends + Lens + Pinterest)
 * Görev: Trendin yarın ne olacağını, arama hacimlerini ve mikrosezon / talep açıklarını tespit etmek.
 */
async function aramaVeTalepAnalizi(hedefKelime) {
    console.log(`\n[ARAMA AJANI] Göreve Başladı. Keşif Hattı: ${hedefKelime}`);
    console.log(`[ARAMA AJANI] Global Tarama Radarında...`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Tarayıcı oluşturma (Simülasyon kısmı)
    const page = await browser.newPage();
    try {
        // Normalde Trends, Pinterest ve Lens verilerini sırasıyla çeker. Mock Verilerle devam:

        // 1 & 3: Google Trends arama artışı & Arama trend % (7-30 gün)
        const aramaHacmiListesi = [5000, 15000, 50000, 150000];
        const anahtarKelimeHacmi = aramaHacmiListesi[Math.floor(Math.random() * aramaHacmiListesi.length)];
        const aramaTrendYuzdesi = Math.floor(Math.random() * (300 - (-50)) + (-50)); // -50% ile +300% arası ilgi değişimi

        // 4: Görsel Arama (Lens) Yoğunluğu
        const lensYogunlugu = Math.random() > 0.5 ? "YÜKSEK (Görsel bazlı keşif var)" : "DÜŞÜK";

        // 5: Pinterest Kaydetme / Pano Ekleme
        const pinterestKaydetmeAdedi = Math.floor(Math.random() * (10000 - 100) + 100);

        // 6: Arama Terimi Evrimi (Genel -> Spesifik)
        const terimEvrimiSpesifiklestiMi = Math.random() > 0.6 ? true : false;
        const evrimDurumu = terimEvrimiSpesifiklestiMi ? "SPESİFİKLEŞTİ (Örn: 'Siyah Kazak' -> 'V Yaka Siyah Crop Kazak')" : "GENEL DAĞILIM";

        // 7: Mikro Sezon Sinyali (Mezuniyet vb.)
        const mevsimSinyaliGuc = Math.floor(Math.random() * 100);
        let mikroSezonSinyali = "YOK";
        if (mevsimSinyaliGuc >= 80) mikroSezonSinyali = "MEZUNİYET / YAZ TATİLİ / BAYRAM UYARISI";
        else if (mevsimSinyaliGuc >= 60) mikroSezonSinyali = "ARA SEZON GEÇİŞİ";

        // 8: Niş Talep (Büyük Beden / Tesettür var mı?)
        const nisKelimeler = ["Büyük Beden", "Tesettür", "Hamile", "Oversize Unisex", "Yok"];
        const nisTalep = nisKelimeler[Math.floor(Math.random() * nisKelimeler.length)];

        // 9: Global Trend Farkı (Ülke Bazlı Erkenden Patlama)
        const yurtdisiTrend = Math.random() > 0.75 ? "BATI'DA 1 AY ÖNCE PATLAMIŞ" : "YEREL";

        // 10: Arama-Arz Uçurumu
        const arzaKarsiTalep = Math.floor(Math.random() * 100);
        const ucurumDegeri = arzaKarsiTalep > 85 ? "Dev Uçurum (Çok Aranan - Hiç Bulunmayan)" : "Dengeli";

        // --- SKOR ALGORİTMASI (Hedeften sapmaz) ---
        let talepSkoru = 0;

        if (aramaTrendYuzdesi > 100) talepSkoru += 25; // Trend fırlamış
        else if (aramaTrendYuzdesi > 20) talepSkoru += 10;

        if (anahtarKelimeHacmi >= 50000) talepSkoru += 15;
        if (lensYogunlugu.includes("YÜKSEK")) talepSkoru += 10;
        if (pinterestKaydetmeAdedi > 5000) talepSkoru += 15; // Moodboarda alındıysa ilham fazladır
        if (terimEvrimiSpesifiklestiMi) talepSkoru += 10; // İnsanlar ne istediğini tam tarif etmeye başlamış
        if (ucurumDegeri.includes("Dev Uçurum")) talepSkoru += 25; // Üretime sokarsan kral sensin

        // ÇIKTI KURALLARI:
        let talepDurumu = "YOK";
        let artisYonu = "SABİT";

        if (talepSkoru >= 65) {
            talepDurumu = "VAR";
            artisYonu = "YUKSELİYOR";
        } else if (talepSkoru > 35 && talepSkoru < 65) {
            talepDurumu = "POTANSİYEL VAR";
            artisYonu = aramaTrendYuzdesi > 10 ? "YUKSELİYOR" : "SABİT";
        } else {
            talepDurumu = "YOK";
            artisYonu = aramaTrendYuzdesi < -10 ? "DÜŞÜYOR" : "SABİT";
        }

        const analizSonucu = {
            bot: "ARAMA_PIN_LENS_AJANI",
            istihbaratAdi: hedefKelime,
            raportSaati: new Date().toISOString(),
            Detaylar: {
                googleHacim: anahtarKelimeHacmi,
                trendsAylikOran: `%${aramaTrendYuzdesi}`,
                gorselArama: lensYogunlugu,
                pinterestPanoKayit: pinterestKaydetmeAdedi,
                aramaEvrimi: evrimDurumu,
                mikroSezonEtkisi: mikroSezonSinyali,
                nişAramaFirsati: nisTalep,
                yurtdisiGlobalGostergesi: yurtdisiTrend,
                arzTalepFarki: ucurumDegeri
            },
            Cikti: {
                TALEP_VAR_MI: talepDurumu,
                TALEP_ARTIS_YONU: artisYonu,
                TalepZekaSkoru: talepSkoru + "/100"
            }
        };

        console.log(`[ARAMA AJANI] Radar Taraması Tamamlandı.`);
        console.table({
            "TALEP VAR/YOK": analizSonucu.Cikti.TALEP_VAR_MI,
            "ARTIŞ YÖNÜ": analizSonucu.Cikti.TALEP_ARTIS_YONU,
            "SKOR": analizSonucu.Cikti.TalepZekaSkoru
        });

        await browser.close();
        return analizSonucu;

    } catch (error) {
        console.error(`[ARAMA AJANI] Uydu Bağlantısı Koptu: ${error.message}`);
        await browser.close();
        return null;
    }
}

if (require.main === module) {
    aramaVeTalepAnalizi("Leopar Desen Ceket");
}

module.exports = { aramaVeTalepAnalizi };
