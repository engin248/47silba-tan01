# KASA & FİNANS YÖNETİMİ (M6) — Detaylı Sayfa Analizi
**Rota:** `/kasa` | **Dosya:** `src/features/kasa/components/KasaMainContainer.js`  
**Toplam:** 524 satır  
**Görev:** Şirket içi tüm para giriş/çıkışını (Tahsilat, Senet, Çek, İade, Personel Avansı vb.) takip eden ve onay mekanizması barındıran çekirdek finans modülü.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b2_kasa_hareketleri` tablosu | VAR | satır 119 |
| CSV Dışa Aktar (kasaCsvIndir) | VAR | satır 13-41 |
| 6 Hareket Tipi (tahsilat/iade/cek/senet/avans/diger) | VAR | satır 43 |
| 6 Ödeme Yöntemi (nakit/eft/kredi_karti/cek/senet/diger) | VAR | satır 44 |
| Onay Akışı (bekliyor → onaylandi/reddedildi) | VAR | satır 149 |
| Personel Avans girişinde personel ID bağlama | VAR | satır 52, 148 |
| Müşteri ID bağlama | VAR | satır 147 |
| Realtime WebSocket (Visibility algılamalı PWA) | VAR | satır 89 |
| Filtreleme (Tip ve Onay Durumuna göre) | VAR | satır 75-76 |
| Kilit koruması (islemdeId çift tık engeli) | VAR | satır 77 |
| Onay Yetkisi Kontrolü (Sadece 'tam' gruplular) | VAR | satır 82 |
| Tutar Valitasyon (Maks 10 Milyon, >0) | VAR | satır 137 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. KASA TOPLAM BAKİYE GÖSTERGESİ YOK (GÖRSELDE ve HESAPLAMADA)

Kasa sayfası listeyi gösteriyor, hareketleri CSV indiriyor ama **Kasa Bakiyesi (Toplam İçerdeki Para)** hesaplanmıyor. Sayfanın en üstünde "Toplam Nakit: XXX TL, Toplam Çek: YYY TL" gibi bir KPI panosunun veritabanından kümülatif çekiliyor olması gerekirdi. Rakamlar sadece kayıt bazlı duruyor, toplanmıyor.

### 2. AVANS VE PERSONEL MAAŞ/PRİM DÜŞÜMÜ

Kasa sayfasında "Avans" verildiğinde işlem `personel_id`'ye bağlanıyor (Satır 148), çok güzel. Ancak bu avans, Personel (M13) tablosunda `b1_personel` hesabından "Avans Borcu" olarak düşüyor mu? Avans verildiğinde Personel Modülünün bakiyesinin otomatik tetiklenmesi gerekir.

### 3. FATURA/MAKBUZ DOSYA YÜKLEMESİ (STORAGE) YOK

EFT veya Nakit işlemlerde, makbuzun veya faturanın fotoğrafının eklendiği bir Supabase Storage fotoğraf yükleme alanı yok. Bir kasa hareketinin tek kanıtı `aciklama` kolonundaki metin. Kurumsal sistemlerde her ödemenin bir "Fiş Numarası" veya "Fiş Fotoğrafı" olmalıdır.

### 4. SİPARİŞLE (M9) DİREKT BAĞLANTI EKSİK

Kasa hareketi bir müşteriye bağlanabiliyor (`musteri_id`). Ancak spesifik olarak **hangi siparişe istinaden** (`siparis_id` eksik) bu tutarın tahsil edildiği yazılamıyor. Böylece bir siparişin "Kalan Borcu" kümülatif olarak müşteri bazlı hesaplanmak zorunda kalıyor, sipariş bazlı maliyet-kâr denetimi zorlaşıyor.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Kasa Avans | Personel (M13) | BİLİNMİYOR | Personel tablosunda borç olarak yazılıyor mu kontrolü |
| Kasa Tahsilat | Sipariş (M9) | YOK | Sipariş ID eksik, sadece Müşteriye bağlanıyor |
| Kasa Hareketi | Dosya / Belge | YOK | Fiş, e-Fatura PDF, Makbuz fotoğraf yüklemesi |
| Tüm Hareketler | Karargah | KISMI | Karargahtaki kasa özeti ile buradaki toplamların senkronu |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Banka API Entegrasyonu (Açık Bankacılık)** → Şirket hesabına düşen EFT'lerin kasa tablosuna otomatik onay bekleyen olarak yansıması.
- [ ] **Döviz / Parite Desteği** → USD/EUR ile ödeme alma, o günün TCMB kuruyla tl karşılığının yazılması.
- [ ] **Kasa Gruplandırma** → Şube kasası, merkez kasa, çekmecedeki nakit alt kırılımları.
