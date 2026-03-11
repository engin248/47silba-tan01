# 108_ARGE_OPERASYON_IS_PLANI_VE_GOREV_DAGILIMI

**Tarih/Saat:** 11 Mart 2026
**Konu:** Ar-Ge (M1) Komuta Merkezinin Zırhlı Yeniden İnşası İçin Tam Kapsamlı İs Planı ve 3 Eksenli Görev Dağılımı
**Yöntem:** Asenkron, Çarpışmasız (Zıtlıksız) Paralel Geliştirme

Komutanım, ilettiğiniz "Yolu önceden çizelim ve 3 koldan (çakışmadan) saldıralım" stratejisi askeri ve mühendislik açısından kusursuz bir yaklaşımdır. Eğer bir sistem "Böl ve Yönet" (Divide & Conquer) mimarisine uymuyorsa, tek kişinin elinde patlar. 

Aşağıdaki iş planı; UI (Arayüz), Sunucu (Yapay Zeka) ve Veritabanı (Altyapı Kör Noktaları) olarak 3 ana uca bölünmüş ve hiçbir geliştiricinin kodunun birbiriyle çakışmayacağı (Git Conflict yaratmayacağı) şekilde milimetrik olarak belirlenmiştir.

---

## 🚀 KUVVET 1: FRONTEND (ARAYÜZ VE UI) KOMUTANI
**Hedef Dosya:** `/src/features/arge/components/ArgeMainContainer.js` ve `/src/features/arge/components/ui/...`
**Amaç:** 10 sekmeli yorgun ve hantal okuma ekranını çöpe atıp, tek bir "Emir/Komuta" paneli (Single Pane of Glass) inşa etmek.

### Görev Adımları (Baştan Sona):
1. **Sekmelerin İmhası:** Mevcut kodda bulunan karmaşık sekmeler kaldırılacak.
2. **Komuta Konsolu Tasarımı:** Kullanıcının sadece hedef kelimeyi gireceği (Örn: "Avrupa Yaz Sezonu Keten Elbise Raporu") ve "KARAR AJANINI TETİKLE" butonuna basacağı temiz, büyük fontlu bir üst arama alanı.
3. **Nihai Reçete Ekranı:** "Analiz Sürüyor..." (Loading) animasyonu. Ardından ekrana düşen şey 10 tane link değil, okunaklı, hap bilgi olan ve yeşil/kırmızı renkli "Karar Başarı Skoru (Örn: %92)" içeren **Kesin Ürün Reçetesi Kartı** (Model, Kumaş, Fiyat, Satış Olasılığı).
4. **Tasarıma Paslama Butonu:** Gelen reçeteyi onaylayıp (İnsan Onayı) doğrudan `M2 (Modelhane/Tasarım)` tarafına şutlayacak "Modelhaneye Aktar" zırhlı butonu.
*Çakışma Koruması:* Bu ekip üyesi SADECE görsel (HTML/Tailwind/React UI) yapacak, veritabanına veya API çağrılarına dokunmayacaktır. Onların yerlerine sahte veri (Mock Data) yazıp bekleyecektir.

---

## 🤖 KUVVET 2: BACKEND VE YAPAY ZEKA (A.I.) KOMUTANI
**Hedef Dosya:** `/src/app/api/arge-analiz/route.js` (Yeni veya mevcut API)
**Amaç:** Cihazı yakmadan, arka planda Amazon, Zara, Instagram gibi 10 kanalı temsil eden Yapay Zeka (Karanlık Ajan) analizini yürütmek ve saniyeler içinde çıktıyı reçetelemek.

### Görev Adımları (Baştan Sona):
1. **API Route'un Açılması:** Frontend'den gelen isteği yakalayıp asenkron bir `Promise` (Kilitlenmez İşlem) başlatacak bir Endpoint inşası.
2. **Ajan Promt Mühendisliği:** AI'ya (Maliyet kuralı gereği Perplexity/Gemini API kullanılır) "Kullanıcı X ürününü sordu. Lütfen Pazar, Kumaş, Rekabet ve Satış potansiyelini öngör ve bana sadece bir JSON formatında (Model: Y, Kumaş: Z, Hedef Kitle: W) sonuç dön" komutunun kodlanması.
3. **Zaman Aşımı (Timeout) Kalkanı:** İşlem 20 saniyeyi geçerse çakılmasını önleyecek ve "Ajan yoğun, veriler derleniyor" şeklinde yedek veri dönecek sistemin yazılması.
*Çakışma Koruması:* Bu üye UI veya Supabase ile asla ilgilenmez. Sadece `http://localhost:3000/api/arge-analiz` adresine gelen POST isteğine, AI'dan aldığı akıllı Reçeteyi (JSON) cevap olarak yollamakla görevlidir. 

---

## 🛡️ KUVVET 3: VERİTABANI VE İLETİŞİM (ALTYAPI) KOMUTANI
**Hedef Dosya:** Supabase SQL Paneli ve `ArgeMainContainer.js` içindeki `useEffect` kancaları.
**Amaç:** Sistemin kota (Bandwidth) canavarına dönüşmesini engellemek ve sonsuz render tuzağını ezmek.

### Görev Adımları (Baştan Sona):
1. **DB Şema Hazırlığı:** Supabase üzerinde AI'dan dönecek tek satırlık "Ürün Reçetesi" verilerini tutacak `research_results` (Reçeteler) tablosunun SQL ile oluşturulması. Eski hantal fotoğrafların metin (Base64) yerine doğrudan Storage'a (Kova) yazılması işlemi.
2. **WebSocket (Realtime) Tahkimatı:** `verileriCek()` intiharı (`SELECT * LIMIT 200` kuralı) engellenecek. Supabase'den sadece ve sadece gelen **yeni payload fırlatılması** (1 Kilobayt) dinlenerek arayüze zerk edilecek.
3. **Render Sabitlemesi:** React uygulamasında yetki objesinin her saniye sayfa yenilettirmesi hatası düzeltilecek (`useRef` ile). 
*Çakışma Koruması:* Bu üye; Frontendci UI iskeletini bitirdiğinde ve API'ci AI motorunu bitirdiğinde, o verileri Supabase tabloları ve Realtime Socket arasındaki tellere (Network katmanına) doğru şekilde bağlamak ile mükelleftir. Görsel tasarıma karışmaz.

---

## 🏁 GENEL SİSTEM BİRLEŞTİRME (MERGE) AKIŞI:

1. **GÜN (Saat 0-1):** KUVVET 3, Veritabanı tablolarını Supabase'de açar. KUVVET 2, AI API'sini kodlar. KUVVET 1, Ar-Ge konsolunu React olarak çizer (İşlemler tamamen paralel yürür).
2. **GÜN (Saat 1-2):** KUVVET 1'in butonlarına (Analiz Et), KUVVET 2'nin API'si bağlanır.
3. **GÜN (Saat 2-3):** Analiz edilen veriler ekrana gelirken, KUVVET 3 devreye girip sonucu Supabase'e şifrelerek (Kilitler) WebSocket tetikleyicilerini test eder.
4. **NİHAİ DURUM:** Üç üye kodlarını Master Branch'te `Merge` (Birleştirir) ettiğinde, kodlarda gram çakışma (Conflict) çıkmaz, çünkü hepsi aynı uygulamanın apayrı sinir uçlarına (UI, Zeka, İskelet) müdahale etmiştir. 

Operasyon haritanız 3 parça şeklinde komutanıza sunulmuştur. Nereden (veya Hangi Kuvvet'in görevinden) başlamamı istersiniz? Emir sizin.
