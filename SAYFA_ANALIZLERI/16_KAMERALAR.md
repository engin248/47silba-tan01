# KAMERALAR & ENDÜSTRİYEL AI İZLEME (M16) — Detaylı Sayfa Analizi
**Rota:** `/kameralar` | **Dosya:** `src/features/kameralar/components/KameralarMainContainer.js`  
**Toplam:** 627 satır  
**Görev:** 12 kameralı NVR sistemini WebRTC ile canlı izle, AI hareket analizi yap, anomali tespitinde Telegram'a görüntü gönder.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `GO2RTC_URL` ENV değişkeni (fallback: localhost:1984) | VAR | satır 16 |
| 12 kameralı NVR listesi (Neutron NEU-NVR116-SHD) | VAR | satır 20-33 |
| 4 Rol kategorisi (processing/qa/storage/security) | VAR | satır 35-41 |
| `cameras` tablosundan DB kamera listesi çekme | VAR | satır 158-163 |
| Varsayılan kamera listesi (DB boşsa fallback) | VAR | satır 165 |
| `/api/stream-durum` 10sn'de bir poll | VAR | satır 175-182 |
| `camera_events` tablosundan AI olay log çekme | VAR | satır 188-197 |
| Realtime WebSocket (`camera_events` INSERT dinle) | VAR | satır 205-229 |
| Anomali tespiti → `goster()` + erişim log | VAR | satır 212, 215-221 |
| AI Olay panel güncelleme (realtime) | VAR | satır 224 |
| `useMotionDetection` hook (AI hareket analizi) | VAR | satır 66-69 |
| Uyku modu (3dk hareketsiz → stream durdur) | VAR | satır 109-138 |
| Sekme gizleme (visibilityAPI → stream durdur) | VAR | satır 111-113 |
| Kamera erişim log (`camera_access_log`) | VAR | satır 85-93 |
| Snapshot → go2rtc frame.jpeg → Telegram | VAR | satır 243-283 |
| Snapshot → `camera_events` INSERT | VAR | satır 274-280 |
| Rol filtresi (tüm/üretim/kalite/depo/güvenlik) | VAR | satır 286-288 |
| Odak ekranı (kamera tam ekrana al) | VAR | satır 237-239, 414-448 |
| AI hareket skoru (%) progress bar | VAR | satır 530-582 |
| AI alarm geçmişi listesi | VAR | satır 585-614 |
| go2rtc kapalı uyarısı + kurulum talimatı | VAR | satır 400-411 |
| `CameraPlayer` bileşeni (HLS/WebRTC) | VAR | satır 13, 444, 497 |
| Arapça dil desteği | VAR | satır 307 |
| Herhangi bir giriş yapmış kullanıcı erişebilir | VAR | satır 143 — NOT: Bu güvenlik riski! |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. GO2RTC_URL — TEMEL SORUN

**Satır 16:**
```js
const GO2RTC_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GO2RTC_URL) || 'http://localhost:1984';
```
`NEXT_PUBLIC_GO2RTC_URL` Vercel ortamında tanımlı değil. Fallback: `http://localhost:1984` — bu Vercel serverless ortamında **hiçbir anlam ifade etmez**. Vercel'de localhost yok.

**Sonuç:** `snapshotGonder()` içindeki (satır 251):
```js
const frameUrl = `${GO2RTC_URL}/api/frame.jpeg?src=${kam.src}_main`;
```
Bu URL her zaman `http://localhost:1984/api/frame.jpeg?src=d1_main` → bağlantı zaman aşımı → Telegram'a görüntü gitmiyor.

### 2. `cameras` TABLOSU BÜYÜK OLASIYLIKLA BOŞ

**Satır 158-165:**
```js
const { data, error } = await supabase.from('cameras').select('*')...
if (!error && data && data.length > 0) {
    setKameralar(data);
}
// Tablo yoksa veya boşsa VARSAYILAN_KAMERALAR kullanılmaya devam eder
```
`cameras` tablosu Supabase'de oluşturuldu mu? Eğer tablo yok veya boşsa (en olası senaryo), `VARSAYILAN_KAMERALAR` kullanılıyor — bu **hardcoded** IP'ler gerçek sahaya eşleşiyor mu? `192.168.1.201-212` IP aralığı gerçek NVR yapılandırmasıyla örtüşüyor mu?

### 3. `/api/stream-durum` ENDPOİNTİ — NE KONTROL EDİYOR?

Karargah ve Kameralar sayfaları düzenli olarak `/api/stream-durum`'a istek atıyor. Bu endpoint go2rtc sunucusuna erişip erişemediğini mi kontrol ediyor, yoksa sadece bir durum değişkeni mi döndürüyor? İçeriği incelenmedi — go2rtc sunucusu Vercel'de değil, yerel ağda çalışıyorsa uzak erişimde bu endpoint her zaman `kapali` dönecek.

### 4. HAREKET TESPİTİ — NASIL ÇALIŞIYOR?

**Satır 66-69:**
```js
const hareketDurumlari = useMotionDetection(
    kameralar,
    yetkili && !isTabHidden && !isIdle && streamDurum === 'aktif'
);
```
`useMotionDetection` hook'u kameralara bakıyor ama stream aktif değilse çalışmıyor (`streamDurum === 'aktif'` koşulu). go2rtc çevrimdışı olduğu için bu hook hiçbir zaman çalışmıyor → AI hareket analizi tamamen devre dışı.

### 5. ERİŞİM LOG GÜVENLİK AÇIĞI

**Satır 142-148:**
```js
// sisteme giriş yapmış herhangi bir kullanıcı erişebilir
const yetkiliGrup = !!kullanici;
```
Üretim sahası kameralarına herhangi bir giriş yapmış kullanıcı erişebiliyor. Sınırlı rol/tam rol ayrımı yok. Bu diğer tüm modüllerin güvenlik modeliyle çelişiyor — tüm modüller `kullanici?.grup === 'tam'` kontrol ediyor.

### 6. `camera_access_log` TABLOSU VAR MI?

**Satır 86-93:**
```js
await supabase.from('camera_access_log').insert([{ ... }])
```
Hata `catch` ile yutulmuş: `// tablo henüz yoksa sessizce geç`. Log kaydı büyük olasılıkla atılmıyor.

### 7. AI ALARM `metadata.kamera_adi` KOLONU

**Satır 602:**
```js
{olay.metadata?.kamera_adi || `Kamera #${olay.camera_id}`}
```
`camera_events` tablosunun `metadata` kolonu JSONB mi? Bu şema Supabase'de tanımlı mı? Belgelenmemiş. `useMotionDetection` hook'u bu kolona ne zaman yazıyor?

### 8. ANA SORUN ÖZETİ: GO2RTC TÜNEL YÜKSELTME EKSİK

Sistemin tüm kamera özelliği aşağıdaki zincire bağlı:
```
NVR (192.168.1.200) → go2rtc (yerel sunucu) → Vercel domain üzerinden erişim
```
Bu zincirin **ortası kurulmamış**. go2rtc yerel ağda çalışıyor, Vercel'e tünel açılmamış. `ngrok`, `cloudflare tunnel` veya sabit IP yönlendirme olmadan kameralar internetten erişilemez.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Mevcut | Sorun |
|--------|-------|--------|-------|
| NVR → go2rtc | TASARLANDI | Tünel kurulmamış |
| go2rtc → Kameralar sayfası | TASARLANDI | `GO2RTC_URL` localhost |
| Kamera → Anomali → Telegram | TASARLANDI | Stream kapı olduğu için çalışmıyor |
| Kamera → İmalat (bant durma) | TASARLANDI | `useMotionDetection` pasif |
| Kamera → `camera_access_log` | TASARLANDI | Tablo muhtemelen yok |
| Kamera → Karargah (stream durum) | VAR | 30sn'de bir `/api/stream-durum` |

---

## ❌ MEVCUT KOD SORUNLARI

| # | Kod Konumu | Sorun |
|---|-----------|-------|
| 1 | satır 16 | `GO2RTC_URL` Vercel'de `localhost:1984` → çalışmaz |
| 2 | satır 143 | Herhangi kullanıcı kameralara erişebilir — güvenlik açığı |
| 3 | satır 93 | `camera_access_log` tablosu muhtemelen yok, log atılmıyor |
| 4 | satır 68 | `streamDurum === 'aktif'` koşulu hareket tespitini engelliyor |
| 5 | satır 183 | `kumasMtFiyat` hatalı satır (Kesimhane kodu, buraya karışmış?) |

---

## 📋 BİLGİ AKIŞI HARİTASI (GERÇEK DURUMU)

```
NVR (192.168.1.200) ─→ go2rtc (yerel, port 1984)
                               ↓ [TÜNEL YOK]
                       NEXT_PUBLIC_GO2RTC_URL
                       = http://localhost:1984  ← HATALI
                               ↓
                    CameraPlayer → Video görünmüyor
                               ↓
                    useMotionDetection
                    (streamDurum = 'kapali')
                    → Hareket analizi ÇALIŞMIYOR
                               ↓
                    Snapshot → localhost:1984  → TIMEOUT
                    Telegram'a görüntü gitmiyor
```

**Çalışan tek şey:** Sayfa tasarımı (4 rol filtresi, kamera grid UI, erişim log paneli).

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Cloudflare Tunnel kurulumu** → go2rtc'yi internete açmanın en güvenli yolu
- [ ] **AI nesne tanıma** → Kişi sayısı, bant hızı tespiti (OpenCV/YOLO)
- [ ] **Video kaydı arşivi** → Son 7-30 gün kayıtları Supabase Storage'a
- [ ] **Çok lokasyon** → Fason firmaların kameralarını da buradan izle
- [ ] **İmalat bant verimliliği** → Kameradan otomatik dakikada adet sayma
- [ ] **Devam sistemi entegrasyonu** → Yüz tanıma ile giriş/çıkış kaydı
- [ ] **Mobil push bildirim** → Anomali tespitinde telefona anlık görüntü
