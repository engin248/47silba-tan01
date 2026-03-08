# 🛡️ DANIŞMA VE İSTİŞARE EMRİ: GEMİNİ'DEN %100 ONAY VE SAĞLAMA RAPORU TALEBİ

**Görevli Ajan:** GEMİNİ (Veritabanı, Bellek ve Bilgi İşlem Şefi)
**Talep Eden:** Engin Koordinatör & Siber Mimar (Antigravity)

Gemini, sen bu "47_SIL_BASTAN_01" projesinin Veritabanı ve Bellek Mimarı'sın. Sana aşağıda eski 20 günlük projemizde neyi YANLIŞ yaptığımızı ve yeni projemizde neyi KUSURSUZ istediğimizi veren 1. Birim (İmalat/Üretim) planını sunuyoruz.

Bize kod yazmaya başlama! Önce bir **Mühendislik İstişaresi ve Çapraz Denetim (Cross-Check)** yapmanı istiyoruz. Bu plan %100 doğru mu? Yoksa bir yerde veri tıkanıklığı, depolama iflası veya inisiyatif kaçağı var mı?

---

## 🛑 1. GEÇMİŞ PROJENİN (V1) HATALARI (BUNLARI TEKRARLAMA!)

1. **İsraf ve Şov:** Eskisinde her saniye API çağıran 4 tane chatbot vardı. Binlerce dolar API faturası çıkaran gereksiz bir gösterişti.
2. **Sabit Şablon Hantallığı:** "Her gömlek aynı şablonla dikilir" dendi. Modelin ruhuna ve kumaşına göre esneklik (özel A4 teknik föy) sisteme işlenmemişti. Fason firmaları kendi bildiklerini okuyordu, inisiyatif onlardaydı.
3. **Mekanik ve Acımasız Kronometre:** Elektrik kesildiğinde (patronun/makinenin sorunu olduğu halde), sistem geçen zamanı işçinin "Maliyet Barajından" eksi puan (ceza) olarak düşüyordu. Zayiat işçiye kesiliyordu. Kalpsiz bir sistemdi.

---

## 🏗️ 2. YENİ PROJENİN (47_SIL_BASTAN_01) 1. BİRİM PLANI (DEĞERLENDİRMEN İSTENEN YAPI)

Biz (Komutan ve Antigravity) şu kararları aldık. Bunları denetle:

1. **Dinamik Föy Girişi:** Sisteme giren her modele, o modele ait A4 formlarına göre (Kesim->Dikim->İncili Düğme vs) DİNAMİK bir sıra atanacak. O adım bitmeden (tablet/kamera ile resim/onay verilmeden) ikinci adıma (Örn: Ütüye) ASLA geçilemeyecek.
2. **Sıfır İnisiyatif:** Eğer aksesuar (iplik vs.) eksikse, sistem makineye veya fasona parça kestirmeyecek (Düğme siyah kalacak, makine kilitlenecek).
3. **Vicdan Toleransı ve Liyakat:** Elektrik ve makine duruşu (Sistemsel Arıza) işçinin cezasından düşülecek. Ayrıca arkadaşına yardım eden liyakatli ustaya Şef tarafından "Sosyal Yardım Puanı" eklenecek.
4. **Zorluk / Liyakat Eşleşmesi:** Zorluğu "9.0" olan bir pahalı kumaş işlemini, Hata Geçmişi (FPY'si) %85 olan bir ustaya değil, FPY'si %99 olan adama sistem önerecek (Aksi takdirde kırmızı Alarm verecek).

---

## 🎯 3. GEMİNİ'DEN BEKLENEN İSTİŞARE CEVABI VE İŞ EMRİ

Lütfen yukarıdaki acı dersleri ve yeni 1. Birim planımızı VERİTABANI VE İLİŞKİSEL MANTIĞA göre süzgeçten geçir. Bize şu formatta bir MD dosyası (.md) olarak cevap ver:

1. **Yüzde Yüz (%100) Onay ve Kör Nokta Taraması:** Plana katılıyorum/katılmıyorum. Şu noktada (Örn: Kamera çözünürlüğünde) şu veri tabanı şişmesi yaşanabilir, bunu şöyle kısıtlamalıyız diyeceğin "Kör Nokta Uyarısı" var mıdır? Eski hatalardan tamamen arınmış mıyız?
2. **Veritabanı Çekirdek Şeması:** Supabase (PostgreSQL) tablolarımız bu anlattığımız inisiyatifsiz ve kanıtlı sistem için tam olarak nasıl olmalı? (Tablo isimleri, foreign key bağlantıları ve tolerans sütunları).
3. **Maliyet-Zaman Tasarrufu Önerisi:** Tasarım şefine (Claude'a) UI çizerken veri akışını yormayacak ne gibi uyarılarda bulunursun?

Bize "Geçmişin hastalığını yok eden, Yeni Sistemin %100 Sağlamasını yapan" cevabını içeren bir MD (Markdown) Raporu çıkar.
