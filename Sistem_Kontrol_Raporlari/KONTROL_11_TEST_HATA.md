# 📋 KONTROL 11 — TEST VE HATA YÖNETİMİ
>
> **Toplam Kriter:** 12 | **Sorumlu:** ___________ | **Tarih:** ___________

---

| # | Kriter | Durum | Aksiyon Notu |
|---|--------|:-----:|--------------|
| 1 | Unit test sistemi var mı (Jest/Vitest) | ❌ | 🔴 KRİTİK — package.json'da hiç yok |
| 2 | Integration test var mı (Cypress/Playwright) | ❌ | 🔴 KRİTİK — yok |
| 3 | Load (yük) testi var mı | ❌ | |
| 4 | Security penetrasyon testi var mı | ❌ | |
| 5 | Regression test var mı | ❌ | |
| 6 | Yanlış veri girilince validasyon uyarıyor mu | ⚠️ | Bazı modüllerde zayıf |
| 7 | Supabase kesilince sayfa çöküyor mu (503 fallback) | ⚠️ | Timeout var, 503 sayfası yok |
| 8 | Boş liste durumunda anlamlı mesaj var mı | ⚠️ | Bazı modüllerde eksik |
| 9 | Hata mesajları Türkçe ve anlamlı mı | ✅ | |
| 10 | Transaction rollback var mı — işlem yarım kalırsa geri dönüyor mu | ❌ | |
| 11 | Silinen veri geri alınabilir mi (UI üzerinden) | ⚠️ | Log var, UI geri alma yok |
| 12 | Test ortamı (staging) var mı — canlıda teste zorunlu kalınıyor mu | ❌ | 🔴 Canlıda test ediliyor |

---

## 🔴 Kritik

Sistem şu an **canlı ortamda test ediliyor** — hatalı bir değişiklik gerçek veriyi bozar.

**Öneri:** Vercel'de `preview` channel or ayrı bir Supabase project kurul.

---

## ✅ Tamamlandı: ___ / 12

*Kontrol Eden:* ___________ *Tarih:* ___________
