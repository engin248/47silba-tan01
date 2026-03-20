# M18 / GİRİŞ (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/giris` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/giris/components/GirisMainContainer.js`
**Sistem Görevi:** Dış dünyaya açılan kapı. Admin, Üretmen, Denetmen vb. rollerin PIN bazlı doğrulamasını (AUTH Guard) üstlenir. 

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam
*   **Problemler:** PIN denemelerinde Brute Force (kaba kuvvet/hızlı tuşlama) yapılarak yetki duvarının çökertilmesi ve Next.js'in çökmesi riski.
*   **Yapılan Ameliyatlar:** `loading` zırhıyla form elemanlarına 5 sn kilit giydirilir. Eğer art arda hatalı giriş söz konusu olursa Telegram Bot API'si anında `Güvenlik İhlali Bildirimi` gönderir. Yüzey DDoS atakları bertaraf edilmiştir.
