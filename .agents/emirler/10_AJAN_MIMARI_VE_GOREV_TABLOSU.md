# 🤖 47 SİL BAŞTAN — AI AJAN MİMARİSİ VE GÖREV TABLOSU

## Belge No: 10 | Tarih: 07.03.2026 | Onaylayan: Koordinatör Engin Bey

---

## 🎯 TEMEL FELSEFESİ

> **"En az ajan, en geniş kapsam."**
>
> Ajanlar gün boyunca arka planda otomatik çalışır.
> Koordinatör sistemi izler — müdahale etmez.
> Sadece stokta kritik durum, maliyette sapma veya üretim tıkanması
> olduğunda Koordinatör devreye girer.
>
> **Sistem kendi kendini yönetir. Koordinatör strateji yapar.**

---

## 📊 AJAN SAYISI VE TAKTİK GEREKÇESİ

| Ajan | Sayısı | Neden Bu Kadar? |
|---|---|---|
| Otonom (otomatik çalışan) | **3** | Her sabah, her akşam, sürekli |
| Tetikleyici (event-based) | **2** | Belirli olay olunca devreye girer |
| Manuel çağrılabilir | **2** | Koordinatör "ara sıra" ihtiyaç duyduğunda |
| **TOPLAM** | **7** | Tüm sistemi kapsar |

---

## 🤖 7 AJAN TANIMI

---

### AJAN 1 — SABAH SUBAY'I (Sabah Ajans)

**Ajan Adı:** `Sabah Subayı`
**Kategori:** OTONOMGün tipi çalışıyor: **Her gün 08:00'de**

**Görevi:**
Her sabah işe başlamadan önce tüm sistemi tarar, koordinatöre günlük brifing sunar.

**Kontrol Listesi:**

- [ ] Bekleyen sipariş var mı? (b2_siparisler)
- [ ] Kritik stok var mı? (b2_urun_katalogu)
- [ ] Bugün bitmesi gereken üretim emirleri var mı?
- [ ] Onay bekleyen Ar-Ge trendi var mı?
- [ ] Ödenmemiş vadesi gelen borç/alacak var mı?

**Sonucu Nereye Yazar:**
→ `b1_agent_loglari` (Sabah Brifingi)
→ `b1_sistem_uyarilari` (kritik bulunanlar için alarm)

**Karar Mantığı:**

```
EĞER her şey yolundaysa  → "✅ Sistem Normal. İyi çalışmalar." yaz
EĞER kritik varsa        → "🔴 KRİTİK: [detay]" alarmı üret
```

---

### AJAN 2 — AKŞAMCİ (Kapanış Ajansı)

**Ajan Adı:** `Akşamcı`
**Kategori:** OTONOMÇalışma zamanı: **Her gün 18:00'de**

**Görevi:**
Günün üretim ve finans kapanışını yapar, yarına hazırlanır.

**Kontrol Listesi:**

- [ ] Bugün tamamlanan üretim emirleri → Muhasebe'ye aktar sinyali ver
- [ ] Yarın teslimatı gereken siparişler neler?
- [ ] Bugün kullanılan malzeme stoktan düş bildirimi yap
- [ ] Personel devam durumu (gelen/gitmeyen kayıt var mı?)
- [ ] Günlük kasa hareketi özeti üret

**Sonucu Nereye Yazar:**
→ `b1_muhasebe_raporlari` (günlük özet)
→ `b1_agent_loglari` (kapanış logu)

---

### AJAN 3 — NABİZ (Canlı Gözetleme Ajansı)

**Ajan Adı:** `Nabız`
**Kategori:** OTONOMÇalışma zamanı: **Her 2 saatte bir** (09, 11, 13, 15, 17)

**Görevi:**
Sistemin "nabzını" atar. Gün içinde kritik olay çıkarsa anında alarm üretir.

**İzlediği Metrikler:**

| Metrik | Alarm Eşiği |
|---|---|
| Stok sıfıra düştü mü? | stok = 0 |
| Maliyet hedefi %15+ aşıldı mı? | fark > %15 |
| Üretim bandı durdu mu? | 3 saatten fazla log yok |
| Bekleyen sipariş sayısı | > 10 girilmemiş |

**Sonucu Nereye Yazar:**
→ `b1_sistem_uyarilari` (sadece kritik durumlar)

**Önemli Kural:**

```
Aynı alarm 2 saat içinde tekrar yazma!
(Koordinatörü boğma — sadece gerçek değişimlerde uyar)
```

---

### AJAN 4 — ÜRETİM ZİNCİRCİ (Akış Tetikleyicisi)

**Ajan Adı:** `Zincirci`
**Kategori:** TETİKLEYİCİ — Olay bazlı

**Görevi:**
Üretim zincirini (M1→M8) otomatik ilerletir. Bir aşama bitince sonraki aşamayı tetikler.

**Tetiklenme Koşulları:**

```
Trend "onaylandi" → Kumaş seçimi için uyarı ver (M2)
Kumaş seçildi   → Kalıp isteği oluştur (M3)
Kalıp hazır     → Modelhane'ye bildir (M4)
Numune onaylı   → Kesim emri oluştur (M5)
Kesim tamam     → Üretim bandına yönlendir (M6)
Üretim tamam    → Maliyet hesabı başlat (M7)
Maliyet onaylı  → Muhasebe'ye aktar (M8)
```

**Sonucu Nereye Yazar:**
→ İlgili modülün tablosuna bildirim
→ `b1_agent_loglari` (her adım logu)

**Bu Ajan Sayesinde:**
Koordinatör "Ar-Ge'de trendi onayladım" der, geri kalanını ajan halleder.

---

### AJAN 5 — FİNANS KALKANI (Kârlılık Koruyucusu)

**Ajan Adı:** `Finans Kalkanı`
**Kategori:** TETİKLEYİCİ — Finansal eşik aşılınca

**Görevi:**
İşletmenin kârlılığını ve nakit akışını korur. Tehlikeli bir finansal sinyal görünce anında uyarır.

**Tetiklenme Koşulları:**

| Durum | Eşik | Aksiyon |
|---|---|---|
| Maliyet aşımı | > %15 | Alarm + koordinatöre özet |
| Vadesi geçen alacak | > 30 gün | Uyarı listesi çıkar |
| Kasa sıfıra yakın | < ₺500 | KRİTİK alarm |
| Net kâr marjı | < %10 | Sarı uyarı |
| Aylık gider artışı | > %20 | Analiz raporu |

**Sonucu Nereye Yazar:**
→ `b1_sistem_uyarilari`
→ `b1_muhasebe_raporlari` (özet rapor)

---

### AJAN 6 — AR-GE KÂŞİFİ (Manuel/Haftalık)

**Ajan Adı:** `Trend Kâşifi`
**Kategori:** MANUEL ÇAĞRILABİLİR + Haftalık otomatik

**Görevi:**
Trendyol, Amazon, sosyal medyayı tarar. Dönemin en çok satan ürünlerini bulur, puanlar, sisteme ekler.

**Ne Zaman Çağrılır:**

- Her Pazartesi sabahı (otomatik haftalık döngü)
- Koordinatör "Yeni sezon başlıyor, trend bak" dediğinde (manuel)
- Stok sıfıra yaklaşan bir ürün grubunun yerine yeni ürün aranırken

**Kullandığı API'ler:**

- Perplexity AI (internet arama)
- Google Trends (serp API)

**Sonucu Nereye Yazar:**
→ `b1_arge_trendler` (durum: inceleniyor)
→ Koordinatör onay bekler → Zincirci devreye girer

---

### AJAN 7 — MUHASEBE YAZICI (Manuel/Aylık)

**Ajan Adı:** `Muhasebe Yazıcı`
**Kategori:** MANUEL ÇAĞRILABİLİR + Aylık otomatik

**Görevi:**
Ay sonu kapanışını yapar. Tüm modüllerden veri çekerek kapsamlı aylık rapor oluşturur.

**Ne Zaman Çağrılır:**

- Her ayın son günü (otomatik)
- Vergi dönemi öncesi (manuel)
- Koordinatör "Nasıl gidiyoruz?" dediğinde

**Ürettiği Raporlar:**

- Aylık gelir-gider tablosu
- Modele göre kârlılık analizi
- En kârlı / en kayıplı ürün listesi
- Personel verimliliği özeti
- Gelen sipariş vs. teslim edilen analizi

**Sonucu Nereye Yazar:**
→ `b1_muhasebe_raporlari`
→ Koordinatörün PDF indirebileceği format

---

## ⚡ GÜN İÇİ OTOMASYONErotik AKIŞ

```
08:00 ─── Sabah Subayı çalışır
           ↓ Brifing hazırlar
           ↓ Sistem Normal → Koordinatör sadece okur
           ↓ Kritik Bulgu → Koordinatör müdahale eder

09:00 ─── Nabız (1. tur)
           ↓ Eşik aşımı yok → sessiz geç
           ↓ Eşik aşımı var → Alarm üret

[GÜN BOYUNCA]
           ↓ Sipariş gelir → Zincirci tetiklenir
           ↓ Stok değişir → Nabız yakalar
           ↓ Maliyet aşılır → Finans Kalkanı uyarır

11:00 ─── Nabız (2. tur)
13:00 ─── Nabız (3. tur)
15:00 ─── Nabız (4. tur)
17:00 ─── Nabız (5. tur)

18:00 ─── Akşamcı çalışır
           ↓ Günlük kapanış
           ↓ Yarına brifing hazırlar
           ↓ Muhasebe günlük özet

Pazartesi 09:00 ─── Trend Kâşifi (haftalık)
           ↓ Yeni trendler → b1_arge_trendler
           ↓ Koordinatör onayı bekler

Ay Sonu ─── Muhasebe Yazıcı
           ↓ Aylık kapsamlı rapor
```

---

## 🔒 YETKİ MATRİSİ (Kim Ne Yapabilir?)

| Ajan | İnternet | DB Oku | DB Yaz | AI Kullan | Alarm Üret |
|---|---|---|---|---|---|
| Sabah Subayı   | ❌ | ✅ | ✅ | ❌ | ✅ |
| Akşamcı        | ❌ | ✅ | ✅ | ❌ | ❌ |
| Nabız          | ❌ | ✅ | ⚠️ Only alarm | ❌ | ✅ |
| Zincirci       | ❌ | ✅ | ✅ | ❌ | ✅ |
| Finans Kalkanı | ❌ | ✅ | ⚠️ Only alarm | ❌ | ✅ |
| Trend Kâşifi   | ✅ | ✅ | ✅ | ✅ | ❌ |
| Muhasebe Yazıcı| ❌ | ✅ | ✅ | ✅ | ❌ |

**Kural:** Hiçbir ajan insan onayı gerekmeden üretim emri açamaz, siparişi iptal edemez, kasa hareketi yapamaz.

---

## 📋 KOMUTA MERKEZİ ARAYÜZÜNDE GÖRÜNÜM

| # | Ajan | Son Çalışma | Durum | Manuel Başlat |
|---|---|---|---|---|
| 1 | 🌅 Sabah Subayı | 08:00 | ✅ Normal | ▶ Şimdi Çalıştır |
| 2 | 🌆 Akşamcı | 18:00 | ✅ Normal | ▶ Şimdi Çalıştır |
| 3 | 💓 Nabız | Her 2s | ✅ Aktif | ▶ Şimdi Çalıştır |
| 4 | ⛓️ Zincirci | Olay bazlı | ✅ Bekliyor | ▶ Zorla Çalıştır |
| 5 | 🛡️ Finans Kalkanı | Eşik bazlı | ✅ Bekliyor | ▶ Zorla Çalıştır |
| 6 | 🔍 Trend Kâşifi | Pazartesi 09:00 | ✅ Haftalık | ▶ Manuel Çalıştır |
| 7 | 📊 Muhasebe Yazıcı | Ay sonu | ✅ Bekliyor | ▶ Manuel Çalıştır |

---

## ✅ GELIŞTIRMEMEMIZ GEREKEN SIRALAMA

1. **Önce:** Sabah Subayı + Akşamcı (temel ritim)
2. **Sonra:** Nabız (sürekli gözetleme)
3. **Sonra:** Zincirci (üretim akışı — işletmenin kalbi)
4. **Sonra:** Finans Kalkanı (para koruma)
5. **En son:** Trend Kâşifi + Muhasebe Yazıcı (periyodik)

---

*Hazırlayan: Antigravity AI*
*Referans: 09_ARGE_AI_VIZYON, Koordinatör Sözlü Talimat 07.03.2026*
