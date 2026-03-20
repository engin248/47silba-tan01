# 📋 KONTROL 09 — ARŞİV VE VERİ SAKLAMA
>
> **Toplam Kriter:** 11 | **Sorumlu:** ___________ | **Tarih:** ___________

---

| # | Kriter | Durum | Aksiyon Notu |
|---|--------|:-----:|--------------|
| 1 | Model arşivi var mı (b1_model_taslaklari tablosu dolu mu) | ✅ | |
| 2 | Kumaş arşivi var mı (b1_kumas_arsivi tablosu dolu mu) | ✅ | |
| 3 | Aksesuar arşivi var mı | ✅ | |
| 4 | Ürün fotoğraf arşivi var mı (Supabase Storage aktif mi) | ✅ | |
| 5 | Araştırma arşivi — trend sonuçları DB'ye kaydediliyor mu (değil sadece ekranda mı) | ❌ | Ekrandan siliniyor, kayıt yok |
| 6 | Üretim video arşivi var mı | ❌ | |
| 7 | Her yerde soft delete var mı (aktif=false) — direkt DELETE kullanılan yer var mı | ⚠️ | Bazı yerlerde direkt DELETE var |
| 8 | Audit log (b0_sistem_loglari) kritik her işlemi kapsıyor mu | ✅ | |
| 9 | Log kayıtları RLS ile korunuyor mu (değiştirilemez mi) | ✅ | |
| 10 | Supabase otomatik backup aktif mi | ✅ | |
| 11 | Veri export — CSV/JSON "Tümünü İndir" butonu var mı | ❌ | Kullanıcıya verisi export yok |

---

## Kontrol Yapılacaklar

- [ ] Supabase → Settings → Database → Backups → Son backup tarihi?
- [ ] b0_sistem_loglari tablosuna gir → Silme işlemleri loglanmış mı?

---

## ✅ Tamamlandı: ___ / 11

*Kontrol Eden:* ___________ *Tarih:* ___________
