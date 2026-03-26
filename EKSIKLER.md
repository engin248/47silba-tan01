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
  - Kod: `useKarargah.js` → `/api/kasa-ozet` çağrısı yapıyor, API kodu çalışıyor görünüyor
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
- [ ] **3-4** `RaporlarMainContainer.js` satır 415:
  ```js
  { baslik: 'Toplam Personel Maliyeti', buAy: 125000, gecenAy: 110000 }
  ```
  - "Karşılaştırmalı Analiz" sekmesindeki 4 kart tamamen hardcoded sahte veri
- [ ] **3-5** `RaporlarMainContainer.js` satır 416:
  ```js
  { baslik: 'Fire & Zayiat Tutarı', buAy: 25000, gecenAy: 32000, p: '-%21' }
  ```
  - Gerçek veri değil, elle yazılmış

---

## ═══ BÖLÜM 4: AR-GE / AJAN EKSİKLERİ ═══

### 4A — Arşivlenmiş (Aktif Değil) Dosyalar Karıştırma Riski
- [ ] **4A-1** `src/lib/agents/scraper/OluIsciScraper.js` satır 2–4: `[ARŞİV] AKTİF DEĞİLDİR`
  - Ama bu dosyadaki `sozyalMedyaTara()`, `rakipKoleksiyonIzle()`, `sikayetMetinleriniKazi()` fonksiyonları **tamamen boş**
- [ ] **4A-2** `src/lib/agents/ekip2/MatematikciYargic.js` satır 2–4: `[ARŞİV] AKTİF DEĞİLDİR`
  - Arşiv olmasına rağmen `cost_analysis`, `risk_analysis` tablo adları burada kullanılıyor
  - Aktif olan `yargic.js` bu tablolara yazıyor mu kontrol edilmeli

### 4B — Ajan Fonksiyonları Boş
- [ ] **4B-1** `src/lib/agents/scraper/OluIsciScraper.js` `sosyalMedyaTara()` satır 107–110: Fonksiyon boş, yorum satırı var
- [ ] **4B-2** `src/lib/agents/scraper/OluIsciScraper.js` `rakipKoleksiyonIzle()` satır 117–119: Boş
- [ ] **4B-3** `src/lib/agents/scraper/OluIsciScraper.js` `sikayetMetinleriniKazi()` satır 126–128: Boş

### 4C — Eski Tablo Adları (Schema Uyumsuzluğu)
- [ ] **4C-1** `src/lib/agents/scraper/OluIsciScraper.js` satır 76: `.from('products')` — bu tablo adı NİZAM şemasında `b1_arge_trendler`, senkron değil
- [ ] **4C-2** `src/lib/agents/ekip2/MatematikciYargic.js` satır 152: `.from('cost_analysis')` — Supabase'de bu tablo var mı?
- [ ] **4C-3** `src/lib/agents/ekip2/MatematikciYargic.js` satır 160: `.from('risk_analysis')` — bu tablo var mı?
- [ ] **4C-4** `src/lib/agents/ekip2/MatematikciYargic.js` satır 168: `.from('b1_arge_strategy')` — mevcut aktif `yargic.js` da bu tabloya yazıyor mu yoksa farklı mı?

### 4D — Cron / Otomasyon Eksikleri
- [ ] **4D-1** `vercel.json` sadece 2 cron var: `sabah_ozeti` (05:00) ve `gece_yedekleme_ve_temizlik` (00:00)
  - `arge_zincir` cronu `vercel.json`'da **YOK** → AR-GE zinciri otomatik tetiklenmiyor
  - `kamera_durum_kontrol_ajan` cronu da **YOK**
- [ ] **4D-2** Python ajanı (`1_Scraper_Ajan.py`) herhangi bir cron'a bağlı değil → veri toplamıyor

### 4E — Veri Bankası Boş
- [ ] **4E-1** `b1_piyasa_gozlem` tablosu — içi boş (scraper çalışmadığı için)
- [ ] **4E-2** `b1_arge_trendler` tablosu — 400 hatası alınıyor (veri yok veya tablo yok)

---

## ═══ BÖLÜM 5: API / BACKEND EKSİKLERİ ═══

### 5A — Schema / Kolon Adı Uyumsuzlukları
- [ ] **5A-1** `kasa-ozet/route.js` satır 39: `b1_sistem_uyarilari` tablosundan `olusturma` kolonu isteniyor
  - Aynı tabloya `karargah` tarafı `created_at` ile erişiyor (iki farklı kolon adı kullanılıyor)
  - Hangisi doğru? Tablo şeması doğrulanmalı

### 5B — NEXT_PUBLIC_SITE_URL Eksik
- [ ] **5B-1** `src/app/api/cron-ajanlar/route.js` satır 131: `NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'`
- [ ] **5B-2** `src/app/api/ajan-orkestrator/route.js` satır 177: aynı fallback
  - Vercel'de `NEXT_PUBLIC_SITE_URL` set edilmezse API kendi kendini `localhost:3000`'e çağırır → başarısız

### 5C — Eksik Supabase Tabloları (Kullanılıyor ama oluşturulması kesin değil)
- [ ] **5C-1** `camera_events` — KameralarMainContainer + CronAjanlar kullanıyor, ama tablo yok mu? `try { } catch { /* tablo yoksa geç */ }` kalıbı her yerde var
- [ ] **5C-2** `camera_access_log` — KameralarMainContainer kullanıyor `try { } catch` içinde
- [ ] **5C-3** `cameras` — KameralarMainContainer okumaya çalışıyor; yoksa VARSAYILAN_KAMERALAR kullanılıyor (12 hardcoded kamera)
- [ ] **5C-4** `b0_arsiv` — `dipArsiv.js` kullanıyor; tablo Supabase'de var mı?
- [ ] **5C-5** `cost_analysis` — MatematikciYargic kullanıyor; tablo var mı?
- [ ] **5C-6** `risk_analysis` — MatematikciYargic kullanıyor; tablo var mı?

### 5D — JWT / PIN Sistemi
- [ ] **5D-1** `src/app/api/pin-dogrula/route.js` satır 63–66: `JWT_SIRRI` ENV yoksa `INTERNAL_API_KEY`'e düşüyor, o da yoksa giriş sistemi çalışmıyor
  - Vercel'de `JWT_SIRRI` set edildi mi?

---

## ═══ BÖLÜM 6: ÇİFT / KULLANILMAYAN DOSYALAR ═══

- [ ] **6-1** `src/features/katalog/components/KatalogRefactored.jsx` — hook `useKatalog.js`'de referans var ama asıl index.js hangi bileşeni export ediyor bilinmiyor → iki versiyon bir arada
- [ ] **6-2** `src/features/ayarlar/index.js` satır 11: `AyarlarRefactored` export ediyor (yalın `AyarlarMainContainer.js` değil) → hangi dosya aktif?
- [ ] **6-3** `src/lib/agents_dummy.js` — tek satır: `console.log('Pin test updated.')` — bu dosyanın amacı ne? Temizlenmeli mi?

---

## ═══ BÖLÜM 7: KAMERA SİSTEMİ EKSİKLERİ ═══

- [ ] **7-1** `KameralarMainContainer.js` satır 16: `GO2RTC_URL = 'https://kamera.demirtekstiltheondercom.com'` — hardcoded, ENV'den okunmuyor
  - Doğru domain: `demirtekstiltheonder.com` (nokta eksik: `theondercom`)
  - Bu URL'de go2rtc çalışmıyor → tüm kameralar offline görünür
- [ ] **7-2** `go2rtc` fiziksel kurulumu yapılmamış (lokal sunucu, Cloudflare tünel)
- [ ] **7-3** Kamera listesi Supabase `cameras` tablosundan gelmiyor → 12 kamera hardcoded (statik)
- [ ] **7-4** `NEXT_PUBLIC_GO2RTC_URL` ENV değişkeni Vercel'de tanımlı değil

---

## ═══ BÖLÜM 8: DEPLOY / ENV EKSİKLERİ ═══

- [ ] **8-1** `SENTRY_AUTH_TOKEN` Vercel'de set edilmedi
- [ ] **8-2** `SENTRY_ORG` Vercel'de set edilmedi
- [ ] **8-3** `SENTRY_PROJECT` Vercel'de set edilmedi
- [ ] **8-4** `NEXT_PUBLIC_KAMERA_AKTIF=true` Vercel'de set edilmedi
- [ ] **8-5** `NEXT_PUBLIC_ALARM_AKTIF=true` Vercel'de durumu belirsiz — `false` ise `b1_sistem_uyarilari` sorgusu hiç çalışmıyor
- [ ] **8-6** `NEXT_PUBLIC_SITE_URL=https://mizanet.com` Vercel'de set edilmedi
- [ ] **8-7** `JWT_SIRRI` Vercel'de set edilmedi (veya kontrol edilmedi)
- [ ] **8-8** `CRON_SECRET` Vercel'de set edilmedi — fallback `dev_secret` ile çalışıyor (güvensiz)

---

## ═══ BÖLÜM 9: OPERASYONEL TESTLER YAPILMADI ═══

- [ ] **9-1** Telegram M2 aktarımı canlı test yapılmadı
- [ ] **9-2** 2FA sistemi gerçek cihazda test edilmedi
- [ ] **9-3** RLS politikaları SQL'de yazıldı, canlıda test yapılmadı
- [ ] **9-4** Vercel Cron'larının gerçekten çalıştığı doğrulanmadı (log kontrol edilmedi)

---

## ═══ BÖLÜM 10: DIŞ ANALİZ RAPORU EKSİKLERİ ═══
> Kaynak: ARGE_KIYASLAMA_RAPORU.md — "Üst Seviye AR-GE İstihbarat Sistemi" karşılaştırması
> Bu maddeler kod taramasında görülemeyen mimari/strateji eksiklerdir

### 10A — EKSİK AJANLAR (Hiç yazılmamış)
- [ ] **10A-1** Ürün Tanımlama Ajanı yok → Kategori, stil, hedef kitle otomatik çıkarımı yapılamıyor (Analiz Ajan 7-10)
- [ ] **10A-2** Kumaş / Materyal Analiz Ajanı yok → Kumaş türü, gramaj, üretim uygunluğu analizi yok (Analiz Ajan 8)
- [ ] **10A-3** Görsel Analiz Ajanı yok → CLIP/YOLO tabanlı siluet ve kesim analizi yok (Analiz Ajan 5)
- [ ] **10A-4** Üretim Uygunluk Ajanı yok → Makine uyumu, bant kapasitesi analizi yok (Analiz Ajan 14-15)
- [ ] **10A-5** Talep Tahmin Ajanı yok → Satış potansiyeli tahmini, stok öneri yok (Analiz Ajan 13)
- [ ] **10A-6** Moda Raporu Ajanı yok → Moda haftaları, trend raporları veri kaynağı yok (Analiz Ajan 4)
- [ ] **10A-7** TikTok veri kaynağı yok → Sosyal medya kapsam sadece Google Trends ile sınırlı
- [ ] **10A-8** Pinterest veri kaynağı yok → Görsel trend takibi yapılamıyor
- [ ] **10A-9** Fiyat Analiz Motoru eksik → Trendyol fiyatı kısmen çekiliyor ama rakip fiyat karşılaştırması yok (Analiz Ajan 12)

### 10B — TREND SKOR FORMÜLÜ EKSİK
- [ ] **10B-1** `satar_satmaz_skoru` tamamen Gemini LLM çıktısı → Kara kutu, tekrarlanamaz, şeffaf değil
  - Analiz Önerisi: `TrendScore = (Satış %35) + (Sosyal %30) + (Rakip %20) + (Sezon %15)`
  - NİZAM'da bu formül hiç uygulanmıyor
- [ ] **10B-2** LLM skoru + Matematiksel formül hibriti kurulmamış
  - Şu an: LLM tek başına karar veriyor
  - Olması gereken: LLM + Ağırlıklı formül birlikte doğrulama yapmalı

### 10C — M1 ↔ M7 ENTEGRASYONU YOK
- [ ] **10C-1** AR-GE (M1) fırsat tespiti anında maliyet hesabı gösterilemiyor
  - M1 UI'da ürün onaylanıyor ama tahmini üretim maliyeti bilgisi yok
  - M7 (Maliyet Merkezi) tamamen ayrı modül, bağlantısız
- [ ] **10C-2** Fırsat Skoru formülü uygulanmıyor:
  - Olması gereken: `Fırsat Skoru = Trend Skoru + Kâr Marjı - Risk Skoru`
  - Şu an: Sadece `satar_satmaz_skoru` var

### 10D — ÜRETİM ONAMI SONRASI ZAYIF BAĞLANTI
- [ ] **10D-1** M1 `kararVer()` → onay sonrası üretim planlama modülüne (M3/İmalat) otomatik bildirim yok
  - Şu an: Sadece `/kumas?trend_id=` yönlendirmesi var
  - Olması gereken: Onay → Üretim emri → İmalat modülü otomatik bilgilenmeli

### 10E — VERİ BANKASI BÜYÜMÜYOR
- [ ] **10E-1** Günlük hedef: 100-300 ürün analizi → Şu an: 0 (cron yok)
- [ ] **10E-2** 6-12 ay veri birikimi hedefi → Başlatılmamış
  - Tablolar var (`b1_piyasa_gozlem`, `b1_arge_trendler`) ama içleri boş
  - Sistem hiç büyümüyor → AI modeli iyileşemiyor

---

## ÖZET TABLOSU

| Bölüm | Madde Sayısı | Kritik |
|-------|-------------|--------|
| 1 — Kritik Kod Hataları | 8 | 8 |
| 2 — Canlı Site | 7 | 4 |
| 3 — Yanıltıcı/Hardcoded | 5 | 2 |
| 4 — AR-GE / Ajan | 11 | 5 |
| 5 — API / Backend | 10 | 6 |
| 6 — Çift/Kullanılmayan | 3 | 0 |
| 7 — Kamera Sistemi | 4 | 3 |
| 8 — Deploy / ENV | 8 | 6 |
| 9 — Operasyonel Testler | 4 | 2 |
| 10 — Dış Analiz / Strateji | 16 | 4 |
| **TOPLAM** | **76** | **40** |

---

## KRİTİK İLK 10 — İLK ELE ALINACAKLAR

| # | Madde | Neden Önce |
|---|-------|-----------|
| 1 | **1A-1/1A-2** | Python scraper çalışmıyor — veri toplanamıyor |
| 2 | **1B-1** | Hardcoded key — güvenlik açığı |
| 3 | **1C-1/1C-4** | `dev_secret` fallback — API'ler korumasız |
| 4 | **2-2/2-3** | Supabase 400 hatası — KPI'lar ölü |
| 5 | **7-1** | Kamera URL yanlış yazılmış (nokta eksik) |
| 6 | **8-6** | `NEXT_PUBLIC_SITE_URL` yok — cron API'ler localhost çağırıyor |
| 7 | **8-8** | `CRON_SECRET` yok — `dev_secret` ile korunuyor |
| 8 | **5B-1** | Cron'lar AR-GE zincirini localhost'a çekiyor |
| 9 | **4D-1** | `arge_zincir` cronu `vercel.json`'da yok |
| 10 | **3-4/3-5** | Raporlar sekmesinde ₺125.000 / ₺25.000 sabit sahte veri yönetimi yanıltıyor |

---

*Bu liste yalnızca bizzat okunan kaynak kodundan üretilmiştir.*  
*Dosya adı + satır numarası olmayan hiçbir madde eklenmedi.*  
*Son güncelleme: 26 Mart 2026 22:42 TR*
