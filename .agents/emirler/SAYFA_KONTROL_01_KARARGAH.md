# SAYFA KONTROL — 01 KARARGÂH
> Sıra: 1/25 | Tarih: 14.03.2026 | Sistem: THE ORDER / NIZAM

---

## SAYFANIN AMACI
Karargâh, yöneticinin tüm sistemi tek ekrandan gördüğü, yönlendirdiği ve müdahale ettiği **Komuta Merkezidir.**
Rapor ekranı DEĞİLDİR. Her saniye karar üretmeye zorlar.

---

## RENK STANDARDI
| Renk | Kod | Kullanım |
|---|---|---|
| Zümrüt | `#047857` / emerald-700 | Ana aksiyon, pozitif durum, onay |
| Koyu Gold | `#B8860B` / amber-700 | Uyarı, dikkat, bekleyen işlem |
| Orta Mavi | `#1D4ED8` / blue-700 | Bilgi, veri, nötr durum |
| Arka plan | `#0f172a` | Sayfa zemini |
| Kart zemin | `#1e293b` | Widget/panel arkası |

---

## 5 EKSEN ANALİZİ

### 1. STRATEJİK
- [ ] Sayfa 5 saniyede sistemi anlık özetliyor mu?
- [ ] Yönetici karar almak için başka sayfaya gitmek zorunda kalıyor mu? (Kalıyorsa hata)
- [ ] Acil durumda tek butona basılabiliyor mu?
- [ ] Sistemi durdurma / başlatma komutu burada mı?

### 2. TEKNİK / MÜHENDİSLİK
- [ ] Kart verileri Supabase Realtime (WebSocket) ile mi geliyor? (Polling değil)
- [ ] Sayfa ilk yüklenişte skeleton ekran gösteriyor mu? (Beyaz ekran yok)
- [ ] Sunucu sağlığı metrikleri gerçek mi, hardcode değer mi? *(Şu an RAM=%32 hardcode!)*
- [ ] DB bağlantı süresi (ms) gerçek zamanlı ölçülüyor mu? *(Şu an "12ms" hardcode!)*
- [ ] Error Boundary var mı? (Bir widget çökünce tüm sayfa çökmüyor mu?)
- [ ] Mobil responsive çalışıyor mu? (4 sütun → 2 → 1 geçişi)

### 3. OPERASYONEL / SÜREÇ
- [ ] Tüm 25 modüle buradan ulaşılabiliyor mu? *(Şu an 12 modül var, 13 eksik!)*
- [ ] Görev atama motoru çalışıyor mu? (/komut yapısı)
- [ ] Bot üzerinden Telegram mesajı gönderilebiliyor mu?
- [ ] Yapay zeka analiz kutusu çalışıyor mu?
- [ ] What-if simülatörü (sürgü) ciro panelini gerçekten değiştiriyor mu?
- [ ] Bant akışı (Kesim → Dikim → Kalite) gerçek veritabanı verisi mi? *(Hardcode renk!)*

### 4. EKONOMİK / RİSK
- [ ] Günlük Ciro kartı gerçek bugünkü veriyi mi gösteriyor?
- [ ] Toplam Maliyet kartı gerçek mi?
- [ ] Personel Gider kartı gerçek mi?
- [ ] Fire/Zayiat oranı gerçek mu?
- [ ] Admin olmayan kullanıcı finansal verileri göremeden **** görüyor mu?
- [ ] Risk radara düşen alarmlar gerçek Supabase verisi mi?

### 5. İNSAN / KULLANIM / SÜRDÜRÜLEBİLİRLİK
- [ ] Tablet/mobilde atölyedeki kişi bu sayfayı kullanabilir mi?
- [ ] Font boyutu yeterince büyük mü? (Fabrika ortamında okunuyor mu?)
- [ ] Karanlık mod tek seçenek mi? (Açık mod gerekiyor mu?)
- [ ] Sesli komut verme özelliği var mı?
- [ ] Alarm çıktığında ses uyarısı da veriyor mu?

---

## KRİTİK SORUNLAR (Koddan Tespit Edildi)

| # | Sorun | Konum | Risk |
|---|---|---|---|
| S1 | RAM=%32 HARDCODE | KarargahMainContainer.js:239 | 🔴 Yanıltıcı veri |
| S2 | DB=12ms HARDCODE | KarargahMainContainer.js:241 | 🔴 Yanıltıcı veri |
| S3 | Bant akışı renkleri statik | Satır 172-180 | 🟡 Gerçek veriyle bağlı değil |
| S4 | Sadece 12 modül linki var | Satır 10-23 | 🟡 13 modül eksik |
| S5 | Haberleşme / mesaj paneli yok | — | 🔴 İstenen özellik eksik |
| S6 | Ses uyarısı yok | — | 🟡 Önemli eksik |
| S7 | Kamera widget gerçek stream değil | Satır 223-234 | 🔴 Dekoratif, çalışmıyor |

---

## KONTROL TABLOSU (Agent Dolduracak)

| # | Kontrol Noktası | Durum | Kanıt |
|---|---|---|---|
| K01 | Sayfa açılıyor, hata yok | ☐ | |
| K02 | 4 KPI kartı gerçek veri gösteriyor | ☐ | |
| K03 | Admin filtresi çalışıyor (****, gerçek) | ☐ | |
| K04 | Skeleton yükleme var | ☐ | |
| K05 | /komut girişi çalışıyor | ☐ | |
| K06 | AI analiz kutusu cevap veriyor | ☐ | |
| K07 | What-if sürgüsü ciro değiştiriyor | ☐ | |
| K08 | Risk radarı Supabase'den alarm çekiyor | ☐ | |
| K09 | HermAI modal açılıyor | ☐ | |
| K10 | Kamera widget link çalışıyor | ☐ | |
| K11 | Sunucu sağlığı GERÇEk veri mi? (hardcode değil) | ☐ | |
| K12 | Bant akışı gerçek veri mi? | ☐ | |
| K13 | Mobil görünüm çalışıyor | ☐ | |
| K14 | 25 modülün tamamına link var mı? | ☐ | |
| K15 | Telegram bot mesaj gönderme butonu var mı? | ☐ | |
| K16 | Renk standardı: Zümrüt/Gold/Mavi | ☐ | |
| K17 | Sistem durdur/başlat komutu var mı? | ☐ | |
| K18 | Ses uyarısı (alarm sesi) var mı? | ☐ | |

---

## YAPILACAKLAR LİSTESİ

### Agent Yapabilir:
- [ ] Eksik 13 modül linkini MODULLER dizisine ekle
- [ ] Hardcode RAM ve DB ms değerlerini gerçek API'ye bağla veya "—" göster
- [ ] Renk standardını zümrüt/gold/mavi'ye uyumlu hale getir

### İnsan / Engin Kararı Gerekir:
- [ ] Telegram bot mesaj paneli tasarımı nasıl olmalı?
- [ ] Ses uyarısı hangi alarmlarda çalışmalı?
- [ ] Kamera widget gerçek stream mi olacak yoksa linke mi yönlendirecek?
- [ ] Sistem durdurma komutu hangi yetki seviyesinde olacak?

---

## SONUÇ DURUMU
```
Kontrol Eden  : _______________
Tarih         : _______________
Tamamlanan    : ___ / 18
Kritik Sorun  : ___ adet
Listeye Eklenen: ___ madde
Bir Sonraki   : 02_ARGE sayfasına geç
```
