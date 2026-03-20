# M11 / DEPO VE STOK YÖNETİMİ (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/stok` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/stok/components/StokMainContainer.js`
**Sistem Görevi:** İşletmenin kalbi olan fiziksel hammaddelerin ve bitmiş mamüllerin envanterini tutmak. Tüm giriş/çıkış/iade/fire hareketlerini kayıt altına almak. Azalan stoklarda otonom Telegram uyarıları üretip (Kritik Stok) olası sevkiyat krizlerini engellemek. FIFO (İlk Giren İlk Çıkar) kuralını benimsemek.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Otonom Durum Hesaplayıcı:** B2 Urun Katalogu üzerinden ham stoku çeker, B2 Stok Hareketlerindeki +/- durumları üstüne toplayıp "Gerçek Zamanlı Net Stok"u bulur. Bu formül kusursuzdur, değiştirilmemelidir.
2. **Offline Zırhlı Bölge:** Eğer depocu internetin çekmediği bir köşede giriş yaparsa veriyi LocalStorage'e (cevrimeKuyrugaAl) hapseder ve internet geri geldiğinde sessizce buluta gömer.
3. **Kara Kutu (B0) Entegrasyonu:** Eğer hatalı bir stok fişi SİLİNMEK istenirse M11 silme işlemini yapmadan evvel B0 Sistem Loglarına bu olayı yazar (Otomatik Güvenlik Çemberi).

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam (M11)
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Mükerrer Kayıt (Anti-Spam Eksikliği):** "Kaydet" veya "Sil" tuşuna donanımsal ya da sistemsel sebeplerle art arda basıldığında (veya bir bot/DDoS tarafından yoklandığında) birden çok stok işlemi düşülüyordu. 
    2. **SPA Yönlendirme:** Siparişler sayfasına geçiş Anchor (`<a>`) tagı ile yapıldığından state ve bellek aktarımı sıfırlanıyordu.
*   **Yapılan Ameliyatlar:**
    1. **`islemdeId` Spam Koruma Mekanizması Yüklendi:** Tüm `Hareket Kaydet` ve `hareketSilB0Log` fonksiyonlarının başına kalkan inşa edildi. Art arda gelen istekler engellenip ilgili buton "wait/..." maskesi ile savuşturulur duruma getirildi.
    2. **WebSocket Kontrolü Teyit Edildi:** Zaten daha önceden doğru bir şekilde `table: 'b2_stok_hareketleri'` olarak spesifik dinlemeye alındığı saptandı ve koda müdahale edilmedi. 
    3. **Next.js SPA Transition:** `a` elementi `Link` modülü ile değiştirildi, geçişte beyaz ekran/bellek kaybı önlendi.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı ve Başarıyla Çalışıyor.
*   **Browser Subagent Vercel Testi:** `100_CANLI_SAHA_DOGRULAMA_RAPORU.md` üzerine not edilecek şekilde M9 ve M11 birlikte test edilecek.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Stok hareketleri `b2` bölgesindedir (Sipariş/Müşteri). Eğer İmalat (M6) veya Modelhane (M4) bölümünden doğrudan hammadde (Kumaş) düşümü yapılacaksa bu tablonun kullanılıp kullanılamayacağı iyi analiz edilmelidir. İdeal olan bitmiş mamül giysi deposuyla hammadde kumaş deposunu mantıksal ayırmaktır.
*   Sayım modunda CSV yerine PDF okutma sistemine geçiş düşünülürse ZOD şemalarına "barcode" entegresi gerekecektir.
