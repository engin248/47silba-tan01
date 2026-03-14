# THE ORDER / NIZAM — 3 EKİP ÇALIŞMA PLANI
Tarih: 14.03.2026 | Saat: 01:43

---

## ⚠️ KURAL — KESİNLİKLE UYULACAK
1. Kanıtsız hiçbir işlem "tamamlandı" sayılmaz
2. Her değişiklik sonrası tarayıcı kontrolü yapılır
3. Ekran görüntüsü alınmadan görüntüsel değişiklik geçer sayılmaz
4. Supabase sorgusu çalıştırılmadan veri bağlantısı geçer sayılmaz
5. Test edilmemiş işlem = Yapılmamış işlem

---

## MİMARİ EKİP — (ZATEN ÇALIŞIYOR — DOKUNULMAZ)

**Sorumlu Alanlar (Diğer Ekipler El Sürmez):**
- `middleware.js`
- `src/lib/auth.js`, `src/lib/supabase.js`, `src/lib/rbac-config.js`
- `src/lib/silmeYetkiDogrula.js`
- Tüm SQL şema dosyaları (yeni tablo oluşturma)
- PIN hash / bcrypt
- Brute force kilidi
- CSRF token sistemi
- JWT_SIRRI ve Vercel env değişkenleri
- Ajan yetki kısıtlama (Service Role → Anon + RLS)

---

## EKİP A — VERİ AKIŞI & KÖPRÜLER 🔗

**Slogan:** Modüller arasında veri kesilmeden akar.

### Sorumlu Dosyalar (Sadece Bunlara Dokunulur):
```
src/features/uretim/
src/features/muhasebe/
src/features/maliyet/
src/features/kesim/
src/features/siparisler/
src/features/stok/
src/app/api/is-emri-ekle/
src/app/api/stok-hareket-ekle/
```

### Yapılacak İşlemler:

**A1 — /uretim Sayfası Düzeltme**
- Hata: "TypeError: Cannot read properties of undefined (reading 'bg')"
- v2_users tablosu kontrolü (mimari ekip oluşturursa kullan, yoksa kodu düzelt)
- Test: https://mizannet.com/uretim açılıyor mu?
- Kanıt: Ekran görüntüsü — hata yok

**A2 — M5 Kesim → M6 Üretim Köprüsü**
- Kesim tamamlandığında üretim otomatik bildirim almalı
- b2_is_emirleri tablosundan kesim durumu izleniyor mu?
- Test: Kesimde bir iş emri oluştur → Üretimde görünüyor mu?
- Kanıt: Her iki sayfanın ekran görüntüsü

**A3 — M7 Maliyet → Doğru Veri Bağlantısı**
- b1_maliyet_kayitlari gerçek verisi görünüyor mu?
- Bugünkü maliyet toplamı hesaplanıyor mu?
- Test: Supabase'den sorgu çalıştır, sayfadaki rakamla karşılaştır
- Kanıt: Supabase sorgu sonucu + sayfa ekran görüntüsü

**A4 — M8 Muhasebe — Boş Sayfa Düzeltme**
- Sayfa neden boş dönüyor? API logu kontrol et
- M6/M7'den veri akışı sağla
- Test: https://mizannet.com/muhasebe açılıyor, veri görünüyor
- Kanıt: Ekran görüntüsü

**A5 — Siparişler Hardcode Temizliği**
- "+%34.2 Hızlanış" hardcode kaldır
- Tüm kartlar 0 sorunu — Supabase bağlantısı kur
- Test: https://mizannet.com/siparisler
- Kanıt: Ekran görüntüsü

### 5 Eksen Kontrol Soruları (Her İşlem İçin):
1. STRATEJİK: Bu köprü kurulunca yönetici ne kazanıyor?
2. TEKNİK: Hangi tablolar, hangi sütunlar bağlandı?
3. OPERASYONEL: İş akışı hangi adımda devam ediyor?
4. EKONOMİK: Hata kalırsa ne kaybedilir?
5. İNSAN: Sahada bunu kim kullanacak, nasıl görecek?

### Sonuç Raporu Formatı:
```
EKİP A RAPORU — [tarih]
A1: ✅/❌ — Kanıt: [dosya/ekran görüntüsü]
A2: ✅/❌ — Kanıt: [dosya/ekran görüntüsü]
A3: ✅/❌ — Kanıt: [dosya/ekran görüntüsü]
A4: ✅/❌ — Kanıt: [dosya/ekran görüntüsü]
A5: ✅/❌ — Kanıt: [dosya/ekran görüntüsü]
YAPILMAYAN: [liste]
```

---

## EKİP B — UI/UX TEMA & SAYFA KONTROL 🎨

**Slogan:** Her ekran Emerald & Gold disiplininde, saha dili konuşuyor.

### Sorumlu Dosyalar (Sadece Bunlara Dokunulur):
```
src/features/modelhane/
src/features/katalog/
src/features/kasa/
src/features/raporlar/
src/features/guvenlik/
src/features/karargah/components/  (tema düzeltmesi)
src/features/maliyet/components/   (sadece renk/UI)
src/features/muhasebe/components/  (sadece renk/UI)
src/features/kesim/components/     (sadece renk/UI)
src/features/kasa/components/      (sadece renk/UI)
```

### Yapılacak İşlemler:

**B1 — Tema Standardı Tüm Modüllerde**
Renk kuralı: Zümrüt #047857, Koyu Gold #B8860B, Mavi #1D4ED8
- M4 Modelhane: Kırmızı buton → Gold
- M5 Kesimhane: Pembe/macenta butonlar → Emerald
- M7 Maliyet: Turkuaz butonlar → Emerald
- M8 Muhasebe: "Karargâha Dön" mor → Emerald
- M9 Katalog: Pembe "+ Yeni Ürün" → Gold
- M10 Siparişler: Turuncu butonlar → Emerald
- M12 Kasa: Emoji temizliği
- M16 Raporlar: Kırmızı geri butonu → Slate
- Test: Her sayfa ekran görüntüsü

**B2 — Jargon Temizliği**
- "Liyakat Hakemi" → "Bant Kuralları"
- "D-E Karargâh Devir" → "Depoya Teslim"
- "SAP/NetSuite Standardı" → Kaldır
- "Koordinatör Kararı" → "Yönetici Onayı"
- "Yapay Göz Radarı" → "Kamera Sistemi"
- Test: Her değişikliğin yapıldığı sayfanın ekran görüntüsü

**B3 — Modelhane API Hatası**
- "Ağ veya sunucu hatası: yükleme başarısız" nedenini bul
- API log'unu kontrol et
- Test: https://mizannet.com/modelhane açılıyor, hata yok
- Kanıt: Ekran görüntüsü

**B4 — Güvenlik Sayfası Temel İçerik**
- Sayfa neredeyse boş
- Temel bilgi ve yönetim arayüzü ekle
- Test: https://mizannet.com/guvenlik
- Kanıt: Ekran görüntüsü

**B5 — Raporlar Sayfası**
- Temel raporlar için veri bağlantısı (Ekip A ile çakışmaz — UI tarafı)
- Grafik bileşenlerinin veri aldığını doğrula
- Test: Ekran görüntüsü

### 5 Eksen Kontrol Soruları:
1. STRATEJİK: Tema tutarlılığı güveni artırıyor mu?
2. TEKNİK: Hangi CSS class değiştirildi, neleri etkileyebilir?
3. OPERASYONEL: Saha çalışanı sayfayı anlıyor mu?
4. EKONOMİK: Yanlış renk/jargon operasyonel hata yapar mı?
5. İNSAN: Fabrika ortamında okunabiliyor mu?

### Sonuç Raporu Formatı:
```
EKİP B RAPORU — [tarih]
B1: ✅/❌ — 8 modül renk kontrolü — Kanıt: [ekranlar]
B2: ✅/❌ — 5 jargon düzeltme — Kanıt: [dosya satırları]
B3: ✅/❌ — Modelhane hatası — Kanıt: [ekran]
B4: ✅/❌ — Güvenlik sayfası — Kanıt: [ekran]
B5: ✅/❌ — Raporlar sayfası — Kanıt: [ekran]
YAPILMAYAN: [liste]
```

---

## EKİP C — ENTEGRASYON & BAĞLANTI 📡

**Slogan:** Kamera çalışır, bot mesaj alır, ajan doğru işler.

### Sorumlu Dosyalar (Sadece Bunlara Dokunulur):
```
src/features/kameralar/
src/features/ajanlar/
src/app/api/telegram-bildirim/
src/app/api/telegram-foto/
src/app/api/telegram-webhook/
src/app/api/ajan-calistir/
src/app/api/ajan-tetikle/
src/app/api/cron-ajanlar/
src/features/karargah/hooks/useKarargah.js  (AI analiz bağlantısı)
stream-server/
```

### Yapılacak İşlemler:

**C1 — go2rtc Kamera Sunucusu**
- BASLAT.bat incelenir — ne yapıyor?
- go2rtc manuel başlatılır
- Test: https://mizannet.com/kameralar → kameralar online mu?
- Kanıt: Ekran görüntüsü — en az 1 kamera canlı

**C2 — Telegram Bot Throttle**
- Aynı anda çok alarm gelirse throttle devreye girmeli
- 1 dakikada max X mesaj sınırı
- Test: Simüle edilmiş çoklu alarm → bot selde boğulmuyor
- Kanıt: Telegram mesaj logu + kod

**C3 — Karargâh AI Analiz Gerçek Bağlantısı**
- /api/ajan-tetikle endpoint'ine bağlanmış
- "Pazar Analizi İste" yazınca gerçek cevap dönüyor mu?
- Test: mizannet.com/karargah → AI kutusu → sorgu yaz → gerçek cevap
- Kanıt: Ekran görüntüsü — sonuç metni görünüyor

**C4 — Ajan Görev Sistemi Kontrolü**
- b1_ajan_gorevler tablosundaki görevler çalışıyor mu?
- Trend Kâşifi ajan son çalışma zamanı ne?
- Test: /api/ajan-calistir manuel tetikle
- Kanıt: Supabase b1_agent_loglari tablosu son kayıt

**C5 — Karargâh Kamera Widget**
- Şu an dekoratif
- /kameralar sayfasına link çalışıyor mu?
- go2rtc açık değilse "Sunucu Kapalı" mesajı gösteriyor mu?
- Test: Widget'e tıkla → sonuç
- Kanıt: Ekran görüntüsü

### 5 Eksen Kontrol Soruları:
1. STRATEJİK: Kamera ve bot sistemi olmadan güvenlik sağlanabilir mi?
2. TEKNİK: API endpoint'leri gerçek cevap veriyor mu?
3. OPERASYONEL: Bot ve kamera gece çalışıyor mu?
4. EKONOMİK: Bot/kamera çalışmıyorsa gece hırsızlık riski nedir?
5. İNSAN: Operator botu kullanabiliyor mu?

### Sonuç Raporu Formatı:
```
EKİP C RAPORU — [tarih]
C1: ✅/❌ — Kamera online — Kanıt: [ekran]
C2: ✅/❌ — Telegram throttle — Kanıt: [log]
C3: ✅/❌ — AI analiz — Kanıt: [ekran + cevap metni]
C4: ✅/❌ — Ajan sistemi — Kanıt: [supabase kayıt]
C5: ✅/❌ — Kamera widget — Kanıt: [ekran]
YAPILMAYAN: [liste]
```

---

## ÇAKIŞMA KONTROL MATRİSİ

| Dosya/Alan | Mimari | Ekip A | Ekip B | Ekip C |
|---|---|---|---|---|
| middleware.js | ✅ Sahip | ❌ | ❌ | ❌ |
| lib/auth.js | ✅ Sahip | ❌ | ❌ | ❌ |
| SQL Şema | ✅ Sahip | ❌ | ❌ | ❌ |
| features/uretim | ❌ | ✅ Sahip | ❌ | ❌ |
| features/muhasebe | ❌ | ✅ Sahip | UI | ❌ |
| features/maliyet | ❌ | ✅ Sahip | UI | ❌ |
| features/kesim | ❌ | ✅ Sahip | UI | ❌ |
| features/siparisler | ❌ | ✅ Sahip | ❌ | ❌ |
| features/modelhane | ❌ | ❌ | ✅ Sahip | ❌ |
| features/katalog | ❌ | ❌ | ✅ Sahip | ❌ |
| features/kasa | ❌ | ❌ | ✅ Sahip | ❌ |
| features/raporlar | ❌ | ❌ | ✅ Sahip | ❌ |
| features/guvenlik | ❌ | ❌ | ✅ Sahip | ❌ |
| features/kameralar | ❌ | ❌ | ❌ | ✅ Sahip |
| features/ajanlar | ❌ | ❌ | ❌ | ✅ Sahip |
| api/telegram-* | ❌ | ❌ | ❌ | ✅ Sahip |
| stream-server | ❌ | ❌ | ❌ | ✅ Sahip |
| karargah/hooks | Mimari | ❌ | Tema | C3 (AI) |

> ⚠️ Karargah hooks için: Mimari güvenlik bitince, C3 AI analiz bağlantısını ekler. B tema düzeltmesini yapar. SIRALI yapılır, paralel değil.
