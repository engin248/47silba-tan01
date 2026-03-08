# 47 SİL BAŞTAN — NİHAİ (SON) HAREKAT PLANI

Sistemin "Röntgen ve Bireysel Modül Ameliyatları" (15 Modülün iç güvenlik, PİN ve Try-Catch onarımları) tamamen bitmiştir.
Uygulamayı **"Canlıya (Üretime) Almadan Önce"** yapılması gereken **son ve elzem teknik işlemlerin** listesi aşağıdadır.

Bu liste, sistemde bırakılan son kör noktaları temsil eder.

## 🔴 AŞAMA 1: KARARGÂH (M0) AÇIKLARININ KAPATILMASI

1. **Canlı Radar (Realtime) Entegrasyonu:** Karargâh ekranı şu an 30 saniyede bir kendini güncelliyor. Bu iptal edilip, atölyeden veri girildiği o milisaniyede ana ekranın güncelleneceği `Supabase WebSocket (Realtime)` altyapısı kurulacak.
2. **Race Condition (Hızlı Görev Çakışması):** Karargâh'tan hızlı görev eklenirken aynı anda iki kere tıklanırsa görevi çift kayıt eden güvenlik açığı `UPSERT / UNIQUE` kuralıyla kapatılacak.
3. **Ana API Zırhı:** Karargâh sayfasındaki veri çekme motorları (Promise.all) hata verdiğinde tüm sayfayı beyaz ekrana düşürebilecek zayıflık, katı bir `try-catch` sarmalına alınacak.

## 🟡 AŞAMA 2: SİSTEM İSKELETİ (LAYOUT & NAVİGASYON)

4. **Geçiş Pürüzleri (Titreme Tespiti):** 15 sayfa (Atölye modülleri) arasında gezinirken `Auth.js` yetki sorguladığı için ekranda yaşanan anlık atlamalar ve titremeler optimize edilecek.
2. **Tablet / Mobil Optimizasyonu:** `layout.js` (Ana Gövde ve Menü), dikiş makinesi başındaki ustanın tabletten yanlış butona basmaması için dokunmatik hedef kurallarına uygun mu diye son kez gözden geçirilecek.

## 🟢 AŞAMA 3: UÇUŞ (CANLI YAYIN) PROVASI

6. **Build (Derleme / Compile) Testi:** Sistem terminal üzerinden `npm run build` komutuyla "Canlı Sunucu (Production)" ortamına derlenecek. Sadece geliştirme (dev) ortamında çalışıp, Canlı Yayın (Vercel/Sunucu) ortamında patlayan (gizli) kod hataları varsa temizlenecek.
2. **Kullanılmayan Veritabanı Kalıntıları:** Test sürecinde açılan çöp tablolar/sütunlar veya unutulmuş kod logları (`console.log`) temizlenecek.

## ⬛ AŞAMA 4: SAHA GERÇEKLİĞİ (İNSAN İRADESİ)

8. **26 UX Kriteri Testi:** Bu aşamada Antigravity geri çekilir. Karar (Fontlar, renkler, atölye işçisinin tableti sevip sevmediği, Türkçenin anlaşılırlığı) tamamen şirket yöneticilerine (size) aittir. Çalışan bir tablete yüklenip sahayla buluşturulur.
