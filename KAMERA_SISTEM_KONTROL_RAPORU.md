# 🔍 KAMERA SİSTEMİ — TAM KONTROL RAPORU
**Tarih:** 13 Mart 2026 — 08:02  
**Sistem:** THE ORDER / NIZAM M18 Kameralar

---

## KATMAN 1 — KOD MİMARİSİ

| Bileşen | Dosya | Durum | Not |
|---|---|---|---|
| Sayfa Route | `src/app/kameralar/page.js` | ✅ TAM | |
| Ana Container | `KameralarMainContainer.js` | ✅ TAM | 627 satır |
| Video Player | `CameraPlayer.js` | ✅ TAM | Lazy load + reconnect |
| Hareket Hook | `useMotionDetection.js` | ✅ TAM | 2dk hareketsizlik → alarm |
| Stream API | `/api/stream-durum/route.js` | ✅ TAM | go2rtc health check |
| Telegram Bildirim | `/api/telegram-bildirim/route.js` | ✅ TAM | Spam kalkanı var |
| Telegram Foto | `/api/telegram-foto/route.js` | ✅ TAM | |
| Sidebar Nav | `ClientLayout.js` → M18 | ✅ TAM | |
| Auth Guard | `auth.js` → /kameralar | ✅ TAM | |
| Supabase Client | `lib/supabase.js` | ✅ TAM | `.trim()` var |

---

## KATMAN 2 — SUPABASE VERİTABANI

### Gerekli Tablolar

| Tablo | SQL Dosyası | Durum |
|---|---|---|
| `cameras` | `KAMERA_SQL_KURULUM.sql` | ❓ KONTROL GEREKLİ |
| `camera_events` | `13_SIFIR_HATA_KAMERA_TABLO.sql` | ❓ KONTROL GEREKLİ |
| `camera_access_log` | `KAMERA_SQL_KURULUM.sql` | ❓ KONTROL GEREKLİ |
| `b0_api_spam_kalkani` | `08_KARARGAH_API_SPAM_ZIRHI.sql` | ❓ KONTROL GEREKLİ |
| `b1_sistem_ayarlari` | Çeşitli | ❓ KONTROL GEREKLİ |

> **NOT:** Bu tablolar olmadan sistem çökmez ama işlevleri devre dışı kalır.
> `cameras` tablosu yoksa VARSAYILAN_KAMERALAR listesi kullanılır (kod güvenli).
> `camera_events` yoksa AI alarm logu yazılamaz.
> `b0_api_spam_kalkani` yoksa Telegram bildirimi tamamen engellenir.

---

## KATMAN 3 — ORTAM DEĞİŞKENLERİ (.env.local)

### KRİTİK: TELEGRAM TOKEN EKSİK

```
.env.local dosyasında:
TELEGRAM_BOT_TOKEN=  ← YOK
TELEGRAM_CHAT_ID=    ← YOK
```

Mevcut olan (sahte/test değeri):
```
TELEGRAM_BOT_TOKEN="1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
```
Bu değer TEST değeri, gerçek değil. Telegram çalışmayacak.

### SUPABASE ANAHTARLARI — \r\n SORUNU
`.env.local` Vercel CLI tarafından oluşturulmuş. Bazı değerlerde `\r\n` var:
```
NEXT_PUBLIC_SUPABASE_URL="https://...co\r\n"
```
`lib/supabase.js` zaten `.trim()` kullanıyor → TEMİZLENİYOR ✅

### GO2RTC URL
```
NEXT_PUBLIC_GO2RTC_URL=http://localhost:1984  ← Doğru (local için)
```

---

## KATMAN 4 — STREAM SUNUCUSU (go2rtc)

| Kontrol | Durum |
|---|---|
| `stream-server/go2rtc.yaml` | ✅ 12 kanal tanımlı |
| `stream-server/BASLAT.bat` | ✅ Başlatıcı hazır |
| `stream-server/go2rtc.exe` | ❌ EKSİK — indirilmedi |
| NVR (192.168.1.200) | ❓ Fabrika ağında olunca erişilir |

> go2rtc.exe olmadan "Stream Kapalı" uyarısı verir.
> Uygulama çökmez — fallback ile devam eder.

---

## ÖZET — BLOKE NOKTALAR

### Blok 1: go2rtc.exe EKSİK (Fabrika Ağı)
- **Etki:** Canlı video yok, AI hareket tespiti pasif
- **Çözüm:** go2rtc_win64.exe indir → stream-server/ klasörüne koy → BASLAT.bat çalıştır
- **Link:** https://github.com/AlexxIT/go2rtc/releases/latest

### Blok 2: Telegram Token YANLIŞ
- **Etki:** Snapshot Telegram'a gitmiyor, AI alarm Telegram'a gitmiyor
- **Çözüm:** Gerçek TELEGRAM_BOT_TOKEN ve TELEGRAM_CHAT_ID .env.local ve Vercel'e eklenmeli

### Blok 3: Supabase Tablolarının varlığı bilinmiyor
- **Etki:** AI olay logu yazılamıyor, erişim logu yazılamıyor
- **Çözüm:** Aşağıdaki SQL Supabase'de çalıştırılmalı

---

## SUPABASE SQL — GEREKLİ TABLOLAR KONTROL

Supabase SQL Editor'de şunu çalıştır:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('cameras', 'camera_events', 'camera_access_log', 'b0_api_spam_kalkani', 'b1_sistem_ayarlari')
ORDER BY table_name;
```

Bu sorgu hangi tabloların var olduğunu gösterir.
