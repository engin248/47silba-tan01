# MÜŞTERİLER & CARİ HESAP (M10) — Detaylı Sayfa Analizi
**Rota:** `/musteriler` | **Dosya:** `src/features/musteriler/components/MusterilerMainContainer.js`  
**Toplam:** 527 satır  
**Görev:** Şirketin ticarı muhataplarının kaydı, risk limiti kontrolü, iletişim loglarının tutulması.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b2_musteriler` tablosu | VAR | satır 69 |
| Timeline (B-05 Müşteri İletişim Geçmişi) | VAR | satır 140-150 |
| `b0_sistem_loglari` üzerinden log tarama | VAR | satır 146 |
| 3 Kategori (Bireysel, Toptan, Mağaza) | VAR | satır 17 |
| Kara Liste & Risk Limiti Özelliği | VAR | satır 22 |
| Çift Tıklama / Spam koruması | VAR | satır 79-80 |
| Çevrimdışı (Offline) Kuyruk Kaydı | VAR | satır 104-106 |
| Mükerrer `musteri_kodu` engeli | VAR | satır 116 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. CARİ HESAPLAR (BORÇ / ALACAK) SIFIR (YOK)

**Açıklama:** Müşteri sayfasında en kritik metrik müşterinin şirkete olan borcu veya şirketin müşteriye olan borcudur.
Şu anda Musteriler sayfasında sadece Müşterinin Adı, Telefonu, Adresi yani **Telefon Rehberi (Adres Defteri)** modülü var. 
Satın alınan siparişler (M9) ve kasaya giren nakitler (M6) toplanıp `Güncel Bakiye: 25.000 ₺ (Alacaklı)` gibi bir veri üretilmiyor. 

### 2. SİPARİŞ GEÇMİŞİ LİSTESİ YOK

Müşteri iletişim geçmişi (`timeline`) `b0_sistem_loglari` tablosundan "metin içinde telefon numarası veya ad geçiyor mu" diye `contains` ile taranıyor (Zayıf bir veritabanı taraması). Ancak bu müşterinin geçmişte aldığı Siparişler (M9) tablosu taranıp liste olarak "Son Siparişleri" altında gösterilmiyor.

### 3. RİSK LİMİTİ ÇALIŞMIYOR

`risk_limiti` adında bir sütun var ancak, açık borcu (cari hesabı) hesaplanmadığı için, sipariş girerken "Bu müşteri 50.000 TL risk limitini aştı, siparişi durdur" güvenlik kalkanı işletilemiyor. Data ölü/işlevsiz olarak veritabanında duruyor.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Kasa Hareketi | Müşteri Cari | YOK | Ödeme yapıldığında bakiye düşmüyor |
| Sipariş (M9) | Müşteri Cari | YOK | Sipariş faturalandığında bakiye artmıyor |
| Sipariş Geçmişi | Müşteri Profili | YOK | Siparişler log gibi müşteriye gösterilmiyor |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Müşteri B2B Portalı** → Müşterilerin kendi şifreleriyle girip borcunu ekstresini gördüğü mini panel.
- [ ] **WhatsApp Bot Maili** → Risk limitine %90 yaklaşan tahsilat gecikmeleri için otomatik hatırlatma mesajı.
- [ ] **Segmentasyon AI** → Son 6 aydır sipariş geçmeyen (Uyumuş) müşterileri belirten churn tespiti.
