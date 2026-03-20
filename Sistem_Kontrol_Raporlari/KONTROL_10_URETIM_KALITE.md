# 📋 KONTROL 10 — ÜRETİM SÜRECİ VE KALİTE
>
> **Toplam Kriter:** 12 | **Sorumlu:** ___________ | **Tarih:** ___________

---

| # | Kriter | Durum | Aksiyon Notu |
|---|--------|:-----:|--------------|
| 1 | Üretim işlem sırası sistemde tanımlı mı (M3→M4→M6 akışı) | ✅ | |
| 2 | İşçi başlangıç saatleri kayıtlı mı (timestamp) | ✅ | |
| 3 | İşçi bitiş saatleri kayıtlı mı | ✅ | |
| 4 | İşçi performans ölçümü var mı (süre/adet matematik hesabı) | ❌ | Hesaplama kodu yok |
| 5 | Üretim hata kategorisi var mı (leke/dikiş atlaması/fire) | ⚠️ | Fire var ama hata kategorisi yok |
| 6 | Kalite kontrol süreci (form tabanlı QA akışı) var mı | ⚠️ | Zayıf |
| 7 | Fason/ara işçilik takip modülü var mı | ❌ | |
| 8 | Üretim darboğaz analizi — geciken iş kırmızı işaretleniyor mu | ❌ | |
| 9 | M3→M4 veri köprüsü (iş emri oluşturma butonu) çalışıyor mu | ✅ | Eklendi — canlıda test et |
| 10 | M4→M6 veri köprüsü (devir butonu) çalışıyor mu | ✅ | |
| 11 | M3 Kesim formunda yeni alanlar çalışıyor mu (kesimci/tarih/beden/not/kumaş topu) | ✅ | Eklendi — DB kolonları var mı? |
| 12 | Üretim verisi manipüle edilemiyor mu (RLS kuralları aktif mi) | ✅ | |

---

## Test Senaryosu (Canlıda yap)

1. M3 Kesim → Yeni Kesim ekle → Kesimci/Beden/Tarih alanlarını doldur → Kaydet
2. Kesim kartında kesimci adı ve tarih görünüyor mu?
3. "Kesimi Tamamla" → "M4 Üretim İş Emri Oluştur" tıkla → M4'te iş emri açıldı mı?

---

## ✅ Tamamlandı: ___ / 12

*Kontrol Eden:* ___________ *Tarih:* ___________
