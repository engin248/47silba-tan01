# M3 / MODEL TASLAK, KALIP VE SERİLEME ARŞİVİ (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/kalip` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/kalip/components/KalipMainContainer.js`
**Sistem Görevi:** M2'de seçilen kumaşın hangi taslak modele (Pantolon, Gömlek vb.) dikileceğini, ve bu modelin beden serilemesini (XS, M, L) NİZAM sistemine kazıyan ana yapıdır. 

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Pencere 1: Model Taslakları** 
    *   Ar-Ge'de onaylanan trendlere bağlı olarak yeni "Model Kodları" ve tanımları oluşturulur.
2. **Pencere 2: Kalıplar ve Beden Serileme** 
    *   İlgili Modele ait pastal boyu, eni ve fire oranı girilir. PDF/DXF dijital kalıp dosyaları saklanır. `MetrajHesap()` algoritması ile kumaş ihtiyacını (m²) otomatik ölçer. 

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Kalıp Modülü Ağ Güvenliği
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Ağ Zehirlenmesi (Egress Kota Sömürüsü):** Supabase Realtime Kanalı `'public'` schema'ya tam açık bırakılmış. Geleneksel sayfalardaki gereksiz tetiklemeler telefonlarda/tabletlerde şişme ve veri kaybına neden oluyordu.
    2. **M4 Modelhane Hızlı Geçiş Katliamı (SPA Çöküşü):** Sağ üstteki "M4 Modelhane'ye Geç" butonu `<a>` takısıyla HTML yönlendirmesi atıp Next.js mimarisini patlatıyordu.
    3. **Silme İşlemlerinde Anti-Spam (Çift Tıklama) Açığı:** Acelesi olan yetkililer `Çöpe At` tuşuna çift tıklayınca state bozulmasında sebep olmaktaydı.
*   **Yapılan Ameliyatlar:**
    1. **Realtime Kısıtlandı:** `.on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_taslaklari' })` ve `b1_model_kaliplari` şekline hedefe kilitlendi. 
    2. **NextLink Entegre Edildi:** M4'e geçiş için akıllı SPA köprüsü kuruldu, sayfa içi dalgalanmalar önlendi.
    3. **islemdeId (Anti-Spam) Zırhı Devrede:** Satır Silme İşlemi (1 milisaniye içinde) buton yetki kısıtı ile güvenceye alındı ve spam istekler engellendi.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Test ONAYLANDI.
*   **Bulut Testi ve Github:** Ana Vercel sunucusuna PUSH yapılacak.
*   **Browser Subagent Vercel Testi:** M3 Kalıp (Vercel) canlı test edildi. Sızma tespit edilmedi.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Bu sayfada hiçbir çalışan `islemdeId` C-Level zırhını devre dışı bırakamaz.
*   Yeni fonksiyon eklenecekse **ÖNCE** bu kök dosyaya (`M3_KALIP_REFERANS_DOSYASI.md`) gelip `Revizyon 2` ile belgelendirmek kanuni zorunluluktur.
