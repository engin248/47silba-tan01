# MALİYET YÖNETİMİ (M7) — Sayfa Analizi
**Rota:** `/maliyet` | **Dosya:** `src/features/maliyet/components/MaliyetMainContainer.js`  
**Görev:** Üretim maliyet kalemleri, sipariş bazlı maliyet analizi, satış fiyatı önerisi motoru.

---

## ✅ MEVCUT NE VAR (koddan doğrulandı — önceki oturumda incelendi)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 5 maliyet tipi (kumaş/işçilik/aksesuar/fason/genel) | VAR | |
| CSV toplu yükleme | VAR | |
| Otomatik satış fiyatı önerisi (%X marj) | VAR | |
| Sipariş bazlı maliyet özeti | VAR | |
| Onay mekanizması (hesaplandi/onaylandi/kilitli) | VAR | |
| Muhasebe köprüsü (M8) | VAR | |
| Bütçe vs Gerçekleşen karşılaştırma | VAR | |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Kumaş fiyat değişimi otomasyonu yok** → Kumaş birim fiyatı değiştiğinde ilgili ürün maliyetleri otomatik güncellenmez
- [ ] **GÜG payı dinamik değil** → %15 GÜG sabit; gerçek genel gider verisi (kira, elektrik) sisteme giremiyor
- [ ] **Ortalama birim maliyet geçmişi yok** → Bir ürünün maliyeti 3 ayda nasıl değişti? Grafik yok
- [ ] **Maliyet onay zinciri 1 kişi** → m7 onayı tek yetkili; alternatif onay yolu yok

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| Maliyet → Muhasebe | VAR ✅ | Kilitlendi → M8'e geçiyor |
| Maliyet → Katalog | VAR ✅ | "M8'den maliyet çek" ile katalog güncelleniyor |
| Maliyet → Kasa | YOK | Maliyet ödemeleri kasa'ya otomatik gitmiyor |
| Maliyet → Tedarikçi | YOK | Kumaş alışlarında tedarikçi faturası maliyete eklenmiyor |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] ABC maliyet analizi (hangi ürün en fazla maliyete yol açıyor?)
- [ ] Sezon bazlı maliyet karşılaştırması
- [ ] Tedarikçi fatura otomatik import
- [ ] Döviz bazlı maliyet takibi (USD kumaş için)
