# NIZAM / MİZANET — TAM SİSTEM HARİTASI
**Oluşturulma:** 27 Mart 2026 | **Sürüm:** 3.0 (Build Kurtarma Sonrası)
**Proje URL:** https://mizanet.com | **GitHub:** the-order-nizam | **Platform:** Vercel (Hobby)

---

## 1. MİMARİ GENEL BAKIŞ

```
┌─────────────────────────────────────────────────────────────┐
│                    KULLANICI / TARAYICl                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              VERCEL (Serverless / Edge)                       │
│  Next.js 15 App Router — mizanet.com                         │
│  middleware.js → JWT Doğrulama + Bot Engelleme               │
└──────┬──────────────────────────────────────┬───────────────┘
       │                                      │
┌──────▼──────┐                   ┌───────────▼──────────────┐
│  SUPABASE   │                   │   UPSTASH REDIS           │
│  Veritabanı │                   │   Rate Limit + Kuyruk     │
│  RLS + Auth │                   │   (API hız sınırlama)     │
└─────────────┘                   └──────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│            ENGİN PC (Yerel Makine — Kalıcı Çalışan)         │
│  ├── NIZAM_OFFLINE_SAYAC / lokal_sayac.py (Edge AI/YOLO)    │
│  ├── go2rtc (IP Kamera Stream Sunucusu — 12 Kamera)         │
│  ├── AVCI_BASLAT.bat (Ajan Döngüsü Başlatıcı)              │
│  └── Python Scrapers / Telegram Botları                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. FRONTEND — SAYFA MATRİSİ (34 Sayfa)

| Rota | Dosya Yolu | Modül | Erişim |
|------|-----------|-------|--------|
| `/` | app/page.js | Ana Giriş Yönlendirici | Public |
| `/giris` | app/giris/ | PIN Giriş Ekranı | Public |
| `/karargah` | app/karargah/ | **Komuta Merkezi (Ana Panel)** | tam/uretim/genel |
| `/arge` | app/arge/ | M1 — Ar-Ge & Trend İstihbarat | tam/uretim |
| `/kumas` | app/kumas/ | M2 — Kumaş & Malzeme Yönetimi | tam/uretim |
| `/kalip` | app/kalip/ | M3 — Kalıp & Serileme | tam/uretim |
| `/modelhane` | app/modelhane/ | M4 — Modelhane | tam/uretim |
| `/kesim` | app/kesim/ | M5 — Kesim Emirleri | tam/uretim |
| `/uretim` | app/uretim/ | M6 — Üretim Bandı | tam/uretim |
| `/maliyet` | app/maliyet/ | M7 — Maliyet Hesaplama | tam |
| `/muhasebe` | app/muhasebe/ | M8 — Muhasebe & Raporlar | tam |
| `/katalog` | app/katalog/ | Ürün Kataloğu (B2C) | tam/uretim |
| `/siparisler` | app/siparisler/ | Sipariş Yönetimi | tam/uretim |
| `/stok` | app/stok/ | Stok Takibi | tam/uretim |
| `/kasa` | app/kasa/ | Kasa Hareketleri | tam (RLS) |
| `/musteriler` | app/musteriler/ | Müşteri Yönetimi | tam/uretim |
| `/personel` | app/personel/ | Personel Bilgileri | tam |
| `/raporlar` | app/raporlar/ | Analiz Raporları | tam |
| `/gorevler` | app/gorevler/ | Ajan Görev Kutusu | tam/uretim |
| `/ajanlar` | app/ajanlar/ | AI Ajan Kontrol Paneli | tam (RLS) |
| `/kameralar` | app/kameralar/ | 12 IP Kamera Paneli | tam/uretim |
| `/guvenlik` | app/guvenlik/ | 2FA & Güvenlik Ayarları | tam (RLS) |
| `/denetmen` | app/denetmen/ | Sistem Denetim Paneli | tam (RLS) |
| `/haberlesme` | app/haberlesme/ | İç Mesajlaşma | tam/uretim/genel |
| `/ayarlar` | app/ayarlar/ | Sistem Ayarları | tam (RLS) |
| `/tasarim` | app/tasarim/ | Tasarım Modülü | tam (RLS) |
| `/imalat` | app/imalat/ | İmalat Takip | tam/uretim |
| `/odalar` | app/odalar/ | Çalışma Odaları | tüm roller |
| `/m1-istihbarat` | app/m1-istihbarat/ | M1 İstihbarat Özet | tam |
| `/m2-finans` | app/m2-finans/ | M2 Maliyet & Veto Kanunu | tam (YALITlLDI*) |
| `/m3-tasarim` | app/m3-tasarim/ | M3 Tasarım Özet | tam |
| `/m4-lojistik` | app/m4-lojistik/ | M4 Lojistik Özet | tam |
| `/uretim-kiosk` | app/uretim-kiosk/ | Üretim Kiosk (Dokunmatik) | uretim |
| `/sistem-raporu` | app/sistem-raporu/ | Sistem Hata Raporu | tam |

> *m2-finans: Build kurtarma kapsamında SafeM2FinansPaneli ile yalıtıldı. Supabase RLS Client-Side onarımı sonrası aktif edilecek.

---

## 3. YETKİ SİSTEMİ

```
Roller:
  tam        → Koordinatör / Sistem Kurucusu (TÜM ERIŞIM)
  uretim     → Üretim Bandı Çalışanı (Üretim modülleri)
  genel      → Genel Personel (Read-Only)

Kimlik Doğrulama Akışı:
  1. Kullanıcı PIN girer → /api/pin-dogrula
  2. Server-side PIN doğrulama → JWT Token üretilir (8 saat)
  3. JWT cookie olarak set edilir (HttpOnly)
  4. middleware.js her istekte JWT verify eder (Edge Runtime SubtleCrypto)
  5. Süre dolunca → /giris?hata=yetkisiz sayfasına yönlendirilir

Güvenlik Katmanları:
  ├── JWT (8 saat ömür, HMAC-SHA256)
  ├── Rate Limiting (Upstash Redis — 5 deneme / 15 dk kilit)
  ├── IP Whitelist (IP_WHITELIST_ENABLED=true ile aktif)
  ├── Bot İmzası Engelleme (sqlmap, nikto, scrapy vb.)
  └── 2FA (TOTP — src/lib/totp.js)
```

---

## 4. API ROTALARI (49 Endpoint)

### 4.1 — Kimlik & Güvenlik API
| Endpoint | Yöntem | Açıklama |
|----------|--------|---------|
| `/api/pin-dogrula` | POST | PIN doğrulama + JWT üretimi |
| `/api/cikis` | POST | Oturum sonlandırma |
| `/api/2fa-kurulum` | POST | TOTP 2FA kurulumu |
| `/api/2fa-dogrula` | POST | TOTP kodu doğrulama |

### 4.2 — Ajan & Orkestrasyon API
| Endpoint | Yöntem | Açıklama |
|----------|--------|---------|
| `/api/ajan-tetikle` | POST | Tek ajan tetikleyici (God Object—refactor bekliyor) |
| `/api/ajan-calistir` | POST | Ajan çalıştırma motoru |
| `/api/ajan-orkestrator` | POST | 3 modlu orkestratör (tara/dagit/dogrula) — force-dynamic |
| `/api/ajan-yargic` | POST | Yargıç Ajanı — Cron ile tetiklenir |
| `/api/worker-ajan` | POST | Worker A & B görev işleyici |
| `/api/kopru-ajan` | POST | Köprü Ajanı — M1'den M8'e veri taşır |
| `/api/cron-ajanlar` | GET | Vercel Cron tetikleyici (sabah/gece/arge zinciri) |
| `/api/trigger-agents` | POST | Toplu ajan tetikleyici |
| `/api/ai-kahin-ajan` | POST | Kâhin AI analiz ajanı |
| `/api/batch-ai` | POST | Toplu AI işlem motoru |
| `/api/agent` | POST | Genel ajan çağrısı |

### 4.3 — Veri Ekleme API
| Endpoint | Yöntem | Açıklama |
|----------|--------|---------|
| `/api/kumas-ekle` | POST | Kumaş kaydı ekleme |
| `/api/siparis-ekle` | POST | Sipariş oluşturma |
| `/api/musteri-ekle` | POST | Müşteri kaydı |
| `/api/personel-ekle` | POST | Personel ekleme |
| `/api/gorev-ekle` | POST | Ajan görevi ekleme |
| `/api/is-emri-ekle` | POST | İş emri oluşturma |
| `/api/stok-hareket-ekle` | POST | Stok hareketi kaydetme |

### 4.4 — Sorgulama & Raporlama API
| Endpoint | Yöntem | Açıklama |
|----------|--------|---------|
| `/api/kasa-ozet` | GET | Kasa özet raporu (Karargah KPI) |
| `/api/veri-getir` | GET | Genel veri getirme |
| `/api/rapor/kor-nokta` | GET | Kör nokta analiz raporu |
| `/api/rapor/darbogaz` | GET | Darboğaz analiz raporu |
| `/api/rapor/yirtici-firsat` | GET | Fırsat analiz raporu |
| `/api/rapor/atil-sermaye` | GET | Atıl sermaye raporu |
| `/api/stok-alarm` | GET | Stok alarm sorgusu |
| `/api/health` | GET | Sistem sağlık kontrolü |
| `/api/kur` | GET | Döviz kuru çekimi |

### 4.5 — Yapay Zeka & Araştırma API
| Endpoint | Yöntem | Açıklama |
|----------|--------|---------|
| `/api/deepseek-analiz` | POST | DeepSeek AI analizi |
| `/api/perplexity-arama` | POST | Perplexity araştırma |
| `/api/trend-ara` | POST | Trend araştırma motoru |
| `/api/serp-trend` | POST | SERP tabanlı trend çekimi |
| `/api/model-hafizasi` | GET/POST | AI model hafıza yönetimi |
| `/api/m1-motor-test` | POST | M1 ajan motor testi |
| `/api/yargic-motor-test` | POST | Yargıç test endpoint |
| `/api/stress-test` | POST | Sistem yük testi |
| `/api/m1-scraper-webhook` | POST | Scraper webhook alıcı |
| `/api/b2b-webhook-tetikle` | POST | B2B webhook tetikleyici |

### 4.6 — Kamera & Üretim API
| Endpoint | Yöntem | Açıklama |
|----------|--------|---------|
| `/api/kamera-sayac` | POST | Edge AI sayım verisi alıcı |
| `/api/m4-vision` | POST | M4 Vision AI endpoint |
| `/api/vision-ajan` | POST | Vision analiz ajanı |
| `/api/stream-durum` | GET | go2rtc stream durum kontrolü |
| `/api/uretim-senkronize` | POST | Üretim verisini senkronize eder |
| `/api/beyaz-saha` | POST | Beyaz saha operasyonları |

### 4.7 — İletişim API
| Endpoint | Yöntem | Açıklama |
|----------|--------|---------|
| `/api/telegram-bildirim` | POST | Telegram mesaj gönderimi |
| `/api/telegram-foto` | POST | Telegram fotoğraf gönderimi |
| `/api/telegram-webhook` | POST | Telegram gelen mesaj alıcı |
| `/api/haberlesme` | GET/POST | İç mesajlaşma API |

### 4.8 — Altyapı API
| Endpoint | Yöntem | Açıklama |
|----------|--------|---------|
| `/api/kuyruk-motoru` | POST | Redis kuyruk işleme motoru |
| `/monitoring` | — | Sentry Error Tunnel (nextjs tunnel) |

---

## 5. YAPAY ZEKA AJANLARI

### 5.1 — Vercel Ortamındaki Ajanlar (src/lib/ajanlar-v2.js)
Supabase tabanlı, Next.js API Route üzerinden tetiklenir.

| Ajan Adı | Fonksiyon | Çalışma Zamanı | Açıklama |
|----------|-----------|----------------|---------|
| **Sabah Subayı** | `sabahSubayi()` | Vercel Cron 08:00 | 8 kontrol: Sipariş, stok, trend, üretim, fatura, kasa, personel, ajan görevi |
| **Akşamcı** | `aksamci()` | Vercel Cron 18:00 | 5 kontrol: Günlük kapanış, yarın teslim, kasa özeti, yarım işler |
| **Nabız** | `nabiz()` | Her 2 saatte Cron | Anlık tehlike: Stok alarmı, maliyet aşımı, üretim durumu |
| **Zincirci** | `zincirci()` | Olay bazlı | M1→M8 üretim zinciri geçiş sinyalleri (8 kontrol noktası) |
| **Finans Kalkanı** | `finansKalkani()` | Vercel Cron gece | Maliyet aşımı, alacaklar, kasa kritik, aylık gider artışı |
| **Trend Kâşifi** | `trendKasifi()` | Haftalık Cron | Perplexity API ile pazar araştırması → b1_arge_trendler |
| **Muhasebe Yazıcı** | `muhasebeYazici()` | Aylık Cron | Net kâr analizi, model kârlılığı, aylık özet raporları |

### 5.2 — Orkestrasyon Sistemi
```
/api/ajan-orkestrator (POST)
  ├── mod:'tara'    → 26 modülü tarar, görev listesi üretir
  ├── mod:'dagit'   → Worker A (kritik) + Worker B (diğer) paralel dağıtım
  └── mod:'dogrula' → Her iki Worker'ın çıktısını birleştirir

/api/worker-ajan (POST)
  └── Worker_A / Worker_B → Görev işler, Supabase'e sonuç yazar
```

### 5.3 — Yerel Makine (Engin PC) Ajanları
| Dosya | Konum | Açıklama |
|-------|-------|---------|
| `yargic.js` | src/scripts/ai_mastermind/ | Node.js Yargıç Ajanı — Ürün onay/ret kararı |
| `kopru_ajan.js` | src/scripts/ai_mastermind/ | Köprü Ajanı — Modüller arası veri taşıma |
| `OluIsciScraper.js` | src/lib/agents/scraper/ | Ölü İşçi Scraper — Rakip fiyat/stok izleme |
| `oluisci.js` | src/scripts/scrapers/ | Puppeteer tabanlı veri kazıyıcı |

### 5.4 — Edge AI (Yerel Kamera Sayacı)
```
Konum: NIZAM_OFFLINE_SAYAC/lokal_sayac.py
Teknoloji: YOLO v8 (yolov8n.pt) + OpenCV + SQLite

İşleyiş:
  1. IP Kamera görüntüsü alınır (RTSP)
  2. YOLO ile nesne tespiti yapılır (tracking ID sistemi)
  3. Ürün sayısı yerel SQLite'a kaydedilir
  4. İnternet bağlantısı varsa → /api/kamera-sayac'a POST gönderilir
  5. Başarılı response (200/201) → senkronize=1 işaretlenir
  6. İnternet yoksa → yerel kuyrukta bekler, bağlantı gelince gönderir

Kritik özellikler:
  - time.sleep() YOK (v2.0'da kaldırıldı — race condition engellendi)
  - or True YOK (v2.0'da kaldırıldı — veri kaybı engellendi)
  - Tracking ID Vector sistemi: Her ürün SADECE BİR KEZ sayılır
```

---

## 6. BOT SİSTEMLERİ

### 6.1 — Telegram Botu (Lumora_47bot)
```
Token: .env.local → TELEGRAM_BOT_TOKEN
Chat ID: .env.local → TELEGRAM_CHAT_ID / TELEGRAM_ADMIN_CHAT_ID

Tetikleme yolları:
  ├── /api/telegram-bildirim → Metin mesaj gönderir
  ├── /api/telegram-foto → Fotoğraf + başlık gönderir
  └── /api/telegram-webhook → Gelen komutu alır, işler

Kullanım senaryoları:
  ├── Kamera offline alarmı → "🔴 KRİTİK UYARI: NVR Kapandı"
  ├── Stok sıfır → "Stok Alarmı: X ürün tükendi"
  └── Sabah brifing → "📋 Sabah Brifing — X kritik bulgu"
```

### 6.2 — Scraper / Crawler Botu
```
Dosya: src/scripts/scrapers/oluisci.js + src/lib/agents/scraper/OluIsciScraper.js
Teknoloji: Puppeteer (Headless Chrome)
Çalışma: Sadece Yerel PC (Vercel'e taşınamaz — Chrome yok)

İşlev:
  - Rakip site fiyat takibi
  - Trendyol/Hepsiburada stok izleme
  - Scraping sonuçları Supabase'e yazar
```

---

## 7. ALTYAPИ KATMANLARı

### 7.1 — Çevre Değişkenleri (Environment Variables)
| Değişken | Açıklama | Konum |
|---------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Proje URL | Vercel + .env.local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Key | Vercel + .env.local |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Admin Key (RLS bypass) | Vercel + .env.local |
| `JWT_SIRRI` | JWT İmzalama Anahtarı (min 32 karakter) | Vercel + .env.local |
| `INTERNAL_API_KEY` | Server-to-Server API Key | Vercel + .env.local |
| `OPENAI_API_KEY` | OpenAI GPT API | Vercel + .env.local |
| `PERPLEXITY_API_KEY` | Perplexity API | Vercel + .env.local |
| `GEMINI_API_KEY` | Google Gemini API | Vercel + .env.local |
| `DEEPSEEK_API_KEY` | DeepSeek API | Vercel + .env.local |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot (Lumora_47bot) | Vercel + .env.local |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID | Vercel + .env.local |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | Vercel + .env.local |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | Vercel + .env.local |
| `NEXT_PUBLIC_GO2RTC_URL` | Kamera Stream URL | Vercel + .env.local |
| `GO2RTC_URL` | Internal go2rtc Cloudflare URL | .env.local |
| `SERPAPI_API_KEY` | SERP trend araştırma | Vercel + .env.local |
| `CRON_SECRET` | Vercel Cron güvenlik anahtarı | Vercel (sadece) |
| `COORDINATOR_PIN` | Koordinatör PIN | Vercel + .env.local |
| `URETIM_PIN` | Üretim PIN | Vercel + .env.local |
| `GENEL_PIN` | Genel Personel PIN | Vercel + .env.local |

### 7.2 — Supabase Veritabanı Tablo Listesi (Tespit Edilenler)

**B1 — Sistem & Operasyon Tabloları**
| Tablo | Açıklama |
|-------|---------|
| `b1_ajan_gorevler` | Ajan görev kuyruğu |
| `b1_agent_loglari` | Ajan işlem logları (ajan_adi, islem_tipi, mesaj, sonuc) |
| `b1_sistem_uyarilari` | Sistem alarmları (id, uyari_tipi, seviye, baslik, mesaj, kaynak_tablo, kaynak_id, durum, **olusturma**, cozum_tarihi, neden, potansiyel_zarar) |
| `b1_arge_trendler` | Ar-Ge trend veritabanı (baslik, platform, kategori, talep_skoru, durum, zincir_bildirim_m2…) |
| `b1_personel` | Personel kayıtları (ad_soyad, durum, saatlik_ucret_tl) |
| `b1_uretim_kayitlari` | Üretim iş emirleri |
| `b1_maliyet_kalemleri` | Maliyet kalemleri (maliyet_tipi: fire_kaybi vb.) |
| `b1_muhasebe_raporlari` | Muhasebe raporları |
| `b1_maliyet_kayitlari` | Maliyet kayıt tablosu (tutar_tl, maliyet_tipi) |
| `b1_model_taslaklari` | Model taslakları |
| `b1_modelhane_kayitlari` | Modelhane işlem kayıtları |
| `b1_kesim_emirleri` | Kesim emirleri |
| `b1_kumas_arsiv` | Kumaş arşivi |
| `b1_ic_mesajlar` | İç mesajlaşma |
| `b1_mesaj_gizli` | Şifreli mesajlar |

**B2 — Ticari Tablolar**
| Tablo | Açıklama |
|-------|---------|
| `b2_urun_katalogu` | Ürün kataloğu (aktif, stok_adeti, min_stok, durum) |
| `b2_siparisler` | Sipariş yönetimi (siparis_kodu, musteri_adi, durum, teslim_tarihi) |
| `b2_kasa_hareketleri` | Finansal hareketler (hareket_tipi: gelir/gider/borc/alacak, tutar, odendi, vade_tarihi) |
| `b2_musteriler` | Müşteri kayıtları |
| `b1_arge_products` | ARGE ürün kayıtları (urun_adi) |
| `m2_finans_veto` | M2 Maliyet & Veto kayıtları |
| `production_orders` | Üretim emirleri (status: pending/in_progress/in_production) |
| `camera_events` | Kamera olayları (camera_id, event_type, video_url) |
| `b0_tasarim_ayarlari` | Tasarım sistem ayarları |

### 7.3 — Kamera Sistemi
```
Teknoloji: go2rtc (Golang tabanlı WebRTC/HLS relay)
URL: kamera.mizanet.com (Cloudflare Tunnel → Engin PC)
Internal: https://gig-viewing-reaching-shape.trycloudflare.com

12 IP Kamera → H.264/WebRTC:
  Kamera 1–4  : Üretim Bandı 1 (Kesim + Dikim)
  Kamera 5–8  : Üretim Bandı 2 (Kontrol + Paketleme)
  Kamera 9–12 : Depo + Giriş/Çıkış Noktaları

Bağlantı: Karargah → /kameralar sayfası → WebRTC (WebSocket) → go2rtc
```

---

## 8. GÜVENLİK MİMARİSİ

```
Katman 1 — Middleware (Edge Runtime):
  ├── Bot imza engelleme (16 kötü bot imzası)
  ├── IP Whitelist (isteğe bağlı)
  ├── JWT doğrulama (SubtleCrypto HMAC-SHA256)
  └── Korunmayan rotalar: /giris, /api/pin-dogrula, /api/health, /monitoring

Katman 2 — API Katmanı (Internal Key):
  ├── x-internal-api-key header zorunluluğu
  ├── Server-to-server tüm çağrılarda key kontrolü
  └── Key: INTERNAL_API_KEY env var (hardcoded fallback YOK)

Katman 3 — Supabase (RLS):
  ├── Hassas tablolar: kasa, guvenlik, denetmen, ajanlar
  ├── Sadece service_role key ile tam erişim
  └── anon key → sadece okuma / sınırlı yazma

Katman 4 — Rate Limiting:
  ├── Upstash Redis (REST API tabanlı)
  ├── 5 hatalı deneme → 15 dakika kilit (localStorage + server-side)
  └── Build-time null güvenliği: URL yoksa null döner (spam yok)

Katman 5 — 2FA (TOTP):
  ├── src/lib/totp.js
  └── /api/2fa-kurulum + /api/2fa-dogrula
```

---

## 9. CI/CD VE DEPLOYMENT

```
Akış:
  Yerel Kod (VS Code)
    → git push origin main
    → GitHub: the-order-nizam repo (main branch)
    → Vercel: Otomatik Build + Deploy (Hobby Plan)
    → mizanet.com canlıya geçer

Build Komutları:
  npm run dev   → Geliştirme sunucusu (localhost:3000)
  npm run build → Production build (Exit code 0 = başarılı)
  npm start     → Production sunucusu başlatma

Build Geçmişi (Bu Oturumda):
  ├── Hata 1: Sentry NativeCommandError → ÇÖZÜLDÜ (sourcemaps.disable:true)
  ├── Hata 2: M2-Finans Prerender (object export) → ÇÖZÜLDÜ (SafeM2FinansPaneli)
  ├── Hata 3: Upstash build-time spam → ÇÖZÜLDÜ (production guard)
  ├── Hata 4: /kalip useAuth outside Provider → ÇÖZÜLDÜ (AuthProvider ClientLayout)
  ├── Hata 5: ajan-orkestrator module not found → ÇÖZÜLDÜ (force-dynamic)
  └── Son Build: Exit code 0 ✓ | Commit: 1cf00f6 | 27 Mart 2026 21:10
```

---

## 10. BİLİNEN SORUNLAR VE BEKLEYEN GÖREVLER

### Acil (Production'ı Etkiliyor)
| # | Sorun | Kök Neden | Durum |
|---|-------|-----------|-------|
| 1 | Karargah 400 hatası | `b1_sistem_uyarilari` sorgusunda `created_at` yok, `olusturma` var | Kod düzeltildi, deploy bekleniyor |
| 2 | Middleware Güvenlik Açığı | 49 API rotasından yalnızca ~10'u JWT korumasında | Açık |
| 3 | setTimeout (Vercel) | `cron-ajanlar` içinde 5sn setTimeout kullanımı — Serverless'ta çalışmaz | Açık |

### Kritik (Mimari Sorunlar)
| # | Sorun | Çözüm |
|---|-------|-------|
| 1 | Puppeteer Vercel'de çalışmaz | Yerel PC'ye taşınmalı |
| 2 | Cron fonksiyonları 60sn Vercel limitini aşabilir | Upstash QStash / Message Queue |
| 3 | Statik PIN güvenliği (474747) | Supabase Auth JWT-Role tabanlı sisteme geçiş |
| 4 | `ajan-tetikle` God Object (Auth+DB+AI+Telegram aynı dosya) | Controller/Service/Repository ayırımı |

### Bekleyen Geliştirmeler
- [ ] M2-Finans sayfası Client-Side Supabase RLS onarımı
- [ ] Tüm API rotaları Middleware JWT korumasına alınması
- [ ] Puppeteer/Scraper kodlarının Vercel'den ayrılması
- [ ] Redis Rate Limit → Fall-Closed güvenlik protokolü
- [ ] YOLO özel model eğitimi (yolov8n.pt → custom tekstil modeli)
- [ ] Object Storage (Cloudflare R2) — AI medya dosyaları için Supabase'den migrasyon

---

## 11. DOSYA YAPISI ÖZETI

```
mizanet/
├── src/
│   ├── app/                    # 34 Sayfa + 49 API Rotası
│   │   ├── api/                # 49 endpoint
│   │   ├── karargah/           # Komuta Merkezi
│   │   ├── [diğer sayfalar]    # 33 modül sayfası
│   │   ├── ClientLayout.js     # AuthProvider sarmalayıcı
│   │   ├── layout.js           # Root Layout (Server)
│   │   └── middleware.js       # JWT + Bot Güvenliği
│   ├── features/               # 26 Özellik Modülü (Feature-First)
│   │   ├── karargah/hooks/     # useKarargah.js (KPI veri çekimi)
│   │   └── [25 diğer modül]
│   ├── lib/                    # 31 Yardımcı Kütüphane
│   │   ├── ajanlar-v2.js       # 7 Ajan (868 satır)
│   │   ├── auth.js             # AuthProvider + useAuth
│   │   ├── supabase.js         # Client-side Supabase
│   │   ├── supabaseAdmin.js    # Server-side Supabase (RLS bypass)
│   │   ├── redis_kuyruk.js     # Upstash Redis Queue
│   │   ├── rateLimit.js        # API Rate Limiter
│   │   └── [25 diğer lib]
│   └── scripts/                # Yerel Çalışan Scriptler
│       ├── ai_mastermind/      # yargic.js + kopru_ajan.js
│       └── scrapers/           # oluisci.js (Puppeteer)
├── scripts/                    # Geliştirme & Test Araçları (20 dosya)
├── NIZAM_OFFLINE_SAYAC/        # Edge AI Sayım Sistemi
│   ├── lokal_sayac.py          # YOLO v8 + SQLite + API Senkron
│   └── yolov8n.pt              # YOLO model dosyası
├── next.config.mjs             # Sentry, CORS, Webpack, CSP
├── gemini.md                   # Asistan İletişim Protokolü
└── SISTEM_HARITASI.md          # Bu dosya
```

---

*Son güncelleme: 27 Mart 2026 — 21:40 | Commit: 1cf00f6*
