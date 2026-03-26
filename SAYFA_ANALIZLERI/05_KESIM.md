# KESİMHANE (M5) — Detaylı Sayfa Analizi
**Rota:** `/kesim` | **Dosya:** `src/features/kesim/components/KesimMainContainer.js`  
**Toplam:** 601 satır  
**Görev:** Model taslağı alır, pastal keser, fire'ı maliyete yazar, M6 iş emri oluşturur, kumaş stokunu otomatik düşer.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| Kesim CRUD (ekle/düzenle/sil) | VAR | satır 83-128, 130-147, 254-274 |
| `b1_kesim_operasyonlari` tablosu | VAR | satır 69 |
| `b1_model_taslaklari` join (`uretime_hazir`) | VAR | satır 70 |
| `b1_kumas_arsivi` tablosu (kumaş seçimi) | VAR | satır 71 |
| Pastal kat sayısı + Net çıkan adet | VAR | satır 90-91 |
| Fire oranı girişi (kırmızı >%5 uyarı) | VAR | satır 92, 416 |
| Kullanılan kumaş miktarı (MT) girişi | VAR | satır 408 |
| 7 Beden dağılımı (XS→3XL JSON) | VAR | satır 20, 450-468 |
| Kesimci adı ve tarih alanı | VAR | satır 94, 95 |
| M5→M6 İş Emri oluşturma köprüsü | VAR | satır 150-220 |
| Mevcut aktif emir kontrolü (mükerrer engeli) | VAR | satır 157-163 |
| `production_orders` INSERT | VAR | satır 166-172 |
| Fire maliyeti → `b1_maliyet_kayitlari` (`fire_kaybi`) | VAR | satır 196-202 |
| **Fire >%5 → `b1_sistem_uyarilari` alarm** | VAR | satır 205-212 |
| Dinamik kumaş birim fiyatı çekme | VAR | satır 184-192 |
| Varsayılan kumaş fiyatı (₺250 yedek) | VAR | satır 183 |
| **M5→M2 Otomatik kumaş stok düşümü** | VAR | satır 233-248 |
| Telegram bildirimi (kesim/tamamlandı/stok/iş emri) | VAR | satır 119, 216, 230, 243 |
| QR Barkod etiketi (FizikselQRBarkod) | VAR | satır 584-588 |
| Arama (model kodu/adı/kesimci) | VAR | satır 280-282 |
| Durum filtresi (kesimde/tamamlandı/iptal) | VAR | satır 19, 36, 368-373 |
| İstatistik KPI kartları (gerçek veri) | VAR | satır 284-289 |
| Çevrimdışı çalışma (offline kuyruğa al) | VAR | satır 101-107 |
| Realtime WebSocket (`b1_kesim_operasyonlari`) | VAR | satır 52-54 |
| Çift tıklama koruması (`islemdeId`) | VAR | satır 40, 151, 223, 255 |
| Silme → soft delete (iptal durumuna çek) | VAR | satır 269 |
| `b0_sistem_loglari` kara kutu kaydı | VAR | satır 264-268 |
| Arapça dil desteği | VAR | satır 318-322 |
| `silmeYetkiDogrula` güvenlik katmanı | VAR | satır 257-260 |

> **Not:** Kesim modülü, ankete en sürpriz ve en gelişmiş modüllerden biri çıktı. Fire → Maliyet → Alarm → Stok Düşümü → İş Emri tam veri akışı ayakta. Altta belirtilen eksikler gerçek kör noktalardır.

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. `kullanilan_kumas_mt` ALANI KAYIT DIŞI KALIYOR

**Sorun (satır 88-99):** `kaydetKesim()` içindeki `payload` nesnesinde:
```js
const payload = {
    model_taslak_id: ...,
    pastal_kat_sayisi: ...,
    kesilen_net_adet: ...,
    fire_orani: ...,
    ...
    // kullanilan_kumas_mt: ??? YOK!
};
```
`kullanilan_kumas_mt` formu var (satır 408), state'e yazılıyor (satır 409), ama `payload`'a dahil edilmemiş. Kullanıcı veri girse bile veritabanına **kaydedilmiyor**.

**Sonuç:** Stok düşümü `durumGuncelle()` içinde (satır 234):
```js
if (kData && kData.kumas_topu_no && parseFloat(kData.kullanilan_kumas_mt) > 0)
```
Bu koşul asla sağlanamıyor çünkü `kullanilan_kumas_mt` veritabanında her zaman `null`. Kumaş stok düşümü görünürde var ama **çalışmıyor**.

### 2. FIRE MALİYETİ FALLBACK HESABI YANLI

**Sorun (satır 180-181):**
```js
if (toplamKumasMt > 0) kayipKumasMt = (toplamKumasMt * fireYuzde) / 100;
else kayipKumasMt = (k.kesilen_net_adet * 1.2 * fireYuzde) / 100;
```
`kullanilan_kumas_mt` veritabanına kaydedilmediği için `toplamKumasMt` her zaman 0. Fallback: `adet × 1.2mt × fire%`. Bu formül bazı ürünler için hatalı — örneğin bir çarşaf 3mt, bir çocuk takımı 0.6mt ister. `1.2mt` sabit değer gerçeği yansıtmıyor.

### 3. `b1_kumas_arsivi` TABLOSU MU, `b1_kumaslar` MI?

**Sorun (satır 71, 186-190):** Kesim sayfası `b1_kumas_arsivi` tablosunu kullanıyor:
```js
const p3 = supabase.from('b1_kumas_arsivi').select('id, kumas_kodu, renk_tanimi')...
```
Kumaş sayfasındaki `useKumas.js` ise farklı bir tablo yapısından çekiyor (`b2_malzeme_stok` veya `b2_kumas_katalogu`?). Bu iki tablo aynı mı? Şema tutarsızlığı varsa kumaş seçim listesi hatalı doluyor.

### 4. BEDEN DAĞILIMI TOPLAMIYLA NET ADET ÇAKIŞMASI

**Sorun:** Beden dağılımlarındaki (XS+S+M+L+XL+XXL+3XL) toplamı, `kesilen_net_adet` ile karşılaştırılmıyor. Kullanıcı "200 adet kestim" deyip bedenlere 50+50+50+50=200 de girebilir, 10+10=20 de girebilir. Uyarı veya doğrulama yok.

### 5. MODELİN DURUMU GÜNCELLENM İYOR

**Tasarlanan akış:** Model `uretime_hazir` → Kesim tamamlandı → model durumu bir sonraki aşamaya (örn. `kesimde` veya `uretime_gecti`) güncellenmeli.

**Kod:** `durumGuncelle()` içinde `b1_model_taslaklari` güncelleme kodu yok. Model, `kesim tamamlandı` olduktan sonra hâlâ `uretime_hazir` gözüküyor.

### 6. KESİMCİ SEÇİMİ PERSONEL TABLOSUYLA BAĞLI DEĞİL

**Sorun (satır 427-430):** `kesimci_adi` serbest metin girişi — `b1_personel` tablosundan kesimci seçisi yok. Aynı kişi farklı yazılışlarla (Ahmet, ahmet, AHMET) kaydedilebilir. Performans anali yapılamaz.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Mevcut | Sorun |
|--------|-------|--------|-------|
| M5 → M6 (İş emri) | VAR ✅ | `production_orders` INSERT |
| M5 → M7 (Fire maliyeti) | VAR ✅ | `b1_maliyet_kayitlari.fire_kaybi` |
| M5 → Alarm | VAR ✅ | `b1_sistem_uyarilari` fire >%5 |
| M5 → M2 (Kumaş stok düşümü) | GÖRÜNÜRDE VAR ❌ | `kullanilan_kumas_mt` DB'ye kaydedilmiyor |
| M5 → M3 (Model durum güncelleme) | YOK | Kesim tamamlandında model hâlâ `uretime_hazir` |
| M5 → M13 (Personel performans) | YOK | Kesimci performansı personel modülüne gitmiyor |

---

## ❌ MEVCUT KOD SORUNLARI

| # | Konum | Sorun |
|---|-------|-------|
| 1 | satır 88-99 | `kullanilan_kumas_mt` payload'da yok → DB'ye kaydedilmiyor |
| 2 | satır 183 | `kumasMtFiyat = 250` hardcoded yedek → yanlış fire maliyeti |
| 3 | satır 181 | `1.2mt` fallback hesabı ürün tipine göre değişmeli |
| 4 | satır 70 | Model filtresi `eq('durum', 'uretime_hazir')` — bu durum M3'te nasıl set ediliyor? |
| 5 | satır 591 | "Bant şefi kameraya okuttuğunda otomatik olarak üretime başlar" — barkod okuma sistemi KURULU DEĞİL |

---

## 📋 BİLGİ AKIŞI HARİTASI (GERÇEK DURUMU)

```
b1_model_taslaklari (durum=uretime_hazir)
        ↓ seçilir
b1_kesim_operasyonlari (INSERT)
        ↓ tamamlandi
b1_kumas_arsivi.stok_mt ─→ DÜŞÜM ⚠️ (kullanilan_kumas_mt null → çalışmıyor)
        ↓
production_orders (INSERT) ─→ M6 iş emri ✅
        ↓
b1_maliyet_kayitlari (fire_kaybi) ─→ M7 ✅ (fallback hesap hatalı)
        ↓
b1_sistem_uyarilari (fire >%5) ─→ Karargah alarm ✅
```

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **CAM Yazılımı** → Pastal yerleştirme optimizasyonu (bilgisayar destekli)
- [ ] **Barkod tarama sistemi** → Üretim bandında her paketin okutulması (satır 591 vaadediliyor)
- [ ] **Lazer kesim makine API** → Makine kendi fire oranını sisteme göndersin
- [ ] **Personel bağlantısı** → Kesimci metin girişi değil, personel tablosundan seçim
- [ ] **Beden bazlı üretim takibi** → S:100, M:200 kaç adet var, stokta ne kaldı?
- [ ] **Otomatik fire alarm eşiği** → Her model için farklı eşik (çarşaf vs çocuk giyim)
