# 47 SİL BAŞTAN: Kapsamlı Sistem & Sahada Kullanım Denetim Raporu (M1 - M7)

Bu rapor, yeni `47_SIL_BASTAN_01` sistemine göç edilirken yapılan hataları, tamamen silinen modülleri ve sahadaki operatörün (Kesimhane & Üretim Bandı) hızını kesen tasarım/mantık hatalarını içermektedir.

---

## 🚨 1. BÜYÜK KAYIP: SİLİNEN VE YOK EDİLEN MODÜLLER

Eski `Kamera-Panel` sisteminde yer alan ve sahanın bel kemiği olan **sayfalar ve yapılandırmalar yeni M1-M16 panel sistemine geçerken tamamen silinmiş ve kodları aktarılmamıştır.**

* ❌ **Mağaza (`MagazaPage.jsx`)** - Yok edildi!
* ❌ **Kalite Kontrol (`QualityPage.jsx`)** - Yok edildi!
* ❌ **Prim (`PrimPage.jsx`)** - Yok edildi!
* ❌ **Makine Takip (`MachinesPage.jsx`)** - Yok edildi!
* ❌ **İmalat, Üretim ve Diğer Departman Menüleri** - Kullanıcıyı yönlendiren eski ağaç yapısı, düz bir log/liste mantığına kurban edilmiş.

---

## 🧵 2. M2, M3 ve M4 - KUMAŞ, KALIP VE MODELHANE (Ön Hazırlık Modülleri)

### M2 - Kumaş Arşivi

* **Tema Uyumsuzluğu:** Genel olarak Zümrüt Yeşili (Emerald) hakim olsa da, "M3'e Geç" butonu **Saks Mavisi** renginde. Bu renk "Emerald & Gold" temasına uymuyor ve dikkat dağıtıyor.
* **Kullanılabilirlik:** Form yapısı sade fakat manuel veri girişine dayalı. Depoda (kumaş topu taşırken) kullanılacak barkod/QR entegrasyonu yok.

### M3 - Kalıp & Serileme

* **Tema ve İşlev (En Başarılı Modül):** "Yeni Model" butonu Gold (Altın), geçiş butonları Zümrüt Yeşili. Premium marka diline tam uyumlu. AR-GE (M1) ile bağlantılı çalışması ve süreç mantığı (Taslak -> Kalıp -> Seri) operatör dostu.

### M4 - Modelhane (Video Kilidi)

* **Kritik Tema İhlali:** "Yeni Numune" ve "Numune Kayıtları" butonları tamamen **KIRMIZI** renkte. Sistemin ağırbaşlı havasını bozup "Uyar/Hata" algısı yaratıyor.
* **Gereksiz Liste Karmaşası:** Formlardaki seçim kutuları (Dropdown) çok kalabalık. Arama (Search) özelliği olmayan uzun liste kutuları (Model Seçiniz vb.) numune diken ustanın işini yavaşlatıyor.

---

## 🏭 2. M5 - KESİMHANE & ARA İŞÇİLİK MODÜLÜ (Eksikler ve Hatalar)

### Tasarım & Tema Uyumsuzluğu

* **Ağır Abiye Pembe Kravat:** Ana tema olan Premium "Emerald & Gold" (Zümrüt ve Altın) konseptinin tam ortasında, devasa **Macenta/Açık Pembe** ve **Saks Mavisi** ("Yeni Kesim", "M6'ya Geç") butonlar kullanılmış. Bu, kurumsal algıyı bozmaktadır.
* **Mobil Uyum Çöküşü:** Yan menü dar ekranlı tabletlerde veya telefonlarda kendini gizlemiyor (Collapse olmuyor), bu da kesimhane form verilerinin ekranda sıkışıp kalmasına yol açıyor.

### Operasyonel Hamallık & Mantık Hataları

* **QR / Barkod Eksikliği (Çok Kritik):** Modelhane'den gelen işin QR kodunu kameraya veya cihaza okutmak yerine, kesimci listeden modeli **elle bulmakta**, adeti **elle yazmaktadır**.
* **Sistemin Matematiği İşçiye Yıkması:** Operatör "Pastal Kat Sayısı" (örn:200) ve "Net Çıkan Adet" (örn: 195) bilgisini girmesine rağmen, sistem arka planda **Fire Oranı'nı (%) otomatik hesaplamıyor**. Operatörün hesap yapıp elle yazması bekleniyor.

---

## ⚙️ 3. M6 - ÜRETİM BANDI MODÜLÜ (Eksikler ve Hatalar)

### Terminoloji ve Dil (Bilimkurgu / Askeri Jargon)

* Üretim bandındaki şefin veya ustanın anlayacağı dil yerine, sistemi kafa karıştırıcı kavramlara boğmuşlar:
  * ❌ **"Liyakat Hakemi"** (Bant Kuralları yerine)
  * ❌ **"D-E Karargâh Devir"** (Depoya/Mağazaya Teslim veya İşi Bitir yerine)
  * ❌ **"D-F Yapay Göz Radarı"** (Canlı Pano/İzleme yerine)
* **Pratik Olmayan Sekmeler:** Sadece M6 ekranı kendi içinde A'dan F'ye 6 ayrı sekmeye bölünmüş. Ayakta elinde tabletle bant gezen bir şef 6 sayfa arasında şerit değiştiremez.

### Operasyonel Hamallık

* **Kayıp Entegrasyon:** Kesimden (M5'ten) çıkan bir işin, Üretim Bandına (M6'ya) geçerken barkodla "Bana şu parti mal geldi, banta aldım" denmesi gerekir. Fakat sistem yine **"Modelleri Seç, Kaç Adet Geldiğini Elle Yaz, Takvimden Tarih Seç"** gibi tamamen manuel "evrak memurluğu" yaptırıyor.

---

## 💰 4. M7 - MALİYET MERKEZİ (Eksikler ve Hatalar)

### Görsel Karmaşa & Tema Yozlaşması

* ❌ **Emerald & Gold Yok:** Bu sayfada ana temanın zümrüt yeşili ve altını tamamen kaybolmuş. Modül genelinde **Turkuaz, Macenta ve Standart Mavi** tonları kullanılmış. "Maliyet Ekle" butonu turkuaz renginde; bu da kurumsal ağırlığı zedeliyor.
* **Özet Kartlar (Renkli Çorba):** Hammadde, İşçilik, Fire gibi üst bilgi kartlarının her biri başka bir pastel renge boyanmış, ciddiyetten uzaklaşmış.

### Terminoloji ve İşçi Deneyimi

* ❌ **Gereksiz Jargon:** Sayfa modül başlığında "SAP/NetSuite Standardı" yazıyor. Sahadaki operatöre ve muhasebeye yönelik olmayan bu tarz pazarlama sloganları yazılım içinde yeri olmayan ifadelerdir.
* ❌ **"Kalem Açıklaması" Hamallığı:** "Örn: Gömleklik poplin kumaş — 45m x 85 TL/m" şeklinde detaylı metin isteniyor. Zaten "Miktar" ve "Birim Fiyat" kutuları var. Operatörün bir de buraya destan yazmasını beklemek gereksiz manuel veri girişidir.

### Neler İyi Çalışıyor?

* ✅ **Flaş Hesaplama:** Miktar ve Birim Fiyat girildiğinde anında **Toplu Tutarı** hesaplayıp "OTOMATİK" etiketi basması başarılı.
* ✅ **Kâr Marjı Sihirbazı:** Satış Fiyatı sekmesine geçilince %15, %30, %50 kâr butonlarının maliyeti anında hesaplayıp satış fiyatı teklifi sunması finans birimi için çok pratik olmuş.
* **Büyük Eksik:** Ancak M5 ve M6'da kesilen, üretilen adetlerin buraya **"net sayı"** olarak otomize yansımaması, kesik bir veri akışına yol açıyor.

---

## 🔒 5. M8 - MUHASEBE & FİNAL RAPOR (Eksikler ve Hatalar)

### Tema İhlali (Mor İstilası)

* ❌ "Zümrüt Yeşili (Emerald) ve Altın (Gold)" olan premium temamız M8'de bozulmuş. Sayfanın en kritik butonu olan **"Karargâha (Merkeze) Dön"** butonu ve modül ikonu **Mor/Menekşe (Purple)** renginde. Bu renk sistemin kurumsal ağırlığına hiç yakışmıyor.

### Terminoloji ve Anlaşılabilirlik

* ❌ **Askeri Jargon:** "2. Birime Geçiş Kapısı" (Mağazaya Sevkiyat demek yerine) ve "Koordinatör Kararı" gibi abartılı isimler sahada kafa karıştırır.
* ❌ **Karargâh Saplantısı:** Sistemin her yerine gereksiz yere Karargâh yazılması muhasebe disiplinini zedeliyor.

### Kırık Veri Yolu (Hamallık Döngüsü)

* **Kopuk Hat:** M6 (Üretim Bandı) modülünden bir işi "Devret" dediğimiz halde, M8 ekranına düşmüyor. M8 ekranı inatla **"Final rapor yok. M6'dan devir başlatın"** uyarısı veriyor. Modüller arası bağlantı hatası var.

---

## 🛍️ 6. M9 - ÜRÜN KATALOĞU (Mağaza ve Satış Modülü)

### Tema ve Renk İhlali (Ucuz Görünüm)

* ❌ **Pembe Panter Butonlar:** Sayfanın en kritik butonu olan "+ Yeni Ürün" ve ürün onay butonları resmen **Parlak Pembe/Fuşya** renginde. Bu renk sistemin kurumsal algısını yerle bir ediyor.
* ❌ **Mavi Karmaşası:** "Siparişler (M10)" geçiş butonu **Saks Mavisi**, QR modalındaki "ŞİMDİ YAZDIR" butonu ise standart lacivert. Emerald (Yeşil) ve Gold (Altın) dışına çıkılarak sisteme "ucuz bir e-ticaret sitesi" havası verilmiş.

### Kritik Donanım ve Fonksiyon Eksiklikleri

* ❌ **Fotoğrafsız Katalog:** Yeni ürün eklerken **Ürün Fotoğrafı yükleyecek bir alan (Upload) yok**. Görseli olmayan bir katalog, perakende mağazası ve e-ticaret için işlemez bir yapıdır.
* ❌ **Soyutlanmış Sistem:** Ürün girişi maliyet merkezinden kopuk. Maliyeti (M7) veya banttan (M6) çıkan ürünü direk buraya (M9) bağlayan bir otomatik köprü yok.
* ❌ **Kavramsal Ciddiyetsizlik:** Fiyatları Göster/Gizle butonu üzerinde "sus işareti yapan emoji (🤫)" kullanılmış. Bu tür ikonlar premium UX standartlarına uymamaktadır.

---

## 📦 7. M10 - SİPARİŞLER (Satış ve Takip Modülü)

### Tema İhlali (Turuncu İstilası)

* ❌ **Zümrüt ve Altın Nerede?** Sayfadaki ana butonların ("Tüm Kanallar", "Siparişi Kaydet") tümü **Turuncu (#f97316)** renginde. Bu renk sistemin lüks (Zümrüt/Altın) temasını tamamen bozup, modüle bir "yemek siparişi uygulaması" havası vermiş.
* ❌ **Mavi ve Renkli Etiketler:** Stoklar butonu mavi, durum etiketleri ise kırmızı/fosforlu olarak kurgulanmış. Kurumsal renk paleti disiplini yok sayılmış.

### Form ve Entegrasyon Eksikleri (Hamallık Döngüsü)

* ❌ **Katalog (M9) ile Canlı Bağ Yok:** Ürün seçimi yapılan "Dropdown" (Açılır liste) tamamen manuel metinlerle (Test-01 vb.) dolu. Katalogda (M9) olan ve resmi yüklenen (yüklenmesi gereken) bir ürünü, stok koduyla aratıp (Search edip) hızlıca form içine çeken bir modül yok.
* ❌ **Fiyat ve Beden Elle Giriliyor:** Ürün seçilse bile fiyatın (`₺100` gibi) forma otomatik düşmesi yerine operatörün bu rakamları kutulara tek tek (Beden, Fiyat, Adet) girmesi bekleniyor. Bu büyük bir veri giriş hamallığıdır.

### Sipariş Kartı Yetersizliği (Üretime Veri Aktarımı)

* ❌ **4-5 Sığ Kriterle Üretim Emri Verilemez:** Şu anki sipariş formunda sadece "Ürün, Beden, Adet, Not ve Kanal" var. Özel bir tekstil / toptan üretim siparişi alırken; **Kumaş/Renk detayları, Nakış/Baskı veya Etiket tercihleri, Özel Ölçü/Dikim istekleri, Numune onay gereksinimi ve Kesin Termin (Teslimat) Tarihi** gibi hayati bilgiler için hiçbir veri giriş alanı yok. Bu cılız sipariş kartıyla imalata (M3-M5) iş emri gönderilmez, gönderilse de hatalı üretilir.

### Hatalı Diksiyon ve Emojiler

* ❌ **Emojiler:** "🚨 ACİL", "🔥 8 SAAT GECİKTİ!", "⏳" gibi çok sayıda emoji yoğun olarak kullanılmış. Bu durum arayüzü kalabalıklaştırıyor ve kurumsal/profesyonel ERP havasını çocukça bir düzeye çekiyor.
* ❌ **Türkçe Karakter Uyumsuzluğu:** Menülerde "Mağaza" yerine "Magaza", "Diğer" yerine "Diger" yazımları mevcut.

---

## 🏭 8. M11 - STOK & SEVKİYAT (Depo Yönetimi)

### Konum ve Hız (Hamallık) Eğrisi

* ❌ **Konum Takibi Yok:** Ürünler depoya giriyor ancak "Hangi raf, hangi koridor?" bilgisini girebilecek bir alan yok. Konum bilgisi olmayan bir depo, kör bir depodur.
* ❌ **Barkod/QR Destek Çökmüş:** Depocunun el terminalleriyle okutacağı barkod girişi pas çalışmıyor. Ürün yine manuel listeden seçiliyor.
* ❌ **Birim Belirsizliği:** Stok girerken formda Metre mi, KG mı yoksa Adet mi seçileceği belli değil. "500" yazılıyor ama 500 ne?

### Tema İhlali

* ❌ **Mavi Butonlar:** "Yeni Hareket" ve "Depoya Mühürle" butonları, premium tema yerine **Saks Mavisi/Mor** renginde. Ciddiyet bozulmuş.

---

## 🏦 9. M12 - KASA & TAHSİLAT (Finans Modülü)

### Çökmüş Finans Fonksiyonları

* ❌ **Döviz Desteği Yok:** Sadece TL (₺) seçeneği var. Global veya kumaş/iplik ticareti yapan bir atölye USD/EUR desteği olmadan finans yönetemez.
* ❌ **KDV (Vergi) Parçalanması Yok:** Sadece düz "Tutar" giriliyor. İşlemin KDV'si (%10, %20) hesaplanmadığı için muhasebe tarafına ham, hatalı bir rakam gidiyor.
* ❌ **Kasa/Banka Seçimi Yok:** Paranın nakit kasaya mı yoksa banka hesabına mı (Hangi banka?) girdiği seçilemiyor. Her şey tek bir havuza dökülüyor.

### Ciddiyet Kaybı

* ❌ **Emojilerle Finans:** Sayfa içindeki butonlarda (💰, 📊, ✅) bolca emoji yer alıyor. Muhasebe ve finansın en ciddiyet gerektiren yerinde bu tür simgeler ERP yapısına yakışmıyor.

---

## 🤝 10. M13 - MÜŞTERİ CRM

* ❌ **Tematik Hata:** Butonlar İndigo (Mor) renginde. "Zümrüt/Altın" ciddiyeti kalmamış.
* ❌ **Eksik Veri (Sığlık):** Forma sadece "İsim ve Açıklama" zorunlu tutulmuş. Vergi No, Adres, Telefon, Risk Limiti gibi bir müşteriyi tanımlayan en hayati 10 bilgi formu yok.

## 👥 11. M14 - PERSONEL & PRİM

* ❌ **Eksik Veri (Hamallık):** Personel kartında Prim Çarpanı, Vardiya Tipi, IBAN, Kan Grubu gibi üretim asgari gereksinimleri boşaltılmış.
* ❌ **Absürt Terminoloji:** Formda "Görev Puanı (AI)" gibi, usta veya işçinin asla anlamayacağı stajyer işi terimler var. Ayrıca ünvanlara konan çocuksu emojiler ciddiyeti sarsıyor.

## 📋 12. M15 - GÖREV TAKİBİ

* ❌ **Tema İhlali:** Modül yine tamamen Eflatun/Mor bir atmosfere terk edilmiş.
* ❌ **Manuel İsim (Hamallık):** Görev ata formunda, personeli kendi M14 listesinden Dropdown (seçim) olarak çekmiyor. Operatör adamın adını "Elle Yazmak" zorunda. Tam bir amatör UX hatası.

## 📊 13. M16 - FİNAL RAPORLAR

* ❌ **Veri Skandalı (Simge Hatası):** Ciro yazan yerde Dolar ($) simgesi var, diğer yerlerde TL var.
* ❌ **Tasarım Mantığı:** "Ana Karargâha Dön" (Geçiş) butonu KIRMIZI renkte. Kırmızı renk eylem iptali veya hata mesajıdır, eve/merkeze dönüş butonu olamaz.

---

## 🎯 SONUÇ, ÖNERİLER VE İNFAZ KARARI (Tam Sistem: M1-M16)

1. **Yok Edilen Modüller Geri Getirilmeli:** Mağaza, Kalite Kontrol, Prim yönetimi modülleri panel sistemine acil entegre edilmeli.
2. **Jargon Temizliği:** "Karargâh Devir", "Liyakat Hakemi", "Yapay Göz Radarı" ve "SAP Standardı" gibi havalı ancak sahada kafa karıştıran kelimeler gerçek üretim diline çevrilmeli.
3. **QR Devrimi Başlamalı:** M5 kesim, M6 bant işlemi ve kayıt geçişleri sadece tablet kamerasından QR okutma hızına çevrilmeli; elle yazma hamallığı bitirilmeli.
4. **Tematik Renk Disiplini:** Sadece Sol Menü değil, ekranın ortasındaki tüm ana butonlar (Maliyet Ekle, Kesimi Başlat) Emerald (Zümrüt) ve Gold (Altın) renklerine sabitlenmeli. Pembe, Turkuaz ve Mavi butonlar silinmeli.
