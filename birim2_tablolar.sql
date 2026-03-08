-- =========================================================================
-- 2. BİRİM TABLOLARI — TEMİZ VERSİYON (users FK YOK)
-- Supabase SQL Editor'de TAMAMINI seçip çalıştırın
-- =========================================================================

-- M14: MÜŞTERİLER (önce — diğerleri buna bağlı)
CREATE TABLE IF NOT EXISTS public.b2_musteriler (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_kodu   varchar(50) UNIQUE NOT NULL,
    ad_soyad       varchar(200) NOT NULL,
    ad_soyad_ar    varchar(200),
    musteri_tipi   varchar(20) NOT NULL DEFAULT 'bireysel'
                   CHECK (musteri_tipi IN ('bireysel','toptan','magaza')),
    telefon        varchar(20),
    email          varchar(100),
    adres          text,
    vergi_no       varchar(20),
    toplam_borc_tl decimal(12,4) NOT NULL DEFAULT 0,
    puan           integer NOT NULL DEFAULT 0,
    aktif          boolean NOT NULL DEFAULT true,
    created_at     timestamptz DEFAULT now(),
    updated_at     timestamptz DEFAULT now()
);

-- M9: ÜRÜN KATALOĞU
CREATE TABLE IF NOT EXISTS public.b2_urun_katalogu (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rapor_id         uuid,
    urun_kodu        varchar(50) UNIQUE NOT NULL,
    urun_adi         varchar(200) NOT NULL,
    urun_adi_ar      varchar(200),
    birim_maliyet_tl decimal(10,4) NOT NULL DEFAULT 0,
    satis_fiyati_tl  decimal(10,4) NOT NULL DEFAULT 0,
    kar_marji_yuzde  decimal(5,2) GENERATED ALWAYS AS (
        CASE WHEN satis_fiyati_tl > 0
        THEN ROUND(((satis_fiyati_tl - birim_maliyet_tl) / satis_fiyati_tl * 100)::numeric, 2)
        ELSE 0 END
    ) STORED,
    bedenler         text[],
    renkler          text[],
    stok_adeti       integer NOT NULL DEFAULT 0,
    min_stok         integer NOT NULL DEFAULT 5,
    satis_kanali     varchar(50) NOT NULL DEFAULT 'magaza'
                     CHECK (satis_kanali IN ('trendyol','amazon','magaza','toptan','diger')),
    durum            varchar(20) NOT NULL DEFAULT 'aktif'
                     CHECK (durum IN ('aktif','pasif','arsiv')),
    created_at       timestamptz DEFAULT now(),
    updated_at       timestamptz DEFAULT now()
);

-- M10: SİPARİŞLER
CREATE TABLE IF NOT EXISTS public.b2_siparisler (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_id      uuid REFERENCES public.b2_musteriler(id),
    siparis_no      varchar(50) UNIQUE NOT NULL,
    kanal           varchar(50) NOT NULL DEFAULT 'magaza'
                    CHECK (kanal IN ('trendyol','amazon','magaza','toptan','diger')),
    toplam_tutar_tl decimal(12,4) NOT NULL DEFAULT 0,
    durum           varchar(30) NOT NULL DEFAULT 'beklemede'
                    CHECK (durum IN ('beklemede','onaylandi','hazirlaniyor','kargoda','teslim','iptal','iade')),
    kargo_takip     varchar(100),
    fatura_no       varchar(50),
    notlar          text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- M10: SİPARİŞ KALEMLERİ
CREATE TABLE IF NOT EXISTS public.b2_siparis_kalemleri (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    siparis_id     uuid NOT NULL REFERENCES public.b2_siparisler(id) ON DELETE CASCADE,
    urun_id        uuid NOT NULL REFERENCES public.b2_urun_katalogu(id),
    beden          varchar(10),
    renk           varchar(50),
    adet           integer NOT NULL CHECK (adet > 0),
    birim_fiyat_tl decimal(10,4) NOT NULL,
    iskonto_pct    decimal(5,2) NOT NULL DEFAULT 0,
    tutar_tl       decimal(12,4) GENERATED ALWAYS AS (
        ROUND((adet * birim_fiyat_tl * (1 - iskonto_pct / 100.0))::numeric, 4)
    ) STORED
);

-- M11: STOK HAREKETLERİ
CREATE TABLE IF NOT EXISTS public.b2_stok_hareketleri (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    urun_id        uuid NOT NULL REFERENCES public.b2_urun_katalogu(id),
    hareket_tipi   varchar(30) NOT NULL
                   CHECK (hareket_tipi IN ('giris','cikis','iade','fire','sayim_duzelt')),
    adet           integer NOT NULL,
    referans_id    uuid,
    referans_tip   varchar(20)
                   CHECK (referans_tip IN ('siparis','uretim','iade','manuel')),
    aciklama       text,
    created_at     timestamptz DEFAULT now()
);

-- M12: KASA HAREKETLERİ
CREATE TABLE IF NOT EXISTS public.b2_kasa_hareketleri (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_id     uuid REFERENCES public.b2_musteriler(id),
    siparis_id     uuid REFERENCES public.b2_siparisler(id),
    hareket_tipi   varchar(30) NOT NULL
                   CHECK (hareket_tipi IN ('tahsilat','iade_odeme','avans','cek','senet')),
    odeme_yontemi  varchar(30) NOT NULL
                   CHECK (odeme_yontemi IN ('nakit','eft','kredi_karti','cek','senet')),
    tutar_tl       decimal(12,4) NOT NULL CHECK (tutar_tl > 0),
    vade_tarihi    date,
    aciklama       text,
    onay_durumu    varchar(20) NOT NULL DEFAULT 'bekliyor'
                   CHECK (onay_durumu IN ('bekliyor','onaylandi','iptal')),
    created_at     timestamptz DEFAULT now()
);

-- =========================================================================
-- UPDATED_AT TRİGGERLAR
-- =========================================================================
CREATE TRIGGER b2_musteriler_ts
    BEFORE UPDATE ON public.b2_musteriler
    FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();

CREATE TRIGGER b2_urun_katalogu_ts
    BEFORE UPDATE ON public.b2_urun_katalogu
    FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();

CREATE TRIGGER b2_siparisler_ts
    BEFORE UPDATE ON public.b2_siparisler
    FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();

-- =========================================================================
-- AJAN: STOK BEKÇİSİ (Ürün stoku min altına düşerse kritik alarm)
-- =========================================================================
CREATE OR REPLACE FUNCTION fn_b2_stok_alarm()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stok_adeti < NEW.min_stok THEN
        INSERT INTO public.b1_sistem_uyarilari
            (uyari_tipi, seviye, baslik, baslik_ar, mesaj, kaynak_tablo, kaynak_id)
        VALUES (
            'dusuk_stok', 'kritik',
            'KRİTİK: Mağaza Stoğu Düştü — ' || NEW.urun_adi,
            'حرج: انخفض مخزون المتجر — ' || COALESCE(NEW.urun_adi_ar, NEW.urun_adi),
            'Mağaza stoğu: ' || NEW.stok_adeti || ' adet | Min: ' || NEW.min_stok || ' adet',
            'b2_urun_katalogu', NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_b2_stok_alarm
    AFTER INSERT OR UPDATE ON public.b2_urun_katalogu
    FOR EACH ROW EXECUTE FUNCTION fn_b2_stok_alarm();

-- =========================================================================
-- AJAN: SİPARİŞ ROBOTU (Sipariş onaylandığında log)
-- =========================================================================
CREATE OR REPLACE FUNCTION fn_b2_siparis_onay()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.durum = 'onaylandi' AND OLD.durum != 'onaylandi' THEN
        INSERT INTO public.b1_agent_loglari
            (ajan_adi, islem_tipi, kaynak_tablo, kaynak_id, sonuc, mesaj)
        VALUES (
            'Siparis Robotu', 'siparis_onay_sinyali',
            'b2_siparisler', NEW.id, 'basarili',
            'Sipariş #' || NEW.siparis_no || ' onaylandı. Stok düşümü ve sevkiyat planı başlatılıyor.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_b2_siparis_onay
    AFTER UPDATE ON public.b2_siparisler
    FOR EACH ROW EXECUTE FUNCTION fn_b2_siparis_onay();

-- =========================================================================
-- DOĞRULAMA: Tablolar oluştu mu?
-- =========================================================================
SELECT table_name, 'OLUŞTU ✅' as durum
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'b2%'
ORDER BY table_name;
