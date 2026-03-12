# ARAŞTIRMA MODÜLÜ (HERMES) - %100 KAPSAMLI (119 KRİTERLİ) KESİN İŞ PLANI VE MİMARİ ADIMLAR
*Not: Bu belge "Özetlenmez ve Kısaltılmaz" kuralı gereği, kullanıcının 14 Bölümlük anayasasındaki hiçbir maddeyi atlamadan, tamamının donanımsal, veritabanı ve kod seviyesindeki karşılığını planlar.*

---

## 🛑 ADIM 1: SİSTEM ALTYAPISI VE BÖLÜMLERİN TANIMLANMASI (VERİTABANI VE TABLOLAR)
Modül çıktılarının insan aklında kaybolmaması ve 14. Maddedeki (Modül Çıktısı) 6 maddenin ve 12. Maddedeki (Arşivler) 7 kriterin kalıcı olması için Supabase üzerine **yeni tablolar** dikilecek:

1. **`b1_arge_trend_arsivi`** (Genel bulgular ve trend modeli)
2. **`b1_arge_model_arsivi`** (Bulunan trendin ürün tipi: Tişört, Ceket vb. Tümü 10. Bölümde sayılan kategoriler)
3. **`b1_arge_rakip_arsivi`** (Bölüm 5 analiz verileri: Rakip fiyatları, satış sıklığı, tercih edilen kumaşlar)
4. **`b1_arge_kumas_arsivi`** (Bölüm 7 analiz verileri: Kumaş türü, dokusu, rengi)
5. **`b1_arge_aksesuar_arsivi`** (Bölüm 7: Düğme, fermuar, baskı trendi)
6. **`b1_arge_notlar_arsivi`** (Tasarım Notları ve AI çıkarımları)
7. **`b1_arge_referans_gorsel_arsivi`** (Bağlı olduğumuz Supabase Storage kancalarına her sosyal mecradan: Pinterest, Insta resim linklerinin inmesi)

---

## 🛑 ADIM 2: HERMES YAPAY ZEKA (BETA TİMİ) KODLAMASI VE SINIRSIZ PROMPT MİMARİSİ
Yapay Zekaya (Perplexity Sonar Modeli vb. Web Search API'ye) gidecek olan Komut/Prompt hiçbir şekilde "Genel moda arat" şeklinde SIKIŞTIRILMAYACAKTIR. Aşağıdaki her bir kırılım (API JSON Çıktısı Olarak) sisteme kazınacaktır:

**Sorgu Mimarisi Şu Tüm Kriterleri Ayrıştırarak İsteyecektir (JSON Şeması Olarak Kodlanacak):**

- **Bölüm 3 (Trend Analizi Alt Kriterleri) Çıktıları Sorgulanacak:**
  - 1. Google arama trendleri (X kelimesi yüzde kaç aranmış)
  - 2. Pinterest moda trendleri (Hangi pinler revaçta)
  - 3. Instagram moda görselleri (En çok etkileşim alan konsept)
  - 4. TikTok moda videoları (Viral olan akımlar)
  - 5. Moda haftası raporları (Resmi jüri raporları)
  - 6. Global moda raporları (Genel vizyon)

- **Bölüm 4 (Online Satış Analizi) Kazınacak Siteler Sabitlenecek:**
  - *Siteler:* Amazon, Zara, H&M, Trendyol, Shopify mağazaları, Etsy, Alibaba, Aliexpress
  - *Süzülecek Veriler:* 1. En çok satan, 2. En çok yorum alan, 3. En yüksek puanlı, 4. En hızlı tükenen, 5. En çok görüntülenen.

- **Bölüm 5 (Rakip Analizi) Metrikleri:**
  - 1. Rakip ürün sayısı (Kaç çeşit üretmiş)
  - 2. Rakip fiyatları (Hangi fiyattan satıyor)
  - 3. Rakip ürün kategorileri
  - 4. Rakip kumaş tercihleri
  - 5. Rakip model çeşitleri
  - 6. Rakip satış sıklığı

- **Bölüm 6 (Sosyal Medya Trend Analizi):**
  - *Kaynaklar:* Instagram, TikTok, Pinterest, YouTube
  - *Veriler:* 1. Trend model, 2. Trend renk, 3. Trend kumaş, 4. Trend kesim, 5. Trend kombin.

- **Bölüm 7 (Kumaş ve Malzeme Kombini):**
  - 1. Kumaş türleri, 2. Kumaş renkleri, 3. Kumaş dokuları
  - 4. Aksesuar trendleri: 5. Düğme, 6. Fermuar, 7. Baskı.

- **Bölüm 8 (Sezonluk Analiz Çıktısı):**
  - Sadece genel kış denmeyecek: (Yaz, Kış, Bahar, Sonbahar) parametreleri ayrı ayrı aranıp ürünün hangi mevsime uygun olduğu belirlenecek.

- **Bölüm 9 (Bölgesel Analiz Pazarları):**
  - 1. Avrupa müşteri, 2. Amerika müşteri, 3. Türkiye müşteri, 4. Orta Doğu müşteri, 5. Asya müşteri tercihi (Ürünün hangi coğrafyada patlayacağı verisi JSON'da olacak).

- **Bölüm 10 (Kategori Mimarisi):**
  - T-shirt, Sweatshirt, Hoodie, Elbise, Pantolon, Ceket, Gömlek.
  - Yapay zeka bu kategoriler dışında sapan bir ürün önermeyecek.

- **Bölüm 11 (Satış Potansiyeli Matematiksel Analizi):**
  - 1. Satış hacmi (Tahmini pazar büyüklüğü)
  - 2. Fiyat aralığı (Ürünün satılabileceği Maksimm ve Minimum tutar)
  - 3. Rekabet seviyesi (Pazar doymuş mu? Kızıl Deniz / Mavi Okyanus)
  - 4. Üretim maliyeti (Rakip maliyetlerine kıyasla öngörü)
  - 5. Kâr marjı (Operasyonun nihai kâr mettiği)

---

## 🛑 ADIM 3: ARAYÜZ (ALFA TİMİ) EKRANININ YAPILANDIRILMASI
Kullanıcı M1-ArGe sayfasına girdiğinde:
1. **Araştırma Paneli:** Sadece arama kutusu olmayacak. Kullanıcı "Ara" tuşuna bastığında bir **Yükleme Konsolu (Bölüm 13 Teknolojileri Simülasyonu)** belirecek: (Google Trends taranıyor... Pinterest çekiliyor... AI Görsel Analiz Devrede... Satış Verileri okunuyor...).
2. **Sonuç Ekranı (Nihai Föy - Bölüm 14):**
Araştırma bittiği an, insan tahmini olmadan sadece veriler konuşarak ekrana 6 Kutu (Pano) fırlatılacak:
   - **Kutu 1 (Satılacak Ürün):** "Örn: Baggy Pantolon"
   - **Kutu 2 (Model Türü):** "Örn: Kargo cepli, geniş paça"
   - **Kutu 3 (Kumaş Türü):** "Örn: Paraşüt kumaşı veya 1. sınıf Gabardin (Bölüm 7 sonucu)"
   - **Kutu 4 (Aksesuar Türü):** "Örn: Nikel fermuar ve plastik stoper düğmeler (Bölüm 7 sonucu)"
   - **Kutu 5 (Fiyat Aralığı):** "Örn: 850 TL - 1200 TL bandında (Bölüm 11 sonucu)"
   - **Kutu 6 (Hedef Müşteri):** "Örn: Avrupa Bölgesi, Z kuşağı (Bölüm 9 sonucu)"

---

## 🛑 ADIM 4: ONAY VE GEÇİŞ MEKANİZMASI (SİSTEMLEŞTİRME)
*Kararı İnsan Değil Veri Verir* kuralı gereği, yönetici ekranda beliren bu 14. Madde Föyünü (6 kutuyu) OKUDUĞU anda altta beliren **"ÜRETİM EMRİ (TASARIMI ONAYLA)"** tuşuna basacaktır.
- Tuşa basıldığı an Sistem, Bölüm 12'deki 7 farklı Arşiv Veritabanına tüm bulguları otomatik olarak fişler ve arşive kaldırır.
- Çıktı, M2 (Modelhane) sekmesine "Kalıp Çıkarılmak Üzere" organik bir fiş (Bilet) olarak düşer.

**Bu planda 14 bölümün tamamı, özetlenmeden ve yutulmadan; veritabanı sütunu, arayüz paneli ve yapay zeka emri formuna dökülmüştür. İş planının sahadaki kod inşasına BAŞLANACAKTIR.**
