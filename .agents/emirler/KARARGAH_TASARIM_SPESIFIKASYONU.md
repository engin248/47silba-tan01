# KARARGÂH & GENEL SAYFA TASARIM SPESİFİKASYONU
# THE ORDER / NIZAM — Dünya Standartı Tekstil ERP
Tarih: 14.03.2026 | Kaynak: Engin (Sistem Kurucusu)

---

## KARARGÂH — 5 PANEL MİMARİSİ

```
┌─────────────────────── ÜST KONTROL BAR ───────────────────────┐
│ Arama | Sistem Durumu | Aktif Kullanıcı | Bildirim | ACİL BUTON│
├──────────────┬─────────────────────────┬───────────────────────┤
│              │                         │                       │
│  SOL PANEL   │   MERKEZ OPERASYON      │   SAĞ ANALİZ          │
│  (NAVİGASYON)│   (ÜRETİM ZİNCİRİ)     │   (KARAR DESTEK)      │
│              │                         │                       │
│  24 Modül    │  AR-GE→TASARIM→MODEL→   │  Trend Radar          │
│  Durum ışığı │  KALIP→KESİM→İMALAT→   │  Satış Analizi        │
│  🟢🟡🔴      │  STOK→SATIŞ            │  Stok Analizi         │
│              │  (tıklanınca açılır)    │  Risk Analizi         │
│              │                         │                       │
├──────────────┴─────────────────────────┴───────────────────────┤
│         ALT CANLI SİSTEM DURUMU (Sürekli Güncellenen)          │
│  Makine | Çalışan | Sipariş | Stok | Maliyet                   │
└────────────────────────────────────────────────────────────────┘
```

---

## PANEL 1 — ÜST KONTROL BAR

### İçerik:
- Global arama (tüm modüllerde)
- Sistem aktif/pasif göstergesi
- Aktif kullanıcı sayısı
- Bildirim zili (okunmamış sayısı)
- 🚨 ACİL DURUM butonu (kırmızı, her zaman görünür)
- Kullanıcı yönetimi (avatar + isim + rol)

### Durum Göstergeleri:
| Gösterge | Açıklama |
|---|---|
| Üretim | Aktif / Pasif / Sorunlu |
| Sipariş Yoğunluğu | Düşük / Normal / Yüksek |
| Stok Kritik | Kaç kalem kritik seviyede |
| Sistem Sağlığı | Tüm API'ler ok mu |

### Renk: Koyu zümrüt arka plan, Gold ikonlar

---

## PANEL 2 — SOL NAVİGASYON PANELİ

### 24 Modül Listesi + Durum Işığı:
```
🟢 Karargâh     🟢 Ar-Ge        🟢 Kumaş
🟡 Modelhane    🟢 Kalıp        🟡 Kesim
🔴 İmalat       🟢 Maliyet      🟡 Muhasebe
🟢 Kasa         🟡 Stok         🟢 Katalog
🟢 Sipariş      🟢 Müşteri      🟢 Personel
🟢 Görevler     🔴 Kameralar    🟢 Ajanlar
🟢 Denetmen     🟡 Raporlar     🟢 Tasarım
🔴 Üretim       🟡 Güvenlik     🟢 Ayarlar
```

### Durum Renk Kodu:
- 🟢 Yeşil = Normal, veri geliyor, hata yok
- 🟡 Sarı = Dikkat, eksik veri veya yavaş yükleme
- 🔴 Kırmızı = Sorun, hata var, müdahale gerekiyor

---

## PANEL 3 — MERKEZ OPERASYON (Üretim Zinciri)

### Akış Diyagramı (Tıklanabilir):
```
[AR-GE] → [TASARIM] → [MODELHANE] → [KALIP]
                                        ↓
[SATIŞ] ← [STOK] ← [İMALAT] ← [KESİM]
```

### Her Aşama Kartı İçeriği:
| Bilgi | Örnek |
|---|---|
| Aktif iş sayısı | 12 iş emirde |
| Bekleyen iş | 3 onay bekliyor |
| Geciken iş | 1 gecikmiş |
| Kalite durumu | %98 geçti |

### Tıklama Davranışı: İlgili modül açılır

---

## PANEL 4 — SAĞ ANALİZ PANELİ

### İçerik Blokları:
**Trend Radar:**
- Hangi ürün yükseliyor (AI tahmini)
- Hangi ürün düşüyor

**Satış Analizi:**
- Günlük satış toplamı
- Haftalık satış trendi

**Stok Analizi:**
- Hızlı dönen 3 ürün
- Kritik stok 3 ürün

**Risk Analizi:**
- Maliyet artış uyarısı
- Üretim gecikme riski
- Tedarikçi riski

---

## PANEL 5 — ALT CANLI DURUM BARI

```
| ÜRETİM: 8 makine aktif | ÇALIŞAN: 24 kişi |
| SİPARİŞ: 3 yeni, 12 bekleyen | STOK: 2 kritik |
| MALİYET: Bugün ₺X değişim | SYNC: Canlı |
```

---

## KARARGÂH POPUP PENCERELER

### 1. Kullanıcı Yetki Yönetimi
- Kullanıcı adı, rol, erişim modülleri
- Rol değiştirme, erişim kısıtlama

### 2. Sistem Uyarıları
- Kritik hatalar listesi
- Gecikme bildirimleri
- Çözüm önerileri

### 3. Hızlı Görev Atama
- Görev açıklaması
- Sorumlu kişi
- Teslim tarihi
- Öncelik seviyesi

### 4. Yetki Kontrolleri (Karargâh'ta Tüm Yetkiler):
- Tüm modüllere erişim ✅
- Tüm yetkileri değiştirme ✅
- Tüm işlemleri izleme ✅
- Tüm loglara erişim ✅
- Tüm ajan sistemlerini yönetme ✅

---

## GENEL SAYFA TASARIM STANDARDI (25 Sayfanın Tamamı)

### Grid Yapısı (Her Sayfada Aynı):
```
┌────────────────── ÜST BAR ──────────────────┐
│ Sayfa Adı | Arama | Bildirim | Kullanıcı   │
├───────────┬─────────────────┬───────────────┤
│ SOL MENÜ  │  ANA ÇALIŞMA   │  SAĞ PANEL   │
│ Modüller  │     ALANI      │  Özet/Yardım │
│ İkon+İsim │  Kart Sistemi  │  Hızlı Bilgi │
├───────────┴─────────────────┴───────────────┤
│              ALT DURUM BARI                  │
│  Sistem aktif | Kullanıcı | Son sync        │
└─────────────────────────────────────────────┘
```

### Renk Standardı:
| Renk | Hex | Kullanım |
|---|---|---|
| Zümrüt Yeşili | #047857 | Ana aksiyon, pozitif |
| Koyu Gold | #B8860B | Vurgu, ikincil aksiyon |
| Yumuşak Mavi | #1E40AF | Bilgi, nötr |
| Arka Plan | #F8FAFC | Sayfa zemini |
| Kart Zemin | #FFFFFF | Kart arka planı |
| Koyu Zemin | #0F172A | Header/sidebar |

### Psikolojik Tasarım Kuralları:
1. Ekran kalabalık olmaz — max 5 bilgi bloğu
2. Renk sayısı az — 3 ana renk + nötr
3. Veri kartları büyük — fabrikada okunabilir
4. Yazı boyutu minimum 14px
5. Boşluklar geniş — göz yorulmasın
6. İkonlar sade — tek renk, net anlam

---

## 25 SAYFA — ANA ÇALIŞMA ALANI TANIMI

| # | Sayfa | Ana Alan | Sağ Panel |
|---|---|---|---|
| 1 | Karargâh | Üretim zinciri + KPI | Alarmlar + Trend |
| 2 | Ar-Ge | Trend listesi + grafik | Trend puanı + satış ihtimali |
| 3 | Kumaş | Kumaş tablosu (ad, gramaj, içerik, stok, fiyat) | Kumaş detay |
| 4 | Modelhane | Model kartları + video kilidi | Onay kuyruğu |
| 5 | Kalıp | Kalıp listesi + görsel | Beden serisi |
| 6 | Kesim | Kesim planı + pastal | Fire hesabı |
| 7 | İmalat | Üretim hattı + operasyon kartları | Kapasite |
| 8 | Maliyet | Ürün maliyet tablosu | Maliyet karşılaştırma |
| 9 | Muhasebe | Gelir/gider tablosu | Özet grafik |
| 10 | Kasa | Nakit hareketleri | Bakiye + trend |
| 11 | Stok | Stok listesi + kritik uyarı | Hızlı/yavaş dönen |
| 12 | Katalog | Ürün görselleri + fiyat | Satış istatistik |
| 13 | Sipariş | Sipariş tablosu + durum | Geciken + yeni |
| 14 | Müşteri | Müşteri listesi + risk | CRM notları |
| 15 | Personel | Personel kartları + devam | Maaş özet |
| 16 | Görevler | Görev listesi (kanban) | Geciken görevler |
| 17 | Kameralar | Canlı grid (12 kamera) | Hareket uyarısı |
| 18 | Ajanlar | AI ajan listesi + log | Görev kuyruğu |
| 19 | Denetmen | İşlem denetim logu | Kritik olaylar |
| 20 | Raporlar | Grafik dashboard | PDF/Excel çıktı |
| 21 | Tasarım | Çizim alanı + şablonlar | Teknik dosya |
| 22 | Üretim | Üretim planı + hat | Kapasite analizi |
| 23 | Güvenlik | Yetki listesi + log | Erişim haritası |
| 24 | Ayarlar | Sistem konfigürasyon | API durumları |
| 25 | Giriş | Erişim kodu girişi | — |

---

## DÜNYA STANDARDI TEKSTİL ÜRETİM AKIŞI (19 Adım)

Her ürün bu 19 adımı tamamlamadan üretime giremez.

| Adım | İşlem | Sistem Modülü | Çıktı Belgesi |
|---|---|---|---|
| 1 | Pazar & Trend Araştırması | Ar-Ge | Ürün Konsepti |
| 2 | Ürün Tasarım Briefi | Ar-Ge/Tasarım | Teknik Dosya |
| 3 | Teknik Tasarim | Tasarım/Modelhane | Tech Pack |
| 4 | Malzeme Planlama | Kumaş/Stok | BOM |
| 5 | Operasyon Analizi | İmalat | Operation Bulletin |
| 6 | Zorluk & Beceri Analizi | Personel/İmalat | Beceri Matrisi |
| 7 | Kalıp Geliştirme | Kalıp | Kalıp Dosyası |
| 8 | Numune Üretimi | Modelhane | Video + Fotoğraf |
| 9 | Numune Değerlendirme | Modelhane/Kalite | Onay/Revize |
| 10 | Üretim Hattı Planlaması | İmalat/Üretim | Hat Planı |
| 11 | Zaman Etüdü | İmalat | Time Study |
| 12 | Maliyet Analizi | Maliyet | Cost Sheet |
| 13 | Üretim Emri | Karargâh | İş Emri |
| 14 | Kesim Planlaması | Kesim | Pastal Planı |
| 15 | Seri Üretim | İmalat/Kesim | Üretim Logu |
| 16 | Kalite Kontrol | Denetmen | KK Raporu |
| 17 | Ütü & Paketleme | İmalat | Paket Logu |
| 18 | Stok & Lojistik | Stok | Depo Girişi |
| 19 | Satış Analizi | Raporlar/Katalog | Satış Raporu |

### 5 Zorunlu Belge (Bunlar Olmadan Üretim Başlamaz):
1. **Tech Pack** — Teknik çizim + ölçü
2. **BOM** — Bill of Materials
3. **Operation Bulletin** — Operasyon planı
4. **Time Study** — Zaman etüdü
5. **Cost Sheet** — Maliyet özeti

---

## MALİYET SÜRDÜRÜLEBİLİRLİĞİ (Küçük Atölye Analizi)

### Soru: 3-5 Makinayla Çalışan Atölye Bu Sistemden Nasıl Faydalanır?

**Mevcut Tahmini Aylık Maliyet:**
| Servis | Plan | $/Ay |
|---|---|---|
| Supabase | Free (500MB, 50k MAU) | $0 |
| Vercel | Hobby | $0 |
| Gemini API | ~1M token/ay | ~$0.75 |
| Perplexity | Sonar basic | $5 |
| Domain | mizannet.com | ~$1.5 |
| **TOPLAM** | | **~$7-8/ay** |

**Sistemin Atölyeye Sağladığı Değer:**
- 1 hatalı üretim partisi: ortalama ₺2.000-10.000 zarar
- Sistem bunu 1 kez önlerse: yıllık $7-8 maliyet karşılanır, kalan kâr
- Stok kaybı önleme, geç teslimat cezası önleme: aylık ₺1.000+
- İşçilik verimsizliği: %10 iyileşme = 3 makinada ciddi tasarruf

**Küçük Atölye İçin Önerilen Modeller:**
- Önce sadece: Karargâh + Siparişler + Kasa + Personel (4 modül)
- Kameralar ve AI: ikinci aşamaya bırak
- Telegram bot: ücretsiz, değer yüksek

---

## HERMES AI + AJAN MİMARİSİ

### Hermes'in Rolü:
HermAI = Sistemin beyin mercii. Karar vermiyor, karar destekliyor.

```
KULLANICI SORUSU
      ↓
  [HermAI Analiz]
      ↓
  ┌───────────────────────────────┐
  │ Veritabanı Sorgu              │
  │ Trend Kâşifi (Perplexity)     │
  │ Satış Analizi                 │
  │ Maliyet Analizi               │
  └───────────────────────────────┘
      ↓
  [5 Eksen Değerlendirme]
      ↓
  Karar Destek Raporu → YÖNETİCİ ONAYLIYOR
```

### Ajan Hiyerarşisi:
```
KARARGÂH (Komuta Merkezi)
    ├── Trend Kâşifi Ajanı     → Pazar araştırması
    ├── Üretim Kontrol Ajanı   → Hat izleme
    ├── Stok Sentinel Ajanı    → Kritik stok uyarısı
    ├── Finans Radar Ajanı     → Maliyet anomalisi
    ├── Kalite Bekçisi Ajanı   → Hata tespit
    └── Alarm Yönetici Ajanı   → Tüm uyarıları koordine
```

### Sistem İçi Haberleşme:
```
Telegram Bot ←→ Karargâh ←→ Ajanlar
     ↑               ↑           ↑
  Mobil Bildirim   Web Arayüz  Otomatik Tarama
```

### Karargâh'ın Tüm Sisteme Erişim Noktaları:
| Erişim | Yöntem |
|---|---|
| Tüm modüller | Sol navigasyon linkleri |
| Gerçek zamanlı veri | Supabase Realtime |
| Ajan tetikleme | /api/ajan-calistir |
| Kamera görüntü | /kameralar direkt link |
| Bot mesaj gönderme | /api/telegram-bildirim |
| Sistem log | /denetmen |
| Yetki yönetimi | Karargâh popup |
| Acil durdurma | Üst bar — ACİL BUTON |

---

## İŞ PLANI — TASARIM & KONTROL

### FAZ 1 — Karargâh Yeniden Yapılandırma (Öncelik 1)

**K1.1 — ÜST BAR Ekleme**
- Global arama kutusu
- Sistem durum göstergesi
- ACİL DURUM butonu
- Aktif kullanıcı sayacı
- Kanıt: Ekran görüntüsü

**K1.2 — SOL PANEL Durum Işıkları**
- Her modül için 🟢🟡🔴 göstergesi
- Gerçek API sağlığına bağlı
- Kanıt: Tüm modüller renkli görünüyor

**K1.3 — MERKEZ Üretim Zinciri**
- AR-GE→TASARIM→MODEL→KALIP→KESİM→İMALAT→STOK→SATIŞ
- Her aşama tıklanabilir kart
- Aktif/bekleyen/geciken sayıları
- Kanıt: Ekran + veri doğrulama

**K1.4 — SAĞ ANALİZ PANELİ**
- Trend radar widget
- Satış analizi mini grafik
- Risk uyarısı widget
- Kanıt: Ekran görüntüsü

**K1.5 — ALT DURUM BARI**
- Canlı makine, çalışan, sipariş, stok sayıları
- Kanıt: Ekran görüntüsü

### FAZ 2 — Tüm Sayfalar Grid Standardizasyonu
- 25 sayfanın tamamında üst bar, sol menü, sağ panel, alt bar
- Renk standardı kontrolü
- Mobil uyumluluk kontrolü

### FAZ 3 — 19 Adım Üretim Akışı Entegrasyonu
- Tech Pack, BOM, Operation Bulletin, Time Study, Cost Sheet
- Her belge için sistem içi form
- Üretim emri bu 5 belge olmadan verilemiyor olacak

### FAZ 4 — Final Canlı Kontrol
- Tüm 25 sayfa tarayıcıda açılır
- Her sayfa için 5 eksen analizi
- Eksik tek nokta kalmaz
