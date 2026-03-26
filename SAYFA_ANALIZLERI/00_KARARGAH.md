# KARARGAH (M0) — Sayfa Analizi
**Rota:** `/karargah` | **Dosya:** `src/features/karargah/components/KarargahMainContainer.js`  
**Görev:** Sistemin komuta merkezi. Tüm modüllerin anlık KPI özeti, uyarılar, sistem sağlık durumu.

---

## ✅ MEVCUT NE VAR (önceki oturumda incelendi)

| Bileşen | Durum |
|---------|-------|
| KPI kartları (6 adet) | VAR (ama hardcoded) |
| Sistem uyarıları (b1_sistem_uyarilari) | VAR |
| Kasa özet widget | VAR (₺0 gösteriyor) |
| Hızlı link butonları (tüm modüllere) | VAR |
| Telegram bildirim tetikleme | VAR |

---

## ❌ KRİTİK EKSİKLER (DOĞRULANDI)

- [ ] **KPI'lar hardcoded** → "₺2.4M ciro", "%94 doluluk" vb. sabit metin — gerçek Supabase verisi değil
- [ ] **b1_sistem_uyarilari boş** → Tablo yaratıldı ama scraper yazmıyor; uyarı hiç gelmiyor
- [ ] **b2_kasa_hareketleri boş** → Kasa özeti ₺0
- [ ] **Modeller arası köprü eksik** → Karargah diğer modülleri okuyamıyor (her modül kendi tablosunu okuyor)

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] Gerçek zamanlı üretim adet sayacı
- [ ] Bugün kaç sipariş alındı? (gerçek)
- [ ] Kritik stok uyarı sayısı (gerçek)
- [ ] En çok satan ürün (gerçek, son 7 gün)
- [ ] Kasa nakit pozisyonu (gerçek)

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Mobil Karargah uygulaması (CEO panosu)
- [ ] Anomali tespiti AI (normal dışı KPI'larda uyarı)
- [ ] Veri karşılaştırma (bu hafta vs geçen hafta otomatik)
- [ ] Sesli komut kontrol merkezi
