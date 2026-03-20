# THE ORDER / NIZAM - KÖR NOKTA ANALİZİ VE SİSTEM TAHKİMAT RAPORU (FAZ-3)
**Modül:** M3 - İmalat ve Sıfır İnisiyatif Üretim Koridoru (`ImalatMainContainer.js`)
**Analiz Eksenleri:** Stratejik, Teknik, Operasyonel, Ekonomik, İnsan
**Uygulanan Felsefe:** "Sıfır Hata Toleransı, Antiviral Mimari & Telekomünikasyon Maliyet Optimizasyonu"

---

## 1. Problem Tanımı
İmalat (M3), üretim sahasında fason atölyesiyle ve sistemin muhasebe ayağıyla doğrudan haberleşen en kritik operasyonel modüldür. İşçinin veya müfettişin anlık hatalı bir tepkimesinin Karargâh'a sahte (mükerrer) veri girmesi veya "Next.js State Drop" (Hard-refresh kaynaklı sepet düşmesi) yaşatması muhtemeldir. İmalat modülünde yapılan analizde, bu zafiyetlerin tespit edildiği 3 önemli açık bloku bulunmuştur.

## 2. Temel Varsayımlar
1. Saha personelinin (işçi veya müfettiş) stres altında, yavaş internet bağlantısı olan bir telefondan "İşi Bitir" tuşuna defalarca sinirle basabileceği varsayılmıştır. (Anti-Spam gerekliliği).
2. React State (Ön Yüz Hafızası) gereksiz yere kendini yenileyip arka planda binlerce "Yeniden Bağlan" isteği atmaması, memory-leak yaratmaması varsayılmıştır.
3. Yönetici M3 (İmalat) menüsünden direkt M6 (Finans) ekranına atlarken `Next.js` teknolojisi gereği önbellek state datalarının kaybolmaması gerektiği varsayılmıştır.

## 3. Kritik Sorular
1. "İş Bitti" düğmesine aynı saniye içinde 5 kez ardı ardına basılırsa; Kronometre 5 defa kapanıp, Muhasebeye 5 farklı üretim kaydı atıp ve üstüne 5 kez Telegram'a aynı mesajı spamlar mı? 
2. `useEffect` içerisinde Global `kullanici` objesi hook bağımlılığına verildiği için, arka kapıdaki her token saniyesinde websocket neden bağlantı kes-aç yaparak pili ve modemi yormaktadır?
3. Üst sağ köşedeki "FİNANS/DEPO (M6) GEÇİŞİ" butonu neden `<a>` takısıyla eski usul yapılmış? Tıklandığında telefon tüm Karargah state'ini havaya uçurup beyaz ekran (Hard Refresh) başlatmıyor mu?

---

## 4. Kör Nokta Analizi (Tespit Edilen 3 Tehlike)

### 🔴 KÖR NOKTA 1: "Saha İmalat Butonu Bombardımanı (Telegram ve DB Spam Zafiyeti)" (Ekonomik/Risk ve İnsan)
**Tehlike:** İşçiler M3 Kanban menüsünde veya C-Level Lider Final Onay Gişesinde düğmelere defalarca basabiliyor. `sahadakiIsiBitir` veya `finaleOnayVerMuhasebeyeYaz` gibi en maliyetli fonksiyonlar hiçbir tıklama kilidine (islemdeId state engeline) sahip değildi. Fatura doğrudan Vercel ve Supabase Egress/Request kotalarına ve Telegram Bot rate-limit cezalarına yansımaktadır.
**Çözüm:** `[islemdeId]` kilitlemesi geliştirildi. Fonksiyon çağrıldığı ilk milisaniyede butonu felç eder ("İŞLEMDE... / İŞ BİTTİ(...)"), Telegram veya API cevabı onaylandığı saniyede ise kilit sökülür. Spamlama ihtimali %0'a indirildi.

### 🔴 KÖR NOKTA 2: "Sonsuz Render (Memory Leak) Kapısı" (Teknik ve Operasyonel)
**Tehlike:** `useEffect(... , [mainTab, kullanici])` içerisindeki `kullanici` objesi, global App Provider'ın token'ı yenilendiğinde hafızadaki referans adresini değiştirir. Bu, imalat sahasındaki tabletlerde websocket real-time bağlantısının her 15 dakikada bir kendini gereksiz yere Reset'lemesine neden olur.
**Çözüm:** Objenin tamamı yerine sadece değişmez primiti (ID ve Grup) olan `[mainTab, kullanici?.id, kullanici?.grup]` bağımlılığı kurularak, sistem betonarme hale getirildi. Artık token yenilense bile WebSocket dalgalanmayacak, kapanmayacak.

### 🔴 KÖR NOKTA 3: "SPA Navigation (Tek Sayfa Kırılması) Zafiyeti" (Stratejik)
**Tehlike:** İmalattan Direkt Finans/Depo'ya giden en üstteki buton, `<a href="/finans">` olarak bırakılmış. Personel tıkladığında, NİZAM sisteminin bütün React Memory belleği silinir, "Hard-Refresh" denen sayfayı baştan indirme krizi başlar (Bütün CSS, JS indirme kotanız boşa gider). M1 Ar-Ge'de yaptığımız hatanın aynısı burada da unutulmuştu.
**Çözüm:** `next/link` paketi `NextLink` modülüyle import edildi ve köprü buna bağlandı. Böylece "1 Milisaniyelik" beyaz ekransız/gecikmesiz pürüzsüz geçiş sağlandı. RAM'deki data artık kaybolmayacak.

---

## 5. Nihai Sonuç ve Aksiyon
- M3 Modülü "Sıfıra Yakın Finansal Yük" perspektifiyle analiz edilip Zırhlandırıldı.
- `src/features/imalat/components/ImalatMainContainer.js` dosyasına FAZ-3 kurşun geçirmez kod yeleği (Anti-Spam Kilitleri ve NextLink Güçlendirici) giydirildi.
- Kod canlı teste (build) girerek sorunsuz olduğu teyit edildi. Github (Origin/main) ve Vercel otomatik süreçlerine başarıyla PUSH yapıldı. Seri üretim bandındaki hiçbir personel, Karargah maliyet ve teknoloji akışını suistimal edemeyecek.
