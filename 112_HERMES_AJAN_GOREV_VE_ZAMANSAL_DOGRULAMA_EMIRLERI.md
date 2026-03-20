# 112_HERMES_KARAR_VE_ZAMANSAL_DOGRULAMA_IS_EMIRLERI

**Gönderen:** Antigravity (Sistem Baş Mimarı)
**Alıcı:** Alfa, Beta, Gama Timleri ve 7 Ajan (Agent) Altyapısı
**Konu:** Ar-Ge (M1) Hermes Mimarisinin %100 Kurulumu, 7 Arşivin Açılması ve "Zamansal Doğrulama / Karar Kalibrasyonu" Otonomisinin Başlatılması

Kurucu İradenin ("37 yıllık tecrübenin teknolojiye dökülmesi ve doğru bilinen yanlışların tespiti") emriyle, sistemin kendi aldığı kararları zaman içinde test edip **"Hata mı yaptık, yoksa doğru mu karar verdik?"** sorusunu günlük olarak analiz edeceği YENİ BİR BEYİN (Zamansal Doğrulama) sisteme entegre ediliyor. 

Aşağıdaki görev dağılımı SIKIYÖNETİM kurallarıyla, eksiksiz olarak uygulanacaktır.

---

## BÖLÜM 1: GAMA TİMİ GÖREV EMRİ (VERİTABANI MİMARİSİ)
**Gama Timi:** Supabase üzerinde 12. Bölümdeki "7 Ayrı Arşiv" tablolarını ve yeni "Zamansal Doğrulama" mekanizmasını aşağıdaki SQL kodu ile derhal ayağa kaldıracaktır.

```sql
-- 1. ZAMANSAL DOĞRULAMA BEDELİ (KARAR TEST) TABLOSU
-- Üretmediğimiz ama piyasada patlayan ürünlerin tespit edildiği KÖR NOKTA radarı.
CREATE TABLE b1_arge_zamansal_dogrulama (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trend_id UUID REFERENCES b1_arge_trendler(id),
    ilk_hedef_skor INTEGER, -- Ar-Ge'yi reddettiğimiz günkü talep skoru
    guncel_talep_skoru INTEGER, -- Sistem (Agent) tarafından bugün ölçülen skor
    basari_durumu VARCHAR(50), -- "Iyi_ki_uretmedik", "Buyuk_Firsat_Kacirdik", "Takipte"
    son_kontrol_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ajan_notu TEXT
);

-- 2. ANA ARŞİV TABLOLARININ (BÖLÜM 12) AÇILMASI
CREATE TABLE arsiv_model_turu ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), trend_id UUID REFERENCES b1_arge_trendler(id), model_adi VARCHAR(255), baglanti_ajani VARCHAR(100) );
CREATE TABLE arsiv_kumas_turu ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), trend_id UUID REFERENCES b1_arge_trendler(id), kumas_adi VARCHAR(255), maliyet_ref UUID );
CREATE TABLE arsiv_aksesuar ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), trend_id UUID REFERENCES b1_arge_trendler(id), aksesuar_detay TEXT );
CREATE TABLE arsiv_rakip_fiyat ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), trend_id UUID REFERENCES b1_arge_trendler(id), min_fiyat NUMERIC, max_fiyat NUMERIC );
CREATE TABLE arsiv_notlar ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), trend_id UUID REFERENCES b1_arge_trendler(id), yonetici_istihbarati TEXT );
CREATE TABLE arsiv_gorsel_referans ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), trend_id UUID REFERENCES b1_arge_trendler(id), storage_url TEXT );
```

---

## BÖLÜM 2: 7 SİSTEM AJANI (AGENT) GÖREV DAĞILIMI
Sistemimizin kalbinde yer alan ve Ar-Ge için çalıştırılacak 7 Ajanın (Mikro-servisin) tam yetki ve görev tanımları şöyledir:

| Ajan (Agent) Kodu | Yeni Hermes Mimarisi (M1) Üzerindeki Kesin Görevi | Çalışma Prensibi |
| :--- | :--- | :--- |
| **Agent 1: Scraper (Avcı)** | Amazon, Zara, Etsy gibi e-ticaret sitelerinin kılcal damarlarına Perplexity Sonar üzerinden anlık girip en hızlı tükenen modelleri avlar. | Sıfır API maliyeti. Canlı sorgu tetiklemesiyle çalışır. |
| **Agent 2: Vision (Gözlemci)** | Prompt bazlı kurgulanan Görsel/Sosyal Medya Ajanıdır. TikTok ve Instagram'daki trend kelimeleri ("Yazlık Keten vs.") analiz eder. | Yazılı veya görsel datadan kumaş türünü söker çıkarır. |
| **Agent 3: Financial (Hesap Uzmanı)** | Kasa (M7) ve Modelhane (M2)'deki geçmiş 37 yıllık kumaş sarfiyat/işçilik datanı okuyup ürünün kâr marjını hesaplar. | Dış veriyi iç veri (Kendi maliyetin) ile çaprazlar. |
| **Agent 4: Classifier (Kategorizatör)** | Ürünü Bölge (Avrupa, Türkiye) ve Sezon (Yaz, Kış) filtrelerine göre 7 temel giyim kategorisinde hapseder. | Halüsinasyonu engeller. |
| **Agent 5: Archiver (Arşivci)** | Yönetici "Onayla" dediği an, dönen 6 JSON verisini mili-saniyede yeni açılan 7 Supabase Arşiv tablosuna böler ve kilitler. | Veritabani Transaction (Güvenlik) ajanıdır. |
| **Agent 6: Edge-Watcher (Gece Bekçisi)** | **(YENİ EKLENEN KRİTİK GÖREV)** Her gece saat 03:00'te uyanır. Üretime almayıp ARŞİVE ATTIĞIMIZ (sattığından şüphe ettiğimiz) ürünleri yeniden internettte sorgular. | Piyasaya bakıp dünkü/geçen ayki reddimizin doğruluğunu ölçer. |
| **Agent 7: Notifier (Haberci)** | Edge-Watcher ajanı "Efendim, biz bu keten gömleği geçen ay üretmedik ama Amazon'da şu an yok satıyor, FIRSAT KAÇTI" tespitini yaparsa, bunu Telegram üzerinden yöneticiye anlık KÖR NOKTA İHLALİ olarak bildirir. | Yöneticinin kararlarını kalibre etmekle yükümlüdür. |

---

## BÖLÜM 3: BETA VE ALFA TİMİ GÖREV EMRİ (ZAMANSAL DOĞRULAMA KODLAMASI)

**Beta Timine (Backend) Emir:**
`api/kronom-dogrulama/route.js` (veya benzeri bir cron tetikleyici) hazırlayın. Bu endpoint günde 1 kez çalışarak Supabase'de `durum='reddedildi_arsivlendi'` olan geçmiş Ar-Ge ürünlerini çekecek. 
Bu ürünleri Agent 1 (Perplexity) motoruna tekrar soracak: *"Bu ürün bugün piyasada ne durumda? Talep skoru 10 üzerinden kaç?"* Dönen sonucu Agent 5, `b1_arge_zamansal_dogrulama` tablosuna "Kazanılan Fırsat" (İyi ki üretmemişiz zarar ederdik) veya "Kaçırılan Fırsat" (Hata yaptık çok satıyor) etiketiyle mühürleyecek.

**Alfa Timine (Frontend) Emir:**
`ArgeMainContainer.js` içine yeni bir sekme çizin: **"ZAMANSAL DOĞRULAMA (GEÇMİŞ KARARLARIN BİLANÇOSU)"**.
Yönetici bu sekmeyi açtığında, geçmişteki (37 yıllık zeka) hatalı ve doğru kararlarının "Piyasa gerçekliğindeki" yansımasını finansal ve veri bazlı grafiklerle; yeşil ve kırmızı oklarla görecek.

---
**NİHAİ DURUM:**
Bu evrak ve içerdiği görev şemaları, işletmenin veri körlüğünü sonsuza dek bitirecek *Self-Correction (Kendi Kendini Doğrulayan/Test Eden)* sistemin M1 modülüne çakılmasını emretmektedir. Ekiplere iletilmek üzere mühürlenmiştir. M1 modül kodlamalarında **Gece Bekçisi (Agent 6) ve Zamansal Doğrulama** radarı aktif edilerek tüm sistem entegrasyonu tamamlanacaktır.
