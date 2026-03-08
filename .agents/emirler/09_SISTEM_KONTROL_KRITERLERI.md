# ✅ SİSTEM KONTROL KRİTERLERİ

**47 Sil Baştan — Üretim & Mağaza Yönetim Sistemi**
> Her sayfa · Her sekme · Her alt sekme kontrolünde bu liste eksiksiz uygulanır.
> Hiçbir madde atlanmaz. Rapor bu listedeki işaretlemeler üzerinden oluşturulur.

---

## 📊 PUANLAMA SİSTEMİ

| Sembol | Puan | Anlam |
|--------|------|-------|
| 🟢 **5** | Tam Doğru | Sorun yok, standart karşılandı |
| 🔵 **4** | Yeterli | Küçük eksik var, işlevsel |
| 🟡 **3** | Orta | İyileştirme önerisi var, çalışıyor ama zayıf |
| 🟠 **2** | Zayıf | Kritik eksik var, performans düşük |
| 🔴 **1** | Kritik Sorun | Acil müdahale gerekiyor |
| ⬛ **0** | Kör Nokta | Hiç düşünülmemiş, yok |
| ➖ **—** | Geçersiz | Bu kriter bu sekme için geçerli değil |

> **Toplam Puan = Geçerli kriterlerin ortalaması × 20 = /100**

---

## 📋 KONTROL ŞEMASI — HER İŞLEMDE KULLANILIR

```
KONTROL EDİLEN: [Sayfa Adı] → [Sekme] → [Alt Sekme]
TARİH: ___________
KONTROLÜ YAPAN: ___________
```

---

## A. GEREKLİLİK KRİTERİ
>
> *Bu sayfa/sekme/alt sekme gerçekten gerekli miydi?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| A1.1 | Bu sekme **olmasa** işletme ne kaybeder? | ☐ | |
| A1.2 | Başka bir sekmeyle **birleştirilebilir** miydi? | ☐ | |
| A1.3 | Kullanıcı bu sekmeyi **düzenli kullanıyor mu?** | ☐ | |
| A1.4 | Bağımsız durması mı, birleşik durması mı **daha verimli?** | ☐ | |

**A Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## B. EKSİK / FAZLA KRİTERİ
>
> *Bu sayfada ne eksik, ne fazla?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| B1.1 | Bu sayfada **eksik olan bilgi/işlev** var mı? | ☐ | |
| B1.2 | Bu sayfada **gereksiz olan bilgi/buton/alan** var mı? | ☐ | |
| B1.3 | Eksikler işletmeyi **maddi/operasyonel** olarak etkiliyor mu? | ☐ | |
| B1.4 | Fazlalıklar kullanıcıyı **dikkat dağıtıyor mu?** | ☐ | |

**B Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## C. VERİMLİLİK KRİTERİ
>
> *Bu sekme işlemi ne kadar verimli yapıyor?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| C1.1 | Mevcut iş akışı **kaç adımda** tamamlanıyor? Kaça düşürülebilir? | ☐ | |
| C1.2 | Kullanıcı bu sayfada **ne kadar zaman** harcıyor? Kısaltılabilir mi? | ☐ | |
| C1.3 | **Otomatikleştirilebilecek** adımlar mevcut mu? | ☐ | |
| C1.4 | Ne olsaydı **daha verimli** olurdu? | ☐ | |

**C Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## D. İŞLETME FAYDASI KRİTERİ
>
> *Bu sekme işletmeye somut ne sağlıyor?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| D1.1 | Bu sekmenin **ölçülebilir faydası** nedir? (Para/Zaman/Hata azaltma) | ☐ | |
| D1.2 | İşletmenin **hangi sorununu** bu sekme çözüyor? | ☐ | |
| D1.3 | Bu sekme **olmadan işletme** nasıl yürürdü? | ☐ | |
| D1.4 | Fayda/maliyet dengesi **pozitif mi?** | ☐ | |

**D Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## E. BİLGİ TÜRÜ ve KALİTESİ KRİTERİ
>
> *Hangi türde bilgi, nasıl sunuluyor?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| E1.1 | Bilgi türü nedir? *(Operasyonel / Analitik / Arşiv / Uyarı)* | ☐ | |
| E1.2 | Bilgi **ham mı, işlenmiş mi, karar destekleyici mi?** | ☐ | |
| E1.3 | Bilgi **doğru formatta** sunuluyor mu? | ☐ | |
| E1.4 | Bu bilginin **daha iyi sunulma yolu** var mı? | ☐ | |

**E Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## F. VERİ SAĞLIĞI KRİTERİ
>
> *Veri güvenilir, güncel ve tutarlı mı?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| F1.1 | Veri kaynağı **güvenilir mi?** | ☐ | |
| F1.2 | Veri **zamanında güncelleniyor mu?** | ☐ | |
| F1.3 | **Çelişen veya tutarsız** bilgi var mı? | ☐ | |
| F1.4 | Supabase'deki **alan tipleri doğru mu?** | ☐ | |

**F Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## G. SAYFA / SEKME DÜZENİ KRİTERİ
>
> *Görsel hiyerarşi ve kullanılabilirlik*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| G1.1 | En önemli bilgi **en öne çıkıyor mu?** | ☐ | |
| G1.2 | Sekme sıralaması **iş akışını yansıtıyor mu?** | ☐ | |
| G1.3 | Kullanıcı **nereye ilk bakacağını** biliyor mu? | ☐ | |
| G1.4 | Mobil/tablet görünümü **uyumlu mu?** | ☐ | |

**G Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## H. SORU MANTIĞI KRİTERİ
>
> *Form alanları ve akış mantığı*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| H1.1 | Form alanları **doğal sırada mı?** Birini doldurmak diğerine yol açıyor mu? | ☐ | |
| H1.2 | Formlar **birbirini tamamlıyor mu?** | ☐ | |
| H1.3 | **Gereksiz alan** var mı? | ☐ | |
| H1.4 | **Eksik alan** var mı? | ☐ | |

**H Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## I. SORU KALİTESİ KRİTERİ
>
> *Alanlar doğru şekilde mi soruyor?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| I1.1 | Alan isimleri **anlaşılır mı?** (TR/AR) | ☐ | |
| I1.2 | İşletme faydası en üst seviyede olsaydı **nasıl sorulurdu?** | ☐ | |
| I1.3 | **Alternatif soru formülasyonu** daha iyi sonuç verir miydi? | ☐ | |
| I1.4 | Kullanıcı soruyu **yanlış anlayabilir mi?** | ☐ | |

**I Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## J. TEKNOLOJİ DOĞRULUĞU KRİTERİ
>
> *Doğru teknoloji seçildi mi?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| J1.1 | **Next.js** bu modül için doğru framework mi? | ☐ | |
| J1.2 | Client-side mi, Server-side mi? **Hangisi daha doğru?** | ☐ | |
| J1.3 | Gereksiz **render/yeniden yükleme** var mı? | ☐ | |
| J1.4 | State yönetimi doğru mu? **(useState / global / realtime)** | ☐ | |

**J Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## K. API UYGUNLUĞU KRİTERİ
>
> *API'ler doğru ve verimli kullanılıyor mu?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| K1.1 | **Doğru API endpoint'leri** kullanılıyor mu? | ☐ | |
| K1.2 | **Gereksiz API çağrısı** var mı? (N+1 problemi) | ☐ | |
| K1.3 | **API hata yönetimi** yapılmış mı? | ☐ | |
| K1.4 | **Timeout ve fallback** mekanizması var mı? | ☐ | |

**K Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## L. MİMARİ DOĞRULUK KRİTERİ
>
> *Sistem tasarımı sağlıklı mı?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| L1.1 | **Modüler mimari** doğru kurulmuş mu? | ☐ | |
| L1.2 | Veri akışı **tek yönlü mü?** Döngüsel bağımlılık var mı? | ☐ | |
| L1.3 | **Component'lar yeniden kullanılabiliyor mu?** | ☐ | |
| L1.4 | Kod **karmaşıklığı gereksinimle orantılı mı?** | ☐ | |

**L Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## M. FİYAT / MALİYET KRİTERİ
>
> *Teknoloji ve API maliyetleri optimum mu?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| M1.1 | **Supabase ücretsiz tier** limitleri aşılıyor mu? | ☐ | |
| M1.2 | **Perplexity AI** kullanımı maliyete değiyor mu? | ☐ | |
| M1.3 | **Telegram Bot** maliyet/fayda dengesi doğru mu? | ☐ | |
| M1.4 | Daha ucuz **alternatif çözüm** var mıydı? | ☐ | |

**M Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## N. AGENT / OTOMASYON KRİTERİ
>
> *Otomasyon potansiyeli değerlendirilmiş mi?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| N1.1 | **Tekrarlayan işlemler** agent'a devredilebilir mi? | ☐ | |
| N1.2 | Mevcut **agent dosyaları** işe yarıyor mu? | ☐ | |
| N1.3 | **Hangi işlemler otomatikleştirilmeli?** | ☐ | |
| N1.4 | Otomasyon yapılmadan bu sekme **tam verimli mi?** | ☐ | |

**N Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## O. SÜRDÜRÜLEBİLİRLİK KRİTERİ
>
> *Uzun vadede sağlıklı mı?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| O1.1 | **1–3 yıl sonra** bu teknoloji hâlâ geçerli olacak mı? | ☐ | |
| O1.2 | Sistemin bakımını **kim yapabilir?** | ☐ | |
| O1.3 | **5× büyüme** durumunda sistem ayakta kalır mı? | ☐ | |
| O1.4 | **Vendor lock-in** riski var mı? | ☐ | |

**O Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## P. ENTEGRASYON TUTARLILIĞI KRİTERİ
>
> *Sayfalar arası veri akışı doğru mu?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| P1.1 | Bu sayfa **diğer sayfalarla doğru veri paylaşıyor mu?** | ☐ | |
| P1.2 | Bir sayfada değişen veri **diğerini güncelliyor mu?** | ☐ | |
| P1.3 | **Veri silosu** var mı? | ☐ | |
| P1.4 | Entegrasyon kopukluğu **işletmeye zarar veriyor mu?** | ☐ | |

**P Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## Q. HATA YÖNETİMİ KRİTERİ
>
> *Kötü senaryolara hazır mı?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| Q1.1 | Yanlış veri girilirse **ne olur?** Kontrol var mı? | ☐ | |
| Q1.2 | Supabase bağlantısı kesilirse **sayfa çöker mi?** | ☐ | |
| Q1.3 | **Boş state** durumu anlayışlı gösteriliyor mu? | ☐ | |
| Q1.4 | Hata mesajları **kullanıcıya anlamlı mı?** | ☐ | |

**Q Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## R. GÜVENLİK KRİTERİ
>
> *Yetkisiz erişime kapalı mı?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| R1.1 | Bu sayfada **hassas veri** korunuyor mu? | ☐ | |
| R1.2 | **Yetkisiz kullanıcı** bu veriye erişebilir mi? | ☐ | |
| R1.3 | **Form injection / XSS** açığı var mı? | ☐ | |
| R1.4 | **RLS politikaları** bu sayfayı kapsıyor mu? | ☐ | |

**R Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## S. PERFORMANS KRİTERİ
>
> *Hız ve ölçeklenebilirlik*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| S1.1 | Sayfa yüklenme süresi **kabul edilebilir mi?** (<1 saniye) | ☐ | |
| S1.2 | Büyük veri setlerinde **sayfalama** var mı? | ☐ | |
| S1.3 | **Gereksiz re-render** var mı? | ☐ | |
| S1.4 | Resim/dosya **optimize edilmiş mi?** | ☐ | |

**S Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## T. KULLANICI DENEYİMİ (UX) KRİTERİ
>
> *Kullanıcı bu sayfayı rahatça kullanabiliyor mu?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| T1.1 | **Yeni başlayan biri** bu sayfayı anlayabilir mi? | ☐ | |
| T1.2 | En sık kullanılan işlev **en kolay erişilebilir mi?** | ☐ | |
| T1.3 | Başarı/hata **geri bildirimi** var mı? | ☐ | |
| T1.4 | **Türkçe/Arapça geçişi** doğru çalışıyor mu? | ☐ | |

**T Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## U. VERİ GİRİŞ DOĞRULUĞU KRİTERİ
>
> *Veri kalitesini koruyor mu?*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| U1.1 | **Zorunlu alanlar** işaretlenmiş mi? | ☐ | |
| U1.2 | **Format kontrolü** var mı? (telefon/tarih/sayı) | ☐ | |
| U1.3 | **Mükerrer (duplicate) veri** engelleniyor mu? | ☐ | |
| U1.4 | **Silme işlemi korunuyor mu?** (onay / geri alma) | ☐ | |

**U Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## V. ERP BENCHMARK KRİTERİ
>
> *Dünya standartlarıyla karşılaştırma*

| # | Kontrol Sorusu | Puan (0–5) | Not |
|---|----------------|------------|-----|
| V1.1 | Eşdeğer **SAP/Infor modülü** ne yapıyor? Biz ne yapıyoruz? | ☐ | |
| V1.2 | **Endüstri standardı** bu modülde ne bekler? | ☐ | |
| V1.3 | Rakip sistemlere göre **üstün olduğumuz** noktalar? | ☐ | |
| V1.4 | Rakip sistemlere göre **zayıf olduğumuz** noktalar? | ☐ | |

**V Bölümü Toplam:** ___/20 | Ortalama:___/5

---

## 📊 KONTROL RAPORLAMA ŞABLONU

```
════════════════════════════════════════════════════════
KONTROL RAPORU
════════════════════════════════════════════════════════
Kontrol Edilen : [Sayfa] → [Sekme] → [Alt Sekme]
Tarih          : ___________
════════════════════════════════════════════════════════
KRİTER              │ PUAN │ RENK │ ÖNCELİK │ NOT
────────────────────┼──────┼──────┼─────────┼──────────
A. Gereklilik       │  /20 │  🟢  │         │
B. Eksik/Fazla      │  /20 │  🟡  │         │
C. Verimlilik       │  /20 │  🔴  │         │
D. İşletme Faydası  │  /20 │  🟢  │         │
E. Bilgi Türü       │  /20 │  🟢  │         │
F. Veri Sağlığı     │  /20 │  🟡  │         │
G. Sayfa Düzeni     │  /20 │  🟢  │         │
H. Soru Mantığı     │  /20 │  🟢  │         │
I. Soru Kalitesi    │  /20 │  🟡  │         │
J. Teknoloji        │  /20 │  🟢  │         │
K. API              │  /20 │  🟢  │         │
L. Mimari           │  /20 │  🟢  │         │
M. Maliyet          │  /20 │  🟡  │         │
N. Otomasyon        │  /20 │  🟠  │         │
O. Sürdürülebilirlik│  /20 │  🟢  │         │
P. Entegrasyon      │  /20 │  🟢  │         │
Q. Hata Yönetimi    │  /20 │  🟡  │         │
R. Güvenlik         │  /20 │  🟢  │         │
S. Performans       │  /20 │  🟢  │         │
T. UX               │  /20 │  🟢  │         │
U. Veri Doğruluğu   │  /20 │  🟢  │         │
V. ERP Benchmark    │  /20 │  🟡  │         │
────────────────────┼──────┼──────┼─────────┼──────────
TOPLAM              │  /100│      │         │
════════════════════════════════════════════════════════
🔴 KIRMIZI BAYRAKLAR:
  -
  -
⬛ KÖR NOKTALAR:
  -
  -
🔧 ÖNCELİKLİ DÜZELTMELER:
  1.
  2.
  3.
════════════════════════════════════════════════════════
```

---

## 🔴 GENEL RAPOR — KIRMIZI BAYRAK & KÖR NOKTA KAYIT ALANI

| # | Sayfa/Sekme | Kriter | Sorun | Öncelik |
|---|-------------|--------|-------|---------|
| 1 | | | | 🔴 |
| 2 | | | | 🔴 |
| 3 | | | | 🟠 |
| 4 | | | | 🟠 |
| 5 | | | | 🟡 |

---

*Bu dosya her sistem kontrolünde açık tutulur. Her madde işaretlenir, her puan girilir. Kontrol bitmeden rapor verilmez.*
