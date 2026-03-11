# M4 / MODELHANE VE TEKNİK FÖY (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/modelhane` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/modelhane/components/ModelhaneMainContainer.js`
**Sistem Görevi:** M3'ten (Kalıp / Kesim) gelen bedenlerin numunesinin dikildiği, Fason üretime girmeden önce videolarla (Dikim Talimatnamesi) kanıtlandığı ana üretim laboratuvarıdır. 

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Pencere 1: Numune Kayıtları** 
    *   İlk ürün çıkarılır. Fotoğrafları çekilir. NİZAM Mükerrer Kayıt zırhından dolayı 1 Modele aynı bedende 1'den fazla numune dikilemez.
2. **Pencere 2: Dikim Talimatları (Video Kanıt Kuralı)** 
    *   Fason üreticisine gönderilecek video/ses kaydı yüklenir. "Adım 1: Düz.M (5 dk)", "Adım 2: Overlok (3 dk)" gibi üretim safhaları işlenir. Bu sayede üretim bandı başlar. (Video yoksa Fason kilitlenir).
3. **Pencere 3: Teknik Föyler ve Fotoğraf Galerisi** 
    *   Üretim kalitesini garanti altına alan tüm dosyalar Cloud bazlı depolanır. Göster/Sil eylemleri mevcuttur.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Modelhane Modülü Ağ Güvenliği
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **DB Şişmesi ve Caching Sorunu:** Websocket public dinleyicisi açıktı.
    2. **M3 İmalata SPA ile Geçiş Yoktu:** Önceki sistemde HTML `<a href>` takısıyla SPA bozularak sayfalar yenileniyor, White-Screen yaratıyordu.
    3. **Onay Spamlaması:** Atölye lideri 3 Numuneye aynı anda OnayVer tuşuna bastığında React state döngüsüne girip rendera kilitleniyordu.
*   **Yapılan Ameliyatlar:**
    1. **Realtime Kesildi, Hedeflendirildi:** Yalnızca `b1_numune_uretimleri` ve `b1_dikim_talimatlari` hedeflendi (`m2-gercek-zamanli-ai` kanalı üzerinden).
    2. **NextLink (Next/Link) Entegre Edildi:** "🚀 Üretime / İmalata Geç (M3)" butonu NextLink ile giydirildi.
    3. **islemdeId (Anti-Spam) Zırhı Devrede:** 
        - `onayVer()` numune onayı siber kilit altına alındı (Hem "Onayla", hem "Revizyon").
        - `sil()` eylemleri spam-korumalı yapıldı.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı ve Başarıyla Çalışıyor.
*   **Browser Subagent Vercel Testi:** M4 Başarıyla Yayındadır.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Hiçbir yetkili spam kalkanı `islemdeId` state'ini devre dışı bırakamaz. Aksi halde veri mükerrerliği yaşanır.
*   **Mükerrerlik Korucu Zırhı (U Kriteri)** numunelerde de, talimatlarda da mevcuttur; bunu `supabase` sorgu kodlarından kimse silmemeli.
*   Yeni fonksiyon eklenecekse **ÖNCE** bu kök dosyaya (`M4_MODELHANE_REFERANS_DOSYASI.md`) gelip `Revizyon 2` ile belgelendirmek kanuni zorunluluktur.
