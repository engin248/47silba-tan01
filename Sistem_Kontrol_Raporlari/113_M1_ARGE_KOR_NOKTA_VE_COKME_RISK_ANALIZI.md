# 113_M1_ARGE_KOR_NOKTA_VE_COKME_RISK_ANALIZI

**Tarih/Saat:** 12 Mart 2026
**Konu:** Ar-Ge M1 Modülü Hermes Ajan Mimarisinin Şasi ve Kırılma Noktası Analizi

Ar-GeMainContainer.js (1382 satır) ve API bağlantılarının röntgenlenmesi sonucu tespit edilen 4 Mega Hata ve Kör Nokta aşağıdadır:

### ❌ 1. KÖR NOKTA (Teknik Kırılma): "15 Saniye Saatli Bombası (Timeout)"
*   **Problem:** API dosyasında Perplexity'ye aynı anda Google, Amazon, Tiktok vb. 10 yeri birden taramasını emrettik. Ancak `ArgeMainContainer.js`'deki frontend kodunuzun 150. satırında `const timeoutId = setTimeout(() => controller.abort(), 15000);` diye bir "saatli bomba" var. 
*   **Risk:** 10 kanalı aynı anda kazıyan (scrapeden) devasa bir AI'nin bu veriyi sentezleyip "İşte Kumaşı, Düğmesi, Tahmini Satış Fiyatı" demesi 15 saniyeden uzun sürecektir. Sistem her aramada "Zaman Aşımına Uğradı" diyip %90 ihtimalle kullanıcının elinde patlayacak. Ajanları (Avcı ve Gözlemci) dar boğaza sokmuşuz.
*   **Çözüm:** Timeout süresini 15 saniyeden en az 45-60 saniyeye (`60000ms`) çıkarmam ve kullanıcıyı "AI derin analiz yapıyor, lütfen paneli kapatmayın" uyarısıyla bekletecek bir UI tasarlamam zorunlu. 

### ❌ 2. KÖR NOKTA (Veri Yığılması ve Çökme - Ekonomik Risk): "Tek Sütunda Devasa Veri (b1_arge_trendler)"
*   **Problem:** MD listesinde 5. Tasnifçi Ajan'a "Bilgiyi 7 ayrı veritabanına parçala" emrini yazdım. Fakat mevcut `aiTrendKaydet` fonksiyonunda (satır 205), ajan 14 maddelik devasa sonucu alıp sadece `b1_arge_trendler` tablosunda `aciklama` isimli tek bir sütunun içine sıkıştırıyor (String/Metin olarak tıkıyor). 
*   **Risk:** Bu devasa veriler tek text sütununda yığılırsa M2 Modelhane, verileri filtreleyemez. Örneğin; "Sadece Keten Kumaşları getir" diyemezsiniz çünkü kumaş bilgisi, fiyat bilgisi, bölge bilgisi o tek string kutusunun içinde karmakarışık yatıyor.
*   **Çözüm:** Supabase'e Gama Timi'nin ekleyeceği 7 ayrı tabloya verilerin *ilişkisel* (trend_id ile bağlı) yazılması için `ArgeMainContainer.js` içindeki `aiTrendKaydet` fonksiyonunun tamamen yeniden lehimlenmesi (Insert komutunun çoklu işlem formuna dönüştürülmesi) şart.

### ❌ 3. KÖR NOKTA (Operasyonel Kırılma): "Gece Bekçisi (Zamansal Doğrulama) Kron (Cron) Sorunu"
*   **Problem:** Mükemmel bir vizyon olan "Reddedilenleri zamanla doğrula" (6. Ajan) sistemi için Next.js mimarisi içinde doğal bir "Her gece 03:00'te tetiklen" (Cron Job) özelliği yoktur. Next.js api'leri sadece biri butona basınca uyanır.
*   **Risk:** İş emrini verdik ancak Vercel veya sunucu tarafında bunu tetikleyecek bir motor kurmadık. Ajan uyuyacak, zaman doğrulama işlemi hiçbir zaman kendi kendine çalışmayacak.
*   **Çözüm:** GitHub Actions veya Vercel Cron entegrasyonu kurularak dışarıdan `/api/kronom-dogrulama` API'sini bir sunucunun her gece dürtmesi sağlanmalı.

### ❌ 4. KÖR NOKTA (İnsan / Kullanım Hata Noktası): "Reçete Öncesi Modele Geçiş"
*   **Problem:** İletilen 119 Kriterin ana manifestosu: *"Onaylanmadan model taslağı açılmaz."* Fakat `ArgeMainContainer.js` dosyası 1049. satırda eski mantık duruyor. Butona basılınca düz bir link ile `NextLink href="/modelhane"` şeklinde hiçbir veri taşımadan M2'ye atıyor.
*   **Risk:** Ar-Ge'de yapay zekanın milimetrik bulduğu o kumaş ölçüleri ve tahmini maliyet, Modelhaneye aktarılmıyor, yolda ölür. Yönetici M2'ye geçince "Ulan Ar-ge'de ne onaylamıştık?" diyecek sıfırdan kart açacak.
*   **Çözüm:** Ar-Ge onay butonuna tıklandığında sadece durumu güncellememeli; ürünün adını, tahmini maliyetini ve kumaşını URL parametreleri (`/modelhane?trend_id=X&kumas=keten...`) veya Merkezi State (Zustand/Context) yoluyla doğrudan M2 Kalıphane masasına çivilemelidir.

**Nihai Sonuç:**
İş emri kâğıdı (112. MD dosyası) stratejik olarak devasa bir aklı barındırsa da; sistemin şasi kaynakları (Frontend API süresi, Veritabanı Insert Yapısı ve M2'ye veri akış kanalı) bu gücü kaldıracak şekilde onarılmadan sistemi yola çıkarılamaz. İlk olarak Saatli Bomba (15sn limit) ve Verilerin 7'ye Parçalanıp Kaydedilmesi (Insert Deşifresi) işlemi yapılmalıdır.
