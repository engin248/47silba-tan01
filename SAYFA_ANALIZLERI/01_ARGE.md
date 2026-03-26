# AR-GE & İSTİHBARAT KARAR CENDERESİ (M1) — Detaylı Sayfa Analizi
**Rota:** `/arge` | **Dosya:** `src/features/arge/components/ArgeMainContainer.js`  
**Görev:** AI scraper ajanlarının topladığı verileri karar mekanizmasından geçir. "Çok Satar / Bekle / İptal" kararı ver. Üretim onaylanan ürünü M2'ye (Kumaş) devret.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 4 Sekme (Canlı Akış / Karar Bekl. / Üretim Onaylı / İptal) | VAR | satır 15-16 |
| `b1_arge_products` tablosundan ürün listesi | VAR | satır 39-44 |
| `b1_agent_loglari` tablosundan log akışı | VAR | satır 47-52 |
| Karar butonu (İptal / Radarda Beklet / Üretime Sevk) | VAR | satır 261-273 |
| Karar → `b1_agent_loglari`'na log kaydı | VAR | satır 83-89 |
| `b1_arge_products.status` güncelleme | VAR | satır 76-79 |
| Realtime WebSocket (INSERT/UPDATE/DELETE) | VAR | satır 62-67 |
| Erken trend tespiti etiketi (viral_izlenme_hizi > 50k, satici < 5) | VAR | satır 206-210 |
| 5 metrik kartı (sepet_deltasi/yorum_deltasi/viral_hiz/satici/iade_risk) | VAR | satır 228-250 |
| satar_satmaz_skoru → 4 kademe renklendirme | VAR | satır 191-196 |
| Kaynak link (ürün URL) | VAR | satır 212 |
| Ajanlar panel bloğu (KPI + log) | VAR | satır 133-170 |
| Yetki kontrolü (tam grup veya üretim PIN) | VAR | satır 26-33 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. VERİ BANKASI BOŞLUĞU — SCRAPER ÇALIŞMIYOR

**Kök neden:** `scripts/arge_ajanlari/1_Scraper_Ajan.py` dosyasında git merge conflict işaretleri (`<<<<<<< HEAD`, `=======`, `>>>>>>> main`). Python dosyası çalıştırıldığında `SyntaxError` fırlatıyor.

**Etki:** `b1_arge_products` tablosuna hiçbir veri yazılmıyor. "Bu radar filtrelemesinde ürün bulunamadı." mesajı görünüyor. AI Karar butonu hiçbir zaman kullanılmıyor.

**Görünen UI:** Tüm sekmeler boş. "Karar Bekleyenler" sekmesinde hiçbir ürün yok.

### 2. AI SKORU — NE HESAPLIYOR BİLİNMİYOR

**ArgeMainContainer.js satır 191:**
```js
const skor = p.satar_satmaz_skoru || 0;
```
Bu skor `b1_arge_products` tablosundan doğrudan okunuyor. Kim hesaplıyor? Scraper ajanı mı, ayrı bir AI ajanı mı? Hesaplama formülü dokümante edilmemiş. Scraper çalışmadığı için 0 geliyor.

### 3. `b1_agent_loglari` — FARKLI MODÜLLER AYNI TABLOYU KULLANIYOR

Karargah Bot (NİZAMBOT), AR-GE Karar (M1 Karar Motoru), İmalat (finaleOnayVerMuhasebeyeYaz) hepsi `b1_agent_loglari`'na yazıyor. Kanal ismi:
```js
const kanalProd = supabase.channel('m1-arge-products-realtime')
```
Bu kanal yalnızca `b1_arge_products` tablosunu dinliyor ama log tablosunu dinlemiyor → Log akışı Realtime güncellenmiyor, yalnızca sayfa yüklenirken çekiliyor (ilk 10 kayıt).

### 4. ÜRETIME SEVK BUTONU — M2'YE GERÇEKTEn GİTMİYOR

**ArgeMainContainer.js satır 78:**
```js
await supabase.from('b1_arge_products').update({ status: 'uretim_onay' }).eq('id', id);
```
Buton tıklandığında yalnızca `b1_arge_products.status` güncelleniyor. M2 (Kumaş) sayfasına bildirim veya `b1_ic_mesajlar`'a mesaj gitmiyor. Kumaş sayfası `m1Talepleri` için `status = 'uretim_onay'` olan kayıtları filtreliyor ama bu filtre `useKumas.js` içinde; doğrudan bağlantı yok.

### 5. CRON OTOMASYOnU EKSİK

**vercel.json kontrolü:** `arge_zincir` cron job ekli değil. Scraper ajanı hiçbir zaman otomatik çalıştırılmıyor. Vercel'in production ortamında Python scripti nasıl çalışacak? Vercel Node.js tabanlı — Python için ayrı bir server ya da cron servisi gerekiyor.

### 6. KARAR LOG KAYDININ STATUS'I YANLIŞ

**Satır 81:**
```js
if (!error && (yeniDurum === 'uretim_onay' || yeniDurum === 'red')) {
```
`iptal` kararı verildiğinde log yazılmıyor. Sadece `uretim_onay` ve `red` loglanıyor.

### 7. EKSİK METRİKLER

Kod, UI için şu kolonları okuyor: `satar_satmaz_skoru`, `sepet_deltasi`, `yorum_deltasi`, `viral_izlenme_hizi`, `satici_sayisi`, `iade_risk_sinyali`, `status`, `title`, `product_url`, `created_at`.

Bu kolonlardan **hiçbirini scraper yazmıyor** (scraper çalışmıyor çünkü). Ama aynı zamanda:
- `ai_satis_karari` kolonu `b1_arge_products`'ta var mı? KalipMainContainer (satır 68) `ai_satis_karari IN ('ÇOK_SATAR', 'BİNGO')` filtresi kullanıyor ama ArgeMainContainer.js'de bu kolon hiç kullanılmıyor — şema sayfalar arasında tutarsız.

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Sorun |
|-------------|--------|-------|
| Scraper → b1_arge_products | TASARLANDI | Scraper çalışmıyor (merge conflict) |
| M1 → M2 (kumaş talebi) | KISMI | `status=uretim_onay` filtreliyor ama bildirim yok |
| M1 → Karargah alarm | VAR | `b1_arge_trendler` tablosundan çekiliyor |
| M1 → Kalıphane (M3) | KISMI | KalipMainContainer `b1_arge_products`'tan AI onaylıları çekiyor |
| TikTok/Pinterest veri | TASARLANDI | Scraper planlanmış ama yazılmamış |
| Influencer takip | TASARLANDI | Mimari dokümanda var, kod yok |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] **Satır 16: `aktifSekme: 1`** → Sayfa açıldığında "Karar Bekleyenler" sekmesi aktif ama tablo boş (scraper yok) — kullanıcı boş bir sekme görüyor
- [ ] **Satır 104: `aktifSekme === 1 ?`** → `status === 'inceleniyor' || !p.status` filtresi: status null olan kayıtları da "Karar Bekleyenler"e gösteriyor — manuel eklenen kayıtlarda karışıklığa yol açabilir
- [ ] **Satır 82: `yeniDurum === 'red'`** → `kararVer(p.id, 'iptal')` çağrılıyor ama log koşulunda `yeniDurum === 'red'` bekleniyor. `iptal` ≠ `red`, log atılmıyor.
- [ ] **Realtime log güncellenmez** → `kanalProd` sadece `b1_arge_products` dinliyor; karar verildiğinde yazılan log (`b1_agent_loglari`) realtime'a düşmüyor → Sol paneldeki loglar eskide kalıyor

---

## 📋 BİLGİ AKIŞI HARİTASI

```
1_Scraper_Ajan.py ─→ [ÇALIŞMIYOR - MERGE CONFLICT]
                            ↓
                    b1_arge_products (BOŞ)
                            ↓
              ArgeMainContainer.js (BOŞ LİSTE)
                            ↓
        Karar Butonu → status güncelle → b1_agent_loglari
                            ↓
              M2 (Kumaş) useKumas.js → status=uretim_onay filtre
                            ↓
                M3 (Kalıp) → ai_satis_karari filtre
```

**Bozuk halka:** Scraper çalışmadığı için tüm zincir işlevsiz.

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **TikTok API entegrasyonu** → `tiktokapi.py` ajanı (izlenme hızı, hashtag büyümesi)
- [ ] **Pinterest trend scraper** → Moda boardlarından görsel analiz
- [ ] **Instagram Reels scraper** → Outfit içeriklerinden stil tespiti
- [ ] **AI görsel analiz** → Rakip ürün fotoğrafından renk/stil otomatik tespit (CLIP modeli)
- [ ] **WGSN / Trendalytics entegrasyonu** → Küresel moda veri servisleri
- [ ] **Trend ömrü tahmini** → "Bu trend kaç hafta daha sürer?" ML modeli
- [ ] **Otomatik üretim emri** → Skor > 85 → Otomatik M2 talebi + Kalıphane emaili
- [ ] **Rakip stok izleme** → Trendyol'da rakip stok tükeniyor → fırsat alarmı
