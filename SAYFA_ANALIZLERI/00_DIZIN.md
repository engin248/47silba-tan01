# SAYFA ANALİZLERİ — DİZİN VE ÖZET
**Analiz Tarihi:** 2026  
**Toplam Modül:** 25  
**Analiz Yöntemi:** Kaynak kodu satır satır inceleme + canlı ortam kontrolü

---

## 📁 DOSYA DİZİNİ

| # | Dosya | Modül | Kritik Sorun |
|---|-------|-------|--------------|
| 00 | `00_KARARGAH.md` | **Karargah (M0)** | KPI'lar hardcoded, veri bağlantısı yok |
| 01 | `01_ARGE.md` | **AR-GE / İstihbarat (M1)** | Scraper çalışmıyor (merge conflict) |
| 02 | `02_KUMAS.md` | **Kumaş & Malzeme (M2)** | Arama çalışmıyor, KPI hardcoded |
| 03 | `03_KALIP.md` | **Kalıp & Planlama (M3)** | Model durumu değiştirilemiyor |
| 04 | `04_IMALAT.md` | **İmalat / Bant (M4)** | Kronometre HARDCODED (42dk × ₺4) |
| 04B | `04B_MODELHANE.md` | **Modelhane** | Sadece 1. adım kaydediliyor |
| 05 | `05_KESIM.md` | **Kesim (M5)** | Fire stok düşümü yok |
| 06 | `06_KASA.md` | **Kasa (M6)** | Tablo boş, KPI ₺0 |
| 07 | `07_MALIYET.md` | **Maliyet (M7)** | Kumaş fiyat otomasyonu yok |
| 08 | `08_MUHASEBE.md` | **Muhasebe (M8)** | `MUHASEBECI_KILITLI` ≠ `kilitlendi` (bug) |
| 09 | `09_SIPARISLER.md` | **Siparişler (M9)** | Kanal % hardcoded, karlılık sütunu yok |
| 10 | `10_MUSTERILER.md` | **Müşteriler CRM (M10)** | Segment otomasyonu yok, URL parametresi işlenmiyor |
| 11 | `11_STOK.md` | **Depo & Stok (M11)** | Çift sayım riski (stok_adeti + hareketler) |
| 12 | `12_KATALOG.md` | **Ürün Kataloğu (M12)** | USD kuru eski (32.5), maliyet çekme koşulu yanlış |
| 13 | `13_PERSONEL.md` | **Personel (M13)** | Realtime tüm şemayı dinliyor (performans) |
| 15 | `15_RAPORLAR.md` | **Raporlar (M15)** | P&L ₺0 (kasa boş) |
| 16 | `16_KAMERALAR.md` | **Kameralar (M16)** | URL yazım hatası → TÜM KAMERALAR ÇALIŞMIYOR |
| 17-19 | `17_18_19_*.md` | **Ajanlar / Görevler / Haberleşme** | Cron eksik, ajan çöküyor |
| 20-23 | `20_21_22_23_*.md` | **Güvenlik / Denetmen / Tasarım / Ayarlar** | dev_secret fallback, 2FA yok |

---

## 🔴 ACİL MÜDAHALE GEREKTİREN 10 KRİTİK SORUN

| Öncelik | Sorun | Dosya |
|---------|-------|-------|
| 🔴 1 | **Kamera URL yazım hatası** → `theondercom` | 16_KAMERALAR.md |
| 🔴 2 | **İmalat kronometre hardcoded** → her iş ₺168 | 04_IMALAT.md |
| 🔴 3 | **Scraper git merge conflict** → veri bankası boş | 01_ARGE.md |
| 🔴 4 | **`MUHASEBECI_KILITLI` ≠ `kilitlendi`** → M8-M12 köprüsü kırık | 08_MUHASEBE.md + 12_KATALOG.md |
| 🔴 5 | **`dev_secret` fallback** → production güvenlik açığı | 20_GUVENLIK.md |
| 🟠 6 | **Karargah tüm KPI'lar hardcoded** → yanıltıcı panel | 00_KARARGAH.md |
| 🟠 7 | **Stok çift sayım riski** → envanter yanlış gösterilebilir | 11_STOK.md |
| 🟠 8 | **Kumaş arama bağlantısız** → çalışmıyor | 02_KUMAS.md |
| 🟠 9 | **Cron'lar vercel.json'dan eksik** → otomasyon yok | 17_AJANLAR.md |
| 🟡 10 | **Kanal % siparişlerde hardcoded** → yanlış grafik | 09_SIPARISLER.md |
