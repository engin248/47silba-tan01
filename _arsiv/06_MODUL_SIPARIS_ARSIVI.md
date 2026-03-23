# 06 - M5 SİPARİŞLER VE CRM (MÜŞTERİLER) ARŞİV VE DURUM RAPORU

## 1. Modül Görevi
Müşteri (B2B, Toptancı veya Trendyol vs.) tarafından verilen koli ve adet bazlı "Mal İsteme" taleplerinin (Siparişlerin), üretim emrine (İş Emri) çevrildiği bekleme salonudur. 

## 2. Sayfada Bulunan Mevcut Özellikler ve Bilgi Akışı
- **Mevcutlar:** Siparişi Alan, Giren-Çıkan liste dökümü, Müşteri cari kartları.
- **Yeterlilik:** Maliyet ve üretim takibinden habersiz, düz bir Excel yapısı var.

## 3. Üst Seviye Operasyon İçin Eksikler (Sağlanması Gereken Akışlar)
- **Akıllı Teslimat Geri Sayımı:** Müşteri 5.000 adet malı 15 güne istedi. Sayfa, M4 Üretim Modülündeki günlük çıkan ürünleri çekip (Örn: Günde 200 Tişört) "Dikkat! Üretim hızımız böyle giderse bu sipariş 10 gün GEÇ TESLİM edilecek!" şeklinde üst düzey bir bilgi akışı yaratıp Panik Butonunu tetiklemelidir.
- **Karlılık Simülatörü:** Modelin maliyeti (M2) ile Kumaş parası (M3) ve İşçi hakedişini (Personel) toplayıp, "Bu siparişe 300 TL fiyat çektiniz ama 310 TL'ye mal oluyor! ZARAR" diyen canlı, çapraz bir ekran göstergesi (Widget) eksiktir.

## 4. İşlem Geçmişi (Kim Ne Yaptı?)
- **Veritabanı Uyarısı:** Test Botları ilk gün çalıştırıldığında (ZIRH Test Botu) en çok sütun eksiğini ve şema problemini Siparişler tablolarında verdi. (Onarılmak ve zırhlanmak için sırasını bekliyor).
