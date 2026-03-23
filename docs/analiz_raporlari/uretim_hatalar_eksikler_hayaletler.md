# 🔴 ÜRETİM / İMALAT — TÜM HATALAR, EKSİKLER VE HAYALETLER

**Tarih:** 16 Mart 2026 | **Denetim Tipi:** Satır-satır kod taraması

---

## 🏷️ HATA KATEGORİLERİ

| Kategori | Simge | Açıklama |
|---|---|---|
| 🧟 HAYALET | Kodda referansı var ama gerçekte var olmayan / kullanılmayan |
| 💀 KIRIK | Çalışmayan link, route, import veya fonksiyon |
| 🔧 HARDCODED | Sabit yazılmış, dinamik olması gereken değer |
| 🕳️ BOŞ | Fonksiyon tanımlı ama içi boş / placeholder |
| ⚔️ ÇATIŞMA | İki modül aynı şeyi farklı şekilde yapıyor |
| 🔓 GÜVENLİK | PIN/yetki kontrolünde tutarsızlık |

---

## 🧟 HAYALET TABLO: `b1_uretim_kayitlari`

> [!CAUTION]
> **Bu tablo hiçbir üretim sayfasında kullanılmıyor. Ama 7 ajan sistemi bu tabloyu 6 yerde okuyor/yazıyor!**

**Ajanların baktığı → hayalet tablo:**
| Ajan | Satır | Ne yapıyor |
|------|-------|-----------|
| Sabah Subayı | [ajanlar-v2.js:108](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/lib/ajanlar-v2.js#L108) | Gecikmiş üretim emirlerini `b1_uretim_kayitlari`'dan arıyor |
| Akşamcı | [ajanlar-v2.js:204](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/lib/ajanlar-v2.js#L204) | Bugün tamamlanan üretimi `b1_uretim_kayitlari`'dan sayıyor |
| Akşamcı | [ajanlar-v2.js:248](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/lib/ajanlar-v2.js#L248) | Yarım kalan işleri `b1_uretim_kayitlari`'dan çekiyor |
| Zincirci | [ajanlar-v2.js:483-494](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/lib/ajanlar-v2.js#L483-L494) | M6→M7 geçişini `b1_uretim_kayitlari`'dan izliyor |
| Muhasebe Yazıcı | [ajanlar-v2.js:783](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/lib/ajanlar-v2.js#L783) | Tamamlanan üretimi `b1_uretim_kayitlari`'dan sayıyor |
| AjanlarUI | [AjanlarMainContainer.js:22,32,35,57,88](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/ajanlar/components/AjanlarMainContainer.js#L22) | 5 kontrol noktasında `b1_uretim_kayitlari` referansı |

**Gerçekte kullanılan tablolar:**
- `/uretim` (M14) → `production_orders` + `b1_maliyet_kayitlari`
- `/imalat` (M3) → `production_orders` + `v2_production_orders` + `v2_order_production_steps`

**Sonuç:** Ajanlar boş bir tabloya bakıyor. Hiçbir alarm çalmayacak, hiçbir rapor doğru olmayacak.

---

## 💀 KIRIK LINK: `/finans` Route'u

**Dosya:** [ImalatMainContainer.js:363](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/imalat/components/ImalatMainContainer.js#L363)

```jsx
<NextLink href="/finans" style={{ textDecoration: 'none' }}>
    💼 FİNANS / DEPO (M6) GEÇİŞİ
</NextLink>
```

**Problem:** `/finans` route'u `src/app/` altında **mevcut değil**. Bu butona basıldığında Next.js 404 sayfası açılacak.

---

## ⚔️ ÇATIŞMA: İKİ MODÜL AYNI TABLOLARI FARKLI ŞEKİLDE KULLANIYOR

### Tablo Kullanım Haritası
```
/uretim (M14)                    /imalat (M3)
─────────────                    ────────────
production_orders                production_orders (SELECT + UPDATE)
  → SELECT *, JOIN model         v2_production_orders (INSERT)
  → INSERT (yeni iş emri)       v2_order_production_steps
  → UPDATE durum                 v2_models
  → DELETE (arşivle)             v2_production_steps
                                 v2_model_workflows
b1_maliyet_kayitlari             b1_maliyet_kayitlari (INSERT)
b1_muhasebe_raporlari            
b1_personel                      v2_users (personel olarak!)
```

> [!WARNING]
> **Aynı `production_orders` tablosu iki farklı modülden hem okunuyor hem yazılıyor.** Bir modülden oluşturulan iş emri diğerinde görünüyor ama statü mantığı farklı olduğu için karışıklık doğar.

---

## 🔓 GÜVENLİK: PIN KONTROLÜ TUTARSIZLIĞI

| Modül | Session Key | Kontrol Yöntemi |
|-------|------------|----------------|
| `/uretim` (M14) | `sb47_uretim_pin` | `atob()` ile decode → catch fallback |
| `/imalat` (M3) | `sb47_uretim_token` | `!!sessionStorage.getItem()` direkt kontrol |

**Problem:** İki modül farklı session key kullanıyor. Kullanıcı M14'e giriş yapmış olsa bile M3'e girişi reddedilebilir veya tam tersi.

**Dosya referansları:**
- [UretimSayfasi.js:38](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/uretim/components/UretimSayfasi.js#L38): `sb47_uretim_pin` + `atob()`
- [ImalatMainContainer.js:68](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/imalat/components/ImalatMainContainer.js#L68): `sb47_uretim_token`

---

## 🔧 HARDCODED DEĞERLER (Sabit Yazılmış)

### 1. Maliyet Hesaplaması — 42dk × 4TL
**Dosya:** [ImalatMainContainer.js:309-311](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/imalat/components/ImalatMainContainer.js#L309-L311)

```javascript
const operasyonZamaniDk = 42; // Sembolik standart süre
const dakikaMaliyeti = 4;     // Ortalama Bant işçilik baremi
const toplamMaliyet = operasyonZamaniDk * dakikaMaliyeti; // = 168₺ HER ZAMAN
```

**Problem:** Her onaylanan iş için **HER ZAMAN 168₺** maliyet yazılıyor. Gerçek kronometre süresi, zorluk katsayısı, personel sayısı → hiçbiri hesaba katılmıyor.

### 2. Kronometre Görüntüsü — Hep "42 dk" Sabit
**Dosya:** [ImalatMainContainer.js:731](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/imalat/components/ImalatMainContainer.js#L731)

```jsx
<div className="font-black text-2xl">42 <span>Dk / Adet</span></div>
```

**Problem:** Müfettiş onay penceresi her zaman "42 Dk" gösteriyor. Gerçek üretim süresi `start_time` - `end_time` farkından hesaplanmıyor.

### 3. Maliyet Sınırı Kontrolü — Hep "GÜVENLİ"
**Dosya:** [ImalatMainContainer.js:735](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/imalat/components/ImalatMainContainer.js#L735)

```jsx
<div className="font-black text-2xl text-emerald-600">GÜVENLİ</div>
```

**Problem:** Maliyet sınırı aşılsa bile her zaman "GÜVENLİ" yazıyor. Gerçek vs hedef karşılaştırma yapılmıyor.

---

## 🕳️ BOŞ FONKSİYONLAR

### 1. FPY (Kusursuzluk Puanı) Hesaplaması
**Dosya:** [ImalatMainContainer.js:322-323](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/imalat/components/ImalatMainContainer.js#L322-L323)

```javascript
// FPY (Kusursuzluk) Onayı
if (islem.worker_id) { }  // ← TAMAMEN BOŞ!
```

**Problem:** Onay verildiğinde işçinin FPY skoru güncellenmeli ama fonksiyon içi boş bırakılmış. Personel tablosundaki `fp_yield` değeri hiçbir zaman değişmeyecek.

### 2. Fire Maliyeti Hesaplaması
**Dosya:** [ImalatMainContainer.js:339](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/imalat/components/ImalatMainContainer.js#L339)

```javascript
telegramBildirim(`🚫 Fire maliyeti hesaplanıyor.`);
// Ama fire maliyeti HESAPLANMIYOR! Sadece status 'assigned'a çevriliyor
```

**Problem:** Telegram'a "Fire maliyeti hesaplanıyor" diyor ama hiçbir maliyet hesaplanmıyor.

---

## ⚔️ PERSoNEL ŞEMA ÇATIŞMASI

| Alan | `/uretim` (M14) → `b1_personel` | `/imalat` (M3) → `v2_users` |
|------|---|---|
| İsim | `ad_soyad` | `full_name` |
| Rol | `rol` | `role` |
| Ücret | `saatlik_ucret_tl` | ❌ yok |
| FPY | ❌ yok | `fp_yield` |
| Puan | ❌ yok | `social_points` |
| Durum | `durum` (aktif/pasif) | ❌ yok |

**Problem:** İki modül farklı personel tablolarından besleniyor. Bir kişinin M14'teki verisi M3'te görünmüyor.

---

## 🧟 HAYALET: Teknik Föy Listesi Yanlış Veri Gösteriyor

**Dosya:** [ImalatMainContainer.js:449-457](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/imalat/components/ImalatMainContainer.js#L449-L457)

Pencere 1'de "Onaylanmış Teknik Föyler" listesinde:
```jsx
<h3>{model.model_name}</h3>        // ← production_orders'da model_name yok!
<span>MAX: {model.material_cost}₺</span>  // ← production_orders'da material_cost yok!
<p>{model.description}</p>          // ← production_orders'da description yok!
```

**Problem:** `yukleTeknikFoyler()` fonksiyonu `production_orders` tablosundan veri çekiyor ama UI, `v2_models` tablosunun alanlarını (`model_name`, `material_cost`, `description`) göstermeye çalışıyor. Sonuç: **tüm alanlar boş/undefined görünecek.**

---

## ⚔️ DEVIR RAPORU — NET ADET HER ZAMAN 0

**Dosya:** [uretimApi.js:112-113](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/uretim/services/uretimApi.js#L112-L113)

```javascript
const { error } = await supabase.from('b1_muhasebe_raporlari').insert([{
    order_id: orderId,
    gerceklesen_maliyet_tl: pt,
    net_uretilen_adet: 0,    // ← HER ZAMAN 0!
    zayiat_adet: 0,          // ← HER ZAMAN 0!
    rapor_durumu: 'taslak',
    devir_durumu: false
}]);
```

**Problem:** Muhasebe raporuna gönderilen üretim sayısı her zaman 0 adet. `production_orders.quantity` değeri raporda kullanılmıyor.

---

## 🧟 HAYALET: `useImalat` Hook Kullanılmıyor

**Dosya:** [useImalat.js](file:///C:/Users/Esisya/Desktop/47_SilBaştan/src/features/imalat/hooks/useImalat.js) (77 satır)

Bu hook `b1_imalat_emirleri` tablosu ile çalışıyor ve barrel'dan export ediliyor. **AMA** `/imalat` sayfasının componenti `ImalatMainContainer.js`, bu hook'u **hiç import etmiyor**. Tüm logic doğrudan component içinde inline yazılmış.

İkinci hayalet: `b1_imalat_emirleri` tablosu sadece `useImalat` hook'unda ve `imalatApi.js`'de kullanılıyor — ama bunları çağıran bir sayfa yok.

---

## 📊 TOPLAM HAYALET / HATA ÖZETİ

| # | Tip | Konum | Şiddet |
|---|-----|-------|--------|
| 1 | 🧟 Hayalet Tablo | `b1_uretim_kayitlari` — Ajanlar okur ama hiçbir modül yazmaz | 🔴 KRİTİK |
| 2 | 💀 Kırık Link | `/finans` route mevcut değil | 🔴 KRİTİK |
| 3 | ⚔️ Tablo Çatışması | `production_orders` iki modülden farklı kullanılıyor | 🔴 KRİTİK |
| 4 | 🔓 PIN Tutarsızlığı | `sb47_uretim_pin` vs `sb47_uretim_token` | 🔴 KRİTİK |
| 5 | 🔧 Hardcoded Maliyet | Her iş = 168₺ sabit | 🔴 KRİTİK |
| 6 | 🔧 Hardcoded Süre | UI'da her zaman "42 dk" | 🟡 YÜKSEK |
| 7 | 🔧 Hardcoded "GÜVENLİ" | Maliyet kontrolü yapılmıyor | 🟡 YÜKSEK |
| 8 | 🕳️ Boş FPY | `if (islem.worker_id) { }` → boş | 🟡 YÜKSEK |
| 9 | 🕳️ Fire Maliyeti | Telegram'da "hesaplanıyor" ama hesaplanmıyor | 🟡 YÜKSEK |
| 10 | ⚔️ Personel Şeması | `b1_personel` vs `v2_users` farklı alanlar | 🟡 YÜKSEK |
| 11 | 🧟 Teknik Föy UI | `model_name`, `material_cost` → undefined | 🟡 YÜKSEK |
| 12 | 🔧 Devir Raporu | `net_uretilen_adet: 0` sabit | 🟡 YÜKSEK |
| 13 | 🧟 useImalat Hook | Export ediliyor ama hiçbir yerde import edilmiyor | 🟠 ORTA |
| 14 | 🧟 b1_imalat_emirleri | Tablo var, servis var ama çağıran sayfa yok | 🟠 ORTA |
| 15 | ⚔️ İki Modül | `/uretim` ve `/imalat` aynı işi yapıyor | 🟠 ORTA |
| 16 | 🔧 Video Kaydı | Toggle var ama gerçek kamera API entegrasyonu yok | 🟠 ORTA |
| 17 | ⚔️ Realtime | M3'te var, M14'te yok | 🟠 ORTA |
| 18 | 🧟 DURUS_KODLARI | Import edilmiş ama UI'da kullanılmıyor | 🟠 ORTA |
