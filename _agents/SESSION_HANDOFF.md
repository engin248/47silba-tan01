# SESSION HANDOFF — Mizanet Projesi
> Bu dosya her yeni sohbet başında referans alınır.

## ⚠️ PROJE KİMLİĞİ (DEĞİŞMEZ)

| Bilgi | Değer |
|---|---|
| **Proje Adı** | **MİZANET** |
| **Canlı Domain** | **https://mizanet.com** |
| **Proje Klasörü** | `C:\Users\Esisya\Desktop\Mizanet` |
| **GitHub** | github.com/engin248/47silba-tan01 → main branch |
| **Vercel** | mizanet (Vercel proje teknik adı — dashboard'dan değiştirilmeli) |
| **Supabase** | cauptlsnqieegdrgotob.supabase.co |
| **Kurucu** | Engin |

> [!IMPORTANT]
> **Lumora ayrı bir projedir. Bu dosyayla ilgisi yoktur.**
> Bu projede yalnızca **Mizanet** adı kullanılır. Başka hiçbir isim kabul edilmez.

---

## 📌 MEVCUT DURUM (2 Nisan 2026)

### Tamamlanan — Isim Standartlaştırma
- ✅ `.cursorrules` → Mizanet ile tamamen yenilendi
- ✅ `package.json` → name: "mizanet"
- ✅ `layout.js` → başlık, description, keywords güncellendi
- ✅ `error.js`, `global-error.js` → footer metinleri güncellendi
- ✅ `faturaYazdir.js` → fatura HTML içindeki isimler güncellendi
- ✅ `telegram-webhook/route.js` → bot karşılama mesajı güncellendi
- ✅ `kameralar/page.js` → sayfa başlığı güncellendi
- ✅ `middleware.js` → X-Powered-By header + log mesajı güncellendi
- ✅ `hataBildirim.js` → Telegram mesajındaki domain güncellendi
- ✅ `bildirim.js`, `ajanlar.js` → yorum satırları güncellendi
- ✅ `HaberlesmeMainContainer.js` → başlık güncellendi
- ✅ `AyarlarRefactored.jsx` → placeholder güncellendi
- ✅ `ScraperKarantinaContainer.js` → confirm mesajı güncellendi
- ✅ API rapor route yorum satırları → MİZANET olarak güncellendi

### Değiştirilmeyen (Kırılma riski)
- ✅ `mizanet_decision` — kod güncellendi, Supabase kolon adı dashboard'dan yeniden adlandırılmalı
- ✅ `mizanet-realtime` — Supabase Realtime kanal adı kod'da güncellendi
- ⚠️ `offlineKuyruk.js` → `47_Nizam_Offline_DB` — IndexedDB, değişirse veri kaybolur
- ⚠️ Vercel proje teknik adı `the-order-nizam` — Vercel dashboard'dan değiştirilmeli

---

## 🚫 AÇIK GÖREVLER

### AR-GE / Browser Agent
- [ ] Browser Agent (Trendyol Kazıyıcı) — pip install browser-use, Playwright + Gemini Vision
- [ ] b1_arge_products → agent_session_id kolonu ekle
- [ ] İlk test: 5 ürün → tam okuma → Supabase kayıt

### AR-GE Sayfası Eksik Bloklar
- [ ] A Bloğu: Canlı Trend Akışı
- [ ] B Bloğu: Trend Radar (zaman serisi grafik)
- [ ] C Bloğu: Sosyal + Pazar Eşleşme
- [ ] F Bloğu: Trend Haritası

### Karargah
- [ ] Karargah KPI'ları → gerçek DB sorguları (şu an statik)

### Teknik Borç
- [ ] siparislerApi.js → limit: 200 → 50 + pagination
- [ ] Test sayfaları sil: arge_test_paneli, karargah/test-arge
- [ ] Vercel proje adını dashboard'dan mizanet olarak güncelle

---

## 🔧 ORTAM

| Bileşen | Durum |
|---------|-------|
| mizanet.com | Vercel'de deploy |
| localhost:3000 | npm run dev ile başlatılır |
| Supabase | cauptlsnqieegdrgotob.supabase.co |
| Next.js | 15.5.14, React 19 |
