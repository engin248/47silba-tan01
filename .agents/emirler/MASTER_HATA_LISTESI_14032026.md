# THE ORDER / NIZAM — MASTER HATA ve EKSİK LİSTESİ
Tarih: 14.03.2026 | Kaynak: 4 Analiz Raporu + Tarayıcı Kontrolü + Kod Analizi
Hazırlayan: ANTIGRAVITY

---

## 🔴 KRİTİK HATALAR — ACİL (Canlıyı Etkiliyor)

### GÜVENLİK
| # | Hata | Risk | Çözüm |
|---|---|---|---|
| G1 | PIN (4747) localStorage'da DÜZ METİN | F12 ile herkes görür | bcrypt / SHA-256 hash |
| G2 | Brute force koruması YOK | Bot saniyede 1000 deneme yapar | Rate limit + kilit |
| G3 | Ajan sistemi Service Role Key ile çalışıyor | Ajan yanlış karar → kasa/personel SİLİNEBİLİR | Anon Key + RLS policy |
| G4 | Telegram webhook imzası YOK | Dışarıdan sahte POST → sistem uyarılır | HMAC-SHA256 doğrulama |
| G5 | CSRF token YOK | API kötüye kullanıma açık | Next.js CSRF middleware |
| G6 | JWT_SIRRI = null / boş | Tüm token doğrulama geçersiz | Vercel env'e ekle |
| G7 | COORDINATOR_PIN = 9999 (test değeri) | Üretimde test PIN kaldı | Gerçek PIN'e değiştir |

### VERİ VE BAĞLANTI
| # | Hata | Risk | Çözüm |
|---|---|---|---|
| V1 | Karargâh KPI kartları HARDCODE | Yönetici yanlış kararlar alır | Supabase'den gerçek sorgu — DÜZELTİLDİ ✅ (push bekleniyor) |
| V2 | Karargâh alarm listesi HARDCODE | Gerçek riskler görünmüyor | b1_sistem_uyarilari sorgusu — DÜZELTİLDİ ✅ |
| V3 | Karargâh RAM=%32, DB=12ms HARDCODE | Yanıltıcı sistem sağlık bilgisi | Gerçek ping ölçümü — DÜZELTİLDİ ✅ |
| V4 | M6 Üretim → M8 Muhasebe köprüsü KİRIK | Üretim bitince muhasebe görmüyor | Veri aktarım API'si yazılmalı |
| V5 | /uretim sayfası ÇÖKMÜŞ | v2_users tablosu yok → TypeError | Tablo oluşturulmalı veya sorgu düzeltilmeli |
| V6 | M5 Kesim → M6 Üretim bağlantısı YOK | Barkodla geçiş yok, elle yazılıyor | QR/Barkod entegrasyonu |
| V7 | M7 Maliyet → M8 Muhasebe bağlantısı YOK | Maliyet rakamı muhasebede görünmüyor | Köprü API |

### ALTYAPI
| # | Hata | Risk | Çözüm |
|---|---|---|---|
| A1 | go2rtc kamera sunucusu KAPALI | 12 kameranın tamamı offline | BASLAT.bat çalıştır |
| A2 | Modelhane API bağlantı hatası | "Ağ veya sunucu hatası: yükleme başarısız" | API log incelenmeli |
| A3 | Vercel env değişkenleri eksik (SUPABASE keys, TELEGRAM_BOT_TOKEN) | Canlıda bazı özellikler çalışmıyor olabilir | Vercel dashboard'dan doldur |

---

## 🟡 ÖNEMLİ EKSİKLER

### FONKSİYONEL EKSİKLER
| # | Eksik | Etki |
|---|---|---|
| F1 | QR/Barkod — M5 Kesimhane, M6 Üretim, M11 Stok'ta YOK | Tüm geçişler elle yazılıyor |
| F2 | Fire oranı M5'te otomatik hesaplanmıyor | Operatöre manuel matematik yükleniyor |
| F3 | M9 Katalog'da ürün fotoğrafı upload YOK | Katalog işlevsiz |
| F4 | M10 Katalog → M12 Sipariş fiyat otomatik gelmiyor | Elle girilmek zorunda |
| F5 | M12 Kasa'da KDV, USD/EUR, Kasa/Banka ayrımı YOK | Muhasebe hatalı çıkacak |
| F6 | Telegram throttle YOK | Çok alarm gelirse telefon kullanılamaz hale gelir |
| F7 | Siparişler sayfasında +%34.2 göstergesi HARDCODE | Sahte sinyal |
| F8 | Karargâh Bant Akışı HARDCODE renkler | Gerçek üretim durumu yansımıyor — DÜZELTİLMEDİ |
| F9 | M16 Raporlar %15 tamamlanmış, veri gelmiyor | Raporlar işlevsiz |
| F10 | M19 Güvenlik sayfası neredeyse boş | Güvenlik yönetimi yok |
| F11 | Karargâh'ta Telegram bot mesaj gönderme paneli yok | Bot sadece gönderir, alınamaz |
| F12 | Ses uyarısı (alarm sesi) yok | Gürültülü fabrikada alarm kaçırılır |
| F13 | Sistemi durdur/başlat acil komutu yok | Acil durumda tek nokta müdahale yok |

### TEMA / UX EKSİKLERİ
| # | Modül | İhlal |
|---|---|---|
| T1 | M4 Modelhane | Numune butonu kırmızı (Gold olmalı) |
| T2 | M5 Kesimhane | Ana butonlar macenta/pembe |
| T3 | M7 Maliyet | Turkuaz/mavi butonlar |
| T4 | M8 Muhasebe | "Karargâha Dön" butonu MOR |
| T5 | M9 Katalog | "+ Yeni Ürün" PARLAK PEMBE |
| T6 | M10 Siparişler | Ana butonlar TURUNCU |
| T7 | M12 Kasa | Finans ekranında emoji seli |
| T8 | M16 Raporlar | Geri butonu KIRMIZI |

### JARGON TEMİZLİĞİ GEREKLİ
| Mevcut | Olması Gereken |
|---|---|
| "Liyakat Hakemi" | "Bant Kuralları" |
| "D-E Karargâh Devir" | "Depoya Teslim" |
| "SAP/NetSuite Standardı" | Kaldırılmalı |
| "Koordinatör Kararı" | "Yönetici Onayı" |
| "Yapay Göz Radarı" | "Kamera Sistemi" |

---

## ✅ ÇALIŞAN SİSTEMLER

| Modül | Durum |
|---|---|
| M1 Ar-Ge / Trend | ✅ %90 — En olgun modül |
| Kumaş Arşivi | ✅ Supabase bağlı, veri geliyor |
| Personel | ✅ 1 kayıt, maaş hesabı çalışıyor |
| Ajanlar | ✅ 2 tamamlanmış görev, log var |
| Katalog | ✅ 2 test ürünü, fiyat gizleme çalışıyor |
| Giriş Sayfası | ✅ Şifre sistemi, dil seçimi çalışıyor |
| Genel Tema | ✅ Zümrüt/Gold/Mavi tutarlı |
| Middleware JWT | ✅ HMAC-SHA256 Edge Runtime |
| Zod Şemaları | ✅ 12 şema formları koruyor |
| Telegram Bot | ✅ Entegrasyon var (throttle eklenecek) |

---

## 📊 SİSTEM PUANI (4 Rapor Ortalaması)

| Eksen | Puan |
|---|---|
| Mimari Kalite | 85/100 ✅ |
| UI/UX Tutarlılık | 55/100 🟠 |
| Güvenlik | 35/100 🔴 |
| Modüller Arası Akış | 30/100 🔴 |
| AI / Ajan Sistemi | 65/100 🟡 |
| Operasyonel Verimlilik | 45/100 🟠 |
| **GENEL** | **~53/100** 🟠 |

---

## ⚡ ACİL EYLEM SIRASI

### FAZ-0 — Bugün (3-4 Saat)
1. Vercel Dashboard → eksik ENV değişkenleri doldur
2. PIN → bcrypt hash
3. Ajan Service Role → sınırlı yetkiye geç
4. Telegram HMAC imza ekle
5. Git push → Karargâh düzeltmeleri canlıya geç

### FAZ-1 — Bu Hafta
1. M6→M8 veri köprüsü
2. /uretim sayfası hatası düzelt
3. go2rtc sunucu kalıcı çalıştırma
4. Modelhane API hatası çöz
5. QR/Barkod altyapısı başlat

### FAZ-2 — 2 Hafta
1. Tema düzeltmeleri (8 modül)
2. Jargon temizliği
3. M12 Kasa para birimi, KDV
4. M16 Raporlar veri bağlantısı
5. M19 Güvenlik sayfası
