# 📋 TAM SİSTEM DENETİMİ — İŞ EMRİ VE PLAN

**Veren:** Komutan Engin  
**Uygulayan:** ANTİGRAVİTY — Baş Müfettiş  
**Tarih:** 19 Mart 2026  
**Kapsam:** SİSTEMİN TAMAMI

---

## 🎯 GÖREV TANIMI

> Sistemdeki ilk işlemden son işleme kadar her şeyi listele.  
> Her sayfa için ayrı rapor çıkar. Sonunda birleştiririz.

---

## 🗺️ MEVCUT SİSTEM HARİTASI (Tespit Edilen)

### 📦 KATMAN 1 — FEATURE MODÜLLERI (26 Modül)

| # | Modül | Rota | Durum |
|---|-------|------|-------|
| 1 | `karargah` | `/` | Ana Karargah |
| 2 | `arge` | `/arge` | Ar-Ge & Trend |
| 3 | `kumas` | `/kumas` | Kumaş & Arşiv |
| 4 | `kalip` | `/kalip` | Kalıp & Serileme |
| 5 | `modelhane` | `/modelhane` | Modelhane |
| 6 | `kesim` | `/kesim` | Kesim |
| 7 | `imalat` | `/imalat` | İmalat |
| 8 | `uretim` | `/uretim` | Üretim Bandı |
| 9 | `maliyet` | `/maliyet` | Maliyet |
| 10 | `muhasebe` | `/muhasebe` | Muhasebe |
| 11 | `katalog` | `/katalog` | Katalog |
| 12 | `siparisler` | `/siparisler` | Siparişler |
| 13 | `stok` | `/stok` | Stok |
| 14 | `kasa` | `/kasa` | Kasa |
| 15 | `musteriler` | `/musteriler` | Müşteriler |
| 16 | `personel` | `/personel` | Personel |
| 17 | `gorevler` | `/gorevler` | Görevler |
| 18 | `raporlar` | `/raporlar` | Raporlar |
| 19 | `ajanlar` | `/ajanlar` | Ajan Komuta |
| 20 | `kameralar` | `/kameralar` | Kameralar |
| 21 | `haberlesme` | `/haberlesme` | Haberleşme |
| 22 | `guvenlik` | `/guvenlik` | Güvenlik |
| 23 | `denetmen` | `/denetmen` | Denetmen |
| 24 | `ayarlar` | `/ayarlar` | Ayarlar |
| 25 | `tasarim` | `/tasarim` | Tasarım Stüdyosu |
| 26 | `giris` | `/giris` | Giriş |

---

### ⚙️ KATMAN 2 — API ROTALARI (25 Endpoint)

| # | API Route | Görev |
|---|-----------|-------|
| 1 | `/api/pin-dogrula` | Kimlik doğrulama |
| 2 | `/api/ajan-calistir` | AI ajan tetikleyici |
| 3 | `/api/ajan-tetikle` | Ajan zamanlama |
| 4 | `/api/cron-ajanlar` | Cron job |
| 5 | `/api/telegram-bildirim` | Telegram push |
| 6 | `/api/telegram-webhook` | Telegram bot webhook |
| 7 | `/api/telegram-foto` | Foto gönderim |
| 8 | `/api/siparis-ekle` | Sipariş oluşturma |
| 9 | `/api/musteri-ekle` | Müşteri oluşturma |
| 10 | `/api/personel-ekle` | Personel oluşturma |
| 11 | `/api/kumas-ekle` | Kumaş kaydı |
| 12 | `/api/gorev-ekle` | Görev oluşturma |
| 13 | `/api/is-emri-ekle` | İş emri oluşturma |
| 14 | `/api/stok-alarm` | Stok uyarısı |
| 15 | `/api/stok-hareket-ekle` | Stok hareketi |
| 16 | `/api/model-hafizasi` | Model geçmişi |
| 17 | `/api/haberlesme` | Mesaj API |
| 18 | `/api/kur` | Döviz kuru |
| 19 | `/api/veri-getir` | Genel veri çekme |
| 20 | `/api/trend-ara` | Trend araştırma |
| 21 | `/api/stream-durum` | Kamera stream durumu |
| 22 | `/api/2fa-dogrula` | 2FA doğrulama |
| 23 | `/api/2fa-kurulum` | 2FA kurulum |
| 24 | `/api/test-arge` | Ar-ge test |
| 25 | `/api/agent` | Agent yönetimi |

---

### 🔧 KATMAN 3 — ALTYAPI / LIB (23 Dosya)

| # | Dosya | Görev |
|---|-------|-------|
| 1 | `auth.js` | PIN auth + JWT akışı |
| 2 | `supabase.js` | DB bağlantısı |
| 3 | `supabaseAdmin.js` | Admin DB bağlantısı |
| 4 | `middleware.js` | Route koruması |
| 5 | `yetki.js` | Yetki matrisi |
| 6 | `zodSchemas.js` | Form validasyon |
| 7 | `utils.js` | Yardımcı fonksiyonlar |
| 8 | `lang.js` | Çokdil desteği |
| 9 | `langContext.js` | Dil context'i |
| 10 | `TasarimContext.js` | Tasarım context |
| 11 | `kripto.js` | Şifreleme |
| 12 | `totp.js` | TOTP/2FA |
| 13 | `logger.js` | Log sistemi |
| 14 | `hataBildirim.js` | Hata raporlama |
| 15 | `rateLimit.js` | Rate limiting |
| 16 | `offlineKuyruk.js` | Çevrimdışı kuyruk |
| 17 | `apiClient.js` | API istemcisi |
| 18 | `ajanlar.js` | Ajan temel mantığı |
| 19 | `ajanlar-v2.js` | Ajan v2 (güncel) |
| 20 | `aiOneri.js` | AI öneri motoru |
| 21 | `modelHafizasi.js` | Model hafıza sistemi |
| 22 | `dipArsiv.js` | Derin arşiv |
| 23 | `silmeYetkiDogrula.js` | Silme yetki kontrolü |

---

### 🏗️ KATMAN 4 — ÜST YAPI (Global Bileşenler)

| # | Dosya | Görev |
|---|-------|-------|
| 1 | `ClientLayout.js` | Tüm sayfaların sarmalı |
| 2 | `layout.js` | Next.js root layout |
| 3 | `globals.css` | Global stil sistemi |
| 4 | `middleware.js` | Auth koruma katmanı |
| 5 | `error.js` | Global hata sayfası |
| 6 | `global-error.js` | Kritik hata yakalayıcı |
| 7 | `not-found.js` | 404 sayfası |

---

## 📋 DENETİM YÖNTEMİ

Her modül için **3 katmanlı denetim** yapılacak:

### A. K1-K9 Sayfa Kontrol Kriterleri
```
K1: Route tanımlı mı?
K2: MainContainer import edilmiş mi?
K3: Supabase/veri bağlantısı var mı?
K4: Loading state var mı?
K5: Error state var mı?
K6: Ekle butonu var mı?
K7: Form validasyonu var mı?
K8: Silme onayı var mı?
K9: Tema rengi standarda uygun mu?
```

### B. Kod Kalitesi Denetimi
```
- TypeScript/PropType hataları
- Boş catch blokları (silent error)
- Çift tıklama koruması (disabled)
- Realtime bağlantı kapatılıyor mu?
- Memory leak riski var mı?
```

### C. İş Mantığı Denetimi
```
- Yetki kontrolü doğru mu?
- Veri doğrulama (Zod) yapılıyor mu?
- Telegram bildirimi gereken yerde var mı?
- Kritik işlemlerde log düşülüyor mu?
```

---

## 📅 UYGULAMA SIRASI

```
AŞAMA 1 — ALTYAPI (Katman 3 + 4)
  auth.js, middleware.js, supabase.js, ClientLayout.js
  → Bunlar hepsinin temeli. Buradaki hata her yere sıçrar.

AŞAMA 2 — ANA KARARGAH VE KRİTİK MODÜLLER
  karargah, denetmen, giris, ajanlar, haberlesme

AŞAMA 3 — ÜRETİM MODÜLLERI
  arge, kumas, kalip, modelhane, kesim, imalat, uretim

AŞAMA 4 — FİNANS MODÜLLERI
  maliyet, muhasebe, kasa, katalog, siparisler, stok

AŞAMA 5 — YÖNETİM MODÜLLERI
  musteriler, personel, gorevler, raporlar

AŞAMA 6 — SİSTEM MODÜLLERI
  kameralar, guvenlik, ayarlar, tasarim

AŞAMA 7 — API ROTALARI (25 endpoint)
AŞAMA 8 — ALTYAPI LİB DOSYALARI (23 dosya)
AŞAMA 9 — BİRLEŞTİRME VE GENEL RAPOR
```

---

## 📊 ÇIKTI FORMATI

Her modül için ayrı dosya:
```
Denetim_01_KARARGAH.md
Denetim_02_DENETMEN.md
Denetim_03_GIRIS.md
...
Denetim_26_TASARIM.md
Denetim_API_ROTALARI.md
Denetim_ALTYAPI.md
GENEL_RAPOR_BIRLESIK.md
```

---

## ⏱️ TAHMINI SÜRE

| Aşama | Süre |
|-------|------|
| Altyapı denetimi | 1 oturum |
| Modül denetimleri (26 × 3 kriter) | 3-4 oturum |
| API denetimi | 1 oturum |
| Birleşik rapor | 1 oturum |

---

**Onay verirseniz AŞAMA 1'den başlıyorum.**
