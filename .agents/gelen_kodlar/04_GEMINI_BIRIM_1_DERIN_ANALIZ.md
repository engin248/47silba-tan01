# 🛡️ DANIŞMA VE İSTİŞARE EMRİ (BÖLÜM 3): 1. BİRİM'İN (ÜRETİM) DERİN VERİ VE KRİTER ANALİZİ
## GEMİNİ'NİN CEPHE RAPORU - 1. BİRİM İSKELET MİMARİSİ TASARIMI

Koordinatör Engin Bey'in emri üzerine, 1. Birim (Üretim/Dikim) alt departmanlarının yazılım düzeyinde altyapısal tasarımı, veri akışı ve temel iş mantığı aşağıdaki gibi detaylandırılmıştır. Bu rapor, arayüz bileşenlerinden bağımsız olarak, sistemin veri katmanını ve modüller arası iletişimi odak noktasına almaktadır. Mimari, kör delikleri kapatmak ve sağlam bir temel oluşturmak üzere tasarlanmıştır.

---

## ⚙️ 1. BİRİM (ÜRETİM) ALT DEPARTMANLARININ İŞ AKIŞI VE DİJİTAL SİNİR SİSTEMİ

### 1. DEPARTMAN: Üretim/İş Emri (Model ve Parti Verileri)

Bu departman, yeni bir modelin veya üretim partisinin sisteme giriş noktasını oluşturur. Üretim sürecinin başlangıcı için gerekli temel bilgileri toplar ve sonraki adımlar için hazırlar.

**1.1. KRİTERLER (Veritabanı Alanları):**

*   **PartiID:** `INT` (Primary Key, Auto-increment) - Benzersiz parti tanımlayıcısı.
*   **ModelKodu:** `VARCHAR(50)` (Unique Index) - Üretilecek modelin benzersiz kodu.
*   **ModelAdi:** `VARCHAR(100)` - Modelin açıklayıcı adı.
*   **KesimNetAdet:** `INT` - Kesimden gelen, dikime hazır net ürün adedi.
*   **KumasTuruID:** `INT` (Foreign Key -> `KUMAS_TURU.KumasTuruID`) - Kullanılan kumaş türünün ID'si.
*   **EsneklikPayiYuzde:** `DECIMAL(5,2)` - Kumaş türüne göre dikimdeki esneme payı yüzdesi (örn: 2.50 for 2.5%).
*   **TahminiDikimSuresiSan:** `INT` - Tek bir ürün için tahmini dikim süresi (saniye cinsinden).
*   **ZorlukDerecesi:** `INT` (1-10 arası) - Modelin dikim zorluğunu belirten seviye.
*   **OlusturmaTarihi:** `DATETIME` - Parti oluşturma tarihi ve saati.
*   **PartiDurumu:** `VARCHAR(30)` - Partinin anlık durumu (örn: 'Oluşturuldu', 'Eşleştiriliyor', 'Üretimde', 'Kalite Kontrol', 'Tamamlandı', 'İptal Edildi').
*   **HedefBirimMaliyetTL:** `DECIMAL(10,4)` - Model başına hedeflenen birim maliyet.
*   **ToplamFireAdet:** `INT` (Default: 0) - Partiye ait toplam fire (hatalı ürün) adedi.

**1.2. SEÇENEKLER (Yapılandırma/Lookup Tabloları):**

*   **ZorlukDerecesiTanımları:** `LOOKUP TABLE` (`ZorlukDereceID`, `DereceAdi`, `Aciklama`) - 1'den 10'a kadar olan zorluk derecelerinin detaylı açıklamaları ve varsayılan süre/maliyet çarpanları.
*   **KumasTuruListesi:** `LOOKUP TABLE` (`KumasTuruID`, `KumasAdi`, `VarsayilanEsneklikPayiYuzde`) - Önceden tanımlanmış kumaş türleri ve onlara ait varsayılan esneklik payları.

**1.3. VERİ AKIŞI (Haberleşme):**

*   **Tetikleyici 01: `Parti_Olusturuldu_ve_Baslatildi` Olayı:**
    *   **Tetiklenme Şartı:** Yeni bir üretim partisi başarıyla sisteme kaydedilip `PartiDurumu` 'Oluşturuldu' olarak işaretlendiğinde ve manuel/otomatik olarak 'Başlatıldı' komutu verildiğinde.
    *   **Gönderen:** Üretim/İş Emri Departmanı Modülü.
    *   **Alıcı:** `Personel ve Makine Eşleştirme` Departmanı Modülü.
    *   **Veri Yükü (Payload):**
        ```json
        {
          "PartiID": 1001,
          "ModelKodu": "MDL-2023-A001",
          "HedefAdet": 500,
          "TahminiDikimSuresiSan": 240, // 4 dakika
          "ModelZorlukDerecesi": 8,
          "GerekliUzmanlikAlaniTipi": "Düz Dikiş, Overlok" // Modelin gerektirdiği uzmanlık alanları
        }
        ```
    *   **Aksiyon:** Eşleştirme modülü, bu talebi bir iş kuyruğuna (message queue) alır ve uygun personel ile makineleri atama sürecini başlatır. Parti Durumu 'Eşleştiriliyor' olarak güncellenir.

---

### 2. DEPARTMAN: Personel ve Makine Eşleştirme

Bu departman, Üretim/İş Emri departmanından gelen taleplere göre uygun personel ve makineleri atamaktan sorumludur. Liyakat, verimlilik ve makine uygunluğu burada kritik rol oynar.

**2.1. KRİTERLER (Veritabanı Alanları):**

*   **EslestirmeID:** `INT` (Primary Key, Auto-increment) - Benzersiz eşleştirme kaydı.
*   **PartiID:** `INT` (Foreign Key -> `DEPARTMAN_1.PartiID`) - İlgili parti.
*   **PersonelID:** `INT` (Foreign Key -> `PERSONEL.PersonelID`) - Atanan personelin ID'si.
*   **MakineID:** `INT` (Foreign Key -> `MAKINE.MakineID`) - Atanan makinenin ID'si.
*   **EslestirmeTarihi:** `DATETIME` - Eşleştirmenin yapıldığı an.
*   **EslestirmeDurumu:** `VARCHAR(30)` - Eşleştirmenin anlık durumu (örn: 'Atandı', 'Aktif', 'Tamamlandı', 'İptal Edildi').
*   **AtananZorlukDerecesi:** `INT` - Personelin atanacağı işin zorluk derecesi (Parti'den gelir).
*   **PersonelLiyakatSeviyesi:** `VARCHAR(20)` - Atama anındaki personelin yeterlilik seviyesi (örn: 'Acemi', 'Orta', 'Kıdemli', 'Usta').
*   **PersonelFPYOraan:** `DECIMAL(5,2)` - Atama anındaki personelin hata yapma oranı (Yüzde olarak, 0.00-100.00).
*   **PersonelUzmanlikAlanlari:** `VARCHAR(255)` - Personelin uzmanlık alanları (örn: 'Düz Makine, Overlok').
*   **MakineDurumuAtamaAninda:** `VARCHAR(20)` - Atama anındaki makinenin durumu (örn: 'Boş', 'Dolu', 'Arızalı').
*   **HedeflenenUrunAdet:** `INT` - Atanan personel ve makineden beklenen üretim adedi.

**2.2. SEÇENEKLER (Yapılandırma/Lookup Tabloları):**

*   **PersonelLiyakatSeviyeleri:** `LOOKUP TABLE` (`LiyakatID`, `SeviyeAdı`, `MinDeneyimYil`, `MaxFPYOraan`, `BirimDakikaUcretiCarpani`) - Personel liyakat seviyeleri ve onlara bağlı performans metrikleri.
*   **Eşleştirme Bariyerleri/Kuralları:** `RULES ENGINE CONFIGURATION`
    *   **Kural_01 (Zorluk-Liyakat Eşleşmesi):** `IF Model.ZorlukDerecesi >= 8 AND Personel.LiyakatSeviyesi NOT IN ('Kıdemli', 'Usta') THEN Eşleştirme_Reddet`
    *   **Kural_02 (FPY Bariyeri):** `IF Model.ZorlukDerecesi >= 6 AND Personel.FPYOraan > 5.00 THEN Eşleştirme_Uyar_Veya_Reddet`
    *   **Kural_03 (Uzmanlık Alanı):** `IF Model.GerekliUzmanlikAlaniTipi NOT IN Personel.UzmanlikAlanlari THEN Eşleştirme_Reddet`
    *   **Kural_04 (Makine Durumu):** `IF Makine.Durumu != 'Boş' THEN Eşleştirme_Reddet`
*   **MakineTipiUzmanlıkEşleşmesi:** `LOOKUP TABLE` (`MakineTipiID`, `MakineTuruAdi`, `UyumluUzmanlikAlani`).

**2.3. VERİ AKIŞI (Haberleşme):**

*   **Tetikleyici 02: `Personel_Makine_Atandi_ve_Islem_Hazir` Olayı:**
    *   **Tetiklenme Şartı:** Üretim/İş Emri departmanından gelen talebe istinaden uygun personel ve makine başarıyla eşleştirilip atandığında ve `EslestirmeDurumu` 'Aktif' olarak güncellendiğinde.
    *   **Gönderen:** Personel ve Makine Eşleştirme Departmanı Modülü.
    *   **Alıcı:** `Operasyon ve Vicdan` Departmanı Modülü.
    *   **Veri Yükü (Payload):**
        ```json
        {
          "PartiID": 1001,
          "EslestirmeID": 501,
          "PersonelID": 205,
          "MakineID": 310,
          "ModelKodu": "MDL-2023-A001",
          "AtananZorlukDerecesi": 8,
          "TahminiDikimSuresiSan": 240,
          "IsBaslamaOnayiGerekiyor": true // Operasyon ekranındaki kronometre kilidini açma sinyali
        }
        ```
    *   **Aksiyon:** Operasyon departmanındaki ilgili personelin iş ekranında, bu iş emri görünür hale gelir, "Başla" kronometresinin kilidi yazılımsal olarak kaldırılır ve işe başlama izni verilir. Makine durumu 'Dolu' olarak güncellenir.

---

### 3. DEPARTMAN: Operasyon ve Vicdan (Bant Merkezi)

Bu departman, üretimin gerçek zamanlı takibini yapar, tamamlanan işleri kaydeder ve olası duruşları yönetir. Üretim verimliliği ve ilerlemesi buradan izlenir.

**3.1. KRİTERLER (Veritabanı Alanları):**

*   **OperasyonKayitID:** `INT` (Primary Key, Auto-increment) - Benzersiz operasyon kaydı.
*   **EslestirmeID:** `INT` (Foreign Key -> `DEPARTMAN_2.EslestirmeID`) - İlgili eşleştirme kaydı.
*   **PartiID:** `INT` (Foreign Key -> `DEPARTMAN_1.PartiID`) - İlgili parti.
*   **PersonelID:** `INT` (Foreign Key -> `PERSONEL.PersonelID`) - İşlemi yapan personel.
*   **UrunSeriNo:** `VARCHAR(50)` (Unique per product within party) - Üretilen her ürün için benzersiz seri numarası/barkodu.
*   **IslemBaslangicZamani:** `DATETIME` - Ürün üzerindeki işleme başlama zamanı.
*   **IslemBitisZamani:** `DATETIME` - Ürün üzerindeki işlemi bitirme zamanı.
*   **GerceklesenDikimSuresiSan:** `INT` - Tek bir ürünün dikim süresi (saniye).
*   **ToplamDurusSuresiSan:** `INT` (Default: 0) - Bu işlem sırasında kaydedilen toplam duruş süresi.
*   **DurusMevcut:** `BOOLEAN` - İşlem sırasında duruş olup olmadığı.
*   **DurusKayitlari:** `JSONB` veya Ayrı bir `DURUS_KAYITLARI` tablosu - Duruş tipi, başlangıç/bitiş zamanı, gerekçe gibi detayları içerir.
*   **VideoKanitURL:** `VARCHAR(255)` - İhtiyaç halinde işlem veya duruşun video kaydının URL'si.
*   **KaliteKontrolDurumu:** `VARCHAR(30)` - Ürünün kalite kontrol durumu (örn: 'Bekleniyor', 'Geçti', 'Reddedildi', 'Fire').
*   **HataMevcut:** `BOOLEAN` - Üretilen üründe hata olup olmadığı.
*   **HataTipiID:** `INT` (Foreign Key -> `HATA_TURU.HataTipiID`) - Hatanın tipi (eğer varsa).
*   **FireNedeniAciklama:** `TEXT` - Ürün fireye ayrıldıysa nedeni.

**3.2. SEÇENEKLER (Yapılandırma/Lookup Tabloları):**

*   **DurusTipiListesi:** `LOOKUP TABLE` (`DurusKodu`, `DurusAdi`, `MaliyetEtkisi`, `SorumluDepartman`, `PersonelMaasEtkisi`)
    *   Örnek Durumlar: 'İplik Koptu', 'Makine Arızası', 'Elektrik Kesintisi', 'Malzeme Eksikliği', 'Tuvalet Molası', 'Öğle Molası', 'Sistem Arızası', 'Şef Bekleme'.
*   **HataTipiListesi:** `LOOKUP TABLE` (`HataTipiID`, `HataAdi`, `OnemDerecesi`, `SorumluDepartman`, `MaliyetEtkisi`).
*   **KaliteKontrolSonuclari:** `ENUM('Geçti', 'Reddedildi', 'Fire')`.

**3.3. VERİ AKIŞI (Haberleşme):**

*   **Tetikleyici 03: `Urun_Islemi_Tamamlandi_ve_Kalite_Kontrole_Gonderildi` Olayı:**
    *   **Tetiklenme Şartı:** Bir ürün üzerindeki dikim işlemi başarıyla tamamlandığında ve kalite kontrol için hazır olduğunda.
    *   **Gönderen:** Operasyon ve Vicdan Departmanı Modülü.
    *   **Alıcı:** `Maliyet Merkezi` Departmanı Modülü (Personel Akatça/Prim hesaplaması için), `Üretim/İş Emri` Departmanı Modülü (Parti İlerlemesi için).
    *   **Veri Yükü (Payload):**
        ```json
        {
          "PartiID": 1001,
          "EslestirmeID": 501,
          "PersonelID": 205,
          "UrunSeriNo": "PRD-1001-A001-001",
          "GerceklesenDikimSuresiSan": 250,
          "BuIslemToplamDurusSuresiSan": 10, // Sadece bu ürünün dikimi sırasında yaşanan duruş
          "HataMevcut": false,
          "KaliteKontrolDurumu": "Bekleniyor",
          "OperasyonTamamlanmaZamani": "2023-10-27T10:35:00Z"
        }
        ```
    *   **Aksiyonlar:**
        *   Maliyet Merkezi: Bu ürünün üretim maliyetini (personel işçilik, duruş payı vb.) hesaplamak için verileri alır.
        *   Üretim/İş Emri: Parti için tamamlanan ürün adedini günceller ve Parti Durumu'nu izler (örn: %X tamamlandı).

*   **Tetikleyici 04: `Durus_Kaydedildi` Olayı:**
    *   **Tetiklenme Şartı:** Herhangi bir duruş (personel, makine veya genel) sisteme kaydedildiğinde.
    *   **Gönderen:** Operasyon ve Vicdan Departmanı Modülü.
    *   **Alıcı:** `Maliyet Merkezi` Departmanı Modülü.
    *   **Veri Yükü (Payload):**
        ```json
        {
          "PartiID": 1001,
          "PersonelID": 205, // Eğer personel kaynaklı duruş ise
          "MakineID": 310,   // Eğer makine kaynaklı duruş ise
          "DurusTipiKodu": "ELK-KST", // lookup tablosundan
          "DurusBaslangicZamani": "2023-10-27T10:30:00Z",
          "DurusBitisZamani": "2023-10-27T10:40:00Z",
          "DurusGerekcesiAciklama": "Bölgesel elektrik kesintisi."
        }
        ```
    *   **Aksiyon:** Maliyet Merkezi, duruşun toplam parti maliyetine ve duruşun niteliğine göre personel hak edişlerine etkisini hesaplamak için bu bilgiyi kullanır.

---

### 4. DEPARTMAN: Maliyet Merkezi (Personel ve İşletme Giderleri)

Bu departman, her bir ürün ve parti bazında detaylı maliyet hesaplamalarını yapar. Personel, işletme ve sarf giderlerini bir araya getirerek gerçek birim maliyeti çıkarır.

**4.1. KRİTERLER (Veritabanı Alanları):**

*   **MaliyetKayitID:** `INT` (Primary Key, Auto-increment) - Benzersiz maliyet kaydı.
*   **PartiID:** `INT` (Foreign Key -> `DEPARTMAN_1.PartiID`) - Maliyetin hesaplandığı parti.
*   **UrunSeriNo:** `VARCHAR(50)` (Foreign Key -> `DEPARTMAN_3.UrunSeriNo`, Nullable) - Ürüne özel maliyet takibi için, parti genel giderleri için NULL olabilir.
*   **MaliyetTipi:** `VARCHAR(50)` - 'Personel İşçilik', 'İşletme Gideri', 'Sarf Malzeme', 'Fire Kaybı'.
*   **MaliyetKalemiAciklama:** `VARCHAR(255)` - Maliyet kaleminin detayı (örn: 'Usta Dikim Ücreti', 'Elektrik Gider Payı', 'İplik Tüketimi').
*   **MaliyetTutariTL:** `DECIMAL(10,4)` - Maliyetin TL karşılığı.
*   **MaliyetTarihi:** `DATETIME` - Maliyetin kaydedildiği tarih.
*   **KaynakReferansID:** `INT` (Nullable) - Maliyetin kaynağı olan OperasyonKayitID veya DurusKayitID gibi.
*   **MaliyetOnayDurumu:** `VARCHAR(20)` - Maliyetin onay durumu (örn: 'Hesaplandı', 'Onay Bekliyor', 'Onaylandı').

**Personel Gideri İçin Ek Hesaplama Parametreleri:**
*   **BirimDakikaUcreti:** `DECIMAL(8,4)` - Personelin liyakatı ve tecrübesine göre belirlenen dakika başına ücret.
*   **ZorlukKatsayisi:** `DECIMAL(5,2)` - Yapılan işin zorluğuna göre ücrete uygulanan katsayı.
*   **PerformansKatsayisi:** `DECIMAL(5,2)` - FPY oranı ve hedeflenen süreye göre performansı yansıtan katsayı.
*   **EkSaniyeBedeliTL:** `DECIMAL(8,4)` - Tahmini süreyi aşan her saniye için ek maliyet.

**İşletme Gideri İçin Ek Hesaplama Parametreleri (Parti Başına Pay):**
*   **ToplamPartiCalismaSuresiDakika:** `INT` - Partinin üretim bandında geçirdiği toplam dakika.
*   **IsletmeGideriBirimDakikaTL:** `DECIMAL(8,4)` - Toplam işletme giderlerinin dakika başına dağıtılmış maliyeti.
*   **OzelGiderPayiTL:** `DECIMAL(10,4)` - O partiye özel, doğrudan atanmış diğer işletme giderleri (örn: özel aydınlatma, ısıtma).

**Sarf Gideri İçin Ek Hesaplama Parametreleri:**
*   **SarfMalzemeKodu:** `VARCHAR(50)` - Kullanılan sarf malzemenin kodu (örn: İplik, Makine Yağı).
*   **TuketimMiktari:** `DECIMAL(10,4)` - Tüketilen miktar (metre, ml, adet).
*   **BirimFiyatTL:** `DECIMAL(8,4)` - Sarf malzemenin birim fiyatı.

**4.2. SEÇENEKLER (Yapılandırma/Lookup Tabloları):**

*   **GiderTipiSınıflandırma:** `ENUM('Direkt', 'Endirekt', 'Sabit', 'Değişken')` - Maliyetin ürünle ilişkisi ve davranışına göre sınıflandırma.
*   **Maliyet Hesaplama Kuralları (Vicdan Tipi):** `CONFIGURABLE RULES ENGINE`
    *   **Kural_01 (Elektrik Kesintisi):** `IF DurusTipi = 'Elektrik Kesintisi' THEN PersonelHakEdisHesabinaDahilEtme = TRUE, IsletmeGideriEtkisi = DurusSuresi * IsletmeGideriBirimDakikaTL`
    *   **Kural_02 (Tuvalet Molası):** `IF DurusTipi = 'Tuvalet Molası' THEN PersonelHakEdisHesabinaDahilEtme = FALSE (Personel ücretinden kesilmez), IsletmeGideriEtkisi = 0`
    *   **Kural_03 (FPY Cezası):** `IF Personel.FPYOraan > PersonelLiyakat.MaxFPYOraan AND HataSorumlusu = 'Personel' THEN PersonelBirimDakikaUcreti = PersonelBirimDakikaUcreti * FPYCezaKatsayisi`
    *   **Kural_04 (Fazla Süre Cezası):** `IF GerceklesenDikimSuresiSan > TahminiDikimSuresiSan THEN PersonelMaliyetineEkle = (GerceklesenDikimSuresiSan - TahminiDikimSuresiSan) * EkSaniyeBedeliTL`
*   **GenelIsletmeGiderleri:** `CONFIGURABLE` - Günlük/haftalık/aylık kira, elektrik, su, yemek gibi sabit ve değişken işletme giderlerinin total miktarları ve parti başına düşecek pay oranları.

**4.3. VERİ AKIŞI (Haberleşme):**

*   **Tetikleyici 05: `MaliyetKalemi_Hesaplandi` Olayı:**
    *   **Tetiklenme Şartı:** Operasyon veya diğer departmanlardan gelen bir veri (tamamlanan ürün, duruş kaydı, sarf tüketimi) doğrultusunda tek bir maliyet kaleminin hesaplanması tamamlandığında.
    *   **Gönderen:** Maliyet Merkezi Departmanı Modülü.
    *   **Alıcı:** Kendi bünyesindeki `MaliyetKayitlari` tablosu ve geçici olarak `Muhasebe, Analiz ve Rapor` Departmanı Modülü'nün özetleyici servisi.
    *   **Veri Yükü (Payload - Örnek Personel İşçilik Maliyeti):**
        ```json
        {
          "MaliyetKayitID": 8001,
          "PartiID": 1001,
          "UrunSeriNo": "PRD-1001-A001-001",
          "MaliyetTipi": "Personel İşçilik",
          "MaliyetKalemiAciklama": "Usta Dikim Ücreti",
          "MaliyetTutariTL": 1.55,
          "MaliyetTarihi": "2023-10-27T10:35:00Z",
          "PersonelID_Etkilenen": 205,
          "GerceklesenSureSan": 250,
          "MaliyetOnayDurumu": "Hesaplandı"
        }
        ```
    *   **Aksiyon:** Muhasebe departmanı, bu maliyet kalemlerini toplar ve parti bazında konsolide eder.

*   **Tetikleyici 06: `Parti_Toplam_Maliyet_Hesaplandi_ve_Rapor_Hazir` Olayı:**
    *   **Tetiklenme Şartı:** Bir `PartiID`'ye ait tüm üretim işlemleri tamamlandığında, tüm duruşlar ve sarf malzeme tüketimleri kaydedildiğinde ve Maliyet Merkezi ilgili tüm kalemleri toplayıp nihai parti maliyetini hesapladığında.
    *   **Gönderen:** Maliyet Merkezi Departmanı Modülü.
    *   **Alıcı:** `Muhasebe, Analiz ve Rapor` Departmanı Modülü.
    *   **Veri Yükü (Payload - Şifreli ve Özet):**
        ```json
        {
          "PartiID": 1001,
          "GerceklesenToplamPersonelGideriTL": 775.00,
          "GerceklesenToplamIsletmeGideriTL": 150.00,
          "GerceklesenToplamSarfGideriTL": 75.00,
          "ToplamFireMaliyetiTL": 20.00, // Fire olarak ayrılan ürünlerin maliyeti
          "GerceklesenToplamMaliyetTL": 1020.00, // Tüm kalemlerin toplamı
          "NetBirimMaliyetTL": 2.04,     // GerçekleşenToplamMaliyet / Net Üretilen Adet
          "MaliyetHesaplamaTarihi": "2023-10-27T16:00:00Z",
          "HashSignature": "SHA256HASHOFDATA" // Veri bütünlüğü ve şifreleme için
        }
        ```
    *   **Aksiyon:** Muhasebe departmanı, bu özet maliyet verisini nihai raporlama, hedef-gerçekleşen maliyet karşılaştırması ve analiz için kaydeder. Parti Durumu 'Maliyet Hesaplandı' olarak güncellenir.

---

### 5. DEPARTMAN: Muhasebe, Analiz ve Rapor (Gise/Vezne)

Bu departman, 1. Birimin nihai çıkış kapısıdır. Üretim sürecinin finansal performansını özetler, hedeflenen ve gerçekleşen maliyetleri karşılaştırır, zayiatı raporlar ve 2. Birime devir için onay verir.

**5.1. KRİTERLER (Veritabanı Alanları):**

*   **RaporID:** `INT` (Primary Key, Auto-increment) - Benzersiz rapor tanımlayıcısı.
*   **PartiID:** `INT` (Foreign Key -> `DEPARTMAN_1.PartiID`) - Raporun ait olduğu parti.
*   **RaporTarihi:** `DATETIME` - Raporun oluşturulduğu tarih.
*   **HedeflenenToplamMaliyetTL:** `DECIMAL(12,4)` - Parti için hedeflenen toplam maliyet (HedefBirimMaliyetTL * KesimNetAdet).
*   **GerceklesenToplamMaliyetTL:** `DECIMAL(12,4)` - Parti için gerçekleşen toplam maliyet (Maliyet Merkezinden gelen özet).
*   **MaliyetFarkiTL:** `DECIMAL(12,4)` - Gerçekleşen - Hedeflenen maliyet farkı.
*   **ToplamUretilenNetAdet:** `INT` - Üretilen ve kalite kontrolden geçen net ürün adedi (KesimNetAdet - ToplamZayiatAdet).
*   **ToplamZayiatAdet:** `INT` - Üretim sırasında ortaya çıkan toplam fire/çürük ürün adedi.
*   **ZayiatMaliyetTL:** `DECIMAL(10,4)` - Zayiat ürünlerin toplam maliyeti.
*   **GerceklesenBirimMaliyetTL:** `DECIMAL(10,4)` - Tüm maliyetler dahil, bir adet ürünün nihai maliyeti.
*   **RaporDurumu:** `VARCHAR(30)` - Raporun anlık durumu (örn: 'Taslak', 'Şef Onayı Bekliyor', 'Onaylandı', 'Kilitlendi', 'Reddedildi').
*   **OnaylayanPersonelID:** `INT` (Foreign Key -> `PERSONEL.PersonelID`, Nullable) - Raporu onaylayan şef/yönetici.
*   **OnayTarihi:** `DATETIME` (Nullable) - Raporun onaylandığı tarih.
*   **DevirDurumu:** `BOOLEAN` (Default: FALSE) - 2. Birime devir edildi mi?

**5.2. SEÇENEKLER (Yapılandırma/Rol Bazlı Erişim):**

*   **Rapor Kilitleme Yetkisi:** `ROLE-BASED ACCESS CONTROL (RBAC)` - Belirli kullanıcı rolleri (örn: 'Muhasebe Müdürü', 'Üretim Direktörü') tarafından raporun üzerinde değişiklik yapılmasını engelleme. Yalnızca belirli yetkilere sahip kişiler kilidi kaldırabilir.
*   **Şef Onayı Akışı:** `WORKFLOW MANAGEMENT CONFIGURATION` - Raporun yayınlanmadan veya 2. Birime devredilmeden önce belirli bir yetkili (örn: Üretim Şefi, Maliyet Kontrolörü) tarafından onaylanması zorunluluğu. Onay aşamaları ve yetkili atamaları yapılandırılabilir.
*   **Raporlama Şablonları:** `CONFIGURABLE TEMPLATES` - Farklı rapor türleri için (örn: Parti Bazlı, Aylık Özet, Model Performansı) önceden tanımlanmış rapor şablonları.

**5.3. VERİ AKIŞI (Haberleşme):**

*   **Tetikleyici 07: `Parti_Nihai_Rapor_Taslagi_Olusturuldu` Olayı:**
    *   **Tetiklenme Şartı:** Maliyet Merkezi'nden `Parti_Toplam_Maliyet_Hesaplandi_ve_Rapor_Hazir` olayı alındığında ve `Üretim/İş Emri` departmanından `PartiDurumu` 'Tamamlandı' bilgisi geldiğinde, raporun taslak hali otomatik olarak oluşturulur.
    *   **Gönderen:** Muhasebe, Analiz ve Rapor Departmanı Modülü.
    *   **Alıcı:** Kendi veri tabanı (rapor tablosu) ve ilgili yöneticilere bildirim sistemi.
    *   **Veri Yükü (Payload):** `PartiID`, `RaporTarihi`, `HedeflenenToplamMaliyetTL`, `GerceklesenToplamMaliyetTL`, `ToplamUretilenNetAdet`, `ToplamZayiatAdet`, `RaporDurumu`='Taslak'.
    *   **Aksiyon:** Rapor `Taslak` durumunda kaydedilir ve tanımlı onaylayıcılara onay için bir bildirim (e-posta, sistem içi mesaj) gönderilir.

*   **Tetikleyici 08: `Parti_Nihai_Rapor_Onaylandi_ve_Devredildi` Olayı:**
    *   **Tetiklenme Şartı:** Bir şef veya yetkili tarafından rapor başarıyla onaylandığında ve `RaporDurumu` 'Onaylandı', `DevirDurumu` 'TRUE' olarak güncellendiğinde.
    *   **Gönderen:** Muhasebe, Analiz ve Rapor Departmanı Modülü.
    *   **Alıcı:** `2. Birim (Mağaza ve Kasa)` Sistemi (Dış Sistem Entegrasyonu).
    *   **Veri Yükü (Payload - Nihai Üretim Devri Paketi):**
        ```json
        {
          "PartiID": 1001,
          "ModelKodu": "MDL-2023-A001",
          "UretilenNetAdet": 490, // Kalite kontrolden geçmiş, fire düşülmüş net adet
          "ToplamZayiatAdet": 10,
          "GerceklesenBirimMaliyetTL": 2.04,
          "ToplamPartiMaliyetiTL": 1000.00, // Net Üretim Adedi * Net Birim Maliyet
          "DevirTarihi": "2023-10-28T09:00:00Z",
          "DevirOnayKodu": "UNQ-APPROVAL-CODE-XYZ", // Güvenlik ve takip için benzersiz kod
          "VeriHash": "SHA256HASHOFDATA" // Veri bütünlüğü için şifreli özet
        }
        ```
    *   **Aksiyon:** 1. Birimden çıkan "Net Hatasız Dosya ve Mal" bilgisini temsil eden bu veri paketi, 2. Birimin envanter, stok ve satış sistemlerine aktarılır. Bu, 1. Birim'in görevinin tamamlandığı ve ürünlerin satışa hazır hale geldiği anlamına gelir.

---

## 🚀 SONUÇ VE MİMARİ NOTLAR

Bu iskelet mimarisi, Sen Sen Tekstil'in 1. Birimindeki iş akışını ve veri yönetimini yazılım düzeyinde tasvir etmektedir. Her bir departman, belirli sorumlulukları olan bir mikro-servis veya modül olarak düşünülebilir. Veri akışları ise bu modüller arasındaki API çağrıları (REST/gRPC), mesaj kuyrukları (RabbitMQ, Kafka gibi) veya olay tabanlı sistemler aracılığıyla asenkron ve güvenilir bir şekilde gerçekleştirilebilir.

*   **Veri Bütünlüğü ve Tutarlılık:** `Primary Key`, `Foreign Key` ilişkileri ve belirlenmiş veri tipleri ile sağlanır. Her departmanın kendi verisini tutması, bağımsızlığı artırır ancak modüller arası veri senkronizasyonu kritik hale gelir.
*   **Şifreleme ve Güvenlik:** Özellikle Maliyet Merkezi'nden Muhasebe'ye giden özet veriler ve 1. Birim'den 2. Birim'e yapılan devirlerde `HashSignature` gibi mekanizmalarla veri bütünlüğü ve hassas verilerin güvenliği için asimetrik şifreleme yöntemleri kullanılmalıdır. Her departman için `RBAC` (Role-Based Access Control) ile yetkilendirme katmanları zorunludur.
*   **Performans ve Gerçek Zamanlılık:** Operasyon departmanı gibi kritik noktalarda `GerçeklesenDikimSuresiSan` gibi verilerin anlık işlenmesi ve `Durus_Kaydedildi` gibi olayların hızlı tetiklenmesi için optimize edilmiş veritabanı işlemleri ve yüksek performanslı mesajlaşma sistemleri (örn: Redis Pub/Sub veya Kafka) önem taşır.
*   **Genişletilebilirlik ve Esneklik:** Modüler departman yapısı, gelecekteki ek kriterlerin, seçeneklerin veya yeni departman/alt sistem entegrasyonlarının kolayca yapılabilmesini sağlar. İş kuralları (vicdan tipi, eşleştirme bariyerleri) dışarıdan yapılandırılabilir (externalized configuration) hale getirilerek sistemin adaptasyonu artırılır.
*   **Kör Deliklerin Kapatılması:** Her departmanın net sorumlulukları, veri giriş/çıkış noktaları ve aralarındaki şartlı veri akışları tanımlanarak, süreçteki belirsizlikler ve bilgi kayıpları minimize edilmiştir. Kronometrelerin kilidinin kaldırılması, maliyetlerin liyakat ve duruş tipine göre hesaplanması, şef onayı gibi detaylar, sistemin 'vicdan' mekanizmalarını dijitalize etmektedir.

Bu detaylı analiz, Engin Koordinatör'ün beklediği sağlam ve kör deliklerden arındırılmış bir altyapı taslağı sunmaktadır. Artık arayüz geliştirme aşamasına geçmeden önce, bu veri modeline ve iş akışına göre sistemin omurgası inşa edilebilir.