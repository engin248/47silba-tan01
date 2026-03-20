# 🛡️ 47 NİZAM: 51 KRİTER MERKEZLİ SİSTEM TAM TEST VE KABUL RAPORU

**Test Tarihi:** ..../..../2026
**Testi Uygulayan / Denetmen:** ......................................
**Saha Platformu:** [ ] Tablet  [ ] Telefon  [ ] Bilgisayar
**İnternet Durumu:** [ ] Wi-Fi  [ ] Mobil Veri  [ ] Çevrimdışı (Kesilip test edildi)

> **TALİMAT:** Aşağıdaki liste, sistemde bulunan Yirmi İki (22) modülün her biri (ve alt sekmeleri) için istisnasız 51 teknik, görsel, hukuksal ve saha kriterine göre test edilmesini emreder. Testi yapan kişi işlemi fiziken yapıp karşısına (✅ Geçti) veya (❌ Kaldı) yazacaktır.

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

---

## 2. BÖLÜM: FONKSİYON, HIZ VE "ÇÖKERTME" TESTLERİ [Her Sekmedeki Buton, Form ve Veriler İçin]

[ ] 11. **(R Kriteri) Veri Ekleme:** Kumaş, Görev veya Model kaydı yapıldığında veritabanına sorunsuz yazılıyor mu? (Supabase kontrolü).
[ ] 12. **(X Kriteri) Negatif Kalkanı:** Miktar, Kilo, Tutar veya Fiyat alanlarına (-50) gibi eksi rakamlar yazıldığında sistem reddediyor mu?
[ ] 13. **(JJ Kriteri) Çift Tıklama (Race Condition):** "Ekle" tuşuna aynı anda/hızla 3 kez basınca sadece 1 kayıt mı açıyor yoksa mükerrer kayıt mı giriyor?
[ ] 14. **(DD Kriteri) Telegram Telgrafı:** Kasa'dan, Siparişten vb. yüksek meblağlı bir tuşa basıldığında anında Patronun Telegramına Alarm Düşüyor mu?
[ ] 15. **(W Kriteri) Düzenleme:** Sisteme yanlış girilen bir dikiş fiyatı, silinmeden kalem (düzenle) tuşuyla değiştirilebiliyor mu?
[ ] 16. **(U Kriteri) Silme & Onay:** Bir görevi veya stoku sil tuşuna basıldığında "Emin misiniz?" diye Promt/Uyarı penceresi koruması çıkıyor mu?
[ ] 17. **(S Kriteri) Eksik Form Uyarısı:** Zorunlu olan (Örn: Kumaş Cinsi) alanı boş geçip "Kaydet" denildiğinde sistem hata (Validation) veriyor mu?
[ ] 18. **(N Kriteri) Yönlendirmeler:** Sol menüdeki tıklandığı an doğru sayfaya götürüyor mu? 404 (Hata) Sayfası veren boş link var mı?
[ ] 19. **(V Kriteri) Rapor Çıktısı (PDF/Yazdır):** Raporlar sekmesinden Ay Sonu Hasılatı, cihazın PDF veya Yazıcısına sorunsuz sığıyor mu?
[ ] 20. **(FF Kriteri) Veri Tazeliği (Realtime):** Tablet A'dan bir iş silindiğinde, Tablet B (Karargâh) ekranı hiç yenilemeden saniyesinde listeyi siliyor mu?

---

## 3. BÖLÜM: GÜVENLİK, SİBER KALKAN VE KVKK TESTLERİ [Tüm Yapıyı Kapsar]

[ ] 21. **(AA Kriteri) Işınlanma Kalkanı:** Pin girmeden, adres satırına (Örn: /kasa) yazılarak zorla girilmeye çalışıldığında Middleware kapıyı kilitliyor mu?
[ ] 22. **(PP Kriteri) Tünel Kontrolü:** İstemci tarafında Supabase API anahtarları görünüyor mu? İşlemler (api/gorev-ekle) güvenli klasörden geçiyor mu?
[ ] 23. **(WW Kriteri) KVKK & Maaş Gizliliği:** "Üretim" yetkisine sahip normal bir operatör, "Muhasebe" sekmesine girip Patronun veya başka işçinin maaşına erişebiliyor mu? (Erişememeli).
[ ] 24. **(Spam Kriteri) API Limitleme:** Art arda F5 atıldığında veya makineyle bot atıldığında sistem IP blokeleyip (b0_api_spam_kalkani) sistemi yormayı durduruyor mu?
[ ] 25. **(Kara Kutu) İzci Kontrolü:** Sil tuşuyla yok edilen bir Kumaş veya Sipariş, aslında veritabanında `b0_sistem_loglari` (Soft Delete) tablosuna kopyalandı mı?
[ ] 26. **(Session) Oturum Süresi:** Sistemde aktif olmayan biri cihazı açık bıraktığında 8 saat sonra Cookie patlayıp (Cikis Yap) sistemi kilitliyor mu?
[ ] 27. **(C Kriteri) Dinamik Şifreleme:** "Üretim" ve "Genel" hesap şifreleri, Patronaj (Koordinatör) tarafından ayarlardan (PİN panelinden) değiştirilince eski PİN'leri anında öldürüyor mu?

---

## 4. BÖLÜM: FİZİKSEL DÜNYA (SAHA), OFFLINE VE MİMARİ TESTLER (Atölye Gerçekliği)

[ ] 28. **(XX Kriteri) Depo Uyarı Farkı:** Kumaş Arşivinde 15 Top gözüken malın, depoda 12 Top çıkması durumunda "Sayım Düzelt (Fire)" ile stok düzeltilebiliyor mu?
[ ] 29. **(Offline 1) Veri Kurtarma (IndexedDB):** İnternet/Şalter kasti olarak kesilip "Yeni Görev" eklendiğinde, sistem o veriyi cihazda kuyruğa aldı mı? (Kırmızı offline uyarısı çıktı mı?)
[ ] 30. **(Offline 2) İnternet Geldi Aktarımı:** İnternet bağlantısı sağlandığı ilk saniyede, kuyrukta bekleyen veriler ana sunucuya sessizce yazıldı mı?
[ ] 31. **(Barkod 1) Yazıcı Entregre Testi:** Kumaş ve Stok sayfalarından oluşturulan "Fiziksel QR Kodları", atölyenin paketleme kağıtlarına/yazıcılarına sığıyor mu?
[ ] 32. **(Barkod 2) Kamera Okuma Testi:** Kesimhanedeki "QR Tarayıcı" açıldığında, donanım kamerası karekodu saniyesinde (Lazer hızıyla) okuyarak iş emrini bulabiliyor mu?
[ ] 33. **(Altyapı Y Kriteri) 100 Kişilik Tıkanma:** Bütün cihazlar aynı Wi-Fi'deyken sistemde sayfa geçişleri ağırlaşmadan (Vercel Cache sayesinde) akıyor mu?
[ ] 34. **(Maliyet M Kriteri) Sorgu Ekonomisi:** Sayfalar sürekli tekrar tekrar API isteği atmaktansa (Loop), React durum (State) belleğini kullanıp Vercel faturasını düşük tutuyor mu?

---

## 5. BÖLÜM: YAPAY ZEKA VE GELECEK TEKNOLOJİSİ EKLENTİSİ (AI) TESTLERİ

[ ] 35. **(AI-1) Fotoğraflı Denetçi Testi:** M14 Denetmen Modalından yüklenen hatalı bir fason kıyafet fotoğrafı, Gemini/Vision zekasıyla taranıp dikiş/kumaş hata oranı veriyor mu?
[ ] 36. **(AI-2) Trend Analizi Çekirdeği:** Ar-Ge sekmesinde girilen hedef kitle/kavramlar ile sistemin dış dünyaya bağlanıp moda analizi çıkarması stabil çalışıyor mu?
[ ] 37. **(AI-3) Prompt Koruması:** Kullanıcı arama kutularına (Örn: Model arama) veritabanını donduracak (DDOS veya SQL Injection) karışık kodlar yazdığında yapay zeka/filtre bunu reddediyor mu?

---

## 6. BÖLÜM: BÖLÜM (SEKME) BAZLI SİSTEMATİK YÜRÜTME ADIMLARI

*(Denetmen 22 Departmanın her bir sekmesini taratırken aşağıdakilere "Tamam" diyecektir)*

[ ] 38. **Karargâh (M0):** Gösterge Panelleri Canlı Mı? Butonlar yetkisizi dışlıyor mu?
[ ] 39. **Ar-Ge (M1):** Yeni tasarım çizimleri sisteme yükleniyor mu?
[ ] 40. **Modelhane (M3):** Dijital kalıplar ve Numune reçeteleri hatasız yazılıyor mu?
[ ] 41. **Kumaş Arşivi (M2):** Eksi metraj girilebiliyor mu (Girmemeli)? QR çıkıyor mu?
[ ] 42. **Kaliphane (M4):** Reçeteler fiziki kağıt ölçüleriyle sisteme işlenebiliyor mu?
[ ] 43. **Kesim & Ara İşçilik (M4):** Fasona giden parçanın akıbeti/statu değişimi anında işliyor mu?
[ ] 44. **İmalat / Bant (M5):** Diktirilen sayılarla banttaki işçinin sayısı paralel tutuluyor mu (XX Kriteri)?
[ ] 45. **Stok & Sevkiyat (M6):** Paketlenen ürün kamerayla fırlatılıp araç fişine dönüşüyor mu?
[ ] 46. **Müşteriler & Katalog (M11 - 10):** Toptancıların (Rusya vs) ekranında fiyatlar (Dolar/Euro) doğru hesaplanıyor mu?
[ ] 47. **Siparişler (M12):** Alınan B2B kaporaları otomatik olarak Ticari Kasaya işleniyor mu?
[ ] 48. **Kasa (M7):** Nakit, Kredi Kartı giriş çıkışları anlık Telegramda ötüyor mu? (Zırh Devrede mi?)
[ ] 49. **Personel & Maaş (M9):** Prim ve maaş matrahları yetkisiz gözlerden (Maaş gizliliği) gizlendi mi?
[ ] 50. **Muhasebe & Maliyet Merkezi (M8 - Maliyet):** Toplam Ciro ile Maliyet başa baş gidip Zarar Uyarılarını patlatıyor mu?
[ ] 51. **Yönetim Kalkanı:** Koordinatör (Patron) tüm bu 20 departmandaki verileri anlık, gecikmesiz, hatasız tek bir Yönetim panelinden (Mobil cebinden) tam bir "Yüzbaşı" yetkisiyle kontrol edebiliyor mu?

==================================================
**KARARGÂH SONUÇ ONAYI**
BÜTÜN 51 KRİTER OLUMLUDUR: [ ] EVET    [ ] HAYIR

Açıklamalar / Sisteme Düşülen Notlar:
.........................................................................................................
.........................................................................................................
.........................................................................................................
**İMZA:**
