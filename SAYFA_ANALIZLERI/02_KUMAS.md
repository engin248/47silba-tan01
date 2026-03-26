# KUMAŞ — MALZEME & KUMAŞ KÜTÜPHANESİ (M2) — Detaylı Sayfa Analizi
**Rota:** `/kumas` | **Dosya:** `src/features/kumas/components/KumasMainContainer.js`  
**Toplam:** 357 satır  
**Görev:** Kumaş kütüphanesi yönetimi, M1'den gelen taleplerin maliyet/fizibilite onayı, Ölü stok fırsat radarı.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 5 Sekme (Kumaş, Aksesuar, Fırsat, M1, Risk) | VAR | satır 33 |
| Reddedilme Kriteri: Kar marjı < %40 | VAR | satır 31 |
| Maliyet-Fizibilite Formu (kumasFiyat, miktar, iscilik, rakipSatis) | VAR | satır 21-27 |
| M1 Talepleri listesi (Aşama 2 kontrol) | VAR | satır 113-134 |
| Fırsat Radarı (Upcycle / Ölü Stok yapay zeka eşleşme) | VAR | satır 158-198 |
| `is_firsat = true` sorgusu ile beklenen kârlılık gösterimi | VAR | satır 164-191 |
| Kumaş listesi ve Min. Stok risk durumu (`14 Tek tedarikçi RİSK` vs) | VAR | satır 87-98, 201-252 |
| Arama çubuğu | VAR | satır 152 |
| `useKumas` hook'u ile veri çekimi | VAR | satır 13-16 |
| Fizibilite Onayı → `m3eAktar` fonksiyonu tetikleyici | VAR | satır 343 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. `kumaslar` TABLOSUNDA `min_stok_mt` HATASI

M2 listesinde risk hesabı (satır 43) `parseFloat(k.stok_mt) < parseFloat(k.min_stok_mt)` olarak yapılıyor. Ancak stok düşüm mekanizması (Kesim modülündeki bug nedeniyle) çalışmıyor. `stok_mt` hiç değişmiyor, dolayısıyla buradaki risk hesabı körleşmiş durumda.

### 2. M1 → M2 → M3 KÖPRÜSÜ (FİZİBİLİTE VERİSİ KAYBOLUYOR MU?)

**Satır 343:**
```js
m3eAktar({ ...seciliTalep, maliyet: toplamMaliyet, kar_marji: karMarjiYuzde });
```
M2 kârlılığı hesaplıyor ve M3'e yolluyor. Ama Kalıphane bunu kendi tablosuna kaydediyor mu yoksa "talep" statüsünde mi bırakıyor, Kalıphane incelendiğinde netlecek. İmalat onayında bu ₺ maliyet verisi M7'ye gitmezse tekrar girmek gerekir.

### 3. FIRSAT RADARI GERÇEK APİ İLE ÇALIŞMIYOR MU?

Satır 179: `%${aiVeri.beklenen_marj_yuzdesi || 65} TAHMİNİ MARJ`
Buradaki AI eşleşmesi M1'den mi geliyor yoksa `useKumas` içinde bir `Supabase RPC` ile mi üretiliyor? Eğer Supabase Python scraperları çalışmıyorsa bu veriler tamamen "hardcoded fallback" değerleridir.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Kumaş Stok | Karargah | KISMEN | Kesim'den veri gelmiyor |
| M2 Fizibilite | M7 Maliyet | BİLİNMİYOR | `toplamMaliyet` veritabanında saklanıp M7'ye aktarılmalı |
| AI Trend Raporu | M2 Önerme | KOPUK | M1 scraperları bozuk |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Tedarikçi Performans Puanlaması** → Malı geciktiren tedarikçiyi listeden düşür.
- [ ] **Barkod/QR ile Kumaş Girişi** → İrsaliye okutarak otomatik stok ekleme.
- [ ] **Renk Spektrofotometre Entegrasyonu** → Gelen kumaş partisinin renk tonu sapmasını kaydetme.
