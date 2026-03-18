# MALIYET (M7), MUHASEBE (M8) & KASA (M12) DERİN ANALİZİ
> Tarih: 18 Mart 2026 | Odak: Kâr Garantisi, Otomatik Finans ve Nakit Akışı Güvenliği

---

## 1. ANA TEHLİKE (BÜYÜK RESİM)
İşletmeler satış yapamadıkları için değil, kâr edemedikleri veya parayı tahsil edemedikleri için batarlar. M7 (Maliyet) eksikse "Zararına satış", M8 (Muhasebe) ve M12 (Kasa) eksikse "Açık hesapta para batırma" riski %100'dür.

---

## 2. M7: MALİYET (KÂR ZIRHI)

### A) OPERASYON & VERİ (Otomatik Metraj ve Süre)
- **Tehlike:** Fiyat verilirken Excel'de elle hesap yapılması, fermuarın güncel zammının veya kesimdeki ekstra firenin unutulması.
- **Zırh (Otomatik Kırılım):** Maliyet hesabı manuel yapılmaz!
  - M2'den Kumaş/Aksesuar anlık alış fiyatı çekilir.
  - M5'ten Kesim firesi (+%5 maliyet) eklenir.
  - M6'dan Bandın banttaki dakika bazlı işçilik ücreti ve primleri toplanır.
  - Sistem "Total Çıplak Maliyet: X TL" kararı verir.

### B) RİSK & OTOMASYON (Marj Kilidi)
- **Tehlike:** Satışçının (veya toptancı müşterinin) fiyatı aşağı çekerek şirketi gizli zarara sokması.
- **Zırh:** M7 ekranında "Hedef Kâr Marjı %40" olarak kilitlenir. Eğer toptan sipariş fiyatı bu maliyetin/marjın altına düşerse, M10 (Sipariş) faturayı **kesmez, kilitlenir** ve Karargah'tan onay ister. (Patron onayı olmadan zararına 1 iplik bile çıkmaz).

---

## 3. M8: MUHASEBE & M12: KASA (NAKİT VE TAHSİLAT KONTROLÜ)

### A) OPERASYON (Finansal Doğrulama)
- **Tehlike:** Gelen siparişin veya giden paranın iki farklı yere girilmesi (Muhasebeye ayrı, sipariş paneline ayrı), verilerin uyuşmaması.
- **Zırh (Tek Merkezli Kayıt):** M10'da bir toptan sipariş "Hazırlanıyor"a geçtiğinde, M8 (Muhasebe) o müşteriye anında otomatik taslak fatura açar. Ürün depodan (M11) çıktığı an e-Fatura/İrsaliye kesilir, M12 (Kasa) cari hesabına "Açık Bakiye" olarak yazılır. Muhasebeci veri girmez, sadece AI'ın girdiği veriyi onaylar.

### B) RİSK & AI KOTROLÜ (Tahsilat ve Tedarikçi Sabıkası)
- **Tehlike:** Toptancı X müşterisinin 3 faturası ödenmemişken, 4. siparişin üretimine başlanması (Açık hesaba mal yığma).
- **Zırh:** M12 (Kasa) ve M13 (CRM) entegredir. AI, X müşterisinin geçmiş ödeme hızını (skorunu) bilir. Borç limiti aşılmışsa, M10 (Sipariş) paneli o müşteriye "Yeni sipariş alımını" kilitler. Üretim M5 (Kesim) ekranında başlamaz. Ekran der ki: *"Önce tahsilatı yap."*

### C) FİNANS (Nakit Akışı Karnesi)
- **Otomasyon:** Gece 23:59'da "Akşamcı Ajan", o gün M12'ye fiilen giren nakit ile M7/M8'den çıkan masrafı (kumaş ödemesi, primler) karşılaştırır ve Karargaha "Bugünkü Gerçek Net Kâr / Kasa Pozisyonu"nu yollar. 

**NET HÜKÜM:** Maliyet ve finans bölümü veri ambarı değil, şirket kasasının siber bekçisidir. Kâr hesabı yapay zekanın milimetrik hesabına devredilir, insan hissiyatına (%20 kârdayız herhalde mantığına) yer bırakılmaz.
