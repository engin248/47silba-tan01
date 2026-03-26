# SİSTEM ANAYASASI VE AYARLAR (M23) — Detaylı Sayfa Analizi
**Rota:** `/ayarlar` | **Dosya:** `src/features/ayarlar/components/AyarlarMainContainer.js`  
**Toplam:** 327 satır  
**Görev:** Şirketin üretim kilitlerini (inisiyatif/tolerans), şirket unvan ve vergi no bilgisini, dil ve maaş/prim oranlarını evrensel olarak bir kere girip diğer modüllerin (Örn: Modelhane Video uzunluğu) okumasını sağlayan çekirdek yapı.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b1_sistem_ayarlari` CRUD (Tekil JSON alanı) | VAR | satır 63, 86 |
| Yöneticinin PIN kontrol güvenlik Zırhı | VAR | satır 72-76, 115-124 |
| Şirket VKN / Logo Profili Girdileri | VAR | satır 292-295 |
| Form Kontrolleri (Oran % kısıtı vb.) | VAR | satır 78-81 |
| Medya ve Video sınırlandırma süresi kontrolü | VAR | satır 252-257 |
| Offline / Kuyruk Koruması (`UPSERT`) | VAR | satır 102 |

---

## ❌ EKSİK BİLGİ AKIŞLARI / MİMARİ RİSKLER (KÖR NOKTALAR)

### 1. ZAMAN DAMGASI (GEÇMİŞE ETKİ EŞİĞİ) EKSİKLİĞİ

**Kritik Mimarî Hata:** Sistem ayarlarında `prim_orani: 0.15` varsayalım. İşçi M13 Personel sayfasında 1 yıl boyunca aylık %15'ten prim aldı. Sonra yönetici M23 Ayarlar sayfasına geldi ve primi `%0.25 (Yüzde 25)` olarak güncelledi. `b1_sistem_ayarlari` tekil (`upsert`) kaydıdır, yani JSON yapısını overwrite yapar (ezerek yazar). Personel modülünde "Bu ay ne prim almış" diye hesaplanacakken, geçmiş 11 ayın formülü de (sabit kalmadığı için) bozulur veya geriye dönük hesaplarda raporlar M23'den çektiği anlık veriyi kullanırsa "Muhasebe tarihi yalan" olur. Değişen kurların, oranların ERP'lerde zaman damgalı/versiyonlu (Event-sourcing) kaydedilmesi `SHIELD-RULE` tarzı bir mimari gerektirir. Şu an o yok.

### 2. BİLDİRİM TERCİHLERİ WEBHOOK BAĞIMSIZ

Ayarlarda `bildirim_uretim`, `bildirim_stok` gibi Boolean (Açık/Kapalı) tercihleri var (satır 310). Lakin arka plandaki NIZAM AI telegram bot mekanizması bu bayraklara (Flags) bakarak "Aa dur yönetici bildirim stok = false yapmış, telgrafa yollamayım" kalkanına sahip olmayabilir. İlettiğimiz Telegram bot api kodları statik yolluyor diye gözüküyordu.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Prim Oranı / Ücret | Finansal Geçmiş | YOK | Önceki aydaki maaşları bozma potansiyeli çok yüksek. |
| Yabancı Dil Seçimi | Client Router | BİLİNMİYOR | `aktif_dil: 'ar'` yapıldı ama context update ediliyor mu detay meçhul. |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Modül Yetkilendirme Matrisi** → Sadece M6 Kasayı görecek finansçı veya Sadece M4 Modelhaneyi görecek Şef için sayfa bazlı Yetki Ağacı.
- [ ] **Güvenlik Logları (Audit Trail)** → "Dakika Başı Ücreti Kim, Saat kaçta 3 TL'den 2.8 TL'ye düşürdü?" sorusunun yanıtı için tüm ayarların manipülasyon geçmişi çizelgesi.
