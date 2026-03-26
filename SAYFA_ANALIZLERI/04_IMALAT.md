# İMALAT & ÜRETİM BANDI (M4) — Sayfa Analizi
**Rota:** `/imalat` | **Dosya:** `src/features/imalat/components/ImalatMainContainer.js`  
**Görev:** Teknik görüş → Modelhane → Seri Üretim → Maliyet/Muhasebe kapanışı — 4 adımlı üretim koridoru.

---

## ✅ MEVCUT NE VAR (koddan doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 4 Pencere sistemi (Teknik Görüş / Modelhane / Bant / Muhasebe) | VAR | satır 19, 381-394 |
| Kanban Board görünümü (4 kolon) | VAR | satır 569-610 |
| Liste görünümü | VAR | satır 614-699 |
| Video kanıtı zorunluluğu (fasona gitmeden önce) | VAR | satır 181 |
| Çift tıklama koruması | VAR | satır 23, 253, 278, 306 |
| Arıza bildirme → işçiden zarar kesilmez mantığı | VAR | satır 270 |
| Rework sayacı (kaç kez red aldı) | VAR | satır 339 |
| Maliyet otomatik yaratma (4. pencerede) | VAR | satır 319-325 |
| `b1_maliyet_kayitlari` INSERT | VAR | satır 319-325 |
| Personel FPY (hatasız üretim oranı) gösterimi | VAR | satır 686 |
| Sosyal puan gösterimi | VAR | satır 689 |
| Visibility API (sekme kapatınca WS kapat) | VAR | satır 89-97 |
| Arapça dil desteği | VAR | satır 16, 352-363 |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **Kronometre HARDCODED** → satır 315-317: `operasyonZamaniDk = 42` ve `dakikaMaliyeti = 4` sabit yazılı; gerçek `start_time` / `end_time` arasındaki fark kullanılmıyor
  - Her operasyon 42 dk × ₺4 = ₺168 olarak muhasebe'ye yazılıyor — gerçek veri değil
- [ ] **Maliyet Sınırı Aşımı kontrolü yok** → satır 738: "GÜVENLİ" etiketi hardcoded; `numune_maliyeti` ile gerçek maliyet karşılaştırması yapılmıyor
- [ ] **Production_orders → b1_model_taslaklari join çöküyor** → satır 126-128: `production_orders` tablosundan `b1_model_taslaklari` join yapıyor ama bu tablo ilişkisi FK'da mevcut mu?
- [ ] **Teknik Föy formundaki veriler ayrı tabloya gidiyor** → satır 149-155: form `b1_model_taslaklari`'na kaydediliyor ama `production_orders` tablosuna yazılmıyor → Gösterilen liste `production_orders`'dan geliyor (satır 126) — döngü kırık

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| İmalat → Muhasebe | VAR ✅ | 4. pencerede maliyet kaydı yazılıyor |
| İmalat → Stok | YOK | Üretim tamamlandığında stok otomatik artmıyor |
| İmalat → Personel Prim | YOK | FPY skoru prim hesabına bağlı değil |
| İmalat → Karargah | YOK | Anlık üretim adedi Karargah KPI'ında görünmüyor |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] **Kronometre sabit** → satır 315: `const operasyonZamaniDk = 42;` — gerçek süre hiç hesaplanmıyor, her iş sabit ₺168
- [ ] **video simülasyonu** → satır 507: Video sadece bir `onClick()` toggle; gerçek kamera erişimi yok, sadece "kayıtta" yazının rengi değişiyor — bu güvenlik açığı; sahada "video çektim" denilebilir ama çekilmemiş
- [ ] `uretimBandiVeyaFasonaFirlat()` satır 190-194: Sadece `islemAdimlari[0]` ilk adımı `b1_operasyon_adimlari`'na yazıyor, diğer adımlar (2, 3, 4...) hiç kaydedilmiyor

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Gerçek kamera entegrasyonu (tablet kamera ile video çekme + Supabase Storage upload)
- [ ] Bant verimliliği analizi (OEE: Planlanan vs Gerçekleşen süre)
- [ ] IoT entegrasyonu (makine sensörlerinden gerçek duruş verisi)
- [ ] Fason firma portal girişi (kendi Kanban'larını görsünler)
- [ ] Beden bazlı üretim takibi (S:100, M:200, L:150 adet ayrı)
- [ ] Gerçek zamanlı üretim sayacı (ekranda anlık adet göster)
