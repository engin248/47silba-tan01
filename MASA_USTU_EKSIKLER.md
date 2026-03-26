# NİZAM — TAM EKSİKLER LİSTESİ
**Tarih:** 26 Mart 2026  
**Yöntem:** Kod bizzat okundu — her maddenin dosyası ve satır numarası vardır  
**Kontrol Kuralı:** Madde tamamlandı → `[ ]` → `[x]`. Test edilmeden `[x]` yapılmaz.

---

## ═══ BÖLÜM 1: KRİTİK KOD HATALARI ═══

### 1A — GİT MERGE CONFLICT (Dosya çalışmıyor)
- [ ] **1A-1** `scripts/arge_ajanlari/1_Scraper_Ajan.py` satır 5: `<<<<<<< HEAD`
- [ ] **1A-2** `scripts/arge_ajanlari/1_Scraper_Ajan.py` satır 53: ikinci `<<<<<<< HEAD`
  - Bu dosya Python yorumlayıcısına SyntaxError verir → hiç çalışmaz
  - Hangi versiyon kullanılacak seçilip tek temiz dosya bırakılmalı

### 1B — GÜVENLİK AÇIĞI (Hardcoded Key)
- [ ] **1B-1** `scripts/arge_ajanlari/1_Scraper_Ajan.py` satır 46:
  ```python
  SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "GIZLI_KEY")
  ```
  - ENV okunamazsa `"GIZLI_KEY"` fallback olarak kalıyor → temizlenmeli, fallback `None` olmalı

### 1C — CRON_SECRET GÜVENLİK AÇIĞI (Hardcoded Fallback)
- [ ] **1C-1** `src/app/api/kopru-ajan/route.js` satır 100: `CRON_SECRET || 'dev_secret'`
- [ ] **1C-2** `src/app/api/m4-vision/route.js` satır 16: `CRON_SECRET || 'dev_secret'`
- [ ] **1C-3** `src/app/api/ajan-yargic/route.js` satır 26: `CRON_SECRET || 'dev_secret'`
- [ ] **1C-4** `src/app/api/cron-ajanlar/route.js` satır 134: `CRON_SECRET || 'dev_secret'`
  - ENV yokken `dev_secret` ile herkes bu API'leri tetikleyebilir

---

## ═══ BÖLÜM 2: CANLI SİTE EKSİKLERİ ═══
> Kaynak: mizanet.com canlı taraması

- [ ] **2-1** Tüm KPI kartları (Ciro, Maliyet, Personel, Fire) `₺0` / `%0` gösteriyor
  - Kök neden: `b2_kasa_hareketleri` veya `b1_maliyet_kayitlari` tablolarında gerçek veri yok
- [ ] **2-2** `b1_arge_trendler` tablosu → Supabase'den 400 Bad Request
- [ ] **2-3** `b1_sistem_uyarilari` tablosu → Supabase'den 400 Bad Request
- [ ] **2-4** API PING 4166ms → Hedef < 500ms
- [ ] **2-5** `demirtekstiltheonder.com` → DNS çözümlenemiyor (ERR_NAME_NOT_RESOLVED)
- [ ] **2-6** Kamera sistemi kapalı: `NEXT_PUBLIC_KAMERA_AKTIF` ENV değişkeni Vercel'de `true` değil
- [ ] **2-7** go2rtc sunucu kurulumu yapılmamış → stream gelmez

---

## ═══ BÖLÜM 3: YANILTICI / HARDCODED VERİLER ═══

- [ ] **3-1** `KarargahMainContainer.js` → `'VERİ MADENCİLERİ: 24/s'` sabit metin, gerçek ajan verisi değil
- [ ] **3-2** `KarargahMainContainer.js` → `'ANALİSTLER: 18ms'` sabit metin
- [ ] **3-3** `useKarargah.js` satır 199: `artisYuzde: 12` — hardcoded, hesaplanmıyor
- [ ] **3-4** `RaporlarMainContainer.js` satır 415: `buAy: 125000, gecenAy: 110000` — sahte veri
- [ ] **3-5** `RaporlarMainContainer.js` satır 416: `buAy: 25000, gecenAy: 32000, p: '-%21'` — sahte veri

---

## ═══ BÖLÜM 4: AR-GE / AJAN EKSİKLERİ ═══

### 4A — Arşivlenmiş (Aktif Değil) Dosyalar Karıştırma Riski
- [ ] **4A-1** `src/lib/agents/scraper/OluIsciScraper.js` → `[ARŞİV] AKTİF DEĞİLDİR` ama içindeki fonksiyonlar boş
- [ ] **4A-2** `src/lib/agents/ekip2/MatematikciYargic.js` → `[ARŞİV]` ama `cost_analysis`, `risk_analysis` tablolarına yazıyor

### 4B — Ajan Fonksiyonları Boş
- [ ] **4B-1** `OluIsciScraper.js` `sosyalMedyaTara()` satır 107–110: Boş
- [ ] **4B-2** `OluIsciScraper.js` `rakipKoleksiyonIzle()` satır 117–119: Boş
- [ ] **4B-3** `OluIsciScraper.js` `sikayetMetinleriniKazi()` satır 126–128: Boş

### 4C — Eski Tablo Adları (Schema Uyumsuzluğu)
- [ ] **4C-1** `OluIsciScraper.js` satır 76: `.from('products')` — NİZAM şemasında bu tablo `b1_arge_trendler`
- [ ] **4C-2** `MatematikciYargic.js` satır 152: `.from('cost_analysis')` — Supabase'de bu tablo var mı?
- [ ] **4C-3** `MatematikciYargic.js` satır 160: `.from('risk_analysis')` — bu tablo var mı?
- [ ] **4C-4** `MatematikciYargic.js` satır 168: `.from('b1_arge_strategy')` — aktif `yargic.js` ile çakışıyor mu?

### 4D — Cron / Otomasyon Eksikleri
- [ ] **4D-1** `vercel.json`'da `arge_zincir` cronu **YOK** → AR-GE zinciri otomatik tetiklenmiyor
- [ ] **4D-2** `kamera_durum_kontrol_ajan` cronu `vercel.json`'da **YOK**
- [ ] **4D-3** Python ajanı (`1_Scraper_Ajan.py`) herhangi bir cron'a bağlı değil → veri toplamıyor

### 4E — Veri Bankası Boş
- [ ] **4E-1** `b1_piyasa_gozlem` tablosu — içi boş
- [ ] **4E-2** `b1_arge_trendler` tablosu — 400 hatası

---

## ═══ BÖLÜM 5: API / BACKEND EKSİKLERİ ═══

### 5A — Schema / Kolon Adı Uyumsuzlukları
- [ ] **5A-1** `kasa-ozet/route.js` satır 39: `b1_sistem_uyarilari`'dan `olusturma` kolonu isteniyor
  - Karargah tarafı aynı tablo için `created_at` kullanıyor → hangisi doğru?

### 5B — NEXT_PUBLIC_SITE_URL Eksik
- [ ] **5B-1** `cron-ajanlar/route.js` satır 131: `NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'`
- [ ] **5B-2** `ajan-orkestrator/route.js` satır 177: aynı fallback — Vercel'de set edilmezse cron localhost'a çağırır

### 5C — Eksik Supabase Tabloları
- [ ] **5C-1** `camera_events` — her yerde `try { } catch { /* geç */ }` ile kullanılıyor, tablo yok mu?
- [ ] **5C-2** `camera_access_log` — kullanılıyor ama tablo garantisi yok
- [ ] **5C-3** `cameras` — yoksa 12 kamera hardcoded kullanılıyor
- [ ] **5C-4** `b0_arsiv` — `dipArsiv.js` kullanıyor; tablo Supabase'de var mı?
- [ ] **5C-5** `cost_analysis` — `MatematikciYargic` kullanıyor; tablo var mı?
- [ ] **5C-6** `risk_analysis` — `MatematikciYargic` kullanıyor; tablo var mı?

### 5D — JWT / PIN Sistemi
- [ ] **5D-1** `pin-dogrula/route.js` satır 63–66: `JWT_SIRRI` ENV yoksa giriş sistemi çalışmıyor

---

## ═══ BÖLÜM 6: ÇİFT / KULLANILMAYAN DOSYALAR ═══

- [ ] **6-1** `KatalogRefactored.jsx` — hangi versiyon aktif belirsiz
- [ ] **6-2** `AyarlarRefactored.jsx` — index.js bunu export ediyor ama `AyarlarMainContainer.js` de var
- [ ] **6-3** `src/lib/agents_dummy.js` — tek satır `console.log('Pin test updated.')` — temizlenmeli mi?

---

## ═══ BÖLÜM 7: KAMERA SİSTEMİ EKSİKLERİ ═══

- [ ] **7-1** `KameralarMainContainer.js` satır 16: URL'de yazım hatası → `theondercom` (nokta eksik)
  - Doğrusu: `demirtekstiltheonder.com` → tüm kameralar bu yüzden offline görünüyor
- [ ] **7-2** `go2rtc` fiziksel kurulumu yapılmamış
- [ ] **7-3** Kamera listesi hardcoded (12 kamera), Supabase `cameras` tablosuna bağlı değil
- [ ] **7-4** `NEXT_PUBLIC_GO2RTC_URL` ENV Vercel'de tanımlı değil

---

## ═══ BÖLÜM 8: DEPLOY / ENV EKSİKLERİ ═══

- [ ] **8-1** `SENTRY_AUTH_TOKEN` Vercel'de yok
- [ ] **8-2** `SENTRY_ORG` Vercel'de yok
- [ ] **8-3** `SENTRY_PROJECT` Vercel'de yok
- [ ] **8-4** `NEXT_PUBLIC_KAMERA_AKTIF=true` Vercel'de yok
- [ ] **8-5** `NEXT_PUBLIC_ALARM_AKTIF=true` Vercel'de belirsiz
- [ ] **8-6** `NEXT_PUBLIC_SITE_URL=https://mizanet.com` Vercel'de yok
- [ ] **8-7** `JWT_SIRRI` Vercel'de kontrol edilmedi
- [ ] **8-8** `CRON_SECRET` Vercel'de yok — fallback `dev_secret` güvensiz

---

## ═══ BÖLÜM 9: OPERASYONEL TESTLER YAPILMADI ═══

- [ ] **9-1** Telegram M2 aktarımı canlı test yapılmadı
- [ ] **9-2** 2FA sistemi gerçek cihazda test edilmedi
- [ ] **9-3** RLS politikaları canlıda test yapılmadı
- [ ] **9-4** Vercel Cron'larının gerçekten çalıştığı doğrulanmadı

---

## ═══ BÖLÜM 10: DIŞ ANALİZ RAPORU EKSİKLERİ ═══
> Kaynak: ARGE_KIYASLAMA_RAPORU.md — "Üst Seviye AR-GE İstihbarat Sistemi" karşılaştırması

### 10A — Hiç Yazılmamış Ajanlar
- [ ] **10A-1** Ürün Tanımlama Ajanı yok (Analiz Ajan 7-10)
- [ ] **10A-2** Kumaş / Materyal Analiz Ajanı yok (Analiz Ajan 8)
- [ ] **10A-3** Görsel Analiz Ajanı yok — CLIP/YOLO siluet/kesim analizi (Analiz Ajan 5)
- [ ] **10A-4** Üretim Uygunluk Ajanı yok — makine/bant kapasitesi (Analiz Ajan 14-15)
- [ ] **10A-5** Talep Tahmin Ajanı yok — satış potansiyeli, stok öneri (Analiz Ajan 13)
- [ ] **10A-6** Moda Raporu Ajanı yok — moda haftaları, trend raporları (Analiz Ajan 4)
- [ ] **10A-7** TikTok veri kaynağı yok — sosyal kapsam sadece Google Trends
- [ ] **10A-8** Pinterest veri kaynağı yok
- [ ] **10A-9** Rakip fiyat karşılaştırma motoru yok (Analiz Ajan 12)

### 10B — Trend Skor Formülü Eksik
- [ ] **10B-1** `satar_satmaz_skoru` tamamen Gemini LLM → kara kutu, tekrarlanamaz
  - Analiz formülü: `TrendScore = (Satış %35) + (Sosyal %30) + (Rakip %20) + (Sezon %15)`
- [ ] **10B-2** LLM + Matematiksel formül hibriti kurulmamış

### 10C — M1 ↔ M7 Entegrasyonu Yok
- [ ] **10C-1** AR-GE onayı anında maliyet hesabı yok — M1 ve M7 birbirinden kopuk
- [ ] **10C-2** Fırsat Skoru = `Trend Skoru + Kâr Marjı - Risk Skoru` formülü uygulanmıyor

### 10D — Üretim Onayı Sonrası Zayıf Bağlantı
- [ ] **10D-1** `kararVer()` onayı sonrası İmalat modülüne otomatik bildirim yok

### 10E — Veri Bankası Büyümüyor
- [ ] **10E-1** Günlük hedef: 100-300 ürün analizi → Şu an: 0 (cron yok)
- [ ] **10E-2** 6-12 ay birikim hedefi başlatılmamış — tablolar var ama boş

---

## ÖZET TABLOSU

| Bölüm | Madde | Kritik |
|-------|-------|--------|
| 1 — Kritik Kod Hataları | 8 | 8 |
| 2 — Canlı Site | 7 | 4 |
| 3 — Yanıltıcı/Hardcoded | 5 | 2 |
| 4 — AR-GE / Ajan | 12 | 5 |
| 5 — API / Backend | 10 | 6 |
| 6 — Çift/Kullanılmayan | 3 | 0 |
| 7 — Kamera Sistemi | 4 | 3 |
| 8 — Deploy / ENV | 8 | 6 |
| 9 — Operasyonel Testler | 4 | 2 |
| 10 — Dış Analiz / Strateji | 16 | 4 |
| **TOPLAM** | **77** | **40** |

---

## KRİTİK İLK 10

| # | Madde | Neden Önce |
|---|-------|-----------|
| 1 | 1A-1/1A-2 | Python scraper merge conflict — çalışmıyor |
| 2 | 1B-1 | Hardcoded key — güvenlik açığı |
| 3 | 1C-1/1C-4 | dev_secret fallback — API'ler korumasız |
| 4 | 2-2/2-3 | Supabase 400 — KPI'lar ölü |
| 5 | 7-1 | Kamera URL yazım hatası (nokta eksik) |
| 6 | 8-6 | NEXT_PUBLIC_SITE_URL yok — cron localhost çağırıyor |
| 7 | 8-8 | CRON_SECRET yok — dev_secret güvensiz |
| 8 | 4D-1 | arge_zincir cronu vercel.json'da yok |
| 9 | 10E-1 | Veri bankası boş — sistem büyümüyor |
| 10 | 10C-1 | M1 ↔ M7 kopuk — maliyet fırsat beraber görülemiyor |

---

*Bölüm 1-9: Kaynak = Bizzat okunan kaynak kodu (dosya adı + satır numarasıyla)*
*Bölüm 10: Kaynak = ARGE_KIYASLAMA_RAPORU.md*
*Tarih: 26 Mart 2026*
