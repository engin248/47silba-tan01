# KARARGAH (Dashboard) — Sayfa Analizi
**Rota:** `/` | **Dosya:** `src/features/karargah/`  
**Görev:** Komuta merkezi. Tüm sistemi tek bakışta göster.

---

## ✅ MEVCUT NE VAR

| Bileşen | Durum |
|---------|-------|
| KPI kartları (Ciro, Sipariş, Personel, Fire) | VAR ama ₺0 gösteriyor |
| Ajan durum paneli | VAR ama hardcoded |
| Sistem uyarıları | VAR ama 400 hata |
| Hızlı erişim menüsü | VAR |
| Realtime bağlantı | VAR |
| Sabah brifing (AI) | VAR |

---

## ❌ EKSİK BİLGİ AKIŞLARI

### Şu an görülemeyen ama olması gereken:
- [ ] **Günlük üretim özeti** → Bugün kaç adet üretildi, kaç tamamlandı
- [ ] **Bant verimliliği** → Her bantın gerçek çalışma %'si (kamera + devam verisiyle)
- [ ] **Kritik stok uyarısı** → Kumaş stoğu X metreden azaldı uyarısı
- [ ] **Bekleyen onaylar sayısı** → Kasa, maliyet, sipariş onay bekleyenlerin toplam sayısı
- [ ] **Aktif sipariş durumu** → Kaç sipariş üretimde, kaç teslimde, kaç beklemede
- [ ] **Personel devam durumu** → Bugün kaç kişi geldi/gelmedi (anlık)
- [ ] **Nakit durumu** → Bugünkü kasa girişi/çıkışı net bakiye
- [ ] **Son 7 günlük ciro grafiği** → Spark line formatında mini grafik
- [ ] **AR-GE fırsat skoru** → En yüksek skorda bekleyen ürün adı + puanı

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olması Gereken |
|-------------|--------|----------------|
| Kamera → Karargah | Yok | Canlı kamera alarmı Karargah'ta görünsün |
| Personel → Karargah | Yok | Anlık aktif kişi sayısı |
| Stok → Karargah | Yok | Kritik stok kartı |
| AR-GE → Karargah | Yok | Günün en iyi fırsatı |
| Muhasebe → Karargah | Yok | Nakit pozisyonu |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `useKarargah.js` satır 199: `artisYuzde: 12` hardcoded (sabit sahte veri)
- [ ] `KarargahMainContainer.js`: `'VERİ MADENCİLERİ: 24/s'` hardcoded
- [ ] `KarargahMainContainer.js`: `'ANALİSTLER: 18ms'` hardcoded
- [ ] KPI kartları `₺0` gösteriyor (Supabase veri yok veya RLS kısıtlı)
- [ ] `b1_sistem_uyarilari` tablosu → 400 Bad Request

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Çoklu fabrika/lokasyon seçimi (dropdown ile şube değişimi)
- [ ] Mobil app push notification → Karargah'taki kritik uyarılar telefona
- [ ] Shift bazlı görünüm (Sabah vardiyası / Gece vardiyası)
- [ ] Yönetici vs Ustabaşı vs Koordinatör → farklı dashboard görünümleri
- [ ] Export: Günlük brifing PDF'i otomatik e-posta ile yöneticiye gönder
- [ ] Müşteri bazlı KPI: "X müşteri siparişi bu ay nerede?"
- [ ] Tahmin modeli: "Yarın kaç adet üretilmesi gerekiyor?"
- [ ] ERP entegrasyonu: Muhasebe yazılımlarıyla (Logo, Mikro) bağlantı
