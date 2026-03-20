# 🎯 THE ORDER — CANLI SİSTEM TEST LİSTESİ

**Tarih:** 08.03.2026 | **URL:** <https://the-order-nizam.vercel.app>

✅ = Tamam | ❌ = Sorun Var | ⚠️ = Kısmen Çalışıyor | — = Test Edilmedi

---

## 🔐 BÖLÜM 1: GİRİŞ VE GÜVENLİK

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 1.1 | Patron PIN ile giriş | KARARGAH açılır, 🔑 Sistem görünür | — |
| 1.2 | Şef PIN ile giriş | Üretim sayfaları görünür, Kasa/Muhasebe GÖRÜNMEz | — |
| 1.3 | İşçi PIN ile giriş | Sadece Bandı, Kesim, Görevler görünür | — |
| 1.4 | Yanlış PIN 5 kez gir | "30 saniye kilitlendi" mesajı çıkar | — |
| 1.5 | 8 saat sonra otomatik çıkış | Sistem kendiliğinden login'e yönlendirir | — |
| 1.6 | Çıkış butonu | Sol alttaki "Çıkış" düzgün çalışır | — |
| 1.7 | Direkt URL dene (giriş yapmadan) | /muhasebe'yi direkt açmaya çalış → login'e yönlendirir | — |

---

## 🏠 BÖLÜM 2: KARARGAH (Ana Sayfa)

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 2.1 | Sayfa yükleniyor mu? | Tüm kartlar görünür | — |
| 2.2 | Sansürlü Mod butonu | Tıklayınca tutarlar görünür/gizlenir | — |
| 2.3 | Ciro rakamı doğru mu? | Gerçek verilerle uyuşuyor mu? | — |
| 2.4 | Görev atama kutusu | Görev yaz → Yayınla → Görevler'de çıkıyor mu? | — |
| 2.5 | Aktif Alarmlar | "Tamamen Temiz" veya gerçek alarm gösteriyor mu? | — |
| 2.6 | Şifre Ata butonu | Üretim/Genel PIN atama çalışıyor mu? | — |
| 2.7 | Kritik Kısayollar | 3 link tıklanıyor mu? | — |

---

## 📦 BÖLÜM 3: ÜRETİM MODÜLLERI

### M1 — Ar-Ge & Trend

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 3.1 | Sayfa açılıyor | İçerik yükleniyor | — |
| 3.2 | Trend arama | Arama sonuç getiriyor | — |

### M2 — Kumaş & Arşiv

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 3.3 | Kumaş listesi yükleniyor | Veriler görünüyor | — |
| 3.4 | Yeni kumaş ekle | Kaydediliyor ve listede çıkıyor | — |
| 3.5 | Sil butonu | PIN soruyor, siliniyor | — |

### M3 — Kalıp & Serileme

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 3.6 | Kalıp listesi | Yükleniyor | — |
| 3.7 | Yeni kalıp ekle | Kaydediliyor | — |

### M4 — Modelhane & Video

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 3.8 | Sayfa açılıyor | Model listesi görünüyor | — |
| 3.9 | Fotoğraf yükleme | Supabase Storage'a gidiyor | — |

### M5 — Kesim & Ara İşçilik

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 3.10 | Kesim emri oluştur | Kaydediliyor | — |
| 3.11 | QR kod okuma | Kamera açılıyor (mobilde) | — |

### M6 — Üretim Bandı

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 3.12 | Üretim kaydı gir | Kaydediliyor | — |
| 3.13 | Realtime test | 2 cihazda aç, birinde ekle → diğeri güncelleniyor mu? | — |

### M7 — Maliyet Merkezi

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 3.14 | Maliyet hesabı | Hesaplama doğru | — |
| 3.15 | Şef girişiyle | Sadece görüntüleyebiliyor (yazamıyor) | — |

### M8 — Muhasebe & Rapor

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 3.16 | Sadece patron görüyor | Şef girişiyle menüde çıkmıyor | — |
| 3.17 | Gelir/gider listesi | Yükleniyor | — |

---

## 🛒 BÖLÜM 4: MAĞAZA MODÜLLERİ

### M9 — Ürün Kataloğu

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 4.1 | Ürün listesi | Yükleniyor | — |
| 4.2 | Ürün ekle | Kaydediliyor | — |

### M10 — Siparişler

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 4.3 | Sipariş listesi | Yükleniyor | — |
| 4.4 | Yeni sipariş oluştur | Kaydediliyor, numarası atanıyor | — |
| 4.5 | Sipariş durumu güncelle | Değişiyor | — |

### M11 — Stok & Sevkiyat

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 4.6 | Stok listesi | Doğru rakamlar | — |
| 4.7 | Sevkiyat kaydı | Stoktan düşüyor | — |

### M12 — Kasa & Tahsilat

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 4.8 | Sadece patron görüyor | Şef/İşçi girişiyle menüde YOK | — |
| 4.9 | Tahsilat gir | Kaydediliyor, bakiye güncelleniyor | — |

---

## 👥 BÖLÜM 5: YÖNETİM MODÜLLERİ

### M13 — Müşteri CRM

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 5.1 | Müşteri listesi | Yükleniyor | — |
| 5.2 | Yeni müşteri | Kaydediliyor | — |
| 5.3 | Risk skoru | Hesaplanıyor | — |

### M14 — Personel & Prim

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 5.4 | Personel listesi | Yükleniyor | — |
| 5.5 | Prim hesapla | Doğru hesaplıyor | — |
| 5.6 | Maaş bilgisi | Şef sadece görüntüleyebiliyor | — |

### M15 — Görev Takibi

| # | Test | Beklened Sonuç | Durum |
|---|---|---|---|
| 5.7 | Görev listesi | Yükleniyor | — |
| 5.8 | Görev tamamla | Durumu değişiyor | — |
| 5.9 | Offline test | İnternet kes → Görev ekle → Aç → Senkronize oluyor mu? | — |

### M16 — Raporlar

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 5.10 | Rapor sayfası | Grafik/tablo yükleniyor | — |
| 5.11 | Tarih filtresi | Filtreleme çalışıyor | — |

---

## 🤖 BÖLÜM 6: SİSTEM MODÜLLERİ

### Ajan Komuta (AI)

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 6.1 | Sadece patron görüyor | Şef/İşçi menüde göremez | — |
| 6.2 | AI analiz çalıştır | Sonuç geliyor | — |

### Müfettiş (AI)

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 6.3 | Denetim raporu | Yükleniyor | — |

### Güvenlik

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 6.4 | Giriş logları | Yapılan girişler görünüyor | — |
| 6.5 | PIN değiştir | Eski PIN doğruysa yeni PIN kabul ediyor | — |
| 6.6 | Erişim tablosu | Kim nereye girebilir görünüyor | — |

### Sistem Ayarları

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 6.7 | Ayar kaydet | Değişiklik kaydediliyor | — |
| 6.8 | Offline iken kaydet | İnternet yokken → Kuyrukta bekliyor | — |

---

## 📱 BÖLÜM 7: MOBİL UYUMLULUK

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 7.1 | Telefonda giriş yap | Giriş sayfası düzgün görünüyor | — |
| 7.2 | Hamburger menü | Sol menü açılıp kapanıyor | — |
| 7.3 | Menü ikonları | Dokunulabilir boyutta | — |
| 7.4 | Tablette tam ekran | Sidebar ve içerik yan yana | — |
| 7.5 | Üretim bandı mobilde | Form alanları kullanılabilir | — |
| 7.6 | Kamera özelliği | M4/M5'te kamera butonu çalışıyor | — |

---

## 🌐 BÖLÜM 8: BAĞLANTI VE OFFLINE

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 8.1 | İnternet kes (Wi-Fi kapat) | Kırmızı "BAĞLANTI KOPTU" balonu çıkıyor | — |
| 8.2 | Offline iken veri gir | Sistem çalışmaya devam ediyor | — |
| 8.3 | İnternet aç | "X işlem aktarıldı" bildirimi çıkıyor | — |
| 8.4 | Yavaş internet simüle et | Sayfa yükleniyor (timeout olmuyor mu?) | — |

---

## ⚡ BÖLÜM 9: PERFORMANS

| # | Test | Beklenen Sonuç | Durum |
|---|---|---|---|
| 9.1 | İlk açılış süresi | 3 saniyeden az | — |
| 9.2 | Sayfa geçişleri | Anlık geçiş | — |
| 9.3 | 2 cihaz aynı anda | Realtime güncellemeler çakışmıyor | — |
| 9.4 | 100 kayıtlı liste | Scroll yapılabiliyor, donmuyor | — |

---

## 📋 TEST SONUÇ ÖZETİ

| Bölüm | Toplam | ✅ | ❌ | ⚠️ |
|---|---|---|---|---|
| 1. Giriş/Güvenlik | 7 | | | |
| 2. Karargah | 7 | | | |
| 3. Üretim M1-M8 | 18 | | | |
| 4. Mağaza M9-M12 | 9 | | | |
| 5. Yönetim M13-M16 | 11 | | | |
| 6. Sistem | 8 | | | |
| 7. Mobil | 6 | | | |
| 8. Offline | 4 | | | |
| 9. Performans | 4 | | | |
| **TOPLAM** | **74** | | | |

---

> **Not:** ❌ veya ⚠️ işaretli her satırı bana bildirin.
> Genellikle 10-30 dakikada düzeltip canlıya alıyorum.
