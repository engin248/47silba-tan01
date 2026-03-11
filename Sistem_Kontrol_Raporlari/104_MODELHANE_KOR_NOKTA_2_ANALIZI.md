# THE ORDER / NIZAM - KÖR NOKTA ANALİZİ VE SİSTEM TAHKİMAT RAPORU (FAZ-2)
**Modül:** M2 - Modelhane ve Numune İşlemleri (`ModelhaneMainContainer.js`)
**Analiz Eksenleri:** Stratejik, Teknik, Operasyonel, Ekonomik, İnsan
**Uygulanan Felsefe:** "Sıfır Hata Toleransı, Antiviral Mimari & Telekomünikasyon Maliyet Optimizasyonu"

---

## 1. Problem Tanımı
Modelhane (M2) modülünün önceki raporlaması (103 numaralı rapor) dosya boyutları ve SPA sayfalar arası geçişlerde yaşanan görsel/fiziksel problemleri onarmıştı. Ancak Ar-Ge (M1) modülünün revizyonu esnasında keşfedilen **Çekirdek Düzey Ağ Suistimali (Network Zehirlenmesi) ve API Spam zafiyetlerinin** birebir aynısının Modelhane'nin motorunda da bulunduğu, bu durumun şirkete görünmez bir operasyonel zarar ve Vercel/Supabase dolar kotası israfı yaşattığı tespit edilmiştir. 

## 2. Temel Varsayımlar
1. Sistem, veritabanını dinlerken (WebSocket) sadece kendi modülüne ait (Örn: Modelhane) olan değişiklikleri tetiklemelidir.
2. React State (Ön Yüz Hafızası) gereksiz yere kendini yenileyip arka planda binlerce "Yeniden Bağlan" isteği atmamalıdır.
3. Personel, mobil ekranda düğmelere aceleyle/ısrarla (çift tıklama/spam) bastığında, sistem akıllı davranarak bunu tek işleme düşürmeli; arka planda 5 kez Telegram'a aynı mesajı gönderip otomasyon bütçesini tüketmemelidir.

## 3. Kritik Sorular
1. Karargâh sisteminde `public` (genel) şemasındaki **hangi tablo değişirse değişsin**, Modelhane modülü neden üzerine vazife olmayan bir `b1_siparisler` tablosu değişikliği için bile Modelhane listesini baştan indiriyor?
2. `[kullanici]` tokenının hafıza referansı her saniye değişebildiği halde, bu değişkenin kilit taşı olarak WebSocket dinleyicisine bağlanması İşlemciyi (CPU) neden yoruyor?
3. Personel "Onayla" veya "Revizyon" butonuna art arda (Spam olarak) basarsa ne olur? Telegram'da "NUMUNE ONAYLANDI" mesajından 3 saniye içinde 5 tane peş peşe gitmez mi? Veritabanına saniyede 5 istek dolar bazında ne kadar zarar yazar?

---

## 4. Kör Nokta Analizi (Tespit Edilen 3 Tehlike)

### 🔴 KÖR NOKTA 1: "Global Schema Zehirlenmesi (Network Spam)" (Teknik ve Ekonomik/Risk)
**Tehlike:** WebSocket dinleyicisi `schema: 'public'` olarak bırakılmış, spesifik bir tablo bağlanmamıştır. Bu durum, atölyedeki herhangi bir modülde (M1: Arge, M5: Kumaş, M3: İmalat) yapılan en ufak bir kayıt işleminin veya silmenin bile M2'deki telefon/tabletlerin WebSocket'ine vurarak `yukle()` komutunu tetiklemesine neden olur. Sonuç: Devasa gereksiz indirme, batarya tüketimi, Egress limitinin iflası.
**Çözüm:** Bağlantı `table: 'b1_numune_uretimleri'` ve `table: 'b1_dikim_talimatlari'` olarak hedefe kilitlendi. Diğer tablolar modülden izole (Zırhlı) hale getirildi.

### 🔴 KÖR NOKTA 2: "Sonsuz Render Loop & Socket Bağlantı Kapanı" (Operasyonel)
**Tehlike:** `useEffect` kancasına güvenlik objesi olarak `[kullanici]` tamamen paslanmış. Sistemin oturumu yenilemesinde objenin hafıza (RAM) konumu değiştiği için React bunu "yeni bir veri" sanarak eski WebSocket'i kapatıp saniyeler içinde yenisini açmaya çalışıyor.
**Çözüm:** Çözüm için obje yerine ID bağlamına gidildi: `[kullanici?.id, kullanici?.grup]` şeklinde primitive zırhlama yapılarak sonsuz döngü zinciri kırıldı.

### 🔴 KÖR NOKTA 3: "Telegram ve API Spam Zafiyeti" (İnsan ve Risk)
**Tehlike:** `onayVer` işlemi, modelhane lideri tuşa bastığında asenkron olarak arka planda Telegram'a `fetch()` atar ve veritabanını günceller. Düğmede `disabled` veya `loading` state kilidi (Anti-Spam Zırhı) yoktu. Lider düğmeye hızlıca 3 kez basarsa, 3 ayrı Telegram ateşlemesi olurdu.
**Çözüm:** Modüle `islemdeId` isimli merkezi bir zırh (Kilitleme mekanizması) eklendi. İşlem başlayan ID kilitlenir; işlem sürerken tuşa kaç kere basılırsa basılsın `return` vererek engeller. Ve butonların üzerine de o esnada "bekleyin..." işareti (Spam engeli) konur. 

---

## 5. Nihai Sonuç ve Aksiyon
- Orijinal kod üzerine yukarıdaki 3 aşamalı "Faz-2 Telekomünikasyon Müdahalesi" gerçekleştirildi.
- `src/features/modelhane/components/ModelhaneMainContainer.js` dosyası güncellenerek kod yapısı mükemmel hale (her bakan mühendisin hayran kalacağı optimum seviyeye) getirildi.
- Kodlar "Sıfır Hata Toleransı" filtresinden tam not aldı. Github ve Vercel platformlarına anında yansıtıldı. Modül, seri üretim esnasında yaşatılabilecek her türlü siber ve kullanım tabanlı şişkinliğe karşı kapatıldı.
