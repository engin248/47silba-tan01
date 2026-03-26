# MODELHANE (M4-B) — Sayfa Analizi
**Rota:** `/modelhane` | **Dosya:** `src/features/modelhane/components/ModelhaneMainContainer.js`  
**Görev:** İlk numune dikimi, operasyon sırası belirleme, video kanıtı, fasona şablon çıkarma.

---

## ✅ MEVCUT NE VAR

| Bileşen | Durum |
|---------|-------|
| İmalat modülünün 2. penceresi — Modelhane sekmesi | VAR |
| İşlem adımı ekleme (kanban sırası) | VAR |
| Video kanıtı toggle | VAR |
| Fasona iş gönderme | VAR |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Gerçek kamera entegrasyonu yok** → Video butonu sadece renk değiştiriyor
- [ ] **Sadece ilk adım kaydediliyor** → `uretimBandiVeyaFasonaFirlat()` yalnızca `islemAdimlari[0]` kaydediyor
- [ ] **Adım süre takibi yok** → Belirlenen süre aşılınca uyarı gelmiyor
- [ ] **Numune onay süreci dijital değil** → Müşteriye numune gösterimi, onay notları yok

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Durum |
|-------------|-------|
| Modelhane → Fason iletişim | YOK — sadece lokale kaydediyor |
| Modelhane → Stok (numune kullanımı) | YOK |
| Modelhane → Maliyet (numune maliyeti) | KISMI |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] 3D prova sistemi (CLO3D entegrasyonu)
- [ ] Fason firma portal erişimi
- [ ] Müşteri numune onay sistemi (dijital imza)
- [ ] Makine başı tablet (operasyon adımlarını sahada göster)
