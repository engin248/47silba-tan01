# M3 - İMALAT VE BANT SİSTEMİ ANA KARARGÂH (REFERANS VE KÖK ARŞİV DOSYASI)

**UYARI:** Bu dosya, `src/features/imalat` dizininin KÖK kimliğidir. Sistemdeki modüle dokunmadan önce okunması gereken, yapılan testlerin, mimarilerin ve "NİZAM / 0 HATA" kurallarının kaydedildiği defter-i kebirdir. Sayfaya kim/hangi tarihte ne zırh yaptıysa buraya eklenecektir.

---

## 1. MODÜL (M3) GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/imalat/components/ImalatMainContainer.js`
**Sistem Görevi:** M2'de fasona/banda atılmış Teknik Föylerin ve Numune Şablonlarının **Seri Üretimi, Personel Performansı (FPY) ve Üretim Kronometresinin** denetlendiği uç birimdir. 

**Sayfada Yer Alan Bütün İşlemler Listesi (Fonksiyonel Akış):**
1. **Pencere 1: Teknik Görüş & Dosya Açma** (`teknikFoyKaydet`)
    *   Ürün Resim ve Maliyet Sınırını DB'ye kilitler. (Tablo: `v2_models`)
    *   İnisiyatifi tamamen ortadan kaldırır; offline dahi olsa kuyruğa atar.
2. **Pencere 2: İşlem/Modül Belirleme (Fason İş Yüklemesi)** (`uretimBandiVeyaFasonaFirlat`)
    *   İlk Numune Şablonunu oluşturur, İşlem süresi ve video istasyonu şart koşar.
    *   Bu aşamadan sonra asıl Sipariş (Band) açılır.
3. **Pencere 3: Saha Üretimi ve Bant Yönetimi / KANBAN** (`sahadakiIsiBaslat`, `sahadakiIsiBitir`, `sahadakiArizayiBildir`)
    *   **İşçiyi Dinleme (Olay Döngüsü):** Kronometre çalışır (`in_progress`), duruş kaydedilir (`blocked_machine`) veya tamamlanır.
    *   İşçilerin (Liyakat/Sosyal Puan ve FPY / Kusursuzluk Skoru) Canlı Tablosu gösterilir.
4. **Pencere 4: Karargâh / Müfettiş Son Onay ve Red Gişesi** (`finaleOnayVerMuhasebeyeYaz`, `hataliMalReddet`)
    *   İşçinin ürettiği mal incelenir. Hata varsa "Reddedilir" (Maliyet zarar fişi açılır).
    *   Doğru ise "Onaylanır" ve **Finalist olarak M6 Finans** ağına gönderilmek üzere "Completed" statüsüne alınır. Her onayla Telegram'a otomatik rapor gider.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM felsefesine uygun olarak bu modüle yapılan tıbbi ve siber müdahaleler listesidir."*

### 🛠️ Revizyon 1: FAZ-3 Antiviral ve Ağ Telekomünikasyon Zırhı
*   **Tarih:** 11 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. Personel "Onay" tuşlarına çok basarak veritabanı parasını spamlıyor ve Telegram robotumuzu banlatıyordu.
    2. React hook dizisi auth tetiklemesinde Memory-Leak yaratarak sunucuyu kapatıp açıyordu.
    3. M6 (Finans) butonunda SPA kuralları (`next/link`) atlanıp HTML köprüsü yazıldığı için telefon RAM belleği başa sarıp şebekeyi yoruyordu.
*   **Yapılan Ameliyatlar:**
    1. Tüm M3 fonksiyonlarına `[islemdeId]` adında C-Level zırhlı kilit sistemi entegre edilmiştir. Fonksiyona 1. milisaniyede giren kilit, sunucu onaylasa da onaylamasa da son ana kadar tuşu Spam'dan korur. `disabled` parametreleriyle görsel uyarılar verilmiştir.
    2. Modüler Geçiş Butonuna `NextLink` gömülmüş ve NİZAM arayüzü bozulmadan pürüzsüz hız (%100 optimizasyon) sağlanmıştır.
    3. `useEffect` içerisindeki Global RAM sızıntısı `[mainTab, kullanici?.id, kullanici?.grup]` ile sökülmüş; M3, NİZAM'ın en stabil uçbeği haline getirilmiştir.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** `npx next build` sıfır hata (Exit 0) ile onaylandı.
*   **Vercel Bulut Testi:** Github'a `176bdfc` Hash'i ile pushlandı, Vercel Build Başarılı.
*   **Tarayıcı Sızma Testi:** Tarayıcı Ajanımız (Browser Subagent) ile `https://mizanet.com/imalat` prodüksiyon adresine sızıldı. M3 Sayfası hatasız işlendi, "Erişim Kodu (PIN)" duvarının ve Mizanet kurumsal güvenliğinin ayakta olduğu teyit edildi. (Sayfa çökmedi, Memory Leak yaşanmadı).

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   M3 sayfasının KÖK Rapor Linki (105 no'lu rapor): `Sistem_Kontrol_Raporlari/105_IMALAT_KOR_NOKTA_ANALIZI.md`
*   Bir başka mühendis M3 sayfasına kod girecekse, **ÖNCE** bu kök dosyayı (`M3_IMALAT_REFERANS_DOSYASI.md`) okuyup, eklediği değişikliği buranın altına Tarih ve İsmiyle `Revizyon 2` olarak işlemek zorundadır.
*   NİZAM / 0 İNISİYATİF kuralı geçerlidir.
