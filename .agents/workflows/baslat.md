---
description: /baslat — Oturum açılış brifingi. Her yeni sohbet başında çalıştırılır.
---

# BAŞLAT — Oturum Açılış Protokolü

## ⚠️ SİSTEM SABİT BİLGİLERİ — HER AGENT OKUYACAK, ASLA KARIŞTIRILMAYACAK

| Bilgi | Değer |
|---|---|
| Sistem Adı | THE ORDER / NIZAM |
| Canlı Domain | **https://mizannet.com** (çift n, çift t — mizaNNet.com) |
| Yanlış Adres | ~~mizanet.com~~ (YANLIŞ — kullanılmaz) |
| Proje Klasörü | `C:\Users\Admin\CUsersAdminDesktop47_SIL_BASTAN_01` |
| Giriş Şifresi | Sistem kurucusundan al |
| Veritabanı | Supabase |
| Sistem Kurucusu | Engin |
| Renk Standardı | Zümrüt #047857 + Koyu Gold #B8860B + Mavi #1D4ED8 |

Her yeni sohbet başında aşağıdaki adımlar sırayla çalıştırılır.

## Adım 1 — Git Güncelleme
```
git pull origin main
```
Yerel dosyalar GitHub ile senkronize edilir.

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

```
═══════════════════════════════════════
THE ORDER / NIZAM — OTURUM BRİFİNGİ
Tarih : [BUGÜN]
═══════════════════════════════════════
✅ GİT DURUMU     : [up-to-date / değişiklik var]
📋 KURALLAR       : GEMINI.md aktif
📌 SON YAPILAN    : [Son sohbetteki tamamlanan işlemler]
🚫 YAPILMAYAN     : [Henüz tamamlanmamış görevler]
🎯 SIRADAKI ADIM  : [Önerilen sonraki görev]
═══════════════════════════════════════
```

## Adım 5 — Hazır Bekle
Brifing sonrası kullanıcıdan komut bekle. İzinsiz iş başlatma.
