# 🧠 SESSION HANDOFF — 17 Mart 2026 (Gece)
> Bir sonraki sohbette bu dosyayı `/baslat` ile aç veya AI'a göster.
> **Son güncelleme: 17 Mart 2026 22:09**

---

## 🚨 KRİTİK MİMARİ KARAR (Bu oturumun en önemli notu)

**SCRAPER KULLANILMAYACAK. Kimsenin verisi çekilmeyecek.**

### Yeni Felsefe: BEYAZ SİSTEM
```
Kullanıcı kendi gözüyle bakar (Trendyol, Instagram, vb.)
      ↓
Gördüğünü MANUEL olarak sisteme kaydeder
      ↓
AI → Kullanıcının girdiği bilgiyi analiz eder
      ↓
Karar: ÜRET / TEST / İZLE / İPTAL
```

### Ne Silinecek / Değiştirilecek
- `oluisci.js` (Trendyol scraper) → Kullanılmayacak
- `/api/worker-ajan` → Scraper worker → devre dışı
- `b1_arge_products` → Bot değil, kullanıcı dolduracak
- Batch AI kuyruğu → Scraper verisi yerine kullanıcı girişlerini analiz edecek

### Ne Kalacak / Güçlendirilecek
- ✅ AR-GE Manuel Form (kullanıcı ürün bilgisi girer)
- ✅ Gemini / DeepSeek analizi (kullanıcı girdisini analiz eder)
- ✅ Perplexity (kullanıcı ürünü hakkında piyasa yorumu)
- ✅ SerpAPI (kullanıcının girdiği ürünü Google'da validate eder)
- ✅ Tüm karar mekanizması (ÜRET/TEST/İZLE/İPTAL)

> **Gri yok. Her şey beyaz. Sistem rakibin verisini araklamaz.**
> **Kullanıcı araştırır → sisteme söyler → AI yardım eder.**

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
