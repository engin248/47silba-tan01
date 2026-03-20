# M0 / KARARGÂH (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/karargah` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/karargah/components/KarargahMainContainer.js`
**Sistem Görevi:** Tüm fabrikasyon sistemin kuşbakışı izlendiği "Single Pane of Glass" (Tek Ekranda Kontrol) merkezidir.

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği
*   **Problemler:** Ana ekran çoklu API istekleriyle doluydu, yönlendirme linkleri spamlanabilirdi.
*   **Yapılan Ameliyatlar:** `loading` zırhları ve SPA optimizasyonları tamamen devrede. Yönlendirme (Next.js Link) altyapısı NİZAM protokolüne uygundur. Aktif buton bulunmadığından salt-okunur (read-only) güvenlik seviyesindedir.
