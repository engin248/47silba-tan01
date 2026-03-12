# ARAŞTIRMA (AR-GE) MODÜLÜ MİMARİSİ
## 14 BÖLÜMLÜK TAM KRİTER VE KOD TABANI KARŞILAŞTIRMA RAPORU

**KURAL:** "Kararı insan değil veri verir."
**DURUM:** Bu ilke Frontend ve Backend'de bizzat kodların (Prompt, JSON Çıktısı ve Veritabanı Tablolarının) içi okunarak değerlendirilmiştir.

---

### BÖLÜM 1: ARAŞTIRMA MODÜLÜNÜN ANA GÖREVİ
| Kriter | Kodda Karşılığı Var mı? | Analiz |
| :--- | :---: | :--- |
| 1. Dünya moda trendlerini analiz etmek | ✅ | Perplexity `sonar` modeli web tabanlı global arama yapıyor. |
| 2. Online satış sitelerinde en çok satılanları bulmak | ⏳ | Prompt'ta geçiyor lakin siteler (Amazon/Trendyol) spesifik olarak zorunlu kılınmamış. |
| 3. Rakip markaların ürünlerini analiz etmek | ❌ | Otonom rakip izleme botu yok. Sadece kullanıcı elle sorarsa bulur. |
| 4. Sosyal medya moda trendlerini analiz etmek | ✅ | Prompt mimarisi Instagram/TikTok görsel analizine açık. |
| 5. Kumaş ve malzeme trendlerini analiz etmek | ❌ | Bize dönen JSON'da "Kumaşı şudur" diye bir ayrım/sütun YOKTUR. |
| 6. Sezonluk satış trendlerini analiz etmek | ✅ | Kodda "2025-2026 Sezonu" kalıbı zorunlu parametre olarak girili. |
| 7. Bölgesel müşteri tercihlerini analiz etmek | ❌ | Müşteri bölgesi tespit veritabanına bağlı bir kurgu veya prompt yoktur. |
| 8. Satış verilerine göre yeni ürün önerisi | ❌ | API, sizin fabrikanızın muhasebe / satış geçmişini okuyamıyor (Kör nokta). |

### BÖLÜM 2: ARAŞTIRMA MODÜLÜ ANA KRİTERLERİ
| Kriter | Kodda Karşılığı Var mı? | Analiz |
| :--- | :---: | :--- |
| 1. Trend Analizi | ✅ | Çalışıyor. |
| 2. Online Satış Analizi | ✅ | Web Scraping ile dolaylı yapılıyor. |
| 3. Rakip Analizi | ❌ | Sistematik, periyodik bir rakip izleme cron'u YOK. |
| 4. Sosyal Medya Analizi | ✅ | Sosyal mecraları endeksliyor. |
| 5. Kumaş Trend Analizi | ❌ | Prompt'un (Ajanın) umrunda bile değil, eklenmemiş. |
| 6. Fiyat Analizi | ❌ | Tablo arayüzünde Fiyat diye bir sütun/alan kazınmamış. |
| 7. Sezon Analizi | ✅ | Prompt'a gömülü. |
| 8. Bölgesel Analiz | ❌ | Bölge filtresi yazılmamış. |
| 9. Ürün Kategori Analizi | ✅ | Arama kutusunda kategori yazılabiliyor. |
| 10. Satış Potansiyeli Analizi | ✅ | `talep_skoru` adıyla 1-10 puan arası otonom çalışıyor. |

### BÖLÜM 3: TREND ANALİZİ ALT KRİTERLERİ (KAYNAKLAR)
| Kriter | Kodda Karşılığı Var mı? | Analiz |
| :--- | :---: | :--- |
| 1. Google arama trendleri | ✅ | Perplexity internet modülü. |
| 2. Pinterest moda trendleri | ✅ | Prompt'ta izinli platform. |
| 3. Instagram moda görselleri | ✅ | Prompt'ta izinli platform. |
| 4. TikTok moda videoları | ✅ | Prompt'ta izinli platform. |
| 5. Moda haftası raporları | ✅ | Web tarama yetkisi dahilinde. |
| 6. Global moda raporları | ✅ | Web tarama yetkisi dahilinde. |

### BÖLÜM 4: ONLINE SATIŞ ANALİZİ
**Analiz Edilecek Siteler**
| Site | Otonom Taranıyor mu? |
| :--- | :---: |
| 1. Amazon, 2. Zara, 3. H&M, 4. Trendyol, 5. Shopify, 6. Etsy, 7. Alibaba, 8. Aliexpress | ⏳ | Sisteme "Sadece bu 8 siteden çek" diye katı bir JSON/Prompt kuralı YAZILMADI. İnternette bulduğu ilk siteden çekiyor. Bu spesifik sitelerin prompt'a çivilenmesi (Hardcoded) lazım. |

**Toplanması İstenen Veriler:**
1. En çok satan / 2. En çok yorum / 3. Puanlı / 4. Tükenen / 5. Görüntülenen ürünler
**DURUM (❌):** Bizim arka plandaki AI'mız (Sonar Modeli) bir e-ticaret API'si gibi "Bu ürün 10 bin yorum aldı" verisini net ÇEKEMEZ. Sadece genel makalelerden "Trend" çıkarımı yapar. E-ticaret net veri analizi için Modüle farklı bir Crawler (Örn: Apify vb.) eklenmelidir. Sistemin şu anki mimarisi internetteki makaleleri okur, Amazon'daki ürün stok adetini göremez.

### BÖLÜM 5: RAKİP ANALİZİ
**Toplanması İstenen Veriler:**
1. Rakip ürün sayısı / 2. Fiyat / 3. Kategori / 4. Kumaş / 5. Model Çeşidi / 6. Satış Sıklığı
**DURUM (❌):** Tümü Kırmızı/Eksiktir. Ar-Ge Modülü sayfamızda "Rakip Adı" girecek bir sekme, fiyat izleyecek bir grafik veya kumaşlarını dizecek bir kanca bulunmuyor.

### BÖLÜM 6: SOSYAL MEDYA TREND ANALİZİ
**Çekilecek Veriler (Model, Renk, Kumaş, Kesim, Kombin):**
**DURUM (⏳):** Mevcut kodumuz trendin Sadece Başlığını (Örn: "Oversize Keten Gömlek") ve Açıklamasını getiriyor. Bize dönen sistemde "Renk: Mavi, Kumaş: Keten, Kesim: Oversize" şeklinde veritabanına oturacak ayrık (Parse edilmiş) veri sütunları (JSON Objesi alanları) YAZILMAMIŞTIR.

### BÖLÜM 7: KUMAŞ VE MALZEME TREND ANALİZİ
**İstenenler: Tür, Renk, Doku, Aksesuar, Düğme, Fermuar, Baskı**
**DURUM (❌):** Ar-Ge sayfası sadece "Fotoğraf ve Trend İsmi" kaydediyor. "Bu trendin düğmesi boynuz düğmedir, fermuarı gizlidir" diyecek bir arama botu ve Veritabanı sütunu mevcutta YOK. 

### BÖLÜM 8 VE 9: SEZON VE BÖLGE ANALİZİ
**Sezon (Yaz/Kış) ve Bölge (Avrupa/ABD/Asya/TR/Ortadoğu):**
**DURUM (⏳):** Sezonu prompta "Türkiye Pazarı / 2025-2026" diye **Sabit (Hardcoded)** gömdük. Yani kullanıcı Avrupa'yı veya Orta Doğu'yu aratmak isterse arayüzde (Dropdown/Seçenek Kutusu) böyle bir buton/menü kodlanmamıştır. Sistem şu an tekdüze (Sadece Türkiye) arıyor.

### BÖLÜM 10 VE 11: KATEGORİ VE SATIŞ POTANSİYELİ
| Kriter | Kodda Karşılığı Var mı? | Analiz |
| :--- | :---: | :--- |
| **Kategoriler:** (T-shirt, Elbise, Ceket vb.) | ⏳ | Kullanıcı elle yazarsa bulur, lakin ekran arayüzünde Hızlı Filtre Butonları (Kategoriler) yoktur. |
| **Satış Hacmi ve Rekabet Seviyesi** | ❌ | AI promptunda bu matematiksel alanların JSON olarak getirilmesi EMREDİLMEDİ. |
| **Üretim Maliyeti ve Kar Marjı** | ❌ | Ajan, fabrikadaki iplik/işçi fiyatından habersiz olduğu için maliyet/kâr hesaplayamaz. M2 (Maliyet) modülünün Ajanla konuşturulması şarttır. |

### BÖLÜM 12: ARAŞTIRMA MODÜLÜ ARŞİVLERİ
**(Trend, Model, Rakip, Kumaş, Aksesuar, Araştırma Notu, Referans Görsel Arşivi)**
**DURUM (⏳/❌):** Sadece "Trend Arşivi" (`b1_arge_trendler` tablosu) ve "Referans Görsel Arşivi" (`arge_gorselleri` isimli Storage Bucket) **AKTİFTİR (✅)**. Ancak Rakip, Kumaş, Aksesuar, Notlar arşivleri için veritabanında ayrı tablolar henüz oluşturulmadı.

### BÖLÜM 13: ARAŞTIRMA MODÜLÜ TEKNOLOJİLERİ
1. Google Trends (Taranıyor ✅)
2. Pinterest Trends (Taranıyor ✅) 
3. Web Scraping (Perplexity yapıyor ✅)
4. AI Görsel Analizi (❌ Sisteme fotoğraf yükleyince AI analiz etmiyor, sadece saklıyor. Vision/Göz özelliği kodlanmadı)
5. Satış Veri Analizi (❌ Eksik, DB'de satış ciro tablosu yok)
6. Trend Analiz Algoritması (✅ Talep Skoru 1-10 puanlama devrede)

### BÖLÜM 14: ARAŞTIRMA MODÜLÜ NİHAİ ÇIKTISI (EN KRİTİK BÖLÜM)
Modül onaylandığında (Bir tasarımı okeylediğinizde) veritabanına ve M2 ekranına düşmesi/yazılması gereken mutlak veriler:
1. Satılacak ürün: ✅ (Kaydediliyor)
2. Model türü: ❌ (Sütun yok)
3. Kumaş türü: ❌ (Sütun yok)
4. Aksesuar türü: ❌ (Sütun yok)
5. Fiyat aralığı: ❌ (Sütun yok)
6. Hedef müşteri: ❌ (Sütun yok)

---

### MÜHENDİSLİK KARARI / ÇIKIŞ YOLU
Sayın Kurucu, anayasanız **KUSURSUZ.** Modern bir fabrikanın nasıl teknolojiyle birleşeceğinin adeta akademik bir kağıdını dökmüşsünüz. 

Ancak mevcut kodlarımız sadece işin gösteriş/vitrin kısmı olan "Trend Bul" algoritmasına programlanmış (Faz-1). Elde edilen bilginin Düğmesini, Kumaşını, Kesimini, Rakip Fiyatını saptayacak **(Bölüm 4'ten 14'e kadar olan JSON parçalama zekası)** Backend sistemine tanıtılmamış (Kodlanmamış).

**EĞER ONAYLARSANIZ YAPILACAK ZIRHLAMA:**
1. `api/trend-ara` yapay zeka beynini kırıp; ona sizin anayasadaki gibi *Kumaşı, Fiyatı, Müşteriyi, Rakipleri, Aksesuarı* zorla parçalatan (Dönen veriyi ayrıştıran) Dev bir "JSON Şema Prompt'u" yazacağım.
2. `ArgeMainContainer.js` frontend arayüzünü genişletip, bulunan trendlerin Fiyatlarını, Hedef Kitlesini ve Kumaşını ekranda gösteren veri kartları (UI) inşa edeceğim.
3. Supabase tablosuna (`b1_arge_trendler`) bu 5-6 yeni sütunu ekleyip, siz "Onaylandı" dediğiniz anda modelhanenin önüne kumaşından düğmesine kadar Dört Dörtlük bir "Tasarım Föyü" düşmesini sağlayacağım.

**Bu listeye (Anayasanıza) ve emrinize istinaden M1 Modülünü (Ar-Ge) ameliyata alarak "Üst Seviyeye" çıkartmamı istiyor musunuz?**
