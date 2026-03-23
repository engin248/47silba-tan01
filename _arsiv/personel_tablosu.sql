-- =========================================================
-- PERSONEL TABLOSU — 47 Sil Baştan
-- Supabase SQL Editor'de çalıştırın
-- =========================================================

CREATE TABLE IF NOT EXISTS public.b1_personel (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    personel_kodu       varchar(50) UNIQUE NOT NULL,
    ad_soyad            varchar(200) NOT NULL,
    ad_soyad_ar         varchar(200),
    rol                 varchar(50) NOT NULL DEFAULT 'dikisci'
                        CHECK (rol IN ('dikisci','kesimci','ütücü','paketci','ustabaşı','koordinatör','muhasebeci','depocu')),
    telefon             varchar(20),
    gunluk_calisma_dk   integer NOT NULL DEFAULT 480 CHECK (gunluk_calisma_dk > 0),
    saatlik_ucret_tl    decimal(10,4) NOT NULL DEFAULT 0 CHECK (saatlik_ucret_tl >= 0),
    ise_giris_tarihi    date,
    durum               varchar(20) NOT NULL DEFAULT 'aktif'
                        CHECK (durum IN ('aktif','izinli','cikti')),
    notlar              text,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- Updated_at trigger
CREATE TRIGGER b1_personel_ts
    BEFORE UPDATE ON public.b1_personel
    FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();

-- RLS (Row Level Security) — Herkes okuyabilir
ALTER TABLE public.b1_personel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personel_select" ON public.b1_personel
    FOR SELECT USING (true);

CREATE POLICY "personel_insert" ON public.b1_personel
    FOR INSERT WITH CHECK (true);

CREATE POLICY "personel_update" ON public.b1_personel
    FOR UPDATE USING (true);

CREATE POLICY "personel_delete" ON public.b1_personel
    FOR DELETE USING (true);

-- Doğrulama
SELECT 'b1_personel OLUŞTU ✅' as durum, count(*) as kayit_sayisi
FROM public.b1_personel;
