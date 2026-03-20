# 🛡️ DANIŞMA VE İSTİŞARE EMRİ (BÖLÜM 3): 1. BİRİM'İN (ÜRETİM) DERİN VERİ VE KRİTER ANALİZİ

**Görevli Ajan:** GEMİNİ (Sistem Mimarı)
**Uyarı Tipi:** KIRMIZ KOD (Askeri Disiplin İhlali Düzeltimi)

Koordinatörümüz Engin Bey, mimari ekibe (bana) çok net bir fırça kaydı. "Arayüz (buton/sekme) boyamayı bırak! Önce 1. Birim (Üretim/Dikim) yapısının içindeki 5 alt departmanın (Model, Personel, Operasyon, Maliyet, Rapor/Muhasebe) KRİTERLERİNİ, SEÇENEKLERİNİ ve BİRBİRLERİNE NASIL VERİ GÖNDERECEKLERİNİ belirle! Altyapıyı ve iş planını hazırlamadan çivi çakma!" dedi.

Bu emre istinaden, senden Tıpkı bir Veritabanı ve İş Analisti gibi, aşağıdaki 5 Alt Bölüm için **HANGİ KRİTERLERİN OLACAĞINI, HANGİ SEÇENEKLERİN AÇILACAĞINI VE BU BÖLÜMLERİN BİRBİRİYLE NASIL HABERLEŞECEĞİNİ** (Veri akışını) en ince detayına kadar çıkarmanı istiyoruz.

---

## ⚙️ 1. BİRİM (ÜRETİM) ALT DEPARTMANLARININ İŞ AKIŞI VE DİJİTAL SİNİR SİSTEMİ

### DEPARTMAN A: Üretim/İş Emri (Model ve Parti Verileri)

- Model geldi, parti açıldı.
- **İstenen Kriterler:** Model Kodu, Kesimden gelen net adet, Kumaş türüne göre esneme payı, Toplam Tahmini Dikim Süresi.
- **Seçenekler:** Zorluk dereceleri (1-10).
- **Haberleşme:** Bu departman, "Personel Eşleştirme" departmanına "Bana zorluğu 8 olan, 4 dakika sürecek bir usta bul" emrini gönderir.

### DEPARTMAN B: Personel ve Makine Eşleştirme

- İşin zorluğuna göre usta ve makine ataması. Liyakat burada devreye girer.
- **İstenen Kriterler:** İşçinin FPY (Hatası) oranı, Uzmanlık alanı (Düz makine mi, Overlok mu?), Makinenin şimdiki durumu (Boş/Dolu).
- **Seçenekler:** Acemi, Orta, Kıdemli eşleştirme bariyeri. (Hata yapmaması için kilitler).
- **Haberleşme:** Usta atandığı an "Operasyon" departmanındaki ustanın ekranındaki "Başla" kronometresinin kilidini kaldırır.

### DEPARTMAN C: Operasyon ve Vicdan (Bant Merkezi)

- Modelin her bir işinin dikilmesi. İlk işlemden son işleme kadar sıralama.
- **İstenen Kriterler:** Kronometrenin tıkırtısı. Sistemsel arızalar (Duruşlar). Video/Kanıt onayı.
- **Seçenekler:** Duruş Tipi Seçenekleri (İplik koptu, Elektrik gitti, Tuvalet molası).
- **Haberleşme:** İş her bittiğinde hem "Personel (Akatça/Prim)" departmanına TL olarak parayı aktarır, hem de harcanan ek saniyeleri "Maliyet" departmanına fatura eder.

### DEPARTMAN D: Maliyet Merkezi (Personel ve İşletme Giderleri)

- Sadece O partinin, o ürünün, oradaki ustanın maliyeti.
- **İstenen Kriterler:**
  - *Personel Gideri:* Ustanın harcadığı dakikanın onun liyakat oranına göre TL karşılığı (Hak ediş).
  - *İşletme Gideri:* Elektrik payı, Kira payı, Yemek payı (örneğin o model 2 gün bantta kaldıysa 2 günlük dükkan giderinin o modele yansıması).
  - *Sarf Gideri:* Kullanılan iplik, makine yağı, elektrik faturası yüzdesi.
- **Seçenekler:** Gider tipi (Direkt, Endirekt), Vicdan Tipi (Örn: Elektrik kesildiyse ustanın parasından kesme, ama dükkan giderine zararı yaz).
- **Haberleşme:** Bu üç veriyi toplayıp net "BİRİM MALİYETİ" olarak Muhasebeye şifreli yollar.

### DEPARTMAN E: Muhasebe, Analiz ve Rapor (Gise/Vezne)

- Birinci birimin FİNAL DOSYASI. Üretim tamamen bitti.
- **İstenen Kriterler:** Hedeflenen Maliyet vs. Gerçekleşen Maliyet. Toplam Zayiat (Fire/Çürük Mal) sayısı. Net Birim Çalışma Faturası.
- **Seçenekler:** Rapor Kilitleme. Şef Onayı.
- **Haberleşme:** Bu departman, "1. Birimin Çıkış Kapısıdır". Buradan çıkan "Net Hatasız Dosya ve Mal", 2. Birime (Mağaza ve %51/%49 Kasa) devredilir.

---

## 🎯 GEMİNİ'DEN BEKLENEN CEPHE RAPORU (MD FORMATINDA)

Lütfen arayüz/kod DÜŞÜNMEDEN, yukarıdaki 5 departmanın "Hangi Veritabanı Alanlarına (Sütun/Kriter)", "Hangi Seçenek Kutularına (Dropdownlar)" ve "Aralarında Hangi Şartlı Veri Akışlarına (Şu olursa buna gider kurallarına)" sahip olması gerektiğini analiz et. Engin Koordinatör'ün 15 günlük uykusuzluğunu giderecek, sistemin altyapısındaki kör delikleri tıkayacak Kusursuz bir "Birim 1 İskelet Mimarisi" çıkart. Emre itaat et.
