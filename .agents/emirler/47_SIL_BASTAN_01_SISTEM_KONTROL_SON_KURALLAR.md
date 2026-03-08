# 47 SİL BAŞTAN 01 — SİSTEM KONTROL SON KURALLARI

**Sürüm:** 5.0 Final | **Tarih:** 2026-03-07 | **Toplam Kriter:** 45
> Her sayfa · Her sekme · Her alt sekme · Her sorun · Her işlem kontrolünde uygulanır.
> Hiçbir madde atlanmaz · Kontrol bitmeden rapor verilmez · Tek belge · İki konumda saklanır.

---

## 🚨 KONTROL EDERKEN UYACAĞIMIZ KURALLAR

> Bu kurallar her kontrol seansında geçerlidir. İhlal edilemez.

### TEMEL KURALLAR

| # | Kural | Açıklama |
|---|-------|----------|
| K1 | **Hiçbir madde atlanmaz** | 41 kriter sırayla işlenir. Hızlı geçilemez. |
| K2 | **Her noktada kanıt alınır** | Screenshot veya kod kaydı zorunlu. |
| K3 | **Kör nokta = Anında 🔴 bayrak** | Tespit anında işaretlenir, not düşülür. |
| K4 | **Rapor tümü bitmeden verilmez** | Yarım rapor kabul edilmez. |
| K5 | **Geçerli değil (—) de açıklanır** | Neden geçersiz olduğu yazılır. |
| K6 | **Önce gözlemle, sonra puan** | Kod/ekran incelenmeden puan verilmez. |
| K7 | **Tek seferde tek sekme** | Sekmeler arası karıştırılmaz, sıra korunur. |
| K8 | **Her oturumda başlık doldurulur** | Sayfa/Sekme/Tarih zorunlu. |

### PUANLAMA KURALLARI

| # | Kural |
|---|-------|
| P1 | Puan kişisel görüşe değil **gözlemlenen gerçeğe** dayanır. |
| P2 | Şüpheli durumda **düşük puan** verilir, not düşülür. |
| P3 | 3 ve altı puan alan her madde **açıklama ister**. |
| P4 | Geçerli kriter sayısı değişirse **toplam yeniden hesaplanır**. |

### RAPORLAMA KURALLARI

| # | Kural |
|---|-------|
| R1 | Kırmızı bayrak bulunan her madde **öncelikli düzeltmeler** listesine girer. |
| R2 | Kör nokta = **0 puan** + açıklama + çözüm önerisi zorunlu. |
| R3 | Düzeltme yapılırsa **o madde yeniden kontrol** edilir. |
| R4 | Tüm kontrol tamamlandığında **genel puan ve özet** verilir. |

### DAVRANIŞ KURALLARI

| # | Kural |
|---|-------|
| D1 | **"Sanırım çalışıyor"** kabul edilmez — test edilmeden puan verilmez. |
| D2 | **Eski bilgi kullanılmaz** — her kontrol taze gözlemle yapılır. |
| D3 | Çelişki varsa **kod dosyası esas** alınır. |
| D4 | Kullanıcı aksini söylemedikçe **sıra değiştirilmez**. |

---

## 📊 PUANLAMA SİSTEMİ

| Sembol | Puan | Anlam |
|--------|:----:|-------|
| 🟢 **5** | Tam Doğru | Sorun yok, standart karşılandı |
| 🔵 **4** | Yeterli | Küçük eksik var, işlevsel |
| 🟡 **3** | Orta | İyileştirme önerisi, çalışıyor ama zayıf |
| 🟠 **2** | Zayıf | Kritik eksik var, performans düşük |
| 🔴 **1** | Kritik | Acil müdahale gerekiyor |
| ⬛ **0** | Kör Nokta | Hiç düşünülmemiş, yok |
| ➖ **—** | Geçersiz | Bu kriter bu sekme için geçerli değil (açıkla) |

> **Toplam = Geçerli kriterlerin ortalaması × 20 = /100**
> 🟢 90-100: Canlıya hazır | 🟡 75-89: Küçük düzeltme | 🟠 60-74: Geliştirme | 🔴 0-59: Yeniden yapılandır

---

## 📋 KONTROL BAŞLIĞI

```
═══════════════════════════════════════════════════
KONTROL EDİLEN  : [Sayfa] → [Sekme] → [Alt Sekme]
KONTROL TİPİ   : Sayfa / Sorun Giderme / Yeni Özellik
TARİH          : ___________
KONTROLÜ YAPAN : ___________
═══════════════════════════════════════════════════
```

---

## A. GEREKLİLİK
>
> *Bu sayfa/sekme/özellik gerçekten gerekli mi?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| A1 | Bu sekme **olmasa** işletme ne kaybeder? | ☐ | |
| A2 | Başka bir sekmeyle **birleştirilebilir** miydi? | ☐ | |
| A3 | Kullanıcı bunu **düzenli kullanacak mı?** | ☐ | |
| A4 | Bağımsız mı, birleşik mi **daha verimli?** | ☐ | |

**A Toplam:** ___/20

---

## B. EKSİK / FAZLA
>
> *Ne eksik, ne gereksiz?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| B1 | **Eksik** bilgi/işlev var mı? | ☐ | |
| B2 | **Gereksiz** bilgi/buton/alan var mı? | ☐ | |
| B3 | Eksikler işletmeyi **maddi/operasyonel** etkiliyor mu? | ☐ | |
| B4 | Fazlalıklar kullanıcıyı **dikkat dağıtıyor** mu? | ☐ | |

**B Toplam:** ___/20

---

## C. VERİMLİLİK
>
> *Kaç adımda, ne kadar zamanda tamamlanıyor?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| C1 | İş akışı **kaç adımda** tamamlanıyor? Kaça düşürülebilir? | ☐ | |
| C2 | Kullanıcı bu sayfada **ne kadar zaman** harcıyor? | ☐ | |
| C3 | **Otomatikleştirilebilecek** adımlar var mı? | ☐ | |
| C4 | Ne olsaydı **daha verimli** olurdu? | ☐ | |

**C Toplam:** ___/20

---

## D. İŞLETME FAYDASI
>
> *Somut, ölçülebilir katkısı var mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| D1 | **Ölçülebilir faydası** nedir? (TL / Dakika / Hata azaltma) | ☐ | |
| D2 | İşletmenin **hangi sorununu** çözüyor? | ☐ | |
| D3 | Bu **olmadan** işletme nasıl yürürdü? Risk nedir? | ☐ | |
| D4 | Fayda/maliyet dengesi **pozitif mi?** | ☐ | |

**D Toplam:** ___/20

---

## E. BİLGİ TÜRÜ VE KALİTESİ
>
> *Doğru bilgi doğru formatta mı sunuluyor?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| E1 | Bilgi türü nedir? *(Operasyonel / Analitik / Arşiv / Uyarı)* | ☐ | |
| E2 | Bilgi **ham mı, işlenmiş mi, karar destekleyici mi?** | ☐ | |
| E3 | **Doğru formatta** sunuluyor mu? (tablo/grafik/sayı/liste) | ☐ | |
| E4 | **Daha iyi sunulma yolu** var mı? | ☐ | |

**E Toplam:** ___/20

---

## F. VERİ SAĞLIĞI
>
> *Veri güvenilir, güncel ve tutarlı mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| F1 | Veri kaynağı **güvenilir mi?** (manuel/otomatik/hesaplanmış) | ☐ | |
| F2 | Veri **güncel mi?** (gerçek zamanlı / gecikmeli) | ☐ | |
| F3 | **Çelişen/tutarsız** bilgi var mı? | ☐ | |
| F4 | Supabase **alan tipleri doğru mu?** (text/numeric/bool/uuid) | ☐ | |

**F Toplam:** ___/20

---

## G. SAYFA / SEKME DÜZENİ
>
> *Görsel hiyerarşi ve kullanılabilirlik*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| G1 | En önemli bilgi **en öne çıkıyor mu?** | ☐ | |
| G2 | Sekme sıralaması **iş akışını yansıtıyor mu?** | ☐ | |
| G3 | Kullanıcı **nereye bakacağını** biliyor mu? | ☐ | |
| G4 | Mobil/tablet (375px) **uyumlu mu?** | ☐ | |

**G Toplam:** ___/20

---

## H. SORU MANTIĞI
>
> *Form akışı doğal ve mantıklı mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| H1 | Alanlar **doğal sırada mı?** Birini doldurmak diğerine yol açıyor mu? | ☐ | |
| H2 | Formlar **birbirini tamamlıyor mu?** | ☐ | |
| H3 | **Gereksiz alan** var mı? | ☐ | |
| H4 | **Eksik alan** var mı? | ☐ | |

**H Toplam:** ___/20

---

## I. SORU KALİTESİ
>
> *En doğru şekilde mi soruluyor?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| I1 | Alan isimleri **anlaşılır mı?** (TR/AR doğru mu?) | ☐ | |
| I2 | En yüksek işletme faydası için **nasıl sorulurdu?** | ☐ | |
| I3 | **Alternatif formülasyon** daha iyi sonuç verir mi? | ☐ | |
| I4 | Kullanıcı **yanlış anlayabilir mi?** | ☐ | |

**I Toplam:** ___/20

---

## J. TEKNOLOJİ DOĞRULUĞU
>
> *Doğru araç doğru iş için mi?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| J1 | **Next.js** bu modül için doğru framework mi? | ☐ | |
| J2 | **Client-side mi, Server-side mi?** Hangisi daha doğru? | ☐ | |
| J3 | Gereksiz **re-render** var mı? | ☐ | |
| J4 | State yönetimi doğru mu? **(useState / context / realtime)** | ☐ | |

**J Toplam:** ___/20

---

## K. API UYGUNLUĞU
>
> *API'ler doğru ve verimli kullanılıyor mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| K1 | **Doğru endpoint'ler** kullanılıyor mu? | ☐ | |
| K2 | **N+1 sorgu** problemi var mı? | ☐ | |
| K3 | **Hata yönetimi** var mı? (try/catch/fallback) | ☐ | |
| K4 | **Timeout ve fallback** mekanizması var mı? | ☐ | |

**K Toplam:** ___/20

---

## L. MİMARİ DOĞRULUK
>
> *Sistem tasarımı sağlıklı mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| L1 | **Modüler mimari** doğru kurulmuş mu? | ☐ | |
| L2 | Veri akışı **tek yönlü mü?** Döngüsel bağımlılık var mı? | ☐ | |
| L3 | **Component'lar yeniden kullanılabiliyor mu?** | ☐ | |
| L4 | Kod **karmaşıklığı gereksinimle orantılı mı?** | ☐ | |

**L Toplam:** ___/20

---

## M. FİYAT / MALİYET
>
> *Teknoloji maliyeti optimum mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| M1 | **Supabase ücretsiz tier** limitleri aşılıyor mu? | ☐ | |
| M2 | **Perplexity AI** maliyete değiyor mu? | ☐ | |
| M3 | **Telegram Bot** maliyet/fayda dengesi doğru mu? | ☐ | |
| M4 | Daha ucuz **alternatif** var mıydı? | ☐ | |

**M Toplam:** ___/20

---

## N. AGENT / OTOMASYON
>
> *Tekrarlayan işler otomatize edilmiş mi?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| N1 | **Tekrarlayan işlemler** agent'a devredilebilir mi? | ☐ | |
| N2 | Mevcut **agent dosyaları** işe yarıyor mu? | ☐ | |
| N3 | **Hangi işlemler** otomatikleştirilmeli? | ☐ | |
| N4 | Otomasyon yapılmadan **tam verimli mi?** | ☐ | |

**N Toplam:** ___/20

---

## O. SÜRDÜRÜLEBİLİRLİK
>
> *Uzun vadede ayakta kalır mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| O1 | **1–3 yıl sonra** bu teknoloji hâlâ geçerli mi? | ☐ | |
| O2 | Bakımı **kim yapabilir?** Bağımlılık riski var mı? | ☐ | |
| O3 | **5× büyüme** durumunda ayakta kalır mı? | ☐ | |
| O4 | **Vendor lock-in** riski var mı? (Supabase/Vercel/Next.js) | ☐ | |

**O Toplam:** ___/20

---

## P. ENTEGRASYON TUTARLILIĞI
>
> *Modüller arası veri köprüleri sağlıklı mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| P1 | Bu sayfa **diğer sayfalarla doğru veri paylaşıyor mu?** | ☐ | |
| P2 | Bir sayfada değişen veri **diğerini güncelliyor mu?** | ☐ | |
| P3 | **Veri silosu** var mı? (birbirinden kopuk veriler) | ☐ | |
| P4 | Entegrasyon kopukluğu **işletmeye zarar veriyor mu?** | ☐ | |

**P Toplam:** ___/20

---

## Q. HATA YÖNETİMİ
>
> *Kötü senaryolara hazır mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| Q1 | Yanlış veri girilirse **ne olur?** | ☐ | |
| Q2 | Supabase bağlantısı kesilirse **sayfa çöker mi?** | ☐ | |
| Q3 | **Boş state** anlayışlı gösteriliyor mu? | ☐ | |
| Q4 | Hata mesajları **kullanıcıya anlamlı mı?** (Türkçe, sade) | ☐ | |

**Q Toplam:** ___/20

---

## R. GÜVENLİK (TEMEL)
>
> *Yetkisiz erişime kapalı mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| R1 | **Hassas veri** korunuyor mu? | ☐ | |
| R2 | **Yetkisiz kullanıcı** bu veriye erişebilir mi? | ☐ | |
| R3 | **Form injection / XSS** açığı var mı? | ☐ | |
| R4 | **RLS politikaları** bu sayfayı kapsıyor mu? | ☐ | |

**R Toplam:** ___/20

---

## S. PERFORMANS
>
> *Hız ve ölçeklenebilirlik*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| S1 | Yüklenme süresi **kabul edilebilir mi?** (<1 saniye) | ☐ | |
| S2 | Büyük veri setlerinde **sayfalama** var mı? | ☐ | |
| S3 | **Gereksiz re-render** var mı? | ☐ | |
| S4 | Resim/dosya **optimize edilmiş mi?** | ☐ | |

**S Toplam:** ___/20

---

## T. KULLANICI DENEYİMİ (UX)
>
> *Rahat ve sezgisel kullanılabiliyor mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| T1 | **Yeni başlayan biri** anlayabilir mi? | ☐ | |
| T2 | En sık kullanılan işlev **en kolay erişilebilir mi?** | ☐ | |
| T3 | **Başarı/hata geri bildirimi** var mı? | ☐ | |
| T4 | **TR/AR** geçişi doğru çalışıyor mu? | ☐ | |

**T Toplam:** ___/20

---

## U. VERİ GİRİŞ DOĞRULUĞU
>
> *Veri kalitesini koruyor mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| U1 | **Zorunlu alanlar** işaretlenmiş mi? | ☐ | |
| U2 | **Format kontrolü** var mı? (tarih/sayı/telefon) | ☐ | |
| U3 | **Mükerrer (duplicate)** veri engelleniyor mu? | ☐ | |
| U4 | **Silme işlemi korunuyor mu?** (onay/geri alma) | ☐ | |

**U Toplam:** ___/20

---

## V. ERP BENCHMARK
>
> *SAP / Infor / BlueCherry / NetSuite / Dynamics ile karşılaştırma*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| V1 | Eşdeğer **dünya standardı modülü** ne yapıyor? | ☐ | |
| V2 | **Endüstri standardı** bu modülde ne bekler? | ☐ | |
| V3 | Rakiplere göre **üstünlüklerimiz** neler? | ☐ | |
| V4 | Rakiplere göre **zayıflıklarımız** neler? | ☐ | |

**V Toplam:** ___/20

---

## W. HARDCODED DEĞER / TABLO TUTARSIZLIĞI
>
> *Kodda gizli hatalar var mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| W1 | **Hardcoded sabit değer** var mı? (sayı/oran/metin) | ☐ | |
| W2 | **Tablo adı tutarlı mı?** (b1_/b2_ prefix uyumu) | ☐ | |
| W3 | DB'de **kolonu olan ama UI'da girişi olmayan** alan var mı? | ☐ | |
| W4 | UI'da **görünen ama fonksiyon bağlı olmayan** buton/ikon var mı? | ☐ | |

**W Toplam:** ___/20

---

## X. STRES / SINIR DURUMU
>
> *Uç senaryolar test edildi mi?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| X1 | **Boş form gönder** → Uyarı çıkıyor mu? | ☐ | |
| X2 | **Negatif/sıfır değer** → Kabul mi, ret mi? | ☐ | |
| X3 | **1000+ karakter** → Input limiti var mı? | ☐ | |
| X4 | **İnternet kesilse** → Anlaşılır hata mı? | ☐ | |

**X Toplam:** ___/20

---

## Y. KAPASİTE VE BÜYÜME UYGUNLUĞU
>
> *Şu anki ve gelecekteki boyuta uygun mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| Y1 | Mevcut **kullanıcı sayısı** için sistem yeterli mi? | ☐ | |
| Y2 | **2×–5× büyüme** durumunda dayanır mı? | ☐ | |
| Y3 | **Eş zamanlı kullanım** sorun yaratıyor mu? | ☐ | |
| Y4 | Veri hacmi arttığında **arama/listeleme** hızlı çalışır mı? | ☐ | |

**Y Toplam:** ___/20

---

## Z. YEDEKLEME VE FELAKET KURTARMA
>
> *Veri kaybolursa ne olur?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| Z1 | Bu sayfanın verisi **otomatik yedekleniyor mu?** | ☐ | |
| Z2 | Supabase **otomatik backup** aktif mi? | ☐ | |
| Z3 | Felaket durumunda **geri yükleme planı** var mı? | ☐ | |
| Z4 | Belirli bir **ana geri dönüş** mümkün mü? | ☐ | |

**Z Toplam:** ___/20

---

## AA. ROL BAZLI ERİŞİM
>
> *Kim neyi görebiliyor, neyi yapabiliyor?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| AA1 | **Rol bazlı kısıtlama** var mı? (Koordinatör/İşçi/Muhasebe) | ☐ | |
| AA2 | **Yetkisiz kullanıcı** hassas butonu/alanı görebiliyor mu? | ☐ | |
| AA3 | Silme/onay/finans sadece **yetkili rolle** mi yapılıyor? | ☐ | |
| AA4 | **Farklı kullanıcı tipleri** için arayüz ayrımı doğru mu? | ☐ | |

**AA Toplam:** ___/20

---

## BB. AUDİT LOG / İZ KAYDI
>
> *Kim ne yaptı, ne zaman?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| BB1 | **Kritik işlemler** (silme/onay/finans) loglanıyor mu? | ☐ | |
| BB2 | Log'da **kim/ne zaman/ne değişti** bilgisi var mı? | ☐ | |
| BB3 | Log kayıtları **değiştirilemez** mi? | ☐ | |
| BB4 | Audit log **erişilebilir ve okunabilir** mi? | ☐ | |

**BB Toplam:** ___/20

---

## CC. İŞ AKIŞI KÖPRÜLERİ
>
> *M1→M2→...→M16 zinciri kopmuyor mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| CC1 | Bu modülün **önceki adımı** doğru veriyi veriyor mu? | ☐ | |
| CC2 | Bu modülün **sonraki adımı** tetikleniyor mu? | ☐ | |
| CC3 | Zincirde **kopukluk / manuel müdahale** gereken adım var mı? | ☐ | |
| CC4 | İş akışı **görsel olarak takip** edilebiliyor mu? | ☐ | |

**CC Toplam:** ___/20

---

## DD. BİLDİRİM VE UYARI SİSTEMİ
>
> *Doğru kişiye, doğru zamanda bildirim gidiyor mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| DD1 | Kritik olayda **bildirim tetikleniyor mu?** | ☐ | |
| DD2 | **Telegram Bot** bu modül için aktif mi? | ☐ | |
| DD3 | **Denetmen/Uyarı** sayfasına bu modülden veri gidiyor mu? | ☐ | |
| DD4 | Bildirim **zamanlaması** doğru mu? (anlık/toplu/günlük) | ☐ | |

**DD Toplam:** ___/20

---

## EE. ERİŞİLEBİLİRLİK VE ÇOKLU ORTAM
>
> *Her cihazda, her koşulda çalışıyor mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| EE1 | **Yavaş internet**'te çalışıyor mu? | ☐ | |
| EE2 | **Farklı tarayıcılarda** uyumlu mu? (Chrome/Safari/Firefox) | ☐ | |
| EE3 | **PWA kurulum** desteği var mı? | ☐ | |
| EE4 | **Tablet** kullanımı fabrika ortamında uygun mu? | ☐ | |

**EE Toplam:** ___/20

---

## FF. ÖNBELLEK VE VERİ TAZELİĞİ
>
> *Eski veri gösterilmiyor mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| FF1 | Sayfa yenilenmeden **veri güncelleniyor mu?** | ☐ | |
| FF2 | **Önbellek stratejisi** doğru mu? | ☐ | |
| FF3 | Başka kullanıcının değişikliği **anlık yansıyor mu?** | ☐ | |
| FF4 | **Supabase Realtime** gerekli mi? Aktif mi? | ☐ | |

**FF Toplam:** ___/20

---

## GG. HESAPSAL TUTARLILIK
>
> *Sayfalar arası rakamlar birbirini doğruluyor mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| GG1 | **Kasa toplamı = Muhasebe toplamı** eşleşiyor mu? | ☐ | |
| GG2 | **Maliyet formülü** doğru ve tutarlı mı? | ☐ | |
| GG3 | **Prim hesabı** — sistem sonucu ile elle hesap aynı mı? | ☐ | |
| GG4 | **Floating point** hatası riski var mı? (ondalık sapma) | ☐ | |

**GG Toplam:** ___/20

---

## HH. KULLANICI ONBOARDING
>
> *Yeni biri sıfırdan bu modülü anlayabilir mi?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| HH1 | Sayfa içi **tooltip/yardım metni** var mı? | ☐ | |
| HH2 | **İlk girişte** kullanıcı ne yapacağını biliyor mu? | ☐ | |
| HH3 | **Boş sistem** görünümü yol gösterici mi? | ☐ | |
| HH4 | Arapça bilen işçi için **AR arayüz** yeterli mi? | ☐ | |

**HH Toplam:** ___/20

---

## II. TEST VE GERİ ALINABİLİRLİK
>
> *Hata yapılırsa düzeltilebilir mi?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| II1 | Silinen veri **geri alınabilir mi?** | ☐ | |
| II2 | **Hatalı toplu kayıt** nasıl geri alınır? | ☐ | |
| II3 | Test **canlı sistemde mi** yoksa **ayrı ortamda mı** yapılıyor? | ☐ | |
| II4 | **Test verisi** gerçek veriden ayrılabiliyor mu? | ☐ | |

**II Toplam:** ___/20

---

## JJ. EŞ ZAMANLI KULLANIM ÇAKIŞMASI
>
> *İki kişi aynı anda aynı kaydı değiştirirse ne olur?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| JJ1 | **Race condition** koruması var mı? | ☐ | |
| JJ2 | "**Son kaydeden kazanır**" mı geçerli? İşletme bunu biliyor mu? | ☐ | |
| JJ3 | Çakışma olduğunda **kullanıcı uyarılıyor mu?** | ☐ | |
| JJ4 | **Aynı kaydı iki kullanıcı** eş zamanlı açabilir mi? | ☐ | |

**JJ Toplam:** ___/20

---

## KK. ZAMAN DİLİMİ VE PARA BİRİMİ TUTARLILIĞI
>
> *Tarih/saat ve para formatları her yerde aynı mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| KK1 | Tüm timestamp'ler **UTC+3 (TR saati)** olarak gösteriliyor mu? | ☐ | |
| KK2 | **TL formatı** tutarlı mı? (₺ sembolü, virgül/nokta kullanımı) | ☐ | |
| KK3 | **Ondalık hassasiyet** finansal hesaplarda doğru mu? | ☐ | |
| KK4 | Tarih formatı tüm sayfalarda **aynı mı?** (GG/AA/YYYY) | ☐ | |

**KK Toplam:** ___/20

---

## LL. SİSTEM İZLEME VE UPTIME
>
> *Sistem çöktüğünde kim, nasıl haber alır?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| LL1 | **Hata izleme** var mı? (console error takibi) | ☐ | |
| LL2 | Supabase downtime'ında **sistem ne yapıyor?** | ☐ | |
| LL3 | Kritik hata olduğunda **koordinatör haberdar oluyor mu?** | ☐ | |
| LL4 | Sistemin **sağlıklı çalıştığını** nasıl doğruluyoruz? | ☐ | |

**LL Toplam:** ___/20

---

## MM. ÖLÜMCÜL KOD VE KULLANILMAYAN ÖĞELER
>
> *Kodda gereksiz yük var mı?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| MM1 | **Kullanılmayan import'lar** var mı? | ☐ | |
| MM2 | Hiç **çağrılmayan fonksiyonlar** var mı? | ☐ | |
| MM3 | **Yorum satırına alınmış** eski kod temizlendi mi? | ☐ | |
| MM4 | **Console.log** üretim kodunda kaldı mı? | ☐ | |

**MM Toplam:** ___/20

---

## NN. NULL / UNDEFINED / SIFIR FARKI
>
> *Sistem veri yokluğunu doğru yorumluyor mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| NN1 | **"0"** ile **"boş/kayıt yok"** farkı doğru ayrılıyor mu? | ☐ | |
| NN2 | **null** ve **undefined** aynı şekilde mi işleniyor? | ☐ | |
| NN3 | Eksik veri varken **hesaplama yapılıp yanlış sonuç** üretiyor mu? | ☐ | |
| NN4 | **Boş string** ile **null** DB'de ayrı mı tutuluyor? | ☐ | |

**NN Toplam:** ___/20

---

## OO. ÇEVRE DEĞİŞKENLERİ VE BAĞIMLILIK GÜVENLİĞİ
>
> *.env.local ve npm paketleri eksiksiz ve güvenli mi?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| OO1 | Tüm **NEXT_PUBLIC_ değişkenleri** tanımlı mı? | ☐ | |
| OO2 | **API key eksik/hatalı** olursa sistem nasıl davranıyor? | ☐ | |
| OO3 | **npm audit** — bilinen güvenlik açıklı paket var mı? | ☐ | |
| OO4 | **Supabase anon key** client-side'da güvenli kullanılıyor mu? | ☐ | |

**OO Toplam:** ___/20

---

## PP. GÜVENLİK DERİNLİĞİ (ALTYAPI KATMANI)
>
> *R kriterini tamamlar — altyapı güvenliği*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| PP1 | API endpoint'lere **rate limiting** var mı? (spam/brute-force koruması) | ☐ | |
| PP2 | **CORS** ayarları doğru mu? (dışarıdan API'ye istek atılabiliyor mu?) | ☐ | |
| PP3 | **Session timeout** var mı? (tarayıcı kapanınca oturum sona eriyor mu?) | ☐ | |
| PP4 | **localStorage**'daki PIN/session verisi şifresiz mi duruyor? | ☐ | |

**PP Toplam:** ___/20

---

## QQ. VERİ TAŞINAB İLİRLİĞİ VE ÇIKIŞ STRATEJİSİ
>
> *Sistem değişse veya Supabase kapansa ne olur?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| QQ1 | Tüm veri **standart formatta export** edilebilir mi? (CSV/JSON) | ☐ | |
| QQ2 | Başka sisteme geçiş gerekseydi **kaç günde** yapılırdı? | ☐ | |
| QQ3 | Veriye **Supabase olmadan** erişilebilir mi? | ☐ | |
| QQ4 | Export edilen veri **eksiksiz ve anlamlı** mı? | ☐ | |

**QQ Toplam:** ___/20

---

## RR. GÖRSEL TUTARLILIK
>
> *Tüm sayfalar aynı tasarım dilini kullanıyor mu?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| RR1 | Font/renk/boşluk **her sayfada tutarlı mı?** | ☐ | |
| RR2 | Kırmızı/yeşil durum göstergelerinin **metin karşılığı** var mı? | ☐ | |
| RR3 | Buton stilleri ve tablo düzenleri **standart mı?** | ☐ | |
| RR4 | İkon kullanımı **tutarlı ve anlamlı mı?** | ☐ | |

**RR Toplam:** ___/20

---

## SS. KONFİGÜRASYON YÖNETİLEBİLİRLİĞİ
>
> *Teknik bilgisi olmayan admin değişiklik yapabilir mi?*

| # | Kontrol Sorusu | Puan | Not |
|---|----------------|:----:|-----|
| SS1 | Prim oranı, eşik değerleri **kod değiştirmeden** güncellenebilir mi? | ☐ | |
| SS2 | Tüm değiştirilebilir parametreler **Ayarlar sayfasında** mı? | ☐ | |
| SS3 | Bir değer değişince **developer gerekmeden** devreye giriyor mu? | ☐ | |
| SS4 | Ayarlar değişikliği **anında tüm sisteme yansıyor mu?** | ☐ | |

**SS Toplam:** ___/20

---

## 📊 TAM KONTROL RAPORU ŞABLONU

```
═══════════════════════════════════════════════════════════════════
KONTROL RAPORU — 47 SİL BAŞTAN 01
═══════════════════════════════════════════════════════════════════
Kontrol Edilen  : [Sayfa] → [Sekme] → [Alt Sekme]
Tarih           : ___________
═══════════════════════════════════════════════════════════════════
KRİTER                            │ /20 │ RENK │ NOT
──────────────────────────────────┼─────┼──────┼────────────────
A.  Gereklilik                    │     │      │
B.  Eksik/Fazla                   │     │      │
C.  Verimlilik                    │     │      │
D.  İşletme Faydası               │     │      │
E.  Bilgi Türü/Kalitesi           │     │      │
F.  Veri Sağlığı                  │     │      │
G.  Sayfa/Sekme Düzeni            │     │      │
H.  Soru Mantığı                  │     │      │
I.  Soru Kalitesi                 │     │      │
J.  Teknoloji Doğruluğu           │     │      │
K.  API Uygunluğu                 │     │      │
L.  Mimari Doğruluk               │     │      │
M.  Fiyat/Maliyet                 │     │      │
N.  Agent/Otomasyon               │     │      │
O.  Sürdürülebilirlik             │     │      │
P.  Entegrasyon Tutarlılığı       │     │      │
Q.  Hata Yönetimi                 │     │      │
R.  Güvenlik (Temel)              │     │      │
S.  Performans                    │     │      │
T.  UX                            │     │      │
U.  Veri Giriş Doğruluğu          │     │      │
V.  ERP Benchmark                 │     │      │
W.  Hardcoded/Tablo Tutarsızlığı  │     │      │
X.  Stres/Sınır Durumları         │     │      │
Y.  Kapasite/Büyüme Uygunluğu    │     │      │
Z.  Yedekleme/Felaket Kurtarma    │     │      │
AA. Rol Bazlı Erişim              │     │      │
BB. Audit Log/İz Kaydı            │     │      │
CC. İş Akışı Köprüleri            │     │      │
DD. Bildirim/Uyarı Sistemi        │     │      │
EE. Erişilebilirlik/Çoklu Ortam   │     │      │
FF. Önbellek/Veri Tazeliği        │     │      │
GG. Hesapsal Tutarlılık           │     │      │
HH. Kullanıcı Onboarding          │     │      │
II. Test/Geri Alınabilirlik       │     │      │
JJ. Eş Zamanlı Kullanım Çakışması │     │      │
KK. Zaman/Para Birimi Tutarlılığı │     │      │
LL. Sistem İzleme/Uptime          │     │      │
MM. Ölü Kod/Kullanılmayan Öğeler  │     │      │
NN. Null/Undefined/Sıfır Farkı    │     │      │
OO. Çevre Değişkenleri/Bağımlılık │     │      │
PP. Güvenlik Derinliği           │     │      │
QQ. Veri Taşınabilirliği          │     │      │
RR. Görsel Tutarlılık             │     │      │
SS. Konfigürasyon Yönetilebilirl. │     │      │
──────────────────────────────────┼─────┼──────┼────────────────
TOPLAM (Geçerli Kriterler)        │ /100│      │
═══════════════════════════════════════════════════════════════════
🔴 KIRMIZI BAYRAKLAR:
  1.
  2.
  3.
⬛ KÖR NOKTALAR:
  1.
  2.
🔧 ÖNCELİKLİ DÜZELTMELER:
  1.
  2.
  3.
═══════════════════════════════════════════════════════════════════
```

---

## 🔴 GENEL RAPOR — KIRMIZI BAYRAK & KÖR NOKTA KAYDI

| # | Sayfa/Sekme | Kriter | Sorun Özeti | Öncelik |
|---|-------------|--------|-------------|:-------:|
| 1 | | | | 🔴 |
| 2 | | | | 🔴 |
| 3 | | | | 🟠 |
| 4 | | | | 🟠 |
| 5 | | | | 🟡 |
| 6 | | | | 🟡 |

---

## 📌 HIZLI BAŞVURU — 41 KRİTER

| # | Kriter | # | Kriter |
|---|--------|---|--------|
| **A** Gereklilik | **V** ERP Benchmark |
| **B** Eksik/Fazla | **W** Hardcoded/Tablo Tutarsızlığı |
| **C** Verimlilik | **X** Stres/Sınır |
| **D** İşletme Faydası | **Y** Kapasite/Büyüme |
| **E** Bilgi Türü/Kalitesi | **Z** Yedekleme/Felaket |
| **F** Veri Sağlığı | **AA** Rol Bazlı Erişim |
| **G** Sayfa/Sekme Düzeni | **BB** Audit Log/İz Kaydı |
| **H** Soru Mantığı | **CC** İş Akışı Köprüleri |
| **I** Soru Kalitesi | **DD** Bildirim/Uyarı |
| **J** Teknoloji | **EE** Erişilebilirlik/Çoklu Ortam |
| **K** API Uygunluğu | **FF** Önbellek/Veri Tazeliği |
| **L** Mimari Doğruluk | **GG** Hesapsal Tutarlılık |
| **M** Fiyat/Maliyet | **HH** Kullanıcı Onboarding |
| **N** Agent/Otomasyon | **II** Test/Geri Alınabilirlik |
| **O** Sürdürülebilirlik | **JJ** Eş Zamanlı Çakışma |
| **P** Entegrasyon Tutarlılığı | **KK** Zaman/Para Birimi |
| **Q** Hata Yönetimi | **LL** Sistem İzleme/Uptime |
| **R** Güvenlik (Temel) | **MM** Ölü Kod/Gereksiz Öğe |
| **S** Performans | **NN** Null/Undefined/Sıfır |
| **T** UX | **OO** Çevre Değişkenleri |
| **U** Veri Giriş Doğruluğu | **PP** Güvenlik Derinliği |
| | **QQ** Veri Taşınabilirliği |
| | **RR** Görsel Tutarlılık |
| | **SS** Konfigürasyon Yönetilebilirliği |

> **Her kriter → 4 soru → 0–5 puan → /20 → Toplam /100**
> **45 kriter tamamdır. Ekâ eklenecek anlamlı kriter kalmamıştır. Kontrol başlayabilir.**

---

*İki konumda kayıtlı:*
*1. `C:\Users\Admin\Desktop\47_SIL_BASTAN_01\.agents\emirler\47_SIL_BASTAN_01_SISTEM_KONTROL_SON_KURALLAR.md`*
*2. Antigravity Artifacts sistemi*
