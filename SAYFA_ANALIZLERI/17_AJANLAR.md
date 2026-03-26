# AJANLAR — AI KOMUTA MERKEZİ (M17) — Detaylı Sayfa Analizi
**Rota:** `/ajanlar` | **Dosya:** `src/features/ajanlar/components/AjanlarMainContainer.js`  
**Toplam:** 791 satır  
**Görev:** Otonom AI ajanlarını yönet, görev emri ver, çalıştır, log izle, cron tetikle.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 5 Ajan konfigürasyonu (Trendyol/TikTok/Instagram/Facebook/Motor) | VAR | satır 17-60 |
| 17 toplam ajan görevi (aktif/pasif toggle) | VAR | satır 21-58 |
| Konfig `localStorage`'a kayıt | VAR | satır 119-125, 299 |
| `b1_ajan_gorevler` tablosu | VAR | satır 140 |
| 3 Sekme (Görev Tahtası / Yapılandırma / Orkestrator) | VAR | satır 108, 384-397 |
| Görev CRUD (ekle/sil) | VAR | satır 206-292 |
| Mükerrer görev engeli | VAR | satır 216-222 |
| Çift tıklama koruması | VAR | satır 118, 212 |
| 3 Endpoint yönlendirme (ajan-calistir/ajan-yargic/kopru-ajan) | VAR | satır 250-255 |
| Maliyet onay uyarısı (confirm ile) | VAR | satır 245-246 |
| Hibrit onay mekanizması (yonetici_onayi) | VAR | satır 557-566 |
| Polling (5sn'de bir sessiz yenile) | VAR | satır 150-159 |
| Realtime WebSocket (sadece b1_ajan_gorevler) | VAR | satır 139-141 |
| Görev süre hesaplama (baslangic-bitis) | VAR | satır 306 |
| 4 Öncelik seviyesi (dusuk/normal/yuksek/acil) | VAR | satır 80-85 |
| 4 Görev tipi (arastirma/analiz/kontrol/rapor) | VAR | satır 73-78 |
| 5 Yetki toggle (internet/ai/oku/yaz/dosya) | VAR | satır 460-471 |
| Acil öncelik → otomatik başlat (500ms sonra) | VAR | satır 229 |
| Offline guard (çevrimdışı kuyruğa al) | VAR | satır 232-236 |
| Cron arayüzü (Sabah 08:00 / Gece 03:00 / Batch AI) | VAR | satır 704-749 |
| `/api/batch-ai` endpoint entegrasyonu | VAR | satır 741-747 |
| `AjanOrchestrator` bileşeni | VAR | satır 783 |
| `AjanKomutaGostergesi` bileşeni | VAR | satır 363 |
| Silme → b0_sistem_loglari kara kutu | VAR | satır 276-283 |
| Arapça dil desteği | VAR | satır 244 |
| Görev sonucu ve hata mesajı görüntüleme | VAR | satır 601-610 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. KONFIGÜRASYON localStorage'A KAYDEDILIYOR — SUPABASE'DE YOK

**Sorun (satır 119-125):**
```js
const [konfig, setKonfig] = useState(() => {
    if (typeof window !== 'undefined') {
        const k = localStorage.getItem('ajan_konfig');
        return k ? JSON.parse(k) : VARSAYILAN_KONFIGUR;
    }
    return VARSAYILAN_KONFIGUR;
});
```
Ajan yapılandırması (hangi görevimlerin aktif olduğu) **tarayıcının localStorage**'ında saklanıyor. Farklı bir bilgisayardan veya tarayıcı sıfırlandıktan sonra konfig kayboluyor. Bu kritik sistem ayarı `b1_sistem_ayarlari` tablosuna yazılmalıydı.

### 2. VERCEL CRON — vercel.json İNECELENMELİ

**Ajanlar sayfasında** Sabah (08:00) ve Gece (03:00) cron'ları için UI arayüzü var ama bunların gerçekten çalışıp çalışmadığı `vercel.json` içeriğine bağlı. Manuel tetikleme butonları `/api/cron-ajanlar?gorev=sabah_ozeti` endpoint'ini çağırıyor — bu endpoint var mı?

### 3. `mt_4` GEÇMİŞ SATIŞ KAYDINA BAĞLI GÖREV — PASİF VE NEDENİ AÇIK

**Satır 57:**
```js
{ id: 'mt_4', ad: 'Geçmiş Satış Kayıtlarından Tarihsel Doğrulama', aktif: false, 
  neden_pasif: 'Geçmiş ciro datası/veri havuzu henüz boş' }
```
Bu görev pasif ve nedeni belirtilmiş. `b2_siparisler` tablosu boş olmaya devam ettiği sürece etkinleştirilemiyor. — **Bu bilinçli bir karar, ancak borç olarak takip edilmeli.**

### 4. AJAN ÇALIŞMA SONUCU — TABLO KONTROL MEKANİZMASI EKSİK

Görev çalıştırıldığında (`gorevCalistir()` satır 257) `/api/ajan-calistir`'a POST gidiyor. Ajan çalışır ve `b1_ajan_gorevler.sonuc_ozeti` günceller (API içinde). Ama:
- API 500 dönerse görev durumu `hata` mı oluyor otomatik, yoksa `calisıyor`'da mı kalıyor?
- 10 dakika boyunca cevap gelmezse görev askıda kalıyor

### 5. TİKTOK/INSTAGRAM/FACEBOOK AJANLAR — SADECE KONFIG KARTI VAR, KOD YOK

Satır 27-49: TikTok, Instagram, Facebook ajan konfigürasyonları listelenmiş ama bu platformlar için scraper kodu (`1_Scraper_Ajan.py`'da bile) yazılmamış. Konfigürasyon kartı var, perde arkasında iş yapan ajan yok.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Ajan → b1_arge_products | TASARLANDI | Scraper çalışmıyor |
| Ajan → b1_sistem_uyarilari | TASARLANDI | Alarm yazma mekanizması belirsiz |
| Cron → vercel.json | TASARLANDI | vercel.json kontrol edilmeli |
| Konfig → b1_sistem_ayarlari | YOK | localStorage'da kalıyor |
| TikTok/Instagram/Facebook ajan | KONFIG VAR | Python kodu yok |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Ajan sağlık dashboard** → Uptime %, ortalama çalışma süresi, hata oranı
- [ ] **Ajan zincir yönetimi** → Bir ajan bitince diğerini otomatik başlat (pipeline)
- [ ] **Çoklu dil desteğine göre ajan** → Arapça pazar için farklı scraper
- [ ] **LLM tabanlı görev üretimi** → "Bu ayın trendlerini analiz et" → otomatik görev oluştur
- [ ] **Konfig Supabase'e taş** → localStorage yerine `b1_sistem_ayarlari`
