# KALIP / MODELHANE SAYFASI ANALİZİ
> Tarih: 17 Mart 2026 | Kaynak: Kullanıcı Analizi + Mühendis Notları

---

## MEVCUT DURUM

- Sayfa doğru yerde (akışta doğru konum)
- Ama şu an: boş şablon
- Veri yok → işlev yok
→ **Bu sayfa kritik: üretimin kalbi**

---

## BU SAYFA NE OLMALI (NET TANIM)

Bu sayfa:
→ çizim yeri **değil**
→ **ürünü üretilebilir hale getiren sistem**

---

## OLMASI ZORUNLU ANA BLOKLAR

### A) MODEL KARTI (MERKEZ)
Her model için:
- Model adı / kod
- Kategori (pantolon, elbise vs)
- Referans görsel
- Kumaş seçimi (M2 bağlı)
- Aksesuar seçimi
- Açıklama
→ **Bu olmadan sistem başlamaz**

### B) KALIP YAPISI
- Parça listesi (ön, arka, kol vs)
- Parça sayısı
- Kalıp dosyası (DXF / PDF)
- Dikiş payları
- Grainline
→ **Bu: üretimin temeli**

### C) BEDEN SERİLEME
- XS–S–M–L ölçüleri
- Artış kuralları
- Otomatik serileme
→ manuel olmaz → **sistem olmalı**

### D) METRAJ HESABI (ÇOK KRİTİK)
- Kumaş tüketimi (metre)
- Fire oranı
- Astar / aksesuar tüketimi
→ **maliyetin başlangıcı burası**

### E) ZORLUK / ÜRETİM SKORU
- Kolay / orta / zor
- Tahmini işçilik süresi
- Makine ihtiyacı
→ Ar-Ge ile bağlantı

### F) MALZEME BAĞLANTISI
- Kumaş (M2'den seçilecek)
- Düğme / fermuar vs
→ manuel yazı değil → **seçilebilir olmalı**

### G) REVİZYON TAKİBİ
- Versiyon 1 / 2 / 3
- Kim değiştirdi
- Ne değişti
→ hata kontrolü

### H) ÖNİZLEME (KRİTİK)
- 2D çizim
- Mümkünse 3D görünüm
→ **üretmeden önce gör**

---

## ŞU ANKİ SAYFADAKİ EKSİKLER

❌ Model listesi yok
❌ Kalıp verisi yok
❌ Serileme yok
❌ Metraj yok
❌ Malzeme bağlantısı yok
❌ Revizyon yok
→ şu an: buton + boş alan

---

## EN KRİTİK BAĞLANTI

Bu sayfa bağlı olmalı:
**M2 (kumaş) → M4 (modelhane) → M7 (maliyet)**
→ bağ yoksa sistem kopuk

---

## DÜNYA STANDARDI REFERANS

Bu sayfa = **Gerber · Lectra · CLO 3D pattern system**

---

## KRİTİK HATA

Sağ panel yine: CORS · 522
→ kalıp verisi çekilemez → sistem çalışmaz

---

## KESİN SONUÇ

✔ Konum doğru · ✔ Mantık doğru

❌ İçerik yok · ❌ Bağlantı yok

**NET HÜKÜM:**
- Bu sayfa doğru kurulursa: hatasız üretim → doğru maliyet → hızlı model
- Yanlış kalırsa: üretim kaosu → maliyet hatası → zaman kaybı

---

## MODÜL BAĞLANTI HARİTASI

```
M2 Kumaş Arşiv  →  Kalıp (kumaş seçimi)
Kalıp (metraj)  →  M7 Maliyet (maliyet hesabı)
Kalıp (model kart)  →  M4 Modelhane (üretime gönder)
Kalıp (zorluk skoru)  →  AR-GE (üretim kararı)
```

---

## VERİTABANI ŞEMASI

```sql
b1_kalip_modelleri (
    id UUID PRIMARY KEY,
    model_kodu TEXT UNIQUE,     -- KLP-2026-001
    model_adi TEXT,
    kategori TEXT,              -- pantolon / elbise / gomlek...
    referans_gorsel_url TEXT,

    -- Bağlantılar
    kumas_id UUID REFERENCES b2_malzeme_katalogu(id),
    aksesuar_ids UUID[],

    -- Kalıp yapısı
    parca_listesi JSONB,        -- [{ad: "ön beden", dosya: "url"}]
    kalip_dosya_url TEXT,       -- DXF/PDF
    dikis_payi_mm NUMERIC,

    -- Serileme
    bedenler JSONB,             -- {XS: {boy: 158, bel: 68}, S: {...}}
    serileme_kurali JSONB,

    -- Metraj
    kumas_tuketim_m NUMERIC,
    fire_orani NUMERIC,         -- yüzde
    astar_tuketim_m NUMERIC,

    -- Üretim
    zorluk_seviye TEXT,         -- kolay/orta/zor
    tahmini_iscilik_dk NUMERIC,
    makine_ihtiyaci TEXT[],

    -- Revizyon
    versiyon INTEGER DEFAULT 1,
    revizyon_log JSONB,

    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## UYGULAMA ÖNCELİK SIRASI

1. A bloğu — Temel model kaydı (ad, kod, kategori, görsel)
2. F bloğu — Malzeme bağlantısı (Kumaş Arşiv entegrasyonu)
3. D bloğu — Metraj sistemi (maliyet hesabı için zorunlu)
4. C bloğu — Serileme (tablo bazlı, otomatik)
5. G bloğu — Revizyon takibi (versiyon sistemi)
6. H bloğu — 2D önizleme (SVG veya image overlay)
