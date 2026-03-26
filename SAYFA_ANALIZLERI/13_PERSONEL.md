# İNSAN KAYNAKLARI VE PUANTAJ (M13) — Detaylı Sayfa Analizi
**Rota:** `/personel` | **Dosya:** `src/features/personel/components/PersonelMainContainer.js`  
**Toplam:** 819 satır  
**Görev:** Şirket çalışanlarının kaydı, avans takibi, günlük devam (puantaj) durumu, prim ve saatlik/dakikalık maaş hesaplarının yapılması.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b1_personel` ve `b1_personel_devam` tabloları | VAR | satır 109, asekme === 'devam' |
| Avans Çekimi (`b2_kasa_hareketleri` onaylı) | VAR | satır 112-117 |
| 10 Farklı Rol (Düz makinacı, ütücü vb.) | VAR | satır 18-24 |
| Sistem Ayarları Bağımlılığı (Maaş/Prim için) | VAR | satır 82-90 |
| Mükerrer `personel_kodu` engeli Zırhı | VAR | satır 143 |
| Realtime Websocket | VAR | satır 65 |
| İzin Bakiyesi/Günlük Çalışma (480 dk) Tanımları | VAR | satır 30 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. HAKEDİŞ VE MAAŞ FİŞİ (BORDRO YAZIMI) YOK

**Sorun:** Sistemde "Maaş = Saatlik ücret * Gün" formülünü ekranda gösteren kısımlar var (Örn. `aylik: gunluk * 22`). Ancak her ayın 1'inde bu hesaplanan toplam maaşın (Devamsızlık ve Avanslar düşülerek) dondurulup "Bu ay X TL borçlandık" diye bir `b1_personel_maaslari` cetveline yazılması gerekir. Eğer bu geçmiş olarak dondurulmazsa, ayarları veya devamsızlıkları ileride sildiğinizde geçmiş ayların maaşları da bozulur (Düşünülmemiş).

### 2. AVANS TOPLAMI OTOMATİK DÜŞÜLMÜYOR

M6 (Kasa) üzerinden verilen Onaylı Avanslar `b2_kasa_hareketleri` tablosundan (satır 112) okunup ekranda personelin kartına yazılıyor ama gün sonu/ay sonu hakediş hesabında "netEleGecen = (Maaş + Prim) - ÇekilenAvans" matematiksel işlemi backend tablosunda birikecek şekilde ayarlanmamış. Formül sadece FrontEnd'de UI gösterişinden ibaret kalmış.

### 3. PRİM HESAPLAMA MOTORU TETİKLENMİYOR

Personel sayfasındaki "Ayarlar (M23)" tablosundan Prim Oranı % si çekiliyor (`b1_sistem_ayarlari`). Ancak üretim (İmalat M4) modülünde süresinden önce bitirilen bir malın (vicdan motorunun) kârından çıkan paranın Personel kartına aktarıldığı mekanizma çalışmıyor. Prim sadece "ayarlardan gelen % oranı" olarak okunuyor.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Personel Maaşı | Kasa (M6) | YOK | Maaş ödendiğinde kasa eksi yazmıyor |
| Ay Sonu Kapanışı | Muhasebe (M8) | YOK | Sabit gider olarak maaşlar devredilmiyor |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **RFID / Yüz Tanıma PDKS cihazı** → Turnikeden parmak izi ile geçildiğinde `b1_personel_devam` tablosuna API ile otomatik giriş (Manuel girişi öldürür).
- [ ] **E-Devlet Bordro Çıktısı** → SGK e-bildirge için hazır XML çıktısı.
