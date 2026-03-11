# M13 / PERSONEL & PRİM (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/personel` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/personel/components/PersonelMainContainer.js`
**Sistem Görevi:** Tüm çalışan kadrosunu barındırmak, günlük mesai takibini (devam/izin) yapmak, sistem içi "Yapay Zeka (AI) Performans ve Prim Puanlarını" derleyip ay sonu bordro Excel'ini üretmek.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Personel Kaydı ve Filtresi:** Yeni eleman açılışları, rol bazlı mesleki etiketleme (Düz Makinacı, Uygulayıcı vb.).
2. **Devam / İzin Matrisi:** Çalışanların tatil, hastalık, izin veya puantaj girişleri. Yıllık İzin (14 gün) bakiyesi düşümü ve görselleştirilmesi.
3. **Maliyet vs Üretim Prim Motoru:** Her çalışana saatlik maliyetine göre asgari üretmesi gereken ürün sayısını dayatan, bu eşiği geçerse "Prim Hakkı (%15)" kazandıran ve yazdırma/bordro çıktısı üreten motor.
4. **Offline Devam / Form İşlemleri:** İnternetsiz anlarda mesai kayıtlarını localde tutan `cevrimeKuyrugaAl` yapısı.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam (M13)
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Sistematik Hata 1:** Mesai veya prim onaylarına birden fazla tıklandığı takdirde asenkron (async) beklememesinden ötürü veritabanına ayni gün içi 2 tane devam kaydının düşmesi.
    2. **Sayfa Dökülmesi (SPA Yıkımı):** Muhasebe sayfasına geçiş tag'i href ile verildiği için memory leak tehlikesi ve baştan yükleme/Render ağacı oluşturma maliyeti.
*   **Yapılan Ameliyatlar:**
    1. **Anti-Spam (`islemdeId`):** Personel Ekle, Sil, İzin Ver, Devam Ekle ve Devam Sil butonlarının tamamına click'ten sonra State bazlı DDoS kalkanı girildi. `wait` imleci eklendi.
    2. **DOM SPA Enjeksiyonu:** Muhasebe (M8) butonuna `next/link` sarmalı (SSR/CSR dostu navigasyon) eklendi.
    3. **B0 Kara Kutu Sızdırmazlığı:** `sil` fonksiyonlarındaki veritabanı silgi mekanizmasından hemen evvel B0 sistemine hard-loglama kontrol edildi. Doğrulandı.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı, sorunsuz.
*   **Browser Subagent Vercel Testi:** `100_CANLI_SAHA_DOGRULAMA_RAPORU.md` üzerine eklenecek.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Karekod/Barkod kartlı okuma sistemi gelirse, `PersonelMainContainer` içine fiziksel ID Card reader input ref dinleyicisi eklenip `devamKaydet` motorunu otonom tetikletmek gerekecektir.
*   Şu an Prim Motoru `b1_sistem_ayarlari`ndan parametre okumaktadır. Burada hata çıkarsa varsayılan katsayı fallback'dir (0.15 oran ve 2.50 katsayı).
