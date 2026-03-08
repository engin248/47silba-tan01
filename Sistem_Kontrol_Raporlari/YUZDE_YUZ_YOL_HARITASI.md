# 🎯 %100'E GİDEN YOL — THE ORDER NIZAM

**Tarih:** 08.03.2026 | **Hazırlayan:** Antigravity AI
**Mevcut Skor:** ~72/100 → **Hedef:** 100/100

---

## 📊 MEVCUT DURUMU NEDEN 72 SAYIYORUZ?

| Kategori | Puan | Açıklama |
|----------|:----:|----------|
| Auth / Güvenlik | 9/10 | Brute-force, 8sa oturum, server-side PIN — eksik: Cloudflare |
| Offline | 9/10 | IndexedDB + senkronize — eksik: bazı sayfalarda test edilmedi |
| Realtime | 9/10 | Global + modül bazlı — eksik: kimi sayfalarda kanal çakışması |
| Veri Doğrulama | 8/10 | Mükerrer/negatif engeli var — eksik: Supabase UNIQUE constraint |
| API Güvenliği | 6/10 | Rate limit var ama serverless'ta etkisiz, client INSERT riski |
| DB Tutarlılığı | 6/10 | UNIQUE constraint eksik, `aktif` kolonu sorunu |
| **Canlı Test** | **0/10** | **74 test henüz yapılmadı — en büyük boşluk bu** |

---

## 🗺️ %100 YOL HARİTASI — 4 FAZ

---

## FAZ 1 — ANLIK DÜZELTİLEBİLİR (Antigravity yapabilir — ~2-3 saat)
>
> Bu faz tamamlanınca skor: **72 → 83**

### 1.1 🔧 KOD DÜZELTMELERİ

**A. `kumas/page.js` — `aktif` Kolonu Hatası**

- Satır 573: `kumaslar.filter(k => k.aktif).length` → `k.aktif` DB'de yoksa her zaman 0 döner
- Düzeltme: `k.aktif !== false` veya kolonu kaldır

**B. `uretim/page.js` — Offline UPDATE Sorunu**

- Satır 154: `cevrimeKuyrugaAl('production_orders', 'UPDATE', { id, status })`
- offlineKuyruk.js satır 94: UPDATE için `.update(islem.veri).eq('id', islem.veri.id)` — id doğru geçiyor mu?
- Test et + güvence altına al

**C. `layout.js` — Sidebar Status Etiketi**

- Satır 253-254: "2. Birim M9–M14" yazıyor ama M15 Güvenlik farklı grup
- Güncelle: Gerçek modül adları

### 1.2 🧪 ZOD ŞEMA GENİŞLETMESİ

- `zodSchemas.js` şu an sadece 2 schema var (ajanRaporSchema + formGirisSchema)
- Kumaş formu, iş emri, kesim formu için doğrulama şemaları ekle

### 1.3 📋 CANLI TEST LİSTESİ (74 Test)

- `CANLI_TEST_LISTESI.md` — 74 testin tamamı browser üzerinden çalıştırılır
- Her ✅/❌ işaretlenir, bulunan hatalar anında düzeltilir

---

## FAZ 2 — SUPABASE / DB GÖREVLERİ (Admin SQL — ~30 dakika)
>
> Bu faz tamamlanınca skor: **83 → 90**

### 2.1 🔐 UNIQUE CONSTRAINT

```sql
-- b1_gorevler tablosunda Race Condition kapama
ALTER TABLE b1_gorevler 
ADD CONSTRAINT uniq_gorev_baslik_durum UNIQUE (baslik, durum);
```

### 2.2 🔍 `aktif` KOLONU VARLIĞI KONTROLÜ

```sql
-- b1_kumas_arsivi'nde aktif kolonu var mı?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'b1_kumas_arsivi' AND column_name = 'aktif';
```

Yoksa ya kolonu ekle ya kodi temizle.

### 2.3 📈 PERFORMANS İNDEXLERİ

```sql
-- Sık sorgulanan alanlar için index
CREATE INDEX IF NOT EXISTS idx_kumas_kodu ON b1_kumas_arsivi(kumas_kodu);
CREATE INDEX IF NOT EXISTS idx_production_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_gorevler_durum ON b1_gorevler(durum);
```

### 2.4 🛡️ RLS KONTROLLERİ

- Tüm tablolarda RLS aktif mi?
- Public `SELECT` izni olmaması gereken (personel maaşı, muhasebe) tablolar için kontrol

---

## FAZ 3 — SUNUCU TARAFI GÜVENLİK (Next.js Server Routes — ~4-5 saat)
>
> Bu faz tamamlanınca skor: **90 → 96**

### 3.1 🔒 INSERT'LERİ SUNUCUYA TAŞIMA

Şu an tüm INSERT'ler `page.js` içinden direkt Supabase'e gidiyor.
Bu değişmeli:

```
Mevcut: Client → Supabase (tehlikeli)
Hedef:  Client → /api/veri-ekle → Supabase (güvenli)
```

**Yapılacak API Route'lar:**

- `/api/kumas-ekle` (route.js)
- `/api/iş-emri-ekle` (route.js)
- `/api/kesim-ekle` (route.js)
- `/api/gorev-ekle` → zaten var! ✅

Her route: `rateLimitKontrol()` + `veriDogrula(zodSchema, body)` + Supabase Service Key

### 3.2 ⚡ RATE LIMIT — KALICI HALE GETIRME

```bash
# Upstash Redis (Vercel ile ücretsiz tier uyumlu)
npm install @upstash/ratelimit @upstash/redis
```

`rateLimit.js` yoksa şu an Vercel her cold start'ta Map sıfırlanıyor.
Redis'e taşımak bunu kalıcı yapar.

### 3.3 🛡️ MIDDLEWARE GÜÇLENDIRME

- `/middleware.js` dosyası var mı? Yoksa oluştur
- Cookie-based auth kontrolü + yönlendirme
- Bot/crawler tespiti

---

## FAZ 4 — ALTYAPI / ÇEVRE (Admin İşlemleri — ~1-2 gün)
>
> Bu faz tamamlanınca skor: **96 → 100**

### 4.1 ☁️ CLOUDFLARE ENTEGRASYONU

- Vercel domain'ini Cloudflare arkasına al
- WAF kuralları: SQL injection, XSS, Bot imzaları
- Rate Limiting: IP başına dakikada max istek
- DDoS koruması otomatik aktif olur

### 4.2 📹 VİDEO SIKIŞTIRMA

- Mux.com (Vercel ile entegre çalışır, ücretsiz tier var)
- Ya da Supabase Edge Function ile basit sıkıştırma
- Yüklenen videoyu %70 küçültür → storage tasarrufu

### 4.3 📊 HATA İZLEME (Monitoring)

- Vercel Analytics → zaten açık olmalı
- Sentry.io entegrasyonu (ücretsiz tier) → üretim hataları anlık raporlanır

### 4.4 🔔 TELEGRAM BOT — CHAT_ID DOLDURMA

- `99_DUZELTILECEK_ISLEMLER.md`'de belirtilmiş
- CHAT_ID .env'e yazılmalı
- Bot aktif ama mesaj gitmiyor olabilir — test et

---

## ⚡ HIZLI KAZANIM SIRASI (Önce Bunlar)

```
1. [30 dk] → Canlı testi aç, kritik hataları bul
2. [30 dk] → Supabase SQL: UNIQUE + Index + aktif kolonu
3. [1 saat] → Kod düzeltmeleri (aktif hatası, sidebar, offline UPDATE)
4. [2 saat] → Server API Routes (en az 3 tane)
5. [2 saat] → Rate Limit Upstash'e taşı
6. [Async] → Cloudflare + Sentry + Mux (admin döneminde)
```

---

## 🏁 SONUÇ — KATEGORİ BAZLI HEDEF

| Kategori | Şimdi | FAZ 1 | FAZ 2 | FAZ 3 | FAZ 4 |
|----------|:-----:|:-----:|:-----:|:-----:|:-----:|
| Auth/Güvenlik | 9 | 9 | 9 | 10 | 10 |
| Offline | 9 | 10 | 10 | 10 | 10 |
| Realtime | 9 | 9 | 10 | 10 | 10 |
| Veri Doğrulama | 8 | 9 | 10 | 10 | 10 |
| API Güvenliği | 6 | 6 | 7 | 9 | 10 |
| DB Tutarlılığı | 6 | 7 | 10 | 10 | 10 |
| Canlı Test | 0 | 8 | 9 | 10 | 10 |
| Altyapı | 7 | 7 | 7 | 8 | 10 |
| **TOPLAM** | **72** | **83** | **90** | **96** | **100** |

---

> **Şu an ne yapalım?** FAZ 1'den başlayalım:
>
> - Canlı test listesi mi? (74 test, browser'da)  
> - Kod düzeltmeleri mi? (aktif hatası + offline UPDATE)  
> - Supabase SQL mi? (UNIQUE constraint + indexler)

*Rapor kaydedildi: 08.03.2026 19:07*
