# MUHASEBE & FİNAL RAPOR (M8) — Sayfa Analizi
**Rota:** `/muhasebe` | **Dosya:** `src/features/muhasebe/components/MuhasebeMainContainer.js`  
**Görev:** Tamamlanan üretim emirlerinin finansal raporlaması, şef onayı ve 2. Birime devir.

---

## ✅ MEVCUT NE VAR (kodda doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `production_orders` 'status=completed' sorgusu | VAR | satır 66-69 |
| Rapor Oluştur butonu (raporlanmamış emirlere) | VAR | satır 195-236 |
| %15 GÜG otonom ekleme (genel işletme payı) | VAR | satır 207-216 |
| 4 durum: taslak/şef_onay/onaylı/kilitli | VAR | satır 334-335 |
| Bütçe vs Gerçek analizi | VAR | satır 459-488 |
| Zeyilname ek fatura sistemi (kilitli rapora) | VAR | satır 264-273 |
| Devir kilitleme + b0_sistem_loglari kaydı | VAR | satır 138-192 |
| Maliyet senkronizasyonu butonu | VAR | satır 238-249 |
| Kilitli rapor silme engellemesi | VAR | satır 307 |
| Çevrimdışı çalışma | VAR | satır 119-124 |
| Realtime WebSocket | VAR | satır 37-41 |
| Maliyet Breakdown görselleştirme | VAR | satır 610-654 |
| Yazdır / PDF butonu | VAR | satır 688-692 (window.print) |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Hedeflenen maliyet başlangıçta boş** → `uretimdenRaporOlustur()` fonksiyonu `hedeflenen_maliyet_tl: undefined` gönderiyor, form ekranında manuel set edilmesi gerekiyor → yeni rapor oluşturulduğunda `0` olarak başlıyor
- [ ] **Kasa ile entegrasyon yok** → Kilitlenip 2. Birime devredilen rapor için otomatik ödeme kaydı kasa'ya gitmiyor
- [ ] **Stok doğrulama logu mevcut ama mükerrer kontrol zayıf** → satır 177: "Mükerrer stok girme" notu var ama İmalat'tan stok zaten eklendi mi doğrulama otomatik değil
- [ ] **PDF formatı yok** → `window.print()` sayfanın tamamını yazdırıyor, temiz fatura formatı değil
- [ ] **Model resimleri yok** → Rapor detayında model kodu var ama ürünün fotoğrafı/taslağı gösterilmiyor
- [ ] **Kar marjı görünmüyor** → Gerçekleşen maliyet var, teslim satış fiyatı bağlantısı yok → Kar/zarar hesabı eksik

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| İmalat → Muhasebe | VAR ✅ | `status=completed` emirler listeleniyor |
| Maliyet → Muhasebe | VAR ✅ | `b1_maliyet_kayitlari` çekiyor |
| Muhasebe → Kasa | YOK | Devir onayında kasa kaydı oluşturulmuyor |
| Muhasebe → Sipariş | YOK | "Bu ürün ne fiyata satıldı?" bağlantısı yok |
| Muhasebe → Raporlar | KISMI | Raporlar sekmesi `devir_durumu=true` filtresi kullanıyor |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] `MuhasebeMainContainer.js` satır 63-68: `production_orders` tablosu — bu tablonun adı NİZAM şemasında ne? `b2_siparisler` ile karışabilir
- [ ] Satır 82: `b1_muhasebe_raporlari` + `production_orders` join yapılıyor ama `order_id` = `production_orders.id` olması gerekiyor — şema doğrulandı mı?
- [ ] `birimMaliyet()` fonksiyonu (satır 338-342): `net_uretilen_adet = 0` ise '—' döndürüyor — yeni raporda `0` olduğundan birim maliyet gösterilmiyor

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Resmi muhasebe entegrasyonu (Logo Tiger, Mikro, veya e-Dönüşüm)
- [ ] KDV hesabı ve KDV beyannamesi desteği
- [ ] Dönemsel kar/zarar tablosu (P&L Statement)
- [ ] Dijital imzalı PDF raporu (e-belge)
- [ ] Çok para birimi raporlaması (USD/EUR üretim maliyeti)
- [ ] Bütçe planlama modülü (yıllık/aylık üretim bütçesi gir — gerçekle karşılaştır)
