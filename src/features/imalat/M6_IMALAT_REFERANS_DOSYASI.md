# M6 / İMALAT VE SIFIR İNİSİYATİF ÜRETİM KORİDORU (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/imalat` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/imalat/components/ImalatMainContainer.js`
**Sistem Görevi:** 4 Adımlı Tam Denetim Paneli (Teknik Görüş, İşlem Sırası Belirleme, Saha/Kanban ve Kalite Onayı). Bu modül, NİZAM doktrininin kalbi olup, fason ve taşeron insiyatifini sıfıra indiren ana motor görevini görür.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Pencere 1: Teknik Görüş (Firma Modeli Kabulü):** Dışarıdan gelen model anayasası, harcanacak kumaş ve maliyet limiti burada kilitlenir.
2. **Pencere 2: Şablon Çıkarma (İşlem Sırası):** Fasona yollanacak işlem dökümü ve "İlk Kesim Dikim Video Kanıtı" burada zorunlu tutulur. Video yoksa seri üretime geçilemez.
3. **Pencere 3: Seri Üretim Bant / Kanban:** İşbirlikçi ustaların veya fasonun kronometre başlattığı, hatayı veya bitişi bildirdiği paneldir.
4. **Pencere 4: Müfettiş Analizi (Muhasebeye Aktarım):** Kapanış gişesinde üretilen mal kalite yönünden onay görürse (FPY), parası muhasebeye hak ediş olarak (₺) aktarılır.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / İmalat Modülü Ağ Güvenliği
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Veritabanı Çökmesi (DDoS Riski):** Sahada üretim başlat/bitir tuşlarına "dondu" bahanesiyle defalarca basılarak veritabanında aynı satıra arka arkaya UPDATE işlemi atılıyordu. Kanban board kasıyordu.
    2. **SPA Ağacı Kırılması:** Finans Modülüne gönderilen geçiş linki klasik anchor `<a href>` takısıyla SPA cache'ini yıkıyordu.
*   **Yapılan Ameliyatlar:**
    1. **Realtime Optimize Edildi:** `imalat-gercek-zamanli` kanalıyla yalnızca `v2_order_production_steps` tablosundaki olaylara daraltıldı.
    2. **M7 Finans / Depo SPA Kilitleri:** Geçiş butonu "💼 FİNANS / DEPO (M6) GEÇİŞİ" `NextLink` zırhı ile donatıldı. Transition anlık (0ms) gerçekleşiyor.
    3. **islemdeId (Anti-Spam) Zırhı Devrede:** 
        - `sahadakiIsiBaslat()`, `sahadakiIsiBitir()`, `sahadakiArizayiBildir()`
        - `hataliMalReddet()`, `finaleOnayVerMuhasebeyeYaz()` işlemlerinin her biri siber kilit altına alınarak DDoS yollar kapatıldı.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı ve Başarıyla Çalışıyor.
*   **Browser Subagent Vercel Testi:** `100_CANLI_SAHA_DOGRULAMA_RAPORU.md` üzerine not edilecek şekilde deploy sırasında test edilecek.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   **FPY (Satın Alma ve Kusursuzluk Toleransı):** Şuan çalışan işçinin verimi hesaplanıyor, ancak bu oran gelecekte İnsan Kaynakları Sicil (Sosyal Liyakat) ekranında kırmızı ya da yeşil olarak ışıklandırılmalıdır.
*   Ağ bağantısı koptuğunda Teknik Föy "Offline Kuyruğa" alınabilmektedir, bu kısım silinmemelidir.
