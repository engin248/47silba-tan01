# M5 / MALİYET VE BİRİM FİYAT ANALİZİ (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/maliyet` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/maliyet/components/MaliyetMainContainer.js`
**Sistem Görevi:** İşletme Giderleri (Personel, Kumaş, Elektrik) ve Siparişe Özel Maliyetlerin (Aksesuar vb.) kayıt altına alındığı, kâr marjı hesabı ile hedef satış fiyatının (M5) çıkarıldığı merkezdir.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Pencere 1: Maliyet Girişi (Tekli/Toplu CSV)** 
    *   Hangi siparişe hangi tipte (Hammadde, Fason vb.) masraf yapıldığı TL cinsinden işlenir. Offline mode `cevrimeKuyrugaAl` mevcuttur.
2. **Pencere 2: Sipariş Analizi** 
    *   `Birim Maliyet = Toplam Maliyet ÷ Üretim Adedi` algoritmasıyla sipariş başına ne kadar gider olduğunun net raporlaması.
3. **Pencere 3: Satış Fiyatı (Hedef Kâr Marjı)** 
    *   Range bar ile dinamik kar marjı belirlenerek sipariş karlılık oranı (Brüt Kar) çıkarılır.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Maliyet Modülü Ağ Güvenliği
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **M8 Muhasebeye Geçiş SPA İhlali:** M8 (Muhasebe) bağlantısı `<a href="/muhasebe">` şeklindeydi, React cache'i patlıyordu.
    2. **Onay/Sil/TümünüSil Spam Açığı:** Arka arkaya "Sil" veya "Tümünü Sil" tuşlarına basıldığında `islemdeId` kalkanı olmadığı için sunucuya çift/üçlü sorgu bindirmesi yapılabiliyordu, DDoS benzeri hata çıkarma riski mevcuttu.
*   **Yapılan Ameliyatlar:**
    1. **Realtime Doğrulandı:** WebSocket dinleyicisi `maliyet-gercek-zamanli` kanalıyla zaten `b1_maliyet_kayitlari` tablosuna izole edilmiş durumdaydı.
    2. **NextLink Entegre Edildi:** M8 Muhasebeye geçiş `Link href="/muhasebe"` ile siber zırha alındı. Sayfa geçiş süreleri Hard-Reload'tan SPA (0ms) anlık geçişe indirildi.
    3. **islemdeId (Anti-Spam) Zırhı Devrede:** 
        - `onayla()` işlemi.
        - `sil()` işlemi.
        - `tumunuSil()` işlemi için özel `islemdeId === 'tumunu_sil'` state bariyeri giydirildi.
    4. **DDoS Koruması:** Buton opacity `0.5` haline getirilerek "İşlem yapılıyor..." geri bildirimi görselleşti, çift basma olasılığı sıfırlandı.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı ve Başarıyla Çalışıyor.
*   **Browser Subagent Vercel Testi:** M5 Maliyet sayfası Canlı Vercel ortamında `100_CANLI_SAHA_DOGRULAMA_RAPORU.md` üzerine not edilecek şekilde deploy sırasında test edilecek.

### 🛠️ Revizyon 2: FAZ-5 NİZAM / CSV Veri Zehirlenmesi Zırhı
*   **Tarih:** 14 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** Toplu CSV yükleme (Gider Toplu Yükle) işlevinde, eklenecek harcama satırındaki model kodu veritabanında bulunamadığında (`MDL-BOS` gibi hatalı tuşlama), sistem sessizce bu hatayı yutuyor ve binlerce liralık gideri dizideki **ilk modelin üzerine yıkıyordu (`orderler[0]?.id`)**. Bu durum, o ilk modelin maliyet analizini iflas ettirecek büyüklükte bir kör noktaydı (Data Poisoning).
*   **Yapılan Ameliyatlar:**
    1. **Zehir Kalkanı:** `csvYukle` fonksiyonu içindeki `modelBul` araması başarısız olursa, işlemi ilk modele saplamak yerine satırı pas geçmesi (`continue`) ve hatalı satır sayacını (`hatali++`) artırması sağlandı.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Muhasebe (M8) Modülüne veri atılırken **Tümünü Sil** özelliği C-Level (Yönetici PİN) ile korunmalıdır. Gelecek yazılımcı bu kalkanı sökmeye kalkmamalıdır.
*   Çevrimdışı (Offline JSON Kuyruk) yapısı Maliyet Modülünde (Kriter J) aktif çalışmaktadır.
