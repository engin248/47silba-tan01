# 🛡️ 47_SIL_BASTAN_01 KAPALI DEVRE ÜRETİM BİRİMİ İŞ PLANI VE MİMARİSİ

*(Hedef: Önümüzdeki 10 Saatte Sadece Bu Modülü Hata Payı Sıfır Olarak Canlıya Almak)*

---

## 🏗️ 1. VERİTABANI (SUPABASE) MİMARİSİ VE TABLOLARI

Bu bölümün çalışması için öncelikle Supabase `public` şemasına kaydolacak ve birbirine kilitli 4 Ana Tablo tasarlanmalıdır:

### 1.1 `urun_teknik_foy` (Zorunlu Başlangıç Tablosu)

* **Kriterler:** `urun_id`, `model_adi`, `orjinal_gorsel_url`, `maliyet_siniri_tl`, `zorunlu_kumas_miktari_mt`, `esneme_payi_yuzde`.
* **Kural:** Bu tablo dolmadan üretime parça kesilemez. İnisiyatifi kesen kilit burasıdır.

### 1.2 `dinamik_islem_sirasi` (Şablonsuz Esnek İşlem Listesi)

* **Kriterler:** `id`, `urun_id` (foreign key), `islem_adi` (Örn: Yakalama), `sira_no` (Örn: 2), `ideal_sure_dk`, `zorluk_derecesi` (1-10), `gerekli_personel_sekmesi` (Seri Usta/Çırak vs.).
* **Kural:** Fason veya iç işçi, `sira_no`'su 1 olan işlemi bitirme kanıtını (resim/onay) girmeden 2. işleme tık atamaz.

### 1.3 `personel_sicil_ve_uretim` (Hak Ediş ve Tolerans Tablosu)

* **Kriterler:** `personel_id`, `gunluk_uretim_adeti`, `harcanan_sure`, `sistemsel_durus_dk` (Elektrik vs. sebebiyle telafi edilen süre), `sosyal_puan` (Arkadaşa yardımdan gelen multiplier), `hata_orani_yuzde` (Çıkarılan çürük mal / FPY).
* **Kural:** Personelin primi bu tabloda her saniye matematiksel olarak hesaplanır. Tolerans dk'ları prim barajından silinir.

### 1.4 `kamera_ve_kalite_kanit` (Görsel Delil Tablosu)

* **Kriterler:** `islem_id`, `yuklenen_medya_url` (Foto veya 15sn optimize video), `onay_drumu` (Bekliyor/Geçti/Reddedildi), `mufettis_notu`.
* **Kural:** Bant şefi kontrolü yapıp görseli yüklemezse (ve otomatik/manuel okeylemezse) ürün pakete taşınmaz. İleride kameralar entegre olduğunda bant kamerası `yuklenen_medya_url`'sini bu tabloya API ile anlık düşürür.

---

## 🖥️ 2. ARAYÜZ (EKRAN / SEKME) VE SEÇENEK HİYERARŞİSİ

Ekrana (Next.js) kodlanacak 4 Ana Sekme/Pencere ve İçerisindeki Manuel Yetkiler:

### SEKME 1: [ÜRÜN TEKNİK FÖY (KABUL) EKRANI]

* **Görünüm:** Üst panelde boş A4 Dijital Kağıt. Yanında "Fotoğraf Çek" ve "Yükle".
* **Manuel Etki (İnisiyatifler):** Koordinatör bu ekranda `[+ Yeni Dinamik Satır Ekle]` butonuna basıp operasyonları dizebilir. Örn: "Lazer Kesim Gerekli", "Düğme İşi Varsa: İncili."
* **Etkisi:** Bu sayfada dizilen "Adımlar", bir sonraki Üretim sayfasının kolonlarını oluşturacaktır. Bu sayfa boşsa üretim sekmesi çalışmaz.

### SEKME 2: [ÜRETİM AŞAMASI (BANT) EKRANI]

* **Görünüm:** Kocaman 3 renkli durum butonları (Başla - Mola/Arıza - Bitir). Listedeki sırada ne varsa sadece o görünür.
* **Sahadaki Kriterler (Seçenekler):**
    1. İşi Seç. 2. Zorluk Derecesi Yeşildeyse Başla.
    2. Ekrandaki butona basıldığında kronometre arka planda başlar. İş bitince "Kanıt Fotoğrafı Çek / Onayla" basılır.
* **Arıza Bildirimi (Manuel Etki):** Elektrik kesilirse işçi/şef veya sistem (IoT) anında `[ARIZA - ZAMAN DURDUR]` düğmesine basar. O dakika prim (maliyet) zararından düşülür.

### SEKME 3: [PERSONEL ÜCRET VE BECERİ EKRANI]

* **Görünüm:** Personelin kimliği, FPY'si (Hata/Defo %'si), Bugüne kadar başarıyla çıktığı `İş Zorluk Derecesi` (Örn: "Maks. Zorluk 8.4 işlemlerini yapabilir") etiketi.
* **Manuel Etki (Şef İnisiyatifi):** Şef (Yönetic), `[Sosyal Puan Ver (Yardımlaşma)]` butonu ile personelin o günkü baraj yükünü hafifleten liyakat puanını verebilir.
* **Muhasebeye Gönderim (Aktions):** Gün sonunda "Bugünkü Hak Ediş", "Kesilen Hata Puanı" ve "Duruş Telafi Bedeli" otomatik olarak Muhasebe Sistemine `(Post Request)` paketlenip iletilir. %100 Doğrulanmış Veridir.

### SEKME 4: [MALİYET VE MÜFETTİŞ (DENETİM) EKRANI]

* **Görünüm:** Tek sayfalık, özet ama acımasız veri ekranı.
* **Müfettiş (AI) Yetkileri:**
    1. Bu sekmede "Müfettiş" yazılımsal botu, Üretim Sekmesinden ve Personel sekmesinden gelen kanıt fotoğrafları ile orijinal teknik föyü kıyaslar.
    2. Manuel Yetki: Denetmen, fotoğrafı büyütüp inceler ve `[Kalite Reddi - 1. Aşamaya Geri Gönder]` veya `[Geçerli - Muhasebeye Faturasını Kes]` çentiklerini (tickbox) işaretler.

---

## ⚙️ 3. SİSTEMLER ARASI ENTEGRASYON VE ÇALIŞMA PLANI

*(Buradan Çıkan Nihai Veri, Finalde Karargâh/Muhasebeye Nasıl Gider?)*

Tüm bu birimin (Üretim-İmalat Biriminin) çıkarttığı; "Harcana Kumaş (Maliyet)", "Personel Hak Edişi (Gider)" ve "Üretilen Ürün Sayısı (Kazanç / Satışa Hazır)" 3 temel verisi, gün kapanışında (Gece 00:00'da veya manuel şiv onayında) Muhasebe ana kasasına iletilir.

* **Muhasebedeki İşlem:** Bu gelen net bilgiler ışığında Muhasebe "Kalan NET Kârı" çıkartır ve %51 (Vakıf) ile %49 (Ar-Ge/Personel) kavanozlarına matematiksel olarak böler. Hata ve yalan söyleme şansı yoktur, çünkü üretimin "kanıt sistemi (resimler/kronometreler)" vardır.

---
**EMİR BİLDİRGESİ:**
*(Not: Bu dosya; 47_SIL_BASTAN_01 isimli projenin İLK VE ZORUNLU İŞ PLANI'dır. Tarafınızdan ajanlara verilecek, veritabanı Gemini'ye, Tasarım/Next.js Claude'a teslim edilerek 10 saatte ayağa kaldırılacaktır.)*
