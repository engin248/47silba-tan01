# M9 / SİPARİŞLER (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/siparisler` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/siparisler/components/SiparislerMainContainer.js`
**Sistem Görevi:** Dış kanaldan (Trendyol, Amazon, Mağaza vb.) gelen taleplerin dijital ikizini oluşturup `Teslim` veya `İptal` durumuna kadar yönlendirilmesi. **HermAI (Yapay Zeka)** karar destek sisteminin kalbi de bu satış verilerine entegredir. Sipariş edilen ürünlerin en kısa sürede stok düşümü sağlanıp "Rezerve" mantığı çalıştırılır.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **ZOD Sunucu Kalkanı:** Kaydet fonksiyonu API Route üzerinden `b0_sistem_loglari` ve `b2_siparisler` ikilisine Transaction tadında işlem atar. ZOD güvenlik modeli aktiftir.
2. **5 Adımlı Stepper:** Sipariş durumları "Beklemede > Onaylandı > Hazırlanıyor > Kargoda > Teslim" silsilesi ile akar.
3. **Stok Entegrasyonu (S-03):** Sipariş onaylandığı an sistem `b2_stok_hareketleri`ne çıkış çakar, iptal edildiği an stoklar geri iade edilir.
4. **Aciliyet Panik Butonu (Acil Limit >= 24h):** Bekleyen siparişlerin yanında geri sayım aracı ile alev işaretleri gösterilir.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam (M9)
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Mükerrer Statü Güncellemesi (Bot DDoS):** "✅ Onayla" veya "🗑️ Sil" tuşuna defalarca basılarak, internet gecikmesi anında birden fazla stok işlemi tetiklenebiliyor, stoklarda sahte eksi (negatif) adetler oluşabiliyordu.
    2. **Tüm Sistemi Render Etme (Kötü Huylu WebSocket):** `islem-gercek-zamanli-ai` adlı global kanal kullanıldığı için alakasız bir tablodaki (örnek `b1_kesimhane`) ufacık değişiklilikte koca Sipariş sayfası baştan inşaa (render) ediliyordu.
    3. **SPA Bağlantı Problemleri:** "Katalog" ve "Stoklar (M11)" bağlantılarında eski usul `<a>` takısı kalarak React State'inin sıfırlanmasına sebep oluyordu.
*   **Yapılan Ameliyatlar:**
    1. **WebSocket Kılıcı Vuruldu:** `siparis-gercek-zamanli` isimli izole kanal açıldı ve sadece `table: 'b2_siparisler'` baz alındı. 
    2. **Anti-Spam (islemdeId Zırhı):** Her sipariş fişinin ID'sine özel kilitler vuruldu (`durum_ID`, `sil_ID`). Beklerken buton opaklığı `%50` düşürülüp tıklama disable edildi.
    3. **SPA Mimarisi Tamamlandı:** Tüm bağlantılar `next/link` yapısına geçirilerek uygulama ağacı korundu.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı ve Başarıyla Çalışıyor.
*   **Browser Subagent Vercel Testi:** `100_CANLI_SAHA_DOGRULAMA_RAPORU.md` üzerine eklenecek.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Müşteriden avans/kapora alınma durumunun ileride buraya "Kısmi Tahsilat" butonu ile M7 Kasaya entegre edilmesi istenebilir.
*   Kargo şirketlerinin API entegrasyonu (Trendyol Kargo vb.) aktifleştiğinde "Kargonun Durumu" manuel değil webhook ile değişecektir, bu kurguya altyapı uygundur.
