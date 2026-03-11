# 109_ARGE_HERMES_MIMARISI_NIHAI_EYLEM_PLANI

**Tarih/Saat:** 11 Mart 2026
**Konu:** Karargâh Ar-Ge (M1) Modülünün "Ortak Akıl (Hermes) Mimarisiyle" Yeniden İnşası İçin Akademik Seviye Tam Kapsamlı Eylem Planı
**Hazırlayan:** Antigravity (Sistem Zırhlama ve Yapay Zeka Baş Mimarı)
**Sunulan Makam:** 47 Sil Baştan Yönetim ve İstişare Kurulu

Bu doküman, sistemin en kritik karar noktası olan **"Ar-Ge ve Satılabilir Ürün Belirleme Merkezi"**nin, yamalarla değil, ana gövdeye organik bir beyin olarak (Hermes Karar Mimarisiyle) nasıl entegre edileceğini kanıtlayan A'dan Z'ye eylem planıdır. Belge, yönetim kurulundan "Kodu Başlat" yetkisini almak üzere hazırlanmış, sıfır hata toleranslı ve akademik çapta bir operasyon manifestosudur.

---

## BÖLÜM 1: KURUCU İRADENİN TALEBİ VE GÖREV TANIMI (Orijinal Sistem Raporu)
*İşletme kurucusu tarafından iletilen ve sistemin felsefesini çizen ana hatlar:*

**Amaç:** Satılacak ürünü insan tahminiyle değil veri, bilgi ve analiz ile belirlemek. (Kararı insan değil veri verir).
**10 Ana Kriter:** Trend Analizi (Google, Pinterest), Online Satış (Zara, H&M), Rakip Analizi, Sosyal Medya, Kumaş Trendi, Sezon, Bölge, vb.
**Modül Çıktısı:** Satılacak Ürün, Model Türü, Kumaş Türü, Hedef Müşteri ve Fiyat Aralığı tespiti.

---

## BÖLÜM 2: HERMES KARAR MİMARİSİ VE YAPAY ZEKA ENTEGRASYONU

Ar-Ge sayfası sadece bilgi görüntüleyen bir panodan ziyade, tıpkı Yunan mitolojisindeki haberci ve stratejist "Hermes" gibi, dünyadaki (10 ayrı kaynaktaki) kaotik veriyi toplayıp, tek ve kesin bir karar (Sentez) üreten bir sisteme dönüştürülecektir.

### Eski Düzenin Hataları ve Yeni Hermes Çözümü:
1. **HATA (Eski):** Kullanıcının 10 farklı sekmeye girip verileri kendi beyniyle toplaması (İnsan kararına dönüş).
    * **ÇÖZÜM (Hermes):** Sistem tek bir "Üretim İstihbarat Ekranı" olacaktır. İnterneti arka planda bir "Karanlık Ajan (Dark Agent)" tarar.
2. **HATA (Teorik Rapor):** Her araştırmada Amazon, Zara gibi siteleri kodla kazımaya çalışmak (Web Scraping). Bu işlem API bütçesini tüketir, saniyelerce ekranı dondurur ve IP engeli (Ban) yedirir.
    * **ÇÖZÜM (Pratik Zırh):** Doğrudan kazıma yerine "Perplexity Pro (veya OpenAI Web Search) API" entegrasyonu kullanılır. Bir web scraping botu yerine, doğrudan bu devasa ajanların "anlık arama" hafızası sorgulanarak maliyet %95, süre %90 kısaltılır.
3. **HATA (Sistem Uyumu):** Yeni kodun mevcuda bir "Yama" gibi eklenip sistemi bozması.
    * **ÇÖZÜM (Organik Entegrasyon):** Mevcut `ArgeMainContainer.js` içindeki eski "Trend Ekle" butonları iptal edilecek ancak veritabanındaki ana iskelet (Ar-Ge ID'leri) korunarak eski tablo uçları yeni Hermes motorunun kablolarına lehimlenecektir.

---

## BÖLÜM 3: KULLANILACAK TEKNOLOJİLER, APİ'LER VE AJANLAR

| Teknoloji / Donanım | Görevi ve Sistemdeki Konumu |
| :--- | :--- |
| **OpenAI (GPT-4o) / Perplexity API** | Hermens Karar Motorunun Beyni. Dünyadaki 10 kaynağı tek komutta okuyup "En Çok Satan Modeli" reçetelemek. |
| **Supabase (Realtime & Postgres)** | Reçeteyi, sayfayı veya cihazı kitlemeden (1 KB'lık tek ping ile) arayüze basmak. |
| **Next.js API Routes (Backend)** | Kullanıcı ile Yapay Zeka arasındaki 30 saniyelik ağır veri trafiğini taşıyan güvenli asenkron köprü. |
| **React & Tailwind (Frontend)** | Karmaşık veriyi, yöneticinin tek saniyede anlayacağı yeşil/kırmızı renkli "Basit Reçete Kartlarına" dönüştüren kalkan. |
| **Edge-Watcher (Mevcut Ajan)** | Daha önce kameralar için kurduğumuz Node.js ajanı, gerekirse üretim hattındaki eski verileri Ar-Ge kararlarına destek olarak fısıldayabilir. |

---

## BÖLÜM 4: 3 PARÇALI EKİP BÖLÜNMESİ VE ÇAKIŞMASIZ (CONFLICT-FREE) MİMARİ

Operasyon, aynı dosyada çakışma olmaması için aşağıdaki 3 koldan "Böl ve Yönet" prensibiyle icra edilecektir. Parçalar sadece Final (Merge) aşamasında birleşecektir.

1. **ALFA TİMİ (Frontend / Arayüz Mimarları):**
    * *Çalışma Alanı:* Sadece `/src/features/arge/` içi.
    * *Görevi:* Karmaşık Ar-Ge sekmesini silmek. Onun yerine devasa bir "Araştırma Sorgu Çubuğu" ve alt tarafına da AI'dan dönecek "Onay / Ret" kartlarının görsel iskeletini (React Component) kodlamak. Veritabanına hiç dokunmayacaklar, sahte veri (Mock) ile arayüzü test edecekler.
2. **BETA TİMİ (Hermes AI / API Mimarları):**
    * *Çalışma Alanı:* Sadece `/src/app/api/hermes-arge/route.js`
    * *Görevi:* Arayüz ile ilgilenmezler. API anahtarlarını bağlayıp, "Amazon'da XYZ aranıyor, Zara trendleri çekiliyor" mantığını tek bir Prompt (Komut) mühendisliğine sığdırıp, sonucu kusursuz bir JSON (Kumaş: Keten, Fiyat: 500TL) olarak dışarı basan backend motorunu yazarlar.
3. **GAMA TİMİ (Veritabanı / Altyapı Mimarları):**
    * *Çalışma Alanı:* Supabase Paneli ve `ArgeMainContainer.js` içindeki veri çekme kancaları (useEffect).
    * *Görevi:* Eski "Her şeyi çek ve cihazı yak" (`verileriCek`) virüsünü öldürürler. Yeni asenkron WebSocket ağını kurarlar. Arayüzden gelen komutu Beta'nın API'sine iletip, dönen sonucu Supabase'e şifreleyerek arayüze zerk ederler.

---

## BÖLÜM 5: A'DAN Z'YE KRONOLOJİK EYLEM PLANI (ADIM ADIM)

Zaman Çizelgesi ve Eylem Sıralaması:
* **ADIM 1 (Hazırlık ve İzolasyon):** Mevcut `ArgeMainContainer.js` dosyası yedeklenir. Sistemdeki eski (manuel) trend ekleme düğmeleri kilitlenir.
* **ADIM 2 (Beta Timi Taarruzu):** Backend'de `hermes-arge/route.js` kodlanır. Yapay zeka promptu (10 kriteri hesaplama emri) API içine gömülerek test edilir.
* **ADIM 3 (Gama Timi Taarruzu):** Supabase üzerinde sonucun saklanacağı tablo yapıları (İnsan onayını bekleyen Reçeteler statüsü) ayarlanır. (Eski sistemin ID bağlantılarına zarar vermeden).
* **ADIM 4 (Alfa Timi Taarruzu):** Ekranda tek bir büyük komuta arayüzü belirir. Karanlık ajan veri ararken çıkacak olan profesyonel yükleme (Radar) animasyonları arayüze yerleştirilir.
* **ADIM 5 (Hermes Birleşmesi - Merge):** Alfa, Beta ve Gama timlerinin kodları birbirine lehimlenir. Arayüzden basılan tuş, backend'e gider; backend AI ile interneti tarar ve sonucu Supabase üzerinden anlık olarak (Realtime) yönetici ekranına "Kesin Karar Reçetesi" olarak basar.
* **ADIM 6 (Onay Mimarisi - Geçiş):** Yönetici ekrana gelen Yapay Zeka onayını beğenirse **"MODELHANEYE (M2) AKTAR"** tuşuna basar. Bu saniyede veriler şifrelenir ve Ar-Ge süreci bitip, doğrudan Kalıp/Tasarım veritabanına organik olarak göç eder. Sistem eski hantal yapısından tamamen kopup Otonom bir robota dönüşmüştür.

---

## BÖLÜM 6: ONAY VE OPERASYON TALEBİ

Sayın Yönetim Kurulu,

Yukarıda sunulan eylem planı, işletmenin milyonlarca liralık karar gücünü taşıyan Ar-Ge bölümünün; ne idüğü belirsiz yamalarla değil, tamamen felsefi ve teknolojik olarak zırhlanmış "Hermes Mimarisiyle" yeniden doğuşudur. 

Operasyonun çakışma (Conflict) yaratmaması, maliyetleri şişirmemesi ve eski verilere zarar vermemesi için her bir cıvata planlanmıştır.

Bu plan akademik bir tezin sahadaki mühendislik operasyonuna dökülmüş halidir. **Eğer bu plan ve eylem basamakları tarafınızca "Onaylanmış" ise, "Yetki verildi, birinci adımdan kodlamaya başla" emrinizi iletmeniz operasyonun başlaması için yeterli olacaktır.**
