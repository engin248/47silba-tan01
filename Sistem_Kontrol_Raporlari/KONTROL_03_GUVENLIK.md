# 📋 KONTROL 03 — GÜVENLİK (AUTH / PİN / RBAC / SİBER)
>
> **Toplam Kriter:** 17 | **Sorumlu:** ___________ | **Tarih:** ___________
> Güvenlik kriterleri — elle test + kod incelemesi gerektirir

---

| # | Kriter | Durum | Aksiyon Notu |
|---|--------|:-----:|--------------|
| 1 | Kimlik doğrulama güvenli mi (middleware.js + cookie PIN çalışıyor mu) | ✅ | |
| 2 | RBAC rol sistemi var mı — tam / uretim grupları doğru ayrılmış mı | ✅ | |
| 3 | SQL Injection koruması var mı (Supabase parametrik sorgu kullanıyor mu) | ✅ | |
| 4 | XSS koruması var mı (React DOM kendiliğinden kurtarıyor mu) | ✅ | |
| 5 | CSRF koruması var mı (SameSite=Strict cookie ayarlandı mı) | ❌ | middleware.js'te SameSite zorlaması yok |
| 6 | API rate limiting var mı — DDoS koruması | ❌ | 🔴 KRİTİK — Redis/in-memory limiter yazılmamış |
| 7 | WAF özel kuralları var mı (kötü niyetli IP engelleme) | ❌ | Vercel default var, özel kural yok |
| 8 | Veri şifreleme var mı (HTTPS, transit güvenlik) | ✅ | |
| 9 | IP kısıtlama var mı — fabrika IP kontrolü middleware'de | ❌ | IP filtresi yok |
| 10 | 2FA kimlik doğrulama var mı (SMS/Authenticator) | ❌ | Entegrasyon yok |
| 11 | Oturum zaman aşımı var mı (cookie maxAge ile) | ✅ | |
| 12 | PIN şifrelenmiş mi — bcryptjs kullanılıyor mu | ❌ | 🔴 KRİTİK — bcryptjs package.json'da YOK |
| 13 | Penetrasyon test scripti var mı | ❌ | |
| 14 | RLS politikaları tüm Supabase tablolarını kapsıyor mu | ⚠️ | Bazı tablolar kontrol edilmeli |
| 15 | localStorage'da PIN/session şifresiz mi duruyor | ❌ | Güvenlik açığı — sessionStorage kontrol edilmeli |
| 16 | CORS ayarları doğru mu (dışarıdan API'ye istek atılabiliyor mu) | ☐ | Test edilmedi |
| 17 | Rol bazlı kısıtlama her modülde doğru çalışıyor mu (tam/uretim/salt) | ⚠️ | Bazı modüllerde çok lax |

---

## 🔴 Acil Aksiyon Gerektiren Maddeler

| Öncelik | Problem | Çözüm |
|:-------:|---------|-------|
| 🔴 1 | PIN'ler şifresiz gidiyor | `npm install bcryptjs` + PIN hash fonksiyonu |
| 🔴 2 | API rate limit yok | `/lib/rateLimiter.js` veya Upstash Redis |
| ⚠️ 3 | CSRF token yok | middleware.js'e SameSite=Strict eklenmeli |
| ⚠️ 4 | localStorage güvensiz | sessionStorage → httpOnly cookie'ye taşı |

---

## ✅ Tamamlandı: ___ / 17

## 🔴 Kritik Bulgular

- [ ] ...

## 📌 Aksiyon Listesi

- [ ] ...

---
*Kontrol Eden:* ___________ *Tarih:* ___________
