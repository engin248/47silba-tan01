# KAMERALAR / VİZYON PANELİ — Sayfa Analizi
**Rota:** `/kameralar` | **Dosya:** `src/features/kameralar/`  
**Görev:** Fabrika kameralarını izle, hareket tespiti yap, anomali alarmı ver.

---

## ✅ MEVCUT NE VAR

| Bileşen | Durum |
|---------|-------|
| 12 kamera grid görünümü | VAR (hardcoded) |
| go2rtc WebRTC entegrasyonu | VAR (URL yanlış) |
| Rol bazlı filtre (Üretim/Kalite/Depo/Güvenlik) | VAR |
| Snapshot → Telegram gönderimi | VAR |
| Tam ekran odak modu | VAR |
| Hareket tespiti (useMotionDetection) | VAR |
| AI anomali alarmı (Realtime) | VAR |
| Erişim logu (camera_access_log) | VAR |
| Uyku modu (3 dk hareketsizlik) | VAR |
| Sekme gizlilik modu | VAR |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Kamera listesi hardcoded** → `cameras` Supabase tablosu yok veya boş, 12 statik kamera
- [ ] **Kamera durumu gerçek zamanlı** → Online/offline gösterimi statik (`status: 'online'` hardcoded)
- [ ] **NVR bağlantı durumu** → go2rtc URL yanlış (`theondercom` - nokta eksik)
- [ ] **Alarm geçmişi** → `camera_events` tablosu `try{}catch{}` ile geçiştiriliyor, tablo yok olabilir
- [ ] **Kayıt arşivi** → NVR'daki kayıt geri oynatma sistemi yok
- [ ] **Bant hareketsizliği alarm süresi** → Şu an 2 dakika sabit kodlanmış, ayarlanabilir değil
- [ ] **Kamera sağlık metriği** → FPS, ping, çözünürlük gerçek veri değil ("360p · 10fps sub" hardcoded)

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `KameralarMainContainer.js` satır 16: `GO2RTC_URL = 'https://kamera.demirtekstiltheondercom.com'` — nokta eksik → kameralar hiç yüklenmiyor
- [ ] `cameras` tablosu yoksa VARSAYILAN_KAMERALAR kullanılıyor — tablo oluşturulmadı
- [ ] `camera_events` tablosu her yerde `try{}catch{/* tablo yoksa geç */}` — tablo yok
- [ ] `camera_access_log` tablosu da `try{}catch{}` içinde
- [ ] `NEXT_PUBLIC_GO2RTC_URL` ENV Vercel'de tanımlı değil

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olması Gereken |
|-------------|--------|----------------|
| Kamera → Personel | YOK | Kamera alarmı → personel kayıtına not |
| Kamera → Karargah | YOK | Alarm → Karargah uyarı paneli |
| Kamera → Görevler | YOK | Alarm → otomatik görev oluştur |
| NVR → Kayıt Arşivi | YOK | 7/30 günlük kayıt görüntüleme |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] AI kalite kontrol: Kameradan hatalı dikişi otomatik tespit et
- [ ] Yüz tanıma ile personel giriş/çıkış takibi
- [ ] Yangın/duman tespiti (YOLO tabanlı)
- [ ] Çok lokasyon: Farklı fabrikalardaki kameraları tek panelde gör
- [ ] Mobil uygulama: Fabrikayı telefondan izle
- [ ] NVR entegrasyonu: Anlık alarm geldiğinde otomatik kayıt başlat
- [ ] Bant verimliliği: Bantın %kaç süre çalıştığını otomatik hesapla
