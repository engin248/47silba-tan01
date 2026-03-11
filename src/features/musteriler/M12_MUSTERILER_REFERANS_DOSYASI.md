# M12 / MÜŞTERİLER CRM (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/musteriler` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/musteriler/components/MusterilerMainContainer.js`
**Sistem Görevi:** Tüm perakende, toptan, mağaza müşteri kayıtlarını muhafaza etmek. B-05 Kriteri gereğince Müşteri ile iletişim/vukuat geçmişini loglamak. Sorunlu müşterileri "Kara Liste"ye alıp satış/sipariş departmanlarını uyarmak.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Validasyon Duvarı:** E-posta regexi, ID limiti ve mükerrer "Müşteri Kodu" girişini db sorgusuyla bloklama (`b2_musteriler` tablosu `neq('id', duzenleId)` mantığı).
2. **Offline Mod:** Satış temsilcisinin sahada veya fuarda (internetsiz) girdiği kayıtları localde tutup, internet gelince `cevrimeKuyrugaAl` ile sunucuya basması.
3. **B-05 İletişim Logu (Timeline):** Her müşterinin yanındaki "Geçmiş" butonu, `b0_sistem_loglari` tablosundan (islem_tipi = 'NOT') ve diğer silme loglarından beslenerek zaman tüneli oluşturur.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam (M12)
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Form Gönderim Zafiyeti:** "Kaydet", "Kara Listeye Al", "Sil" ve "Not Ekle" butonlarına art arda basıldığında veya sinyal zayıfken aynı müşteri kaydını iki defa zorlama ya da log şişirme olasılığı.
    2. **SPA Ağacı Sorunu:** Siparişler sayfasına `<a>` href kullanılarak gidildiği için uygulamanın state hafızasının silinmesi.
*   **Yapılan Ameliyatlar:**
    1. **Anti-Spam (`islemdeId` Cerrahi Kilit):** Müşteri kaydetme, log notlandırma, kara liste toggle etme ve komple silme fonksiyonlarına state kilitleri takıldı. Dönen veri veya hata bitmeden ikinci kez tuşa basılması **imkansızlaştırıldı**.
    2. **`next/link` Entegrasyonu:** Sipariş geçmişi butonu SPA (`Link`) formatına çekildi.
    3. WebSocket Zırhı Kontrolü: Zaten `table: 'b2_musteriler'` formatında filtreli olduğu için onaylandı, dokunulmadı.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı ve Başarıyla Çalışıyor.
*   **Browser Subagent Vercel Testi:** `100_CANLI_SAHA_DOGRULAMA_RAPORU.md` üzerine eklenecek.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Kara Listedeki müşteriye yeni bir sipariş açılmaya kalkıldığında Sipariş (M9) tarafının bu arkadaşı uyarı vermesi hedeflenmelidir (Zaten planlanmıştı, testte bakılabilir).
*   Avans / Veresiye takibi yapılmak istenirse `b2_musteriler` tablosuna `guncel_bakiye` adlı bir decimal kolon açılıp Finans Modülü ile konuşturulabilir. Mevcut yapı buna hazırdır.
