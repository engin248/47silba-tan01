# KAMERA SİSTEMİ KURULUM REHBERİ

# Neutron NEU-NVR116-SHD @ 192.168.1.200 — 12 Kanal

---

## ADIM 1 — go2rtc İNDİR

1. Şu adresten Windows versiyonunu indir:
   <https://github.com/AlexxIT/go2rtc/releases/latest>

   İndirilecek dosya: `go2rtc_win64.exe`

2. İndirilen dosyayı şu klasöre koy:
   `C:\Users\Admin\Desktop\47_SIL_BASTAN_01\stream-server\go2rtc.exe`

---

## ADIM 2 — go2rtc BAŞLAT

stream-server klasöründeki `BASLAT.bat` dosyasına çift tıkla.
VEYA terminalde:

```
cd C:\Users\Admin\Desktop\47_SIL_BASTAN_01\stream-server
go2rtc.exe -config go2rtc.yaml
```

Başarılı olursa:

- Terminal: `go2rtc version X.X.X`
- Web arayüzü: <http://localhost:1984>
- Kamera akışları orada görünür

---

## ADIM 3 — DIŞ ERİŞİM (Cloudflare Tunnel)

Fabrika dışından da kameraları görmek için:

### 3A — Cloudflare Tunnel İndir
<https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/>

Windows: `cloudflared-windows-amd64.exe` indir

### 3B — Giriş Yap

```
cloudflared login
```

### 3C — Tünel Başlat

```
cloudflared tunnel --url http://localhost:1984
```

Çıktıda şöyle bir URL verir:
`https://xxxxx.trycloudflare.com`

### 3D — .env.local Güncelle

Bu URL'yi `.env.local` dosyasına ekle:

```
NEXT_PUBLIC_GO2RTC_URL=https://xxxxx.trycloudflare.com
```

Vercel'e de ekle:
Vercel Dashboard → Settings → Environment Variables

---

## ADIM 4 — SUPABASE TABLOLARI

Supabase SQL Editor'da şunu çalıştır:

```sql
-- Kamera listesi tablosu
CREATE TABLE IF NOT EXISTS cameras (
  id          SERIAL PRIMARY KEY,
  nvr_kanal   TEXT,
  name        TEXT NOT NULL,
  src         TEXT NOT NULL,
  role        TEXT DEFAULT 'security',
  status      TEXT DEFAULT 'online',
  work_center TEXT,
  ip          TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Erişim log tablosu
CREATE TABLE IF NOT EXISTS camera_access_log (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id),
  kullanici_adi TEXT,
  islem_tipi    TEXT,
  kamera_adi    TEXT,
  ip_adresi     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Kamera olayları tablosu
CREATE TABLE IF NOT EXISTS camera_events (
  id          SERIAL PRIMARY KEY,
  camera_id   INTEGER REFERENCES cameras(id),
  event_type  TEXT,
  video_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 12 Kamerayı kaydet
INSERT INTO cameras (nvr_kanal, name, src, role, status, work_center, ip) VALUES
  ('D1',  'Ana Giriş',       'd1',  'security',   'online', 'Güvenlik', '192.168.1.201'),
  ('D2',  'Kesim Masası A',  'd2',  'processing', 'online', 'Kesimhane', '192.168.1.202'),
  ('D3',  'Dikim Bandı 1',   'd3',  'processing', 'online', 'İmalat', '192.168.1.203'),
  ('D4',  'Dikim Bandı 2',   'd4',  'processing', 'online', 'İmalat', '192.168.1.204'),
  ('D5',  'Kalite Kontrol',  'd5',  'qa',         'online', 'KK Birimi', '192.168.1.205'),
  ('D6',  'Ütü & Paketleme', 'd6',  'qa',         'online', 'KK Birimi', '192.168.1.206'),
  ('D7',  'Kumaş Deposu',    'd7',  'storage',    'online', 'Depo', '192.168.1.207'),
  ('D8',  'Yükleme Alanı',   'd8',  'storage',    'online', 'Depo', '192.168.1.208'),
  ('D9',  'Üretim Koridoru', 'd9',  'security',   'online', 'Güvenlik', '192.168.1.209'),
  ('D10', 'Depo Girişi',     'd10', 'storage',    'online', 'Depo', '192.168.1.210'),
  ('D11', 'Makine Alanı',    'd11', 'processing', 'online', 'İmalat', '192.168.1.211'),
  ('D12', 'Ofis / Yönetim',  'd12', 'security',   'online', 'Güvenlik', '192.168.1.212')
ON CONFLICT DO NOTHING;
```

---

## ADIM 5 — TEST

1. go2rtc çalışıyor mu? → <http://localhost:1984>
2. NVR erişilebilir mi? → <http://192.168.1.200>
3. Uygulama açık → <https://demirtekstiltheonder.com/kameralar>
4. Stream yeşil (aktif) görünüyor mu?

---

## NVR BİLGİLERİ

| Alan | Değer |
|------|-------|
| IP | 192.168.1.200 |
| Port | 554 (RTSP) |
| Kullanıcı | admin |
| Şifre | tuana1452. |
| Model | Neutron NEU-NVR116-SHD |
| Kanal sayısı | 12 (D1-D12 aktif) |

## RTSP URL FORMATI

```
rtsp://admin:tuana1452.@192.168.1.200:554/unicast/c{KANAL}/s{STREAM}/live

KANAL: 1-12 (D1=1, D2=2 ...)
STREAM: 0 = main (1080p/25fps), 1 = sub (360p/10fps)
```

---

## SORUN GİDERME

| Sorun | Çözüm |
|-------|-------|
| "Stream Kapalı" uyarısı | go2rtc.exe'yi başlat |
| "Kamera Offline" | NVR'ı kontrol et (192.168.1.200) |
| Dışardan erişilemiyor | Cloudflare Tunnel'ı başlat |
| Port 1984 meşgul | `netstat -ano | findstr 1984` |
