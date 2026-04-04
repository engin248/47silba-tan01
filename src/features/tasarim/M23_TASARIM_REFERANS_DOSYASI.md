# M23 / TASARIM (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/tasarim` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/tasarim/components/TasarimMainContainer.js`
**Sistem Görevi:** Tekstil atölyesindeki Tasarım Stüdyosu alanının (Vektörel çizimler, baskı, kumaş paleti seçimi vb. M1 öncesi soyut planlar) idare edildiği ana vizyon ekranı. Corel DRAW, Photoshop vs dış sistemlerindeki taslakların Mizanet'e eklendiği bulut disk noktası.

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam
*   **Problemler:** Veri formu (`form`) ve "Yukle/Analiz/Varyasyon Uret" butonlarına ardışık tıklandığında, hem Supabase Storage alanına (Görsel Bulutu) mükerrer dosya upload ediliyor, hem de Gemini API maliyeti limit sınırını zorluyordu.
*   **Yapılan Ameliyatlar:** Asenkron kilitleme altyapısıyla (islemdeId ve loading states) bir görsel uploadu ya da API analizi tamamlanana kadar tüm form disabled pozisyonuna geçmesi zorunlu kılındı. Ayrıca Next.js client component optimizasyonu ile yönlendirmeler kusursuz SPA haline getirildi.
