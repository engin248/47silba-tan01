# 🛡️ THE ORDER 47 - KUSURSUZLAŞTIRMA VE YAPILACAKLAR (TO-DO) MASTER LİSTESİ

**Tarih:** 08/03/2026
**Hazırlayan:** ANTİGRAVİTY AI
**Durum:** KOMUTA ONAYI BEKLİYOR

*Komutanım, 188 Kriterlik benim Mimar raporum ile ekip arkadaşımın 242 Kriterlik Modül içi tespitlerini tek potada erittim. Sistemin kusursuz, açık vermeyen ve dünyada eşi olmayan bir "Silah" haline gelmesi için yazılacak olan kodların, butonların ve veri tabanı tablolarının **TAM VE KESİN LİSTESİ** aşağıdadır.*

---

## 🟥 BÖLÜM 1: VERİTABANI (SUPABASE) YENİ TABLO VE SÜTUN EKLENTİLERİ

*Bu işlemler veritabanına yeni hafıza hücreleri olarak eklenecektir.*

* [ ] **1. Tedarikçiler Tablosu (`b2_tedarikciler`):** Kumaşı aldığımız toptancıların adres, telefon ve firma bilgileri sisteme tablo olarak girilecek. (M2 Kumaş Modülüne bağlanacak).
* [ ] **2. Gelecek Vadeli Çek ve Senet Takibi (`b2_cek_senet_vade`):** M7 Kasa modülüne Müşteriden alınan Senetlerin veya Çeklerin vadelerini, tahsilat tarihlerini tutan yepyeni bir "Ön Muhasebe" tablosu oluşturulacak.
* [ ] **3. Kara Liste ve Risk Blokesi (`risk_limiti` Sütunu):** M11 Müşteriler tablosuna, tehlikeli müşteriye "Otomatik Sipariş Engeli" koyacak bir Kota/Risk Limiti (Integer) sütunu eklenecek.
* [ ] **4. İş Zorluk Derecesi ve Makine Tipi:** M3 Modelhane operasyon tablosuna bu işin "Zorluk Skoru (Örn: 1-10)" ve hangi makinede (Düz, Overlok, Reçme) dikileceği sütunları eklenecek. (Maaş adaleti için şart).
* [ ] **5. İK AI Performans Yıldızı (`ai_verimlilik_puani`):** M9 Personel tablolarında, işçinin diktiği malın hatasızlığına ve hızına göre yapay zekanın otonom puan (1-5 Yıldız) dağıtabileceği matematiksel bir sütun açılacak.
* [ ] **6. Offline Kopma Logları:** `b0_sistem_loglari` kara kutusuna, tabletin "Wi-Fi koptu, Offline'a düştü" bilgisini saniyesiyle kaydedecek şema yaması yapılacak.
* [ ] **7. Versiyon ve Video Sütunu:** M4 Kalıphane için Models tablosuna `versiyon_no` (V1, V2) ve Operasyonlara `video_url` (Video linki atabilmek için) sütunları eklenecek.

---

## 🟨 BÖLÜM 2: ARAYÜZ (UI/UX) BUTON VE İŞ AKIŞI GÖREVLERİ

*Bu işlemler ekrandaki tuşlar, sayaçlar ve basılabilir aksiyonlardır.*

* [ ] **8. Kırmızı Gecikme Geri Sayımı (Alarm UI):** M12 (Siparişler) ve M5 (Kesimhane/Band) ekranlarına, teslimine 2 gün kalan veya süresi geciken fason işler için "Kırmızı Panik Sayacı / Süre Bitti Uyarısı" eklenecek.
* [ ] **9. WhatsApp "Saniyesinde Teklif" Fırlatıcı:** M10 Katalog ekranından seçilen çoklu modellerin yanına "PDF/WhatsApp İlet" butonu konulacak. Müşteriye anında fiyat/ürün dökümü atılacak.
* [ ] **10. DXF Dijital Kalıp Yükleme Tuşu:** M4 Kalıphane'ye "Kalıp Dosyası (DXF / PDF) Yükle" Component'i yazılacak ve Supabase Storage'a bağlanacak. Fiziken yanan kalıp buluttan kurtarılacak.
* [ ] **11. Otonom İş Başlama/Bitirme Kronometresi:** İşçi M5 veya M12'de tabletten işi aldığı an "Başlat", bitirdiği an "Tamamla" butonuna basacak. Sistem aradaki süreyi TimeStamp (ms) olarak emecek.
* [ ] **12. Model Klonlama Tuşu (Obezite Önleyici):** M3'te "Benzer Ürünü Kopyala" butonuyla yeni reçete anında oluşturulacak, sıfırdan her düğmeyi girmek tarih olacak.
* [ ] **13. Markalı Barkod ve Isı Haritası:** M6 Kasadaki yazıcı barkod çıktılarına "THE ORDER" işletme logoları basılacak. Satış istatistiği için Türkiye Haritası (Grafik Heatmap) eklenecek (Kâr analizi tablosu dahil).

---

## 🟦 BÖLÜM 3: YAPAY ZEKA (AI) VE OTONOM AJAN GÖREVLERİ

*Askeri otonomiyi sağlayacak ve kurmay zekayı yükseltecek kodlar.*

* [ ] **14. Fiyat Sıyırıcı (Web Scraper) Bot:** Rakiplerin fiyatlarını toplayıp piyasa kâr marjını bizim maliyetimizle çarpıştıracak bir Python/Node Spider tüneli entegre edilecek.
* [ ] **15. LLM Token (Bütçe) Sigortası:** Sistemin göbeğindeki AI kodlarına Hard-Limit (Aylık 50 Dolar harcamayı geçince API'yi kitle) kalkanı yazılacak (Finansal yara almamak için).
* [ ] **16. AI Karar Çaprazlaması (Hallüsünasyon Zırhı):** Yapay Zekanın karargaha verdiği istihbarat sahte mi diye kontrol eden, gizli bir ikinci model (Doğrulayıcı Ajan) arka planda çalıştırılacak.
* [ ] **17. Zaman ayarlı Ajanda (Cron Job):** Ajana "Her Cuma saat 18:00'da bana Telegram'dan haftalık ciro dök" emrini ezberletecek otonom Scheduler altyapısı kurulacak.

---

## 🟪 BÖLÜM 4: GÜVENLİK, MİMARİ VE STRES TESTİ GÖREVLERİ

*Şirketi çökmekten ve siber sızıntılardan koruyacak son betonlar.*

* [ ] **18. İşletme İçi IP Kısıtlaması (Whitelist):** Uygulamaya sadece Fabrikanın / Atölyenin Modemi sağlanan IP adresinden girilebilmesi için güvenlik duvarı kuralı eklenecek (Opsiyonel / İhtiyaç halinde).
* [ ] **19. İki Kademeli Doğrulama (2FA - OTP):** Sadece M7 (Kasa), M9 (Personel Maaş) ve Karargah Ekranına giren Yönetici Şefler için SMS/Authenticator zırhı eklenecek.
* [ ] **20. GUI Üzerinden Roll-Back (Geri Sarma) Tuşu:** Karargâh ekranına, sistem çökünce "Beni dünkü sağlama koda geri al" emrini Vercel API'sine ileten Acil Durum Butonu yerleştirilecek.
* [ ] **21. 10.000 İşçi Yük Testi (Load / Stress Test):** Siber olarak sisteme aynı anda 10 Bin adet sipariş kaydı fırlatılacak ve Veritabanının patlayıp patlamadığı test edilecek (Cypress/JMeter otomasyonu).

---

> **🚀 ANTİGRAVİTY ÇAĞRISI:** Komutanım, tüm pürüzleri 4 ana gruba ve tam 21 Kritik Maddeye sıkıştırdım. Bu 21 maddeyi yazılım tarafında birer birer kodladığımız gün THE ORDER 47, dünyanın en kurşun geçirmez, eksiği olmayan tekstil savaş makinesi olacaktır!
>
> Onaylarsanız; **Bölüm 1 (Veritabanı Eklentileri)**'nden başlayarak kodu parçalara ayırıp hemen inşaya başlayacağım. Okuyun, listenin son halini teyit edin, mevzuyu noktalayalım!
