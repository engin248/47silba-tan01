# GÜVENLİK / DENETMEN / TASARIM / AYARLAR — Sayfa Analizleri

---

# GÜVENLİK (M20) — Sayfa Analizi
**Rota:** `/guvenlik`

## ✅ MEVCUT NE VAR
- JWT oturum yönetimi
- PİN korumalı hassas işlemler
- Rol bazlı erişim (tam/sınırlı/salt-okunur)
- b0_sistem_loglari kara kutu kaydı

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **`dev_secret` fallback** → API'lar `.env` key bulamazsa `dev_secret` ile çalışıyor — PRODUCTION'DA GÜVENLİ DEĞİL
- [ ] **İki faktörlü doğrulama yok** → SMS/TOTP 2FA desteği yok
- [ ] **IP kısıtlama yok** → Farklı ülkeden giriş engeli yok
- [ ] **Başarısız giriş limiti yok** → Brute force koruması yok
- [ ] **Oturum süre aşımı yok** → Sessiz kalan oturum otomatik kapanmıyor

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] SSO (Google/Microsoft ile giriş)
- [ ] Mobil biyometrik doğrulama
- [ ] GDPR uyumlu veri silme süreci
- [ ] SOC2 güvenlik sertifikasyonu hazırlığı

---

# DENETMEN / MÜFETTİŞ (M21) — Sayfa Analizi
**Rota:** `/denetmen`

## ✅ MEVCUT NE VAR
- Kalite kontrol muayenesi
- Hatalı ürün reddetme (rework_count)
- Numune onay süreci

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **FPY (First Pass Yield) hesabı gerçek değil** → İmalat'taki rework_count var ama oran hesabı otomatik değil
- [ ] **Kalite kontrol standardı yok** → ISO 9001 / AATCC test kriterleri sisteme girilemez
- [ ] **Müşteri şikayet kaydı yok** → İade sebebi analizi yapılamıyor

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Görsel kalite kontrol (AI destekli — kamera ile hata tespiti)
- [ ] Müşteri iade panel bağlantısı
- [ ] Kalite sertifika yönetimi

---

# TASARIM STÜDYOSU (M22) — Sayfa Analizi
**Rota:** `/tasarim`

## ✅ MEVCUT NE VAR
- Tasarım taslağı yükleme
- Model kartına varlık ekleme
- AR-GE ile bağlantı

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Gerçek çizim/dijital tasarım yok** → URL paste ile görsel ekleniyor
- [ ] **Revizyon geçmişi yok** → Tasarım versiyon kontrolü yok
- [ ] **Müşteri onay süreci dijital değil** → Tasarım e-posta ile gönderiliyor

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Figma/Adobe entegrasyonu
- [ ] AI generatif tasarım (DALL-E / Stable Diffusion koleksiyonu)
- [ ] 3D ürün önizleme

---

# SİSTEM AYARLARI (M23) — Sayfa Analizi
**Rota:** `/ayarlar`

## ✅ MEVCUT NE VAR
- b1_sistem_ayarlari tablosu (JSON yapılandırma)
- Dakika başı ücret, prim oranı, yıllık izin hakkı
- Şirket bilgileri

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Ayar değişikliği logu yok** → Kim ne zaman ayar değiştirdi? Kayıt yok
- [ ] **Backup/Restore sistemi yok** → Veritabanı yedeği alınamıyor
- [ ] **Çoklu şirket desteği yok** → Tek şirket profili
- [ ] **E-posta/SMS bildirimleri yapılandırılmıyor** → Bildirim kanalları ayarlanamıyor

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Multi-tenant mimarisi (çoklu fabrika/depo)
- [ ] Otomatik yedekleme sistemi
- [ ] API entegrasyon yönetici paneli
- [ ] White-label yapılandırma
