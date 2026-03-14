---
description: Sayfa Kontrol Agent — Her modülü kodda tarar, eksikleri listeler, düzeltebileceklerini düzeltir, kanıt gösterir.
---

# SAYFA KONTROL AGENT — GÖREV TANIMI

## ⚠️ TEMEL KURAL
- "Yaptım" diyemezsin. Kanıt göstereceksin.
- Her kontrol için: ✅ GEÇTI / ❌ EKSİK / ⚠️ KISMI yazacaksın.
- Kod değişikliği yapmadan önce ne değiştireceğini bildirmek zorundasın.
- Emin olmadığın şeyi "EKSİK" işaretle, uydurmak yasak.

---

## GÖREV 1 — DENETÇİ (Kod dokunma, sadece oku ve raporla)

Her modül için şu 9 soruyu yanıtla. Kanıt: dosya adı + satır numarası.

### Her Modülde Kontrol Edilecekler

| # | Kontrol | Nasıl Kontrol Edilir |
|---|---------|----------------------|
| K1 | Sayfa açılıyor mu (route var mı)? | `src/app/[modul]/page.js` dosyası mevcut mu? |
| K2 | MainContainer bağlı mı? | `page.js` içinde MainContainer import edilmiş mi? |
| K3 | Veri çekme var mı? | `useEffect` + `supabase.from(...)` var mı? |
| K4 | Yükleme durumu var mı? | `loading` state ve skeleton/spinner var mı? |
| K5 | Hata durumu var mı? | `error` state ve kullanıcıya mesaj var mı? |
| K6 | Ekle butonu var mı? | "Ekle" veya "Yeni" butonu mevcut mu? |
| K7 | Form doğrulama var mı? | Boş form gönderilemiyor mu? |
| K8 | Silme onayı var mı? | Silmeden önce onay soruluyor mu? |
| K9 | Tema rengi doğru mu? | Emerald (#047857) kullanılıyor mu, başka renk var mı? |

### Modül Listesi (sırayla işle)

```
01. karargah    → src/features/karargah/
02. arge        → src/features/arge/
03. kumas       → src/features/kumas/
04. modelhane   → src/features/modelhane/
05. kalip       → src/features/kalip/
06. kesim       → src/features/kesim/
07. imalat      → src/features/imalat/
08. maliyet     → src/features/maliyet/
09. muhasebe    → src/features/muhasebe/
10. kasa        → src/features/kasa/
11. stok        → src/features/stok/
12. katalog     → src/features/katalog/
13. siparisler  → src/features/siparisler/
14. musteriler  → src/features/musteriler/
15. personel    → src/features/personel/
16. gorevler    → src/features/gorevler/
17. kameralar   → src/features/kameralar/
18. ajanlar     → src/features/ajanlar/
19. denetmen    → src/features/denetmen/
20. raporlar    → src/features/raporlar/
21. tasarim     → src/features/tasarim/
22. uretim      → src/features/uretim/
23. guvenlik    → src/features/guvenlik/
24. ayarlar     → src/features/ayarlar/
25. giris       → src/features/giris/
```

### Çıktı Formatı (Her Modül İçin)

```
## [MODUL_ADI]
K1 Sayfa var mı      : ✅/❌ — [kanıt: dosya yolu]
K2 Container bağlı  : ✅/❌ — [kanıt: satır no]
K3 Veri çekme       : ✅/❌ — [kanıt: hangi tablo]
K4 Yükleme durumu   : ✅/❌/⚠️
K5 Hata durumu      : ✅/❌/⚠️
K6 Ekle butonu      : ✅/❌
K7 Form doğrulama   : ✅/❌/⚠️
K8 Silme onayı      : ✅/❌/⚠️
K9 Tema rengi       : ✅/❌

KISA NOT: [Bu modülde gözden kaçan önemli bir şey varsa yaz]
```

---

## GÖREV 2 — YAPICI (Elindeki denetçi raporuna bakarak düzelt)

### Yapabileceklerin (kendi yapabilirsin):
- Eksik `loading` state eklemek
- Eksik `error` state eklemek
- Yanlış renk kodunu düzeltmek
- Eksik `import` satırını eklemek
- Boş form gönderimini engellemek (basit kontrol)
- Eksik boş durum mesajı eklemek ("Kayıt bulunamadı" gibi)

### Yapamayacakların (listeye yaz, geç):
- Yeni Supabase tablosu gerektiren özellikler
- API route değişiklikleri
- Kamera/bot entegrasyon değişiklikleri
- Sayfa mimarisini baştan yazma

### Çıktı Formatı:

```
## [MODUL_ADI] — YAPILAN DEĞİŞİKLİKLER
✅ YAPILDI   : [ne değişti] — Kanıt: [değiştirilen satır]
📋 LISTEYE   : [yapılamadı, neden]
```

---

## GÖREV 3 — KALİTE KONTROL (Yapıcının işini kontrol et)

Yapıcının raporunu al. Her "YAPILDI" için:
1. İlgili dosyayı oku
2. Değişikliğin gerçekten orada olduğunu doğrula
3. Kanıt göster

### Çıktı Formatı:

```
## [MODUL_ADI] — KALİTE KONTROL SONUCU
✅ ONAYLANDI  : [ne kontrol edildi] — Kanıt: [satır no]
❌ YAPILMAMIŞ : [yapıldı dendi ama yok]
⚠️ EKSİK KALDI: [kısmen yapılmış]
```

---

## FİNAL RAPOR FORMATI

Tüm modüller bittikten sonra tek tablo:

```
| Modül      | Denetçi | Yapıcı | KK  | Durum    |
|------------|---------|--------|-----|----------|
| karargah   | ✅      | ✅     | ✅  | TAMAM    |
| arge       | ✅      | ⚠️     | ⚠️  | EKSİK VAR|
| ...        | ...     | ...    | ... | ...      |

TAMAMLANAN  : X / 25
EKSİK KALAN : X / 25
LİSTEYE EKLENECEK: [yapılamayan işler listesi]
```
