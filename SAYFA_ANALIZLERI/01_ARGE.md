# AR-GE & İSTİHBARAT (M1) — Sayfa Analizi
**Rota:** `/arge` | **Dosya:** `src/features/arge/components/ArgeMainContainer.js`  
**Görev:** Pazar istihbaratı, trend analizi, AI satış kararı, rakip izleme.

---

## ✅ MEVCUT NE VAR (önceki oturumda incelendi)

| Bileşen | Durum |
|---------|-------|
| b1_arge_products tablosu | VAR |
| AI satış kararı (ÇOK_SATAR/BINGO/BEKLE) | VAR |
| Trend skor hesaplama | VAR |
| Rakip fiyat analizi | VAR |
| M2'ye talep gönderme | VAR |

---

## ❌ KRİTİK EKSİKLER (DOĞRULANDI)

- [ ] **1_Scraper_Ajan.py git merge conflict** → Dosya çalışmıyor → Veri bankası boş
- [ ] **b1_arge_trendler 400 error** → Tablo kolon uyumsuzluğu
- [ ] **TikTok/Pinterest scraper yok** → Sadece Amazon/Trendyol planlanmış
- [ ] **Cron otomasyonu eksik** → vercel.json'da arge_zincir tetikleyicisi yok

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] Influencer kullanım oranı takibi
- [ ] Sezon bazlı trend geçmişi grafiği
- [ ] Trend ömrü tahmin modeli (ne kadar daha trend?)
- [ ] Rakip stok durumu izleme

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Gerçek zamanlı sosyal medya izleme (TikTok API)
- [ ] AI görsel analiz (rakip ürün fotoğrafından stil tespiti)
- [ ] Küresel trend api (WGSN, Trendalytics)
- [ ] Müşteri satın alma davranışı ML modeli
