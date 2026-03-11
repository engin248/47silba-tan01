# M7 / KASA VE FİNANS YÖNETİMİ (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/kasa` modülünün KÖK kimliğidir. Karargâh mühendislerinin NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/kasa/components/KasaMainContainer.js`
**Sistem Görevi:** İşletmenin tüm Tahsilat, Çek, Senet, Avans ve İade Ödemelerini kayıt altına almak. "Günlük Kasa Kapanış Özeti" çıkarmak ve vadesi geçen evrakları uyarmak ana misyonudur. Muhasebeye geçiş yapmadan önceki "Nakit Sıcak Para" toplanma noktasıdır.

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Yeni Hareket (Tahsilat/Avans):** Offline desteğiyle (`cevrimeKuyrugaAl`) internet yokken bile kasaya giriş yapılmasına olanak tanır.
2. **Dijital Adalet Kilidi (Kriter 114):** Kasa kaydı "Onaylandı" durumuna düştüğünde sistem yöneticisi dahi bu kaydı silemez. `B0 Kara Kutu` işlem görür.
3. **Müşteri Borç Riski Köprüsü:** Bakiyesi 10.000 TL'yi geçen açık/riskli müşterilere M11 (Müşteri) modülüne doğrudan bağlantı verir.
4. **CSV Export (A-03):** Filtrelenen her veri excele aktarılıp muhasebeye (M8) veya müşavire doğrudan çıkarılır.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Kasa Modülü Ağ Güvenliği
*   **Tarih:** 12 Mart 2026
*   **Geliştirici / Otorite:** Antigravity AI Agent (Kurucu-Yönetici: Engin Emriyle)
*   **Problemler:** 
    1. **Müşterilere Gönderilen SPA Tuzağı:** "Müşteriler Görüntüle" butonu anchor `<a href>` şeklinde olduğu için M11'e gidişlerde sistemi baştan yüklüyor, React Cache verilerini öldürüp 300ms hız düşürücü etki yapıyordu.
    2. **Onay ve Sil Spam Sendromu:** Mobil arayüzden giren yöneticilerin "✅ Onayla" veya "🗑️ Sil" tuşlarına arka arkaya tıklamalarından dolayı "Data Race" (Çakışma) oluşuyor, loglar çift yazılabiliyordu.
*   **Yapılan Ameliyatlar:**
    1. **WebSocket Güvencesi Sınandı:** `kasa-gercek-zamanli` kanalıyla yalnızca `b2_kasa_hareketleri`ne izole edildi. Başka sinyaller kasayı render etmeyecek.
    2. **M11 (Müşteri) Sıçrama Bağlantısı NextLink ile Zırhlandı:** `Link href="/musteriler"` eklendi, cache tutumlu geçiş (SPA) yapıldı.
    3. **islemdeId (Anti-Spam Kalkanı) Yüklendi:** 
        - `onayDegistir()` işlemi.
        - `sil()` operasyonu DDoS (çoklu talep) saldırılarına veya geciken internet tıklamalarına kapatıldı. Opacity zayıflatılıp (0.5) "wait" (kum saati) imleci ile görsel kalkan sunuldu. `onaylandi` statusüne sahip kaydın silinemezlik özelliği bozulmadan islemdeId resetleme prosedürü kilitlendi.

### 🧪 Test Durumu ve Sonuçları (Revizyon 1)
*   **Yerel Derleme (Local Build):** Yapıldı ve Başarıyla Çalışıyor.
*   **Browser Subagent Vercel Testi:** `100_CANLI_SAHA_DOGRULAMA_RAPORU.md` üzerine not edilecek şekilde deploy sırasında M8 ile birlikte test edilecek.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Finans modülünün CSV dışa aktarma yeteneği (`kasaCsvIndir`) bozulmamalı, çünkü Mali Müşavirlerle iletişim bu fonksiyon üzerinden yürütülüyor.
*   Onaylanan Tahsilatlara asla "Silinebilir" izni verilmemelidir. NİZAM hukukunda Onaylı Tahsilat değiştirilemez. Hatalıysa önce Onayı "İptal" statüsüne çekilmeli, ardından yeni Tahsilat/Çıkış girilmelidir. Silinme ancak Onaylanmamış fişlerde geçerlidir.
