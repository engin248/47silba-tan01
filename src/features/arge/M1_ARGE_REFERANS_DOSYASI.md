# M1 / AR-GE & TREND ARAŞTIRMASI (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/arge` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/arge/components/ArgeMainContainer.js`
**Sistem Görevi:** İnternet üzerindeki trendleri analiz etmek, ajanlardan veri çekmek (Perplexity API), manuel ar-ge kaydı oluşturmak ve bunları arşivleyerek zamansal bazda doğrulama döngülerine sokmak. Bu modül "Sıfırıncı Nokta" (Ground Zero) olduğu için tasarıma, oradan kalıphaneye veri aktarır.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Trend Araması:** İnternet üzerinden (Perplexity API ile) ajan araması yaptırma ve sonucu karta kaydetme.
2. **Trend Kaydetme:** Form üzerinden veya doğrudan ajan penceresinden veritabanına yeni fikir/ürün ekleme. (Offline kayıt desteği - IDB dahil).
3. **Trend Durumu Kontrolü (Onay/İptal):** İnceleniyor durumundan Onaylandı veya İptal durumuna çekme. NIZAM kuralları gereği onaylanınca M2 Kalıphaneye geçiş rotası oluşturulur.
4. **Zamansal Doğrulama & Arşiv:** Fikrleri arşivleyip 15, 30, 45 gün sonra tekrar araştırma döngüsüne alma işlevi.
5. **Trend Silme:** "İz bırakıcı" kara kutu kurallarıyla silme işlemi yapılması.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam (M1)
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Sürekli İstek (Spam):** Trend kaydetme, durum güncelleme ve silme butonlarına aşırı tıklama sonucunda yavaş internet durumunda birden fazla kayıt atılması, aynı log'un fazlaca yazılması.
    2. Butonlarda UI geri bildirimi (yükleniyor stili vs) olmaması veya yetersiz olması.
*   **Yapılan Ameliyatlar:**
    1. **UI Tabanlı `islemdeId` Kilitleri:** `setLoading(true)` mantığının dışında her kritik fonksiyona özel `islemdeId` kilit atandı (`kaydet_modal`, `durum_*`, `sil_*`). Böylece çift tetiklenmeler ağ katmanına inemeden engellendi.
    2. **Mükerrer İstek Engellemesi:** Supabase bağlantısından önce `islemdeId` blok koyuldu; işlem bitince hata veya başarı fark etmeksizin `finally` adımına benzer bir mantıkla `islemdeId(null)` aşılandı.
    3. **Cursor ve Opacity Efektleri:** Arge panosundaki butonlara `disabled={true}`, `opacity: 0.5` ve `cursor: 'wait'` zırhı eklendi.

### 🧪 Test Durumu ve Sonuçları
*   Local Build'te doğrulandı. Mükerrer gönderim korumaları aktif. SPA rotasındaki NextLink geçişi zaten "Modelhaneye Geç" butonunda mevcuttu.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Ar-Ge modülünde halihazırda offline kayıt desteği (idb üzerinden `cevrimeKuyrugaAl`) bulunmaktadır. Kilit kalkanı offline kuyruktan **önce** devreye girecek şekilde tasarlanmıştır. Bu yüzden `navigator.onLine` bağımsız kusursuz tıklama yönetimi devrededir.
*   Ajan api istek limiti için `sonAramaZamaniRef` ile yapılan 3 saniyelik anti-DDoS kuralı mevcuttur. AI bütçe optimizasyonu için elzemdir.
