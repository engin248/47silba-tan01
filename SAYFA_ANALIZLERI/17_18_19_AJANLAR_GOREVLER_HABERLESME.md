# AJANLAR (M17) — Sayfa Analizi
**Rota:** `/ajanlar` | **Dosya:** `src/features/ajanlar/components/AjanlarMainContainer.js`  
**Görev:** AI otomasyon ajanlarının yönetimi, çalıştırma, log izleme.

---

## ✅ MEVCUT NE VAR
- Ajan liste görünümü
- Manuel tetikleme butonları
- Log görüntüleme
- Cron durum kontrolü

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **vercel.json'da arge_zincir cron yok** → En kritik ajan (AR-GE scraper) cron schedule yok
- [ ] **kamera_durum_kontrol cron yok** → Kamera sağlık kontrolü cron'u vercel.json'da eksik
- [ ] **Ajan sonuç metrikleri yok** → "Bu ajan son çalışmada kaç kayıt ekledi?" görünmüyor
- [ ] **Hata bildirim sistemi yok** → Ajan çöktüğünde Telegram'a otomatik uyarı gitmiyor

---

## ❌ MEVCUT SORUNLAR

- [ ] `1_Scraper_Ajan.py` — git merge conflict işaretleri, çalışmıyor
- [ ] `GIZLI_KEY` hardcoded (güvenlik açığı)
- [ ] Cron tetikleyicileri vercel.json'dan eksik

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Ajan sağlık dashboard (uptime, hata oranı)
- [ ] Ajan zincir yönetimi (bir ajan bitince diğerini başlat)
- [ ] LLM tabanlı akıllı ajan (kendi kararlarını üretsin)


---

# GÖREVLER (M18) — Sayfa Analizi
**Rota:** `/gorevler` | **Dosya:** `src/features/gorevler/components/GorevlerMainContainer.js`  
**Görev:** Ekip görev yönetimi, atama, takip, teslim tarihi.

---

## ✅ MEVCUT NE VAR
- Görev oluşturma/atama
- Durum takibi (beklemede/devam/tamamlandı)
- Personele bağlama
- Öncelik seviyesi

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Üretim emirleriyle bağlantı yok** → Görev sistemi ile İmalat(M4) ayrı çalışıyor
- [ ] **Bildirim sistemi eksik** → Görev atandığında personele otomatik uyarı yok
- [ ] **Görev şablonları yok** → "Yeni sezon hazırlığı" gibi tekrarlayan görev şablonu oluşturulamıyor
- [ ] **Süre takibi yok** → Görevin ne kadar sürdüğü kaydedilmiyor

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Müşteri görev bağlantısı (sipariş → görev)
- [ ] Gantt chart görünümü
- [ ] OKR/KPI entegrasyonu


---

# HABERLEŞME (M19) — Sayfa Analizi
**Rota:** `/haberlesme` | **Dosya:** `src/features/haberlesme/components/HaberlesmeMainContainer.js`  
**Görev:** Dahili mesajlaşma, duyuru sistemi, ekip içi iletişim.

---

## ✅ MEVCUT NE VAR
- Mesaj gönderme
- Duyuru yayımlama
- Okundu bilgisi

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **WhatsApp entegrasyonu yok** → Müşteri iletişimi harici kalıyor
- [ ] **Dosya paylaşımı yok** → Mesajla birlikte PDF/resim gönderilemez
- [ ] **Grup mesajlaşma yok** → Departman bazlı kanal oluşturulamıyor
- [ ] **Arşiv arama yok** → Eski mesajlarda arama yapılamıyor

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] WhatsApp Business API entegrasyonu
- [ ] Video konferans butonu (Google Meet/Zoom linki)
- [ ] Dil seçenekli bildirimler (TR/AR)
