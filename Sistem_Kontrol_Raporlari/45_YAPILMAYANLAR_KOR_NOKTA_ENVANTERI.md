# 📋 47 SİL BAŞTAN — "SIFIR KÖR NOKTA" KALAN İŞLER VE YAPILMAYANLAR ENVANTERİ

Bu liste, "Tamamlandı" dediğimiz sistemin dışında kalan, **YAPILMAMIŞ, ERTELENMİŞ VEYA FİZİKSEL EKSİKLİĞİ BULUNAN** tüm potansiyel işlemlerin dökümüdür. En küçük mimari detaydan, en büyük fabrika entegrasyonuna kadar her şey listelenmiştir.

---

## 🟥 KATEGORİ 1: GERÇEK SİBER GÜVENLİK VE VERİTABANI KİLİTLERİ (YAPILMADI)

*Şu an sistemin arayüzünde (Tablette) PİN var, ancak veritabanı "Anonim API" ile dışarıya açık.*

* [ ] **Supabase RLS (Row Level Security) Mühürleri:** `anon_key` ile bağlanan herkes postman/terminal üzerinden veritabanına veri yazabilir. Gerçek bir şirket için Supabase Auth (Gizli Token) veya Server-Side yetkilendirme (RLS Policy) yazılması **yapılmadı.**
* [ ] **Veritabanı Günlük/Haftalık Yedekleme (Backup) Senkronu:** Supabase çökme veya veri kaybı ihtimaline karşı, verilerin saatlik olarak farklı bir buluta (Örn: AWS S3 veya Google Drive) otonom olarak SQL yedeği atması **kurulmadı.**
* [ ] **Çoklu Şube / Çoklu Fabrika Ayrımı (Tenant Zırhı):** Şirket yarın 2. bir atölye veya mağaza açtığında, verilerin birbirine karışmasını engelleyecek `fabrika_id` (Multi-Tenant) mimarisi çekirdeğe **eklenmedi.**

## 🟧 KATEGORİ 2: MİMARİ "KOD/DOSYA" PARÇALANMASI (ERTELENDİ)

*Arayüzler mükemmel çalışıyor ancak yazılımın arka planındaki kodlar obez (şişman) durumda.*

* [ ] **Componentization (Modüler Mimari):** 15 sayfanın tamamı 500-600 satırlık dev `page.js` dosyaları. Bunların içindeki butonlar, tablolar, açılır pencereler (Modallar) `src/components/` klasörüne taşınıp kod satırları 100'e düşürülerek temizlenecek **(Sizin emrinizle durduruldu ve ertelendi).**
* [ ] **Global State Management (Merkezi Hafıza):** Sayfalar arası geçişlerde "Kullanıcı" verisini `Auth.js` Context'te tutuyoruz. Ancak Siparişler veya Stok verileri Redux / Zustand gibi bir Global State havuzuna **alınmadı** (Performans için gerek görülmedi, ama devleşirse şart olacak).
* [ ] **PWA (Progressive Web App) Tablet Kurulumu:** Tableti kullanan dikişçinin internet tarayıcısında (Chrome) "Geri" tuşuna basması veya yanlışlıkla sekmeyi kapatmasını engellemek için, web sitesinin telefona/tablete indirilebilir gerçek bir Mobil Uygulama (PWA) gibi kurulması **ayarlanmadı** (`manifest.json` ve `service-worker.js` eksik).

## 🟨 KATEGORİ 3: FİZİKSEL ATÖLYE ENTEGRASYONLARI (KÖR NOKTA)

*Dijital sistem tamam ama fiziksel dünya (Kağıt, Barkod, Makine) ile konuşmuyor.*

* [ ] **Barkod Okuyucu / QR Kod Çıktı Sistemi:** Kumaşa veya dikilen ürüne fiziksel olarak yapıştırılacak QR barkodunu PDF olarak yazıcıya gönderen (Print) ve barkod tabancasıyla okutulduğunda sistemi açan modül **yok.**
* [ ] **Çevrimdışı (Offline) Çalışma ve Senkronizasyon:** İnternet koptuğunda "Bağlantı Yok" kırmızı ekranı çıkıyor. Ancak internet koptuğunda işçinin çalışmaya devam etmesi ve internet geldiğinde eski verileri gizlice sunucuya yüklemesi (Offline Sync / IndexedDB) **yapılmadı.**
* [ ] **Fasona Giden / Gelen Araç İrsaliyesi:** Şoför fasona mal götürürken dijital olarak yola çıktı irsaliyesi ve kapıda mal teslim onayı (Örn: Müşteri telefonuyla SMS onayı) **yok.**

## 🟩 KATEGORİ 4: YAPAY ZEKA (AI) GERÇEK İŞLEM KASLARI (TEST EDİLMEDİ)

*Ajanların arayüzleri, tuşları ve ekranları hazır. Ancak Arka Plandaki (API) motorlarının derin testleri...*

* [ ] **Denetmen (M14) Video Analizi:** Atölyeden yüklenen mp4/video dosyasını Google Vision veya GPT-4v kullanarak gerçeğinde analiz etme yeteneğinin API sınırları (Token maliyetleri) atölye hacminde **test edilmedi.**
* [ ] **Ar-Ge Trend (M1) Otonom Karar Mekanizması:** API'nin internetten gerçekten doğru Instagram veya e-ticaret sitelerini kazıyıp kazımadığı (Web Scraping limitleri), bot korumalarına (Cloudflare) takılıp takılmadığı **test edilmedi.**

## 🟦 KATEGORİ 5: İNSAN İRADESİNE (SİZE) BIRAKILMIŞ 26 KRİTER

*Bu kriterlere kod veya yapay zeka dokunamaz. (Sizin test etmeniz gerekir).*

* [ ] **Tasarım / Renk / Göz Yorgunluğu (UX):** Kırmızı ve Mavi tonlarının 8 saat ekran başında kalacak personeli yorup yormayacağı.
* [ ] **Türkçe Anlaşılırlığı ve İşçi Direnci:** Butonlardaki "Revize Et", "Otonom", "Senkronize" gibi terimlerin lise mezunu veya yaşlı atölye çalışanları tarafından anlaşılıp anlaşılamayacağı.
* [ ] **KVKK (Kanun) ve Cihaz Fizikselliği:** Ekranlarda çalışan isimlerinin tam yazılması veya prim oranlarının şeffaflığıyla ilgili yasal KVKK izinleri... Tabletlerin atölye tozundan/neminden bozulmama fiziksel garantisi...
* [ ] **Muhasebe / Yasal E-Fatura Entg:** Sistemimiz P&L (Kâr/Zarar) çıkartıyor ama bunu Logo/NetBT gibi devletin resmî e-fatura E-Arşiv sistemlerine XML olarak göndermiyor.

---
**Rapor Özeti:** Gece boyunca %100 oranında güvenli hale getirdiğimiz yapı, **"Bizim kurduğumuz çemberin içi"** dir. O çemberin dışında kalan (Yukarıdaki 5 Kategorilik) devasa açıklar / yapmadığımız işler bunlardır. Sıfır kör nokta olması için hepsini yüzünüze vurdum Komutanım.
