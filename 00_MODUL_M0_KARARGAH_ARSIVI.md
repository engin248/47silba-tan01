# 00 - M0 KARARGÂH (COMMAND CENTER) ARŞİV VE DURUM RAPORU

## 1. Modül Görevi
Tüm işletmenin kuşbakışı tek ekrandan (Single Pane of Glass) izlenmesi. Giren paranın, çıkan malların, izinli personelin, AI uyarılarının ve sahadaki (Kamera) krizlerin anında raporlandığı NİZAM sisteminin beynidir.

## 2. Sayfada Bulunan Mevcut Özellikler ve Bilgi Akışı
- **Mevcutlar:** Finansal özet kartları, bekleyen siparişler, vardiya uyarıları ve "Sıfırıncı Modül" ajan logları var.
- **Yeterlilik:** Asgari seviyede işletmeyi yönetmeye yeterli. Ancak "Çok Üst Seviye" operasyonel farkındalık için anlık akış tıkalıdır. Sayfa, veri geldikçe kendi kendini canlı yenilemekte (Realtime Websocket) hantaldır.

## 3. Üst Seviye Operasyon İçin Eksikler (Sağlanması Gereken Akışlar)
- **Modelhane/Kumaş Alarm Linkleri:** Karargah sayfasında dururken "X Kumaş Bitti" uyarısına tıklandığında doğrudan M3 Kumaş modülünün o ID'sine yönlendirme (Deep-link) akışı kurulmalıdır.
- **Acil Durum Hiyerarşisi:** Kriz logları (Örneğin kamera kapandı ajan uyarısı) ile sıradan loglar (Örneğin personel eklendi) Karargah'ta aynı fontta/yapıda durmamalı. Acil krizler için yanıp sönen veya kırmızı şeritli (Highlight) bildirim akışı lazımdır.
- **Canlı Radar Animasyonu:** Yapay zeka ajanının devrede olduğunu gösteren ufak, sürekli dönen veya nabız atan bir UI animasyonu sağ üstte konumlandırılmalı ki Kurucu operasyonun sahipsiz olmadığını bilsin.

## 4. İşlem Geçmişi (Kim Ne Yaptı?)
- **Engin (Kurucu):** Karargah'ın "Akıllı Melez" (Hybrid) felsefesini çizdi, tasarım düğmesi/karargah tasarım yetkesi için direktifleri verdi.
- **Antigravity (Ajan):** Kameralarla Karargâh iletişimini kurdu, Ajan (Cron) scriptini Karargâh backend'ine oturttu. UI üzerinde ufak düzenlemeler yaptı. (Faz-1 Karargah entegrasyonu bitirildi).
