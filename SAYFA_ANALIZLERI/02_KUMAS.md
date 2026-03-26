# KUMAŞ & MALZEME KÜTÜPHANESİ (M2) — Sayfa Analizi
**Rota:** `/kumas` | **Dosya:** `src/features/kumas/components/KumasMainContainer.js`  
**Görev:** Kumaş arşivi, aksesuar deposu, ölü stok radarı, M1'den gelen AR-GE talepleri ve fizibilite analizi.

---

## ✅ MEVCUT NE VAR (koddan doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 5 sekme (kumaş / aksesuar / fırsat / M1 talepler / risk) | VAR | satır 33-34 |
| Kumaş listesi (b2_urun_katalogu veya ayrı tablo) | VAR | `useKumas` hook'undan |
| Kritik stok kontrolü (mt < min_stok) | VAR | satır 43 |
| Tedarikçi bilgisi | VAR | satır 42 |
| M1'den gelen talepler paneli | VAR | satır 104-136 |
| Fizibilite modal (kar marjı hesabı) | VAR | satır 263-353 |
| %40 kârlılık eşiği kuralı | VAR | satır 31 |
| Ölü stok (is_firsat) radar | VAR | satır 157-198 |
| M3'e aktar butonu | VAR | satır 343-344 |
| AI trend eşleşme sonucu gösterimi | VAR | satır 165 |

---

## ❌ EKSİK BİLGİ AKIŞLARI

- [ ] **KPI kartları hardcoded** → satır 88-92: "Aktif Kod: 412", "Tek Tedarikçi: 14", "Sürekli Kumaş: 158", "Yüksek MOQ: 5" — tamamı sabit yazılmış, gerçek veritabanı yok
- [ ] **Arama çalışmıyor** → satır 153: `<input>` var ama `onChange` handler'ı eksik — yazılan arama metni state'e bağlanmamış
- [ ] **Kumaş fotoğrafı yok** → satır 207: "GÖRSEL EKLENMEDİ" placeholder her ürünün üstünde — fotoğrafsız kütüphane
- [ ] **Kartela butonu işlevsiz** → satır 241-243: "KARTELA" butonu onClick yok, `button` etiketinde hiçbir handler yok
- [ ] **Aksesuar deposu sekmesi boş** → sekme var ama aksesuar verisi çekme kodu görülmüyor

---

## ❌ EKSİK ENTEGRASYONLAR

| Entegrasyon | Mevcut | Olmayan |
|-------------|--------|---------|
| M1 → M2 Talepler | VAR ✅ | AR-GE onaylı ürünler M2'ye talep olarak geliyor |
| M2 → M3 (Fizibilite sonrası) | VAR ✅ | `m3eAktar()` fonk. var |
| M2 → Stok | YOK | Kumaş kullanımı stok hareketlerine otomatik gitmiyor |
| M2 → Maliyet | YOK | Kumaş birim maliyeti değişince M7'ye yansıtılmıyor |
| Tedarikçi → Otomatik Sipariş | YOK | Kritik kumaş stokunda tedarikçiye bildirim yok |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] **Arama input'u bağlantısız** → satır 153: placeholder var ama `value` ve `onChange` yok — arama çalışmıyor
- [ ] **Kartela butonu onClick yok** → satır 241-243: işlevsiz
- [ ] **`rakipSatis: '499.90'`** → satır 25: Rakip satış fiyatı fizibilite formunda her zaman ₺499.90 başlıyor — bu sabit değer kullanıcıyı yanıltabilir

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Kumaş fotoğraf galerisi (Supabase Storage)
- [ ] Renk kartela sistemi (dijital pantone renk eşleştirme)
- [ ] Tedarikçi portalı (fiyat teklifleri dijital ortamda)
- [ ] Kumaş performans veritabanı (yıkama, dayanıklılık testleri)
- [ ] Sürdürülebilirlik sertifikaları (GOTS, Oeko-Tex)
- [ ] Otomatik tedarik siparişi (eşik aşılınca PDF teklif maili)
