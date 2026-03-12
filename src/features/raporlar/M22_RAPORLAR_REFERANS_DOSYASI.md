# M22 / RAPORLAR (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/raporlar` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/raporlar/components/RaporlarMainContainer.js`
**Sistem Görevi:** Tüm veri modellerinin (`b1_uretim`, `b1_personel`, `b2_muhasebe` vb.) haftalık, aylık PDF veya Csv olarak tablo halinde dışarı döküldüğü ve görselleştirildiği genel analiz sayfası. Salt-okunurdur (ReadOnly).

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam
*   **Problemler:** Excel, PDF ve Grafikler için çekilen ağır (Big Query) limitli Supabase SQL aramalarının çok hızlı filtre değişimlerine tabi tutularak tarayıcının ve sunucunun çökmesi (DDoS simülasyonu) tehlikesi.
*   **Yapılan Ameliyatlar:** `SetTimeout(Debounce)` mimarisi form elemanlarına entegre edilmiş, bir önceki sorgu bitmeden (loading) yenisinin arama listesine düşmesi veya grafikleri render etmesi React katmanında engellenmiştir. Arayüz sekme değişimlerindeki SPA 404 hataları tamamen kapatılmıştır.
