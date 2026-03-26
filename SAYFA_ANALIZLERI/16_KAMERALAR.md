# KAMERALAR & GÜVENLİK (M16) — Sayfa Analizi
**Rota:** `/kameralar` | **Dosya:** `src/features/kameralar/components/KameralarMainContainer.js`  
**Görev:** Üretim sahası canlı kamera izleme, go2rtc stream entegrasyonu.

---

## ✅ MEVCUT NE VAR (önceki oturumda incelendi)

| Bileşen | Durum |
|---------|-------|
| go2rtc entegrasyonu | VAR (ama kırık) |
| HLS player bağlantısı | VAR |
| Kamera durum kontrol endpoint | VAR |

---

## ❌ KRİTİK KOD SORUNLARI (DOĞRULANDI)

- [ ] **URL YAZIM HATASI** → `theondercom` (nokta eksik) — `theonder.com` olmalı → TÜM KAMERALAR ÇEVRİMDIŞI
- [ ] **Hardcoded URL** → ENV variable yerine sabit URL kodda yazılı
- [ ] **go2rtc tünel kurulmamış** → Canlı ortamda go2rtc servisi Vercel'den erişilebilir değil

---

## ❌ EKSİK ÖZELLİKLER

- [ ] Hareket algılama & alarm (motion detection)
- [ ] Kamera kayıt arşivi (son 7 gün)
- [ ] Kamera gruplandırma (üretim bandı / depo / giriş-çıkış)
- [ ] Mobil canlı izleme

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] AI tabanlı davranış analizi (kaza tespiti)
- [ ] Üretim sayacı otomasyonu (kameradan ürün say)
- [ ] Yüz tanıma (devam sistemi)
- [ ] Çok lokasyon kamera yönetimi (fason fabrikalar)
