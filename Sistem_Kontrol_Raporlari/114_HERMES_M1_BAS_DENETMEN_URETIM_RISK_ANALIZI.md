# 114_HERMES_M1_BAS_DENETMEN_URETIM_RISK_ANALIZI

**Tarih/Saat:** 12 Mart 2026
**Konu:** Hermes M1 (Ar-Ge) Mimarisinin Üretim Gerçekliği, Fabrika Dinamikleri ve Kör Nokta (Sistem Kırılma) Analizi
**Eksenler:** Stratejik, Teknik, Operasyonel, Ekonomik/Risk, İnsan/Kullanım
**Revizyon:** Baş Denetmen / Fabrika Müdürü Perspektifi

Bu rapor, laboratuvar ortamında "çalışır" görünen ancak fiziksel bir tekstil fabrikasının üretim bandına girdiğinde milyonlarca lira "fire, yanlış yatırım ve stok" zararı yaratma riski taşıyan sistem mimarisinin ACIMASIZ VE İMALAT MERKEZLİ parçalanmasıdır.

---

## 1. PROBLEM TANIMI VE TEMEL VARSAYIMLAR
**Problem:** Yapay zekaya (AI) "Kararı sen ver" yetkisi atanırken, imalatın fiziksel gerçeklikleri (kumaşın dokusu, pazar manipülasyonu, anlık döviz/maliyet değişimleri) ile dijital veriler (LLM halüsinasyonu, proxy engelleri) arasındaki uçurumun göz ardı edilmesi.
**Yanlış Varsayım:** "Yapay zeka internetten veriyi alır, doğru kararı verir ve üretim sorunsuz başlar."
**Gerçeklik:** Tekstilde veri sadece bir referanstır; üretim ise fiziksel bir tepkimedir. İnsan onayı ve mühendislik filtresi (Küratörlük) olmadan AI, fabrikayı uçuruma sürükler.

---

## 2. DÖRT KRİTİK DENETİM VE KÖR NOKTA PARÇALAMASI

### ❌ SORU 1: Yanlış İstihbarat ve Pazar Manipülasyonu (Ekonomik Risk)
*   **Kör Nokta:** Agent 1'in tek kaynağa (Amazon/Zara Best Seller) bakması. Bu veriler "Fake Order", "Influencer Patlaması" veya "Sezon Sonu İndirimi" (Clearance) nedeniyle manipülatiftir. Google Trends ve Stok/Fiyat stabilitesi çapraz doğrulaması olmadan üretilen ürün elde patlar.
*   **Sistem Kırılma Senaryosu:** Ajana güvenip 10.000 metre oversize gömlek kumaşı alınır. Ürün aslında trend değildir, sadece satıcı elindeki stoku bitirmek için fiyat kırmıştır. Zarar: Milyonlarca lira hammadde stoğu.
*   **Mühendislik Çözümü:** Agent 1 tek başına karar merci olamaz. **[Çapraz Doğrulama Matrisi]** şarttır. Amazon Best Seller oranı + Google Trends (Volüm) + Fiyat Stabilitesi = Güven Skoru. Güven skoru %60'ın altında ise üretim kesin red yer.

### ❌ SORU 2: Kumaşın Fiziksel Gerçekliği (Operasyonel ve Teknik Risk)
*   **Kör Nokta:** Agent 2'nin (Vision) görsele veya yoruma bakarak kumaş lif haritasını (%100 pamuk, 180 gsm vs.) kesin çıkarabileceği yanılgısı. Ekranda aynı duran iki kumaş boyada ve kesimde tamamen farklı davranır.
*   **Sistem Kırılma Senaryosu:** Agent 2 "Keten" der. Finans ajanı bunu pamuk/keten bazlı ucuz maliyetle hesaplar. İmalat emri çıkar. Halbuki ürün spesifik bir paraşüt/elastan karışımıdır. Kalıp düşer, yıkama çeker, maliyet %40 sapar.
*   **Mühendislik Çözümü:** Agent 2 bir karar alıcı değil, **"Küratör (Öneri Sunan)"** olmalıdır. Ajan, modelhanedeki şefe "İhtimal Kartı" sunar: *[Görsel %70 Keten/Viskon duruyor - Tahmini 120-150 GSM]*. Kalıpçı / Satınalmacı elindeki fiziksel karteladan bu kumaşı **manuel seçip onaylamadan** Agent 3 maliyet hesaplayamaz.

### ❌ SORU 3: Zamansal Doğrulama ve "Yok Satma" Göz Yanılması (Stratejik Risk)
*   **Kör Nokta:** Gece Bekçisi (Agent 6) reddedilen ürünü izlerken ürün yayından kalktığında "Demek ki satmadı, iyi ki reddetmişiz" der. Halbuki ürün "Yok Sattığı" için kaldırılmış olabilir.
*   **Sistem Kırılma Senaryosu:** Pazarın en çok kazandıran trendi, AI tarafından "Çökmüş" olarak raporlanır ve devasa bir kâr fırsatı (Mavi Okyanus) rakibe bırakılır.
*   **Mühendislik Çözümü:** Algoritmaya **[Review Velocity (Yorum Artış İvmesi)]** eklenmelidir. Sayfa 404 vermeden önceki son 48 saatte yorum/reyting sert şekilde yukarı ivmelenmişse; Statü "Çöktü" değil, "Stok_Tüketti_Basarili" olarak güncellenir.

### ❌ SORU 4: Veritabanı (Supabase) Yükü ve Kilitlenme (Sistem/Sunucu Riski)
*   **Kör Nokta:** 100 model x 7 asenkron ajan = Aynı anda yüzlerce API ve Transaction işlemi. 7 ajanın Supabase'e paralel veri tıkmaya çalışması sistemi saniyeler içinde kilitler (Deadlock) veya API faturasını patlatır.
*   **Sistem Kırılma Senaryosu:** Ar-Ge ekibi vizyoner bir güne başlar, makineye 50 prompt girer. Sistem kitlenir, Vercel/Supabase Server Error verir, fabrikada Ar-Ge durur.
*   **Mühendislik Çözümü:** Sistem arasına **[Message Broker / Event Queue (Kuyruk)]** yapısı kurulmalıdır (Redis/Upstash). Ajanlar birbirini bekler, işlemi biten bayrağı devreder. En sonda veri 7 tabloya değil, normalize edilmiş (İlişkisel - Versiyonlu) 3 Ana tabloya, **Tek Bir Write Transaction** ile yazılır.

---

## 3. BAŞ DENETMEN ÖLÜMCÜL UYARILARI VE YENİ MİMARİ KARARLARI

1.  **Dondurulmuş Veri (Frozen Data) Yerine Versiyonlama (V1, V2):**
    Tekstilde fiyat, aksesuar ve tedarikçi saniyede değişir. Ar-Ge verisi "Dondurulamaz". Sistemde "Veri Kitleme" değil, "Versiyonlama" (Snapshot) mantığı olmalı. Revize geldikçe `trend_v2`, `trend_v3` olarak kopyalanmalıdır.
2.  **Maliyet Körlüğü Engellenecek:**
    37 yıllık veritabanı harikadır; ancak asgari ücretin, enerjinin ve dolar kurunun anlık olduğu bir ülkede salt geçmiş data ölümcüldür. Agent 3 geçmişi sadece "işçilik dakikası" tahmini için kullanmalı; fiyatlandırmayı o günün anlık verisiyle yapmalıdır.
3.  **İnsan Onay Bariyeri (Gateway):**
    M1 (Ar-Ge) ile M2 (Modelhane) arasına çelik bir insan bariyeri konmalıdır. Kumaş cinsi, teknik kalıp toleransı sertifikalanmadan (Fiziksel İnsan Dokunuşu) hiçbir veri Modelhane masasına otomatik olarak İŞ EMRİ halinde düşemez. Yapay zeka Reçeteyi yazar, Baş Modelist İmzalar!

## 4. NİHAİ SONUÇ VE AKSİYON
Mevcut Hermes M1 planı mükemmel bir "Fikir ve İlham Makinesidir"; ancak ham haliyle bir "İmalat Talimat Motoru" DEĞİLDİR. Bu haliyle fiziksel bantta çalışırsa fabrikayı batırır. 

Sistemin şasisini dik tutmak için derhal **"Queue (Kuyruk) Mimarisi", "İnsan (Role-Based) Onay Kapıları (Gateway)" ve "Veritabanı Normalizasyonu"** projenin kod tabanına nakledilmelidir.
