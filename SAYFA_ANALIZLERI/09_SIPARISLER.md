# SİPARİŞLER & YURTİÇİ/DIŞI LOJİSTİK (M9) — Detaylı Sayfa Analizi
**Rota:** `/siparisler` | **Dosya:** `src/features/siparisler/components/SiparislerMainContainer.js`  
**Toplam:** 1022 satır  
**Görev:** Trendyol, Amazon vb. kanallardan gelen siparişleri alıp/manuel girmek, faturalarını basmak, kargo takip etmek, HermAI ile e-Ticareti akıllandırmak.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b2_siparisler` tablosu | VAR | satır 119 |
| 5 Satış Kanalı (trendyol/amazon/magaza/toptan) | VAR | satır 27 |
| 7 Durum Enum (bekliyor..kargoda..iptal) | VAR | satır 28 |
| HermAI Asistan Desteği (fatura notu, satış analizi) | VAR | satır 43, 810 |
| Çoklu Para Birimi ($, €, ₺) | VAR | satır 31 |
| Fatura Yazdır Butonu (`faturaYazdir` utils) | VAR | satır 21, 570 |
| Sayfalama Koruması (K-13 Pagination) 50 Kayıt | VAR | satır 62, 118 |
| WebSocket Visibility "SIFIR MALİYET" Optimizasyonu | VAR | satır 83 |
| Ürün Ekleme (Ayrı bir form satırı dizisi - Kalemler) | VAR | satır 49, 139 |
| Kargo Numarası Pop-up Modal State | VAR | satır 55, 630 |
| Çift Tıklama Koruması | VAR | satır 58 |
| Çevrimdışı (Offline) Kuyruk Desteği | VAR | satır 8, 203 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. SİPARİŞ NUMARASI ARDIŞIK DEĞİL (TIMESTAMP BAZLI)

**Sorun (satır 137):**
```js
const siparisNoUret = () => `SIP-${Date.now().toString().slice(-8)}`;
```
Müşteri faturası/irsaliyesi için sipariş numarasının her yıl (örn: "26-SIP-0001", "26-SIP-0002" gibi) ardışık bir ID (sequence) takip etmesi gerekir (Muhasebe standardı). Burada `Date.now()` (o anın zaman damgası) alınıyor ve son 8 rakamı kullanılıyor. Bu hem fatura takibini imkansızlaştırır hem de çok çok küçük de olsa aynı mikrosaniyede çakışma riski taşır. Müşteri, faturasında "SIP-90875322" gibi anlamsız bir kod görecek.

### 2. KASA & CARİ HESAP TAKİBİ YOK (EN BÜYÜK AÇIK)

Bir müşteri "20.000 TL" lik toptan sipariş geçtiğinde:
- Sipariş formunda "odeme_yontemi: 'nakit'" vs. seçiliyor ama `b2_kasa_hareketleri`ne yazılıyor mu? (M6 Kasa sayfasında M9_Sipariş ID yoktu!)
- Sipariş onaya düştüğünde müşteri avans verdi mi? Faturanın ne kadarı ödendi kime ödendi? Kasa ve Sipariş bağımsız iki harita gibi ilerliyor. Cari tablo yok.

### 3. STOKTAN İNDİRİM (REZERVASYON) OTOMATİĞİ YOK (VEYA KOPUK)

Siparişler `b2_urun_katalogu` üzerinden (ürün fiyatını otomatik alarak) kalem ekliyor:
```js
const urun = urunler.find(u => u.id === val);
if (urun) yeni[i].birim_fiyat_tl = parseFloat(urun.satis_fiyati_tl);
```
Fakat sipariş "Onaylandı" yapılınca Kataloğun (`b2_urun_katalogu.stok_adeti`) stoğu ve `b2_stok_hareketleri` anlık düşmüyor. Sipariş ayrı bir form mantığında kalıyor. B2 Stok modülü, İmalattan gelen artıları sayarken, Satıştan çıkan eksileri sistemle entegre etmiyor.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Sipariş Tutarı | Kasa (M6) | YOK | Faturasından ne tahsil edildi takip edilemez |
| Sipariş Kalemleri | Katalog/Stok (M11) | YOK | Ürünler "Satıldı" diye fiziki stoktan düşmüyor (Rezerv yok) |
| Üretim | Sipariş | YOK | M9'da stoğu biten ürünler "M3 Kalıphane/M4 İmalata" otomatik üretim emri olarak iletilmiyor (Dinamik ERP eksikliği) |
| Trendyol / Amazon | Sipariş (M9) | YOK/BEKLEMEDE | API yazılmamış. Manuel form girişi var. |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Seri No / Barkod Tarama** → Siparişi paketlerken ürün barkodu okutup kutuya ekleme.
- [ ] **Kargo Entegrasyonu** → MNG/Yurtiçi/Aras/PTT Web API ile kargo fişi/barkodu yazdırma, kargoda durumunu bot'un kendisinin güncellemesi.
- [ ] **e-Fatura GİB Bağlantısı** → Fatura Yazdır butonunun ötesi, UBL-TR belgesini doğrudan e-Mikro vb.ye gönderme.
