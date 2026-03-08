# 📊 7 AJAN — API KULLANIM VE MALİYET HESABI

# Tarih: 07.03.2026 | Hazırlayan: Antigravity AI

---

## 🔢 HESAP METODOLOJISI

**Günlük çalışma varsayımı:** 08:00-18:00 (10 saat)
**Aylık iş günü:** 26 gün
**API'ler:**

- Supabase (DB sorgu) — Ücretsiz tier: 500.000 istek/ay
- Perplexity AI (internet arama) — $5/ay sabit plan VEYA $1/1M token
- OpenAI / Gemini — Sadece Muhasebe Yazıcı kullanır

---

## 📋 AJAN BAZINDA GÜNLÜK API KULLANIMI

### 🌅 AJAN 1 — SABAH SUBAY'I

| İşlem | Supabase Sorgu | AI API | Sıklık |
|---|---|---|---|
| Sipariş kontrolü | 1 sorgu | 0 | Günde 1 |
| Stok kontrolü | 1 sorgu | 0 | Günde 1 |
| Trend kontrolü | 1 sorgu | 0 | Günde 1 |
| Üretim kontrolü | 1 sorgu | 0 | Günde 1 |
| Brifing yazma | 1 sorgu (INSERT) | 0 | Günde 1 |
| **TOPLAM/GÜN** | **5 sorgu** | **0** | |
| **TOPLAM/AY** | **130 sorgu** | **0** | |

**Aylık maliyet: ₺0 (Ücretsiz tier içinde)**

---

### 🌆 AJAN 2 — AKŞAMCI

| İşlem | Supabase Sorgu | AI API | Sıklık |
|---|---|---|---|
| Günlük üretim özeti | 2 sorgu | 0 | Günde 1 |
| Yarın teslim listesi | 1 sorgu | 0 | Günde 1 |
| Kasa özeti | 1 sorgu | 0 | Günde 1 |
| Rapor kaydetme | 1 sorgu (INSERT) | 0 | Günde 1 |
| **TOPLAM/GÜN** | **5 sorgu** | **0** | |
| **TOPLAM/AY** | **130 sorgu** | **0** | |

**Aylık maliyet: ₺0 (Ücretsiz tier içinde)**

---

### 💓 AJAN 3 — NABIZ

| İşlem | Supabase Sorgu | AI API | Sıklık |
|---|---|---|---|
| Stok alarm tarama | 1 sorgu | 0 | Günde 5 tur |
| Maliyet tarama | 1 sorgu | 0 | Günde 5 tur |
| Üretim canlılık | 1 sorgu | 0 | Günde 5 tur |
| Kasa kontrolü | 1 sorgu | 0 | Günde 5 tur |
| Alarm yazma (koşullu) | 0-1 sorgu | 0 | Sadece alarm varsa |
| **TOPLAM/GÜN** | **20-25 sorgu** | **0** | |
| **TOPLAM/AY** | **520-650 sorgu** | **0** | |

**Aylık maliyet: ₺0 (Ücretsiz tier içinde)**

---

### ⛓️ AJAN 4 — ZİNCİRCİ

| İşlem | Supabase Sorgu | AI API | Sıklık |
|---|---|---|---|
| Olay dinleme (polling) | 2 sorgu | 0 | Her 10 dakika |
| Aşama geçiş bildirimi | 2 sorgu (UPDATE+INSERT) | 0 | Olay başına |
| Log yazma | 1 sorgu | 0 | Her tetiklemede |
| **TEKİL OLAY** | **5 sorgu** | **0** | |
| **Ortalama/Gün** | **Polling: 120 + Olay: ~30** | **0** | (15 olay/gün tahmini) |
| **TOPLAM/AY** | **~3.900 sorgu** | **0** | |

> **Not:** Polling (her 10 dk bir "ne değişti?" kontrolü) tüketimi en fazla olan ajan.
> **Next.js Realtime** Supabase webhookları kullanılırsa polling 0'a düşer → Ay: ~390 sorgu

**Aylık maliyet: ₺0 (Ücretsiz tier içinde)**

---

### 🛡️ AJAN 5 — FİNANS KALKANI

| İşlem | Supabase Sorgu | AI API | Sıklık |
|---|---|---|---|
| Maliyet tablosu tarama | 2 sorgu | 0 | Günde 3 kez |
| Alacak vadesi kontrolü | 1 sorgu | 0 | Günde 1 kez |
| Kasa kontrolü | 1 sorgu | 0 | Günde 3 kez |
| Alarm yazma (koşullu) | 0-1 sorgu | 0 | Sadece eşik aşılırsa |
| **TOPLAM/GÜN** | **12-15 sorgu** | **0** | |
| **TOPLAM/AY** | **310-390 sorgu** | **0** | |

**Aylık maliyet: ₺0 (Ücretsiz tier içinde)**

---

### 🔍 AJAN 6 — TREND KÂŞİFİ

| İşlem | Supabase Sorgu | Perplexity API | Sıklık |
|---|---|---|---|
| Mevcut trendleri çek | 1 sorgu | 0 | Her göreve başlarken |
| İnternet araştırması | 0 | **1 API çağrısı** | Her göreve başlarken |
| Duplicate kontrolü | 1 sorgu/trend | 0 | 5-10 trend başına |
| Trend kaydetme | 5-10 INSERT | 0 | Her göreve 5-10 |
| Sonuç yazma | 1 sorgu | 0 | Görev sonunda |
| **Haftalık (1 görev)** | **~20 sorgu** | **1 çağrı** | |
| **Aylık (4 görev)** | **~80 sorgu** | **4 çağrı** | |
| **Manuel çağrı (+2/ay)** | **+40 sorgu** | **+2 çağrı** | |
| **TOPLAM/AY** | **~120 sorgu** | **6 çağrı** | |

**Perplexity Maliyet Hesabı:**

```
Sonar modeli: $1 / 1M token
Ortalama istek: ~500 token giriş + ~1500 token çıkış = 2000 token
6 çağrı × 2000 token = 12.000 token/ay
Maliyet = 12.000 / 1.000.000 × $1 = $0.012/ay = ~₺0.40/ay
```

**Aylık maliyet: ~₺0.40 (neredeyse sıfır)**

---

### 📊 AJAN 7 — MUHASEBE YAZICI

| İşlem | Supabase Sorgu | AI API | Sıklık |
|---|---|---|---|
| Tüm modüllerden veri çekme | 8-10 sorgu | 0 | Ayda 1-2 kez |
| AI ile analiz/yorum | 0 | **1 AI çağrısı** | Ayda 1-2 kez |
| Rapor kaydetme | 2 sorgu | 0 | Ayda 1-2 kez |
| **TOPLAM/AY** | **~24 sorgu** | **2 çağrı** | |

**AI Maliyet Hesabı:**

```
Gemini Flash modeli kullanılırsa: $0.075 / 1M token
Rapor analizi: ~5000 token/çağrı
2 çağrı × 5000 = 10.000 token/ay
Maliyet = 10.000 / 1.000.000 × $0.075 = $0.00075/ay = ~₺0.025/ay
```

**Aylık maliyet: ~₺0.03 (fiilen sıfır)**

---

## 🧮 TOPLAM AYLIK ÖZET

| Kaynak | Kullanım/Ay | Limit | Kullanım % | Ücret |
|---|---|---|---|---|
| **Supabase Sorgu** | ~5.000-6.000 | 500.000 | **%1.2** | ₺0 |
| **Perplexity API** | 6 çağrı | Sınırsız (ücretli) | — | **₺0.40** |
| **Gemini Flash** | 2 çağrı | 1500 ücretsiz/gün | **%0.04** | ₺0 |
| **Supabase Storage** | Minimal | 1 GB | %0 | ₺0 |
| **Vercel (Hosting)** | Mevcut plan | Mevcut plan | — | ₺0 |

---

## 💰 TOPLAM AYLIK MALİYET

```
┌─────────────────────────────────────┐
│  7 AJAN TOPLAM AYLIK MALİYET:       │
│                                     │
│  Perplexity (Trend Kâşifi):  ₺0.40 │
│  Diğer tüm ajanlar:          ₺0.00  │
│                                     │
│  TOPLAM:                     ₺0.40  │
│                                     │
│  (Aylık 1 bardak çay fiyatı)        │
└─────────────────────────────────────┘
```

---

## 📈 ÖNEMLİ NOT: Supabase Realtime Kullanımı

Zincirci ajana **Supabase Realtime** (webhook/subscription) eklersek:

- Polling sorgusu: 2.160/ay → **0**'a düşer
- Sistem anlık tepki verir (10 dakika beklemek yerine 1 saniye)
- Supabase Realtime ücretsiz tier'da dahil

**Bu optimizasyon eklenmeli → Aylık 2.160 gereksiz sorgu ortadan kalkar.**

---

## ⚠️ BÜYÜME SENARYOSU

Sistem büyüyünce (6 ay sonra):

| Durum | Aylık Sorgu | Aylık Maliyet |
|---|---|---|
| Şu an | ~6.000 | ₺0.40 |
| 3x büyüme | ~18.000 | ₺1.20 |
| 10x büyüme | ~60.000 | ₺4.00 |
| Supabase limiti | 500.000 | Ücretsiz tier biter |

**Sonuç:** Supabase ücretli plana geçmemiz için sistemin 80x büyümesi gerekir.
**Bu proje mimarisi son derece verimli ve ekonomiktir.**
