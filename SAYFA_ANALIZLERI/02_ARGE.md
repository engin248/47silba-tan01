# AR-GE (M1) — Sayfa Analizi
**Rota:** `/arge` | **Dosya:** `src/features/arge/`  
**Görev:** Piyasadan trend tespit et → Ürün fırsatı bul → Üretime gönder.

---

## ✅ MEVCUT NE VAR

| Bileşen | Durum |
|---------|-------|
| Trend listesi (b1_arge_trendler) | VAR ama 400 hata |
| satar_satmaz_skoru görselleştirme | VAR |
| Manuel onay/ret/bekleme butonu | VAR |
| Arama motoru (M1_AramaMotoru.js) | VAR |
| b1_arge_strategy tablosu bağlantısı | VAR |
| Gemini LLM analizörü | VAR (aktif) |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Gerçek piyasa verisi yok** → Scraper çalışmıyor, tablo boş
- [ ] **Rakip fiyat gösterimi** → Trendyol'daki rakip fiyatı görünmüyor
- [ ] **Trend geçmiş grafiği** → Ürünün 30-60 günlük skor değişimi
- [ ] **Sosyal medya hacmi** → Hashtag kaç kez görüntülendi sayısı
- [ ] **Üretim kapasitesi bağlantısı** → "Bu ürünü üretebilir miyiz?" sorusu cevaplanmıyor
- [ ] **Tahmini maliyet** → AR-GE onaylarken maliyeti nedir? (M7 ile bağlantı yok)
- [ ] **Rakip ürün görseli** → Ürünün Trendyol/Zara'daki görünümü

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olması Gereken |
|-------------|--------|----------------|
| Scraper → AR-GE | KOPUK | Python ajan veri yığsın, AR-GE görsün |
| AR-GE → Maliyet (M7) | YOK | Onay anında maliyet tahmini göster |
| AR-GE → İmalat (M3) | YOK | Onay → otomatik üretim notu |
| AR-GE → Katalog | YOK | Onaylanan ürün kataloga eklensin |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `OluIsciTaburu.js` ajan3 ve ajan4 fonksiyonları iskelet (boş)
- [ ] `1_Scraper_Ajan.py` merge conflict ile çalışmıyor
- [ ] `b1_arge_trendler` → 400 Bad Request
- [ ] `arge_zincir` cronu `vercel.json`'da yok
- [ ] `satar_satmaz_skoru` tamamen LLM çıktısı → kara kutu

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] TikTok, Pinterest, YouTube Shorts veri kaynakları
- [ ] Görsel analiz: Rakip ürünün fotoğrafından desen/kesim çıkar (CLIP/YOLO)
- [ ] Sezon takvimi bağlantısı: "Bu ürün Eylül'de satar"
- [ ] Müşteri sipariş geçmişi: "X müşteri benzer ürün almıştı" öneri
- [ ] Otomatik koleksiyon oluşturma: Trend ürünleri gruplayıp isim ver
- [ ] Tedarikçi fiyat tahmini: "Bu kumaş için tedarikçi X ₺Y'ye satar"
