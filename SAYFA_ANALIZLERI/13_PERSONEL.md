# PERSONEL YÖNETİMİ (M13) — Sayfa Analizi
**Rota:** `/personel` | **Dosya:** `src/features/personel/components/PersonelMainContainer.js`  
**Görev:** Personel kaydı, devam takibi, prim hesaplama, kasa avans köprüsü.

---

## ✅ MEVCUT NE VAR (koddan doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 10 rol niteliği sistemi (duz_makinaci → koordinatör) | VAR | satır 18-24 |
| 3 durum (aktif/izinli/çıktı) | VAR | satır 25-26 |
| Personel CRUD (ekle/düzenle/sil) | VAR | |
| Rol ve arama filtresi | VAR | satır 47 |
| 3 Sekme (liste / prim / devam) | VAR | satır 48 |
| Devam takibi (calisti/izin/gecikti/devamsizlik) | VAR | satır 51 |
| Kasa avans köprüsü (M13-M7) | VAR | satır 112-116 |
| Sistem ayarları (dakika başı ücret, prim oranı) | VAR | satır 54, 80-95 |
| b1_sistem_ayarlari tablosundan konfigürasyon | VAR | satır 82 |
| Günlük çalışma dakikası (480 dk = 8 saat) | VAR | satır 30 |
| Çevrimdışı çalışma | VAR | |
| Arapça isim desteği | VAR | satır 29 |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Prim hesabı gerçek üretim verisine bağlı değil** → İmalat(M4)'taki FPY skoru personel primini etkilemiyor; prim manuel veya sabit konfigürehesaplanıyor
- [ ] **İzin bakiyesi takibi eksik** → `yillik_izin_hakki = 15` (satır 54) var ama kullanılan izin günü sayımı otomatik değil
- [ ] **Devam analizleri grafiği yok** → "Bu ay en çok devamsızlık yapan kim?" görselleştirme yok
- [ ] **SGK/bordro modülü yok** → Aylık maaş hesabı yapılabiliyor ama yasal bildirim (SGK, MUHSGK) yok
- [ ] **Fazla mesai takibi eksik** → 480 dk'yı aşan çalışma saatleri kaydedilemiyor

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| Personel → Kasa (Avans) | VAR ✅ | b2_kasa_hareketleri avans köprüsü |
| Personel → İmalat (FPY) | VAR ✅ | Sahadaki personel listesi İmalat'tan geliyor |
| Personel → Prim Motoru | KISMI | Prim hesabı var ama üretim verisine bağlı değil |
| Personel → Muhasebe | YOK | İşçilik maliyeteri muhasebe raporuna otomatik gitmiyor |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] Satır 65-67: Personel'deki Realtime `.on('postgres_changes', { event: '*', schema: 'public' })` — şema bazında tüm tabloları dinliyor; bu gereksiz trafik yaratır, sadece `b1_personel` dinlenmeli
- [ ] `b1_sistem_ayarlari` tablosundan `deger` kolonunu JSON parse ediyor (satır 86) — bu tablo ve ilgili JSON yapısı Supabase'de var mı? 400 hatası alınıyor olabilir

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Dijital bordro sistemi (maaş + prim + avans mahsuplaşması)
- [ ] SGK entegrasyonu (aylık bildirim otomasyonu)
- [ ] Yüz tanıma ile devam takibi
- [ ] Performans değerlendirme sistemi (360 derece)
- [ ] Kariyer gelişim planı (terfi kriterleri)
- [ ] Eğitim kayıt sistemi (kurs takibi)
