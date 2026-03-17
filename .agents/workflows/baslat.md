---
description: /baslat — Oturum açılış brifingi. Her yeni sohbet başında çalıştırılır.
---

# BAŞLAT — Oturum Açılış Protokolü

## ⚠️ SİSTEM SABİT BİLGİLERİ — HER AGENT OKUYACAK

| Bilgi | Değer |
|---|---|
| Sistem Adı | THE ORDER / NIZAM |
| Canlı Domain | **https://mizanet.com** |
| Proje Klasörü | `C:\Users\Esisya\Desktop\47_SilBaştan` |
| Veritabanı | Supabase |
| Sistem Kurucusu | Engin |
| Renk Standardı | Zümrüt #047857 + Koyu Gold #B8860B + Mavi #1D4ED8 |

Her yeni sohbet başında aşağıdaki adımlar sırayla çalıştırılır.

## Adım 1 — Git Güncelleme
```
cd C:\Users\Esisya\Desktop\47_SilBaştan
git pull origin main
```
Yerel dosyalar GitHub ile senkronize edilir.

## Adım 2 — SESSION_HANDOFF Oku
Son oturum notları okunur:
- `C:\Users\Esisya\Desktop\47_SilBaştan\_agents\SESSION_HANDOFF.md`

Bu dosya: tamamlanan işler, açık görevler, deployment durumu ve bir sonraki adımları içerir.

## Adım 3 — GEMINI.md Oku (varsa)
Dosya: `C:\Users\Esisya\Desktop\47_SilBaştan\GEMINI.md`
Yoksa bu adımı atla.

## Adım 4 — Brifing Üret

```
═══════════════════════════════════════
THE ORDER / NIZAM — OTURUM BRİFİNGİ
Tarih : [BUGÜN]
═══════════════════════════════════════
✅ GİT DURUMU     : [up-to-date / değişiklik var]
📌 SON YAPILAN    : [SESSION_HANDOFF'dan - tamamlananlar]
🚫 YAPILMAYAN     : [SESSION_HANDOFF'dan - açık görevler]
🎯 SIRADAKI ADIM  : [P0 pagination → siparislerApi + ajanlarApi]
⚠️ BİLİNEN SORUN  : [Gemini generateContent 404, Upstash key yok]
═══════════════════════════════════════
```

## Adım 5 — Hazır Bekle
Brifing sonrası kullanıcıdan komut bekle. İzinsiz iş başlatma.
