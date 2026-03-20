# 14_YENI_PROJE_SISTER_HAFIZASI_VE_KURALLAR (SOHBET ÖZETİ MEDYA DOSYASI)

**Proje Adı:** 47_SIL_BASTAN_01 (Kamera-Panel V2 / 2. Proje)
**Tarih:** 6 Mart 2026
**Hazırlayan:** Antigravity (Siber Ajan Yöneticisi)
**Onaylayan:** Engin Bey (Genel Koordinatör)

---

## 📌 1. BU SOHBETTE NE OLDU? (GENEL ÖZET)

Bu uzun oturumda, eski sistemin (Kamera-Panel) yapısal hantallıkları ve bilgi kirliliği geride bırakılarak, yepyeni ve hafif bir "Sil Baştan" projesine (Port 3001) geçiş yapıldı.
Ancak süreç içerisinde Antigravity'nin (benim) "her şeyi tek başıma yapma" ve "kodları test etmeden sunma" gibi büyük hataları, Koordinatör Engin Bey'in askeri disiplin müdahalesiyle engellendi. Sistemin, Antigravity'nin ameleliğine değil, **Otonom Ajan Yönetimine (Ekip Çalışmasına)** emanet edilmesine karar verildi.

---

## 📌 2. YENİ İNŞA EDİLEN 1. BİRİM'İN (İMALAT VE ÜRETİM) YOL HARİTASI

Koordinatörün net vizyonuyla belirlenen ve asla şaşılmayacak olan üretim döngüsü:

1. **Ar-Ge & Trend Araştırması:** Ajanların internette (Trendyol, Amazon) neyin satıldığını analiz edip hedef belirlemesi.
2. **Kumaş & Arşiv (Depo):** Bulunan modele hangi kumaşın gideceğinin belirlenmesi, bunların dijital kasaya eklenmesi ve çağrıldığında anında gelmesi.
3. **Kalıp & Serileme:** Doğru kalıpların çıkarılması ve teknolojik olarak serilenmesi.
4. **Sıfır İnisiyatif & Numune Dikimi:** 1 adet numune dikilirken; kaç işlem olacağının, işlemlerin otonom makinelere/işçilere nasıl dağıtılacağının, zorluk derecelerinin her şeyinin önceden belirlenip videolu "Teknik Föye" bağlanması.
5. **Reçeteli Fason Üretimi:** Numune testinden geçen eksiksiz dosyanın Fasona/Banda iletilmesi.

---

## 📌 3. BUGÜN KOYULAN "YENİ DİSİPLİN VE YÖNETİM" KURALLARI

Bu sohbetin en büyük kazanımı, sistemsel kuralların baştan çok sert yazılmasıdır:

* **KURAL 1 (Manager Vizyonu):** Antigravity asla her şeyi tek başına (chatgpt gibi) kodlamaya çalışmayacak. Kendi "Ajan Koordinasyon ve Ekip Yönetimi" üst düzey becerisini kullanacak. Yazılımı Gemini'ye kodlatacak, testlerini Bot'lara yaptıracak. Kendisi sadece Mimar ve Yönetici olacak.
* **KURAL 2 (Otomatik Test Zorunluluğu):** Ekrana konan bir butonun (Örn: Model Ekle), veritabanına gidip gitmediği Antigravity tarafından veya insan eliyle değil; özel olarak yazılacak **Ajan Test Botları** tarafından denetlenecek. Botlar %100 "Sorunsuz" raporu vermeden Koordinatöre "İş Bitti" denmeyecek.
* **KURAL 3 (Görsel Makyaj Yasağı):** Sistem arka planda (Mekanikte ve Veritabanında) tamamen çalışmadan, asla Kararga*Çalışan Port:** Kök dizinde `npm run dev` ile genelde Port `3001` üzerinden yayın almaktadır.
* **Gelinen Kararlı Nokta:** İmalat ve Üretim (Birim 1) için sekme mimarileri (Personel Liyakat Kontrolü, Kronometre, Vicdan Toleransı, Maliyet) arayüze çizildi.

### 👉 YENİ SOHBETE (SAYFAYA) VERİLECEK İLK TALİMAT (PROMPT)

*Sayın Antigravity. Ben Koordinatör. Lütfen Desktop'ta bulunan `47_SIL_BASTAN_01` klasöründeki `14_YENI_PROJE_SISTER_HAFIZASI_VE_KURALLAR.md` adlı medya dosyasını (Sohbet Özetini) anında oku. O dosyadaki "Kural 1 ve Kural 2"ye sadık kalarak, elimizdeki 1. Birimin test süreçlerini başlatmak üzere Ajanlarını (Test Botlarını ve Gemini'yi) koordine etmeye hazırlan.*
h sayfasına veya ön arayüze görsel makyaj yapılmayacak.
* **KURAL 4 (Adım Adım Gidiş):** 1. Birim (İmalat/Üretim) zinciri tam anlamıyla (Ajanların testiyle) kanıtlanmadan ve Engin Bey'den "Onay" almadan 2. Birime (Mağaza ve Kasa) asla geçilmeyecek.
* **KURAL 5 (Sesli Komut - Siber Dinleme):** Kök veritabanı değişiklikleri, manuel klavye ile değil; Koordinatörün karargah ekranından mikrofona vereceği ("Lojistik Tablosu Aç") otonom sesli emirlerle yürütülecektir.

---

## 📌 4. MEVCUT PROJENİN DONANIM DURUMU (YENİ SOHBETE GEÇİŞ İÇİN)

* **Yeni Proje Klasörü:** `C:\Users\Admin\Desktop\47_SIL_BASTAN_01`
* **Veritabanı:** Supabase (Yeni tablolar `.agents` vb. klasörlerde şema olarak hazır.)
* *