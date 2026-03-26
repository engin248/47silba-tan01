# RAPORLAR & ANALİZ MERKEZİ (M15) — Sayfa Analizi
**Rota:** `/raporlar` | **Dosya:** `src/features/raporlar/components/RaporlarMainContainer.js`  
**Görev:** Tüm sistemin konsolide raporlaması — satış, maliyet, personel, P&L grafikleri.

---

## ✅ MEVCUT NE VAR (koddan doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| Recharts grafik kütüphanesi (Bar, Line, Pie) | VAR | satır 9-11 |
| Tarih aralığı filtresi (başlangıç-bitiş) | VAR | satır 47-48 |
| CSV export fonksiyonu | VAR | satır 18-30 |
| P&L raporu (gelir/gider/kar) | VAR | satır 56 |
| Personel raporu | VAR | satır 58 |
| Birim maliyet analizi | VAR | satır 55 |
| Genel/sipariş/maliyet/personel sekmeler | VAR | satır 46 |
| Supabase realtime bağlantısı | VAR | satır 70-72 |
| CSV indir butonu | VAR | satır 60 |
| Arapça dil desteği | VAR | satır 36 |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **P&L hesabı kasa verisiyle bağlanmıyor** → Raporlar gelir/gider hesaplıyor ama `b2_kasa_hareketleri` verisi boş olduğu için P&L tablosu ₺0 gösteriyor
- [ ] **Trend bazlı satış grafiği eksik** → "En çok hangi ürün kanal satıldı?" Trendyol/toptan kırılımı yok
- [ ] **Üretim maliyet trendi yok** → "Son 6 ayda birim maliyetimiz nasıl değişti?" grafiği mevcut değil
- [ ] **Kamera izleme verisi raporlara girmiyor** → Üretim verimliliği kameradan ölçülemiyor
- [ ] **Karşılaştırmalı dönem analizi yok** → "Bu ay geçen aya göre nasıl?" karşılaştırma yok

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| Kasa → Raporlar | KISMI | P&L kasa verisine bağlı ama b2_kasa boş |
| Sipariş → Raporlar | VAR ✅ | siparislerListesi çekiliyor |
| Muhasebe → Raporlar | KISMI | `devir_durumu=true` emirler listeleniyor |
| İmalat → Raporlar | YOK | Üretim verimliliği (OEE) raporu yok |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] Satır 70-72: `channel('islem-gercek-zamanli-ai')` — aynı kanal adı Personel sayfasında da kullanılıyor; bu çakışma üretebilir
- [ ] P&L raporu: gelir hesabı `b2_kasa_hareketleri` boş olduğu için ₺0 → tüm grafik boş görünüyor

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Yönetici özet dashboard (mobilde tek bakışta KPI)
- [ ] CFO raporu (dönemsel kar/zarar tablosu)
- [ ] Bütçe planlama vs gerçekleşme karşılaştırması
- [ ] Otomatik haftalık/aylık rapor maili
- [ ] BI entegrasyonu (Power BI, Tableau)
- [ ] Tahminsel analitik (AI ile gelecek ay satış tahmini)
