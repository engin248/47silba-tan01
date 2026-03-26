# PERSONEL (M13) — Sayfa Analizi
**Rota:** `/personel` | **Dosya:** `src/features/personel/`  
**Görev:** Çalışan yönetimi, devam takibi, prim hesabı, bordro.

---

## ✅ MEVCUT NE VAR

| Bileşen | Durum |
|---------|-------|
| Personel listesi + CRUD | VAR |
| Rol/görev tanımları (10 rol) | VAR |
| Saatlik ücret + günlük hesap | VAR |
| Devam/yoklama kaydı | VAR |
| Prim motoru (eşik bazlı %15) | VAR |
| Avans kesintisi (Kasa bağlantısı) | VAR |
| Bordro yazdırma (print) | VAR |
| CSV export | VAR |
| Çevrimdışı çalışma | VAR |
| Realtime | VAR |
| Yıllık izin bakiyesi | VAR (14 gün hardcoded) |
| Arapça dil desteği | VAR |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **`b1_personel_devam` yıllık izin hakkı `b1_sistem_ayarlari`'dan okunuyor** ama devam sekmesinde 14 hardcoded değer var (satır 633) — ayarlar ile senkron değil
- [ ] **Mesai takibi** → Giriş/çıkış saati kaydı yok (şu an sadece geldi/gelmedi)
- [ ] **Fazla mesai hesabı** → 480 dk üzeri çalışma ekstra ücrete yansımıyor
- [ ] **SGK / vergi kesintisi** → Net maaş hesabı yok (brüt üzerinden çalışıyor)
- [ ] **Performans puanı kaynağı** → `ai_verimlilik_puani` sütunu var (satır 581) ama nereden geliyor? Hiçbir ajan bu sütuna yazmıyor
- [ ] **Kamera + Devam entegrasyonu** → Kamera hareketsizlik alarmı ile personelin yoklama kaydı ilişkilendirilmiyor
- [ ] **Belge yükleme** → İş sözleşmesi, kimlik fotokopisi vb. dosya ekleme yok

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olması Gereken |
|-------------|--------|----------------|
| Kamera → Personel | YOK | Kamera alarmı → ilgili personel kaydına not |
| Muhasebe → Personel | KISMI | Avans çekiyor, maaş ödeme kaydı gitmiyor |
| Kasa → Personel | KISMI | Avans var, geri ödeme takibi yok |
| Görevler → Personel | YOK | Personel hangi görevi yürütüyor? |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `PersonelMainContainer.js` satır 633: `YILLIK_HAK = 14` hardcoded (ayarlardan gelmeli)
- [ ] `ai_verimlilik_puani` sütunu UI'da gösteriliyor ama hiçbir ajan yazmıyor
- [ ] Yıllık izin hesabı yalnızca `devam` sekmesi yüklenince çalışıyor (liste sekmesinde gösterilmiyor)

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Parmak izi / yüz tanıma entegrasyonu (giriş-çıkış otomasyonu)
- [ ] Vardiya çizelgesi otomasyonu (AI vardiya önerir)
- [ ] SGK bildirgesi e-devlet XML formatı
- [ ] Personel başarı rozeti sistemi
- [ ] 360 derece değerlendirme (ustabaşı → personel gibi)
- [ ] WhatsApp/SMS entegrasyonu (devamsız personele otomatik mesaj)
- [ ] Eğitim takibi (hangi personel hangi eğitimi aldı)
