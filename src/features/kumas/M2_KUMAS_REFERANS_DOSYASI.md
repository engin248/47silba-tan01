# YENİ M2 / KUMAŞ VE AKSESUAR STOK ARŞİVİ (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, Kumaş & Aksesuar Modülünün `src/features/kumas` KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/kumas/components/KumasMainContainer.js`
**Sistem Görevi:** M3 (Kalıp), M4 (Modelhane) ve M6 (Seri Üretim) aşamalarında kullanılacak olan Kumaş ve Aksesuarların fiyatıyla, stoğuyla ve barkoduyla NİZAM veritabanı deposuna kilitlendiği ana depo/envater yöneticisidir. 

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Pencere 1: Kumaş Veritabanı ve Kritik Limit** 
    *   Satın almacı kod ve maliyet belirler. Kumaş (Örn: `150mt` Keten) depoya eklenir. `Limit(10)` altına düşerse Kırmızıya dönerek alarm verir. Fasoncuların/Bant çalışanlarının maliyeti görmesi engellidir. 
2. **Pencere 2: Aksesuar Veritabanı** 
    *   Düğme, Fermuar, İplik. NİZAM standartlarındaki birimlere (Adet/Metre vb.) göre stok tutulur.
3. **Pencere 3: Barkod Makinesi (`Kumas Barkodu Yazdır`)** 
    *   Fiziksel ruloların üzerine yapıştırılacak QR barkodu verir. Bu sayede atölyede kesimcinin makasında dijital dünya fiziksel dünyaya (Okutma) bağlanır.
4. **Pencere 4: Çevrimdışı Sürdürülebilirlik** (`cevrimeKuyrugaAl`)
    *   Faturasız mal gemideyken/bodrumdayken internet kesilirse mal cihaz önbelleğine kaydedilir, şebeke gelince Vercel'e ateşlenir.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Kumaş Modülü Ağ Güvenliği
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler (Tespit Edilen Açıklar):** 
    1. **Ağ Zehirlenmesi (Egress Kota Sömürüsü):** Supabase Kanalı `'public'` schema'ya açık bırakılmış. Siparişler ve Müşteri hareketleri bile bu sayfaya sahte bir tetik (Refresh) yollayarak yüzlerce mt. kumaş datasını telefonu yorarak internetten çekiyordu.
    2. **M3 Hızlı Geçiş Katliamı (SPA Çöküşü):** Sağ üstteki "M3 Kalıp'a Geç" butonu ilkel `<a>` takısıyla HTML yönlendirmesi atarak, Next.js karargâhının tüm önbelleğini sıfırlıyordu (Hard Refresh beyaz ekran sorunu).
    3. **Delete/Silme Butonlarında Spam/Döngü Sızıntısı:** Çöpe at butonuna aynı saniyede birden fazla kez basılabiliyor. Bu döngü (`useEffect`) menü geçişlerinde telefonu donduruyordu.
*   **Yapılan Ameliyatlar:**
    1. **Realtime Websocket Kısıtlandı:** `islem-gercek-zamanli-ai` kanalı, yalnızca kendi alanı olan `b1_kumas_arsivi` ve `b1_aksesuar_arsivi` tablolarına kilitlendi. Kotanız tam korumaya alındı.
    2. **NextLink Entegre Edildi:** M3 (Kalıp) tuşuna siber SPA kilit atıldı, NİZAM sistem belleği dondurularak anında geçiş yeteneğine yükseltildi.
    3. **islemdeId (Anti-Spam) Devrede:** Satır Silme İşlemi süresince (1 milisaniye içinde) buton yetki onayı (`disabled={islemdeId}`) ile spamı reddedecek şekilde kilitlendi. `useEffect` içerisindeki objesel döngü `kullanici?.id` ilkel primitivite değerine devşirildi.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** `npx next build` sıfır hata (Exit 0) ile derlendi.
*   **Bulut Testi ve Github:** Ana Vercel sunucusuna Başarıyla Pushlandı.
*   **Tarayıcı Onayı:** M2 (Kumaş) sayfası Browser Subagent yapay zekasıyla tıklandı, zırhların devreye girdiği, eski cache patlağının olmadığı görsel kayıtla mühürlendi.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Bu sayfada hiçbir çalışan `islemdeId` C-Level zırhını devre dışı bırakamaz.
*   Yeni fonksiyon eklenecekse **ÖNCE** bu kök dosyaya (`M2_KUMAS_REFERANS_DOSYASI.md`) gelip `Revizyon 2` ile belgelendirmek kanuni zorunluluktur.
