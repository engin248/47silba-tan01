# 🏛️ AKADEMİK SİSTEM DENETİM İŞ EMRİ — 47 SİL BAŞTAN 01

## Versiyon: 2.0 (Güncel Kod Taramasıyla Güncellendi) | Tarih: 2026-03-07

> **EMİR ÖZETİ:** Bu iş emri, kod dosyaları **gerçek olarak taranarak** hazırlanmıştır. Her modülün mevcut sayfaları, sekmeleri, alanları ve becerileri belgelenmiş; ardından kör nokta, eksiklik ve geliştirme önerileri üretilmiştir. Hiçbir modül, sekme, seçenek veya API kör nokta bırakılmadan denetlenecektir.

---

## 📐 BÖLÜM 0 — DENETİMİN FELSEFESİ VE KRİTER ÇERÇEVESİ

Her denetim maddesi **4 boyuttan** değerlendirilecektir:

| Boyut | Soru | Ölçüt |
|---|---|---|
| **A — Doğruluk** | Sayfa/sekme doğru soruyu soruyor mu? | ✅ / ⚠️ / ❌ |
| **B — Verimlilik** | İşletmeye gerçek katma değer yaratıyor mu? | 1-10 puan |
| **C — Eksiklik** | Hedefi gerçekleştirmek için ne eksik? | Liste |
| **D — Tehdit** | Ne gibi operasyonel/finansal tehlike yaratır? | 🔴/🟡/🟢 |

---

## 🗺️ BÖLÜM 1 — GERÇEK SİSTEM HARİTASI (Kod Taramasıyla Onaylandı)

```
47_SIL_BASTAN_01/src/app/
│
├── page.js              → KARARGAH (Dashboard) — Aktif
├── giris/               → GİRİŞ SAYFASI — Aktif
│
├── 1. BİRİM (M1-M8) — ÜRETİM KORİDORU
│   ├── arge/page.js     → M1: Ar-Ge & Trend Araştırması — Aktif [678 satır]
│   ├── kumas/page.js    → M2: Kumaş & Arşiv — Aktif
│   ├── kalip/page.js    → M3: Kalıp & Serileme — Aktif
│   ├── modelhane/page.js→ M4: Modelhane & Video — Aktif [520 satır]
│   ├── kesim/page.js    → M5: Kesim & Ara İşçilik — Aktif
│   ├── uretim/page.js   → M6: Üretim Bandı — Aktif
│   ├── maliyet/page.js  → M7: Maliyet Merkezi — Aktif
│   ├── muhasebe/page.js → M8: Muhasebe & Rapor — Aktif
│   └── imalat/page.js   → 1. BİRİM ANA KARARGAH (4 pencereli) [505 satır]
│
├── 2. BİRİM (M9-M12) — SATIŞ KORİDORU
│   ├── katalog/page.js  → M9: Ürün Kataloğu — Aktif
│   ├── siparisler/page.js → M10: Siparişler — Aktif
│   ├── stok/page.js     → M11: Stok & Sevkiyat — Aktif
│   └── kasa/page.js     → M12: Kasa & Tahsilat — Aktif [353 satır]
│
├── YÖNETİM PANELİ
│   ├── musteriler/page.js → M13: Müşteri CRM — Aktif
│   ├── personel/page.js → M14: Personel & Prim — Aktif [516 satır]
│   ├── gorevler/page.js → M15: Görev Takibi — Aktif
│   └── raporlar/page.js → M16: Raporlar — Aktif [312 satır]
│
├── SİSTEM
│   ├── denetmen/page.js → Müfettiş (AI) — Aktif
│   ├── guvenlik/page.js → Güvenlik — Aktif
│   └── ayarlar/page.js  → Sistem Ayarları — Aktif
│
└── API
    ├── api/trend-ara/route.js   → Perplexity AI Trend Arama
    └── api/telegram-webhook/    → Telegram Bildirim
```

---

## 📋 BÖLÜM 2 — MODÜL BAZLI GERÇEK KOD DENETİM PROTOKOLÜ

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔵 KARARGAH — Dashboard (page.js)

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Mevcut Özellikler (Kod Taramasıyla Onaylandı):**

- ✅ Ciro, Toplam Maliyet, Personel Gideri, Fire Kaybı — 4 canlı kart (Supabase'den çekiyor)
- ✅ Erişim Yönetimi — "Üretim Erişimi" ve "Genel Erişim" PIN sistemi (localStorage)
- ✅ Anlık Alarm Paneli — Bekleyen görevler, Kritik stok, Vadesi dolmuş ödemeler
- ✅ Hızlı Görev Ekle — Enter'la kaydet (b1_gorevler tablosuna gidiyor)
- ✅ Siber Mimari Merkezi — Yeni sayfa aç, DB tablo kur, Sesli komut (UI simülasyonu)

**Denetim Kontrol Listesi:**

- [ ] 4 finansal kart gerçek mi çekiyor, dummy veri mi? → `b2_siparisler` ve `b1_maliyet_kayitlari`
- [ ] Alarm paneli: Görevler `b1_gorevler`'den, stok `b2_urun_katalogu`'ndan, kasa `b2_kasa_hareketleri`'nden — ÜÇÜ DE DOĞRU mu?
- [ ] PIN sistemi: `localStorage` bazlı erişim kontrol yeterli mi? Sunucu tarafında doğrulama var mı?
- [ ] "Sesli Komut" modali: Gerçek çalışıyor mu, UI şov mu?
- [ ] "Yeni Sayfa Aç" butonu: Gerçekten kod üretiyor mu?

**Kritik Sorular (Eksik):**

- "Bu ayın ozet özeti" / trend kıyaslama grafiği yok
- Üretim bant durumu anlık görünmüyor (kaç iş bekliyorda, kaçı devam ediyor?)
- Koordinatörün onay bekleyen işler listesi eksik (modelhane, kesim, muhasebe)

**Kör Nokta:**

- 🟡 PIN localStorage'da. Tarayıcı temizlenince yetki sıfırlanır. Kritik değil ama not edilmeli.
- 🔴 4 finansal kart verisi dummy değilse — yavaş ağda `yukleniyor: true` çok uzun sürebilir, timeout yok

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔵 M1 — AR-GE & TREND ARAŞTIRMASI (arge/page.js)

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Mevcut Özellikler (Kod Taramasıyla Onaylandı):**

- ✅ AI Trend Arama kutusu → `/api/trend-ara` (Perplexity API)
- ✅ Demo mod: API key yoksa otomatik demo veri gösteriyor
- ✅ AI sonuçlarını "Sisteme Kaydet" → `b1_arge_trendler` tablosuna insert
- ✅ Manuel trend formu: TR/AR başlık, Platform (Trendyol/Amazon/Instagram/Pinterest/Diğer), Kategori (8 seçenek), Talep skoru slider (1-10), Referans link, Görsel URL
- ✅ Durum: İnceleniyor / Onaylandı / İptal
- ✅ Filtreler: Tümü / İnceleniyor / Onaylandı / İptal sayılarıyla
- ✅ Onayla → Tasarıma Gönder butonu
- ✅ Düzenle + Sil butonları
- ✅ Sağ panel: İstatistik + Ajan Log (b1_agent_loglari)
- ✅ M1 Test Kriterleri kutusu (yol gösterici)
- ✅ Çift dil (TR/AR) tam çalışıyor

**Denetim Kontrol Listesi:**

- [ ] `/api/trend-ara` gerçek Perplexity API key var mı `.env.local`'de?
- [ ] Demo mod uyarısı görünür mü?
- [ ] Kategori çevirisi `KAT_LABEL` → AR karşılıkları doğru mu?
- [ ] `b1_agent_loglari` tablosu Supabase'de mevcut mu? Veri geliyor mu?
- [ ] "Onayla → Tasarıma Gönder" sonrası ne oluyor? M2 sekmesine otomatik bağlantı var mı?
- [ ] Görsel URL girilince önizleme gösteriliyor mu?

**Kritik Sorular (Eksik):**

- "Bu trend M2 (Kumaş) ile eşleştirildi mi?" bağlantısı yok
- Sezon etiketi (Yaz/Kış) eksik
- Onaylanan trend otomatik olarak M3 (Kalıp) aşamasını tetiklemiyor
- Farklı kullanıcıların trendi görebilmesi için RLS kritik

**Kör Nokta:**

- 🟡 Trend onaylandıktan sonra hangi adımın tetiklendiği belirsiz — ajan logu tutulsa da UI'da akış görünmüyor
- 🟢 Demo mod beklenmedik API hatasından iyi korunuyor

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🟠 M4 — MODELHANE & VİDEO (modelhane/page.js)

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Mevcut Özellikler (Kod Taramasıyla Onaylandı):**

- ✅ 3 Sekme: 🧵 Numune Kayıtları | 📋 Dikim Talimatları | 📷 Fotoğraf Galerisi
- ✅ Numune formu: Model seç + Kalıp seç + Beden (XS-3XL) + Dikim tarihi + Not
- ✅ Numune onay durumu: bekliyor / onaylandi / revizyon_gerekli
- ✅ Fason Kilit Kuralı: Video URL yoksa → "FASON KİLİTLİ" uyarısı
- ✅ Talimat formu: Onaylı numune seç + Video URL + Yazılı adımlar (dinamik ekle/sil/süre)
- ✅ Toplam süre otomatik hesaplanıyor
- ✅ Fotoğraf yükleme → Supabase Storage (`teknik-foyler` bucket)
- ✅ Fotoğraf galerisi: Model filtrelemeli, topam fotoğraf sayısı
- ✅ Fotoğraf silme (Storage + DB eş zamanlı)
- ✅ Lightbox: Fotoğrafa tıkla, yeni sekmede aç

**Denetim Kontrol Listesi:**

- [ ] `teknik-foyler` Supabase Storage bucket CREATE edilmiş mi?
- [ ] Video URL SADECE URL kabul ediyor — gerçek kamera çekimi YOK. Bu bilerek mi?
- [ ] Onaysız numune için talimat oluşturulabiliyor mu? (sadece `onay_durumu = 'onaylandi'` filtreliyor)
- [ ] Talimat video URL girilmeden form kaydediliyor ama "FASON KİLİTLİ" yazıyor mu?
- [ ] Galeri sekmesinde fotoğrafı sil → gerçekten Storage'dan siliniyor mu?
- [ ] Model kodu `b1_model_taslaklari` tablosundan geliyor — bu tablo M3 tarafından dolduruluyor mu?

**Kritik Sorular (Eksik):**

- Talimat onay akışı yok — talimat kaydedilince direkt aktif. Yönetici onayı gerekli mi?
- Fason firmaya talimat gönderme mekanizması (email/link/PDF) yok
- Sesli not kaydı alanı var (`sesli_aciklama_url`) ama UI'da input yok!
- Video çözünürlük/boyut uyarısı yok (Supabase depolama maliyeti)

**Kör Nokta:**

- 🔴 `sesli_aciklama_url` DB kolonunun UI'da karşılığı yok — veri girilemez
- 🔴 Gerçek kamera erişimi yok — video kanıtı URL bazlı simülasyon
- 🟡 Talimat olmadan (sadece numune onayıyla) üretim bandına iş atılabiliyor mu? => kontrol et

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🟠 1. BİRİM ANA KARARGAH — İmalat (imalat/page.js)

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Mevcut Özellikler (Kod Taramasıyla Onaylandı):**

- ✅ 4 Ana Pencere: 1. TEKNİK GÖRÜŞ | 2. İLK ÜRÜN ŞABLONU | 3. SERİ ÜRETİM (BANT) | 4. MALİYET & MUHASEBE
- ✅ P1 Teknik Görüş formu: Model adı, Görsel URL, Maliyet sınırı, Kumaş miktarı, Esneme payı → `v2_models` tablosu
- ✅ P2 Modelhane: Model seçimi dropdown + Video kanıtı simülasyonu (toggle) + Dinamik adım listesi
- ✅ P3 Seri Üretim: İş listesi (v2_order_production_steps) + Başla/Arıza/Bitir butonları
- ✅ P3 Personel panel: FPY (hata %) + Sosyal puan
- ✅ P4 Müfettiş: Onay bekleyen işler + Maliyet skoru + Rework sayacı + Onayla/Reddet

**Denetim Kontrol Listesi:**

- [ ] P1: `v2_models` tablosu Supabase'de var mı?
- [ ] P2: "ONAYLA VE SERİ ÜRETİME YÜKLE" → `v2_production_orders`, `v2_production_steps`, `v2_model_workflows`, `v2_order_production_steps` — 4 tabloya da yazılıyor mu?
- [ ] P3: `sahadakiIsiBaslat` → `start_time` yazılıyor mu?
- [ ] P3: `sahadakiIsiBitir` → `end_time` yazılıyor mu?
- [ ] P4: "42 dk/adet" **HARDCODED** — gerçek kronometre hesabı YOK
- [ ] P4: "Maliyet Sınırı: GÜVENLI" rengi — gerçek maliyet hesaplanıyor mu, dummy mi?
- [ ] P3 Personel: `fp_yield` değeri `v2_users` tablosundan geliyor, admin filtrelemesi var (`.filter(p => !p.email.includes('admin'))`)

**Kritik Sorular (Eksik):**

- P2 Video: sadece toggle — gerçek dosya yükleme yok
- P3: Gerçek zamanlı kronometre (saniye sayan) ekranda YOK — sadece status değişiyor
- P3: Hangi işçi hangi işi yapıyor? worker_id ataması eksik
- P4: Müfettiş PDF/fotoğraf görmüyor — sadece rework_count bakıyor

**KRİTİK KÖR NOKTA:**

- 🔴 P4'teki "42 dk/adet" değeri hardcoded (L177 `const [canliVeri = ... 42 dk) — gerçek kronometreyle hesaplanmıyor
- 🔴 Maliyet hesabı gerçek formülle çalışmıyor — "GÜVENLI" statik yazıyor
- 🔴 worker_id ataması yapılmıyor — hangi işçi ne yaptı bilinemez

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 💚 M12 — KASA & TAHSİLAT (kasa/page.js)

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Mevcut Özellikler (Kod Taramasıyla Onaylandı):**

- ✅ 2 Sekme: 💰 Kasa Hareketleri | 📋 Çek & Senet Takip
- ✅ Hareket tipleri: Tahsilat, İade Ödemesi, Avans, Çek, Senet
- ✅ Ödeme yöntemleri: Nakit, EFT, Kredi Kartı, Çek, Senet
- ✅ Müşteri ve Sipariş bağlantısı (dropdown)
- ✅ Vade tarihi + Vadesi dolmuş uyarısı (otomatik)
- ✅ Onay sistemi: bekliyor / onaylandi / iptal
- ✅ Ödeme yöntemi bazında Net Bakiye breakdown
- ✅ İstatistik: Onaylı Tahsilat, İadeler, Net Kasa, Onay Bekleyen, Vadesi Gelen
- ✅ Çek/Senet sekmesi: Toplam, Vadesi Geçmiş, 7 Günde Dolacak
- ✅ Düzenle + Sil + Onayla + İptal Et butonları

**Denetim Kontrol Listesi:**

- [ ] `b2_kasa_hareketleri` tablosu Supabase'de var mı?
- [ ] Müşteri listesi `b2_musteriler` → `aktif = true` filtreli — doğru mu?
- [ ] Tavla tarihi filtresi (vade_tarihi ≤ bugün) doğru çalışıyor mu?
- [ ] Net Kasa günlük kapanış yapılıyor mu? Hangisi gece yarısı sıfırlanıyor?
- [ ] Hareket onaylandığında muhasebe tablosu tetikleniyor mu?

**Kritik Sorular (Eksik):**

- Dövizli ödeme (USD, EUR) desteği yok
- PDF/Fiş yazdırma özelliği yok
- Aylık kasa özeti/raporu yok (M16 Raporlar'a bırakılmış)
- Kasa limitı/üst eşik uyarısı yok

**Kör Nokta:**

- 🟡 `eft_havale` olarak kayıtlı ödeme yöntemi kodu; DB'de `eft` vs `eft_havale` tutarsızlığı var (L148 `eft_havale`, ama Supabase'e `eft` gönderiliyor olabilir)
- 🟢 Genel olarak sağlam ve kullanışlı yapı

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 💙 M14 — PERSONEL & PRİM (personel/page.js)

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Mevcut Özellikler (Kod Taramasıyla Onaylandı):**

- ✅ 3 Sekme: 👥 Personel Listesi | 📅 Devam & İzin | 💰 Prim Motoru
- ✅ Roller (10 adet): Düz Makinacı, Overlokçu, Reşmeci, Kesimci, Ütücü, Paketçi, Ustabaşı, Koordinatör, Muhasebeci, Depocu
- ✅ TR + AR isim desteği
- ✅ Saatlik ücret → Günlük ücret önizleme (formda anlık)
- ✅ İzne Al / Aktif Et butonları
- ✅ Devam & İzin sekmesi: Çalıştı / İzinli / Hastalık / Gelmedi / Resmi Tatil
- ✅ Prim Motoru: Eşik Bazlı Hesaplama
  - Aylık Maliyet Eşiği = 22 gün × Günlük ücret
  - Üretim Değeri = Toplam dk × ₺2.50 (sabit)
  - Aşım × %15 = Prim hakkı
  - Progress bar + yeşil/kırmızı gösterge

**Denetim Kontrol Listesi:**

- [ ] `b1_personel` tablosu — tüm kolonlar mevcut mu?
- [ ] `b1_personel_devam` tablosu — FK `personel_id` çalışıyor mu?
- [ ] Prim Motoru: `DAKIKA_BASI_UCRET = 2.50` **HARDCODED** — ayarlar sayfasından gelmeli
- [ ] `PRIM_ORANI = 0.15` **HARDCODED** — bu da ayarlardan gelmeli
- [ ] Devam kaydında aynı kişi aynı gün iki kez kayıt yapılabiliyor mu? (Unique constraint?)
- [ ] FPY verisi prim motoru hesabına dahil edilmiyor — hata oranı yüksek personelin prim düşmüyor!

**Kritik Sorular (Eksik):**

- Prim Motoru gerçek üretim verisiyle çalışmıyor — sadece saat üzerinden hesaplıyor
- SGK/sigorta kesintileri hesaplanmıyor
- İzin bakiyesi (yıllık izin kaç gün kaldı) yok
- Avans takibi (Kasa modülüyle entegre olmalı) yok
- Personelin hangi makineleri kullanmaya yetkili olduğu yok

**Kör Nokta:**

- 🔴 Prim hesabı gerçek üretim verisinden bağımsız — sahadaki kronometreyle entegre DEĞİL
- 🔴 FPY düşük personel daha fazla prim alabilir (hata cezası yoksa)
- 🟡 Hardcoded değerler değiştirilemez — ayarlar sayfasına taşınmalı

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📊 M16 — RAPORLAR & ANALİZ (raporlar/page.js)

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Mevcut Özellikler (Kod Taramasıyla Onaylandı):**

- ✅ 4 Sekme: 📊 Genel Özet | 💰 Birim Maliyet | 📈 Kar & Zarar | 🛍️ Siparişler
- ✅ Tarih aralığı filtresi (başlangıç - bitiş)
- ✅ Genel Özet: Model, Kumaş, Sipariş, Personel, Aktif Üretim, Teslim Ciro sayı kartları
- ✅ Sipariş dağılımı progress bar
- ✅ Maliyet dağılımı (4 tip: işçilik, işletme, sarf, fire)
- ✅ Birim Maliyet: Muhasebe raporlarından Toplam Maliyet ÷ Adet
- ✅ P&L: Gelir, Gider, Net Kar, Kar Marjı
- ✅ Siparişler listesi: Son 10 sipariş

**Denetim Kontrol Listesi:**

- [ ] `b1_muhasebe_raporlari` tablosu ve `production_orders` FK bağlantısı çalışıyor mu?
  - NOT: Kod `production_orders` kullanıyor ama diğer modüller `v2_production_orders` kullanıyor
- [ ] Tarih filtresi tüm sorgulara eş zamanlı uygulanıyor mu?
- [ ] Download/Export butonu UI'da VAR (`lucide-react Download` import edilmiş) ama KULLANILMIYOR
- [ ] Rol bazlı görünürlük: Koordinatör hepsini görüyor mu? İşçi sadece kendini mi?

**Kritik Sorular (Eksik):**

- PDF/Excel dışa aktarma yok (Download iconu var ama bağlı değil)
- Personel performans raporu yok
- Trend karşılaştırma (bu ay vs geçen ay) yok
- Model bazlı kârlılık raporu yok

**Kör Nokta:**

- 🔴 `production_orders` tablosu kullanılıyor, diğer modüller `v2_production_orders` — tablo adı tutarsızlığı
- 🟡 Download butonu import edilmiş ama fonksiyonu bağlanmamış — görüntü yanıltıcı

---

## 🔌 BÖLÜM 3 — API DENETİMİ

| API | Durum | Test |
|---|---|---|
| `/api/trend-ara` | ✅ Mevcut — Perplexity AI | Demo mod var, gerçek API key kontrol et |
| `/api/telegram-webhook` | ✅ Mevcut — Telegram Bot | Hangi olaylarda tetikleniyor? Token geçerli mi? |

**Eksik Olması Gereken API'ler:**

| Eksik API | Neden Gerekli? | Öncelik |
|---|---|---|
| `/api/maliyet-hesapla` | Gerçek birim maliyet (kronometre + kumaş) | 🔴 KRİTİK |
| `/api/prim-hesapla` | Gerçek üretim verisine dayalı prim | 🔴 KRİTİK |
| `/api/rapor-pdf` | PDF dışa aktarım | 🟡 Yüksek |
| `/api/bildirim` | Kritik stok/vade/arıza bildirimi | 🟡 Yüksek |
| `/api/fpy-guncelle` | İşçi hata oranı otomatik güncelleme | 🟠 Orta |

---

## 🧪 BÖLÜM 4 — TARAYICI CANLI TEST PROTOKOLÜ

### 4.1 Giriş Senaryosu (localhost:3000)

```
TEST 1: http://localhost:3000/giris → admin / admin123 ile giriş
TEST 2: Yanlış şifre → hata mesajı görünüyor mu?
TEST 3: Giriş sonrası Dashboard yükledi mi?
TEST 4: Sayfa yenile → oturum korunuyor mu?
TEST 5: /raporlar'a direk git → giriş ekranına yönlendiriyor mu?
```

### 4.2 1. Birim Tam Akış Testi

```
ADIM 1: /arge → Trend ara ("2026 keten elbise") → AI sonucu geliyor mu?
ADIM 2: /arge → Manuel trend ekle → Supabase'e gidiyor mu?
ADIM 3: /arge → Trendi onayla → "Tasarıma Gönder" butonuna bas
ADIM 4: /modelhane → Numune kayıtları sekmesi → Yeni Numune ekle
ADIM 5: /modelhane → Dikim Talimatları → Adımlar ekle + Video URL gir
ADIM 6: /modelhane → Video URL OLMADAN kaydet → "FASON KİLİTLİ" çıktı mı?
ADIM 7: /modelhane → Fotoğraf Galerisi → Fotoğraf yükle → Görünüyor mu?
ADIM 8: /imalat → 4 pencereyi sırayla test et
ADIM 9: /imalat → P3 İş başlat → P4'te görünüyor mu?
ADIM 10: /raporlar → P&L sekmesi → Gelir/Gider doğru mu?
```

### 4.3 Stres ve Sınır Testi

```
TEST A: Boş form gönder → Zorunlu alan uyarıları çıkıyor mu?
TEST B: Negatif Tutar → Kasa: -500 → Kabul ediyor mu?
TEST C: 0 adım ile Fasona Gönder → Engelleniyor mu?
TEST D: Geçersiz URL ile trend kaydet → Sistem çöküyor mu?
TEST E: 1000 karakterlik metin girişi → Input limitleri var mı?
TEST F: İki sekmede aynı anda form doldur → Race condition var mı?
TEST G: İnternet kesilse → Hata mesajları anlaşılır mı?
```

### 4.4 Mobil Uyumluluk (375px)

```
TEST: DevTools → iPhone boyutu
  - Sidebar hamburger menüsü açılıyor mu?
  - Prim Motoru kartları okunuyor mu?
  - Saha butonları (Başla/Bitir/Arıza) kolayca tıklanıyor mu?
```

---

## 🎓 BÖLÜM 5 — AKADEMİK DEĞERLENDİRME

### 5.1 Tespit Edilen Hardcoded Değerler (Değiştirilmesi Gereken)

| Konum | Değer | Çözüm |
|---|---|---|
| `personel/page.js` L173 | `DAKIKA_BASI_UCRET = 2.50` | Ayarlar'a taşı |
| `personel/page.js` L174 | `PRIM_ORANI = 0.15` | Ayarlar'a taşı |
| `imalat/page.js` P4 | "42 dk/adet" statik yazıyor | Gerçek kronometre entegre et |
| `imalat/page.js` L102 | `quantity: 500` sabit | Kullanıcıdan al |

### 5.2 Tablo Adı Tutarsızlıkları (Kör Nokta)

| Modül | Kullanılan Tablo | Sorun |
|---|---|---|
| `imalat/page.js` | `v2_models`, `v2_production_orders` | v2_ prefix |
| `raporlar/page.js` | `production_orders` (v2_ YOK) | Prefix tutarsız |
| `imalat/page.js` | `v2_users` | v2_ prefix |
| Diğer modüller | `b1_personel`, `b2_siparisler` | b1_/b2_ prefix |

**Sistem 3 farklı tablo şeması kullanıyor. Bu kritik risk!**

### 5.3 OEE Analizi (Mevcut Durum)

```
OEE = Kullanılabilirlik × Performans × Kalite
    = (Arıza kaydı var? ✅) × (Kronometre gerçek? ❌) × (FPY takibi kısmi ✅)
```

**OEE tam hesaplanamıyor — kronometre ve gerçek üretim verisi eksik.**

---

## 🚀 BÖLÜM 6 — EKSİK ÖZELLİKLER ANALİZİ

### 6.1 KRİTİK — Üretim Verimliliği

| Özellik | Durum | Öncelik |
|---|---|---|
| Gerçek zamanlı kronometre (saniye görünür) | ❌ YOK | 🔴 KRİTİK |
| Worker_id ile iş ataması | ❌ YOK | 🔴 KRİTİK |
| Prim motoru → Gerçek üretim verisi | ❌ YOK | 🔴 KRİTİK |
| `sesli_aciklama_url` UI input | ❌ YOK | 🔴 KRİTİK |
| Tablo adı tutarsızlıklarının giderilmesi | ❌ YOK | 🔴 KRİTİK |

### 6.2 YÜKSEK — İşletme Değeri

| Özellik | Durum | Öncelik |
|---|---|---|
| PDF/Excel rapor dışa aktarımı | ❌ YOK | 🟡 Yüksek |
| Trend → M2 → M3 otomatik köprü | ❌ YOK | 🟡 Yüksek |
| Fason firmaya talimat gönderme | ❌ YOK | 🟡 Yüksek |
| Dövizli ödeme (USD/EUR) | ❌ YOK | 🟡 Yüksek |
| Kapasiteye göre iş sıralama | ❌ YOK | 🟡 Yüksek |

### 6.3 ORTA — Kullanıcı Deneyimi

| Özellik | Durum | Öncelik |
|---|---|---|
| Personel izin bakiyesi takibi | ❌ YOK | 🟠 Orta |
| Makine yetkinlik kaydı | ❌ YOK | 🟠 Orta |
| Müşteri memnuniyet skoru | ❌ YOK | 🟠 Orta |
| Stok sayımı yönetimi | ❌ YOK | 🟠 Orta |

---

## 📝 BÖLÜM 7 — DENETİM RAPOR FORMATI

```markdown
# 47_SIL_BASTAN_01 SİSTEM DENETİM RAPORU
**Denetim Tarihi:** [Tarih]
**Denetleyen:** [Ajan/Kişi]
**Sistem Versiyonu:** Next.js 16.1.6 Turbopack

## YÖNETİCİ ÖZETİ

## MODÜL BAZLI BULGULAR (M1-M16 + Sistemler)
### [Her modül için]:
- **Puan:** A-D boyutları
- **Çalışan Özellikler:** Liste
- **Hardcoded Değerler:** Liste
- **Kör Noktalar:** Öncelikli liste
- **Geliştirme Önerileri:** Liste

## KRİTİK BULGULAR TABLOSU
| Modül | Sorun | Risk | Çözüm |

## TABLO TUTARSIZLIKLARI RAPORU

## OEE DEĞERLENDİRMESİ

## AKSİYON PLANI (Öncelikli)
| # | Aksiyon | Modül | Risk | Süre Tahmini |

## SONUÇ PUANLAMA
```

---

## ⚡ BÖLÜM 8 — PUANLAMA KARTI

| Kategori | Ağırlık | Puan (0-10) |
|---|---|---|
| Fonksiyonel Doğruluk | %25 | Doldur |
| İş Akışı Mantığı | %20 | Doldur |
| Güvenlik ve Rol | %20 | Doldur |
| Veri Bütünlüğü | %15 | Doldur |
| Kullanıcı Deneyimi | %10 | Doldur |
| Ölçeklenebilirlik | %10 | Doldur |
| **TOPLAM** | **%100** | **/100** |

> - 90-100: Üretime hazır ✅
> - 75-89: Küçük düzeltmelerle hazır 🟡
> - 60-74: Orta geliştirme gerekli 🟠
> - 0-59: Majör yeniden yapılandırma 🔴

---

## 🎯 BÖLÜM 9 — DENETİM YAPACAK AJANIN YAPILACAKLAR LİSTESİ

```
1. npm run dev → localhost:3000 başlat
2. admin/admin123 ile giriş
3. Bölüm 4'teki tüm test senaryolarını uygula
4. Her modülde Bölüm 2'deki kontrol listesini çalıştır
5. Özellikle işaretle:
   a. "42 dk/adet" hardcoded değeri → P4 maliyet paneli
   b. tablo adı tutarsızlıkları (v2_ vs b1_ vs production_orders)
   c. sesli_aciklama_url UI yokluğu
   d. Download butonu bağlantısızlığı
   e. prim motoru gerçek veri bağlantısızlığı
6. Supabase SQL Editor'da:
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   → Hangi tablolar gerçekten var? v2_ ve b1_ gruplarını listele
7. Bölüm 7 formatında DENETIM_RAPORU_[TARIH].md oluştur
8. Bölüm 8 puanlama kartını doldur
9. Dosyayı .agents/emirler/ dizinine kaydet
```

---

**BU İŞ EMRİ TAMADIR. Gerçek kod taramasına dayanmaktadır. Kör nokta bırakmama ilkesiyle hazırlanmıştır.**

*İş Emri ID: 04_KAPSAMLI_SISTEM_DENETIM_v2 | 2026-03-07*
