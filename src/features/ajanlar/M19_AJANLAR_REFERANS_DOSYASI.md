# M19 / AJANLAR (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/ajanlar` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/ajanlar/components/AjanlarMainContainer.js`
**Sistem Görevi:** AI trend raporlaması, günlük üretim denetlemesi, yedeklemeler vb. otonom yapay zeka görevlerinin komuta ve sevk edildiği ekrandır (Cron Jobs ve Manuel tetikleyiciler).

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam
*   **Problemler:** Otonom bir API'yi manuel olarak saniyede defalarca tetiklemek $ ücretine (bedeline) yol açıyordu. Görev atanamaya art arda çoklu tıklandığında veri kopyalanıyordu.
*   **Yapılan Ameliyatlar:** `islemdeId` state devresiyle `gorevGonder` ve `gorevSil` metodları kitlenmiş, her bir görev API'sini (Örn. `yeniGorev`) bitene kadar `Gönderiliyor...` zırhına geçirerek mali DDoS risklerini ortadan kaldırmıştır.
