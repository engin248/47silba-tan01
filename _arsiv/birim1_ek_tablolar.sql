-- =========================================================================
-- M1: AR-GE & TREND ARAŞTIRMASI TABLOSU
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_arge_trendler (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik          varchar(200) NOT NULL,
    baslik_ar       varchar(200),
    platform        varchar(50) NOT NULL CHECK (platform IN ('trendyol','amazon','instagram','pinterest','diger')),
    kategori        varchar(100) NOT NULL,
    talep_skoru     integer NOT NULL DEFAULT 5 CHECK (talep_skoru >= 1 AND talep_skoru <= 10),
    referans_linkler text[],
    gorsel_url      text,
    aciklama        text,
    aciklama_ar     text,
    durum           varchar(30) NOT NULL DEFAULT 'inceleniyor' CHECK (durum IN ('inceleniyor','onaylandi','iptal')),
    olusturan_id    uuid REFERENCES public.users(id),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- =========================================================================
-- M2: KUMAŞ ARŞİVİ (DİJİTAL KARTELA)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_kumas_arsivi (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kumas_kodu          varchar(50) UNIQUE NOT NULL,
    kumas_adi           varchar(200) NOT NULL,
    kumas_adi_ar        varchar(200),
    kumas_tipi          varchar(50) NOT NULL CHECK (kumas_tipi IN ('dokuma','orgu','denim','keten','ipek','sentetik','pamuk','keten','polar','diger')),
    kompozisyon         varchar(200),
    birim_maliyet_tl    decimal(10,4) NOT NULL DEFAULT 0,
    genislik_cm         decimal(6,2),
    gramaj_gsm          decimal(6,2),
    esneme_payi_yuzde   decimal(5,2) NOT NULL DEFAULT 0,
    renkler             text[],
    fotograf_url        text,
    tedarikci_adi       varchar(200),
    stok_mt             decimal(10,2) NOT NULL DEFAULT 0,
    min_stok_mt         decimal(10,2) NOT NULL DEFAULT 10,
    aktif               boolean NOT NULL DEFAULT true,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- =========================================================================
-- M2: AKSESUAR ARŞİVİ
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_aksesuar_arsivi (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aksesuar_kodu   varchar(50) UNIQUE NOT NULL,
    aksesuar_adi    varchar(200) NOT NULL,
    aksesuar_adi_ar varchar(200),
    tip             varchar(50) NOT NULL CHECK (tip IN ('dugme','fermuar','iplik','etiket','baskı','nakis','lastik','biye','diger')),
    birim           varchar(20) NOT NULL CHECK (birim IN ('adet','metre','kg','litre')),
    birim_maliyet_tl decimal(10,4) NOT NULL DEFAULT 0,
    stok_adet       decimal(10,2) NOT NULL DEFAULT 0,
    min_stok        decimal(10,2) NOT NULL DEFAULT 100,
    fotograf_url    text,
    tedarikci_adi   varchar(200),
    aktif           boolean NOT NULL DEFAULT true,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- =========================================================================
-- M3: MODEL TASLAKLARI (TREND → MODEL)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_model_taslaklari (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_kodu      varchar(50) UNIQUE NOT NULL,
    model_adi       varchar(200) NOT NULL,
    model_adi_ar    varchar(200),
    trend_id        uuid REFERENCES public.b1_arge_trendler(id),
    hedef_kitle     varchar(50) CHECK (hedef_kitle IN ('kadin','erkek','cocuk','unisex')),
    sezon           varchar(20) CHECK (sezon IN ('ilkbahar','yaz','sonbahar','kis','4mevsim')),
    durum           varchar(30) NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak','kumas_secildi','kalip_hazir','numune_onay_bekliyor','üretime_hazir','iptal')),
    tasarimci_id    uuid REFERENCES public.users(id),
    aciklama        text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- =========================================================================
-- M3: MODEL MALZEME LİSTESİ (HANGİ MODEL HANGİ KUMAŞI KULLANIR)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_model_malzeme_listesi (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        uuid NOT NULL REFERENCES public.b1_model_taslaklari(id) ON DELETE CASCADE,
    kumas_id        uuid REFERENCES public.b1_kumas_arsivi(id),
    aksesuar_id     uuid REFERENCES public.b1_aksesuar_arsivi(id),
    miktar          decimal(10,4) NOT NULL,
    birim           varchar(20) NOT NULL,
    notlar          text,
    created_at      timestamptz DEFAULT now(),
    CONSTRAINT chk_malzeme CHECK (kumas_id IS NOT NULL OR aksesuar_id IS NOT NULL)
);

-- =========================================================================
-- M3: KALIP VE SERİLEME
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_model_kaliplari (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id            uuid NOT NULL REFERENCES public.b1_model_taslaklari(id) ON DELETE CASCADE,
    kalip_adi           varchar(200) NOT NULL,
    bedenler            text[] NOT NULL DEFAULT '{"S","M","L","XL"}',
    pastal_boyu_cm      decimal(8,2),
    pastal_eni_cm       decimal(8,2),
    fire_orani_yuzde    decimal(5,2) NOT NULL DEFAULT 5,
    kalip_dosya_url     text,
    versiyon            varchar(20) NOT NULL DEFAULT 'v1.0',
    olusturan_id        uuid REFERENCES public.users(id),
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- =========================================================================
-- M4: MODELHANE - NUMUNE ÜRETİMİ
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_numune_uretimleri (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id            uuid NOT NULL REFERENCES public.b1_model_taslaklari(id),
    kalip_id            uuid REFERENCES public.b1_model_kaliplari(id),
    numune_beden        varchar(10) NOT NULL,
    dikim_tarihi        timestamptz,
    diken_id            uuid REFERENCES public.users(id),
    onay_durumu         varchar(30) NOT NULL DEFAULT 'bekliyor' CHECK (onay_durumu IN ('bekliyor','onaylandi','revizyon_gerekli')),
    fotograflar         text[],
    notlar              text,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- =========================================================================
-- M4: DİKİM TALİMATI (FASONA GİDECEK VİDEOLU EMİR - KİLİT NOKTA)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_dikim_talimatlari (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numune_id               uuid NOT NULL UNIQUE REFERENCES public.b1_numune_uretimleri(id),
    talimat_video_url       text,           -- ZORUNLU: Video olmadan fason kilit!
    sesli_aciklama_url      text,
    yazili_adimlari         jsonb NOT NULL DEFAULT '[]',  -- [{adim_no, aciklama, sure_dk}]
    toplam_sure_dk          integer NOT NULL DEFAULT 0,
    olusturan_id            uuid REFERENCES public.users(id),
    aktif                   boolean NOT NULL DEFAULT true,
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now()
);

-- =========================================================================
-- M5: KESİM İŞ EMRİ
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_kesim_is_emirleri (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numune_id               uuid NOT NULL REFERENCES public.b1_numune_uretimleri(id),
    uretilecek_adet         integer NOT NULL CHECK (uretilecek_adet > 0),
    kullanilan_kumas_id     uuid REFERENCES public.b1_kumas_arsivi(id),
    kullanilan_mt           decimal(10,2),
    kesim_tarihi            timestamptz,
    kesim_durumu            varchar(30) NOT NULL DEFAULT 'planlandi' CHECK (kesim_durumu IN ('planlandi','devam_ediyor','tamamlandi')),
    yapan_id                uuid REFERENCES public.users(id),
    notlar                  text,
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now()
);

-- =========================================================================
-- M5: ARA İŞÇİLİK (BASKI, NAKIŞ, YIKAMA VB.)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_ara_is_emirleri (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kesim_emri_id   uuid NOT NULL REFERENCES public.b1_kesim_is_emirleri(id),
    islem_tipi      varchar(50) NOT NULL CHECK (islem_tipi IN ('baski','nakis','yikama','apre','boyama','diger')),
    aciklama        text,
    adet            integer NOT NULL,
    durum           varchar(30) NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor','devam_ediyor','tamamlandi')),
    referans_url    text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- =========================================================================
-- M7: MALİYET KAYITLARI (HER ÜRÜN/PARTİ BAZINDA)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_maliyet_kayitlari (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            uuid REFERENCES public.production_orders(id),
    maliyet_tipi        varchar(50) NOT NULL CHECK (maliyet_tipi IN ('personel_iscilik','isletme_gideri','sarf_malzeme','fire_kaybi')),
    kalem_aciklama      varchar(255),
    tutar_tl            decimal(12,4) NOT NULL DEFAULT 0,
    personel_id         uuid REFERENCES public.users(id),
    durus_id            uuid,
    onay_durumu         varchar(20) NOT NULL DEFAULT 'hesaplandi' CHECK (onay_durumu IN ('hesaplandi','onaylandi')),
    created_at          timestamptz DEFAULT now()
);

-- =========================================================================
-- M8: MUHASEBE & FİNAL RAPORLARI
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_muhasebe_raporlari (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                    uuid NOT NULL REFERENCES public.production_orders(id),
    rapor_tarihi                timestamptz DEFAULT now(),
    hedeflenen_maliyet_tl       decimal(12,4) NOT NULL DEFAULT 0,
    gerceklesen_maliyet_tl      decimal(12,4) NOT NULL DEFAULT 0,
    fark_tl                     decimal(12,4) GENERATED ALWAYS AS (gerceklesen_maliyet_tl - hedeflenen_maliyet_tl) STORED,
    net_uretilen_adet           integer NOT NULL DEFAULT 0,
    zayiat_adet                 integer NOT NULL DEFAULT 0,
    gerceklesen_birim_maliyet   decimal(10,4),
    rapor_durumu                varchar(30) NOT NULL DEFAULT 'taslak' CHECK (rapor_durumu IN ('taslak','sef_onay_bekliyor','onaylandi','kilitlendi')),
    onaylayan_id                uuid REFERENCES public.users(id),
    onay_tarihi                 timestamptz,
    devir_durumu                boolean NOT NULL DEFAULT false,
    created_at                  timestamptz DEFAULT now()
);

-- =========================================================================
-- AJAN İŞLEM LOGLARI (Tüm Agent Hareketlerinin Kaydı)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_agent_loglari (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ajan_adi        varchar(100) NOT NULL,
    islem_tipi      varchar(100) NOT NULL,
    kaynak_tablo    varchar(100),
    kaynak_id       uuid,
    hedef_tablo     varchar(100),
    hedef_id        uuid,
    sonuc           varchar(30) NOT NULL DEFAULT 'basarili' CHECK (sonuc IN ('basarili','hata','uyari')),
    mesaj           text,
    created_at      timestamptz DEFAULT now()
);

-- =========================================================================
-- SİSTEM UYARILARI (Tüm Modüllerin Alarm Merkezi)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_sistem_uyarilari (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    uyari_tipi      varchar(50) NOT NULL CHECK (uyari_tipi IN ('dusuk_stok','liyakat_uyari','maliyet_asimi','fire_yuksek','video_eksik','malzeme_eksik','diger')),
    seviye          varchar(20) NOT NULL DEFAULT 'bilgi' CHECK (seviye IN ('bilgi','uyari','kritik')),
    baslik          varchar(200) NOT NULL,
    baslik_ar       varchar(200),
    mesaj           text,
    kaynak_tablo    varchar(100),
    kaynak_id       uuid,
    durum           varchar(20) NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif','cozuldu','goz_ardi')),
    olusturma       timestamptz DEFAULT now(),
    cozum_tarihi    timestamptz
);

-- =========================================================================
-- UPDATED_AT TRİGGERLARI
-- =========================================================================
CREATE OR REPLACE FUNCTION update_b1_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER b1_arge_trendler_ts BEFORE UPDATE ON public.b1_arge_trendler FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();
CREATE TRIGGER b1_kumas_arsivi_ts BEFORE UPDATE ON public.b1_kumas_arsivi FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();
CREATE TRIGGER b1_aksesuar_arsivi_ts BEFORE UPDATE ON public.b1_aksesuar_arsivi FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();
CREATE TRIGGER b1_model_taslaklari_ts BEFORE UPDATE ON public.b1_model_taslaklari FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();
CREATE TRIGGER b1_model_kaliplari_ts BEFORE UPDATE ON public.b1_model_kaliplari FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();
CREATE TRIGGER b1_numune_uretimleri_ts BEFORE UPDATE ON public.b1_numune_uretimleri FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();
CREATE TRIGGER b1_dikim_talimatlari_ts BEFORE UPDATE ON public.b1_dikim_talimatlari FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();
CREATE TRIGGER b1_kesim_is_emirleri_ts BEFORE UPDATE ON public.b1_kesim_is_emirleri FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();
CREATE TRIGGER b1_ara_is_emirleri_ts BEFORE UPDATE ON public.b1_ara_is_emirleri FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();

-- =========================================================================
-- AJAN FONKSİYONLARI - Trend onaylandığında uyarı oluştur
-- =========================================================================
CREATE OR REPLACE FUNCTION fn_trend_onaylandi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.durum = 'onaylandi' AND OLD.durum != 'onaylandi' THEN
        INSERT INTO public.b1_sistem_uyarilari (uyari_tipi, seviye, baslik, baslik_ar, mesaj, kaynak_tablo, kaynak_id)
        VALUES (
            'diger', 'bilgi',
            'Trend Onaylandı → Kumaş Seçimi Yapılsın',
            'تمت الموافقة على الاتجاه → يرجى اختيار القماش',
            'Trend ID: ' || NEW.id || ' onaylandı. Model taslağı oluşturmak için Kumaş Arşivini açın.',
            'b1_arge_trendler', NEW.id
        );
        INSERT INTO public.b1_agent_loglari (ajan_adi, islem_tipi, kaynak_tablo, kaynak_id, sonuc, mesaj)
        VALUES ('Trend Kâşifi', 'trend_onay_sinyali', 'b1_arge_trendler', NEW.id, 'basarili', 'Sistem uyarısı oluşturuldu.');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trend_onaylandi
AFTER UPDATE ON public.b1_arge_trendler
FOR EACH ROW EXECUTE FUNCTION fn_trend_onaylandi();

-- =========================================================================
-- AJAN FONKSİYONLARI - Video eksikken fason emri engelle
-- =========================================================================
CREATE OR REPLACE FUNCTION fn_video_kontrol()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.talimat_video_url IS NULL OR TRIM(NEW.talimat_video_url) = '' THEN
        INSERT INTO public.b1_sistem_uyarilari (uyari_tipi, seviye, baslik, baslik_ar, mesaj, kaynak_tablo, kaynak_id)
        VALUES (
            'video_eksik', 'kritik',
            'KRİTİK: Video Kanıtı Eksik — Fason Kilidi AKTİF',
            'حرج: دليل الفيديو مفقود — قفل الفاسون نشط',
            'Numune ID: ' || NEW.numune_id || ' için video kanıtı yüklenmeden fason üretim başlatılamaz!',
            'b1_dikim_talimatlari', NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_video_kontrol
BEFORE INSERT OR UPDATE ON public.b1_dikim_talimatlari
FOR EACH ROW EXECUTE FUNCTION fn_video_kontrol();

-- =========================================================================
-- STOK ALARM FONKSİYONU - Kumaş minimum stok altına düşerse uyarı
-- =========================================================================
CREATE OR REPLACE FUNCTION fn_kumas_stok_alarm()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stok_mt < NEW.min_stok_mt THEN
        INSERT INTO public.b1_sistem_uyarilari (uyari_tipi, seviye, baslik, baslik_ar, mesaj, kaynak_tablo, kaynak_id)
        VALUES (
            'dusuk_stok', 'uyari',
            'Düşük Stok Uyarısı: ' || NEW.kumas_adi,
            'تحذير مخزون منخفض: ' || COALESCE(NEW.kumas_adi_ar, NEW.kumas_adi),
            'Mevcut stok: ' || NEW.stok_mt || ' mt | Minimum: ' || NEW.min_stok_mt || ' mt',
            'b1_kumas_arsivi', NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kumas_stok_alarm
AFTER INSERT OR UPDATE ON public.b1_kumas_arsivi
FOR EACH ROW EXECUTE FUNCTION fn_kumas_stok_alarm();

-- =========================================================================
-- SİSTEM AYARLARI (Üretim Anayasası Değişkenleri)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_sistem_ayarlari (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    anahtar     varchar(100) UNIQUE NOT NULL,
    deger       text,
    updated_at  timestamptz DEFAULT now()
);

-- Varsayılan ayar satırı
INSERT INTO public.b1_sistem_ayarlari (anahtar, deger)
VALUES ('sistem_genel', '{"teknik_foy_zorunlu":true,"vidan_hesaplayici":true,"siraladim_adim":true,"aktif_dil":"ar","max_video_sn":15,"goruntu_sikiştirma":"yuksek","dakika_basi_ucret":2.50}')
ON CONFLICT (anahtar) DO NOTHING;

-- =========================================================================
-- GÖREV TAKİP TABLOSU (b1_gorevler)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.b1_gorevler (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik          varchar(300) NOT NULL,
    aciklama        text,
    atanan_kisi     varchar(200),
    son_tarih       timestamptz,
    oncelik         varchar(20) NOT NULL DEFAULT 'normal' CHECK (oncelik IN ('dusuk','normal','yuksek','kritik')),
    durum           varchar(20) NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor','devam','tamamlandi','iptal')),
    modul           varchar(100) DEFAULT 'genel',
    olusturan       varchar(200),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER b1_gorevler_ts BEFORE UPDATE ON public.b1_gorevler FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();
