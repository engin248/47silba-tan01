# MALİYET & FİNANS ANALİZİ (M7) — Detaylı Sayfa Analizi
**Rota:** `/maliyet` | **Dosya:** `src/features/maliyet/components/MaliyetMainContainer.js`  
**Toplam:** 684 satır  
**Görev:** Üretim (İmalat) emirlerine bağlanan maliyet kalemlerini girmek, hesaplamak, satış fiyatı/kâr marjı önermek.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b1_maliyet_kayitlari` tablosu | VAR | satır 66 |
| Maliyetin `production_orders`'a bağlanması | VAR | satır 73-85 |
| 7 Maliyet Tipi (işçilik, kumaş, işletme, fire, sarf...) | VAR | satır 12 |
| Tutar / Fiyat Doğrulayıcı Zırh (Miktar * Fiyat) | VAR | satır 137-145 |
| Offline Kuyruk Desteği | VAR | satır 149 |
| Realtime WebSocket (Visibility algılamalı PWA) | VAR | satır 104 |
| Sayfalama (Pagination - 50 kayıt) | VAR | satır 46 |
| Kar Marjı % ve Satış Fiyatı Sekmesi | VAR | satır 17-22, 40 |
| Cihaz/Oturum PIN Kontrolü (Yetki) | VAR | satır 96 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. MALİYETLER MANUEL GİRİLİYOR (OTOMATİK TOPLAMA YOK!)

**Sorun:** M2 Kumaş modülünde fizibiliteden gelen kumaş fiyatı VE M4 Modelhane/M5 Kesim/İmalat modüllerinde harcanan işçilik süresi buraya OTOMATİK DÜŞMÜYOR. 
Kullanıcı M7 formunda `order_id` seçip, `maliyet_tipi: 'hammadde_kumas'` diyerek tutarı tekrar **elle** giriyor (Form BOSH_FORM'dan manuel dolduruluyor). 
**Büyük ERP Hiyerarşi Kopukluğu:** Önceki aşamaların hesapladığı harcamalar merkeze veri olarak yazılmıyor, maliyet formuna insan eliyle yeniden dolduruluyor. 

### 2. SIVI/ZAMAN BAZLI MALİYET HESABI YOK

`birim: adet` ve `birim_fiyat` var. Ancak bir işçinin süresi (dakika) üzerinden maliyet hesaplaması arka planda yok.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| M2/M4/M5 Kesim | M7 Maliyet | YOK | Sarfiyatlar ve paralar otomatik listeye inmiyor |
| M7 Hedef Kâr | M12 Katalog | YOK | Önerilen satış fiyatı Ürün Kataloğuna aktarılmıyor |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **BOM (Bill of Materials) Otomasyonu** → Model M3'ten çıkarken ürün ağacı çıkar, maliyet otomatik hesaplanır.
- [ ] **ABC (Faaliyet Tabanlı Maliyetleme)** → Fabrika kira ve elektriğinin üretim süresine göre havuzdan otomatik emirlere dağıtılması.
