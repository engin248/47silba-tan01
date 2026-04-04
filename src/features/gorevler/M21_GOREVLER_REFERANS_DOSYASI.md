# M21 / GÖREVLER (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/gorevler` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/gorevler/components/GorevlerMainContainer.js`
**Sistem Görevi:** İnsan kaynağının (Personelin) sahadaki iş emirlerini, genel temizlik, bakım, lojistik gibi işlemleri günlük planladığı ve sonuçlandırdığı "Operatif Ekran".

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam
*   **Problemler:** Liste içi "Tamamla", "Atanıyor" ve "Yeni Görev" butonlarında ardışık UI spam zafiyeti tespit edilmişti.
*   **Yapılan Ameliyatlar:** Component seviyesinde asenkron yükleyici devresi ('loading' & promise kilitleri) uygulanarak veri satırında `...` işlemleri bekletilir konuma getirilmiş, UX standartları yükseltilip Duplicate verilerin (Önne var dıyda çift temizlik görevi atanması gibi) önü kesilmiştir. Sayfanın salt-SPA yönlendirmesi 404 Mizanet doktrinine tam oturtulmuştur.
