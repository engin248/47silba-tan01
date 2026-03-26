# KALIPHANE & ÜRETİM PLANLAMA (M3) — Detaylı Sayfa Analizi
**Rota:** `/kalip` | **Dosya:** `src/features/kalip/components/KalipMainContainer.js`  
**Toplam:** 460 satır  
**Görev:** M2'den onaylanan (ya da yeni yaratılan) modellerin beden ve pastal (fiziksel ölçü) ayarlarını dijitalleştirmek. `b1_model_taslaklari` ve `b1_model_kaliplari` yönetimi.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b1_model_taslaklari` ve `b1_model_kaliplari` tabloları | VAR | satır 67, 80 |
| AR-GE trend filtresi (`ai_satis_karari` IN `['ÇOK_SATAR', 'BİNGO']`) | VAR | satır 68 |
| Mükerrer `model_kodu` engeli | VAR | satır 103, 116 |
| Mükerrer `kalip_adi` engeli (Aynı model_id altında) | VAR | satır 156, 166 |
| Pastal boy x en + fire metraj hesabı | VAR | satır 205-211 |
| Çoklu beden seçimi listesi (XS-3XL vs) | VAR | satır 11, 213 |
| M4 Modelhaneye UI butonu yönlendirmesi `<Link href="/modelhane">` | VAR | satır 248-252 |
| Çevrimdışı (offline) PWA veri kuyruklama | VAR | satır 135-141, 181-186 |
| Silme kararı → `b0_sistem_loglari` kara kutu yazımı | VAR | satır 198 |
| Silmek için Yönetici PIN `silmeYetkiDogrula` | VAR | satır 193 |
| KPI istatistikleri (taslak sayısı, onaylı kalıp vs) | VAR | satır 264-281 |
| WebSocket (Realtime) `b1_model_taslaklari` | VAR | satır 40-42 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. `model_kodu` SADECE MANUEL YAZILIYOR — STANDART YOK

Model kodu (örneğin "CK-47") tamamen serbest metin olarak ekleniyor. Ancak işletme büyüdükçe bu barkodlanacağı için, yıl/sezon bazlı (örn: 26-YAZ-CK-47) bir oto-jeneratör kodu yazılması gerekir. Şu an rastgele isimlendirme izinli.

### 2. M2 KUMAŞ MALİYETİ M3'E TAŞINMIYOR

`KumasMainContainer.js` 343. satırında `m3eAktar(talep)` çalışarak M2'den M3'e kumaş maliyeti gönderiliyor. Ancak `KalipMainContainer.js` bu veriyi hiçbir yerinde `b1_model_taslaklari` içine yazmıyor. Sadece Model isimleri/kodları kaydediyor. Finansal veri yolda kayboluyor.

### 3. PASTAL BOŞLUK (METRAJ) TAHMİNİ VAR, KESİM HESABI YOK

`metrajHesap` (satır 205) sadece formda gösteriliyor. Kalıp kaydedilirken bu kümülatif tahmini kumaş sarfiyatı (örneğin = 2.45 mt) veri tabanında (örneğin `gercek_metraj` kolonu) kalıcı olarak saklanmıyor. Yalnızca `pastal_boy_cm` var.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| M2 Onayı | M3 Kalıp | YOK | M2 maliyeti taslak tablosuna yazılmıyor |
| M3 Pastal Metraj | M5 Kesim | KOPUK | Metraj hesabı `b1_model_kaliplari`'nda toplam sonuç olarak çıkmıyor |
| M3 Bedenler | Sipariş/Katalog | KISMI | Virgülle ayrılmış string/array, varyant tablosu yok |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **DXF/PLT Dosya Yükleme Entegrasyonu** → Gerber / Lectra CAD dosyalarının cloud'a yüklenmesi (Storage)
- [ ] **OptiTex/Gerber Api Bağlantısı** → Kumaş eni verilince fire oranını yapay zekanın hesaplaması
- [ ] **Barkodlu Kalıp Çıktısı** → Kesime gidecek kalıp şablonları için oto-barkod jeneratörü
