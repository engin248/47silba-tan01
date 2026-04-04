# MİZANET SİSTEM MERKEZİ
## Kanıtlı İşlem Logu ve Onay Arşivi

**Sistem:** THE ORDER / NİZAM — mizanet.com  
**Belge Sürümü:** v1.0  
**Başlangıç Tarihi:** 3 Nisan 2026  
**Kurallar:** [rules.md](./rules.md) — Kural 24, 25, 26

---

> [!IMPORTANT]
> Bu dosya otomatik güncellenir. Her onaylı işlem kanıtıyla birlikte buraya işlenir.
> **Kanıtsız onay, push yapılmadan geçiş ve süre tahmini vermek yasaktır (Kural 24-25-26).**

---

## GENEL KURALLAR (HATIRLATICI)

| Kural | İçerik | Durum |
|-------|--------|:-----:|
| #24 | Zaman/süre tahmini verme YASAK | ✅ AKTİF |
| #25 | Her işlem kanıtıyla raporlanır, kanıtsız onay yok | ✅ AKTİF |
| #26 | Push → Canlı doğrulama → Onay olmadan bir sonraki işlem yok | ✅ AKTİF |
| #17 | Git push protokolü (pull→add→commit→push sırası) | ✅ AKTİF |
| #23 | Geçiş Kapısı Protokolü (5 eksen doğrulama) | ✅ AKTİF |

---

## ONAY KAYIT FORMATI

Her işlem tamamlandığında aşağıdaki format kullanılır:

```markdown
### İŞLEM #[NN] — [İşlem Adı]
**Tarih/Saat:** YYYY-MM-DD HH:MM (TRT)  
**Modül:** [M0/M1/M2/.../AR-GE/Altyapı]  
**Durum:** ⏳ Bekliyor | ✅ Onaylandı | ❌ Reddedildi

**Yapılan Değişiklik:**
- Dosya: `src/...` (satır: X-Y)
- Değişiklik: [ne değişti]

**Kanıt:**
- [ ] Ön uç: [ekran görüntüsü / URL testi]
- [ ] Arka uç: [terminal çıktısı / konsol logu]
- [ ] Build: [hatasız build kanıtı]

**Push Kanıtı:**
```
git push origin main çıktısı buraya
```

**Canlı Doğrulama:** [mizanet.com/xxxx — test sonucu]

**Kullanıcı Onayı:** [onay mesajı + tarih/saat]
```

---

## AKTİF İŞLEM LOGU

---

### İŞLEM #001 — rules.md Sistem Kuralları Güncelleme
**Tarih/Saat:** 2026-04-03 00:48 (TRT)  
**Modül:** Sistem Merkezi / Kural Motoru  
**Durum:** ⏳ Push Bekleniyor

**Yapılan Değişiklik:**
- Dosya: `rules.md` (satır: 269-370)
- Değişiklik: Kural #24 (Zaman tahmini yasağı), #25 (Kanıtlı onay protokolü), #26 (Commit-Push döngüsü) eklendi

- Dosya: `SISTEM_MERKEZI.md` (YENİ DOSYA)
- Değişiklik: Kanıtlı işlem logu sistem merkezi oluşturuldu

**Kanıt:**
- [ ] Ön uç: Uygulanamaz (kural dosyası değişikliği)
- [x] Arka uç: rules.md diff kanıtı mevcut
- [ ] Build: Bu değişiklik build gerektirmiyor

**Push Durumu:** ⏳ Bekliyor — kullanıcı onayı gerekiyor

**Kullanıcı Onayı:** ⏳ Bekliyor

---

## GEÇMİŞ ONAYLANMIŞ İŞLEMLER

*(Henüz tamamlanan işlem yok)*

---

## KURAL İHLAL KAYDI

*(İhlal kaydedilmedi)*

---

*Bu belge, Mizanet sisteminin yaşayan hafızasıdır. Her işlem burada mühürlenir.*
