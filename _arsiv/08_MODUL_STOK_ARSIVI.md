# 08 - M7 STOK ARŞİV VE DURUM RAPORU

## 1. Modül Görevi
Makine parçaları, iğneler, iplikler, karton etiketler gibi üretimin can damarı olan ama "Kumaş/Ürün" sayılmayan sarf malzemelerin depolarını denetlemek.

## 2. Sayfada Bulunan Mevcut Özellikler ve Bilgi Akışı
- **Mevcutlar:** Tüketilen malzemelerin sayısal girdisi-çıktısı.

## 3. Üst Seviye Operasyon İçin Eksikler (Sağlanması Gereken Akışlar)
- **Akıllı Geri Çağırma (Just in Time):** Bir model için 5.000 düğme gerekiyorsa (M2'den) ve Stok ekranında sadece 2.000 düğme varsa, "Dükkanda yeterli malzeme yok, üretimi durdurun!" diye sipariş modülüne şerh düşüp onaycıyı dondurması eksiktir. Personel malzemeyi sormadan sistemi kilitlemesi (Preventive Error/Koruyucu Hata Zırhı) gerekir.
- **Dükkanlar / Depo Rafları Haritası:** "Hangi iğne/iplik hangi atölyede (Örn: Modelhane deposu mu, Kesimhanemi)?" diye haritalayacak bir akışa muhtaçtır.

## 4. İşlem Geçmişi (Kim Ne Yaptı?)
- Yüzeysel dosya mimarisi durmakta. Modül aktif veya Ajan denetiminde değildir. Siparişler (M5) modülünün ayağa kalkmasını izlemektedir.
