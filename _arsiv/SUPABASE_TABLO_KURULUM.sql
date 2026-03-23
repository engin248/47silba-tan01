-- ============================================================
-- 47 SİL BAŞTAN — GÜVENLİ TABLO KURULUM (v2)
-- GENERATED ALWAYS AS kaldırıldı, bağımlılık riski yok
-- ============================================================

-- ── 1. b1_gorevler ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_gorevler (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    baslik      TEXT NOT NULL,
    aciklama    TEXT,
    atanan_kisi TEXT,
    son_tarih   TIMESTAMPTZ,
    oncelik     TEXT DEFAULT 'normal',
    durum       TEXT DEFAULT 'bekliyor',
    modul       TEXT DEFAULT 'genel',
    olusturan   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.b1_gorevler ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gorev_select" ON public.b1_gorevler;
DROP POLICY IF EXISTS "gorev_all" ON public.b1_gorevler;
CREATE POLICY "gorev_select" ON public.b1_gorevler FOR SELECT USING (true);
CREATE POLICY "gorev_all" ON public.b1_gorevler FOR ALL USING (true);

-- ── 2. b1_sistem_uyarilari ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_sistem_uyarilari (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uyari_tipi   TEXT NOT NULL,
    seviye       TEXT DEFAULT 'bilgi',
    baslik       TEXT NOT NULL,
    mesaj        TEXT,
    kaynak_tablo TEXT,
    durum        TEXT DEFAULT 'aktif',
    cozum_tarihi TIMESTAMPTZ,
    olusturma    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.b1_sistem_uyarilari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "uyari_acik" ON public.b1_sistem_uyarilari;
CREATE POLICY "uyari_acik" ON public.b1_sistem_uyarilari FOR ALL USING (true);

-- ── 3. b1_agent_loglari ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_agent_loglari (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ajan_adi   TEXT,
    islem      TEXT,
    sonuc      TEXT,
    hata       TEXT,
    sure_ms    INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.b1_agent_loglari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_acik" ON public.b1_agent_loglari;
CREATE POLICY "agent_acik" ON public.b1_agent_loglari FOR ALL USING (true);

-- ── 4. b1_sistem_ayarlari ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_sistem_ayarlari (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anahtar    TEXT UNIQUE NOT NULL,
    deger      TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.b1_sistem_ayarlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ayar_acik" ON public.b1_sistem_ayarlari;
CREATE POLICY "ayar_acik" ON public.b1_sistem_ayarlari FOR ALL USING (true);

-- ── 5. b1_muhasebe_raporlari ────────────────────────────────
-- NOT: GENERATED ALWAYS AS kaldırıldı, fark_tl uygulama tarafında hesaplanır
CREATE TABLE IF NOT EXISTS public.b1_muhasebe_raporlari (
    id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id               UUID,
    hedeflenen_maliyet_tl  NUMERIC(12,2) DEFAULT 0,
    gerceklesen_maliyet_tl NUMERIC(12,2) DEFAULT 0,
    fark_tl                NUMERIC(12,2) DEFAULT 0,
    net_uretilen_adet      INTEGER DEFAULT 0,
    zayiat_adet            INTEGER DEFAULT 0,
    rapor_durumu           TEXT DEFAULT 'taslak',
    devir_durumu           BOOLEAN DEFAULT false,
    onay_tarihi            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.b1_muhasebe_raporlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "muhasebe_acik" ON public.b1_muhasebe_raporlari;
CREATE POLICY "muhasebe_acik" ON public.b1_muhasebe_raporlari FOR ALL USING (true);

-- ── 6. b1_maliyet_kayitlari ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_maliyet_kayitlari (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id        UUID,
    maliyet_tipi    TEXT,
    kalem_aciklama  TEXT,
    tutar_tl        NUMERIC(12,2) NOT NULL,
    onay_durumu     TEXT DEFAULT 'hesaplandi',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.b1_maliyet_kayitlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maliyet_acik" ON public.b1_maliyet_kayitlari;
CREATE POLICY "maliyet_acik" ON public.b1_maliyet_kayitlari FOR ALL USING (true);

-- ── 7. b2_stok_hareketleri ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b2_stok_hareketleri (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    urun_id       UUID,
    hareket_tipi  TEXT,
    adet          INTEGER NOT NULL DEFAULT 0,
    miktar        INTEGER,
    referans_tip  TEXT DEFAULT 'manuel',
    aciklama      TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.b2_stok_hareketleri ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stok_acik" ON public.b2_stok_hareketleri;
CREATE POLICY "stok_acik" ON public.b2_stok_hareketleri FOR ALL USING (true);

-- ── KONTROL ──────────────────────────────────────────────────
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'b1_gorevler','b1_sistem_uyarilari','b1_agent_loglari',
    'b1_sistem_ayarlari','b1_muhasebe_raporlari',
    'b1_maliyet_kayitlari','b2_stok_hareketleri'
)
ORDER BY table_name;
