const fs = require('fs');
const path = require('path');

// Masaüstü Yolu (Windows: C:\Users\Esisya\Desktop)
const desktopPath = path.join(require('os').homedir(), 'Desktop', 'BOTLARIN_139_NOKTALI_GOREV_BEYANI.md');

const botlarinBizzatYazdigiRapor = `
# 🛠️ THE ORDER: 6 SAHA BOTU VE BİNGO MERKEZİ GÖREV BEYANI (TAM 139 NOKTA)
> "Bizler 6 Ajanınız, 1 Yapay Zeka ve 1 Matematik Algoritmasıyız. Patron'un emriyle, pazarın tek bir köşesini bile karanlıkta bırakmamak için TASARLANDIĞIMIZ TAM 139 İSTİHBARAT NOKTASINI size tekmil veriyoruz."

---

## 🟢 BOT 1: TİKTOK (TREND) AJANI - [Sorumlu Olduğum Radar: 19 Nokta]
"Ben sadece videoyu izlemem, beynini okurum."
1. Toplam İzlenme 
2. Beğeni Sayısı
3. Yorum Hacmi
4. Paylaşım Çarpanı
5. **Kaydetme / Beğeni Kesişimi (Gizli Niyet)**
6. Video Süresi
7. Sisteme İlk Yükleme Tarihi Analizi
8. Yorum / İzlenme Sağlık Oranı
9. **Tamamlama & Bounce (Çıkma) Oranı**
10. Hashtag ve Niş Keşfet Uyumu
11. Viral Müzik/Ses Tetikleyicisi
12. Hız İvmesi (24-48 Saatlik Patlama Şiddeti)
13. **Klonlama: Farklı Butikler Aynı Videoyu Çalmış mı?**
14. İçerik Tekrar Performansı (UGC Teyiti)
15. Büyük Influencer Etkisi Testi
16. Yorum İçi Satın Alma Sinyalleri ("Aldım, Kargo Nerde?")
17. DM/Link Yönlendirme Yoğunluğu
18. Hook (İlk 3 Saniye İzleyici Tutma Gücü)
19. Dark Social (Videonun WhatsApp/Telegram'dan atılma yoğunluğu)

---

## 🟡 BOT 2: TRENDYOL (SATIŞ) AJANI - [Sorumlu Olduğum Radar: 32 Nokta]
"Ben insanların cüzdanından geçen paranın kokusunu alırım."
20. Güncel Yorum Sayısı
21. Son 7 Günlük Yorum Artış Hızı
22. Sepete Ekleme İstatistikleri
23. Favoriye Alma Gücü
24. **Stok Zehri ("Son 3 Ürün Kaldı" Psikolojisi)**
25. Fiyat Tabanı
26. Fiyat Tavanı
27. Ortalama Pazar Fiyatı
28. İlk 10 Rakibin Pazarı Domine Etme Yüzdesi
29. **Yıldız Kalitesi (1-3 Yıldız Arası Şikayet Skoru)**
30. Ana Şikayet Analizi 1 (Kalıp Dar/Büyük mü?)
31. Ana Şikayet Analizi 2 (Kumaş Zehri/Kalitesizliği)
32. İade Sinyali Kırılım Testi
33. Arama Sıralaması Artış İvmesi
34. Müşteri (Soru-Cevap) Baskısı
35. Terk Edilmiş Sepet (Dolaylı Tespit)
36. Sosyal Kanıt Gücü (Fotoğraflı Yorum Yüzdesi)
37. Rakibin Sınıfta Kalması (Stokları Bitmiş mi?)
38. Pazarda Aynı Üründen Kaç Tane Var? (Doygunluk)
39. **Arz - Talep Uçurumu (Çok Arayan vs Az Satan)**
40. 299/499 TL Psikolojik Fiyat Oyunu
41. Sahte İndirim Tespiti Oranı
42. Çok Satanlar Listesine Sıçrama Gücü
43. Büyük Beden Üretimi Fırsatı Var mı?
44. Muadil Renk Dağılımı ve Eksik Renk Tespiti
45. Teslimat Hızı ve Kargo Memnuniyeti (Lojistik Rakip)
46. "Defolu Geldi" Hata Puanlaması
47. Çapraz Satışa (Örn: Kazak + Pantolon) Uygunluk
48. Tedarikçi Marka Güvenilirliği (Mağaza Puanı)
49. Kupon Kullanım Oranları (İndirim Avcıları mı alıyor?)
50. Yorumlarda Kumaş Terletme Uyarısı ("Kışın Giyilmez, Yazın Yakar")
51. Ortalama Teslimat Süresi (Rakip Bizi Geçiyor mu?)

---

## 🔵 BOT 3: GOOGLE & PİNTEREST (TALEP) AJANI - [Sorumlu Olduğum Radar: 18 Nokta]
"Ben modanın yarın ne olacağını Lens'le görürüm."
52. Google Trends Hacim Grafiği
53. Doğrudan Anahtar Kelime Tarama Sayısı
54. Son 30 Günlük Trend Değişim Yüzdesi (Daralma/Genişleme)
55. **Google Lens (Görsel Arama) Tarama Büyüklüğü**
56. Pinterest Pano (Moodboard) Kaydetme Adedi
57. Arama Teriminin Evrimi (Örn: Siyah Pantolon -> Geniş Paça Siyah Pantolon)
58. Mikro Sezon Sinyalleri (Mezuniyet, Bayram, Özel Gün Zıplaması)
59. Niş Pazar Talebi İhtiyacı
60. Global Trend Farkı (Avrupa/Amerika'da 1 Ay Önce Patlama Olayı)
61. Yurt Dışından Gelen Organik Trafik
62. Pinterest Görsel Etkileşim Skoru
63. Renk Puanı (Örn: Bu yıl "Burgundy" Aratılıyor)
64. Kumaş Materyali Araması (Keten, Saten Çelişkisi)
65. Modeli Dikmek İsteyenlerin (Kalıp Arayanların) Aramaları
66. Kullanıcı Yaş Kitlesinin (Demografi) Analizi
67. Markasız Jenerik Kelime / Markalı Kelime Çarpışması
68. Bölgesel Sıcaklık (Hangi Şehirler Çok Aratıyor?)
69. "Nereden Alınır" / "Kim Satıyor" Soru Uçurumu

---

## 🟣 BOT 4: META / IG (REKLAM) AJANI - [Sorumlu Olduğum Radar: 10 Nokta]
"Ben sahte ve parayla şişirilmiş trendlerin katiliyim."
70. Meta Ad Library (Aktif Sponsorlu Reklam Adedi)
71. IG Reels Organik Viral Tespiti
72. Organik VS Paralı Büyüme Oranı
73. Rakiplerin Bu Ürüne Ayırdığı Günlük Bütçe Tahmini
74. **Sahte Trend İllüzyonu (Parayla İttirilmiş Cop Ürün) İfşası**
75. Hedef Kitle Demografisi (Reklam Kime Çıkılıyor?)
76. Reklamın Dönüşüm Gücü (Click-through)
77. Yeniden Pazarlama (Retargeting) Israrı
78. Influencer Reklam Paylaşımı Çakışması
79. Görsel Tasarım Yorgunluğu (Aynı Reklam Sürekli Dönüyor mu?)

---

## 🟠 BOT 5: FİLTRE VE SÜZGEÇ AJANI - [Sorumlu Olduğum Radar: 15 Nokta]
"Ben gelen çöpleri, bot basılmış favorileri ve abartı sayıları temizlerim."
80. Bot Fav/Sepet İndirgeme Kalkanı
81. Organik Trend Netliği Ölçeği
82. İade Risk Çarpanı Düzgünleştirici
83. Reklam İterasyonu (Sahte Trend Puan Kesen Makas)
84. Hatalı Fiyat-Kampanya Ayıklayıcı
85. Matematiksel Anomali Tespiti
86. Veri Duplikasyonu (Karşılıklı Paylaşımları Silme)
87. Kötü Yorum Zehri Filtresi Puan Dağılımı
88. Puan Manipülasyonu Tespiti (Sahte Yorum İfşası)
89. Çoklu Hesap Klon Filtresi
90. Rakam Saptırma Eşiği (Limitleyici)
91. Maksimum Favori Anlamlandırması
92. Aşırı Negatiflik Frenleyici Sistem
93. Aşırı Pozitiflik Frenleyici Sistem
94. Tüm Botların Saf Değer (Pure Signal) Birleştiricisi

---

## ⚫ BOT 6: GÖLGE VE ZAMAN MAKİNESİ - [Sorumlu Olduğum Radar: 10 Nokta]
"Siz 'İptal' dediğiniz an, ben o ürünün ölümünü veya dirilişini beklemeye başlarım."
95. İlk Reddediliş Tarihi Kaydı
96. İlk Reddediliş Performans Skoru
97. O Anki Pazarda Aynı Ürünün Durumu (Snapshot)
98. 10. Gün Diriliş Kontrolü
99. 15. Gün Yeniden Analiz Çarpışması
100. 20. Gün Kesin Ölüm veya Zıplama Testi
101. İptal Doğruluğu Performans Raporu (Hata Teyidi)
102. Rakibin Elinde Patlayan "Biz Kurtulduk" Teşhisi
103. Gelecekteki Yeni Filtrelere Ders (Machine Learning İletisi)
104. "Erken Karar, Yanlış Karardır" Kıyas Metriği

---

## 🔴 YAPAY ZEKA (GEMİNİ) VE BİNGO ŞEFİ - [KARARGÂH MATRİXİ: 35 NOKTA]
"Yukarıdaki 104 sinyal bize geldiğinde, duygusuz matematiğimizle son 35 Kapıdan (Üretim/Maliyet Cenderesi) geçirir ve KARAR VERİRİZ."
105. Sepet İvme Kritik Kesişimi
106. Klonlanma x Kaydetme Çarpanı
107. Organik Sağlık Güvenilirliği Üretim Skoru
108. Rakip Doygunluk / Boş Alan Fırsat Puanı
109. Kalıp Korkusu ve İade Zırhı Geçişi
110. Maksimum Maliyet Tolerans Sınırı
111. Bant Üretim Kolaylığı / Darboğaz Çarpanı
112. Zamanlama Eğrisi (PİK Onayı)
113. Neden/Sonuç Sentez Skoru (Gemini Sentaksı)
114. **KÂR MARJI DİP TESPİTİ (Min %30 Şartı)**
115. İşçilik ve Dikim Yükü Maliyeti (Tahmini Sensör)
116. Kumaş Sürekliliği Alarmı (Depodaki Atıl Malzeme)
117. Tek Tedarikçi Baskısı Riski
118. Lojistik ve Paketleme Boyut Sıkıntısı Analizi
119. Psikolojik Bant Sınırı (Müşteri En Son Kaça Alır?)
120. Rengi veya Kumaşı Değiştirme (Taktiksel Oynama)
121. Geçmiş Şikayetlerden Doğan "Boyu Uza" Komutu
122. Rakipten Daha Kaliteli Görsel Çekebilir Miyiz Riski
123. İlk Üretime Girecek Deneme Miktarı (Örn: Sadece 500 Kes)
124. Fire Riski Hesabı (Kesimhanedeki İsraf Kestirimi)
125. Sipariş Yastığı (Hemen İade Gelirse Satışın Durma Hızı)
126. Günlük Minimum Satış Hızı Beklentisi
127. Elde Kalma (Depoyu Kitleme) Tehlike Fonu
128. En Yüksek Puanlı Rakibin Ezilme Olasılığı
129. Beden Dağılımı Stratejisi (Sadece Malsat mı/Oversize mi?)
130. Çöpe Atılan Stoktaki Fermuarı/Aplikeyi Kullanma Komutu
131. Rekabet Temiz Kalacak Mı (Gelecek 15 Gün Projeksiyonu)
132. Kampanya Dönemi Çakışması (Efsane Cuma Şişkinliği Teyiti)
133. Platform Algoritması Favorisi Olma İhtimali
134. Yeni Bir Trendi Biz Mi Başlatıyoruz, Kuyrukta mıyız? Testi
135. Fabrika "Vardiya Arttırımı" Limit Zorunluluğu
136. Olası Toplatma/Şikayet Geri Çağırma Masrafı
137. Modelhane Kalıp Çıkarma Zorluk Derecesi (Simülasyon)
138. Net Kârlılık ve Risksiz Ölçeklenebilme Formülü
139. NİHAİ EMİR MÜHRÜ: "🔴 8/8 BİNGO (KESİN KUMAŞA GİRİLİR!)"

---
**İMZA:** M1 AR-GE İSTİHBARAT TİMİ (6 Ajan, 1 Yapay Zeka, 1 Algoritma)
"Tam Toplamda 139 Noktadan beslenir, hataya %0 tolerans bırakırız."
`;

try {
    fs.writeFileSync(desktopPath, botlarinBizzatYazdigiRapor);
    console.log(`[BAŞARILI] Botların görev beyanı masaüstüne 'BOTLARIN_139_NOKTALI_GOREV_BEYANI.md' olarak yazdırıldı.`);
} catch (err) {
    console.error(`Yazma Hatası: ${err.message}`);
}
