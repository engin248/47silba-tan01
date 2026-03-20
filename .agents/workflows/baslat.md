---
description: /baslat — Oturum açılış brifingi. Her yeni sohbet başında çalıştırılır.
---

# BAŞLAT — Oturum Açılış Protokolü

<<<<<<< HEAD
## ⚠️ SİSTEM SABİT BİLGİLERİ — HER AGENT OKUYACAK
=======
## ⚠️ SİSTEM SABİT BİLGİLERİ — HER AGENT OKUYACAK, ASLA KARIŞTIRILMAYACAK
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

| Bilgi | Değer |
|---|---|
| Sistem Adı | THE ORDER / NIZAM |
<<<<<<< HEAD
| Canlı Domain | **https://mizanet.com** |
| Proje Klasörü | `C:\Users\Esisya\Desktop\47_SilBaştan` |
=======
| Canlı Domain | **https://mizannet.com** (çift n, çift t — mizaNNet.com) |
| Yanlış Adres | ~~mizanet.com~~ (YANLIŞ — kullanılmaz) |
| Proje Klasörü | `C:\Users\Admin\CUsersAdminDesktop47_SIL_BASTAN_01` |
| Giriş Şifresi | Sistem kurucusundan al |
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
| Veritabanı | Supabase |
| Sistem Kurucusu | Engin |
| Renk Standardı | Zümrüt #047857 + Koyu Gold #B8860B + Mavi #1D4ED8 |

Her yeni sohbet başında aşağıdaki adımlar sırayla çalıştırılır.

## Adım 1 — Git Güncelleme
```
<<<<<<< HEAD
cd C:\Users\Esisya\Desktop\47_SilBaştan
=======
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
git pull origin main
```
Yerel dosyalar GitHub ile senkronize edilir.

<<<<<<< HEAD
## Adım 2 — SESSION_HANDOFF Oku
Son oturum notları okunur:
- `C:\Users\Esisya\Desktop\47_SilBaştan\_agents\SESSION_HANDOFF.md`

Bu dosya: tamamlanan işler, açık görevler, deployment durumu ve bir sonraki adımları içerir.

## Adım 3 — GEMINI.md Oku (varsa)
Dosya: `C:\Users\Esisya\Desktop\47_SilBaştan\GEMINI.md`
Yoksa bu adımı atla.

## Adım 4 — Brifing Üret
=======
## Adım 2 — GEMINI.md Oku
GEMINI.md dosyası okunur. Sistem kuralları teyit edilir.
Dosya: `C:\Users\Admin\CUsersAdminDesktop47_SIL_BASTAN_01\GEMINI.md`

## Adım 3 — Son İşlem Logu Oku
Son sohbet(ler)de yapılan işlemler okunur.
Referans dosyalar:
- `120_NIZAM_V3_DENETIM_RAPORU.md`
- `14_YENI_PROJE_SOHBET_OZETI.md`
- `47_SIL_BASTAN_1_SISTEM_TAM_KONTROL_LISTESI.md`

## Adım 4 — Brifing Üret
Aşağıdaki formatta oturum brifingi üretilir:
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

```
═══════════════════════════════════════
THE ORDER / NIZAM — OTURUM BRİFİNGİ
Tarih : [BUGÜN]
═══════════════════════════════════════
✅ GİT DURUMU     : [up-to-date / değişiklik var]
<<<<<<< HEAD
📌 SON YAPILAN    : [SESSION_HANDOFF'dan - tamamlananlar]
🚫 YAPILMAYAN     : [SESSION_HANDOFF'dan - açık görevler]
🎯 SIRADAKI ADIM  : [P0 pagination → siparislerApi + ajanlarApi]
⚠️ BİLİNEN SORUN  : [Gemini generateContent 404, Upstash key yok]
=======
📋 KURALLAR       : GEMINI.md aktif
📌 SON YAPILAN    : [Son sohbetteki tamamlanan işlemler]
🚫 YAPILMAYAN     : [Henüz tamamlanmamış görevler]
🎯 SIRADAKI ADIM  : [Önerilen sonraki görev]
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
═══════════════════════════════════════
```

## Adım 5 — Hazır Bekle
Brifing sonrası kullanıcıdan komut bekle. İzinsiz iş başlatma.
