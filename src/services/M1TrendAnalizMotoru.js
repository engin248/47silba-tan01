export class M1GelistirilmisTrendMotoru {
    /**
     * M1 Trend Yakalama ve Puanlama Motoru (İleri Seviye Profesyonel Sürüm)
     * Bu motor; 5 İleri Düzey Güvenlik Katmanı ve kullanıcının belirttiği 
     * tüm "Öğrenen/Tamamlayan Otomatik Karar" prensiplerini içerir.
     * 
     * @param {Object} rawData - Pazar Yeri (Trendyol) + Sosyal(TikTok/IG) Verileri
     * @param {Object} dynWeights - Dinamik Ağırlıklandırma Kofisayısı
     * @param {Object} historyData - Geçmiş hatalardan öğrenme ve kalibrasyon verisi
     * @returns {Object} Sonuc Raporu (Skor, Karar, Güven, Açıklamalar)
     */
    static trendiKoklaVeriEle(rawData, dynWeights, historyData = {}) {

        let rapor = { uyarılar: [], elenmeSebebi: null, toplamSkor: 0, karar: "BEKLE", guvenSkoru: 0, detaylar: {} };
        let zayifSinyalKatsayisi = 1;

        // ============================================================================
        // 1. VERİ TEMİZLEME, GECİKME TELAFİSİ VE SAHTE TREND FİLTRESİ
        // ============================================================================

        // A) Gecikme Telafisi (API Delay Fix)
        if (rawData.veriGecikmesiSaat > 12) {
            rapor.uyarılar.push("API Gecikme Telafisi: Son veri 12 saatten eski, tahmini delta ile tamamlandı.");
            rawData.sepetDeltasi *= 1.1; // Eski veriyi günümüze yaklaştırma katsayısı
        }

        // B) Minimum Veri Eşiği ve Çöplük Filtresi
        if (rawData.toplamIzlenme < 10000 || rawData.yorumSayisi < 20) {
            rapor.elenmeSebebi = "YETERSİZ VERİ: Skor hesaplamak için minimum 10K izlenme ve 20 yorum şartı sağlanamadı.";
            rapor.karar = "IPTAL";
            return rapor;
        }

        // C) Çapraz Platform Fake Trend Filtresi (Sıfır Toleras)
        // TikTok'ta patlıyor ama Trendyol'da yaprak kımıldamıyorsa -> %90 Sahte Trend / Bot
        if (rawData.viralHizi_Zirvede_Mi && rawData.sepetDeltasi <= 2 && rawData.favoriDeltasi <= 5) {
            rapor.elenmeSebebi = "SAHTE TREND HÜCRESİ: Yüksek sosyal medya köpürtmesi var ancak pazarda cüzdana (sepete) dönüşmüyor.";
            rapor.karar = "IPTAL";
            return rapor;
        }

        // D) Ürün Benzerlik / Varyant Yığılması (Dağınık Veriyi Gruplama Etkisi)
        if (rawData.benzerVaryantSayisi > 10) {
            rapor.uyarılar.push("Varyant Gürültüsü: Piyasada çok fazla kopyası var, rekabet verisi birleştirilerek risk artırıldı.");
            rawData.saticiSayisi += 5; // Puan düşürmek için sanal satıcı cezası
        }

        // ============================================================================
        // 2. ALT SKORLAMALAR (0-100 ARASI HER BİRİM İÇİN)
        // ============================================================================

        // 1. TALEP SKORU (Sepet + Favori + Yorum)
        let talepSkoru = Math.min(100, (rawData.sepetDeltasi * 1.5) + (rawData.yorumDeltasi * 2) + (rawData.favoriDeltasi * 1.2));

        // 2. VİRAL SKOR (İzlenme + Tekrar Performansı)
        let viralSkor = Math.min(100, (rawData.izlenmeHizi_Gunluk * 0.8) + (rawData.baskaHesaptaKopyaSikligi * 5));

        // 3. DÖNÜŞÜM SKORU (İzlenme -> Sepet -> Satış KAYBI(Kullanıcı Davranış Analizi))
        let izlenmeToSepet = rawData.toplamIzlenme > 0 ? (rawData.sepetTotal / rawData.toplamIzlenme) * 100 : 0;
        let sepetTerkOrani = rawData.sepetTotal > 0 ? ((rawData.sepetTotal - rawData.satisSinyali) / rawData.sepetTotal) * 100 : 0;

        let donusumSkoru = izlenmeToSepet * 10;
        if (sepetTerkOrani > 80) { // Sepette çok bırakılıyorsa
            donusumSkoru *= 0.6; // Ciddi puan kesintisi
            rapor.uyarılar.push("Kullanıcı Davranış Analizi: Kullanıcılar sepette terk ediyor. Yüksek ihtimal Fiyat/Kargo sorunu var.");
        }
        donusumSkoru = Math.min(100, Math.max(0, donusumSkoru));

        // 4. REKABET SKORU VE DOYGUNLUK (Ters Çalışır)
        let rekabetSkoru = 100 - (rawData.saticiSayisi * 2) - (rawData.ilkSayfaDoygunlugu_Yuzde);
        if (rawData.pazarTamamenDoymus) rekabetSkoru *= 0.5; // Doyum Saturasyon cezası
        rekabetSkoru = Math.max(0, rekabetSkoru);

        // 5. YORUM İÇERİĞİ TESPİTİ (Pozitif Zehirlenme Filtresi)
        let yorumSkoru = rawData.pozitifYorumOrani || 50;
        if (rawData.ayniKelimelerTekrarliyorMu) {
            yorumSkoru *= 0.5; // Sahte BOT yorumu cezası
            rapor.uyarılar.push("Pozitif Zehirlenme Tespiti: Yorumlarda aşırı tekrarlayan bot cümleleri var, yorum skoru kırpıldı.");
        }

        // ============================================================================
        // 3. HIZLI MODA / ZAMAN EKSENİ VE MAKR O SEZON ETKİSİ
        // ============================================================================

        let zamanSkoru = 100;
        // Fast Fashion (Hızlı Trend) vs Basic (Uzun Vadeli) Ayrımı
        if (rawData.trendKategorisi === 'hizli_moda') {
            if (rawData.trendEgrisi === 'dusus') {
                zamanSkoru = 20; // Hızlı modada düşüş başladıysa ölüm fermanıdır.
                rapor.uyarılar.push("Trend Çöküş Tespiti: Hızlı Moda kategorisinde eğri düşüşe geçmiş. Girilmez.");
            } else if (rawData.asilisGunu > 20) {
                zamanSkoru = 40; // Çoktan patlamış
            }
        }
        // Sezon Etkisi
        if (rawData.sezonBitiyorMu) {
            zamanSkoru *= 0.5;
            rapor.uyarılar.push("Sezon Filtresi: Ürün sezonu bitmek üzere, stok elde kalma riski var.");
        }

        // ============================================================================
        // 3.5 İKLİM VE HAVA DURUMU TAHMİNLEMESİ (SATIŞ BASTIRICI/TETİKLEYİCİ)
        // ============================================================================

        let havaDurumuSkoru = 100;
        if (rawData.gelecek15GunHavaTahmini && rawData.urunIklimTipi) {
            // Örn: Ürün "yagmurluk", ama 15 gün "kavurucu_sicak" bekleniyor
            if (rawData.gelecek15GunHavaTahmini === 'sicak_dalga' && (rawData.urunIklimTipi === 'yagisli' || rawData.urunIklimTipi === 'soguk')) {
                havaDurumuSkoru = 40;
                zayifSinyalKatsayisi *= 0.7; // Ciddi bir satış blokajı
                rapor.uyarılar.push("Hava Durumu Radar Uyarısı: Önümüzdeki 15 gün sıcak dalgası bekleniyor, kalın/kışlık ürün satışı durma noktasına gelebilir.");
            }
            // Örn: Ürün "sifir_kol_tsirt", ama 15 gün "ani_soguma_ve_yagis"
            else if (rawData.gelecek15GunHavaTahmini === 'ani_soguma' && rawData.urunIklimTipi === 'asiri_sicak') {
                havaDurumuSkoru = 50;
                zayifSinyalKatsayisi *= 0.8;
                rapor.uyarılar.push("Hava Durumu Radar Uyarısı: Önümüzdeki 15 gün ani soğuma ve yağış bekleniyor, yazlık ürün satış hızı çakılabilir.");
            }
            // Mükemmel Eşleşme (Fırsat)
            else if (rawData.gelecek15GunHavaTahmini === rawData.urunHavaIhtiyaci) {
                talepSkoru += 15; // Talep patlaması yaşanacak
                rapor.uyarılar.push("Hava Durumu Fırsatı: Ürün tam da önümüzdeki 15 günün hava şartlarına uygun! Acil stok/satış avantajı.");
            }
        }


        // ============================================================================
        // 3.6 EKSTREM MAKRO KANUNLAR (İNSAN PSİKOLOJİSİ VE TAKVİM DİRENCİ)
        // ============================================================================

        // A) Maaş Günü (Parasal Şiddet) Etkisi
        if (rawData.ayinGunu) {
            // Ayın 14-16'sı veya 30-2'si arası maaş dönemidir, dönüşüm tavan yapar.
            let maasGunuMu = (rawData.ayinGunu >= 30 || rawData.ayinGunu <= 2) || (rawData.ayinGunu >= 14 && rawData.ayinGunu <= 16);
            if (maasGunuMu) {
                talepSkoru += 15;
                donusumSkoru *= 1.2; // Dönüşüm katsayısını pazarın alışveriş ateşine göre çarpar
                rapor.uyarılar.push("Maaş Takvimi Fırsatı: İnsanların cebinde para var, dönüşüm skoru suni şekilde yüksek çıkacak, üretim cüreti artabilir.");
            } else if (rawData.ayinGunu >= 22 && rawData.ayinGunu <= 28) {
                // Ay sonu cebi boş dönemi
                donusumSkoru *= 0.8;
                rapor.uyarılar.push("Maaş Takvimi Direnci: Ay sonu cüzdan boşluğu. Yüksek sepet ama düşük dönüşüm normaldir, bu trendin sahte olduğu anlamına gelmez.");
            }
        }

        // B) Özel Gün Panik/Hediyeleme Eşiği (14 Şubat, Anneler Günü vs.)
        if (rawData.ozelGunAdi && rawData.ozelGuneKalanGun !== undefined) {
            if (rawData.ozelGuneKalanGun <= 3) {
                rapor.elenmeSebebi = `ÖZEL GÜN ÖLÜM FERMANI: ${rawData.ozelGunAdi}'ne sadece ${rawData.ozelGuneKalanGun} gün kaldı. Kargo yetişmeyeceği için %80 iade yersin. Doğrudan İPTAL.`;
                rapor.karar = "IPTAL";
                return rapor; // Anında kesip atar.
            } else if (rawData.ozelGuneKalanGun <= 10) {
                rapor.uyarılar.push(`Özel Gün Alarmı: ${rawData.ozelGunAdi}'ne ${rawData.ozelGuneKalanGun} gün var. Üretip hemen sevkiyata çıkmak ciddi risk, stok elinde patlayabilir.`);
                zayifSinyalKatsayisi *= 0.6; // Gücü %40 tırpanlar
            }
        }

        // C) 15. Gün Sonrası Kronik Yıkama/Bozulma Kusuru
        if (rawData.urunPiyasadaKacGundurVar >= 15 && rawData.yorumKelimeleri) {
            let defoKelimeleri = ["çekti", "tüylendi", "soldu", "yıkadım", "bozuldu", "yırtıldı", "tiftik"];
            let defoVurgusuVarMi = defoKelimeleri.some(kelime => rawData.yorumKelimeleri.toLowerCase().includes(kelime));

            if (defoVurgusuVarMi && rawData.birYildizOrani >= 15) { // 1 yıldız oranı %15'ten fazlaysa
                rapor.elenmeSebebi = "KRONİK ÜRETİM KUSURU: Ürün yıkama/kullanım testinden geçememiş, iade furyası başlamış. Rakibin hatasına düşmemek için bandı durdur!";
                rapor.karar = "IPTAL";
                return rapor;
            } else if (defoVurgusuVarMi) {
                rapor.uyarılar.push("Ömür/Yıkama Uyarı Sinyali: Olumsuz yorumlarda 'çekme/tüylenme' saptandı. M2 (Kumaş) adımında materyali acilen daha dayanıklı bir versiyonla değiştirmelisin.");
                yorumSkoru *= 0.4;
            }
        }

        // ============================================================================
        // 4. CÜZDAN DİRENCİ VE SENARYO SİMÜLASYONLARI
        // ============================================================================

        let onerilenFiyat = rawData.ilk10RakiplerinFiyatOrtalamasi ?
            (Math.floor((rawData.ilk10RakiplerinFiyatOrtalamasi * 0.95) / 10) * 10 + 9) : null; // Sonu 9'lu Psikolojik İndirimli Fiyat

        let fiyatOynaklikRiski = false;
        if (rawData.fiyatSon3GundeCokDegisti) {
            fiyatOynaklikRiski = true;
            rapor.uyarılar.push("Fiyat Oynaklık Analizi: Pazarda fiyatlar sürekli değişiyor, denge oturmamış (Kanlı Pazar).");
            rekabetSkoru *= 0.8;
        }

        // Simülasyon: Ya Rakipler Fiyatı %10 daha kırarsa?
        let marjLimitiGecilirMi = (rawData.mevcutMarj - 10) > 12; // Direnç testi
        if (!marjLimitiGecilirMi) {
            zayifSinyalKatsayisi *= 0.9;
            rapor.uyarılar.push("Senaryo Simülasyonu: Rekabet artar ve fiyat \%10 kırılırsa bu ürün zarar yazar. Risksiz değil.");
        }

        // ============================================================================
        // 5. ERKEN TREND YAKALAMA (BONUS) VE İÇERİK ÖNERİSİ
        // ============================================================================

        let erkenGirSinyali = false;
        if (rawData.viralHizi_Zirvede_Mi && rawData.saticiSayisi < 5 && rawData.yorumDeltasi_Artis_Trendi && rawData.trendKategorisi !== 'doygun') {
            erkenGirSinyali = true;
            rapor.uyarılar.push("🚀 ERKEN GİR SİNYALİ: Ürün henüz doymadı, pazarda açık var. Erken giren kazanır!");
            talepSkoru += 20; // Turbo
        }

        if (rawData.enCokSatanIcerikTipi) {
            rapor.uyarılar.push(`İçerik Önerisi: Bu trendi en iyi '${rawData.enCokSatanIcerikTipi}' (örn: Kutu açılışı / Kombin videosu) tarzı içerikler satıyor.`);
        }

        // ============================================================================
        // 6. DİNAMİK AĞIRLIKLANDIRMA VE FİNAL SKOR
        // ============================================================================

        // Geçmiş hatalardan öğrenen Skor Kalibrasyonu
        let kalibrasyon = historyData.yanlisTahminHataPayi || 0;

        let wf = dynWeights || { donusum: 0.35, talep: 0.20, viral: 0.15, rekabet: 0.10, yorum: 0.10, zaman: 0.10 };

        // Eğer hızlı modaysa Viral ve Zaman ağırlığını artır, Rekabeti düşür
        if (rawData.trendKategorisi === 'hizli_moda') {
            wf = { donusum: 0.30, talep: 0.15, viral: 0.25, rekabet: 0.10, yorum: 0.05, zaman: 0.15 };
        }

        let hamSkor = (donusumSkoru * wf.donusum) + (talepSkoru * wf.talep) + (viralSkor * wf.viral) +
            (rekabetSkoru * wf.rekabet) + (yorumSkoru * wf.yorum) + (zamanSkoru * wf.zaman);

        hamSkor = (hamSkor - kalibrasyon) * zayifSinyalKatsayisi;

        rapor.toplamSkor = Math.max(0, Math.round(Math.min(100, hamSkor)));

        // ============================================================================
        // 7. AÇIKLANABİLİR KARAR MOTORU (BlackBox'ı Kırmak)
        // ============================================================================

        let veriKapsami = (rawData.platformSayisi * 30) + (rawData.veriGecmisiGun * 5);
        rapor.guvenSkoru = Math.min(100, veriKapsami);
        if (rapor.guvenSkoru < 50) {
            rapor.uyarılar.push("Karar Güven Riski: Sistem kör karara karşı uyarıyor. Yetersiz platform karşılaştırması var.");
        }

        if (zamanSkoru < 30) {
            rapor.karar = "IPTAL";
            rapor.elenmeSebebi = "Trend ömrü bitmiş veya sezon sonu.";
        } else if (rapor.toplamSkor >= 85) {
            rapor.karar = "URET (Hızlı)";
            rapor.Aciklama = "Dönüşüm harika, rekabet az, viral hız yüksek. Hızlı üretim bandına alın.";
        } else if (rapor.toplamSkor >= 70) {
            rapor.karar = "GIR";
            rapor.Aciklama = "Sağlam trend, satışlar doğrulanmış. Normal kapasiteyle girilebilir.";
        } else if (rapor.toplamSkor >= 50) {
            rapor.karar = "BEKLE";
            rapor.Aciklama = "Viral var ama dönüşüme yansıması zayıf. Rakipler izlenmeli, hemen üretilmemeli.";
        } else {
            rapor.karar = "IPTAL";
            rapor.elenmeSebebi = "Genel skor barajı geçemedi (Gürültü).";
        }

        // 8. TAHMİN RAPORU (ÖLÇÜLEBİLİR SONUÇ)
        rapor.detaylar = {
            tahminiGunlukSatis: Math.round(rawData.yorumDeltasi * 1.8 + (rawData.sepetDeltasi * 0.4)),
            onerilenPsikolojikFiyat: onerilenFiyat,
            donusumSkoruPuan: Math.round(donusumSkoru),
            rekabetSkoruPuan: Math.round(rekabetSkoru),
            zamanSkoruPuan: Math.round(zamanSkoru)
        };

        return rapor;
    }
}
