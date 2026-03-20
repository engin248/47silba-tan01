# 🛡️ 47 NİZAM: 54 KRİTER MERKEZLİ SİSTEM TAM TEST VE KABUL RAPORU

**Test Tarihi:** ..../..../2026
**Testi Uygulayan / Denetmen:** ......................................
**Saha Platformu:** [ ] Tablet  [ ] Telefon  [ ] Bilgisayar
**İnternet Durumu:** [ ] Wi-Fi  [ ] Mobil Veri  [ ] Çevrimdışı (Kesilip test edildi)

> **⚠️ KESİN TALİMAT (ZORUNLU DOLDURULACAKTIR):**
>
> 1. Aşağıdaki liste, sistemde bulunan Yirmi İki (22) modülün her biri (ve alt sekmeleri) için istisnasız 54 teknik, görsel, hukuksal ve saha kriterine göre test edilmesini emreder.
> 2. Testi yapan kişi işlemi FİZİKEN yapıp karşısına (✅ Geçti) veya (❌ Kaldı) işaretleyecektir.
> 3. **DİKKAT:** Her bölümün sonunda yer alan **"🕵️ DENETMEN ZORUNLU KANIT TESTİ"** soruları denetmenin sistemi gerçekten kullanıp kullanmadığını ispatlaması için konulmuş siber tuzaklardır. **BU SORULARIN BOŞ BIRAKILMASI VEYA YANLIŞ CEVAPLANMASI DURUMUNDA BU TEST RAPORU GEÇERSİZ SAYILACAK VE DENETMEN HAKKINDA İŞLEM YAPILACAKTIR.** Kutu içine bizzat kalemle yazmanız mecburidir.

---

## 1. BÖLÜM: ARAYÜZ (GÖZLEMLEME) VE UX TESTLERİ [Her Departmanda (Kumaştan Kasaya) Yapılacak]

[ ] 01. **(G1 Kriteri) Okunabilirlik:** Butonlar, yazılar, rakamlar 1 metreden (-gözü terli işçi için-) okunabiliyor mu? Parlama var mı?
[ ] 02. **(O Kriteri) Alt Sekmeler:** İmalat veya Personel sayfasındaki alt sekmeler tıklandığında ekran yenilenmeden saniyesinde açılıyor mu?
[ ] 03. **(P Kriteri) Hızlı Butonlar:** Her sayfanın sağ üstündeki "Yeni Ekle" veya "Filtrele" tuşları parmak boyutunda ve doğru konumda mı?
[ ] 04. **(Q Kriteri) Beyaz Ekran Testi:** Butona kasten saniyede 10 kere basıldığında ekran (UI) çöküyor veya kilitleniyor mu?
[ ] 05. **(T Kriteri) Sütun Genişliği:** Tablolarda (Siparişler/Maliyet) uzun metin girildiğinde tablo dışarı taşıyor mu veya düzgün alt satıra geçiyor mu?
[ ] 06. **(B Kriteri) Bilgi Obezitesi:** Sayfada gereksiz yere göz yoran tıkış tıkış veriler gizlenebiliyor mu (Akordiyon veya Tıklama ile)?
[ ] 07. **(A Kriteri) Gereklilik Testi:** O sekmede (Örn: Modelhane) duran input alanları gerçekten atölye tarafından kullanılıyor mu?
[ ] 08. **(E Kriteri) Gösterim Kalitesi:** Rakam olan verilerde bineri ayırma (Örn: 10.000) ve para birimi sembolleri (₺, $) yerinde mi?
[ ] 09. **(L Kriteri) Renk Uyumu:** Zıt renkler (Örn: Kırmızı üstüne yeşil) var mı? 47-Gold ve Emerald renkleri standart mı?
[ ] 10. **(YY Kriteri) İşçi Psikolojisi:** Ekran işçiye "Bu çok karmaşık" dedirtip pasif direniş başlattırır mı? Tuş dilleri basit mi (Sil, Ekle vs.)?

> 🕵️ **DENETMEN ZORUNLU KANIT TESTİ 1 (DOLDURULMASI MECBURİDİR):**
> Karargâh ana sayfasında ciroyu gizleyen sağ üstteki "Rakamları Gizle" (Göz) ikonuna tıklandığında cironun yerine HANGİ SEMBOLLER/KARAKTERLER (Aynen çizin/yazın) çıkmaktadır?
> **Cevap / Gördüğünüzü Çizin:** [ ........................................................ ]

---

## 2. BÖLÜM: FONKSİYON, HIZ VE "ÇÖKERTME" TESTLERİ [Her Sekmedeki Buton, Form ve Veriler İçin]

[ ] 11. **(R Kriteri) Veri Ekleme:** Kumaş, Görev veya Model kaydı yapıldığında veritabanına sorunsuz yazılıyor mu? (Supabase kontrolü).
[ ] 12. **(X Kriteri) Negatif Kalkanı:** Miktar, Kilo, Tutar veya Fiyat alanlarına (-50) gibi eksi rakamlar yazıldığında sistem reddediyor mu?
[ ] 13. **(JJ Kriteri) Çift Tıklama (Race Condition):** "Ekle" tuşuna aynı anda/hızla 3 kez basınca sadece 1 kayıt mı açıyor yoksa mükerrer kayıt mı giriyor?
[ ] 14. **(DD Kriteri) Telegram Telgrafı:** Kasa'dan, Siparişten vb. yüksek meblağlı bir tuşa basıldığında anında Patronun Telegramına Alarm Düşüyor mu?
[ ] 15. **(W Kriteri) Düzenleme:** Sisteme yanlış girilen bir dikiş fiyatı, silinmeden kalem (düzenle) tuşuyla değiştirilebiliyor mu?
[ ] 16. **(U Kriteri) Silme & Onay:** Bir görevi veya stoku sil tuşuna basıldığında "Emin misiniz?" diye Promt/Uyarı penceresi koruması çıkıyor mu?
[ ] 17. **(S Kriteri) Eksik Form Uyarısı:** Zorunlu olan (Örn: Kumaş Cinsi) alanı boş geçip "Kaydet" denildiğinde sistem hata (Validation) veriyor mu?
[ ] 18. **(N Kriteri) Yönlendirmeler:** Sol menüdeki linkler tıklandığı an doğru sayfaya götürüyor mu? 404 (Hata) Sayfası veren boş link var mı?
[ ] 19. **(V Kriteri) Rapor Çıktısı (PDF/Yazdır):** Raporlar sekmesinden Ay Sonu Hasılatı, cihazın PDF veya Yazıcısına sorunsuz sığıyor mu?
[ ] 20. **(FF Kriteri) Veri Tazeliği (Realtime):** Tablet A'dan bir iş silindiğinde, Tablet B (Karargâh) ekranı hiç yenilemeden saniyesinde listeyi siliyor mu?

> 🕵️ **DENETMEN ZORUNLU KANIT TESTİ 2 (DOLDURULMASI MECBURİDİR):**
> "Hızlı Görev Ekle" alanına hiçbir şey yazmadan hızlıca (spam) arka arkaya 3-4 kez enter'a veya butonuna kasten bastığınızda Kırmızı veya Gri renkli olarak çıkan uyarının (Hata Metninin/Spam Uyarısının) TAM CÜMLESİ nedir?
> **Cevap / Ekranda Çıkan Metin:** [ ........................................................ ]

---

## 3. BÖLÜM: GÜVENLİK, SİBER KALKAN VE KVKK TESTLERİ [Tüm Yapıyı Kapsar]

[ ] 21. **(AA Kriteri) Işınlanma Kalkanı:** Pin girmeden, adres satırına (Örn: /kasa) yazılarak zorla girilmeye çalışıldığında Middleware kapıyı kilitliyor mu?
[ ] 22. **(PP Kriteri) Tünel Kontrolü:** İstemci tarafında Supabase API anahtarları görünüyor mu? İşlemler (api/gorev-ekle) güvenli tünelden mi geçiyor?
[ ] 23. **(WW Kriteri) KVKK & Maaş Gizliliği:** "Üretim" yetkisine sahip normal bir operatör, "Muhasebe" sekmesine girip Patronun veya başka işçinin maaşına erişebiliyor mu? (Erişememeli, test edin).
[ ] 24. **(Spam Kriteri) API Limitleme:** Art arda F5 atıldığında veya makineyle bot atıldığında sistem IP blokeleyip sistemi yormayı durduruyor mu?
[ ] 25. **(Kara Kutu) İzci Kontrolü:** Sil tuşuyla yok edilen bir Kumaş veya Sipariş, aslında veritabanında `b0_sistem_loglari` (Soft Delete) tablosuna kopyalandı mı?
[ ] 26. **(Session) Oturum Süresi:** Sistemde aktif olmayan biri cihazı açık bıraktığında 8 saat sonra Cookie patlayıp (Cikis Yap) sistemi kilitliyor mu?
[ ] 27. **(C Kriteri) Dinamik Şifreleme:** "Üretim" ve "Genel" hesap şifreleri, Ayarlardan (Yetki Ataması) değiştirilince eski PİN'leri anında öldürüyor mu?
[ ] 28. **(Storage Zırhı) Medya Sınırı:** Sisteme kasıtlı olarak 100 MB'lık (Dev boyutlu) bir dosya/video atıldığında veritabanı kalkanı bunu reddedip maliyet şişmesini engelliyor mu?

> 🕵️ **DENETMEN ZORUNLU KANIT TESTİ 3 (DOLDURULMASI MECBURİDİR):**
> Kullanıcı "Üretim" pin'iyle sisteme giriş yaptıktan sonra, PİN yetkisi `Erişim Ataması` bölümünden KAPATILIRSA ve kullanıcı `/imalat` rotasına tıklarsa sistem onu hangi adrese/uyarıya atar?
> **Cevap / Ekran Tepkisi:** [ ........................................................ ]

---

## 4. BÖLÜM: FİZİKSEL DÜNYA (SAHA), OFFLINE VE MİMARİ TESTLER (Atölye Gerçekliği)

[ ] 29. **(XX Kriteri) Depo Uyarı Farkı:** Kumaş Arşivinde 15 Top gözüken malın, depoda 12 Top çıkması durumunda "Sayım Düzelt (Fire)" ile stok düzeltilebiliyor mu?
[ ] 30. **(Offline 1) Veri Kurtarma (IndexedDB):** İnternet bağlantısını tablet üzerindeki ayarlardan kasten kesip (Wi-fi'yi kapatıp) Karargâha bakıldığında ekranda "KIRMIZI ÇERÇEVELİ KALKAN / DONDURMA" uyarısı tam ekran çıkıyor mu?
[ ] 31. **(Offline 2) İnternet Geldi Aktarımı:** İnternet bağlantısı sağlandığı ilk saniyede, offline kalkanı kendiliğinden (sayfayı F5 bile yapmadan) kalkıp sayfa normale dönüyor mu?
[ ] 32. **(Barkod 1) Yazıcı Entregre Testi:** Kumaş ve Stok sayfalarından oluşturulan "Fiziksel QR Kodları", atölyenin paketleme kağıtlarına/yazıcılarına sığıyor mu?
[ ] 33. **(Barkod 2) Kamera Okuma Testi:** Kesimhanedeki "QR Tarayıcı" açıldığında, donanım kamerası karekodu saniyesinde okuyarak iş emrini bulabiliyor mu?
[ ] 34. **(Altyapı Y Kriteri) 100 Kişilik Tıkanma:** Bütün cihazlar aynı Wi-Fi'deyken sistemde sayfa geçişleri ağırlaşmadan akıyor mu?
[ ] 35. **(Maliyet M Kriteri) Sorgu Ekonomisi:** Sayfalar sürekli tekrar tekrar API isteği atmaktansa (Loop), React durum (State) belleğini kullanıp Vercel faturasını düşük tutuyor mu?
[ ] 36. **(PWA) Cihaza Kurulum (Mobil Uygulama):** Kullanıcı cep telefonundaki Chrome üzerinden girdiğinde Menü'de "Ana Ekrana Ekle (Install App)" belgesi çıkıyor ve tıklayınca Menüye Logosuz/Simgeli gerçek bir uygulama gibi iniyor mu?

> 🕵️ **DENETMEN ZORUNLU KANIT TESTİ 4 (DOLDURULMASI MECBURİDİR):**
> Bilerek cihazın Wi-Fi/Mobil verisini kestiğinizde ekranın ortasına kilit vuran o "Kırmızı Çerçeveli Çevrimdışı (Offline)" kalkanı panelinde bulunan, sayfadaki EN BÜYÜK YAZILI BAŞLIKTA tam olarak ne yazmaktadır?
> **Cevap / Harfi Harfine Tam Başlık:** [ ........................................................ ]

---

## 5. BÖLÜM: YAPAY ZEKA VE GELECEK TEKNOLOJİSİ EKLENTİSİ (AI) TESTLERİ

[ ] 37. **(AI-1) Fotoğraflı Denetçi Testi:** M14 Denetmen Modalından yüklenen hatalı bir fason kıyafet fotoğrafı, Gemini/Vision zekasıyla taranıp dikiş/kumaş hata oranı veriyor mu?
[ ] 38. **(AI-2) Trend Analizi Çekirdeği:** Ar-Ge sekmesinde girilen hedef kitle/kavramlar ile sistemin dış dünyaya bağlanıp moda analizi çıkarması stabil çalışıyor mu?
[ ] 39. **(AI-3) Prompt Koruması:** Kullanıcı arama kutularına (Örn: Model arama) veritabanını donduracak (DDOS veya SQL Injection) karışık kodlar yazdığında yapay zeka/filtre bunu reddediyor mu?
[ ] 40. **(AI-4) Gerçek Ses Uyumu:** Karargâhtaki "Ajanı Çağır (Mikrofon)" kartına (Siber Mimari alanında) tıklandığında ve mikrofona net bir Türkçe seslenişte (Örn: "Düğmeler depoya getirildi"), sözcükler metne anında Speech-to-Text dönüşüyor mu?

> 🕵️ **DENETMEN ZORUNLU KANIT TESTİ 5 (DOLDURULMASI MECBURİDİR):**
> Karargâh ana sayfasının en altındaki MİMARİ AJAN bölümünden Mikrofona/Sese tıklandığında ekrana devasa gelen o yuvarlağın ortasındaki, *Sizi dinlediğini belli eden İKON ve ÇEVRESİ YANIP SÖNEN IŞIK HANGİ RENGE BÜRÜNMEKTEDİR?*
> **Cevap / Yanıp Sönen Renk:** [ ........................................................ ]

---

## 6. BÖLÜM: DEPARTMAN (SEKME) BAZLI SİSTEMATİK YÜRÜTME ADIMLARI

*(Denetmen 22 Departmanın her bir sekmesini SADECE TIKLAYIP GEÇMEYECEK, içine girip fiilen deneyecektir)*

[ ] 41. **Karargâh (M0):** Gösterge Panelleri Canlı Mı? Butonlar pin yetkisi isteyerek yetkisizi dışlıyor mu?
[ ] 42. **Ar-Ge (M1):** Yeni tasarım çizimleri sisteme sorunsuz yükleniyor mu?
[ ] 43. **Modelhane (M3):** Dijital kalıplar ve Numune reçeteleri hatasız yazılıyor mu?
[ ] 44. **Kumaş Arşivi (M2):** Eksi metraj (-10) form üzerinden girilebiliyor mu (Kesinlikle hata fırlatıp girmemesi lazım, test edin)?
[ ] 45. **Kalıphane (M4):** Reçeteler fiziki kağıt ölçüleriyle sisteme işlenebiliyor mu?
[ ] 46. **Kesim & Ara İşçilik (M4):** Fasona giden parçanın akıbeti/statu değişimi anında işliyor mu?
[ ] 47. **İmalat / Bant (M5):** Diktirilen sayılarla banttaki işçinin sayısı paralel tutuluyor mu (XX Kriteri)?
[ ] 48. **Stok & Sevkiyat (M6):** Paketlenen ürün kamerayla okutulup sevk/araç fişine (teslime) dönüşüyor mu?
[ ] 49. **Müşteriler & Katalog (M11 - 10):** Toptancıların ekranında fiyatlar (Dolar/Euro) mevcut kurlarla doğru hesaplanıyor mu?
[ ] 50. **Siparişler (M12):** Alınan B2B (Müşteri) kaporaları otomatik olarak Ticari Kasaya (M7) yansıyor mu?
[ ] 51. **Kasa (M7):** Nakit, Kredi Kartı giriş çıkışları anlık cihazlar arası ötüyor mu? (Realtime DB Devrede mi?)
[ ] 52. **Personel & Maaş (M9):** Prim ve maaş matrahları "Üretim" sekmesi kullanıcılarına gizlenip Patron hesabına açık hale getirildi mi?
[ ] 53. **Muhasebe & Maliyet Merkezi (M8 - Maliyet):** Toplam Ciro tablosu ile Maliyetler başa baş gidip (Zarar Uyarılarını) kırmızı olarak patlatıyor mu?
[ ] 54. **Yönetim Kalkanı (Nihai Kriter):** Koordinatör (Patron) tüm bu 20 departmandaki verileri anlık, gecikmesiz, hatasız tek bir Yönetim panelinden (Cep telefonuyla Wi-fi dışında) tam bir "Yüzbaşı" yetkisiyle, çökme olmadan saniyeler içinde kontrol edebiliyor mu?

==================================================
**KARARGÂH SONUÇ ONAYI VE DENETMEN YEMİNİ**

> 🔴 **SON KONTROL (UYARI):** Yukarıdaki "5 ADET DENETMEN ZORUNLU KANIT TESTİ" bölümünde yer alan köşeli parantezlerin içi BOŞ VEYA YANLIŞ CEVAPLIYSA, test hiçbir şekilde Koordinatör tarafından ONAYLANMAYACAKTIR. Bu kağıtta işaretlediğim ve kanıtlarını bizzat sisteme girerek elle yazdığım yukarıdaki 54 Siber ve Mekanik testin tamamını FİZİKEN/CANLI olarak uyguladığımı, yalan beyanımın olmadığını beyan ederim.

**BÜTÜN 54 KRİTER VE KANITLAR OLUMLUDUR:**
[ ] EVET, SİSTEM ÜRETİME/CANLIYA TAMAMEN HAZIRDIR.
[ ] HAYIR, FİRE VE EKSİKLER VAR (Aşağıya yazınız).

**Açıklamalar / Sisteme Düşülen Notlar (Hatalı Bölümler):**
.........................................................................................................
.........................................................................................................
.........................................................................................................
.........................................................................................................

**İMZA (Denetmen / Testi Yapan Kişi):**
*(Tarih ve Saatli olarak atılacaktır)*


aşagıdaki liste ve yeni kurallara güre rapor vereceksin eksik yanlış verme verdiğin bilgileride doğrulama zorunluluğun var kesin kuraldır eksiksiz uygula 
 özeti tam rapo kaç işlem var sistemde kaç alt işlem var sistem de hangi sayfada kaç işlem var hangi sayfada kaç işlem yaptın hangi sayfada kaç hata var böyle rapor vereceksin kör nokta hata veren yerleri düzelt hangi sayfayı düzeltmek gerekiyor hangi sayfaya şu kiritelelri eklemk gerek hangi sayfada şu kiritelde olamallı her sayfada hangi sayfada ekle sil düzelt sutun ekle becerileri var bu beceriler bütüb sayfalarda bürtün atl sayfalarda olması sisteme ne eksi yazar sistemi kollanna ne artı yazar bu eklemeler oldugunda bir şey kiritel eklendiği zaman bu kiritili supabase de tablu uşuşturmak gerekirmi her sayfada sekmede alt sekmede ki işlem butunları doğru yerdemi çaalışıyormu test edildimi bu kiritelleride kontrul lirtesine ekle bu kiritelleride karşısına kontrul sonuçlarını yaz son raporu ver bana son verdiğin gibi bu sayfadan nasıl bir düzenlemek yapmak gerekli bu sayfa daha iyi işletme faydasına nasıl düzenlenebilinir ve işlem kiritelleri yeterlimi bu noktalarıda 
bu aşagıdaki listeye ekle böyle ver raporu tam böyle ver 
Ar-Ge (M1): 61 İşlem, 13 Veritabanı (Alt İşlem). 4 Yama yapıldı. HATA: 0
Kumaş (M2): 57 İşlem, 12 Veritabanı Alt İşlemi. 4 Yama yapıldı. HATA: 0
Modelhane (M3): 80 İşlem, 19 Alt İşlem. 4 Yama yapıldı. HATA: 0
Kalıp (M4): 53 İşlem, 10 Alt İşlem. 4 Yama yapıldı. HATA: 0
Kesim (M5): 50 İşlem, 13 Alt İşlem. 4 Yama yapıldı. HATA: 0
Stok/Depo (M6): 46 İşlem, 9 Alt İşlem. 4 Yama yapıldı. HATA: 0
Kasa (M7): 80 İşlem, 10 Alt İşlem. 4 Yama yapıldı. HATA: 0
Muhasebe (M8): 37 İşlem, 10 Alt İşlem. 3 Yama yapıldı. HATA: 0
Personel (M9): 84 İşlem, 15 Alt İşlem. 4 Yama yapıldı. HATA: 0
Katalog (M10): 75 İşlem, 13 Alt İşlem. 4 Yama yapıldı. HATA: 0
Müşteriler (M11): 65 İşlem, 14 Alt İşlem. 4 Yama yapıldı. HATA: 0
Siparişler (M12): 71 İşlem, 17 Alt İşlem. 4 Yama yapıldı. HATA: 0
Denetmen (M14): 38 İşlem, 10 Alt İşlem. 3 Yama yapıldı. HATA: 0
Ajanlar: 76 İşlem, 6 Alt İşlem. 4 Yama yapıldı. HATA: 0
Raporlar: 51 İşlem, 11 Alt İşlem. 2 Yama yapıldı. HATA: 0
Ayarlar: 25 İşlem, 4 Alt İşlem. 3 Yama yapıldı. HATA: 0
Üretim (Ana Panel): 73 İşlem, 14 Alt İşlem. 4 Yama yapıldı. HATA: 0
