# MÜŞTERİLER CRM (M10) — Sayfa Analizi
**Rota:** `/musteriler` | **Dosya:** `src/features/musteriler/components/MusterilerMainContainer.js`  
**Görev:** Müşteri kayıtları, segmentasyon, kara liste, risk limiti, iletişim geçmişi takibi.

---

## ✅ MEVCUT NE VAR (koddan doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 3 müşteri tipi (bireysel, toptan, mağaza) | VAR | satır 17 |
| Kara liste sistemi | VAR | satır 195-210 |
| Risk limiti alanı | VAR | satır 368-369 |
| A/B/C segmenti rozeti | VAR | satır 445-449 |
| İletişim geçmişi timeline (B-05) | VAR | satır 141-153 |
| Manuel not ekleme (timeline'a) | VAR | satır 155-172 |
| Arapça isim desteği | VAR | satır 346-348 |
| Sipariş geçmişi linki | VAR | satır 461-465 |
| Çevrimdışı çalışma | VAR | satır 104-111 |
| Drawer/Offcanvas form (sayfa yenilemeden açılır) | VAR | satır 326-389 |
| Realtime | VAR | satır 54-56 |
| E-posta doğrulama | VAR | satır 85 |
| Mükerrer kodu önleme | VAR | satır 125-128 |
| dil değiştirme (TR/AR) | VAR | satır 281-284 |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Segment otomatik hesaplanmıyor** → Müşteri tipi A/B/C formu var (satır 22, 187) ama form'da gösterilmiyor — `BOSH_FORM`'da `segment: 'B'` sabit, otomatik hesaplanmıyor
  - "3 ayda en az X sipariş verene A, Y-Z arası verene B" gibi kural yok
- [ ] **Risk limiti uyarısı yok** → `risk_limiti` kaydediliyor ama sipariş alırken "Bu müşterinin toplam borcu limit üzerinde" uyarısı verilmiyor
- [ ] **Toplam alışveriş tutarı görünmüyor** → Müşteri kartında "Bu müşteri şimdiye kadar toplam ₺X siparişi vardır" bilgisi yok
- [ ] **Son sipariş tarihi yok** → "Bu müşteriden son sipariş ne zaman alınmıştı?" görünmüyor
- [ ] **Timeline yalnızca b0_sistem_loglari'ndan okuyuyor** → satır 146-151: sistem loglarından filtreliyor ama sipariş geçmişi timeline'a dahil değil
- [ ] **Vergi no kullanılmıyor** → Form'da `vergi_no` var ama faturalama işlemlerinde kullanılmıyor

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| Müşteri → Sipariş | VAR ✅ | Sipariş formunda müşteri listesi |
| Müşteri → Timeline | VAR ✅ | `b0_sistem_loglari` ile not takibi |
| Müşteri → Risk Limiti uyarısı | YOK | Sipariş alırken toplam borç kontrolü |
| Müşteri → Segment otomasyonu | YOK | Segment elle belirleniyor, otomatik değil |
| Müşteri → Kasa (bakiye) | YOK | Müşteriden kaç TL tahsilat yapıldı? |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `BOSH_FORM`'da (satır 22) `segment: 'B'` tanımlı ama form UI'da segment alanı yok → segment her zaman 'B' kalabilir
- [ ] Sipariş geçmişi linki (satır 461): `/siparisler?musteri_kodu=X` → ama Siparişler sayfası bu URL parametresini işlemiyor (kod kontrol edildi)
- [ ] Timeline sorgusu (satır 146-151): `b0_sistem_loglari` içinde `musteri_kodu` ile `contains` sorgusu yapıyor — bu sorgu JSON kolonunu JSONB olarak düzgün çekiyor mu?

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Müşteri puanlama ve ödül sistemi (sadakat programı)
- [ ] Müşteri başına ciro grafiği (aylık bazda)
- [ ] Otomatik segment belirleme (sipariş hacmine göre A/B/C)
- [ ] E-posta pazarlama entegrasyonu (kampanya maili)
- [ ] WhatsApp iletişim entegrasyonu (doğrudan mesaj)
- [ ] Müşteri portalı erişim linki (siparişlerini görsünler)
- [ ] Kredi/borç takip sistemi (bakiye ekstresi)
