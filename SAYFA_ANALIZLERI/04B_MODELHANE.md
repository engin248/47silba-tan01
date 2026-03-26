# MODELHANE & TEKNİK ANALİZ (M4) — Detaylı Sayfa Analizi
**Rota:** `/modelhane` | **Dosya:** `src/features/modelhane/components/ModelhaneMainContainer.js`  
**Toplam:** 264 satır  
**Görev:** M3'den gelen numune dikim emirlerini işlemek, kronometre ile ilk operasyon süresini tutmak, özel makine riskini analiz edip M5 Kesime veya M1'e (Aşama 4 Ret) göndermek.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `m3Talepleri` M3 Kalıphane onaylı iş emri | VAR | satır 93 |
| Canlı Swal kronometresi (Numune Dikimi) | VAR | satır 108-176 |
| Bitiş süresinin `numuneDikimiBitir(kod, süre)` ile yazımı | VAR | satır 164 |
| Teknik 5 Soru Rapor listesi | VAR | satır 205-251 |
| Red kararı → "iptal_riskli" durumu | VAR | satır 209, 218 |
| İptal → M1 Beyine geri gönder butonu | VAR | satır 243 |
| Başarılı → M5 Kesim Sürecini Başlat butonu (`uretime_hazir`) | VAR | satır 247 |
| Arama filtresi | VAR | satır 201 |
| `yetkiliMi` kontrolü | VAR | satır 22-30 |
| Açıklama içinden REGEX ile süre çıkarma | VAR | satır 208 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. DİKİM SÜRESİ STRİNG İÇİNE GÖMÜLÜYOR (ANTI-PATTERN)

**Sorun (satır 208):**
```js
const iscilikSuresiText = k.aciklama?.match(/Numune (\d+) saniyede dikildi/)?.[1] ? `${k.aciklama.match(/Numune (\d+) saniyede dikildi/)[1]} Saniye` : 'Bilinmiyor';
```
Numune dikimi bitince süre saniye cinsinden integer bir tablo kolonuna (`ilk_numune_suresi_sn` gibi) yazılması gerekirken, `aciklama` kolonuna "Numune 45 saniyede dikildi" olarak string (metin) şeklinde kaydediliyor. Modelhane sayfası bunu okumak için Regex kullanıyor. Bu çok büyük bir anti-pattern'dir. Bu saniye ile maliyet hesaplanamaz veya matematiksel işlem yapılamaz.

### 2. ÖZEL MAKİNE RİSKİ KONTROLÜ METİN BAZLI

**Sorun (satır 207):**
```js
const ozelMakineRef = k.aciklama?.toLowerCase().includes('özel makine') || false;
```
Modelin özel makine (darboğaz) gerektirip gerektirmediği yine `aciklama` içindeki string ile kontrol ediliyor. Eğer raporda "Özel Makine Kullanıldı" yazarsa riskli, yazılmazsa güvenli sayılıyor. Bunun backend'de boolean (`ozel_makine_mi: boolean`) bir flag olması gerekirdi.

### 3. KPI VERİLERİ HARDCODED

**Satır 61-66:** 
"Ort. İşçilik Süresi: 42 dk", "Özel Makine İhtiyacı: 2", "İmalat Hatası: %8.4" gibi yukarıdaki gösterge (KPI) verilerinin tamamı statik (hardcoded). Sistemin veritabanında saklanan verileri kullanılmıyor.

### 4. KRONOMETRE KAPANABİLİR

Swal ile açılan sayaç (`setInterval`) sayfa yenilendiğinde (F5) veya internet koptuğunda tamamen kayboluyor. Gerçek üretim hattında kronometrenin PWA/Offline veya State (Redux/Zustand) veya LocalStorage tabanlı kapanmaz bir yapıda olması gerekirdi. Fişi çekilmiş bir kronometre süreci 0'dan başlatır.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| M4 Numune Süresi | M4/M7 Maliyet | YOK | String kaydedildiği için paraya çevrilemiyor |
| M4 Özel Makine | M8 Ek Maliyet | YOK | String check ediliyor, maliyet çıkarılmıyor |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Makine IoT Bağlantısı** → Kronometre yerine sanayi makinesindeki pedala basıldığında sayacı başlatan elektronik entegrasyon (PLC/IoT).
- [ ] **Video Kaydı Modülü** → Numune diken ustanın videosunu otomatik buluta atıp, sonraki bant eğitimlerinde gösterme.
- [ ] **Ergonomi/Zorluk Skoru** → AI destekli usta geri bildirim formları.
