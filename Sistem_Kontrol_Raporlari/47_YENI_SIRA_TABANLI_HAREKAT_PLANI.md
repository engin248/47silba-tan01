# ⚔️ 47 NİZAM: YENİ SIRA TABANLI HAREKÂT VE TAARRUZ PLANI

Tarih: 08 Mart 2026
Oluşturan: Antigravity AI Otonom Mühendisi (Komutanın Emriyle)

Bu plan, dijital olarak "Bitti" dediğimiz sistemin **sahaya (atölyeye, internetsizliğe, korsan saldırılarına ve gerçek yapay zekaya)** çıkmadan önce tamamlanması ZORUNLU olan eksiklerin ve kör noktaların **adım adım (sıralı)** taarruz listesidir.

---

## 💥 AŞAMA 1: ÇELİK KAPI (VERİTABANI RLS TOKEN ZIRHI) [✅ TAMAMLANDI]

*Şu an sistemin arayüzünde şifre var ama veritabanı kapıları ardına kadar çıplak (Anonim).*

* [X] **Görev 1.1:** Supabase arayüzüne (SQL) yapıştırılacak özel bir JWT/RLS kilit dosyası yazılacak.
* [X] **Görev 1.2:** Sadece sizin belirlediğiniz Rol'lerin (Örn: `role = 'tam'`) o tabloları silebilmesi veya görebilmesi kuralı (Policy) veritabanı çekirdeğine gömülecek. Hacker saldırısı fiziksel olarak imkansızlaştırılacak.

## 💥 AŞAMA 2: FİZİKSEL DÜNYA İLE BAĞ (BARKOD ENTEGRASYONU) [✅ TAMAMLANDI]

*Barkod etiket çıkarma ve okuma kodlamaları tüm ilgili sayfalara (Kumaş, Kesim, Stok) dağıtıldı.*

* [X] **Görev 2.1:** `Kumaş Arşivi` modülüne her yeni top kumaş eklendiğinde yanına "Yazdır" butonu eklendi. QR kod yazdıran donanım bağlandı.
* [X] **Görev 2.2:** `Kesimhane` modülüne, top kumaşın QR'ı tablet kamerası veya barkod tabancasıyla okutulduğunda işlemleri otomatik başlatan **"QR Tarayıcıyı Aç"** kamerası (html5-qrcode) monte edildi.
* [X] **Görev 2.3:** `Stok & Sevkiyat` sayfasında Ürün paketlerine İrsaliye teslim fişlerine barkod çıkartacak `FizikselQRBarkod` modülü kuruldu.

---

### >>> ŞU AN BU AŞAMADAYIZ <<<

## 💥 AŞAMA 3: İNTERNETSİZ (OFFLINE) ÖLÜMSÜZLÜK (INDEXED-DB) [✅ TAMAMLANDI]

*İnternet kopunca sistem kırmızı uyarı veriyor ama işçinin işine devam edip, veriyi tabletin gizli hafızasında tutup internet gelince gizlice göndermesi lazım.*

* [X] **Görev 3.1:** Sisteme `idb` (IndexedDB) yerel veritabanı motoru kuruldu (`offlineKuyruk.js`).
* [X] **Görev 3.2:** İnternet yokken `Kaydet` tuşuna basan işçinin verileri `Çevrimdışı Bekleyen İşlemler` kuyruğuna alınacak şekilde (Görevler sayfasında) ayarlandı.
* [X] **Görev 3.3:** Wi-Fi veya Mobil Veri geldiği saniye arka planda sessizce bekleyen tüm veriler (işçi fark etmeden) Ana Sunucuya (Supabase) postalanır hale getirildi.

## 💥 AŞAMA 4: YAPAY ZEKA GÖZÜ (M14 DENETMEN ENTEGRASYONU) [✅ TAMAMLANDI]

*Yapay zeka (Vision) çekirdek kodunu (`visionAjanCore.js`) yazdık ama bağlamadık.*

* [X] **Görev 4.1:** `m14_denetmen` sayfasına bağlandı. Fason atölyeden çekilen fotoğrafı okuyabilen "Kamera Modalı" gövdeye yerleştirildi.
* [X] **Görev 4.2:** Yapay Zeka (AI), resme bakıp kumaşın defosunu, dikiş atlamasını veya asimetrisini "Hata Oranı" şeklinde işletmeye dönecek şekilde kod entegrasyonu tamamlandı.

## 💥 AŞAMA 5: KOD ZAYIFLAMASI VE MİMARİ AMELİYAT (OBEZİTE CERRAHİSİ) [✅ TAMAMLANDI]

*Sistemin sayfaları (15 Sayfa) 500-600 satırdan oluşuyor. Yazılımsal obezite içerisindeyiz.*

* [X] **Görev 5.1:** Sayfalardaki (Örn: Siparişler sayfası) karmaşık ve binlerce satırlık JSX bileşenleri, `src/components/ui` içine (ErisimBariyeri, FiltreDugmeleri, IstatistikKutulari, SayfaBasligi, SilBastanModal) kapsüller halinde taşındı.
* [X] **Görev 5.2:** Ana kod dosyalarının (Örn: siparisler/page.js) yükü ~150-200 satıra kadar düşürülüp sadeleştirildi. Fonksiyonlar util (faturaYazdir.js) içerisine ayrıldı. Mimari şoktan kurtarıldı.
