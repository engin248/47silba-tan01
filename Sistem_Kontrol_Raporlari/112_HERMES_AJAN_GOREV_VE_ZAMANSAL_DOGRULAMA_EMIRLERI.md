# 112_HERMES_AJAN_GOREV_VE_ZAMANSAL_DOGRULAMA_EMIRLERI

**Tarih/Saat:** 12 Mart 2026
**Konu:** Kurucu Yönetim Kurulunun 119 Kriterlik Ar-Ge Talebinin İşletmedeki 7 Ajana ve Timlere (Alfa, Beta, Gama) Dağıtılması ve "Zamansal Doğrulama" (Kendi kendini Test Etme) Zırhının Sisteme Lehimlenmesi.
**Öncelik:** MEGA-KRİTİK (Kırmızı Kod - Ajan İş Emirleri)

---

## 🦅 BÖLÜM 1: 7 AJANIN GÖREV VE YETKİLERİ (GÖREV DAĞILIMI)

Sistemdeki mevcut yapay zeka ve orkestrasyon ajanları, kurucunun emrettiği 119 Ar-Ge kriterini aşağıdaki şekilde bölüşerek uygulayacaktır. (Hiçbir ajan diğerinin yetki alanına girmeyecek, veriler Supabase merkezinde birleşecektir).

### 1- AVCI AJAN (Trend & Rakip Tarama)
*   **Yetki Alanı:** Google Trends, Amazon, Zara, H&M, Trendyol, Shopify, Etsy, Alibaba, Aliexpress.
*   **Görevi:** Maliyetsiz ve iz bırakmadan (IP Ban yemeden) Perplexity Sonar motoru üzerinden bu sitelerin veri tabanlarını (en çok satan, en hızlı tükenen, en çok aranan) saniye bazlı kazımak.
*   **Çıktısı:** Sadece veriyi getirmez. Veriyi getirip "Bu Pazar Doymuş" (Blue Ocean/Red Ocean) analizini koyar.

### 2- GÖZLEMCİ AJAN (Sosyal Medya & Malzeme Analizi)
*   **Yetki Alanı:** Instagram, TikTok, Pinterest, YouTube moda kanalları.
*   **Görevi:** Sadece resimleri görmek değil, halkın yaptığı yoruma, beğeni sayısına (Talep Skoru) bakarak Trend Rengini, Kumaş Dokusunu (Keten, Paraşüt vb.) ve Düğme/Fermuar gibi aksesuar trendlerini bedavaya çıkarmak.
*   **Çıktısı:** M2 Modelhane şefi için %100 "doğru malzeme reçetesi".

### 3- HESAP UZMANI (Potansiyel Kâr ve Maliyet Analizi)
*   **Yetki Alanı:** Rakip satış fiyatları, tahmini üretim maliyetleri ve Kasa (Finans) geçmişi.
*   **Görevi:** Dışarıdaki satış fiyatını (Örn: Zara'da 800 TL), işletmenin tahmini üretim maliyetiyle çarpıştırarak Kâr Marjını hesaplamak. 
*   **Çıktısı:** Zayıf veya risksiz kâr marjı varsa (%20 altı), ürünü "Üretime Değmez" diyerek bloke etmek.

### 4- STRATEJİST (Sezon & Bölge Analizi)
*   **Yetki Alanı:** Avrupa, Amerika, TR, Asya pazarları ve (Yaz, Kış) sezon döngüleri.
*   **Görevi:** Zıt verileri (Ortadoğu vs Avrupa tercihi) çarpıştırıp, M1 Ar-Ge paneline sadece "Bizim belirlediğimiz Hedef Pazara Özgü" filtrelenmiş 6 maddelik listeyi sunmak.

### 5- TASNİFÇİ AJAN (Arşivleme ve Supabase Yöneticisi)
*   **Yetki Alanı:** Supabase Tabloları (Model, Kumaş, Rakip, Notlar, Görsel).
*   **Görevi:** Yönetici reçeteye "ONAY VERDİ" dediği milisaniyede, devasa metindeki bilgileri parçalayıp (kumaşı ayrı DB'ye, fiyatı ayrı DB'ye, rakibi ayrı DB'ye) yazmak.

### 6- GECE BEKÇİSİ (Zamansal Doğrulama / Kendi Verisini Test Eden Ajan)
*   *(Kurucunun getirdiği 37 yıllık tekstil birikimi mantığıdır)*
*   **Yetki Alanı:** Sadece durum_kodu: `arsivlendi_takipte` olan ve "Üretilmekten Vazgeçilmiş" (Reddedilmiş) eski analizler.
*   **Görevi:** Biz bir ürünü "Satmaz" deyip rafa kaldırdıysak, ajan bunu silmez. Her gece saat 03:00'te (Edge-Watcher / Node.js cron) internete çıkar. O reddedilen ürün pazarda patlamış mı, yoksa batmış mı diye skorlar.
*   **Çıktısı:** "Kör Nokta Uyarısı! Reddedilen ürün Zara'da tükeniyor" veya "Doğru Karar! Pazardaki rekabet kan gölüne dönmüş". Bu sayede sistem KENDİ ZEKASINI/YANILGILARINI test eden canlı bir organizmaya dönüşür.

### 7- HABERCİ (Telegram ve M2 Aktarım Ajanı)
*   **Yetki Alanı:** M2 (Modelhane/Kalıphane) paneli ve Telegram Botu.
*   **Görevi:** M1'de karar çıkıp yöneticiden (insandan) onay geldiği saniye, Karargah ve Modelhane'nin ekranlarında kırmızı alarmları yaktırmak, yetkili cihazlara (Telegram) "Sıfır hata ile üretim emri başlatılmıştır" mesajını şifreli iletmek.

---

## 🗃️ BÖLÜM 2: GAMA TİMİ İÇİN VERİTABANI (SUPABASE) SQL İNŞA EMRİ
Kurucunun 12. maddede belirttiği arşivlerin tablolaştırılması ve 6. Ajanın kullanacağı "Zamansal Doğrulama" alanının açılması görevidir. Gama Timi aşağıdaki SQL kodlarını Supabase SQL Editor'den bir defaya mahsus çalıştıracaktır:

```sql
-- Ana Ar-Ge tablosuna Yeni Alanların Eklenmesi (Eski sistemi bozmadan lehimleme)
ALTER TABLE public.b1_arge_trendler 
ADD COLUMN IF NOT EXISTS arsiv_durumu text DEFAULT 'aktif', -- 'aktif', 'arsivlendi_takipte', 'ret'
ADD COLUMN IF NOT EXISTS zamansal_dogrulama_log jsonb DEFAULT '[]'::jsonb, -- 6. Ajanın gece notları
ADD COLUMN IF NOT EXISTS son_arastirma_tarihi timestamp with time zone;

-- 7 Ayrı Arşiv Tablosunun (12. MADDE) Kurulması
CREATE TABLE IF NOT EXISTS public.b1_arge_model_arsivi (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, trend_id uuid REFERENCES b1_arge_trendler(id), detay text, created_at timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS public.b1_arge_rakip_arsivi (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, trend_id uuid REFERENCES b1_arge_trendler(id), veri jsonb, created_at timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS public.b1_arge_kumas_arsivi (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, trend_id uuid REFERENCES b1_arge_trendler(id), kumas_tip text, created_at timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS public.b1_arge_aksesuar_arsivi (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, trend_id uuid REFERENCES b1_arge_trendler(id), detay text, created_at timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS public.b1_arge_notlar_arsivi (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, trend_id uuid REFERENCES b1_arge_trendler(id), not_metni text, created_at timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS public.b1_arge_referans_gorsel_arsivi (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, trend_id uuid REFERENCES b1_arge_trendler(id), link text, created_at timestamp DEFAULT now());

```

---

## 🎨 BÖLÜM 3: ALFA TİMİ (UI/ARAYÜZ) GÖREV EMRİ
*   **Dosya:** `ArgeMainContainer.js`
*   **Emir:** Eski 10 farklı araştırma sekmesi yok edilecek. Sayfaya "14. Madde Çıktısı" olarak belirtilen tek tip 6 bloklu (Satılacak Ürün, Model, Kumaş, Aksesuar, Fiyat, Müşteri) rapor ekranı eklenecek.
*   **Panel:** Mevcut UI'daki "ARŞİV & ZAMANSAL DOĞRULAMA PANELİ" alanı (line 1051 civarı) artık sadece boş durmayacak, 6. Ajanın gece çektiği son veriyi gösteren dinamik bir "Performans / Kaçan Fırsat" radarına (Self-Correction View) dönüştürülecek.

---

## 📡 BÖLÜM 4: BETA TİMİ (BACKEND) GÖREV EMRİ
*   **Dosya:** `src/app/api/trend-ara/route.js`
*   **Emir:** API içindeki prompt; tüm online siteleri, sosyal medya uygulamalarını, maliyet hesaplarıyla birlikte tek potada çekecek şekilde "Kırılamaz-JSON" formatına ayarlanmıştır. Bu format kontrol altında tutulacak ve değişmeyecektir.

---
**SONUÇ:** İşletmenin hiçbir departmanı boş bırakılmamıştır. Tüm süreç zırhlı ajanların gözetiminde, insana "sadece karar ve onay tuşu" verecek güvenliğe yükseltilmiştir. Görev emri sistem kayıtlarına işlenmiştir.
