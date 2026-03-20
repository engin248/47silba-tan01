# 🛡️ DANIŞMA VE İSTİŞARE RAPORU (BÖLÜM 2): AR-GE, MODELHANE VE KESİM MİMARİSİ

**Görevli Ajan:** GEMİNİ (Sistem Mimarı ve Veritabanı Şefi)
**Konu:** "Üretimden Önce Karar ve Hazırlık Evresi" - Supabase Mimarisine Adaptasyon
**Tarih:** 26 Ekim 2023

---

Sayın Koordinatörüm Engin Bey,

Belirttiğiniz "Üretimden Önce Karar ve Hazırlık Evresi" direktifi, Sen Tekstil Üretimi'nin kalitesini, verimliliğini ve marka değerini doğrudan etkileyecek stratejik bir yaklaşımdır. Fason üretimdeki belirsizlikleri ortadan kaldırarak, standart ve yüksek kaliteli ürünler sunma hedefine ulaşmak için kritik bir adımdır. İstenilen bu mimariyi yüzde 100 doğrulukla inceledim ve Supabase platformuna uyarlama potansiyelini, kör noktalarını ve tablo mimarisini detaylı bir raporla sunuyorum.

---

## 1. Fizibilite ve Kör Noktalar Analizi

Koordinatörümüzün belirlediği 6 aşamalı süreci Supabase mimarisi özelinde değerlendirelim:

### 1.1. Dijital Trend Avcısı (Amazon / Trendyol)
*   **Fizibilite:**
    *   Trend verilerini doğrudan Amazon/Trendyol gibi platformlardan API aracılığıyla çekmek, platformların veri paylaşım politikaları ve API kısıtlamaları nedeniyle genellikle sınırlıdır veya yüksek maliyetli üçüncü taraf çözümler gerektirir.
    *   Alternatif olarak, sektör raporları, pazar araştırma firmaları veya sınırlı web scraping (hukuki ve etik çerçevelere dikkat ederek) ile veri toplamak daha gerçekçi olabilir.
    *   Toplanan trend verileri (ürün adı, kategorisi, anahtar kelimeler, popülerlik puanı vb.) PostgreSQL tablolarında yapısal olarak kolayca depolanabilir.
*   **Kör Noktalar:**
    *   **Veri Kaynağı Güvenilirliği ve Güncelliği:** API erişimi kısıtlıysa veya scraping kullanılıyorsa, veri kalitesi ve güncelliği risk altında olabilir. Sürekli bakım ve adaptasyon gerektirir.
    *   **Veri Hacmi:** Eğer çok detaylı ve sık trend taraması yapılırsa, bu veri setleri zamanla büyüyebilir. Ancak, Supabase'in PostgreSQL veritabanı bu tür metinsel ve sayısal verileri yönetmekte oldukça etkilidir.
*   **Optimizasyon:**
    *   Trend verilerini özetlenmiş ve filtrelenmiş şekilde saklayın (örn: sadece ilk 100 ürün veya belirli kategoriler).
    *   Veri toplama sıklığını optimize edin (günlük, haftalık gibi).
    *   `JSONB` alanları kullanarak esnek trend meta verilerini saklayın.
    *   Supabase Edge Functions veya ayrı bir arka plan servisi ile veri toplama işlemlerini zamanlayın.

### 1.2. Kumaş ve Materyal Arşivi (Dijital Depo)
*   **Fizibilite:**
    *   Kumaş ve aksesuar bilgilerini (adı, tipi, kompozisyonu, maliyeti, tedarikçisi vb.) PostgreSQL tablolarında saklamak standart ve çok verimlidir.
    *   Fotoğraflar ve diğer dijital dosyalar için **Supabase Storage (S3 uyumlu obje depolama)** mükemmel bir çözümdür. Veritabanında sadece bu dosyaların URL'leri tutulur, bu sayede veritabanı şişmez ve performans düşmez.
*   **Kör Noktalar:**
    *   **Depolama Maliyeti:** Görsel arşiv büyüdükçe Supabase Storage maliyetleri artacaktır.
    *   **Erişim Hızı:** Büyük fotoğraf arşivlerine eşzamanlı erişimde gecikmeler yaşanmaması için CDN (Content Delivery Network) kullanımı düşünülebilir.
*   **Optimizasyon:**
    *   Tüm görselleri ve dijital dosyaları Supabase Storage'da depolayın.
    *   Görselleri sisteme yüklemeden önce boyut ve çözünürlüklerini optimize edin (web için uygun format ve sıkıştırma).
    *   Sık kullanılan görseller için CDN entegrasyonunu değerlendirin.

### 1.3. Kalıp Çıkarma ve Serileme
*   **Fizibilite:**
    *   Dijital kalıp dosyaları (DXF, PDF, AAMA/ASTM gibi endüstri standartları) doğrudan Supabase Storage'da saklanabilir. Veritabanında ise kalıba ait meta veriler (model ID, bedenler, versiyon, oluşturma tarihi vb.) ve dosya URL'leri tutulur.
*   **Kör Noktalar:**
    *   **Dosya Büyüklüğü:** Kalıp dosyaları oldukça büyük olabilir, bu da depolama maliyetlerini ve indirme sürelerini etkileyebilir.
    *   **Versiyonlama:** Kalıpların farklı versiyonları için doğru bir versiyonlama stratejisi belirlemek önemlidir.
*   **Optimizasyon:**
    *   Kalıp dosyalarını Supabase Storage'da saklayın ve veritabanında sadece referans URL'lerini tutun.
    *   Her kalıp için net bir isimlendirme ve versiyonlama şeması uygulayın.

### 1.4. Kilit Nokta -> "İLK NUMUNENİN DİKİLMESİ VE KAYDA ALINMASI" (Video Depolama)
*   **Fizibilite:**
    *   Bu, mimarinin en kritik ve aynı zamanda en büyük veri hacmine sahip noktasıdır. Numune dikim videoları, sesli açıklamalar ve ilgili metinsel adımlar Supabase'de yönetilebilir.
    *   Videolar için **Supabase Storage** kullanılacaktır. Metinsel/sayısal bilgiler (işlem sayısı, süreler) PostgreSQL tablolarında saklanacaktır.
*   **Kör Noktalar:**
    *   **Veri Şişmesi ve Maliyet:** Yüksek çözünürlüklü ve uzun videolar, çok büyük depolama alanına ihtiyaç duyar ve bu da **Supabase Storage maliyetlerini önemli ölçüde artıracaktır.** Bant genişliği maliyetleri de video indirme/izleme trafiğine bağlı olarak yükselecektir. Bu, *en büyük kör noktadır.*
    *   **Video İşleme:** Supabase Storage doğrudan bir video işleme (transcoding, streaming optimizasyonu) servisi değildir. Videoları farklı formatlara/çözünürlüklere dönüştürme, adaptif streaming sağlama gibi işlemler için ek servisler (örn: Mux, Cloudinary veya self-hosted FFMPEG çözümleri) gerekebilir.
    *   **Performans:** Çok sayıda kullanıcının eşzamanlı olarak yüksek boyutlu videoları izlemesi durumunda, doğrudan Supabase Storage üzerinden servis etmek bant genişliği sınırlarına takılabilir veya yavaşlamaya neden olabilir.
*   **Optimizasyon:**
    *   **Video Sıkıştırma ve Format Standardizasyonu:** Videoların MP4 (H.264/H.265) formatında, belirli bir çözünürlük (örn: 720p veya 1080p) ve bit hızında kaydedilmesi zorunlu kılınmalıdır. Bu, dosya boyutunu ciddi şekilde azaltır.
    *   **Maksimum Süre Sınırlaması:** Her video için makul bir maksimum süre (örn: 15-20 dakika) belirleyin.
    *   **Harici Video İşleme:** Uzun vadede veya yüksek hacimli kullanımda, videoları Supabase Storage'a yükledikten sonra, bir Edge Function veya başka bir arka plan servisi aracılığıyla Mux/Cloudinary gibi bir video işleme platformuna göndererek, optimize edilmiş streaming için transcode edilmesini sağlayın. Bu platformlar videoları farklı cihazlara ve bant genişliklerine uygun olarak otomatik dönüştürür.
    *   **Streaming Optimizasyonu:** Özellikle fasoncuların erişim hızları düşünülerek, videoların progresif indirme veya adaptif bitrate streaming (HLS/DASH) için optimize edilmesi gerekebilir.
    *   **Arşivleme Politikası:** Eski veya güncelliğini yitirmiş numune videoları için bir arşivleme politikası belirleyin (örn: X yıl sonra daha uygun maliyetli "cold storage"a taşıma veya silme).

### 1.5. Kesim ve Ara İşçilik & 1.6. Üretime Teslimat
*   **Fizibilite:**
    *   Bu aşamalardaki veriler (kesim adetleri, ara işçilik tipleri, teslimat bilgileri vb.) standart ilişkisel veriler olup, PostgreSQL tablolarında sorunsuz bir şekilde yönetilebilir.
    *   Üretim paneline entegrasyon, Supabase'in API yetenekleri kullanılarak kolayca sağlanabilir.
*   **Kör Noktalar:**
    *   Veri hacmi açısından büyük bir kör nokta bulunmamaktadır. Entegrasyon noktalarında hata yönetimi ve veri tutarlılığı önemlidir.
*   **Optimizasyon:**
    *   İş emirleri ve durum güncellemeleri için uygun indeksleme yapısı.
    *   Supabase Realtime ile üretim paneline anlık veri akışı sağlanabilir.

---

## 2. Tablo Mimarisi (Supabase - PostgreSQL Odaklı)

Aşağıda, belirtilen akışa uygun yeni tabloların isimleri, anahtar alanları (PK), ilişkileri ve yabancı anahtar (FK) bağlantıları özet liste mantığında sunulmuştur. Tüm Primary Key'ler (PK) `UUID` tipinde ve `DEFAULT gen_random_uuid()` ile atanabilir, veya tercihe göre `BIGINT` ve `GENERATED ALWAYS AS IDENTITY` kullanılabilir.

### Temel Referans ve Kullanıcı Tabloları (Varsayılan olarak mevcut veya tanımlanacak)
*   **`Kullanicilar`**: Kullanıcı bilgileri. (Supabase Auth ile entegre olabilir.)
    *   `id` (PK)
    *   `ad_soyad`, `rol` vb.
*   **`Tedarikciler`**: Kumaş ve aksesuar tedarikçileri.
    *   `tedarikci_id` (PK)
    *   `ad`, `iletisim` vb.

### AR-GE ve Planlama Tabloları

1.  **`ArGe_Trendleri`**: Dijital trend avcısı verileri.
    *   `trend_id` (PK)
    *   `baslik` (VARCHAR)
    *   `aciklama` (TEXT)
    *   `kaynak_platform` (VARCHAR, örn: 'Amazon', 'Trendyol')
    *   `kayit_tarihi` (TIMESTAMP WITH TIME ZONE)
    *   `ilgili_kategoriler` (TEXT[])
    *   `tahmini_talep_skoru` (INT)
    *   `referans_linkleri` (TEXT[])
    *   `olusturan_kullanici_id` (FK -> `Kullanicilar.id`)

2.  **`Kumas_Arsivi`**: Kumaş ve materyal kütüphanesi.
    *   `kumas_id` (PK)
    *   `kumas_adi` (VARCHAR)
    *   `kumas_tipi` (VARCHAR)
    *   `kompozisyon` (VARCHAR)
    *   `birim_maliyet_tl` (DECIMAL)
    *   `birim` (VARCHAR, örn: 'metre', 'kg')
    *   `genislik_cm` (DECIMAL)
    *   `gramaj_gsm` (DECIMAL)
    *   `renkler` (TEXT[])
    *   `fotograf_url` (TEXT, Supabase Storage URL)
    *   `ekleme_tarihi` (TIMESTAMP WITH TIME ZONE)
    *   `tedarikci_id` (FK -> `Tedarikciler.tedarikci_id`, NULLABLE)

3.  **`Aksesuar_Arsivi`**: Aksesuar kütüphanesi.
    *   `aksesuar_id` (PK)
    *   `aksesuar_adi` (VARCHAR)
    *   `tip` (VARCHAR, örn: 'Düğme', 'Fermuar', 'Etiket')
    *   `birim_maliyet_tl` (DECIMAL)
    *   `birim` (VARCHAR, örn: 'adet', 'metre')
    *   `fotograf_url` (TEXT, Supabase Storage URL)
    *   `ekleme_tarihi` (TIMESTAMP WITH TIME ZONE)
    *   `tedarikci_id` (FK -> `Tedarikciler.tedarikci_id`, NULLABLE)

4.  **`Model_Taslaklari`**: Potansiyel ürün modellerinin taslakları.
    *   `model_taslak_id` (PK)
    *   `model_adi` (VARCHAR)
    *   `trend_id` (FK -> `ArGe_Trendleri.trend_id`, NULLABLE)
    *   `hedef_kitle` (VARCHAR)
    *   `sezon` (VARCHAR)
    *   `olusturma_tarihi` (TIMESTAMP WITH TIME ZONE)
    *   `tasarimci_kullanici_id` (FK -> `Kullanicilar.id`)
    *   `taslak_durumu` (VARCHAR, örn: 'Fikir', 'Kumaş Seçildi', 'Kalıp Hazır', 'Numune Onay Bekliyor')

5.  **`Model_Malzeme_Listesi`**: Her model taslağı için kullanılan kumaş ve aksesuarlar.
    *   `id` (PK)
    *   `model_taslak_id` (FK -> `Model_Taslaklari.model_taslak_id`)
    *   `kumas_id` (FK -> `Kumas_Arsivi.kumas_id`, NULLABLE)
    *   `aksesuar_id` (FK -> `Aksesuar_Arsivi.aksesuar_id`, NULLABLE)
    *   `kullanim_miktari` (DECIMAL)
    *   `birim` (VARCHAR, örn: 'metre', 'adet')
    *   **(Composite UNIQUE KEY: model_taslak_id, kumas_id, aksesuar_id)**

6.  **`Model_Kaliplari`**: Sayısal kalıp dosyaları ve bilgileri.
    *   `kalip_id` (PK)
    *   `model_taslak_id` (FK -> `Model_Taslaklari.model_taslak_id`)
    *   `kalip_adi` (VARCHAR)
    *   `bedenler` (TEXT[])
    *   `kalip_dosya_url` (TEXT, Supabase Storage URL)
    *   `versiyon_no` (VARCHAR)
    *   `olusturma_tarihi` (TIMESTAMP WITH TIME ZONE)
    *   `olusturan_kullanici_id` (FK -> `Kullanicilar.id`)

### Numune Üretim ve Talimat Tabloları

7.  **`Numune_Uretimleri`**: Şirket içi üretilen 1 adet numune bilgileri.
    *   `numune_id` (PK)
    *   `model_taslak_id` (FK -> `Model_Taslaklari.model_taslak_id`)
    *   `kalip_id` (FK -> `Model_Kaliplari.kalip_id`)
    *   `numune_bedeni` (VARCHAR)
    *   `dikim_tarihi` (TIMESTAMP WITH TIME ZONE)
    *   `dikim_operatörü_kullanici_id` (FK -> `Kullanicilar.id`)
    *   `onay_durumu` (VARCHAR, örn: 'Bekliyor', 'Onaylandı', 'Revizyon Gerekli')
    *   `numune_fotograflari_url` (TEXT[], Supabase Storage URL'leri)

8.  **`Dikim_Talimatlari`**: Fasoncuya gönderilecek video/sesli/yazılı talimatlar.
    *   `talimat_id` (PK)
    *   `numune_id` (FK -> `Numune_Uretimleri.numune_id`, **UNIQUE**)
    *   `talimat_video_url` (TEXT, Supabase Storage URL, **ÇOK KRİTİK ALAN**)
    *   `sesli_aciklama_url` (TEXT, Supabase Storage URL, NULLABLE)
    *   `yazili_adimlari` (JSONB, örn: `[{ "adim_no": 1, "aciklama": "Yaka dikimi", "tahmini_sure_dk": 5 }]`)
    *   `toplam_tahmini_dikim_sure_dk` (INT)
    *   `olusturma_tarihi` (TIMESTAMP WITH TIME ZONE)
    *   `olusturan_kullanici_id` (FK -> `Kullanicilar.id`)

### Üretim Hazırlık Tabloları

9.  **`Kesim_Is_Emirleri`**: Top kumaşların kesim emri.
    *   `kesim_emri_id` (PK)
    *   `numune_id` (FK -> `Numune_Uretimleri.numune_id`)
    *   `uretilecek_adet` (INT)
    *   `kesim_tarihi` (TIMESTAMP WITH TIME ZONE)
    *   `kullanilacak_kumas_rulo_kodlari` (TEXT[]) *(Burada bir `Kumas_Stok` tablosu varsa FK bağlantısı da kurulabilir.)*
    *   `kesim_plan_dosya_url` (TEXT, Supabase Storage URL, NULLABLE)
    *   `kesim_durumu` (VARCHAR, örn: 'Planlandı', 'Devam Ediyor', 'Tamamlandı')
    *   `planlayan_kullanici_id` (FK -> `Kullanicilar.id`)

10. **`Ara_Is_Emirleri`**: Baskı, nakış gibi ek işçilik emirleri.
    *   `ara_is_id` (PK)
    *   `kesim_emri_id` (FK -> `Kesim_Is_Emirleri.kesim_emri_id`)
    *   `islem_tipi` (VARCHAR, örn: 'Baskı', 'Nakış', 'Yıkama')
    *   `islem_detaylari` (TEXT)
    *   `islem_yapilacak_adet` (INT)
    *   `teslim_tarihi` (TIMESTAMP WITH TIME ZONE, tahmini)
    *   `durum` (VARCHAR, örn: 'Bekliyor', 'Devam Ediyor', 'Tamamlandı')
    *   `referans_cizim_url` (TEXT, Supabase Storage URL, NULLABLE)

11. **`Uretim_Is_Emirleri`**: Fasoncuya iletilen nihai üretim emri. (Mevcut Üretim Paneli ile entegre olacak tablo)
    *   `uretim_emri_id` (PK)
    *   `kesim_emri_id` (FK -> `Kesim_Is_Emirleri.kesim_emri_id`)
    *   `dikim_talimat_id` (FK -> `Dikim_Talimatlari.talimat_id`)
    *   `hedef_uretim_adet` (INT)
    *   `uretim_baslangic_tarihi` (TIMESTAMP WITH TIME ZONE, tahmini)
    *   `uretim_bitis_tarihi` (TIMESTAMP WITH TIME ZONE, tahmini)
    *   `uretim_durumu` (VARCHAR, örn: 'Bekliyor', 'Devam Ediyor', 'Tamamlandı')
    *   `fasoncu_id` (FK -> `Fasoncular.fasoncu_id` - varsa)
    *   `olusturma_tarihi` (TIMESTAMP WITH TIME ZONE)
    *   `olusturan_kullanici_id` (FK -> `Kullanicilar.id`)

### İlişki Özeti:

*   `ArGe_Trendleri` 1:N `Model_Taslaklari`
*   `Model_Taslaklari` 1:N `Model_Malzeme_Listesi`
*   `Kumas_Arsivi` 1:N `Model_Malzeme_Listesi` (çoktan çoğa ara tablo)
*   `Aksesuar_Arsivi` 1:N `Model_Malzeme_Listesi` (çoktan çoğa ara tablo)
*   `Model_Taslaklari` 1:N `Model_Kaliplari`
*   `Model_Taslaklari` 1:N `Numune_Uretimleri`
*   `Model_Kaliplari` 1:N `Numune_Uretimleri` (Her numune belirli bir kalıpla ilişkilidir)
*   **`Numune_Uretimleri` 1:1 `Dikim_Talimatlari` (Her numuneye ait TEK ve benzersiz bir talimat vardır)**
*   `Numune_Uretimleri` 1:N `Kesim_Is_Emirleri` (Bir numune tasarımı birden fazla kesim emrine yol açabilir)
*   `Kesim_Is_Emirleri` 1:N `Ara_Is_Emirleri`
*   `Kesim_Is_Emirleri` 1:N `Uretim_Is_Emirleri`
*   `Dikim_Talimatlari` 1:N `Uretim_Is_Emirleri` (Her üretim emri belirli bir dikim talimatına referans verir)

---

## 3. Koordinatör'ün Haklılığı ve Sistem Kusursuzluğuna Etkisi

Engin Bey'in "Fasoncuya inisiyatif vermemek için ilk ürünü kendin dik, videoya çek ve öyle ver" prensibi, modern üretim yönetiminde kalitenin ve verimliliğin artırılmasına yönelik **kesinlikle haklı ve stratejik bir yaklaşımdır.** Bu prensibin hata (FPY - First Pass Yield) oranlarını düşürme ve sistemin kusursuzluğuna etkisi aşağıdaki gibi değerlendirilebilir:

### 3.1. Hata (FPY) Oranlarını Düşürme

1.  **Netlik ve Tekdüzelik:** Videolu talimatlar, fasoncuların yazılı talimatları veya şablonları yanlış yorumlama olasılığını ortadan kaldırır. Ürünün nasıl dikileceği, hangi aşamaların hangi sırayla ve hangi teknikle yapılacağı **görsel ve işitsel olarak tam olarak gösterilir.** Bu, tüm fasoncular arasında aynı standardın yakalanmasını sağlar ve kişisel inisiyatiften kaynaklanan hataları minimize eder. FPY oranları, üretim hattına giren ürünlerin ilk seferde doğru üretilme yüzdesidir; net talimatlar bunu doğrudan artırır.
2.  **Önleyici Hata Tespiti:** Numunenin şirket içinde dikilmesi, kalıp, tasarım veya kumaş seçiminden kaynaklanabilecek potansiyel hataların, seri üretime geçmeden önce tespit edilmesini ve düzeltilmesini sağlar. Bu "erken uyarı sistemi", binlerce ürünün hatalı üretilmesinin önüne geçer.
3.  **Eğitim ve Referans Aracı:** Videolu talimatlar, fasoncu atölyelerindeki yeni personelin eğitimi için paha biçilmez bir kaynaktır. Ayrıca, dikim sırasında tereddüt eden veya bir detayı hatırlamak isteyen tecrübeli çalışanlar için de hızlı ve güvenilir bir referans noktasıdır.
4.  **Standartlaşma ve Kalite Kontrol:** Her ürün için belirlenmiş bir "altın standart" video talimatının olması, kalite kontrol süreçlerini objektif hale getirir. Fasoncu tarafından üretilen ürünler, videodaki numuneyle kolayca karşılaştırılabilir. Bu, hatalı ürünlerin gözden kaçma olasılığını azaltır.
5.  **Hesap Verebilirlik:** Net ve belgelenmiş talimatlar, fasoncuların üretim kalitesi konusunda daha fazla hesap verebilir olmasını sağlar. Talimatlara uygun olmayan üretimler için net bir delil sunulmuş olur.

### 3.2. Sistemin Kusursuzluğuna Etkisi

1.  **Maliyet ve Zaman Tasarrufu:** Hata oranlarının düşmesi, yeniden işleme (rework), fire ve hurda maliyetlerini ciddi ölçüde azaltır. Ayrıca, hatalı ürünlerle uğraşmak yerine doğru ürün üretmeye odaklanıldığı için üretim döngüsü hızlanır ve pazar hedeflerine daha hızlı ulaşılır.
2.  **Marka İmajı ve Müşteri Memnuniyeti:** Tutarlı ve yüksek kaliteli ürünler, Sen Tekstil'in marka imajını güçlendirir. Müşterilerin beklentilerinin karşılanması veya aşılması, uzun vadeli müşteri sadakati yaratır.
3.  **Veriye Dayalı İyileştirme:** Numune dikimi sırasında kaydedilen her adımın süresi ve sırası gibi veriler, gelecekteki ürünlerin tasarımında ve üretim planlamasında değerli içgörüler sunar. Bu veriler, üretim süreçlerinin sürekli iyileştirilmesi için kullanılabilir.
4.  **Bilgi Aktarımı ve Kurumsal Hafıza:** Ürün bilgisi ve üretim know-how'ı, kişisel deneyimlerden ziyade sistemin bir parçası haline gelir. Bu, kilit personel değişikliklerinde bile iş süreçlerinin kesintisiz devam etmesini sağlar.
5.  **Stratejik Ortaklıklar:** Fasoncularla daha şeffaf ve anlaşılır bir çalışma ortamı, karşılıklı güvene dayalı, uzun vadeli ve stratejik iş ortaklıklarının kurulmasına yardımcı olur.

**Sonuç olarak, Engin Bey'in bu direktifi, reaktif problem çözümünden proaktif hata önlemeye geçişi temsil etmektedir. Bu prensip, sadece hata oranlarını düşürmekle kalmayacak, aynı zamanda Sen Tekstil Üretimi'nin tüm üretim ve tedarik zinciri süreçlerinde daha öngörülebilir, verimli ve kusursuz bir yapıya kavuşmasını sağlayacaktır. Supabase mimarisi, doğru optimizasyon stratejileriyle bu vizyonu hayata geçirmek için sağlam bir temel sunmaktadır.**

Saygılarımla,

GEMİNİ
Sistem Mimarı ve Veritabanı Şefi