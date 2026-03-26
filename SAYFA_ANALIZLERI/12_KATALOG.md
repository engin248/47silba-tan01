# ÜRÜN KATALOĞU (M9) — Sayfa Analizi
**Rota:** `/katalog` | **Dosya:** `src/features/katalog/components/KatalogMainContainer.js`  
**Görev:** Satışa hazır ürün yönetimi, fiyatlandırma, stok durumu ve sipariş köprüsü.

---

## ✅ MEVCUT NE VAR (koddan doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| CRUD (ekle/düzenle/sil) | VAR | satır 369-583 |
| TL + USD çift fiyat | VAR | satır 382-383 |
| Canlı USD kuru (`/api/kur`) | VAR | satır 61-66 |
| Otomatik kar marjı hesabı | VAR | satır 398-400 |
| 3 fotoğraf URL desteği | VAR | satır 41-43 alanlar |
| KAT-03: Ana/Alt kategori hiyerarşisi | VAR | satır 23-32 |
| Varyant stok matrisi (beden x renk) | VAR | satır 206-246 |
| Toplu Excel/CSV import (B-04) | VAR | satır 441-554 |
| Şablon Excel indirme | VAR | satır 443-469 |
| Toplu fiyat güncelleme motoru (+/- %) | VAR | satır 320-367 |
| M8'den maliyet çek butonu | VAR | satır 249-318 |
| WhatsApp teklif gönderme | VAR | satır 145-157 |
| Fiyat gizleme/gösterme | VAR | satır 635-637 |
| QR Barkod oluşturma | VAR | satır 16, import |
| KAT-01: Siparişe otofill geçiş | VAR | satır 175-183 |
| Fiyat geçmişi modal | VAR | satır 186-202 |
| `b2_teklif_logs` tablosuna kayıt | VAR | satır 151-157 |
| Debounced Realtime (300ms) | VAR | satır 114-130 |
| Çevrimdışı INSERT kuyruk | VAR | satır 402-409 |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Fiyat geçmişi tablosu yok** → satır 192-201: `b2_urun_katalogu` içinden son 10 kayıt çekiliyor ama gerçek fiyat geçmişi tablosu (`b2_fiyat_gecmisi`) yok → her güncelleme önceki fiyatı eziyor
- [ ] **M8 maliyet çekme şeması yanlış** → satır 258-259: `b1_muhasebe_raporlari` tablosunda `durum='MUHASEBECI_KILITLI'` ve `urun_kodu` sütunları kontrol edildi mi? Muhasebe tablosundaki durum değerleri farklı (`kilitlendi` satır 334)
- [ ] **Foto URL ile fotoğraf yükleme yok** → 3 URL alanı var ama doğrudan dosya yükleme (Supabase Storage) sistemi yok; harici URL paste edilmesi gerekiyor
- [ ] **Kategori filtresi UI'da eksik** → satır 80: `kategoriFiltre` state var ama UI filtresinde kullanılmıyor (sadece arama var)
- [ ] **Barkod yalnızca modal → yazdır** → fiziksel barkod etiketi toplu yazdırma özelliği yok

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `maliyetleriGuncelle()` satır 258-259: `b1_muhasebe_raporlari`'nda `durum='MUHASEBECI_KILITLI'` arıyor ama gerçek durum değeri `'kilitlendi'` (satır 334 MuhasebeMainContainer.js) — eşleşme yok, her zaman "kilitlenmiş rapor bulunamadı" hatası verir
- [ ] `KatalogMainContainer.js` satır 21: `USD_KUR_VARSAYILAN = 32.5` — bu kur çok eski. Fallback kur API'dan alınmalı ya da güncel tutulmalı
- [ ] `excelBasariylaYukle()` satır 533: toplu insert'te mükerrer kayıt kontrolü yok — aynı Excel iki kez yüklenirse `urun_kodu` çakışması hatayla düşer ama sessiz geçer (satır 534-537 sadece error mesajı fırlatıyor)

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Fotoğraf yükleme (Supabase Storage veya Cloudinary)
- [ ] 360 derece ürün fotoğrafı desteği
- [ ] AI ile ürün açıklaması üretme
- [ ] E-ticaret platform senkronizasyonu (Trendyol, Shopify)
- [ ] Toplu barkod etiket yazdırma (Zebra/Dymo printer)
- [ ] Ürün varyant yönetimi (renk/beden ayrı SKU sayfaları)
- [ ] Ürün SEO metadatası (web sitesine katalog export)
- [ ] AR/VR: Müşteri ürünü sanal olarak denesin
