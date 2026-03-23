# 🧠 SESSION HANDOFF — 17 Mart 2026 (Gece Sonu)
> Bir sonraki sohbette bu dosyayı `/baslat` ile aç veya AI'a göster.
> **Son güncelleme: 17 Mart 2026 23:00**

---

## 🔴 NEREDE KALDIK — HIZLI ÖZET

### Bu oturumda alınan en önemli karar:
> **"Önce yolu belirleyeceğiz, sonra yola çıkacağız."**

### Mimari karar (kesin):
- ❌ HTTP scraper yok (eski `oluisci.js` kalkıyor)
- ✅ **Browser Agent** → Playwright + AI Vision
- Ajan gerçek tarayıcı açar, sayfayı insan gibi okur, kaydeder, kapatar
- Trendyol'da **18 kriter** okunacak (eksik bırakmadan)
- Hafıza gerekirse var: kısa (in-process) + uzun (Supabase)

### Dosyalar hazır (kod yazılmadı, plan tamam):
| Dosya | Ne |
|-------|-----|
| `_agents/ANALIZ_01_ARGE_TREND.md` | AR-GE sayfası A-H blok analizi |
| `_agents/ANALIZ_02_KARARGAH.md` | Karargah komuta merkezi analizi |
| `_agents/ANALIZ_03_KUMAS_ARSIV.md` | Dijital malzeme kütüphanesi analizi |
| `_agents/ANALIZ_04_KALIP_MODELHANE.md` | Kalıp sistemi analizi |
| `_agents/VERI_MIMARISI_TASLAK.md` | Platform bazlı veri toplama planı (taslak) |
| `_agents/SESSION_HANDOFF.md` | Bu dosya |

### Bir sonraki sohbet açılınca ilk yapılacak:
1. Bu dosyayı oku
2. Kullanıcıya sor: **"Browser Agent'tan mı başlıyoruz yoksa sayfaların içini mi dolduracağız?"**
3. Ona göre harekete geç — kod yazmadan önce onay al

---

---

## 🚨 KRİTİK MİMARİ KARAR — BROWSER AGENT MİMARİSİ

### Ajan Nasıl Çalışır
```
Ajan başlar
  → Trendyol'da hedef kategoriye gider
  → Ürün listesini görür
  → Her ürüne TEKER TEKER girer
  → O ürün sayfasında BÜTÜN KRİTERLERİ okur (eksik bırakmaz)
  → Okuduklarını hafızaya yazar
  → Bir sonraki ürüne geçer
  → Tüm ürünler bitti → Supabase'e toplu yazar → Tarayıcı kapanır
```

### Trendyol'da Okunacak KRİTERLER (Tam Liste)
Ajan bir ürün sayfasına girince bunların HEPSİNE bakar:

```
1. Ürün Adı
2. Fiyat (güncel)
3. İndirim oranı (varsa)
4. Satıcı / Marka
5. Değerlendirme puanı (1-5 yıldız)
6. Yorum sayısı
7. Satış adedi ("X kez satıldı")
8. Favori sayısı (beğeni)
9. Kategori (kadın > elbise > midi vb.)
10. Kumaş / Materyal içeriği (% pamuk vb.)
11. Renk seçenekleri (kaç renk var)
12. Beden seçenekleri (S/M/L stok durumu)
13. Kargo süresi
14. İade politikası
15. Ürün görseli (screenshot veya URL)
16. Ürün açıklaması (ilk 200 karakter)
17. "Trendyol Bu Ürünü Seviyor" / Trend etiketi (varsa)
18. Benzer ürün sayısı (alt kategorideki rekabet)
```

### Ajanın İhtiyaçları

| İhtiyaç | Araç | Not |
|---------|------|-----|
| Tarayıcı kontrolü | **Playwright** (Python) | Headless Chrome |
| Sayfa okuma + anlama | **Gemini Vision** veya **GPT-4o** | Ekran görüntüsü → metin |
| Oturum hafızası | **In-process dict** (kısa) | Bir çalışma içinde ürünleri hatırla |
| Uzun vadeli hafıza | **Supabase** | Önceki çalışmaları hatırla |
| Görev planlaması | **LangChain Agent** veya **browser-use** | Hangi sayfaya git, ne oku |
| Rate limit koruması | Ajan ayarı | Sayfalar arası 3-5sn bekle |

### Hafıza Gereksinimleri
```
Kısa hafıza (bir tur içinde):
  → Zaten bakılan ürünler listesi (duplicate önleme)
  → Kategori bağlamı (kadın elbise mi, erkek pantolon mu)

Uzun hafıza (Supabase'de):
  → b1_arge_products → Ajanın okuduğu ham veri
  → created_at → Ne zaman bakıldı
  → agent_session_id → Hangi turda görüldü
  → Bu ürüne daha önce bakıldı mı? → Fiyat değişmiş mi?
```

### Mimari Akış (Tam)
```
[Görev]: "Kadın elbise kategorisinde ilk 30 ürünü analiz et"
     ↓
[Playwright] → trendyol.com/kadin-giyim-elbise aç
     ↓
[Sayfa Listesi] → 30 ürün URL'si topla
     ↓
Her ürün için:
  [Playwright] → ürün sayfasına git
  [Vision AI]  → 18 kriteri ekrandan oku
  [Hafıza]     → dict'e yaz
  [Bekle]      → 3-5sn
     ↓
[Tüm ürünler bitti]
     ↓
[Supabase] → b1_arge_products'a toplu INSERT
     ↓
[Batch AI] → Analiz → b1_arge_strategy'e karar yaz
     ↓
[Tarayıcı kapat] → Ajan durur
```

### Önümüzdeki Oturumda Yapılacaklar
```
□ browser-use kütüphanesini araştır/kur: pip install browser-use
□ VPS'te Playwright + Chromium kurulumu doğrula
□ 18 kriter için JSON çıktı şeması tasarla
□ b1_arge_products tablosuna agent_session_id kolonu ekle
□ İlk test: 5 ürün → tam okuma → Supabase kayıt
□ Gemini Vision API'yi Playwright screenshot'ıyla test et
```

> **Ajan sayfayı kapatıp geçmez.**
> **Kaç kritere bakmak gerekiyorsa o kadar bakar.**
> **Hafıza gerekiyorsa hafıza var. Her şey planlanmış.**



---



## 📍 ŞU AN NEREDEYIZ?

### Supabase Durumu
- **17 Mart gece ~20:26'da** Supabase NANO plan disk I/O limitini aştı (KarargahMainContainer sonsuz döngü).
- Sonsuz döngü **düzeltildi** (`gun45Once` → component dışı sabit `GUN_45_ONCE`).
- Supabase **restore edildi** ama 22:00 itibarıyla hâlâ "Sağlıksız" durumda (5 dk içinde düzeliyor mesajı görüldü).
- **Yarın sabah kontrol et:** `https://cauptlsnqieegdrgotob.supabase.co` → Supabase Dashboard

### Uygulamanın Genel Durumu
- **mizanet.com** → Vercel'de deploy var, Supabase sağlıklı olunca her şey çalışır
- **localhost:3000** → npm run dev ile açık, terminal çalışıyor

---

## ✅ 17 MART BOYUNCA YAPILAN HER ŞEY

### Sabah / Öğlen — Bug Fixler
- `KarargahMainContainer.js` → `gun45Once` sonsuz döngü düzeltildi ✅
- `pin-dogrula/route.js` → fire-and-forget log insert (await kaldırıldı) ✅
- `auth.js` → fire-and-forget log insert ✅
- `AjanKomutaGostergesi.jsx` → Müfettiş (AI) kartı eklendi, /denetmen linki ✅
- `globals.css` → sidebar 260→290px ✅

### Akşam — AI Sistem Envanteri
- Tüm API route'ları tarandı, gerçek AI envanter tablosu çıkarıldı:
  - **Gemini** ✅ (batch-ai, ajan-yargic, darboğaz, rapor)
  - **OpenAI gpt-4o-mini** ✅ (kamera gözcü, telegram-webhook)
  - **Perplexity Sonar** ✅ (kasif, kahin, trend-ara)
  - **DeepSeek** ⚠️ Key var, route YOK → bugün eklendi
  - **SerpAPI** ⚠️ Key var, route YOK → bugün eklendi
  - **Telegram Bot** ✅ (bildirim, alarm, foto, webhook)

### Gece — AR-GE Sayfası İnşası
Kullanıcının analizi doğrultusunda 3 yeni dosya yazıldı:

#### 1. `/api/serp-trend/route.js` (YENİ)
- SerpAPI → Google organic + shopping sonuçları
- Türkiye pazarı için fiyat aralığı analizi
- Rate limit: 5sn/IP (in-memory)

#### 2. `/api/deepseek-analiz/route.js` (YENİ)
- DeepSeek-V3 (deepseek-chat modeli)
- Ürün adı → üretim kararı (ÜRET/TEST/İZLE/REDDET) + maliyet + risk JSON

#### 3. `/src/features/arge/components/ArgeIstihbaratPanel.js` (YENİ)
**5 sekmeli istihbarat paneli — AR-GE sayfasının başına eklendi:**
- **Sekmeler:** Karar Paneli · Erken Giriş · Ajan Log · Google Trend · DeepSeek Analiz
- **Karar Paneli** → `b1_arge_strategy` tablosundan ÜRET/TEST/İZLE/İPTAL + skor + kâr tahmini
- **Erken Giriş (E Bloğu)** → `b1_arge_trendler` → talep≥7 + zorluk≤4 = ERKEN GİR badge (mor)
- **Ajan Log (H Bloğu)** → `b1_agent_loglari` canlı gösterim
- **Google Trend** → SerpAPI arama + shopping sonuçları + ilgili aramalar
- **DeepSeek Analiz** → Ürün gir → maliyet/risk/karar al

#### ArgeMainContainer.js (modificado)
- İstihbarat paneli import edildi ve sayfanın başına eklendi

---

## 🔴 TAMAMLANMAMIŞ / AÇIK GÖREVLER

### Kritik (Yarın İlk Yapılacaklar)
```
□ Supabase sağlık kontrolü yap (yarın sabah)
□ VPS scraper'larının çalışıp çalışmadığını kontrol et
  → b1_arge_products tablosuna veri geliyor mu?
  → b1_arge_strategy tablosu dolu mu? (ArgeIstihbaratPanel için şart)
□ arge_test_paneli/ ve karargah/test-arge/ → SİL (gereksiz test sayfaları)
□ /api/test-arge/ajan2-analist/route.js → SİL veya production'dan gizle
```

### AR-GE Sayfası — Eksik Bloklar (Kullanıcı Analizinden)
```
□ A Bloğu: Canlı Trend Akışı (son 24h yükselen ürünler, trend skor 0-100)
  → b1_arge_trendler'den son 24h filter + talep_skoru görseli
□ B Bloğu: Trend Radar (Zaman serisi grafik)
  → Scraper çalıştıkça oluşacak, recharts veya basit SVG ile
□ C Bloğu: Sosyal + Pazar Eşleşme
  → TikTok direkt API yok, Perplexity ile dolaylı yapılabilir
□ F Bloğu: Trend Haritası (kategori bazlı)
  → b1_arge_trendler kategori breakdown, treemap veya bar chart
```

### Karargah Sayfası — Eksik
```
□ Karargah KPI'ları → gerçek DB sorguları (şu an statik rakamlar)
□ Her ajan kartında canlı durum göstergesi
□ Alarm paneli → b1_sistem_uyarilari tablosundan
```

### Diğer Öncelikler (Değişmedi)
```
□ siparislerApi.js → limit 200 → 50 + pagination
□ ajanlarApi.js → agentLoglariGetir(sayfa) fonksiyonu
□ Kumaş & Arşiv → b2_malzeme_katalogu tablosu + Supabase Storage görseller
□ Kalıp (Modelhane) → model kartı oluşturma, metraj hesabı
```

---

## 🗺️ TEKNİK HARİTA

### Kullanılan Tablolar (AR-GE Sistemi)
| Tablo | Ne İçin | Dolumu |
|-------|---------|---------|
| `b1_arge_products` | Scraper ham veri | Scraper çalışınca |
| `b1_ai_is_kuyrugu` | Batch AI kuyruğu | Yargıç ajanı çalışınca |
| `b1_arge_strategy` | ÜRET/TEST/İZLE/İPTAL kararları | Batch AI çalışınca |
| `b1_arge_trendler` | Trend listesi | Manuel + otomatik |
| `b1_arge_trend_data` | Skor detayları | Batch AI çalışınca |
| `b1_agent_loglari` | Ajan aktivite logu | Her ajan işleminde |

### Algoritma (Fırsat Skoru)
```js
// /api/batch-ai/route.js
trendSkoru = (satis_buyumesi*0.35) + (sosyal_medya_etkisi*0.30)
           + (rakip_kullanim_hizi*0.20) + (sezon_uyumu*0.15)
firsatSkoru = trendSkoru - (ortalamaRisk * 0.5)
// ≥85 → ÜRETİM | ≥70 → TEST | ≥50 → İZLE | <50 → REDDET
```

### API Key Durumu
| Key | Durum | Kullanıldığı Yer |
|-----|-------|-----------------|
| `GEMINI_API_KEY` | ✅ Çalışıyor | batch-ai, darboğaz, kasif |
| `OPENAI_API_KEY` | ✅ Var | kamera-gözcü, telegram-webhook |
| `PERPLEXITY_API_KEY` | ✅ Çalışıyor | kasif, kahin, trend-ara |
| `DEEPSEEK_API_KEY` | ✅ Key var, route yazıldı | /api/deepseek-analiz (YENİ) |
| `SERPAPI_API_KEY` | ✅ Key var, route yazıldı | /api/serp-trend (YENİ) |
| `TELEGRAM_BOT_TOKEN` | ✅ Çalışıyor | bildirim, alarm, foto |

---

## 🚀 YARIN İLK YAPILACAKLAR (Sıralı)

1. **Supabase sağlıklı mı?** → `https://cauptlsnqieegdrgotob.supabase.co` kontrol
2. **mizanet.com/arge** aç → ArgeIstihbaratPanel görünüyor mu?
3. **Google Trend sekmesi** test et → Bir ürün adı gir, SerpAPI çalışıyor mu?
4. **DeepSeek sekmesi** test et → Analiz geri dönüyor mu?
5. Karar Paneli sekmesinde veri yoksa → scraper + batch-ai tetikle
6. Test sayfalarını sil (`arge_test_paneli`, `karargah/test-arge`)

---

## 🔧 Ortam
- **Local:** `npm run dev` → localhost:3000
- **Production:** mizanet.com (Vercel)
- **GitHub:** github.com/engin248/47silba-tan01 → main branch
- **Supabase:** cauptlsnqieegdrgotob.supabase.co (NANO plan)
- **Vercel Project:** the-order-nizam
