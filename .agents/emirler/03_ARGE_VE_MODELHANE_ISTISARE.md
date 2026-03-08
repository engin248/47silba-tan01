# 🛡️ DANIŞMA VE İSTİŞARE EMRİ (BÖLÜM 2): AR-GE, MODELHANE VE KESİM MİMARİSİ

**Görevli Ajan:** GEMİNİ (Sistem Mimarı ve Veritabanı Şefi)
**Konu:** "Üretimden Önce Karar ve Hazırlık Evresi"

Gemini, İmalat (Üretim) bölümünü kurduk ama Koordinatörümüz (Engin Bey) bizi çok sert ve haklı bir şekilde uyardı. Dedi ki: *"Biz ne idüğü belirsiz bir şeyi mi üretiyoruz? Üretime mal vermeden önce AR-GE (Araştırma Geliştirme) yapmalı, trendleri yakalamalı, kalıbı çıkarmalı, sonra ilk numuneyi KENDİ İÇİMİZDE (Modelhanede) kameraya çekerek dikmeli ve üreticiye (fasona) o VİDEOLU EMRİ kesmeden malı asla göndermemeliyiz!"*

Bu direktif ışığında, sistemin "Aklını ve Hafızasını (Modelhaneyi)" tasarlamamız gerekiyor. Bize kod yazma! Bize sadece bu anlattığımız akışın VERİTABANI HARİTASINI, SİSTEM İHTİYAÇLARINI ve KÖR NOKTALARINI analiz edip %100 Doğruluk Raporu sun.

---

## ⚙️ SİSTEMİN GEÇMESİ GEREKEN AŞAMALAR (KOORDİNATÖRÜN BİLDİRGESİ)

**1. AŞAMA: Dijital Trend Avcısı (Amazon / Trendyol)**

* Mağazaya mal koymadan veya imalata girmeden önce, yapay zekanın (veya API'lerin) internetteki satış platformlarını (Amazon, Trendyol) tarayarak "Şu an en çok ne satıyor, hangi model revaçta?" bilgisini toplaması.

**2. AŞAMA: Kumaş ve Materyal Arşivi (Dijital Depo)**

* Trend bulunduktan sonra o modelin hangi kumaştan dikileceğine karar verilecek.
* Bunun için devasa, fotoğraflı bir Kumaş ve Aksesuar Kütüphanesi (Veritabanı) olacak. Şef sisteme "Yazlık Keten" yazdığında kumaşlar fotoğrafı ve maliyetiyle anında gelecek.

**3. AŞAMA: Kalıp Çıkarma ve Serileme**

* Modele ve kumaşa karar verildikten sonra bilgisayarlı (veya fiziksel) ortamda kalıp çıkarılması ve "Serileme" (S, M, L, XL bedenlere göre ölçeklendirme) yapılması. Sistem bunun kayıtlarını (dijital kalıp dosyalarını) tutacak.

**4. AŞAMA: Kilit Nokta -> "İLK NUMUNENİN DİKİLMESİ VE KAYDA ALINMASI"**

* İşte en önemli yer! Fasoncuların inisiyatifini (kafasına göre dikmesini) engellemek için, çıkarılan kalıpla YALNIZCA 1 ADET örnek model "KENDİ MODELHANEMİZDE" dikilecek.
* **Kanıt:** Bu dikim sırasında operatör; kaç işlem olduğunu, sırasını, dakikasını manuel belirtecek ve nasıl dikileceğini SESLİ veya VİDEOLU olarak sisteme kaydedecek. (Bu, fasoncuya gidecek "Zorunlu İş Emri" dosyasıdır).

**5. AŞAMA: Kesim ve Ara İşçilik**

* Numune dikildi, video hazır. Artık top kumaşlar KESİM'e gidiyor.
* Kumaş kesildikten sonra "Ara İşçilik (Örn: Baskı, Nakış)" var mı, sisteme giriliyor.

**6. AŞAMA: Üretime (Birinci Birime) Teslimat**

* Kesilen mallar ve "Sesli/Videolu Nasıl Dikilir Numune Dosyası", bizim bir önceki yaptığımız "Üretim (Bant)" paneline iş emri (Order) olarak gönderiliyor.

---

## 🎯 GEMİNİ'DEN BEKLENEN İSTİŞARE CEVABI (RAPOR)

Yukarıdaki 6 aşamalı muazzam mimariyi incele. Bize şu formatta bir MD (.md) dosyası döndür:

1. **Fizibilite ve Kör Noktalar:** İnternetten trend verisi çekmek, kumaş fotoğraflarını arşivlemek, devasa numune videolarını Supabase'de barındırmak noktasında nerede veri şişer? Nasıl optimize ederiz?
2. **Tablo Mimarisi:** Supabase'e eklememiz gereken "ArGe_Trendleri", "Kumas_Arsivi", "Model_Videolari" gibi yeni tabloların isimleri, ilişkileri ve Foreign Key bağlantıları ne olmalıdır? (Özet liste mantığı).
3. **Koordinatör'ün Haklılığı:** Yeni tasarlanan "Fasoncuya inisiyatif vermemek için ilk ürünü kendin dik, videoya çek ve öyle ver" prensibi, hata (FPY) oranlarını nasıl düşürür, sistemin kusursuzluğuna nasıl etki eder? Değerlendir.

Senden kod değil, sadece %100 emin olduğun, çapraz denetimi yapılmış Akademik/Mühendislik "Ar-Ge ve Modelhane" raporu bekliyoruz.
