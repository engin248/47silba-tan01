# 🏭 ÜRETİM BANDI / İMALAT — 5 FARKLI BAKIŞ AÇISIYLA DENETİM RAPORU

**Tarih:** 16 Mart 2026 | **Denetleyen:** Antigravity AI | **Kapsam:** M3 İmalat + M14 Üretim Bandı

---

## 📍 MEVCUT DURUM ÖZETİ

Sistemde **iki ayrı üretim modülü** var:

| Modül | Sayfa | Tablo | Fonksiyon Sayısı |
|-------|-------|-------|-----------------|
| **M14 — Üretim Bandı** | `/uretim` | `production_orders`, `b1_maliyet_kayitlari`, `b1_muhasebe_raporlari` | 6 sekme (İş Emri, Bant, Kalite/Krono, Maliyet, Devir, Canlı Takip) |
| **M3/M6 — İmalat** | `/imalat` | `b1_imalat_emirleri`, `v2_order_production_steps`, `v2_models` | 4 pencere (Teknik Föy, Şablon, Saha Kanban, Müfettiş Onay) |

> [!WARNING]
> Bu iki modül **birbirinden kopuk** çalışıyor. İkisi de "üretim" yapıyor ama farklı tablolar kullanıyor. İşletmeye hangisinin "gerçek üretim bandı" olduğu netleştirilmeli.

---

## 🔍 BAKIŞ AÇISI 1: İŞLETME SAHİBİ (Patronun Gözü)

**"Bu sayfaya baktığımda ne görüyorum, ne göremiyorum?"**

### ✅ Var Olan
- İş emri oluşturabiliyorsun (model, adet, tarih)
- Bekliyor / Üretimde / Tamamlandı durumlarını izleyebiliyorsun
- Kronometre ile işçilik süresi ölçüp otomatik maliyet hesaplayabiliyorsun
- Mağazaya sevk edip muhasebe raporu açabiliyorsun

### ❌ EKSİK — Patronun Göremediği Kritik Veriler
| Eksik | Neden Önemli | Aciliyet |
|-------|-------------|---------|
| **Günlük/Haftalık Üretim Özet Dashboardu** | Patron tek bakışta "bugün kaç adet ürettik" diyemiyor. Sayıları tek tek saymak zorunda | 🔴 KRİTİK |
| **Verimlilik Oranı (Hedef vs Gerçek)** | "1000 adet hedefledik, neredeyz?" sorusu cevaplanamıyor | 🔴 KRİTİK |
| **Gecikme Uyarısı (Deadline Tracking)** | Hedef bitiş tarihi geçmiş iş emirleri için kırmızı alarm yok | 🟡 YÜKSEK |
| **Trend Grafikleri** | Haftalık/aylık üretim trendi → çizgi grafik yok, sadece düz liste | 🟡 YÜKSEK |
| **Maliyet / Adet Karşılaştırma** | "Bu modelin birim maliyeti ne?" sorusu cevaplanamıyor | 🟡 YÜKSEK |

---

## 🔍 BAKIŞ AÇISI 2: SAHA YÖNETİCİSİ (Ustabaşı/Bandın Başı)

**"Elime tablet verdiğinizde bu sayfayla ne yapabilirim?"**

### ✅ Var Olan
- Barkod okutarak iş başlatma/bitirme
- Kronometre ile süre takibi + mola sistemi
- Crash recovery (tablet kapansa bile süre korunuyor)
- Anti-spam zırhı (çift tıklama koruması)

### ❌ EKSİK — Ustabaşının İhtiyaçları
| Eksik | Neden Önemli | Aciliyet |
|-------|-------------|---------|
| **Personel Atama Sistemi** | İş emrine hangi personelin atandığı belli değil. "Kim ne yapıyor?" sorusu havada | 🔴 KRİTİK |
| **Operasyon/İşlem Sırası (Rota Kartı)** | Üretim bandı `UretimSayfasi.js`'de işlem adımları (dikim, ütü, paket vs.) yok — sadece tek durum: başladı/bitti | 🔴 KRİTİK |
| **Hata/Fire Kayıt Sistemi** | İmalat (M3) tarafında "hataliMalReddet" var ama Üretim Bandı (M14) tarafında fire/zayiat kaydı yok | 🟡 YÜKSEK |
| **Duruş Kodları (Arıza, Malzeme Yok, vs.)** | `DURUS_KODLARI` importu var ama UI'da kullanılmıyor — duruş nedeni kaydedilemiyor | 🟡 YÜKSEK |
| **Makine Bağlama** | Hangi makinede hangi iş yapılıyor? Makine verimliliği ölçülemiyor | 🟠 ORTA |

---

## 🔍 BAKIŞ AÇISI 3: MALİ MÜDÜR / MUHASEBE (Para Akışı)

**"Üretim benim paramı doğru hesaplıyor mu?"**

### ✅ Var Olan
- Kronometre → otomatik maliyet (dakika × ücret × zorluk katsayısı)
- Manuel maliyet kalemi ekleme (sarf malzeme, personel)
- Devir mekanizması → `b1_muhasebe_raporlari` tablosuna rapor
- Mükerrer devir koruması

### ❌ EKSİK — Mali Kör Noktalar
| Eksik | Neden Önemli | Aciliyet |
|-------|-------------|---------|
| **Hedef Maliyet vs Gerçek Maliyet Karşılaştırma** | Devir raporunda `hedeflenen_maliyet_tl` **hiç hesaplanmıyor** — her zaman 0 | 🔴 KRİTİK |
| **Kumaş Maliyeti Entegrasyonu** | Kumaş modülünden (M2) gelen metraj/maliyet üretim maliyetine dahil edilmiyor | 🔴 KRİTİK |
| **Fire/Zayiat Maliyeti** | `net_uretilen_adet` ve `zayiat_adet` devir raporunda hep 0 yazılıyor | 🟡 YÜKSEK |
| **İşçilik/Birim Maliyet Raporu** | Model bazında "bu modelin 1 adetini üretmek bize kaça mal oldu?" analizi yok | 🟡 YÜKSEK |
| **Kâr Marjı Hesaplama** | Satış fiyatı ile üretim maliyetini karşılaştıran mekanizma yok | 🟠 ORTA |

---

## 🔍 BAKIŞ AÇISI 4: SİSTEM MÜHENDİSİ / MİMAR (Teknik Borç)

**"Kod mimarisi sağlam mı? Ölçeklenebilir mi?"**

### ✅ Var Olan
- Hook/Component/Service ayrımı düzgün (Clean Architecture)
- Offline kuyruğa alma (M3 tarafında `cevrimeKuyrugaAl`)
- Realtime Supabase kanalları (M3 tarafında)
- Anti-spam `islemdeId` zırhı her iki modülde de var
- Timeout koruması (10 saniye)
- ErrorBoundary sarmalı

### ❌ EKSİK — Teknik Borçlar
| Eksik | Neden Önemli | Aciliyet |
|-------|-------------|---------|
| **İki Modül Birleşimi** | `/uretim` ve `/imalat` aynı işi farklı tablolarla yapıyor. `production_orders` ≠ `b1_imalat_emirleri` — veri bütünlüğü riski | 🔴 KRİTİK |
| **Ajan Takibi Kopuk** | Zincirci ajanı `b1_uretim_kayitlari` tablosunu izliyor ama Üretim Bandı `production_orders`'ı kullanıyor. **Ajanlar üretim verilerini hiç görmüyor!** | 🔴 KRİTİK |
| **Realtime Yok (M14)** | İmalat (M3) tarafında `imalat-gercek-zamanli` kanalı var ama Üretim Bandı (M14) tarafında **realtime subscription yok** — 2 kişi aynı anda baktığında eski veri görür | 🟡 YÜKSEK |
| **`useIsEmri` hook görülmedi** | `UretimSayfasi.js` import ediyor ama `features/uretim/hooks/` dizininde dosya bulunamadı — **eksik olabilir** | 🟡 KONTROL ET |
| **Pagination Yok** | `production_orders` max 200, `b1_maliyet_kayitlari` max 200 — büyüdükçe performans düşer | 🟠 ORTA |

---

## 🔍 BAKIŞ AÇISI 5: AJAN KOORDİNATÖRÜ (Otomasyon Eksikleri)

**"7 ajan sistemi üretim hattını yeterince izliyor mu?"**

### ✅ Var Olan (Dolaylı İzleme)
- **Sabah Subayı:** `b1_uretim_kayitlari`'dan gecikmiş emirleri tarıyor (Kontrol 4)
- **Akşamcı:** Bugün tamamlanan üretimi sayıyor (Kontrol 1)
- **Nabız:** Zincirci'nin 4 saattir hareketsiz olup olmadığını kontrol ediyor
- **Zincirci:** M5→M6 (Kesim→Üretim) ve M6→M7 (Üretim→Maliyet) geçişlerini izliyor
- **Finans Kalkanı:** Maliyet aşımlarını tespit ediyor

### ❌ EKSİK — Ajanların Kör Noktaları
| Eksik | Neden Önemli | Aciliyet |
|-------|-------------|---------|
| **`production_orders` tablosu hiçbir ajanda yok** | Üretim Bandı sayfasında oluşturulan iş emirlerini **hiçbir ajan izlemiyor**. Gecikse bile alarm vermez | 🔴 KRİTİK |
| **`b1_imalat_emirleri` tablosu hiçbir ajanda yok** | İmalat emirleri de ajan radarının dışında | 🔴 KRİTİK |
| **Kronometre Anormallik Tespiti** | Bir iş 48 saat açık kalsa bile ajan alarm vermiyor — şişmiş maliyet fark edilmez | 🟡 YÜKSEK |
| **Günlük Üretim Hedef Takibi** | "Bugün 500 adet hedefimiz var, 300'de kaldık" diye uyarı verecek ajan yok | 🟡 YÜKSEK |
| **Personel Performans Ajanı** | FPY (First Pass Yield) verileri toplanıyor ama analiz eden ajan yok | 🟠 ORTA |
| **Üretim Darboğaz Tespiti** | Hangi işlem adımında en çok zaman kaybedildiğini analiz eden ajan yok | 🟠 ORTA |

---

## 📊 TOPLAM SKOR KARTESİ

| Bakış Açısı | Mevcut Olgunluk | Hedef | Fark |
|-------------|:-:|:-:|:-:|
| 👔 İşletme Sahibi | ⭐⭐ (2/5) | ⭐⭐⭐⭐⭐ | Dashboard, KPI, Trend grafik eksik |
| 🔧 Saha Yöneticisi | ⭐⭐⭐ (3/5) | ⭐⭐⭐⭐⭐ | Personel atama, işlem sırası eksik |
| 💰 Mali Müdür | ⭐⭐ (2/5) | ⭐⭐⭐⭐⭐ | Hedef maliyet, birim maliyet, fire eksik |
| 🏗️ Sistem Mühendisi | ⭐⭐⭐ (3/5) | ⭐⭐⭐⭐⭐ | İki modül çakışması, realtime eksik |
| 🤖 Ajan Koordinatörü | ⭐ (1/5) | ⭐⭐⭐⭐⭐ | Üretim tabloları tamamen ajan radarı dışında |

---

## 🎯 EN ACİL 5 AKSIYON ÖNERİSİ

1. **🔴 Modül Birleşimi:** `/uretim` ve `/imalat` tek çatı altında birleştirilmeli ya da hangi akışın kullanılacağı netleştirilmeli
2. **🔴 Ajan Entegrasyonu:** `production_orders` ve `b1_imalat_emirleri` tablolarını izleyen kontrol noktaları eklenmeli (en azından Sabah Subayı + Nabız'a)
3. **🔴 Dashboard KPI:** Sayfa başına "bugün üretilen / hedef / gecikme / fire / maliyet" özet kartları eklenmeli
4. **🟡 Personel-İş Eşleştirme:** Hangi personel hangi iş emrinde çalışıyor bilgisi kaydedilmeli
5. **🟡 Fire/Zayiat Takibi:** Devir raporlarında `net_uretilen_adet` ve `zayiat_adet` gerçek verilerle doldurulmalı
