# KESİM DEPARTMANI (M5) — Sayfa Analizi
**Rota:** `/kesim` | **Dosya:** `src/features/kesim/components/KesimMainContainer.js`

---

## ✅ MEVCUT NE VAR
Kesim departmanı; kalıp'tan gelen pastal listesini alay düzeninde keser ve İmalat'a iletir. Modül bağlantıları: M3 (Kalıp) → M5 (Kesim) → M4 (İmalat).

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Pastal sırası planlaması yok** → Hangi pastal önce kesilecek, sipariş önceliği nasıl belirleniyor?
- [ ] **Fire kaydı M11'e gitmiyor** → Kesimde oluşan kumaş firesi stok düşümü olarak kaydedilemiyor
- [ ] **Bıçak/rulolar ekipman takibi yok** → Bakım tarihleri
- [ ] **Kaliteye göre rejeksyon kaydı yok** → Kesim kalite reddi kayıt altına alınmıyor

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Olmayan |
|-------------|---------|
| Kesim → Stok (fire düşümü) | YOK |
| Kesim → İmalat (teslim teyidi) | KISMI |
| Kalıp → Kesim (otomatik pastal listesi) | YOK |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] CAM (Computer Aided Marking) entegrasyonu
- [ ] Lazer kesim makine API bağlantısı
- [ ] Pastal verimliliği AI optimizasyonu
