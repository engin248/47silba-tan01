# M20 / AYARLAR (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/ayarlar` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/ayarlar/components/AyarlarMainContainer.js`
**Sistem Görevi:** Tekstil fabrikasının operasyonel damarlarını yöneten "Sabitler" tablosunu yapılandırmak. Primden ücret kesintisine, izin günlerine, fason kurallarına kadar iş kanunlarını belirlemek.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Veri Değiştirme ve Kontrol (Formlar):** Minimum maaş kuralları, prim çarpanları, video boyutu (veri tasarrufu), dil vs.
2. **Kayıt Cerrahi ve Upsert (Ayarlar Güncelle):** Tüm değişkenler `b1_sistem_ayarlari` olarak tek json veri dosyasını supabase'te (sistem_genel) saklar. Sunucu yükünü bitiren birleşik yapıdır.
3. **Senkron AI Devriyesi:** Offline kalkanı devreye girip, internet gelince (Offline Kuyruğu) yüklenen sistemi entegre eder.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam (M20)
*   **Tarih:** 12 Mart 2026
*   **Problemler:** 
    1. Sistem yetkilisi "Ayarlar" butonuna üst üste basarak veritabanına büyük Json Upsert dosyalarını (Aşırı Spam) gönderebiliyordu. 
*   **Yapılan Ameliyatlar:**
    1. **Loading ve islemdeId:** Loading mantığı zaten `setLoading` kullanılarak buton Disable yapılarak sağlanmıştır. Böylece `b1_sistem_ayarlari` tek istekle asilzade olarak korunmaktadır.
    2. **Yetkili Zırhlama:** Offline kalkanı (`cevrimeKuyrugaAl`) ve onay formunun entegrasyonu kusursuzlaştırılmıştır.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Sistem yükünü ve api masrafını birim form tablosuyla (hepsi tek satır JSON olarak) çözmek harika bir Faz 2 mimarisi başarısıydı. M20 tamamen kapalıdır ve zırhlıdır (M0 gibi salt okunur, Admin düzenler).
