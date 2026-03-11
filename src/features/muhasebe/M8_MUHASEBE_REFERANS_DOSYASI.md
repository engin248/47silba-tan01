# M8 / MUHASEBE VE FİNAL RAPORU (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/muhasebe` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/muhasebe/components/MuhasebeMainContainer.js`
**Sistem Görevi:** M6 İmalat modülünde biten üretim emrinin tüm gerçeğini masaya yatırmak. İşçilik, sarf malzeme, isletme giderleri ve fire kayıplarını "Hedeflenen Maliyet" ile "Gerçekleşen Maliyet" olarak karşılaştırmak. Sapmaları yüzde (`%`) bazında hesaplamak.
Eğer sonuç Şef tarafından onaylanırsa, Koordinatör PİN ile maliyeti **KİLİTLEMEK** ve 2. Birime (Depo) devretmek için geçit açmak.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Üretimden Rapor Oluştur:** Durumu "Tamamlandı" olan İmalat kayıtlarını yakalayıp, Muhasebe Raporu Taslağı olarak alır.
2. **Durum İlerletme:** `Taslak` → `Şef Onayı Bekliyor` → `Onaylandı` → `Kilitli`. 
3. **Koordinatör Kilidi:** Rapor Kilitlendiğinde artık "Muhasebe Dosyası" sonsuza kadar mühürlenir. Ne zayiatı, ne maliyeti ne de kendisi yöneticice dahi silinemez.
4. **Offline Devir:** İnternet yoksa veriyi tablete yazar ve geldiği an buluta geçirir (`cevrimeKuyrugaAl`).

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Performans Optimizasyonları
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Felaket Senaryosu (Kardiyak Kriz - WebSocket):** Kodda `.on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })` yazılarak **BÜTÜN** veritabanı dinleniyordu! Sahada üretim bandında her tıklama, stoktaki her hareket veya fason onayı bu Modülün baştan render (çizilmesi) edilmesine ve Vercel'i kilitlemeye yol açıyordu.
    2. **Anti-Spam (Data Race) Eksikliği:** Birden çok defa silme veya kilit vurma tuşuna tıklanırsa aynı dosya için API'ye spama düşülüyordu.
    3. **SPA Bağlantı Kopukluğu:** Menü "Ana Sayfaya Dön" butonu M1 arayüzüne geçerken ekranı baştan yeniliyordu (anchor `<a href="/"`).
*   **Yapılan Ameliyatlar:**
    1. **WebSocket Daraltma Ameliyatı (Cerrah Zırhı):** `muhasebe-gercek-zamanli` kanalı kurularak sadece `table: 'b1_muhasebe_raporlari'` dinlemeye alındı. Sadece muhasebeye ait kayıtlar girdiğide React render çalışacaktır. Ciddi bir işlemci ve ağ kazancı sağlandı.
    2. **`islemdeId` Spam Koruma Mekanizması Yüklendi:** Tüm `sil`, `durumGuncelle` ve `devirKapat` fonksiyonlarının başına kalkan inşa edildi. Art arda gelen istekler donanım üzerinden engellenip "wait" maskesi ile savuşturulmaktadır.
    3. **Next.js SPA Transition:** `a` elementi `Link` modülü ile değiştirildi, geçişte beyaz ekran/bellek kaybı önlendi.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı ve Başarıyla Çalışıyor.
*   **Browser Subagent Vercel Testi:** `100_CANLI_SAHA_DOGRULAMA_RAPORU.md` üzerine not edilecek şekilde deploy sırasında M7 ile birlikte test edilecek.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   WebSocket filtresi bu modülde en kritik yaşam destek ünitesi olmuştur. Muhasebe sayfası diğer bölümlerin aksine en çok DB okuması yapan bölümdür.
*   Kilitli raporu yönetici (`pin` girse bile) silemez kuralı (Satır: 239 daki `rapor_durumu === 'kilitlendi'`) asla değiştirilmemeli, yasal zorunluluk gereği bozulmamalıdır.
