# RAPORLAR — Sayfa Analizi
**Rota:** `/raporlar` | **Dosya:** `src/features/raporlar/`  
**Görev:** Şirket geneli finansal ve operasyonel raporlar, grafikler, exportlar.

---

## ✅ MEVCUT NE VAR

| Bileşen | Durum |
|---------|-------|
| Genel özet (KPI kartları) | VAR |
| Sipariş dağılımı Bar Chart (Recharts) | VAR |
| Maliyet dağılımı Pie Chart (Recharts) | VAR |
| Birim maliyet tablosu | VAR |
| Kar & Zarar özeti (P&L) | VAR |
| Sipariş listesi | VAR |
| Personel performans raporu | VAR |
| Tarih filtresi (başlangıç-bitiş) | VAR |
| Hızlı filtre (Bu hafta, Bu ay) | VAR |
| CSV export | VAR |
| PDF yazdır (window.print) | VAR |
| Erişim koruması (PIN/tam grup) | VAR |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Karşılaştırmalı Analiz sekmesi tamamen sahte veri** (satır 413-416 hardcoded: ₺125.000, ₺25.000...)
- [ ] **Trend analizi grafiği** → Aylık ciro değişimi (Line Chart) yok
- [ ] **Sipariş teslim süresi analizi** → Ortalama kaç günde teslim?
- [ ] **Müşteri bazlı rapor** → Hangi müşteri ne kadar sipariş verdi?
- [ ] **Ürün/model bazlı kar analizi** → Hangi model en çok kazandırıyor?
- [ ] **Personel başına verimlilik** → Kişi başına üretim değeri
- [ ] **Kumaş fire analizi grafiği** → Dönemsel fire oranları
- [ ] **Hedef vs gerçekleşen** → "Bu ay ₺500k hedefimizin %78'indeydik"

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olması Gereken |
|-------------|--------|----------------|
| Muhasebe → Raporlar | KISMI | `b1_muhasebe_raporlari` çekiyor ama kilitlilik koşulu var |
| Personel → Raporlar | VAR | Personel raporu sekmesi mevcut ✅ |
| Stok → Raporlar | YOK | Stok hareketleri raporu yok |
| Kamera → Raporlar | YOK | Günlük alarm sayısı raporu yok |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `RaporlarMainContainer.js` satır 413-416: Karşılaştırmalı sekmede 4 kart hardcoded sahte veri
- [ ] `b1_muhasebe_raporlari`'ndan `devir_durumu= true` filtresi var — raporlar sadece "kilitli" muhasebe için mi çalışıyor?
- [ ] PDF/Yazdır `window.print()` ile çalışıyor — sayfa geneli yazdırıyor, rapor formatı yok

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Gerçek PDF raporu (şirket logolu, formatlı)
- [ ] Otomatik aylık rapor e-postası
- [ ] Dashboard embed (yönetici için sadece okuma modunda link)
- [ ] Vergi raporu (KDV, stopaj hesapları)
- [ ] Müşteri portföy analizi (Pareto: ilk 20 müşteri cironun %80'ini yapıyor mu?)
- [ ] Sezonluk tahmin modeli (AI ile gelecek ay tahmini)
- [ ] Benchmark karşılaştırma (sektör ortalamasıyla kıyaslama)
