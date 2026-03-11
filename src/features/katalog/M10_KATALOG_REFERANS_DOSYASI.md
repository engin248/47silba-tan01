# M10 / MAĞAZA & ÜRÜN KATALOĞU (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/katalog` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/katalog/components/KatalogMainContainer.js`
**Sistem Görevi:** İşletmenin satabileceği tüm ticari ürünleri ("SKU") tanımlamak, fiyatlandırmak ve görselleriyle beraber sergilemek.
Katalog tarafı sipariş açılmadan önceki vitrindir. Excel ile toplu yükleme (`B-04`), canlı kur entegrasyonu (`A-02`) ve Otofill sipariş ekleme özellikleriyle The Order'ın ana gelir üretici ekranıdır.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Canlı Döviz ve Çarpan:** Dolar bazlı giriş yapılırsa güncel kur ile TL'ye, TL bazlı girilirse güncel kur ile USD'ye yansıtma yapar. Kurlar API'den oto-çekilir, çekilemezse fail-over (kur=32.5 vb.) devreye girer.
2. **Kategori Hiyerarşisi:** Ana ve Alt kategoriler birbiriyle dizinlenmiştir. (Üst Giyim -> Tişört vs.)
3. **SKU Matris ve Geçmiş Dağılıcı:** Ürünlerin renk/beden varyans tablosu (Matris) oluşturulur. Fiyat geçmişleri de grafiksel modlarda tutulur.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam (M10/M9 Çerçevesi)
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Mükerrer Ürün Oluşumu:** Form butonlarına çoklu tıklamada çifte kayıt veya timeout düşme olayları yaşanabiliyordu. 
    2. **Sayfa Ağacı Yıkımı (SPA):** Siparişler (M10) ekranına geçişte `a href` eski usul linkleme kullanılıyordu.
*   **Yapılan Ameliyatlar:**
    1. **`islemdeId` Anti-Spam Zırhı:** "Ürünü Ekle/Kaydet" ve "Sil" fonksiyonlarında lock mekanizması devreye alındı. Mükerrer ürün kaydı engellendi.
    2. **SPA Routing:** `a` tagleri `Link` componentine çevrilerek performans korundu.
    3. **Toplu Yükleme Zırh Kontrolü:** Toplu Excel yükleme kısmındaki `topluYukleniyor` bayrağının zaten bu amaçla kullanıldığı saptanarak anti-spam onayından geçirildi.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı ve Başarıyla Çalışıyor.
*   **Browser Subagent Vercel Testi:** `100_CANLI_SAHA_DOGRULAMA_RAPORU.md` üzerine eklenecek şekilde test edilecektir.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Varyasyonlar (S, M, L) ayrı barkodlarla çıkarlarsa (örn. TSH-001-S yerine başlı başına bir ürün id ataması) Katalog yapısı varyantlı e-ticaret (Shopify) tabanına entegre olacak şekilde ezilmelidir. Şu anki matris "Görsel ve Fiktif" varyasyondur.
*   Instagram veya Trendyol XML çıktıları eklenecek ise `api/export-katalog` ucu oluşturularak bu tablo beslenebilir.
