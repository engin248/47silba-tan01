# 🔐 47 SİL BAŞTAN — SİBER GÜVENLİK & CANLIAYA ALMA HAZIRLIK RAPORU

## Tarih: 07.03.2026 | Standart: OWASP Top 10 + Next.js Security Checklist

---

## BÖLÜM 1: MEVCUT GÜVENLİK ANALİZİ

### 1.1 Kimlik Doğrulama (Authentication)

**Mevcut Durum:**

```
Tip: PIN bazlı localStorage kimlik doğrulama
PIN: Sayfada localStorage'a yazılıyor
Sunucu tarafı doğrulama: YOK
JWT/Session: YOK
```

**Risk Skoru: 🔴 9/10 KRİTİK**

| Açık | Açıklama | OWASP Karşılığı |
|---|---|---|
| localStorage PIN | XSS saldırısıyla PIN çalınabilir | A07: Identification Failures |
| Sunucu doğrulama yok | URL değiştirerek her sayfaya erişilebilir | A01: Broken Access Control |
| PIN şifrelenmemiş | localStorage'da açık text duruyor | A02: Cryptographic Failures |
| Session timeout yok | Bir kez giriş = sonsuz erişim | A07 |

**Gereken Çözüm:**

```
Supabase Auth'u aktif et:
- supabase.auth.signInWithPassword() ile giriş
- JWT token Supabase tarafından yönetilsin
- Her sayfa istetği sunucuda doğrulansın
```

---

### 1.2 API Anahtarları & Ortam Değişkenleri

**Mevcut Durum:**

```javascript
// src/lib/supabase.js
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

**Analiz:**

- ✅ `NEXT_PUBLIC_` prefixi ile `anon key` kullanılıyor (browser'a gitmesi normal)
- ⚠️ `.env.local` dosyası yok — değerler nerede? Muhtemelen sistem ortam değişkeni
- ❌ `service_role key` koda yazılmışsa FELAKETtir

**Kontrol Edilmesi Gereken:**

```bash
# .env.local dosyası olmalı, .gitignore'da yer almalı
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  (anon — tamam)
PERPLEXITY_API_KEY=pplx-...  (GİZLİ — sunucuda kalmalı!)
TELEGRAM_BOT_TOKEN=...  (GİZLİ — sunucuda kalmalı!)
```

**Risk Skoru: 🟡 6/10**

---

### 1.3 Supabase Row Level Security (RLS)

**OWASP A01: Broken Access Control**

RLS'nin aktif olmaması durumunda herhangi bir Supabase `anon key` sahibi TÜM VERİLERİ okuyabilir/değiştirebilir.

**Acil RLS SQL Komutları:**

```sql
-- TÜM TABLOLARDA RLS AKTİF ET
ALTER TABLE b1_model_taslaklari ENABLE ROW LEVEL SECURITY;
ALTER TABLE b1_kumas_arsivi ENABLE ROW LEVEL SECURITY;
ALTER TABLE b1_numune_uretimleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE b1_dikim_talimatlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE b1_personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE b1_maliyet_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2_siparisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2_musteriler ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2_kasa_hareketleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE b1_sistem_ayarlari ENABLE ROW LEVEL SECURITY;

-- Authenticated kullanıcılar her şeyi görebilsin (temel politika)
CREATE POLICY "authenticated_read_all" ON b1_personel
  FOR ALL USING (auth.role() = 'authenticated');
-- ...her tablo için tekrar et
```

**Risk Skoru: 🔴 8/10 — RLS olmadan üretim OLMAZ**

---

### 1.4 API Route Güvenliği

**Mevcut API'lar:**

- `/api/trend-ara` → Perplexity API'ye istek
- `/api/telegram-webhook` → Telegram bot webhook

**Sorun:** Bu API'lar authentication kontrolü yapıyor mu?

```javascript
// KONTROL EDİLMELİ: Her API route'ta
export async function POST(request) {
  // ❓ Burada auth kontrolü var mı?
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  // ...devam
}
```

**Risk Skoru: 🟡 7/10**

---

### 1.5 XSS (Cross-Site Scripting) Analizi

**Next.js varsayılan olarak JSX ile XSS'i önler.**
Ancak kontrol edilmeli:

- `dangerouslySetInnerHTML` kullanımı var mı?
- `eval()` kullanımı var mı?

**Düşük risk** — Next.js'in koruyuculuğuna güvenilir.

---

### 1.6 CSRF Koruması

Next.js App Router'ı SameSite cookie politikasından yararlanır. Next-auth veya Supabase auth kullanıldığında CSRF koruması dahil gelir.

**Mevcut durumda (localStorage kullanılıyorsa):** CSRF riski düşük ama auth güvenliği zayıf.

---

## BÖLÜM 2: CANLIAYA ALMA ÖNCESİ HAZIRLIK LİSTESİ

### 2.1 Teknik Altyapı

| Kalem | Durum | Aksiyon |
|---|---|---|
| **Hosting** | ❌ Sadece localhost | Vercel / Railway / Render'a deploy et |
| **Domain** | ❌ Yok | `.com.tr` veya `.com` al |
| **SSL/TLS** | ❌ HTTP | Vercel otomatik HTTPS sağlar |
| **CDN** | ❌ Yok | Vercel Edge Network dahil |
| **Database** | ✅ Supabase | Zaten cloud |
| **Backup** | ❌ Yok | Supabase otomatik backup aktif et |
| **Monitoring** | ❌ Yok | Sentry.io veya Vercel Analytics |

---

### 2.2 Performans

| Kalem | Durum | Hedef |
|---|---|---|
| LCP (Largest Contentful Paint) | ? | < 2.5 saniye |
| CLS (Cumulative Layout Shift) | ? | < 0.1 |
| Resim optimizasyonu | ? | Next.js Image component |
| Bundle size | ? | next build ile kontrol et |

---

### 2.3 Hukuki & Uyumluluk

| Kalem | Durum | Acilyet |
|---|---|---|
| KVKK (Türkiye GDPR) | ❌ Politika yok | 🔴 Zorunlu |
| Çerez bildirimi | ❌ Yok | 🟡 Gerekli |
| Kullanım koşulları | ❌ Yok | 🟡 Gerekli |
| Veri saklama süresi | ❌ Tanımsız | 🟡 Gerekli |

---

## BÖLÜM 3: GÜVENLİK DÜZELTME İŞ EMİRLERİ

### 🔴 ACİL (Canlıya Almadan Önce Zorunlu)

```
SEK-1: Supabase Auth entegrasyonu (PIN yerine gerçek auth)
SEK-2: Tüm tablolarda RLS aktif et (SQL komutları yukarıda)
SEK-3: API Route'larda auth kontrolü ekle
SEK-4: .env.local dosyası oluştur, .gitignore'a ekle
SEK-5: HTTPS zorunlu hale getir (Vercel'de otomatik)
```

### 🟡 YÜKSEK (İlk Ay İçinde)

```
SEK-6: Rate limiting (API aşırı kullanım koruması)
SEK-7: Content Security Policy (CSP) header
SEK-8: CORS politikası tanımla
SEK-9: Telegram webhook secret token doğrulama
SEK-10: Supabase backup aktif et
```

### 🟠 ORTA VADELİ

```
SEK-11: Sentry.io hata izleme
SEK-12: Uptime monitoring (UptimeRobot)
SEK-13: Log yönetimi
SEK-14: Penetrasyon testi (3. parti)
```

---

## BÖLÜM 4: MALİ SÜRDÜRÜLEBİLİRLİK ANALİZİ

### 4.1 Aylık İşletme Maliyeti Tahmini

| Hizmet | Plan | Aylık TL |
|---|---|---|
| **Supabase** | Free (500MB DB, 50MB storage) | ₺0 |
| Supabase Pro | 8GB DB + 100GB storage | ~₺650 |
| **Vercel** | Hobby (kişisel) | ₺0 |
| Vercel Pro | Takım, özel domain | ~₺600 |
| **Domain** (.com.tr) | Yıllık | ~₺17/ay |
| **Perplexity API** | Kullanım bazlı | ~₺200-500 |
| **Telegram Bot** | Ücretsiz | ₺0 |
| **Sentry.io** | Developer (5K hataya kadar) | ₺0 |
| **TOPLAM (Minimal)** | | ~₺217/ay |
| **TOPLAM (Profesyonel)** | | ~₺1.850/ay |

### 4.2 Ölçeklenebilirlik Yol Haritası

```
Aşama 1 (0-50 kullanıcı):  Supabase Free + Vercel Hobby → ₺0/ay
Aşama 2 (50-500):           Supabase Pro + Vercel Pro → ~₺1.250/ay
Aşama 3 (500+):             Supabase Team + Load Balancer + Redis → ~₺4.500/ay
```

---

## BÖLÜM 5: CANLIAYA ALMA KARAR MATRİSİ

| Kriter | Durum | Canlı Almaya Hazır? |
|---|---|---|
| Kimlik doğrulama | 🔴 localStorage PIN | ❌ HAYIR |
| Veri güvenliği (RLS) | 🔴 RLS aktif değil | ❌ HAYIR |
| HTTPS | ❌ Sadece HTTP localhost | ❌ HAYIR |
| Hata izleme | ❌ Yok | ⚠️ Riskli |
| Backup | ❌ Tanımsız | ⚠️ Riskli |
| Fonksiyonel test | ✅ Test edildi | ✅ |
| UI/UX | ✅ Çalışıyor | ✅ |

### KARAR: ⚠️ HENÜZ HAZIR DEĞİL

**Minimum 3 güvenlik düzeltmesi (SEK-1, SEK-2, SEK-3) yapılmadan canlı OLMAZ.**
Bu düzeltmeler tamamlanınca tahmin edilen hazırlık süresi: **3-5 iş günü**

---

## BÖLÜM 6: SUPABASE AUTH ENTEGRASYON PLANI

Mevcut localStorage PIN sistemi → Supabase Auth'a geçiş:

### Adım 1: Supabase Dashboard'da Kullanıcı Oluştur

```
Supabase Dashboard > Authentication > Users > Add User
Email: admin@47silbastan.com
Password: Güçlü şifre seç
```

### Adım 2: Login Sayfası Güncelle

```javascript
// Mevcut: localStorage PIN kontrolü
// Yeni:
const { data, error } = await supabase.auth.signInWithPassword({
  email: emailInput,
  password: passwordInput,
});
if (error) { setHata('Kimlik bilgileri hatalı'); return; }
router.push('/');
```

### Adım 3: Middleware ile Sayfa Koruması

```javascript
// src/middleware.js (YENİ DOSYA)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session && !req.nextUrl.pathname.startsWith('/giris')) {
    return NextResponse.redirect(new URL('/giris', req.url));
  }
  return res;
}
export const config = { matcher: ['/', '/((?!giris|_next|api).*)'] };
```

### Adım 4: RLS Politikaları

(Yukarıdaki SQL komutları + authenticated politikaları)

---

*Rapor ID: 07_GUVENLIK_VE_CANLIAYA_ALMA_HAZIRLIK*
*Tarih: 07.03.2026*
*Standart: OWASP Top 10 2021, Next.js Security Guidelines, Supabase RLS Best Practices*
