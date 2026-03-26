# KALIP & ÜRETİM PLANLAMA (M3) — Sayfa Analizi
**Rota:** `/kalip` | **Dosya:** `src/features/kalip/components/KalipMainContainer.js`  
**Görev:** Model taslağı oluştur, pastal/kalıp ölçülerini gir, M1 trendlerine bağla, M4'e üretim hazırlışla.

---

## ✅ MEVCUT NE VAR (koddan doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 2 sekme: Model Taslakları + Kalıplar & Bedenler | VAR | satır 284-291 |
| Model CRUD (ekle/düzenle/sil) | VAR | satır 97-143 |
| Kalıp CRUD (ekle/düzenle/sil) | VAR | satır 146-203 |
| Pastal boyu/eni cm giriş + Otomatik m² hesabı | VAR | satır 205-211 |
| Fire oranı (%5 varsayılan) | VAR | satır 16 |
| 7 beden seçimi (toggle butonlar) | VAR | satır 357-362 |
| Sezon seçimi (4 sezon + 4mevsim) | VAR | satır 13 |
| Hedef kitle (kadın/erkek/çocuk/unisex) | VAR | satır 12 |
| M1 Trend bağlantısı (b1_arge_products AI kararı) | VAR | satır 68, 304-308 |
| Versiyon takibi (v1.0 vs.) | VAR | satır 16 |
| DXF/PDF kalıp dosyası URL alanı | VAR | satır 365-367 |
| Arapça model adı desteği | VAR | satır 108 |
| Mükerrer model kodu engeli | VAR | satır 103-104, 116-117 |
| Silme → b0_sistem_loglari kaydı | VAR | satır 198 |
| Çevrimdışı çalışma | VAR | satır 135-141 |
| Visibility API (gizleyince WS kapat) | VAR | satır 48 |
| KPI kartları (model sayısı, kalıp sayısı) | VAR | satır 263-281 |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **KPI kartları hardcoded** → satır 275-280: "Ortalama Beden Seti: 4.5" ve "Üretime Geçiş: 100%" sabit yazılı — gerçek hesaplama yok
- [ ] **Model durumu güncellenemiyor** → Model oluştururken `durum: 'taslak'` sabit atanıyor (satır 126); durumu değiştirecek bir buton yok (satır 215 DURUM_RENK var ama tikladığında değişmiyor)
- [ ] **Kalıp dosyası yalnızca URL** → DXF/PDF dosyası URL olarak giriliyor ama Supabase Storage'a yükleme imkânı yok
- [ ] **Pastal optimizasyonu yok** → Eni × boyu × fire = m² hesabı var ama "Bu pastaldan kaç adet çıkar?" verimlilik hesabı yok
- [ ] **Model → Sipariş bağlantısı yok** → Model onaylandığında otomatik sipariş veya üretim emri oluşturulmuyor

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| AR-GE → Model | VAR ✅ | `b1_arge_products` AI kararı trendle model bağlanabiliyor |
| Model → İmalat | VAR ✅ | M4 Modelhane bağlantısı var (satır 248-252 link) |
| Model → Maliyet | KISMI | M7 çarpanı etiketi var (satır 350) ama gerçek maliyet hesabı yok |
| Model → Stok | YOK | Model tamamlandığında üretim stok kaydı otomatik oluşturulmuyor |
| Kalıp → Kumaş Tedarik | YOK | "Bu kalıp X metre kumaş gerektirir → tedarikçiye bildir" yok |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `teknikFoyKaydet()` satır 149-154: `b1_model_taslaklari`'na `model_kodu = yeniFoy.model_name` yazıyor ama model kodu ≠ model adı (İmalat modülünde bu karışıklık var)
- [ ] Satır 68: `b1_arge_products` tablosunu `ai_satis_karari IN ('ÇOK_SATAR', 'BİNGO')` ile çekiyor — bu tablo ve bu kolon şemada var mı? Trend bağlantısı burada çöküyor olabilir

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Dijital kalıp sistemi (DXF dosyası içinde görselleştirme)
- [ ] Pastal optimizasyon motoru (AI ile kumaş israfını minimize et)
- [ ] 3D kalıp simülasyonu (sanal prova)
- [ ] CAD entegrasyonu (Clo3D, Optitex)
- [ ] Sürdürülebilirlik skoru (kumaş fire oranına göre çevre puanı)
