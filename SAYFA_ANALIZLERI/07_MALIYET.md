# MALİYET MERKEZİ (M5/M7) — Sayfa Analizi
**Rota:** `/maliyet` | **Dosya:** `src/features/maliyet/`  
**Görev:** Sipariş başına maliyet gir, birim maliyet hesapla, satış fiyatı öner.

---

## ✅ MEVCUT NE VAR

| Bileşen | Durum |
|---------|-------|
| Maliyet kalemi CRUD | VAR |
| 7 maliyet tipi kategorisi | VAR |
| Birim maliyet hesabı (toplam ÷ adet) | VAR |
| Satış fiyatı önerisi (marj slider) | VAR |
| Toplu CSV yükleme | VAR |
| Onay mekanizması | VAR |
| Sipariş bazlı filtreleme | VAR |
| Realtime güncelleme | VAR |
| Çevrimdışı çalışma | VAR |
| Pagination | VAR |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Gerçek personel maliyeti entegrasyonu** → Personel sayfasındaki ücretler buraya otomatik akmamalı mı? Manuel giriliyor
- [ ] **Kümülatif maliyet trendi** → "Bu ay maliyetler geçen aya göre nasıl?" grafiği yok
- [ ] **Fire oranı analizi** → Fire tutarı var ama fire % kaçta kaç? Analiz yok
- [ ] **Tedarikçi bazlı hammadde maliyeti** → Hangi tedarikçiden alınan kumaş daha pahalı?
- [ ] **Planlanan vs gerçekleşen maliyet** → Hedef maliyet belirle, sapma göster
- [ ] **Döviz etkisi** → Hammadde ithalse USD/EUR kuru maliyet etkisi hesaplanmıyor
- [ ] **AR-GE fırsatı ile maliyet karşılaştırması** → Bu ürünü üretirsek toplam kaça mal olur?

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olması Gereken |
|-------------|--------|----------------|
| AR-GE (M1) → Maliyet | YOK | AR-GE onayında tahmini maliyet göster |
| Personel → Maliyet | YOK | İşçilik maliyeti otomatik personel ücretinden gelsin |
| Kumaş → Maliyet | YOK | Kumaş stok hareketinden otomatik hammadde maliyeti |
| Muhasebe → Maliyet | KISMI | Onaylı maliyetler muhasebe raporuna akar mı? |
| Sipariş → Maliyet | VAR | `production_orders` tablosundan çekiyor ✅ |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `MaliyetMainContainer.js` satır 72: `supabase.from('production_orders')` — bu tablo NİZAM şemasında `b2_siparisler` ile karıştırılabilir, `production_orders` ayrı bir tablo mu?
- [ ] Maliyet onay geri alma (reject) yok — sadece onayla var
- [ ] `tumunuSil` fonksiyonu tüm kayıtları siliyor, arşive almıyor (geri dönüşüm yok)

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Maliyet bütçesi modülü (yıllık/aylık hedef belirle, takip et)
- [ ] Tedarikçi fiyat geçmişi (X kumaşın 6 aylık fiyat grafiği)
- [ ] ABC maliyet analizi (hangi ürün en çok kaynak tüketiyor)
- [ ] Döviz bağlantısı (anlık USD kuru ile hammadde maliyeti)
- [ ] Maliyet simülasyonu ("personel %10 zam alırsa birim maliyet ne olur?")
- [ ] Otomatik fiyat teklifı PDF'i (müşteriye gönderilecek format)
