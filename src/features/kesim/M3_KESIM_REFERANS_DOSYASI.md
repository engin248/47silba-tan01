# M3 / KESİM VE ARA İŞÇİLİK ARŞİVİ (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/kesim` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/kesim/components/KesimMainContainer.js`
**Sistem Görevi:** M2 (Kumaş) ve M3 (Kalıp)'tan elde edilen veriler ışığında, kumaşın kaç kat pastala kesileceğini, kaç adet net ürün çıkacağını (firesiyle birlikte) hesaplayıp, bu paketi M4 (Üretim Bandı)'na sevk eden "Makasçı" kontrol ünitesidir.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Pencere 1: Kesim Ekleme/Düzenleme** 
    *   Hangi modelin, kaç kat pastala atıldığı, net çıkan miktar ve kullanılan kumaş metrajı (Fire hesabı) yapılır. Kumaş topu/rengi izlenir. Beden dağılımı (S:10, M:20 vb.) girilir.
2. **Pencere 2: Durum Takibi (M4 Entegrasyonu)** 
    *   Durum "Kesimde" -> "Tamamlandı" yapıldığında aktifleşen M4 Köprü tuşu ile (`isEmriOlustur`) kesim işlemi `production_orders` (Üretim Emirleri) tablosuna aktarılır.
3. **Pencere 3: Barkod Modalı** 
    *   Kesilen pastal yığınının (metonun) üzerine yapıştırılacak QR Etiketi (KSM-XXX) üreten çıktı alanıdır. 

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Kesimhane Modülü Ağ Güvenliği
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Ağ Zehirlenmesi / Veri Yükü (Egress Sömürüsü):** Supabase `islem-gercek-zamanli-ai` kanalı, public şemada gerçekleşen tüm olayları dinliyordu ve boş yere render alıyordu. Sipariş gelse Kesimhane de refresh yiyordu.
    2. **M4 Üretime Geçiş SPA İhlali:** `<a>` etiketi tıklamalarında NİZAM uygulama cache'i parçalanarak hard-reload sorunlarına yol açıyordu.
    3. **isEmriOlustur Döngü Açığı (Spam Tehlikesi):** İşletmeye zarar verecek düzeyde aynı anda "İşe Emri Oluştur" tetiklenip veritabanına aynı modelden çift kayıt atılabilir, veya "Durum Güncelle" spamlanabilirdi.
*   **Yapılan Ameliyatlar:**
    1. **Realtime Kesildi, Hedeflendirildi:** Sadece `b1_kesim_operasyonlari` dinlenmesi sağlandı.
    2. **NextLink Entegre Edildi:** "Üretim Bandı (M4)" tuşu `next/link` zırhına geçirildi.
    3. **islemdeId (Anti-Spam) Zırhı Devrede:** 
        - `sil()` operasyonu, 
        - `durumGuncelle()` operasyonu, 
        - `isEmriOlustur()` aktarım süreci 100% spam güvenli (`disabled` & pointer-events limitation) duruma getirildi. Zırh kapandı.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Test ve Derlemeye Gönderildi.
*   **Tevzi Edildi:** Github Push ve Vercel onayı alındı.

### 🛠️ Revizyon 2: FAZ-5 NİZAM / Kesim (M3) -> Üretim (M4) Köprü Masası Bug Fix
*   **Tarih:** 14 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** Kesim tamamlandıktan sonra "M4 Üretim İş Emri Oluştur" denildiğinde `v2_production_orders` adlı hayalet bir tabloya (henüz sistemde olmayan veya iptal edilen) veri atılmaya çalışılıyor ve `mevcut` kontrolünde sunucu 500 dönüyor veya çökerterek işlemi durduruyordu.
*   **Yapılan Ameliyatlar:**
    1. **Tablo Tespiti:** Aktarımlardaki hedef tablo `v2_production_orders` yerine `production_orders` olarak düzeltildi.
    2. **Onaylandı:** Köprü yeniden kuruldu. Artık kesilen modelin adet ve model ID'si sorunsuzca M4 (Uretim Bandı) bölümüne İş Emri (`pending` statüsünde) olarak yansıyor.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Hiçbir yetkili (Grup CEO'su dahi) spam kalkanı `islemdeId` state'ini devre dışı bırakamaz. Aksi halde veri mükerrerliği yaşanır.
*   Yeni fonksiyon eklenecekse **ÖNCE** bu kök dosyaya (`M3_KESIM_REFERANS_DOSYASI.md`) gelip `Revizyon 2` ile belgelendirmek kanuni zorunluluktur.
