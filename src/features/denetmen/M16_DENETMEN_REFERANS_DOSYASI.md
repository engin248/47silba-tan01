# M16 / DENETMEN (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/denetmen` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/denetmen/components/DenetmenMainContainer.js`
**Sistem Görevi:** Tüm veri hattındaki uyumsuzlukları, maliyet aşımlarını, eksik stokları veya yetkisiz erişimleri toplayan **Sistem Alarm Merkezidir**. AI analiz motorunu ve Big Data öğrenimini içerir.

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam
*   **Problemler:** Tarama başlatma veya AI analiz taleplerinin spam yapılması sonucu Gemini API ve Supabase limit aşımı.
*   **Yapılan Ameliyatlar:** `tarama` ve `aiYukleniyor` adlı boolean kalkanlar ile `coz` / `gozArd` metodlarına ardışık erişim kilitlenerek DDoS sızma/limit aşımı riski yok edilmiştir. UI tamamen loading statüsüne (disabled cursor) bürünür.
