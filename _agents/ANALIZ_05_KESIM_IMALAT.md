# KESİM (M5) & İMALAT BANDI (M6) DERİN ANALİZİ
> Tarih: 18 Mart 2026 | Odak: İşçilik, Verimlilik, Kamera Kontrolü ve Maliyet (Personel Yükü %90)

---

## 1. ANA AMAÇ VE TEHLİKE (BÜYÜK RESİM)

**İşletmenin Gerçekliği:** Kullanıcının ifadesiyle, "Personel yükü ve işletme giderinin %90'ı buradan kaynaklanıyor." 
**Sistemin Amacı:** Bu iki modül (M5 ve M6) sadece veri girilen yerler değil, saniyelerin, milimetrelerin ve nefes alışların bile maliyete dönüştüğü **"Kaçak Önleme ve Verim Sıkma"** merkezidir. M4'ten (Modelhane) kusursuz çıkan numune, burada endüstriyel sayılara (adetlere) vurulduğunda hata payı sıfır olmalıdır. Aksi takdirde, işletme sadece personeline çalışır.

---

## 2. BEŞ AÇIDAN DERİN ANALİZ (M5 KESİM)

### A) OPERASYON (İşin Akışı)
- **Olması Gereken:** M4'ten onaylı kalıp ve M3'ten otomatize edilmiş metraj/serileme verisi gelir. Kesimcideki ekran: "KRV-CEKET-09 modeli, 38-44 beden serisi, toplam 400 adet. Gerekli Kumaş: 1200 Metre Bordo Kadife."
- **Eksik/Tehlike:** Kesimciler genellikle tahmini veya göz kararı fire payı bırakır, pastal planını optimize etmez veya yorgunluktan yanlış seriye girer.
- **Eklenecek Şart:** **Dijital Pastal ve Barkodlama:** Kesim bittiğinde, çıkan her parça demeti (örn: 38 beden arka bedenler) barkodlanıp sisteme okutulmalıdır. Bu okutma yapılmadan bant (M6) o işi devralamaz.

### B) FİNANS (Sessiz Hırsız: Fire)
- **Olması Gereken:** M3'teki teorik metraj ile M5'teki gerçek harcanan metrajın kuruşu kuruşuna uyuşması.
- **Eksik/Tehlike:** 1200 metre gönderilen kumaştan %5 fire beklenirken %12 fire çıkar. Bu fark (70 metre kumaş x Kumaş Birim Fiyatı), o partinin tüm kârını çöpe atar. Şef bunu gizler veya "Kumaş eni dardı" der.
- **Eklenecek Şart:** **Fire Tolerans Kilidi:** Gerçekleşen fire, sistemin belirlediği tolerans yüzdesini aştığında, M5 kapatılamaz! Karargaha "Geçersiz Fire Oranı - Onay Bekliyor" alarmı düşer.

### C) VERİ & AI (Kamera Kontrolü - Görsel Zeka)
- **Olması Gereken:** M4'te AI kamera sistemi veya ağırlık sensörleri ile çıkan atığın (firenin) doğrulanması.
- **Eklenecek Şart:** M4 Kamera modülü (Yargıç PDI) kesim masasındaki yığınları veya çuvalı görerek (tahmini) "Bu masada çok fazla parça artığı var, pastal planı AI tarafından %8 daha verimli çizilebilirdi" raporu verir.

### D) RİSK
- **Tehlike:** Yanlış kumaşın kesilmesi veya onaylanmamış numunenin kesime girmesi.
- **Zırh:** M2 (Kumaş) ve M4 (Modelhane) barkodları eşleşmeden M5 sistemi "Başla" komutu vermez.

---

## 3. BEŞ AÇIDAN DERİN ANALİZ (M6 İMALAT / BANT)

### A) OPERASYON (Zaman ve Bant Akışı)
- **Olması Gereken:** Kimin, hangi makinede, saat kaçta, hangi operasyonu, kaç dakikada yaptığı anlık olarak görülmeli.
- **Eksik/Tehlike:** "Ahmet çok yavaş dikiyor, Ayşe ise bekliyor." Bantta yığılma (darboğaz) olur. Ayşe boş beklerken saatlik ücreti işletmeye yazar.
- **Eklenecek Şart:** **Operatör Bazlı QR/RFID Okuma:** Her dikişçi, önüne gelen iş sepetindeki karekodu tabletinden/telefonundan okutur ("İşe Başladım"). Bitince tekrar okutur. Sistem "Ahmet, 1 kol takma işlemini 45 saniyede yaptı" verisini Karargaha canlı çeker.

### B) FİNANS & PRİM (Maliyet ve Ödül)
- **Olması Gereken:** İşletme giderinin %90'ı personel olduğundan, her bir kıyafetin "Gerçek İşçilik Maliyeti" hesaplanmalı.
- **Eksik/Tehlike:** Sabit maaşlı atölyede yavaş çalışan da hızlı çalışan da aynı parayı alır, bu verimi öldürür.
- **Eklenecek Şart:** **Canlı Prim ve Performans Tahtası:** Her çalışanın diktiği parça sayısı ve hatasızlık (kalite kontrol) oranı hesaplanır. "Ayşe bugün hedefi %20 aştı, Parça Başı Primi: +150 ₺". Bu veri gün sonu M14 (Personel) ve M8 (Muhasebe) modüllerine otomatik akar.

### C) VERİ & AI (Kamera ve Sayım Zekası - EN KRİTİK)
- **Olması Gereken:** Kameraların güvenlik izleme cihazından çıkıp "Veri Toplayan Gözlere" dönüşmesi.
- **Eklenecek Şart:** **M4 Kamera Kesintisiz Sayım ve Hareket Analizi (Vision AI):**
  1. Bant sonunda biten her ürün paketlenirken veya askıya asılırken kamera bunu sayar. Manuel "100 diktik" beyanını değil, "Kamera 98 adet geçtiğini tespit etti" verisini baz alırız. (Hırsızlık ve kayıp sıfırlanır).
  2. Kamera banttaki yığılmayı (boşta bekleyen makineleri) algılar. Karargaha alarm salar: *"Overlokçunun önünde iş yığıldı, Düz makineci 10 dakikadır boşta. Bandı dengele!"*

### D) RİSK (Gizli Kalite Kayıpları)
- **Tehlike:** Adet çıksın diye hatalı dikim yapılması, "Nasıl olsa ütü pakedi geçer" mantığı.
- **Zırh:** Bant sonundaki son kalite kontrol işlemi, yine işi yapan barkoda bağlıdır. Geri dönen (hatalı dikiş) ürünün maliyeti, o işlemi yapan operatörün prim skorundan sistem tarafından otomatik düşülür (Hesap sorma AI'a bırakılır).

### E) OTOMASYON
- Banttaki iş emri M5'ten (Kesimden) çıktığı an M6'ya (İmalata) "Hazırlan" komutu gider. İş bitince M11 (Stok) otomatik artar.

---

## 4. NET HÜKÜM VE SİSTEM MİMARİSİ SONUCU

Eğer M5 (Kesim) ve M6 (İmalat Bandı) sadece düz formlarla doldurulan ekranlar olursa;
- Kötü niyetli çalışan sistemi kandırır.
- Boş bekleyen personelin maaşını siz ödersiniz.

**Doğru Zırhlı Sistem (Sil Baştan Modeli):**
- Kesimci fireyi AI tolernasına uydurmak zorundadır (Ceplerinden çalınamaz).
- Dikişçi, kameranın adeti saydığını ve her barkod okumasının kendi primine / maaşına saniye saniye işlediğini bilir.
- **Sonuç:** Patron (siz) banttaki kimseye "Hızlan" demek zorunda kalmazsınız. Sistem (Prim, Kamera Sayacı ve AI Darboğaz Uyarısı) atölyeyi kendi kendine koşturur. İşletmenin o ağır %90'lık hantal yükü, şeffaf, ölçülebilir çalışan bir makineye dönüşür. Tembellik eden elenir, üreten kazanır. Sizin de Karargahınızda "Gerçek Ciro/Gerçek Kar" hesabı şaşmaz.
