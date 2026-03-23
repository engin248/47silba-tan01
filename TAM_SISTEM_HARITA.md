# 🗺️ TAM SİSTEM NOKTA HARİTASI
**Tarih:** 19 Mart 2026 | **Hazırlayan:** ANTİGRAVİTY Baş Müfettiş  
**Yöntem:** Otomatik kod taraması (gerçek veriler)

> **246 dosya · 30.914 satır kod · 519 DB sorgusu · 700 state · 286 Telegram · 46 silme onayı**

---

## 📦 BÖLÜM 1 — FEATURE MODÜLLERI (26 Modül)

---

### 🧩 1. AJANLAR `/ajanlar`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 12 | — | 0 | 0 | 0 | 0 | 0 |
| `AjanlarMainContainer.js` | 742 | b1_ajan_gorevler, b0_sistem_loglari | 14 | 3 | 5 | 2 | 1 |
| `useAjanlar.js` | 142 | — | 13 | 3 | 0 | 1 | 1 |
| `ajanlarApi.js` | 136 | b0_sistem_loglari, b1_ajan_gorevler | 0 | 0 | 2 | 0 | 0 |
> **Toplam: 1.032 satır | DB: 2 tablo | State: 27 | Telegram: 7 | Realtime: 2**

---

### 🧩 2. AR-GE `/arge`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 6 | — | 0 | 0 | 0 | 0 | 0 |
| `ArgeMainContainer.js` | 1.351 | b1_arge_trendler, b1_agent_loglari, b0_sistem_loglari | 19 | 2 | 1 | 1 | 1 |
| `ArgeSayfasi.js` | 8 | — | 0 | 0 | 0 | 0 | 0 |
| `M1_AramaMotoru.js` | 131 | — | 2 | 0 | 0 | 0 | 0 |
| `M1_TrendSonucKarti.js` | 176 | — | 4 | 0 | 0 | 0 | 0 |
| `M1_UrunRecetesi.js` | 109 | — | 0 | 0 | 0 | 0 | 0 |
| `useArge.js` | 164 | b1_arge_trendler, b1_agent_loglari, b0_sistem_loglari | 14 | 2 | 0 | 1 | 1 |
| `argeApi.js` | 97 | b1_arge_trendler, b1_agent_loglari, b0_sistem_loglari | 0 | 0 | 0 | 0 | 1 |
| `hermAi.js` | 42 | — | 0 | 0 | 0 | 0 | 0 |
> **Toplam: 2.084 satır | DB: 3 tablo | State: 39 | Telegram: 1 | Realtime: 3**

---

### 🧩 3. AYARLAR `/ayarlar`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 18 | — | 0 | 0 | 0 | 0 | 0 |
| `AyarlarMainContainer.js` | 329 | b1_sistem_ayarlari | 5 | 2 | 3 | 0 | 1 |
| `useAyarlar.js` | 112 | b1_sistem_ayarlari | 5 | 2 | 2 | 0 | 1 |
| `ayarlarApi.js` | 91 | — | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 550 satır | DB: 1 tablo | State: 10 | Telegram: 5 | Realtime: 3**

---

### 🧩 4. DENETMEN `/denetmen`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 7 | — | 0 | 0 | 0 | 0 | 0 |
| `DenetmenMainContainer.js` | 543 | b1_sistem_uyarilari, b1_agent_loglari | 15 | 2 | 4 | 0 | 1 |
| `useDenetmen.js` | 63 | — | 8 | 2 | 0 | 0 | 0 |
| `denetmenApi.js` | 49 | b1_sistem_uyarilari, b1_agent_loglari | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 662 satır | DB: 2 tablo | State: 23 | Telegram: 4 | Realtime: 2**

---

### 🧩 5. GİRİŞ `/giris`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 6 | — | 0 | 0 | 0 | 0 | 0 |
| `GirisMainContainer.js` | 197 | — (PIN API) | 8 | 3 | 0 | 0 | 0 |
> **Toplam: 203 satır | Auth: /api/pin-dogrula | State: 8 | NOT: Supabase doğrudan değil, API üzerinden**

---

### 🧩 6. GÖREVLER `/gorevler`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 6 | — | 0 | 0 | 0 | 0 | 0 |
| `GorevlerMainContainer.js` | 365 | b1_gorevler, b0_sistem_loglari | 11 | 2 | 4 | 1 | 1 |
| `useGorevler.js` | 89 | b1_gorevler | 9 | 2 | 2 | 1 | 1 |
| `gorevlerApi.js` | 49 | b1_gorevler | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 509 satır | DB: 2 tablo | State: 20 | Telegram: 6 | Realtime: 3**

---

### 🧩 7. GÜVENLİK `/guvenlik`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 6 | — | 0 | 0 | 0 | 0 | 0 |
| `GuvenlikMainContainer.js` | 452 | — | 8 | 2 | 7 | 1 | 0 |
| `useGuvenlik.js` | 63 | b0_sistem_loglari, b0_giris_girisimleri | 6 | 2 | 0 | 0 | 1 |
| `guvenlikApi.js` | 38 | b0_sistem_loglari | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 559 satır | DB: 2 tablo | State: 14 | Telegram: 7 | Realtime: 2**

---

### 🧩 8. HABERLEŞMEe `/haberlesme`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 2 | — | 0 | 0 | 0 | 0 | 0 |
| `HaberlesmeMainContainer.js` | **946** | b1_model_taslaklari, b1_ic_mesajlar, b0_sistem_loglari | **17** | 3 | 2 | 1 | 1 |
> **Toplam: 948 satır | DB: 3 tablo | State: 17 | SHA-256 damgalı | Realtime: 1**

---

### 🧩 9. İMALAT `/imalat`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 7 | — | 0 | 0 | 0 | 0 | 0 |
| `ImalatMainContainer.js` | 760 | production_orders, b1_model_taslaklari, v2_models, v2_production_steps, v2_model_workflows, v2_order_production_steps, v2_users, b1_maliyet_kayitlari | 18 | 2 | 9 | 0 | 1 |
| `useImalat.js` | 77 | — | 9 | 2 | 0 | 1 | 0 |
| `imalatApi.js` | 46 | b1_imalat_emirleri, b1_model_taslaklari, b0_sistem_loglari | 0 | 0 | 2 | 0 | 1 |
> **Toplam: 890 satır | DB: 8 tablo | State: 27 | Telegram: 11 | ⚠️ v2_ tablolar mevcut**

---

### 🧩 10. KALIP `/kalip`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 7 | — | 0 | 0 | 0 | 0 | 0 |
| `KalipMainContainer.js` | 549 | b1_model_taslaklari, b1_arge_trendler, b1_model_kaliplari, b0_sistem_loglari | 13 | 2 | 4 | 1 | 1 |
| `useKalip.js` | 69 | — | 8 | 2 | 0 | 1 | 0 |
| `kalipApi.js` | 61 | b1_model_kaliplari, b1_model_taslaklari, b1_arge_trendler, b0_sistem_loglari | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 686 satır | DB: 4 tablo | State: 21 | Telegram: 4 | Realtime: 2**

---

### 🧩 11. KAMERALAR `/kameralar`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `CameraPlayer.js` | 142 | — | 5 | 5 | 0 | 0 | 0 |
| `KameralarMainContainer.js` | 627 | camera_access_log, camera_events | 14 | 7 | 2 | 0 | 1 |
| `useMotionDetection.js` | 138 | camera_events | 2 | 2 | 0 | 0 | 0 |
> **Toplam: 907 satır | DB: 2 tablo | State: 21 | Effect: 14 | Realtime: 1**

---

### 🧩 12. KARARGAH `/` (Ana Sayfa)
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 7 | — | 0 | 0 | 0 | 0 | 0 |
| `KarargahMainContainer.js` | 609 | — (hook üzerinden) | 13 | 6 | 0 | 0 | 2 |
| `useKarargah.js` | 131 | b2_kasa_hareketleri, b1_maliyet_kayitlari, b1_sistem_uyarilari | 10 | 2 | 0 | 0 | 1 |
| `komutSchema.js` | 6 | — | 0 | 0 | 0 | 0 | 0 |
| `hermAi.js` | 35 | — | 0 | 0 | 0 | 0 | 0 |
| `karargahApi.js` | 60 | b2_siparisler, b1_model_taslaklari, b2_urun_katalogu, b1_muhasebe_raporlari, b1_arge_trendler, b0_ajan_loglari | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 848 satır | DB: 6 tablo | State: 23 | Realtime: 4**

---

### 🧩 13. KASA `/kasa`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 7 | — | 0 | 0 | 0 | 0 | 0 |
| `KasaMainContainer.js` | 478 | b2_kasa_hareketleri, b2_musteriler, b1_personel, b0_sistem_loglari | 12 | 2 | 3 | 1 | 1 |
| `useKasa.js` | 73 | — | 8 | 2 | 0 | 1 | 0 |
| `hermAi.js` | 37 | — | 0 | 0 | 0 | 0 | 0 |
| `kasaApi.js` | 61 | b2_kasa_hareketleri, b2_musteriler, b0_sistem_loglari | 0 | 0 | 2 | 0 | 1 |
> **Toplam: 656 satır | DB: 4 tablo | State: 20 | Telegram: 5 | Realtime: 2**

---

### 🧩 14. KATALOG `/katalog`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 23 | — | 0 | 0 | 0 | 0 | 0 |
| `KatalogMainContainer.js` | **1.015** | b2_teklif_logs, b2_urun_katalogu, b2_urun_varyant_stok, b0_sistem_loglari | **27** | 3 | 6 | **3** | 1 |
| `useKatalog.js` | 212 | — | 17 | 2 | 3 | 1 | 0 |
| `katalogApi.js` | 164 | — | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 1.414 satır | DB: 4 tablo | State: 44 | Telegram: 9 | Confirm: 4 | Realtime: 2**

---

### 🧩 15. KESİM `/kesim`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 7 | — | 0 | 0 | 0 | 0 | 0 |
| `KesimMainContainer.js` | 572 | b1_kesim_operasyonlari, b1_model_taslaklari, production_orders, b1_maliyet_kayitlari, b1_kumas_arsivi, b0_sistem_loglari | 15 | 3 | 7 | 2 | 1 |
| `useKesim.js` | 72 | — | 8 | 2 | 0 | 1 | 0 |
| `kesimApi.js` | 54 | b1_kesim_operasyonlari, b1_model_taslaklari, b0_sistem_loglari | 0 | 0 | 1 | 0 | 1 |
> **Toplam: 705 satır | DB: 6 tablo | State: 23 | Telegram: 8 | Realtime: 2**

---

### 🧩 16. KUMAŞ `/kumas`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 12 | — | 0 | 0 | 0 | 0 | 0 |
| `KumasMainContainer.js` | 687 | b1_kumas_arsivi, b2_tedarikciler, b1_aksesuar_arsivi, b0_sistem_loglari | 19 | 2 | 6 | 1 | 1 |
| `useKumas.js` | 147 | — | 16 | 2 | 0 | 1 | 1 |
| `kumasApi.js` | 117 | b1_kumas_arsivi, b2_tedarikciler, b1_aksesuar_arsivi, b0_sistem_loglari | 0 | 0 | 3 | 0 | 1 |
> **Toplam: 963 satır | DB: 4 tablo | State: 35 | Telegram: 9 | Realtime: 3**

---

### 🧩 17. MALİYET `/maliyet`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 6 | — | 0 | 0 | 0 | 0 | 0 |
| `MaliyetMainContainer.js` | 625 | b1_maliyet_kayitlari, production_orders, b0_sistem_loglari | 18 | 3 | 6 | 3 | 1 |
| `useMaliyet.js` | 132 | — | 10 | 2 | 0 | 1 | 0 |
| `maliyetApi.js` | 46 | b1_maliyet_kayitlari, b1_model_taslaklari, b0_sistem_loglari | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 809 satır | DB: 3 tablo | State: 28 | Telegram: 6 | Confirm: 4 | Realtime: 2**

---

### 🧩 18. MODELHANE `/modelhane`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 6 | — | 0 | 0 | 0 | 0 | 0 |
| `M2_FizikselMuhendislikFormu.js` | 200 | — | 3 | 0 | 0 | 0 | 0 |
| `M2_GelenIlhamKarti.js` | 123 | — | 0 | 0 | 0 | 0 | 0 |
| `ModelhaneMainContainer.js` | 907 | b1_arge_trendler, b1_numune_uretimleri, b1_model_taslaklari, b1_dikim_talimatlari, b1_model_kaliplari, b0_sistem_loglari | 19 | 4 | 1 | 1 | 1 |
| `useModelhane.js` | 114 | b1_model_taslaklari, b0_sistem_loglari | 9 | 2 | 2 | 1 | 1 |
| `modelhaneApi.js` | 44 | b1_model_taslaklari | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 1.394 satır | DB: 6 tablo | State: 31 | Telegram: 3 | Realtime: 3**

---

### 🧩 19. MUHASEBE `/muhasebe`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 12 | — | 0 | 0 | 0 | 0 | 0 |
| `MuhasebeMainContainer.js` | 716 | b1_muhasebe_raporlari, b1_model_taslaklari, b1_maliyet_kayitlari, b0_sistem_loglari | 12 | 2 | 5 | 2 | 1 |
| `useMuhasebe.js` | 168 | — | 11 | 2 | 0 | 2 | 1 |
| `hermAi.js` | 39 | — | 0 | 0 | 0 | 0 | 0 |
| `muhasebeApi.js` | 135 | b1_muhasebe_raporlari, b1_model_taslaklari, b0_sistem_loglari, b1_maliyet_kayitlari | 0 | 0 | 4 | 0 | 0 |
> **Toplam: 1.070 satır | DB: 4 tablo | State: 23 | Telegram: 9 | Confirm: 4 | Realtime: 2**

---

### 🧩 20. MÜŞTERİLER `/musteriler`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 6 | — | 0 | 0 | 0 | 0 | 0 |
| `MusterilerMainContainer.js` | 529 | b2_musteriler, b0_sistem_loglari | 17 | 2 | 3 | 1 | 1 |
| `useMusteriler.js` | 91 | b2_musteriler, b2_siparisler, b0_sistem_loglari | 10 | 2 | 0 | 1 | 1 |
| `musterilerApi.js` | 54 | b2_musteriler, b0_sistem_loglari | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 680 satır | DB: 3 tablo | State: 27 | Telegram: 3 | Realtime: 3**

---

### 🧩 21. PERSONEL `/personel`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 6 | — | 0 | 0 | 0 | 0 | 0 |
| `PersonelMainContainer.js` | 826 | b1_sistem_ayarlari, b1_personel, b2_kasa_hareketleri, b0_sistem_loglari, b1_personel_devam | 18 | 3 | 6 | 2 | 1 |
| `usePersonelV2.js` | 219 | b1_sistem_ayarlari, b1_personel, b1_personel_devam, b0_sistem_loglari | 15 | 3 | 4 | 2 | 1 |
| `hermAi.js` | 44 | — | 0 | 0 | 0 | 0 | 0 |
| `personelApi.js` | 111 | b1_personel, b1_personel_devam, b1_sistem_ayarlari, b0_sistem_loglari | 0 | 0 | 4 | 0 | 1 |
> **Toplam: 1.206 satır | DB: 5 tablo | State: 33 | Telegram: 14 | Confirm: 4 | Realtime: 3**

---

### 🧩 22. RAPORLAR `/raporlar`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 7 | — | 0 | 0 | 0 | 0 | 0 |
| `RaporlarMainContainer.js` | 546 | b1_model_taslaklari, b1_kumas_arsivi, b2_siparisler, b1_personel, b1_maliyet_kayitlari, b1_muhasebe_raporlari, b1_personel_devam | 11 | 2 | 3 | 0 | 1 |
| `useRaporlar.js` | 185 | b1_model_taslaklari, b1_kumas_arsivi, b2_siparisler, b1_personel, b1_maliyet_kayitlari, b1_muhasebe_raporlari, b1_personel_devam | 11 | 2 | 2 | 0 | 1 |
| `raporlarApi.js` | 92 | b1_maliyet_kayitlari, b2_siparisler | 0 | 0 | 0 | 0 | 1 |
> **Toplam: 830 satır | DB: 7 tablo | State: 22 | Telegram: 5 | Realtime: 3**

---

### 🧩 23. SİPARİŞLER `/siparisler`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 12 | — | 0 | 0 | 0 | 0 | 0 |
| `SiparislerMainContainer.js` | 961 | b2_siparisler, b2_musteriler, b2_urun_katalogu, b2_siparis_kalemleri, b2_stok_hareketleri, b0_sistem_loglari | 18 | 2 | 6 | 1 | 2 |
| `useSiparisler.js` | 172 | — | 17 | 2 | 0 | 1 | 1 |
| `hermAi.js` | 35 | — | 0 | 0 | 0 | 0 | 0 |
| `siparislerApi.js` | 146 | b2_musteriler, b2_urun_katalogu, b2_siparisler, b2_stok_hareketleri, b2_siparis_kalemleri, b0_sistem_loglari | 0 | 0 | 5 | 0 | 0 |
> **Toplam: 1.326 satır | DB: 6 tablo | State: 35 | Telegram: 11 | Realtime: 3**

---

### 🧩 24. STOK `/stok`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 7 | — | 0 | 0 | 0 | 0 | 0 |
| `StokMainContainer.js` | 460 | b2_urun_katalogu, b2_stok_hareketleri, b0_sistem_loglari | 10 | 2 | 4 | 1 | 1 |
| `useStok.js` | 102 | — | 8 | 2 | 0 | 1 | 0 |
| `hermAi.js` | 39 | — | 0 | 0 | 0 | 0 | 0 |
| `stokApi.js` | 80 | b2_urun_katalogu, b2_stok_hareketleri, b0_sistem_loglari | 0 | 0 | 3 | 0 | 1 |
> **Toplam: 688 satır | DB: 3 tablo | State: 18 | Telegram: 7 | Realtime: 2**

---

### 🧩 25. TASARIM `/tasarim`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `TasarimMainContainer.js` | 468 | b0_tasarim_ayarlari | 15 | 3 | 0 | 0 | 0 |
> **Toplam: 468 satır | DB: 1 tablo | State: 15 | Not: No realtime**

---

### 🧩 26. ÜRETİM `/uretim`
| Dosya | Satır | DB Tabloları | State | Effect | Telegram | Confirm | Realtime |
|-------|-------|-------------|-------|--------|----------|---------|---------|
| `index.js` | 24 | — | 0 | 0 | 0 | 0 | 0 |
| `IsEmriListesi.js` | 126 | — | 0 | 0 | 0 | 0 | 0 |
| `MaliyetOzeti.js` | 96 | — | 0 | 0 | 0 | 0 | 0 |
| `UretimSayfasi.js` | 378 | — | 0 | 0 | 0 | 0 | 0 |
| `useIsEmri.js` | 414 | b1_model_taslaklari, production_orders, b1_personel, b1_maliyet_kayitlari, b1_muhasebe_raporlari, b0_sistem_loglari | 21 | 3 | 6 | 3 | 1 |
| `uretimApi.js` | 117 | b1_model_taslaklari, production_orders, b1_personel, b1_maliyet_kayitlari, b1_muhasebe_raporlari, b0_sistem_loglari | 0 | 0 | 0 | 0 | 0 |
> **Toplam: 1.155 satır | DB: 6 tablo | State: 21 | Telegram: 6 | Confirm: 3 | Realtime: 1**

---

## ⚙️ BÖLÜM 2 — API ROTALARI (25 Endpoint)

| # | Route | Dosya | Satır | HTTP | DB Tabloları |
|---|-------|-------|-------|------|-------------|
| 1 | `/api/2fa-dogrula` | route.js | 91 | POST | b0_sistem_loglari |
| 2 | `/api/2fa-kurulum` | route.js | 58 | POST | b0_sistem_loglari |
| 3 | `/api/agent` | route.js | 165 | POST | — |
| 4 | `/api/ajan-calistir` | route.js | 226 | POST | b1_ajan_gorevler, b1_arge_trendler |
| 5 | `/api/ajan-tetikle` | route.js | 142 | POST | camera_events |
| 6 | `/api/cron-ajanlar` | route.js | 108 | GET | — |
| 7 | `/api/gorev-ekle` | route.js | 67 | POST | — |
| 8 | `/api/haberlesme` (GET) | route.js | 47 | GET | — |
| 9 | `/api/haberlesme` (POST) | route.js | 46 | POST | — |
| 10 | `/api/is-emri-ekle` | route.js | 73 | POST | — |
| 11 | `/api/kumas-ekle` | route.js | 102 | POST | — |
| 12 | `/api/kur` | route.js | 91 | GET | — (dış API) |
| 13 | `/api/model-hafizasi` | route.js | 133 | GET | — |
| 14 | `/api/musteri-ekle` | route.js | 55 | POST | — |
| 15 | `/api/personel-ekle` | route.js | 62 | POST | — |
| 16 | `/api/pin-dogrula` | route.js | **200** | POST | — (JWT) |
| 17 | `/api/siparis-ekle` | route.js | 130 | POST | — |
| 18 | `/api/stok-alarm` | route.js | 102 | GET+POST | b0_sistem_loglari |
| 19 | `/api/stok-hareket-ekle` | route.js | 54 | POST | — |
| 20 | `/api/stream-durum` | route.js | 38 | GET | — |
| 21 | `/api/telegram-bildirim` | route.js | 103 | POST | b0_api_spam_kalkani, b1_sistem_ayarlari |
| 22 | `/api/telegram-foto` | route.js | 38 | POST | — |
| 23 | `/api/telegram-webhook` | route.js | **205** | POST | b0_telegram_log, b1_numune_uretimleri, b1_ic_mesajlar |
| 24 | `/api/test-arge` | route.js | 85 | POST | — |
| 25 | `/api/trend-ara` | route.js | 127 | POST | — (web scraping) |
| 26 | `/api/veri-getir` | route.js | 47 | POST | — |

---

## 🔧 BÖLÜM 3 — LIB / ALTYAPI (23 Dosya)

| Dosya | Boyut | Görev |
|-------|-------|-------|
| `auth.js` | 10.6 KB | PIN auth, JWT üretimi, session yönetimi |
| `ajanlar-v2.js` | **41.8 KB** | Ajan motoru v2 — en büyük lib |
| `lang.js` | 12.4 KB | Türkçe/Arapça çeviri sistemi |
| `zodSchemas.js` | 9.3 KB | Form validasyon şemaları |
| `ajanlar.js` | 7.3 KB | Ajan temel mantığı v1 |
| `yetki.js` | 5.9 KB | Yetki matrisi (grup bazlı) |
| `TasarimContext.js` | 4.3 KB | Global tema context |
| `modelHafizasi.js` | 4.6 KB | Model öğrenim hafızası |
| `offlineKuyruk.js` | 6.1 KB | Çevrimdışı işlem kuyruğu |
| `apiClient.js` | 6.0 KB | API istemcisi |
| `utils.js` | 3.7 KB | Yardımcı fonksiyonlar |
| `hataBildirim.js` | 3.7 KB | Hata raporlama |
| `logger.js` | 3.8 KB | Log sistemi |
| `totp.js` | 3.6 KB | TOTP/2FA mantığı |
| `aiOneri.js` | 3.8 KB | AI öneri motoru |
| `kripto.js` | 2.3 KB | Şifreleme yardımcıları |
| `dipArsiv.js` | 2.0 KB | Derin arşiv işlemleri |
| `silmeYetkiDogrula.js` | 2.0 KB | Silme yetki doğrulama |
| `rateLimit.js` | 2.5 KB | Rate limiter |
| `supabase.js` | 1.3 KB | Supabase client |
| `supabaseAdmin.js` | 0.4 KB | Admin client |
| `langContext.js` | 0.8 KB | Dil context provider |
| `agents_dummy.js` | 0.03 KB | Dummy ajan (placeholder) |

---

## 🏗️ BÖLÜM 4 — GLOBAL YAPI

| Dosya | Boyut | Görev |
|-------|-------|-------|
| `ClientLayout.js` | **21.7 KB** | Tüm sayfaların sarmalı, sidebar, nav |
| `globals.css` | 12.8 KB | Global CSS sistemi |
| `layout.js` | 1.9 KB | Next.js root layout |
| `middleware.js` | 8.2 KB | Route koruması, auth kontrol |
| `error.js` | 4.1 KB | Global hata sayfası |
| `global-error.js` | 4.1 KB | Kritik hata yakalayıcı |
| `not-found.js` | 1.7 KB | 404 sayfası |

---

## 📊 BÖLÜM 5 — VERİTABANI TABLOLARI (Gerçek Kullanılanlar)

### b0_ — Sistem Tabloları
- `b0_sistem_loglari` — İşlem günlüğü
- `b0_tasarim_ayarlari` — Tema ayarları
- `b0_sistem_loglari` — Güvenlik logları
- `b0_giris_girisimleri` — Giriş denemeleri
- `b0_api_spam_kalkani` — Rate limit
- `b0_telegram_log` — Telegram mesaj logu
- `b0_ajan_loglari` — Ajan işlem logu

### b1_ — Üretim Tabloları
- `b1_model_taslaklari` — Ürün/model kayıtları
- `b1_arge_trendler` — Trend araştırmaları
- `b1_kumas_arsivi` — Kumaş arşivi
- `b1_aksesuar_arsivi` — Aksesuar arşivi
- `b1_model_kaliplari` — Kalıp verileri
- `b1_kesim_operasyonlari` — Kesim operasyonları
- `b1_maliyet_kayitlari` — Maliyet kayıtları
- `b1_muhasebe_raporlari` — Muhasebe raporları
- `b1_personel` — Personel kayıtları
- `b1_personel_devam` — Devam takibi
- `b1_sistem_ayarlari` — Ayarlar çizelgesi
- `b1_sistem_uyarilari` — Sistem alarmları
- `b1_agent_loglari` — Ajan logları
- `b1_ajan_gorevler` — Ajan görevleri
- `b1_gorevler` — Kullanıcı görevleri
- `b1_ic_mesajlar` — Haberleşme mesajları
- `b1_mesaj_gizli` — Gizlenen mesajlar
- `b1_imalat_emirleri` — İmalat emirleri
- `b1_numune_uretimleri` — Numune üretim
- `b1_dikim_talimatlari` — Dikim talimatları

### b2_ — Ticari Tablolar
- `b2_musteriler` — Müşteri kayıtları
- `b2_siparisler` — Sipariş kayıtları
- `b2_siparis_kalemleri` — Sipariş kalemleri
- `b2_urun_katalogu` — Ürün katalogu
- `b2_urun_varyant_stok` — Varyant stok
- `b2_stok_hareketleri` — Stok hareketleri
- `b2_kasa_hareketleri` — Kasa hareketleri
- `b2_tedarikciler` — Tedarikçiler
- `b2_teklif_logs` — Teklif logları

### Genel/v2_ Tablolar
- `production_orders` — Üretim emirleri
- `camera_access_log` — Kamera erişim
- `camera_events` — Kamera olayları
- `v2_models`, `v2_production_steps` vd.

---

## 🏁 GENEL ÖZET TABLOSU

| Ölçüt | Rakam |
|-------|-------|
| **Toplam JS Dosyası** | **246** |
| **Toplam Kod Satırı** | **30.914** |
| **Toplam Boyut** | **~2 MB** |
| **Feature Modülü** | **26** |
| **API Endpoint** | **25** |
| **Lib/Altyapı Dosyası** | **23** |
| **Global Dosya** | **7** |
| **Veritabanı Tablosu** | **~40** |
| **DB Sorgu Noktası** | **519** |
| **State Noktası** | **700** |
| **Telegram Tetikleyici** | **286** |
| **Silme Onayı** | **46** |
| **Realtime Kanal** | **26** |

---

*ANTİGRAVİTY Baş Müfettiş — 19 Mart 2026*
