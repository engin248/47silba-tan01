# STOK & DEPO YÖNETİMİ (M11) — Sayfa Analizi
**Rota:** `/stok` | **Dosya:** `src/features/stok/components/StokMainContainer.js`  
**Görev:** Üretilen ürünlerin depo stok hareketlerini kayıt altına al, kritik stok uyarısı ver.

---

## ✅ MEVCUT NE VAR (koddan doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 4 hareket tipi (giris/cikis/iade/fire) | VAR | satır 330-334 |
| Net stok hesabı (giris+iade - cikis-fire) | VAR | satır 73-83 |
| Kritik stok alarm bandı (kırmızı, pulse) | VAR | satır 210-243 |
| Telegram'a Bildir butonu | VAR | satır 232-236 |
| API üzerinden stok hareketi (`/api/stok-hareket-ekle`) | VAR | satır 123-133 |
| Kritik ürün uyarısı otomatik Telegram | VAR | satır 139-148 |
| FIFO politikası etiketi | VAR | satır 290-302 |
| CSV Sayım Formu export (STK-04) | VAR | satır 299 |
| Hareket logu (Son 200 hareket) | VAR | satır 65, 403-453 |
| Silme → b0_sistem_loglari kaydı | VAR | satır 170-175 |
| Arapça dil desteği | VAR | satır 190, 375 |
| Çevrimdışı çalışma | VAR | satır 112-119 |
| Realtime (WebSocket) | VAR | satır 47-51 |
| Raf konumu desteği | VAR | satır 108 |
| /api/stok-alarm endpoint manuel tetikleme | VAR | satır 233, 276 |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Net stok ve `stok_adeti` çift sayma riski** → satır 82-83: `const baslangicStok = u.stok_adeti || 0;` + hareketler toplanıyor — ama `stok_adeti` alanı zaten Manuel güncelleniyor → fazla say olabilir
- [ ] **Tarih bazlı stok grafiği yok** → "Son 30 günde stok nasıl değişti?" görselleştirme yok
- [ ] **Depo konumu haritası yok** → Raf konumu metni var ama depo planı/görsel yok
- [ ] **Stok yaşlandırma analizi yok** → "Bu ürün X gündür hareket görmüyor" uyarısı yok
- [ ] **Çok depo desteği yok** → Tüm stok tek bir depo altında; farklı lokasyon yok
- [ ] **Tedarikçi bağlantısı yok** → Stok girişinde "Bu ürün hangi tedarikçiden geldi?" kaydedilmiyor

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| Sipariş → Stok | VAR ✅ | Sipariş onayında `b2_stok_hareketleri` güncelleniyor |
| İmalat → Stok (Üretim tamamında) | VAR ✅ | `production_orders` completed → stok ekleniyor |
| Stok → Karargah | YOK | Kritik stok kartı Karargah'ta görünmüyor |
| Stok → Tedarikçi | YOK | "Kritik stok → tedarikçiye otomatik teklif talebi" |
| Stok → Muhasebe | YOK | Stok değeri (adet × birim maliyet) muhasebe raporuna gitmiyor |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `b2_urun_katalogu` sorgusu (satır 64): `.select('id, urun_kodu, urun_adi, ..., b2_stok_hareketleri(adet, hareket_tipi)')` — tüm hareketleri birden çekiyor. 10.000+ hareket varsa bu sorgu timeout verir
- [ ] Net stok hesabı `stok_adeti` ile hareketleri birleştiriyor (satır 82-83) — bu ikili sayım riski taşıyor; ya `stok_adeti` ya da hareketler esas alınmalı
- [ ] Hareket silme işlemi stok miktarını geri almıyor — sadece log kaydı yapıyor

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Barkod okuyucu ile stok giriş/çıkış (telefon kamerası ile QR tarama)
- [ ] Çok depo yönetimi (A Deposu, B Deposu ayrı sayımları)
- [ ] Tedarik zinciri entegrasyonu (sağlayıcıya otomatik sipariş maili)
- [ ] Stok devir hızı analizi (yavaş hareket eden ürünler listesi)
- [ ] IoT entegrasyonu (akıllı raf sensörleri ile otomatik sayım)
- [ ] Periyodik sayım yönetimi (ERP standartlarında dönem sonu sayımı)
