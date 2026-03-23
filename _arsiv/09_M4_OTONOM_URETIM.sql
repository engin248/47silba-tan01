-- =========================================================================
-- M4 OTONOM ÜRETİM VE PERSONEL PERFORMANS SİSTEMİ BAZ TABLOLARI
-- =========================================================================

-- 1. YENİ TABLO: MAKİNE PARKURU VE ENVANTER
-- (Makinelerin arıza durumunu ve o makineye has operasyonları yönetebilmek için)
CREATE TABLE IF NOT EXISTS public.b1_makineler (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    makine_kodu     varchar(50) UNIQUE NOT NULL,
    makine_adi      varchar(200) NOT NULL,
    makine_tipi     varchar(100) NOT NULL CHECK (makine_tipi IN ('duz_dikim','overlok','recme','punteriz','ilik_dugme','utu','kesim','diger')),
    marka_model     varchar(200),
    durum           varchar(30) NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif','arizali','bakimda','pasif')),
    son_bakim_tarihi timestamptz,
    created_at      timestamptz DEFAULT now()
);

-- İlk kurulumda temel birkaç makine tipi ekleyelim
INSERT INTO public.b1_makineler (makine_kodu, makine_adi, makine_tipi) VALUES
('MAK-001', 'Standart Düz Makine 1', 'duz_dikim'),
('MAK-002', '5 İplik Overlok', 'overlok')
ON CONFLICT (makine_kodu) DO NOTHING;

-- 2. YENİ TABLO: ÜRETİM OPERASYONLARI (REÇETE)
-- Hangi modelin hangi sırayla ve hangi zorlukla dikileceğini belirler
CREATE TABLE IF NOT EXISTS public.b1_uretim_operasyonlari (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id            uuid NOT NULL REFERENCES public.b1_model_taslaklari(id) ON DELETE CASCADE,
    operasyon_adi       varchar(200) NOT NULL,
    makine_id           uuid REFERENCES public.b1_makineler(id),     -- Operasyonun yapılacağı makine tipi
    sira_no             integer NOT NULL,
    zorluk_derecesi     integer NOT NULL DEFAULT 5 CHECK (zorluk_derecesi >= 1 AND zorluk_derecesi <= 10),
    parca_basi_deger_tl decimal(10,4) NOT NULL DEFAULT 0,            -- Bu işleme verilen parça başı ücret
    hedef_sure_dk       decimal(8,2) NOT NULL DEFAULT 0,             -- Ortalama hedeflenen süre (Gerçek veriye göre AI güncelleyecek)
    aktif               boolean NOT NULL DEFAULT true,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- 3. YENİ TABLO: PERSONEL PERFORMANS (SAHA İCRAATI)
-- Personelin ustadan/tabletten başlattığı ve bitirdiği işi izleyen, dijital hakediş tablosu.
CREATE TABLE IF NOT EXISTS public.b1_personel_performans (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    personel_id         uuid NOT NULL REFERENCES public.b1_personel(id),
    operasyon_id        uuid NOT NULL REFERENCES public.b1_uretim_operasyonlari(id),
    order_id            uuid REFERENCES public.production_orders(id),   -- Hangi sipariş için yapılıyor
    is_barkodu          varchar(100),                                   -- Kesimhaneden/Uygulamadan gelen "Toplu İş/Sepet" barkodu
    baslangic_saati     timestamptz NOT NULL DEFAULT now(),
    bitis_saati         timestamptz,
    hedef_adet          integer NOT NULL DEFAULT 1,                     -- GRUP BATCH Mantığı (Örn: Bu sepette 50 ürün var)
    uretilen_adet       integer NOT NULL DEFAULT 0,
    fire_adet           integer NOT NULL DEFAULT 0,                     -- Kalite düşüşünü ölçecek kısım
    hiza_gore_prim_tl   decimal(10,4) DEFAULT 0,                        -- Süre * Parça Değeri vb formüllerle otomatik yazılacak
    kalite_puani        integer DEFAULT 10 CHECK (kalite_puani >= 1 AND kalite_puani <= 10),
    zaman_asimi_durus   boolean NOT NULL DEFAULT false,                 -- Operasyon çok uzarsa Yargıç tarafından kilitlenir
    onay_durumu         varchar(20) NOT NULL DEFAULT 'bekliyor' CHECK (onay_durumu IN ('bekliyor','onaylandi','reddedildi')),
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- 4. MEVCUT TABLO GÜNCELLEMELERİ
-- (b1_personel tablosuna barkod_no eklentisi - güvenlik zırhıyla)
ALTER TABLE IF EXISTS public.b1_personel
ADD COLUMN IF NOT EXISTS "barkod_no" varchar(50) UNIQUE;

-- Timestamps tetikleyicileri
CREATE OR REPLACE FUNCTION update_timestamp_M4()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS b1_uretim_operasyonlari_ts ON public.b1_uretim_operasyonlari;
CREATE TRIGGER b1_uretim_operasyonlari_ts BEFORE UPDATE ON public.b1_uretim_operasyonlari FOR EACH ROW EXECUTE FUNCTION update_timestamp_M4();

DROP TRIGGER IF EXISTS b1_personel_performans_ts ON public.b1_personel_performans;
CREATE TRIGGER b1_personel_performans_ts BEFORE UPDATE ON public.b1_personel_performans FOR EACH ROW EXECUTE FUNCTION update_timestamp_M4();

-- =========================================================================
-- OTONOM GÜVENLİK ZIRHI: ZAMAN AŞIMI VE MÜKERRER İŞ KONTROLÜ
-- =========================================================================
CREATE OR REPLACE FUNCTION fn_kontrol_mukerrer_is()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer personel, aynı anda birden fazla "bitmemiş" iş (bitis_saati NULL) başlatmaya çalışırsa ENGELLENİR
    IF EXISTS (
        SELECT 1 FROM public.b1_personel_performans 
        WHERE personel_id = NEW.personel_id AND bitis_saati IS NULL AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'MÜKERRER İŞ ENGELİ: Personelin devam eden başka bir işi varken yeni kronometre başlatılamaz! (Sahtekarlık Koruması)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mukerrer_is_engeli ON public.b1_personel_performans;
CREATE TRIGGER trg_mukerrer_is_engeli
BEFORE INSERT ON public.b1_personel_performans
FOR EACH ROW EXECUTE FUNCTION fn_kontrol_mukerrer_is();

-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
ALTER TABLE public.b1_makineler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_uretim_operasyonlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_personel_performans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_b1_makineler" ON public.b1_makineler FOR ALL USING (true);
CREATE POLICY "anon_b1_uretim_operasyonlari" ON public.b1_uretim_operasyonlari FOR ALL USING (true);
CREATE POLICY "anon_b1_personel_performans" ON public.b1_personel_performans FOR ALL USING (true);
