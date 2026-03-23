# KUMAŞ & ARŞİV SAYFASI ANALİZİ
> Tarih: 17 Mart 2026 | Kaynak: Kullanıcı Analizi + Mühendis Notları

---

## KULLANICI SÖYLÜYOR

"Kumaş aksesuar arşiv burda kumaş kartelalarının da aksesuar kartelalarının da malzeme kartelalarının da olması ve görsel fotoğrafları da olması lazım. Bu kumaş, aksesuar, malzeme, taş, boncuk, inci — bunların tasarım yaparken görsellerini sistemden olması lazım, bulabilmek lazım, dijital olması lazım."

---

## MEVCUT DURUM

- Sayfa doğru konumda
- Ama şu an: sadece boş depo ekranı
- Veri yok → arşiv işlevi yok

---

## SENİN DEDİĞİN DOĞRU (KESİN)

Bu sayfa sadece stok değil:
→ **DİJİTAL MALZEME KÜTÜPHANESİ** olmalı

---

## OLMASI ZORUNLU ANA YAPI

### A) KATEGORİLER
- Kumaş
- Aksesuar
- Taş / inci / düğme
- Baskı / desen
- Özel malzeme
→ Tek listede değil, **kategori bazlı sistem**

### B) HER MALZEME KARTI (KRİTİK)
Her kayıtta:
- Fotoğraf (yüksek çözünürlük)
- Video (opsiyonel)
- Kod · İsim · Tür
- Renk varyantları
- Kumaş içeriği (% pamuk vs)
- Tedarikçi · Fiyat · Stok
- Kullanıldığı ürünler
→ Bu olmazsa: **tasarımda kullanılamaz**

### C) GÖRSEL ARŞİV (EN KRİTİK)
- Grid görünüm (Pinterest gibi)
- Sadece görsele bakarak seçim
- Hover → detay
→ **Tasarımcı buradan seçmeli**

### D) ARAMA SİSTEMİ
- "kırmızı pamuk" yaz → bulmalı
- "ince kumaş" → bulmalı
- "düğme altın" → bulmalı
→ Text + etiket + renk filtresi

### E) FİLTRELER
- Tür (kumaş/aksesuar) · Renk · Fiyat · Stok durumu · Tedarikçi
→ Filtre yoksa sistem kullanılmaz

### F) TASARIM ENTEGRASYONU (ÇOK KRİTİK)
- Seçilen kumaşı → modele gönder
- Seçilen aksesuar → ürüne ekle
→ Bu sayfa: **modelhane ile bağlı olmalı**

### G) KARTELA SİSTEMİ
- Aynı kumaşın varyantları tek grup (renkler birlikte)
→ dağınık veri olmaz

### H) FAVORİ / KULLANIM TAKİBİ
- En çok kullanılan kumaş · Son kullanılan
→ hız kazandırır

### I) ÖLÜ STOK / FIRSAT KUMAŞ RADARI (UPCYCLE) [YENİ]
- **Ayrı Bir Alt Bölüm:** Normal stoklardan bağımsız, "Fırsat/Ölü Stok" sekmesi
- **Girdi:** Kumaş fotoğrafı, Top/Kg miktarı, Ucuz maliyet fiyatı, Kondisyonu (örn: beklemiş)
- **AI Analizi:** Görsel taranır (Vision AI) → M1'deki (Trendyol/Piyasa) güncel abiye trendleriyle çarpıştırılır
- **Çıktı:** Sistem "Bu ucuz kumaşı şu anki en trend 'Tek Omuzlu Şifon' kalıbımızla yaparsak kâr marjı %85 olur" der.
→ Yeni abiye serileri için **0 Risk + Maksimum Kâr** motoru.

---

## EKSİKLER (NET)

❌ Görsel yok
❌ Malzeme detayı yok
❌ Arama zayıf
❌ Tasarım bağlantısı yok
❌ Kartela mantığı yok

---

## DÜNYA STANDARDI REFERANS

Bu sayfa = birleşimi:
**CLO 3D fabric library + Adobe asset library + Pinterest board + ERP stok sistemi**

---

## KRİTİK KARAR

Bu sayfa: "stok listesi" olamaz
Olması gereken: **Tasarım + üretim ortak hafızası**

---

## KESİN SONUÇ

✔ Senin düşünce doğru
✔ Dijital kartela zorunlu

Eksik olan: görsel + arama + entegrasyon

**NET HÜKÜM:**
Bu sayfa doğru yapılırsa: tasarım hızlanır → hata azalır → tekrar kullanım artar
Yanlış yapılırsa: kimse kullanmaz → sistem ölür

---

## VERİTABANI ŞEMASI (Yeni Tablo Gerekli)

```sql
b2_malzeme_katalogu (
    id UUID PRIMARY KEY,
    kategori TEXT,          -- kumas / aksesuar / tas / baski / ozel
    alt_kategori TEXT,
    ad TEXT NOT NULL,
    kod TEXT UNIQUE,        -- KMS-001-KIRMIZI

    -- Görsel
    fotograf_urls TEXT[],   -- Supabase Storage URL'leri
    video_url TEXT,

    -- Özellikler
    icerik_yuzdesi JSONB,   -- {"pamuk": 80, "polyester": 20}
    renk TEXT,
    renk_kodu TEXT,         -- hex veya Pantone
    renk_varyantlari JSONB,

    -- Kaynak
    tedarikci TEXT,
    fiyat NUMERIC,
    stok_miktar NUMERIC,
    stok_birimi TEXT,       -- metre / adet / kg

    -- Bağlantı
    kullanildigi_urunler TEXT[],
    etiketler TEXT[],

    -- Ölü Stok / Fırsat Kumaş (Upcycle) Özellikleri
    is_firsat BOOLEAN DEFAULT false,
    kondisyon_notu TEXT,    -- "2 yıllık şifon, sorunsuz"
    ai_trend_eslesme JSONB, -- AI'ın önerdiği geçmiş/piyasa trend modeli

    created_at TIMESTAMPTZ DEFAULT now()
);
```

## UYGULAMA ÖNCELİK SIRASI

1. Supabase Storage bucket → `malzeme-gorselleri` (public read)
2. `b2_malzeme_katalogu` tablo + RLS
3. Fotoğraf yükleme UI (drag-drop)
4. Grid görünüm (masonry layout)
5. Arama motoru (full-text search)
6. Filtre paneli
7. Modelhane entegrasyonu (kumaş seç → modele aktar)
