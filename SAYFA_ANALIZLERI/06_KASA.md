# KASA (M6) — Sayfa Analizi
**Rota:** `/kasa` | **Dosya:** `src/features/kasa/components/KasaMainContainer.js`  
**Görev:** Şirketin tüm nakit akışını yönet. Tahsilat, ödeme, çek, senet, avans kayıt ve onay.

---

## ✅ MEVCUT NE VAR (kodda doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 6 hareket tipi (tahsilat, iade, çek, senet, avans, diğer) | VAR | satır 43 |
| 6 ödeme yöntemi (nakit, EFT, kredi kartı, çek, senet, diğer) | VAR | satır 44 |
| Müşteri bağlantısı | VAR | satır 119-120 |
| Personel bağlantısı (avans köprüsü M13) | VAR | satır 70, 52 |
| Realtime WebSocket (b2_kasa_hareketleri) | VAR | satır 90 |
| Sekme kapatınca WS koparma (maliyet tasarrufu) | VAR | satır 87-99 |
| 10sn timeout DDoS kalkanı | VAR | satır 116 |
| Onay mekanizması | VAR | |
| Çift tıklama koruması | VAR | satır 77 |
| Pagination (50'şer yükleme) | VAR | satır 78 |
| CSV export | VAR | satır 13-41 |
| Vade tarihi takibi | VAR | satır 50 |
| Çevrimdışı kuyruk | VAR | import satır 2 |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **KPI ₺0 sorunu** → `b2_kasa_hareketleri` tablosunda gerçek veri yok veya RLS kısıtlı (Karargah da ₺0 gösteriyor)
- [ ] **Açık vade takibi** → Vade tarihi alanı var ama:
  - Vadesi geçmiş tahsilatları listeleyen bir sekme/uyarı yok
  - Toplam açık alacak hesabı yok
- [ ] **Günlük/Aylık kasa özeti** → "Bu gün ne kadar para girdi, ne kadar çıktı?" anlık bakiye görünümü yok
- [ ] **Çek/Senet takibi** → Çek tutulma tarihi, bankaya verilmesi gereken tarih takibi yok
  - `cek` ve `senet` hareket tipi var ama özel takip paneli yok
- [ ] **Toplam nakit pozisyonu** → "Elimizde şu an kaç TL nakit var?" sorusu cevaplanmıyor
- [ ] **Avans geri ödeme takibi** → Personele verilen avans kasa'da görünüyor ama geri ödendi mi? Takip yok

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| Sipariş → Kasa | VAR ✅ | Sipariş tesliminde otomatik tahsilat kasa'ya yazılıyor |
| Personel → Kasa | VAR ✅ | Avans köprüsü çalışıyor |
| Muhasebe → Kasa | YOK | Kasa hareketleri muhasebe raporuna aktarılmıyor |
| Karargah → Kasa | YOK | KPI'daki kasa verisi ₺0 gösteriyor (tablo boş) |
| Banka hesabı | YOK | EFT/Havale hareketleri hangi banka hesabında? |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `b2_kasa_hareketleri` tablosu Supabase'de boş — gerçek veri girilmemiş
- [ ] Onaylanmış ve bekleyen hareketlerin toplam ayrımı istatistik kartlarında gösterilmiyor
- [ ] CSV export fonksiyonu `vade_tarihi` kolonu için `b2_musteriler?.ad_soyad` referansı var (satır 27) ama müşteri join her zaman yüklü olmayabilir

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Çek portföy yönetimi (tüm çeklerin bankaya sunulacağı takvim)
- [ ] Banka hesabı bağlantısı (EFT → hangi banka hesabına geldi)
- [ ] Döviz kasa (USD, EUR hareketleri ayrı bakiye)
- [ ] Kasa limitli uyarı ("Nakit ₺X'in altına düştü")
- [ ] Mal karşılığı ödeme kaydı
- [ ] e-Dönüşüm bağlantısı (e-fatura, e-irsaliye)
- [ ] Günlük kasa kapanış raporu (Z-raporu benzeri)
