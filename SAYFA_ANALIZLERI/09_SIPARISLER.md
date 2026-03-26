# SİPARİŞLER (M9) — Sayfa Analizi
**Rota:** `/siparisler` | **Dosya:** `src/features/siparisler/components/SiparislerMainContainer.js`  
**Görev:** Gelen siparişleri al, onayla, üretim sürecine gönder, kargola, teslimi kaydet, kasa'ya devret.

---

## ✅ MEVCUT NE VAR (kodda doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 7 sipariş durumu (beklemede→teslim→iptal→iade) | VAR | satır 28 |
| 5 kanal (Trendyol, Amazon, mağaza, toptan, diğer) | VAR | satır 27 |
| 3 para birimi (TL, USD, EUR) | VAR | satır 31-35 |
| Ürün kalemi ekleme (çoklu ürün) | VAR | satır 139-151 |
| Onaylandı → Stok otomatik düş | VAR | satır 233-251 |
| İptal/İade → Stok geri ekle | VAR | satır 289-306 |
| Teslim → Kasa tahsilat otomatik oluştur | VAR | satır 255-280 |
| %10 iskonto kalkanı (yetkisiz iskontoya blok) | VAR | satır 163-167 |
| Gecikme alarmı (%24 saat acil, 48 saat normal) | VAR | satır 428-437 |
| 5 adımlı sipariş stepper görünümü | VAR | satır 385-426 |
| Fatura yazdır | VAR | satır 21 import |
| AI (HermAI) entegrasyonu | VAR | satır 22-24 |
| Son 7 gün vs önceki 7 gün ciro karşılaştırması | VAR | satır 508-548 |
| Kargo takip numarası | VAR | satır 55-56 |
| Termin tarihi zorunluluğu | VAR | satır 612-617 |
| Sayfalı yükleme (50'şer) | VAR | satır 62 |
| Dijital adalet kilidi (onaylı sipariş silinemez) | VAR | satır 336-339 |
| Çevrimdışı kuyruk | VAR | satır 267-269 |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Kanal performans grafiği hardcoded** → satır 556-558: Mağaza %45, Toptan %35, E-Ticaret %20 sabit yazılmış, gerçek kanal bazlı hesaplama yapılmıyor
- [ ] **Karlılık badge'i `gercek_maliyet_tl` gerektirir** → satır 766-770: `s.gercek_maliyet_tl > 0` kontrolü var ama bu alan Supabase'de `b2_siparisler` tablosunda yok — her sipariş "⚪ Mrj. Yok" gösteriyor
- [ ] **Müşteri sipariş geçmişi filtreleme** → URL'de `?musteri_kodu=` parametresi alınıyor (satır 461) ama bu parametrenin uygulandığına dair filtre kodu görülmüyor
- [ ] **Üretim aşaması bağlantısı** → Sipariş `hazirlaniyor` durumunda ama hangi üretim bandında olduğu bilgisi yok
- [ ] **Ödeme takibi** → Çek/senet ödeme yöntemiyle gelen siparişlerde ödeme alındı mı? Takip yok
- [ ] **Toptan sipariş fiyatlandırması** → Toptan müşteriye otomatik indirim oranı yok; her seferinde manuel yapılıyor

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| Sipariş → Stok | VAR ✅ | Onay ve iade durumlarında otomatik stok hareketi |
| Sipariş → Kasa | VAR ✅ | Teslimde otomatik kasa kaydı |
| Sipariş → Katalog | VAR ✅ | `b2_urun_katalogu` listeniyor |
| Sipariş → İmalat | YOK | `hazirlaniyor` durumunda İmalat sayfasına otomatik üretim emri gitmiyor |
| Sipariş → Müşteri Puanı | YOK | Teslim edilince müşteri segmenti (A/B/C) güncellenmesi |
| Trendyol/Amazon API | YOK | Kanal olarak seçilse de gerçek entegrasyon yok (manuel giriş) |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `SiparislerMainContainer.js` satır 347: `String('b2_siparisler').replace(/['\"]/ / g, '')` — regex boşluk hatası (` / g` yerine `/g` olmalı)
- [ ] `gercek_maliyet_tl` sütunu `b2_siparisler` tablosunda tanımlanmamış → karlılık badge'i hiçbir zaman çalışmaz
- [ ] Kanal performans kartı (satır 556-558) tamamen hardcoded %45/%35/%20 — gerçek veri değil

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Trendyol API entegrasyonu (sipariş otomatik çekilsin)
- [ ] Müşteri portalı (müşteri sipariş durumunu kendisi görsün)
- [ ] SMS/WhatsApp: "Siparişiniz kargoya verildi" otomatik mesaj
- [ ] Kargo firması API bağlantısı (takip numarası otomatik gelsin)
- [ ] Toplu sipariş işleme (Excel'den sipariş yükle)
- [ ] Sipariş bazlı kar/zarar anlık gösterimi
- [ ] Ön sipariş / rezervasyon sistemi
