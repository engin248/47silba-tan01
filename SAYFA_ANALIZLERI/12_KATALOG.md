# PİTRİN & KATALOG (M12) — Detaylı Sayfa Analizi
**Rota:** `/katalog` | **Dosya:** `src/features/katalog/components/KatalogMainContainer.js`  
**Toplam:** 1047 satır  
**Görev:** Ürünlerin son fiyatlarını, varyantlarını (beden/renk), fotoğraflarını ve anlık kur bilgilerini müşteri/pazarlama için uygun vitrinde sergilemek. Toplu ürün yükleme, anlık döviz çekimi.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b2_urun_katalogu` tablosu | VAR | satır 111 |
| Akıllı Realtime Optimize (Debounce Delay 300ms) | VAR | satır 104-131 |
| USD Kur Entegrasyonu (`/api/kur` Fetch) | VAR | satır 55, 62 |
| WhatsApp üzerinden fiyat/ürün fırlatma | VAR | satır 145-149 |
| Kategori Hiyerarşisi (Ana Kategori > Alt Kategori) | VAR | satır 23-32 |
| Excel/CSV ile Toplu Yükleme Modülü (XLSX) | VAR | satır 17, 95 |
| SKU Matris Yapısı (Örn S-Siyah Varyant Stokları) | VAR | satır 87-89 |
| Fiyat Geçmişi (Log Modal) | VAR | satır 83 |
| Döviz bazlı fiyat hesabı ($ vs ₺) | VAR | satır 55 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. STOK SİSTEMİ ÇİFT YAZIM PROBLEMİ

**Sorun:** Katalogda bir ürünün stok bilgisi (`stok_adeti` sütununda) sabit bir numara (integer) olarak tutuluyor. Ancak biliyoruz ki, Stok sayfasında (M11) bu sayı `b2_stok_hareketleri` ile toplanıyordu.
Katalog sayfasındaki sayı formdan manuel giriliyor "Yeni Ürün -> Stok Adeti: 50". Oysa ERP'de Katalog stok miktarını kendisi elle almamalı; M11 Stok Depo (Girenler - Çıkanlar) = Güncel Durum hesabı sayesinde bu alan sürekli anlık olarak otomatik güncellenmeli. El ile girilen statik `stok_adeti` hataya mahal verir.

### 2. M7 (MALİYET) ÖNERİLEN SATIŞ FİYATI AKTARILMIYOR

M7 Maliyet sayfasındaki "Önerilen Satış Fiyatı" hesaplanıyor ama M12 Katalog sayfasına ürün fiyatı eklenirken referans alınmıyor. Ürünü ekleyen kişi "Satiş Fiyati ₺" kutusunu M7'den bağımsız kafasına göre dolduruyor. M7 fiyatı ile M12 fiyatı arasında bir kıyas zırhı (Örn: "Maliyet fiyatının altına inilemez") mevcut değil.

### 3. FOTOĞRAF STORAGE (YÜKLEME) ARAYÜZÜ YOK, SADECE LİNK

Yeni katalog ürünü eklerken "Fotoğraf URL" girilmesi isteniyor (`fotograf_url`, `fotograf_url2`). Firebase veya Supabase Storage üzerinden dosyayı (Masaüstünden .jpg seçerek) yüklemek ve linki otomatik almak yerine, URL kopyala-yapıştır yapılması gerekiyor. Veri girişi için zorlayıcı (satır 42).

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| M11 Stok Haritası | M12 Katalog Stok | YOK | İkisi ayrı teldençalıyor (Biri tablo, biri manuel sayı) |
| M7 Önerilen Fiyat | Katalog Fiyat | YOK | Maliyet ve belirlenen kâr oranı forma çekilmiyor |
| Barkod/QR Sistemi | Katalog Beden | KISMI | SKU matrisi var ancak her serinin fiziksel yazıcısı/PDF'si bağlanmamış |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **XML/API Ürün Feed Çıkışı** → Katalog verilerinin direkt N11, Trendyol, Hepsiburada XML entegrasyon havuzuna bağlanıp pazar yerlerine aktarımı.
- [ ] **Dinamik Fiyatlandırma AI** → Döviz USD arttığı saniye, kâr marjını korumak için satış fiyatlarını toplu (Bulk) değiştiren gece robotu (Cron).
