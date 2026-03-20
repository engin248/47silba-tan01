# 05 - M3 KUMAŞ ARŞİVİ VE DAYANIKLILIK DURUM RAPORU

## 1. Modül Görevi
Satın alınan kumaş toplarının, özelliklerinin (Elastan, Pamuk oranı, Çekme payı), tedarikçisinin ve depo raflarındaki (QR Barkod) yerlerinin işlendiği "Ham Madde" laboratuvarıdır.

## 2. Sayfada Bulunan Mevcut Özellikler ve Bilgi Akışı
- **Mevcutlar:** Kumaş listesi, en-gramaj eklentileri, stok bittiğinde listeleyen bir ekran.
- **Yeterlilik:** Bir kumaşçının defteri kadar kâfi. Lâkin, akıllı bir ERP donanımından çok uzak.

## 3. Üst Seviye Operasyon İçin Eksikler (Sağlanması Gereken Akışlar)
- **Akıllı Çekme (Shrinkage) Uyarıları:** Bir kumaş kesilmeden evvel, "Dikkat! Bu kumaş %5 çekiyor, Kalıbı ona göre tasarladın mı (M2'ye bağla)?" uyarısı.
- **Dinamik Tedarikçi Botu:** Kumaş bittiğinde "Stokta Yok" yazmak yerine, sayfadaki Ajan'ın doğrudan Kumaşçının (Örn: X Tekstil Pazarlama) WhatsApp numarasına veya API'sine "Bize aynı partiden 30 top daha lazım, fiyat nedir?" diyebilecek yarı otonom (Onay bekleyen) iletişimi kurulmalıdır.

## 4. İşlem Geçmişi (Kim Ne Yaptı?)
- **Test ve Zırhlama:** Bot testlerinden geçirilmemiş ve Ajan'ları aktif edilmemiştir. Sadece M1 Ar-Ge aşamasındaki temel kod bloklarına sahiptir. M2 ile birlikte test işlemine sokulmayı beklemektedir.
