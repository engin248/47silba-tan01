# M17 / GÜVENLİK (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/guvenlik` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/guvenlik/components/GuvenlikMainContainer.js`
**Sistem Görevi:** Tüm modüllerin erişim kontrollerini yönetmek, `sb47_x_pin` leri üretip geçersiz kılmak, "kim hangi sayfaya neyle girdi" loglarını görüntülemek. Aktif "Oturumlar" modülüdür.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Seviye Belirleme (PIN):** Üretim veya Genel erişim düzeyleri için PIN şifreleri üretmek ve yetki paylaşmak.
2. **Log Tüketimi (Görüntüle/Sil):** Cihazdaki (localStorage vs) yetkisiz veya yetkili giriş kayıtlarını (auth handler logger) görmek, admin yetkisiyle komple temizlemek.
3. **Rol Yönetimi (Kilit/Yetki Değiştirme):** Belli rollerdeki yanlış giriş adetlerini sıfırlamak (GVN-02).
4. **Acil Çıkış:** Hızlı bir şekilde aktif oturumu sonlandırmak ve ana giriş (M18) sekmesine zıplamak.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam (M17)
*   **Tarih:** 12 Mart 2026
*   **Problemler:** 
    1. Log Temizle (`logTemizle`) tuşuna veya PIN Güncelleme tuşuna (`handlePinDegistir`) hızlı/spam basmalarda localStorage kiliti ve yetki onay formunun ardışık süzülmesi tehlikesiydi.
*   **Yapılan Ameliyatlar:**
    1. **`islemdeId` Kalkanı:** M17 (Güvenlik) ekranındaki form kayıtları için işlem bekleme kuyruğu oluşturuldu (`islemdeId = 'pinDegistir'` ve `islemdeId = 'logTemizle'`).
    2. Bekleyen süreç içinde butonların yazıları (`Güncelleniyor...`, `Temizleniyor...`) ve durumları passife çekildi.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Olay loglama (Auth Log), cihaz taraflı işliyor `sb47_giris_log`. Supabase e (bulut) erişim limitini zorlamamak ve Mizanet kuralıyla maliyeti %90 düşürmek için yapılan mimari harika ilerliyor. 
*   Faz-5 (Buluta toplu senkron) gibi büyük çaplı güncellemeler gelinceye kadar bu sistem güvenli bir siber yapı sergilemektedir.
