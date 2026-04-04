export class MizanetYargic {
    /**
     * 56 Noktalı Profesyonel Karar Algoritması
     * @param {Object} pazarVerisi - Satış dalgası, yorumlar (Aşama 1, 2)
     * @param {Object} stratejiVerisi - Fiyatlandırma, platform uyumu (Aşama 3)
     * @param {Object} teknikVeri - İşçilik, özel makine (Aşama 4)
     * @param {Object} operasyonVerisi - Süreç, lojistik maliyeti (Aşama 5, 7)
     * @param {Object} uretimMaliyetVerisi - Hammadde, Fire, MOQ (Aşama 6)
     * @param {Object} riskVerisi - İade sebebi, tek tedarikçi (Ek Katman)
     * @returns {Object} { karar: 'URET' | 'REVIZE' | 'IPTAL', skorlar: {} }
     */
    static analizEt(pazarVerisi, stratejiVerisi, teknikVeri, operasyonVerisi, uretimMaliyetVerisi, riskVerisi) {

        let redGerekcesi = [];
        let uyarilar = [];
        let toplamSkor = 0; // 100 üzerinden hedeflenen skor

        // --- 1. ÖLÜMCÜL RİSKLER (1 KERE OLURSA DOĞRUDAN ÇÖP) ---

        // A. İade ve Kalite Riski (Kural 4)
        if (riskVerisi.tekrarEdenSikayetOrani >= 20) {
            redGerekcesi.push("İptal: Üründe kronik şikayet (≥%20) var. Müşteri memnun niyeti riski.");
        }

        // B. Tedarik Riski (Kural 8)
        if (riskVerisi.tekTedarikciMi && riskVerisi.alternatifTedarikciYok) {
            uyarilar.push("Uyarı: Kumaş tek bir tedarikçide var. Sıkıntı çıkarsa bant durur.");
        }

        // C. Zamanlama ve Doygunluk (Kural 21 ve 48)
        if (pazarVerisi.trendEgrisi === 'dusus_basladi' || pazarVerisi.trendEgrisi === 'doygun') {
            redGerekcesi.push("İptal: Trend pik noktasını geçmiş, aşağı yönlü.");
        }
        if (operasyonVerisi.kumasTedarikSuresiKritikMi) {
            redGerekcesi.push("İptal: Kumaş geliş süresi çok uzun, trend dönemi kaçırılacak.");
        }

        // D. Karlılık (Kural 58 - Revize)
        // Piyasada %30 marj artık her üründe yok.
        // Yeni Kapanma Noktası: Net Kâr Marjı %12'nin altındaysa risk olarak işaretlenir. 
        // Not: Stratejik bir boşluk varsa %12 de kabul edilebilir, doğrudan çöpe atılmaz.
        let marj = uretimMaliyetVerisi.beklenenMarjYuzdesi || 0;
        let marjLimiti = 12; // Sabit 30 yerine esnek stratejik sınır (Standart: %12)

        if (marj < marjLimiti) {
            // Eğer çok düşük bir marj varsa ama trend pazar açığı sağlıyorsa "UYARI" olarak kalır.
            if (stratejiVerisi.pazardaBoslukVar) {
                uyarilar.push(`Uyarı: Kâr marjı (%${marj}) hedef limitin (%${marjLimiti}) altında, ancak pazar boşluğuna girmek için 'Sürüm stratejisiyle' tolere edilebilir.`);
            } else {
                // Pazarda hem boşluk yok hem marj yerlerde = ÇÖP
                redGerekcesi.push(`İptal: Ürün kızıl okyanusta ve kâr marjı (%${marj}) güvence eşiğinin (%${marjLimiti}) oldukça altında.`);
            }
        }

        // E. Teknik (Kural 39)
        if (teknikVeri.zorKalipMi && teknikVeri.ozelMakineSartMi) {
            redGerekcesi.push("İptal: İşçilik çok zor ve özel makine gerektiriyor (Kapasite tavan limitine çarpıyor).");
        }


        // --- 2. PUANLAMA VE POZİTİF SKOR BİRİKİMİ ---

        let talepSkoru = 0;
        if (pazarVerisi.sepetArtisi) talepSkoru += 25;
        if (pazarVerisi.yorumArtisi) talepSkoru += 25;
        if (pazarVerisi.favoriArtisi) talepSkoru += 25;
        if (pazarVerisi.viralIcerik) talepSkoru += 25;

        let uretimSkoru = 100;
        if (teknikVeri.zorKalipMi) uretimSkoru -= 30;
        if (teknikVeri.hataRiskiYuksek) uretimSkoru -= 40;
        if (operasyonVerisi.darbogazVar) uretimSkoru -= 30;

        let platformSkoru = 0;
        if (stratejiVerisi.gorselDikkatCekici) platformSkoru += 30;
        if (stratejiVerisi.fiyatEsigiPsikolojikMi) platformSkoru += 40;
        if (stratejiVerisi.pazardaBoslukVar) platformSkoru += 30;


        // -- FİNAL HESAP -- 
        // Ağırlıklar: Talep(%40), Üretim/Teknik(%30), Platform/Strateji(%30)
        toplamSkor = (talepSkoru * 0.4) + (uretimSkoru * 0.3) + (platformSkoru * 0.3);

        // -- NİHAİ KARAR MEKANİZMASI --
        let sonuc = "URET";

        if (redGerekcesi.length > 0) {
            sonuc = "IPTAL";
        } else if (toplamSkor < 65 || uyarilar.length > 0) {
            sonuc = "REVIZE";
            if (toplamSkor < 65) uyarilar.push("Talep, teknik veya platform skoru zayıf. Maliyeti veya modeli revize et.");
        }

        return {
            karar: sonuc,
            detaylar: {
                hamSkor: toplamSkor.toFixed(1),
                talepSkoru,
                uretimSkoru,
                platformSkoru,
                redSebepleri: redGerekcesi,
                uyarilar: uyarilar
            }
        };
    }
}
