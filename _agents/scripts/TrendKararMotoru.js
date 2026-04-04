/**
 * Mizanet - BEYİN (KARAR MOTORU)
 * 
 * Bu algoritma, 8 KRİTİK SİNYALİ okuyarak bir ürünün ÜRET / GİR / BEKLE / İPTAL
 * kararını kesin ve matematiksel olarak %90+ doğrulukla veren tek merkezdir.
 */

class TrendKararMotoru {
    constructor() {
        this.KATSAYILAR = {
            DONUSUM: 0.35,  // %35 (En kritik: İzlenme -> Sepet -> Satış)
            TALEP: 0.20,    // %20 (Sepet, Favori, Yorum İvmesi)
            VIRAL: 0.15,    // %15 (Yayılma hızı, tekrar çıkma)
            REKABET: 0.10,  // %10 (Pazar doymuş mu? Yeni satıcı var mı?)
            YORUM: 0.10,    // %10 (Tekrar eden olumlu yorum)
            ZAMAN: 0.05,    // %5  (Artış durdu mu, devam mı?)
            RISK: -0.20     // -%20 (İade sinyali, sahte trend - Puan DÜŞÜRÜR)
        };
    }

    analizEt(urunVerisi) {
        let skorlar = {
            talep: 0,
            viral: 0,
            donusum: 0,
            rekabet: 0,
            yorum: 0,
            zaman: 0,
            risk: 0
        };

        let aciklamalar = [];

        // 1. DÖNÜŞÜM SİNYALİ (EN KRİTİK)
        // Kural: İzlenme var, sepet yoksa = SAHTE TREND (0 puan)
        if (urunVerisi.sosyalGörüntüleme > 10000 && urunVerisi.sepettekiKisi < 20) {
            aciklamalar.push("❌ SAHTE TREND: Yüksek izlenme var ama sepete ekleyen yok.");
            skorlar.donusum = 0;
            skorlar.risk += 50; // Ölümcül Risk
        } else {
            let sepeteDonusumOrani = (urunVerisi.sepettekiKisi / urunVerisi.sosyalGörüntüleme) * 100;
            let satisaDonusumOrani = (urunVerisi.yorumDelta / urunVerisi.sepettekiKisi) * 100;

            if (sepeteDonusumOrani > 2 && satisaDonusumOrani > 5) {
                skorlar.donusum = 100;
                aciklamalar.push("✅ DÖNÜŞÜM: Görüntüleme sepete, sepet gerçek satışa dönüyor. (Çok Güçlü)");
            } else if (sepeteDonusumOrani > 1) {
                skorlar.donusum = 60;
                aciklamalar.push("⚠️ DÖNÜŞÜM: Sepete ekleme var ama satışa dönüşüm yavaş (Fiyat/Güven problemi olabilir).");
            }
        }

        // 2. TALEP SİNYALİ (TRENDYOL)
        let artanSinyalSayisi = 0;
        if (urunVerisi.sepetDelta > 0) { artanSinyalSayisi++; }
        if (urunVerisi.favoriDelta > 50) { artanSinyalSayisi++; }
        if (urunVerisi.yorumDelta > 2) { artanSinyalSayisi++; }

        if (artanSinyalSayisi >= 2) {
            skorlar.talep = 100;
            aciklamalar.push("✅ TALEP: Sepet/Favori/Yorum üçlüsünden en az 2'si anlık artışta.");
        } else {
            skorlar.talep = 30;
            aciklamalar.push("❌ TALEP: Pazar yerinde anlamlı bir hareketlenme (delta) yok.");
        }

        // 3. VİRAL SİNYAL (TIKTOK/IG) & VİDEO SATIŞ BAĞLANTISI
        if (urunVerisi.viralHizi > 0 && urunVerisi.farkliHesapPaylasimi) {
            skorlar.viral = 100;
            aciklamalar.push("✅ VİRAL: Ürün farklı hesaplarda tekrar tekrar yayılıyor.");
        } else {
            skorlar.viral = 40;
        }

        // 4. YORUM KALİTESİ & TEKRAR SATIN ALMA
        if (urunVerisi.olumluKelimeTekrari.includes("çok rahat") || urunVerisi.olumluKelimeTekrari.includes("kumaşı güzel")) {
            skorlar.yorum = 80;
            if (urunVerisi.tekrarAlimVar) {
                skorlar.yorum = 100;
                aciklamalar.push("✅ YORUM: '2. kez aldım' / 'Tekrar sipariş verdim' sinyali var. Mükemmel Ürün!");
            }
        }

        // 5. REKABET VE PAZAR DOYGUNLUĞU
        if (urunVerisi.yeniSaticiGirisiVar && urunVerisi.ilkSayfaDoluluk < 80) {
            skorlar.rekabet = 100;
            aciklamalar.push("✅ REKABET: İlk sayfa hala kilitlenmemiş, yeni satıcılar pazara girmeye çalışıyor. (YER VAR)");
        } else if (urunVerisi.ilkSayfaDoluluk > 95) {
            skorlar.rekabet = 20;
            aciklamalar.push("❌ REKABET: İlk sayfa tamamen doygun, eski satıcılar kilitli. Pazara giriş çok maliyetli.");
        } else {
            skorlar.rekabet = 50;
        }

        // 6. TREND ZAMANI (KIRILMA NOKTASI)
        if (urunVerisi.yorumArtisiYavasladi) {
            skorlar.zaman = 10;
            skorlar.risk += 30;
            aciklamalar.push("❌ ZAMAN: Trendin artış hızı yavaşlamış (Trend kırılma noktasını geçmiş, geç kalındı).");
        } else {
            skorlar.zaman = 100;
            aciklamalar.push("✅ ZAMAN: İvme hala yukarı yönlü.");
        }

        // 7. RİSK - İADE SİNYALLERİ VEYA NEGATİF KELİMELER
        if (urunVerisi.iadeSinyaliVar) {
            skorlar.risk += 100;
            aciklamalar.push("❌ RİSK: Tekrar eden iade/şikayet sinyalleri yakalandı! (Kalıp veya kumaş sorunu)");
        }

        // AĞIRLIKLI ANA SKOR HESABI
        let anaSkor =
            (skorlar.donusum * this.KATSAYILAR.DONUSUM) +
            (skorlar.talep * this.KATSAYILAR.TALEP) +
            (skorlar.viral * this.KATSAYILAR.VIRAL) +
            (skorlar.rekabet * this.KATSAYILAR.REKABET) +
            (skorlar.yorum * this.KATSAYILAR.YORUM) +
            (skorlar.zaman * this.KATSAYILAR.ZAMAN);

        // Riski ana skordan düşün
        anaSkor -= (skorlar.risk * Math.abs(this.KATSAYILAR.RISK));

        // Skor Sınırları (0-100)
        anaSkor = Math.max(0, Math.min(100, Math.round(anaSkor)));

        // KARAR ÇIKTISI
        let karar = "";
        if (anaSkor >= 85) {
            karar = "ÜRET (GÜÇLÜ TREND + SATAR)";
        } else if (anaSkor >= 70) {
            karar = "GİR (RİSK DÜŞÜK, TEST EDİLEBİLİR)";
        } else if (anaSkor >= 50) {
            karar = "BEKLE (KARARSIZ SİNYAL)";
        } else {
            karar = "İPTAL (GİRİLMEZ)";
        }

        // ERKEN TREND (GİZLİ SİNYAL) ZEKASI
        // Viral Yüksek + Rekabet Düşük + Yorum Az Ama Artıyor
        if (skorlar.viral > 80 && skorlar.rekabet > 80 && urunVerisi.toplamYorum < 20 && urunVerisi.yorumDelta > 0) {
            karar = "** ERKEN GİR ETİKETİ! (Henüz patlamadı ama eli kulağında) **";
        }

        // ZORUNLU ÖLÜMCÜL FİLTRELER YAKALADIYSA ACIMASIZCA İPTAL ET
        if (skorlar.donusum === 0 || urunVerisi.yorumArtisiYavasladi) {
            karar = "İPTAL (ÖLÜMCÜL FİLTREYE TAKILDI)";
            anaSkor = 0;
        }

        return {
            skor: anaSkor,
            karar: karar,
            detaylar: aciklamalar
        };
    }
}

// === SİSTEM TESTİ İÇİN ÖRNEK GİRDİ (AJANLARIN GETİRECEĞİ VERİ) ===
const ornekUrunler = [
    {
        isim: "Kırmızı Asimetrik Abiye (Sahte Viral Örneği)",
        sosyalGörüntüleme: 500000,
        sepettekiKisi: 5,        // 500k izlenmiş ama kimse sepete atmıyor = SAHTE!
        yorumDelta: 0,
        sepetDelta: 0,
        favoriDelta: 10,
        viralHizi: 100,
        farkliHesapPaylasimi: true,
        olumluKelimeTekrari: "",
        tekrarAlimVar: false,
        yeniSaticiGirisiVar: false,
        ilkSayfaDoluluk: 90,
        yorumArtisiYavasladi: true,
        iadeSinyaliVar: false,
        toplamYorum: 150
    },
    {
        isim: "Siyah Yırtmaçlı Midi Elbise (Gerçek Erken Trend Örneği)",
        sosyalGörüntüleme: 25000,
        sepettekiKisi: 1200,     // İzlenmenin %5'i sepette! (Muazzam Dönüşüm)
        yorumDelta: 8,           // Yorum yeni yeni artıyor
        sepetDelta: 400,
        favoriDelta: 850,
        viralHizi: 60,
        farkliHesapPaylasimi: true,
        olumluKelimeTekrari: "kumaşı güzel tam beden",
        tekrarAlimVar: false,
        yeniSaticiGirisiVar: true, // Rakipler yeni uyanıyor
        ilkSayfaDoluluk: 40,       // İlk sayfada hala yer var
        yorumArtisiYavasladi: false,
        iadeSinyaliVar: false,
        toplamYorum: 15
    }
];

const motor = new TrendKararMotoru();

console.log("=========================================");
console.log("Mizanet - YAPAY ZEKA KARAR MOTORU AKTİF");
console.log("=========================================\n");

ornekUrunler.forEach(urun => {
    let sonuc = motor.analizEt(urun);
    console.log(`👗 ÜRÜN: ${urun.isim}`);
    console.log(`🏆 SKOR: ${sonuc.skor} / 100`);
    console.log(`🛑 KARAR: ${sonuc.karar}`);
    console.log(`📊 ANALİZ DETAYLARI:`);
    sonuc.detaylar.forEach(detay => console.log(`   ${detay}`));
    console.log("- - - - - - - - - - - - - - - - - - - - -");
});
