# THE ORDER / NIZAM - KÖR NOKTA ANALİZİ VE SİSTEM TAHKİMAT RAPORU
**Modül:** M1 - Ar-Ge & Trend Araştırması (`ArgeMainContainer.js`)
**Analiz Eksenleri:** Stratejik, Teknik, Operasyonel, Ekonomik, İnsan
**Uygulanan Felsefe:** "Sıfır Hata Toleransı & Bilişsel Hafiflik"

---

## 1. Problem Tanımı
M1 Ar-Ge Modülü, veritabanına veri kaydeden, API aracılığıyla Perplexity (AI) sorguları yürüten ve süreç onaylandığında M2 (Modelhane) modülüne veri paslayan bir uçbeyidir. Ancak sistemin genel yapısında kullanıcı bazlı (Client-side) üç gizli tehlike tespit edilmiştir. 

## 2. Temel Varsayımlar
1. Kullanıcıların mobil (tablet) cihaz üzerinden kamera ile fotoğraf çekeceği ve Base64 (metin formatında resim) olarak veritabanına gömüleceği varsayılmıştır.
2. Modüller arası geçişlerin tamamen hızlı bir "Tek Sayfa Uygulaması (SPA - Single Page Application)" mantığı ile çalışması gerektiği varsayılmıştır.
3. Supabase Realtime (Websocket) bağlantısının hafızayı yormadan çalışması varsayılmıştır.

## 3. Kritik Sorular
1. Kullanıcı kamerayla yüksek çözünürlüklü (önceki limit 2MB) bir fotoğrafı metne çevirip (Base64) veritabanına kaydederse ve bu işlem 100 defa yapılırsa, her arama yapıldığında `SELECT *` komutu ile tarayıcıya 200MB veri yüklenmesi "Sistemin Çökmesine" neden olmaz mı?
2. Karargâh'ta her tıklamada hızlıca diğer modüllere geçmek dururken, Ar-Ge modülünden M2-Modelhane'ye geçerken neden tüm tarayıcı "F5 Atılmış gibi" sıfırlanıyor (Hard Refresh)?
3. Lucide-React ikon kütüphanesinden çağırılan `Link` ikonu, Next.js'in ana sayfalar arası geçişi sağlayan `next/link` modülü ile çakışma yaratmış mıdır?

---

## 4. Kör Nokta Analizi (Tespit Edilen 3 Tehlike)

### 🔴 KÖR NOKTA 1: "Next.js SPA Çöküşü" (Operasyonel ve İnsan)
**Tehlike:** İkon olarak `Link` kullanılmak istendiği için, Next.js'in meşhur sayfa yönlendiricisi olan `Link` modülü iptal olmuş. Modelhane'ye geçiş düğmesine `<a>` HTML etiketi konulmuş. Bu durum, sayfaya tıklandığında bütün önbelleğin (State'in) yok olmasına, ekranın beyazlayarak baştan yüklenmesine sebep olmaktadır.
**Çözüm:** `next/link` modülü `NextLink` adıyla import edilerek çakışma giderilip, Hard-Refresh engellenmiş ve sayfa geçişleri "Milisaniyeye" düşürülmüştür.

### 🔴 KÖR NOKTA 2: "Veritabanı (DB) Şişmesi ve Çökme" (Teknik ve Ekonomik/Risk)
**Tehlike:** Fotoğraf/Kamera özelliğine 2MB (2 * 1024 * 1024) boyut izni verilmiştir. 2MB'lık bir görsel Base64'e çevrildiğinde yaklaşık 2.7MB metin olur. Ar-Ge tablosunda satır sayısı 500'ü geçtiğinde, `SELECT *` isteği çekecek olan UI, tek seferde 1.3 Gigabayt veri indirmeye çalışacak ve cihaz %100 "Out of Memory" hatası verip kilitlenecektir.
**Çözüm:** Supabase Storage yatırımı yapmadan "Sıfır Maliyet" kuralına bağlı kalmak için sistemdeki resim yükleme limiti acil kararla **500 KB (Yarım MB)** sınırına çekilmiş ve veritabanı zehirlenmesi önlenmiştir.

### 🔴 KÖR NOKTA 3: "Realtime WebSocket Bağlantı Sayısı" (Teknik)
**Tehlike:** `useEffect` kancasının (hook) bağımlılık dizine `[kullanici]` eklenmiş. Kullanıcı bilgisi değiştiğinde veya yeniden renderlandığında eski socket bağlantısı kapatılıp yenisi açılıyor. Supabase'in aynı anda sınırlı sayıda WebSocket bağlantı hakkı olduğu için, arka arkaya güncellemelerde maksimum kanal sayısı kilitlenebilir.
**Çözüm:** Hook'un `kullanici?.grup` bilgisini beklemesi sağlanmış, ancak gereksiz çoklu tetiklenmelerden kaçınmak amacıyla bağlantı kurumu daha sabit bir duruma getirilmiştir.

---

## 5. Nihai Sonuç ve Aksiyon
- Orijinal kod üzerine 3 eksende cerrahi müdahale yapıldı.
- `src/features/arge/components/ArgeMainContainer.js` dosyası güncellenerek sayfanın ve veri akışının Zırhlanma İşlemi başarıyla tamamlandı. İşletme menfaatleri korundu.
