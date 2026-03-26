# KARARGAH (M0) — Detaylı Sayfa Analizi
**Rota:** `/karargah` | **Dosya:** `src/features/karargah/components/KarargahMainContainer.js` + `hooks/useKarargah.js`  
**Görev:** Tüm sistemin komuta merkezi. 25 modülün KPI'larını, alarm akışını, AI ajan loglarını, kamera ve mesaj sistemini tek ekranda yönet.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| 25 Modül linki (5 grup halinde) | VAR | KarargahMainContainer.js satır 19-80 |
| Canlı saat (1sn'de bir güncellenen) | VAR | satır 122-127 |
| Ping ölçümü (Supabase RTT ms) | VAR | useKarargah.js satır 92, 196 |
| `useKarargah` hook (ayrı dosya) | VAR | satır 10 |
| Feature flag sistemi (ENV ile yönetilen) | VAR | satır 117-119 |
| KAMERA_AKTIF flag → `/api/stream-durum` | VAR | satır 131-146 |
| MESAJ_AKTIF flag → okunmamış mesaj sayacı | VAR | satır 152-170 |
| BOT_AKTIF flag → NİZAMBOT log akışı | VAR | satır 184-208 |
| b1_agent_loglari → akış kartları | VAR | useKarargah satır 95-107 |
| b1_arge_trendler → toplamUrun, cokSatar sayısı | VAR | useKarargah satır 110-117 |
| `/api/kasa-ozet` → ciro ve maliyet | VAR | useKarargah satır 122-128 |
| KG-03: `b1_personel.saatlik_ucret_tl × 240` | VAR | useKarargah satır 157, 175-178 |
| KG-04: fire_kaybi / toplam_maliyet × 100 | VAR | useKarargah satır 159-186 |
| KG-05: `b2_siparisler.durum=beklemede count` | VAR | useKarargah satır 165 |
| KG-06: `production_orders` aktif emir count | VAR | useKarargah satır 167-168 |
| KG-07: `stok_adeti <= 10` aktif ürün count | VAR | useKarargah satır 170-171 |
| Alarm sistemi `b1_sistem_uyarilari` | VAR | useKarargah satır 130-145 |
| AI Sorgu → `/api/ajan-calistir` | VAR | useKarargah satır 63-86 |
| Hızlı görev atama → `b1_ajan_gorevler` | VAR | useKarargah satır 30-59 |
| ZodSchema komut doğrulama | VAR | useKarargah satır 33 |
| Üretim durumu tablosu (4 hat) | VAR | useKarargah satır 205-210 |
| Hazine durumu tablosu (4 satır) | VAR | useKarargah satır 212-217 |
| Realtime (kasa/uyarı/ajan/trend tabloları) | VAR | useKarargah satır 229-235 |
| AI Modal (neden/zarar açıklaması) | VAR | KarargahMainContainer satır 230-248 |
| Adalet mühürü görseli | VAR | satır 293-300 |
| Tab arası gizleme (visibilityAPI) | VAR | satır 133, 143 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. CİRO & MALİYET — GERÇEK VERİ 0

**Sorun:** `useKarargah.js` satır 122-128:
```js
const response = await fetch('/api/kasa-ozet', { signal: AbortSignal.timeout(5000) });
if (response.ok) {
    const data = await response.json();
    ciro = data.ciro || 0;
    maliyet = data.maliyet || 0;
}
```
`b2_kasa_hareketleri` tablosu boş olduğu için `/api/kasa-ozet` her zaman `ciro: 0, maliyet: 0` döndürüyor. Karargah'taki ciro KPI her zaman **₺0** gösteriyor.

### 2. ALARM SİSTEMİ — FEATURE FLAG KAPALI

**Sorun:** useKarargah.js satır 88, 132:
```js
const ALARM_AKTIF = process.env.NEXT_PUBLIC_ALARM_AKTIF === 'true';
if (ALARM_AKTIF) { ... }
```
`NEXT_PUBLIC_ALARM_AKTIF` Vercel'de `true` olarak tanımlanmamışsa (veya tanımlı değilse) alarm bloğu hiç çalışmıyor. `b1_sistem_uyarilari` tablosu boş kalıyor, alarms dizisi `[]` kalıyor.

### 3. KG-07 STOK ALARM — YAN KOLON BAĞLANTISI BOZUK

**Sorun:** useKarargah.js satır 170-171:
```js
supabase.from('b2_urun_katalogu').select('id', { count: 'exact', head: true })
    .lte('stok_adeti', 10).eq('durum', 'aktif')
```
Stok tutarı `stok_adeti` kolonu `b2_urun_katalogu`'nda sabit başlangıç değeri — gerçek stok **`b2_urun_katalogu`'nun `net_stok` hesabı değil**. `net_stok` sayfada JavaScript'te hesaplayan şey; Supabase'de kolonun kendisi yok. Bu sorgu `stok_adeti <= 10` diye filtrelerken, StokMainContainer `stok_adeti + hareketler` hesaplıyor. İki değer arasında tutarsızlık var.

### 4. KG-04 FIRE % — TABLO BOŞ

**Sorun:** useKarargah.js satır 159-160:
```js
supabase.from('b1_maliyet_kayitlari').select('tutar_tl').eq('maliyet_tipi', 'fire_kaybi')
```
İmalat modülünün 4. penceresinde (`finaleOnayVerMuhasebeyeYaz`) maliyet kaydı `personel_iscilik` tipiyle yazılıyor ama `fire_kaybi` tipiyle kayıt hiç yazılmıyor. Fire % her zaman **%0** gösteriyor.

### 5. KPIData HedEf SABİT

**Sorun:** useKarargah.js satır 198-203:
```js
setKpiData({
    ciro: { anlik: ciro, hedef: 500000, artisYuzde: 12, durum: 'IYI' },
    maliyet: { anlik: maliyet, artisYuzde: -4, durum: 'IYI' },
    ...
});
```
`hedef: 500000` ve `artisYuzde: 12` sabit yazılmış — bu değerler hiçbir hesaplamaya dayanmıyor. Hedef, ayarlar tablosundan ya da gerçek geçen ay verisinden hesaplanmalıydı.

### 6. KG-06 — `production_orders` TABLO SORUNU

**Sorun:** useKarargah.js satır 167-168:
```js
supabase.from('production_orders').select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'in_progress', 'in_production'])
```
`production_orders`'daki status değerleri `in_production` mı yoksa `preparing` mi? İmalat kodunda `status: 'in_progress'` kullanılıyor (satır 210 ImalatMainContainer.js). Eşleşme tutarsız — aktif üretim sayısı eksik gözüküyor.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Mevcut Durum | Sorun |
|--------|-------|-------------|-------|
| Kasa → Karargah ciro | VAR (altyapı) | b2_kasa_hareketleri boş olduğu için ₺0 |
| İmalat → Karargah üretim | VAR (production_orders) | status enum uyumsuzluğu |
| Stok → Karargah alarm | VAR (b2_urun_katalogu) | stok_adeti vs net_stok farkı |
| AR-GE → Karargah trend | VAR (b1_arge_trendler) | Scraper çalışmıyor, tablo boş |
| Alarm → Karargah | VAR (b1_sistem_uyarilari) | Feature flag kapalı veya ENV yok |
| Mesaj → Karargah | AKTIF (b1_ic_mesajlar) | En sağlam çalışan entegrasyon |
| Bot → Karargah | AKTIF (b1_agent_loglari) | NİZAMBOT log akışı çalışıyor |

---

## ❌ MEVCUT KOD SORUNLARI

- [ ] **`ALARM_AKTIF` ENV tanımlı değil** → Vercel'de `NEXT_PUBLIC_ALARM_AKTIF=true` yoksa alarmlar gösterilmiyor
- [ ] **`KAMERA_AKTIF` ENV tanımlı değil** → `/api/stream-durum` hiç çağrılmıyor, kamera durumu `kapali` kalıyor
- [ ] **`ciroArtis: 12` hardcoded** → useKarargah.js satır 199: artış yüzdesi sabit, hesaplanmıyor
- [ ] **`hedef: 500000` hardcoded** → Kullanıcı tanımlamalı, b1_sistem_ayarlari'ndan gelmeli
- [ ] **Neden `useKarargah` hook'u export function, default değil?** → KarargahMainContainer.js satır 82: `export function KarargahMainContainer()` — default export değil, bu sayfanın Next.js routing'i nasıl çalışıyor? `app/karargah/page.js` bu ismi import edebiliyor mu?

---

## 📋 BİLGİ AKIŞI HARİTASI (MEVCUT)

```
b2_kasa_hareketleri ─→ /api/kasa-ozet ─→ ciro (₺0)
b1_arge_trendler ─────→ toplamUrun, cokSatar (boş tablo)
b1_personel ──────────→ personelMaasToplami (240 saat tahmin)
b1_maliyet_kayitlari ─→ fire_kaybi (₺0, bu tip yok)
b2_siparisler ────────→ bekleyenSiparis (gerçek count)
production_orders ────→ aktifUretim (status enum sorunu)
b2_urun_katalogu ─────→ stokAlarm (stok_adeti sorunlu)
b1_sistem_uyarilari ──→ alarms (flag kapalı/tablo boş)
b1_agent_loglari ─────→ aiOutputs (bot logları gelirse çalışıyor)
b1_ic_mesajlar ───────→ mesajSayisi, sonMesajlar (çalışıyor)
```

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] Gerçek zamanlı finansal dashboard (ciro her dakika güncellenir)
- [ ] Anomali algılama AI (normalden sapan KPI'larda otomatik uyarı)
- [ ] Sesli komut merkezi (mikrofona "siparişler nerede?" diye sor)
- [ ] Karşılaştırmalı dönem analizi (bu hafta vs geçen hafta/ay otomatik)
- [ ] Mobil Karargah uygulaması (CEO için özel iOS/Android)
- [ ] Bütçe hedefi yönetimi (aylık hedef b1_sistem_ayarlari'ndan)
- [ ] Çoklu fabrika haritası (n tesis aynı anda izlenir)
- [ ] Tedarik zinciri risk skoru (tek bakışta tedarikçi durumu)
