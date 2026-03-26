# GÜVENLİK — ERİŞİM & KİMLİK YÖNETİMİ (M20) — Detaylı Sayfa Analizi
**Rota:** `/guvenlik` | **Dosya:** `src/features/guvenlik/components/GuvenlikMainContainer.js`  
**Toplam:** 456 satır  
**Görev:** PIN tabanlı kimlik yönetimi, yetki grupları, giriş logları, hatalı giriş kilitleme, erişim matrisi görünümü.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 3 Yetki grubu (tam/uretim/genel) | VAR | satır 125-130 |
| 6 Sekme (Genel/Yetki/Erişim Tablosu/PIN/Log/Giriş Kilidi) | VAR | satır 116-123 |
| Erişim matrisi tablosu (ERISIM_MATRISI) | VAR | satır 294-307 |
| PIN değiştirme (eski pin → yeni pin) | VAR | satır 41-71 |
| Hatalı giriş kilidi (5 denemede kilitle) | VAR | satır 43-44, 59-61 |
| Admin bypass KALDIRILDI (B-14 fix) | VAR | satır 56-57 |
| 5 hatalı giriş → Telegram alarm | VAR | satır 58 |
| PIN → localStorage kayıt (`sb47_${grup}_pin`) | VAR | satır 64 |
| Yetki verme / iptal sistemi | VAR | satır 173-198 |
| Aktif oturumu sonlandır butonu | VAR | satır 441-444 |
| Giriş log kaydı (localStorage'dan) | VAR | satır 30-31 |
| Log temizleme → silmeYetkiDogrula koruması | VAR | satır 78-84 |
| Log temizleme → Telegram alarm | VAR | satır 92 |
| 2FA (planlandı) | YOK | satır 416 |
| IP kısıtlama (planlandı) | YOK | satır 417 |
| `kullanici?.grup !== 'tam'` → erişim engeli | VAR | satır 96 |
| Çift tıklama koruması | VAR | satır 26, 51, 86 |
| Arapça RTL | VAR | satır 18, 98 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. TÜM PIN'LER localStorage'DA — KRİTİK GÜVENLİK AÇIĞI

**Sorun (satır 54, 64):**
```js
const mevcut = localStorage.getItem(`sb47_${pinDegistir.grup}_pin`);
...
localStorage.setItem(`sb47_${pinDegistir.grup}_pin`, pinDegistir.yeniPin);
```
Üretim PIN'i `localStorage`'da saklanıyor. Bu demek oluyor ki:
- Tarayıcı DevTools açıp `localStorage.getItem('sb47_uretim_pin')` yazarak PIN görülebilir
- Farklı bilgisayarda PIN bilinmiyor (bilgisayar başına farklı PIN)
- PIN veritabanında değil — merkezi yönetimi yok

**Satır 341'de bu itiraf ediliyor:**
> "Bu panelden yapılan şifre değişikliği yalnızca bu cihaz/tarayıcı için 'Yerel Yönetici Yetkisi' tanımlar. Sistemin global şifresi (ENV) değişmez."

### 2. GİRİŞ LOGLARI localStorage'DA — SUNUCUYA GÖNDERILMIYOR

**Satır 30-31:**
```js
const kayit = JSON.parse(localStorage.getItem('sb47_giris_log') || '[]');
setLoglar(kayit);
```
Giriş logları tarayıcı hafızasında. Tarayıcı sildiğinde kaybolur. `b0_sistem_loglari` veya `b1_sistem_uyarilari` tablosuna gitmesi gerekirdi.

### 3. HATALI GİRİŞ KİLİTLEME state'te, SESSION'DA, SUPABASE'DE DEĞİL

**Satır 25:**
```js
const [hataliGirisler, setHataliGirisler] = useState({});
```
Hatalı giriş sayısı React state'inde — sayfa yenilince sıfırlanıyor. 5 hatalı girişten sonra sayfayı yenile → kilit açılıyor. Gerçek kilitleme mekanizması değil.

### 4. 2FA — PLANLANMIŞ AMA YAZILMAMIŞ

**Satır 416:**
```js
{ label: '2FA (İki Faktörlü)', ok: false },
```
Güvenlik kontrol listesinde "Planlandı" olarak görünüyor. Hiçbir 2FA kodu yok.

### 5. IP KISITLAMA — PLANLANMIŞ AMA YAZILMAMIŞ

**Satır 417:**
```js
{ label: 'IP Kısıtlama', ok: false },
```
Aynı şekilde planlanmış ama yok.

### 6. "OTURUM SÜRESİ 8 SAAT" — HARDCODED GÖSTERİM

**Satır 266:**
```js
{ label: 'Oturum süresi', val: '8 saat' },
```
"8 saat" sabit metin — gerçek oturum süre kontrolü var mı? `sb47_auth` token'ı ne zaman expire oluyor? Kodu incelenmedi.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| PIN → Supabase | YOK | localStorage'da |
| Giriş log → b0_sistem_loglari | YOK | localStorage'da |
| Hatalı giriş → Supabase kilitleme | YOK | React state'inde |
| 2FA | PLANLANMIŞ | Kod yok |
| IP Kısıtlama | PLANLANMIŞ | Kod yok |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **PIN → Supabase** → PBKDF2 hash ile saklama
- [ ] **Giriş log → Supabase** → `b0_sistem_loglari`'na yazılacak
- [ ] **2FA** → TOTP (Google Authenticator) veya SMS
- [ ] **IP whitelist** → Sadece fabrika IP aralığından bağlantı
- [ ] **Session timeout** → Gerçek 8 saat kontrol mekanizması
- [ ] **Çok kullanıcı** → Kişi bazlı giriş (şuan grup bazlı)
