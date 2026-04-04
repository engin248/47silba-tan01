# M14 / ÜRETİM BANDI (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/uretim` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/uretim/components/UretimSayfasi.js` ve `src/features/uretim/hooks/useIsEmri.js`
**Sistem Görevi:** Kesim veya modelhaneden gelen iş emirlerini üretim bandına (Bant & Montaj) almak, kalite/süre testlerinden geçirmek (dijital kronometre), personel/sarf maliyetlerini kalem kalem işlemek ve paketlenen ürünleri Mağazaya Sevketmek (M8 Muhasebeye Deviz raporu fırlatmak).

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **İş Emri Planlaması (A):** Model arşivinden modele seçip, adet belirleyip hedef tarihle sıraya dizme.
2. **Barkodlu Bant Sistemi (B):** İş emrini barkodla veya butonla `in_progress` (üretimde) ve `completed` (tamamlandı) hallerine otomatik/manual geçirme.
3. **Kronometre (C):** İşe start ve stop verme. Durdurulduğu an toplam sürenin Mizanet dakika_ucreti katsayısına çarpılarak Maliyetlere Otonom atılması.
4. **Maliyet Fişi (D):** Manuel ekstra "Sarf Malzeme" veya "Personel İşçilik" kalemleri ekleme.
5. **M8 Rapor Devri (E):** Toplam maliyet çıkarılan partinin "Mağazaya Sevket" butonuyla b1_muhasebe_raporlari tablosuna şutlanması.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam (M14)
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Mükerrer Devir (Zombi Çoğalma):** DevirYap veya TopluBitti gibi ağır fonksiyonlarda, zayıf internet bağlantılarında butona peş peşe basılmasıyla iki tane maliyet veya iki tane devir raporu çıkma potansiyeli.
    2. **SPA Ağacı Sızıntısı:** Muhasebe Raporuna (M8) yönlendiren Raporlar butonunun `<a>` etiketiyle sarmalanması (Hard-reload).
*   **Yapılan Ameliyatlar:**
    1. **Hook Ayrıştırmasına Rağmen islemdeId:** `useIsEmri.js` içine `islemdeId` durum kontrolü yerleştirildi. `durumGuncelle`, `yeniIsEmri`, `topluDurumGuncelleAction`, `silIsEmri`, `maliyetKaydet`, `devirYap` fonksiyonları state-lock altına alındı.
    2. **UI Cursor/Disabled:** UI bileşeninde (`UretimSayfasi.js`), `islemdeId` de-structure edilerek ilgili butonlara `wait` ve `%50 opacity` stili eklendi.
    3. **DOM SPA Enjeksiyonu:** "Muhasebe Raporu (M8)" butonuna `Link` (next/link) modülü eklendi. SSR yapısı korundu.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı, Hook-UI senkronu başarılı.
*   **Browser Subagent Vercel Testi:** `100_CANLI_SAHA_DOGRULAMA_RAPORU.md` üzerine eklenecek.

### 🛠️ Revizyon 2: FAZ-5 NİZAM / Kronometre Kayıpsızlığı (Crash Recovery) ve Mola Sistemi
*   **Tarih:** 14 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler (Kör Noktalar):** 
    1. **Donanım / Tarayıcı Kaybı:** Tabletin şarjı biterse, tarayıcı yanlışlıkla yenilenirse kronometre siliniyor ve maliyet sıfırlanıp NİZAM zarar ediyordu. (Javascript tabanlı RAM depolaması sıkıntısı).
    2. **Mola & Arıza Payı:** Operasyon esnasında bir makine arıza yaptığında veya çay molasına çıkıldığında, fason personel sürekli açık kalan sayacın şişirdiği maliyeti haksız kazanıyordu. İş duraklatılamıyordu.
*   **Yapılan Ameliyatlar:**
    1. **LocalStorage Zırhı (Crash Recovery):** `useIsEmri.js` içine `localStorage` mühürlemesi yapıldı. Başlatılan işin zaman mühürü yerel depoya kazınıyor. `useEffect` tetiklendiği anda yarım kalan tüm sayaçları gerçeğe eşitleyerek tekrar devralıyor.
    2. **Mola Sistemi Enjeksiyonu:** `duraklat` fonksiyonu tasarlandı. Tarayıcıda Pause (Mola) butonu aktif hale getirildi; mola verildiğinde geçen süreye kadar olan kısım hafızaya alınarak durduruluyor, "Devam Et" e basılınca kaldığı yerden otonom yazımı sürüyor. Böylece şişme maliyete karşı kesin zırh yapıldı.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   `barkodInputRef` yapısı şu an "Enter" tuşu yakalayarak çalışır. Gerçek hayatta okuyucuların sonuna CR/LF basmasıyla `barkodlaOtonomIslemYap` tetiklenmektedir. Okuyucu konfigurasyonlarına dikkat edilmelidir.
*   Kronometre'nin otonom Liyakat Puanı hesaplama sistemi (Zorluk Katsayısı x Süre), 47_SIL_BASTAN'ın adil prim dağıtımında omurgadır. Eğer Maliyetler aniden şişerse, `.env` dosyasındaki `NEXT_PUBLIC_DAKIKA_UCRETI` değişkeni ve Model Taslağının Zorluk(Talep) Derecesi kontrol edilmelidir.
