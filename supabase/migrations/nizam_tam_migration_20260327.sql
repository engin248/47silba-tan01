-- ============================================================
-- NİZAM / THE ORDER — TAM MİGRASYON SQL
-- Tarih: 27 Mart 2026
-- Kapsam:
--   1. Eksik tablolar (12 adet)
--   2. Eksik kolonlar (mevcut tablolara ALTER TABLE)
--   3. Yanlış fazdaki tablolar (tespit + öneri)
-- UYGULAMA: Supabase Dashboard → SQL Editor → Bu dosyayı yapıştır
-- ÖNEMLİ: IF NOT EXISTS kullanıldı — güvenli, var olanı bozmaz
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- BÖLÜM 1 — EKSİK TABLOLAR (12 adet oluştur)
-- ════════════════════════════════════════════════════════════

-- ─── 1.1 bot_tracking_logs ───────────────────────────────────
-- Kullanan: sentinel.js, sentinel_kalkan.js, worker.js
-- Amaç: Scraper bot pipeline takibi (ajanlardan AYRI)
CREATE TABLE IF NOT EXISTS public.bot_tracking_logs (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id          TEXT NOT NULL,
    ajan_adi        TEXT NOT NULL,
    hedef_kavram    TEXT,
    ilerleme_yuzdesi INTEGER DEFAULT 0 CHECK (ilerleme_yuzdesi BETWEEN 0 AND 100),
    durum           TEXT DEFAULT 'calisıyor'
                    CHECK (durum IN ('calisıyor', 'tamamlandi', 'hata', 'iptal', 'zaman_asimi')),
    son_mesaj       TEXT,
    hata_mesaji     TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bot_logs_job_id ON public.bot_tracking_logs (job_id);
CREATE INDEX IF NOT EXISTS idx_bot_logs_durum  ON public.bot_tracking_logs (durum);
ALTER TABLE public.bot_tracking_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.bot_tracking_logs
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "authenticated_select" ON public.bot_tracking_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- ─── 1.2 m2_finans_veto ──────────────────────────────────────
-- Kullanan: src/lib/m2_kar_kilidi.js + arge_ajanlari/m2_finans_kar_ajani.js
-- Amaç: M2 finansal kilit kararı (tek tablo — m2_finansal_kilit kaldırıldı)
CREATE TABLE IF NOT EXISTS public.m2_finans_veto (
    id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    urun_adi                TEXT NOT NULL,
    ai_satis_karari         TEXT,
    hermania_karar_yorumu   TEXT,
    finans_karari           TEXT DEFAULT 'BEKLIYOR'
                            CHECK (finans_karari IN ('KÂRLI_ÜRET', 'ZARAR_EDER_ÜRETME', 'BEKLIYOR')),
    tahmini_maliyet_tl      NUMERIC,
    tahmini_kar_tl          NUMERIC,
    kar_marji_yuzdesi       NUMERIC,
    veto_sebebi             TEXT,
    created_at              TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.m2_finans_veto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.m2_finans_veto
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "authenticated_select" ON public.m2_finans_veto
    FOR SELECT USING (auth.role() = 'authenticated');

-- ─── 1.3 b0_telegram_log ─────────────────────────────────────
-- Kullanan: src/app/api/telegram-webhook/route.js
-- Amaç: Telegram gelen mesaj/komut logu
CREATE TABLE IF NOT EXISTS public.b0_telegram_log (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id     TEXT,
    komut       TEXT,
    detay       TEXT,
    sonuc       TEXT,
    tarih       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.b0_telegram_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.b0_telegram_log
    FOR ALL USING (auth.role() = 'service_role');

-- ─── 1.4 b0_ajan_loglari ─────────────────────────────────────
-- Kullanan: bazı API route'lar
-- Amaç: Ajan işlem logu (b1_agent_loglari'ndan daha hafif)
CREATE TABLE IF NOT EXISTS public.b0_ajan_loglari (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ajan_adi    TEXT,
    durum       TEXT DEFAULT 'baslatildi',
    mesaj       TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.b0_ajan_loglari ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.b0_ajan_loglari
    FOR ALL USING (auth.role() = 'service_role');

-- ─── 1.5 b1_stok (stok durumu) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_stok (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stok_id         UUID,
    urun_id         UUID,
    hareket_tipi    TEXT CHECK (hareket_tipi IN ('giris', 'cikis', 'sayim', 'transfer')),
    adet            NUMERIC DEFAULT 0,
    kullanici_adi   TEXT,
    aciklama        TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.b1_stok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.b1_stok
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "authenticated_select" ON public.b1_stok
    FOR SELECT USING (auth.role() = 'authenticated');

-- ─── 1.6 b1_stok_hareketleri ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_stok_hareketleri (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    urun_id         UUID,
    hareket_tipi    TEXT,
    adet            NUMERIC DEFAULT 0,
    aciklama        TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.b1_stok_hareketleri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.b1_stok_hareketleri
    FOR ALL USING (auth.role() = 'service_role');

-- ─── 1.7 b1_is_emirleri ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_is_emirleri (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_adi   TEXT,
    durum       TEXT DEFAULT 'bekliyor'
                CHECK (durum IN ('bekliyor', 'devam', 'tamamlandi', 'iptal')),
    adet        INTEGER,
    baslangic   TIMESTAMPTZ,
    bitis       TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.b1_is_emirleri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.b1_is_emirleri
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "authenticated_select" ON public.b1_is_emirleri
    FOR SELECT USING (auth.role() = 'authenticated');

-- ─── 1.8 b1_kumas_arsiv ──────────────────────────────────────
-- NOT: b1_kumas_arsivi (ile) var — bu farklı (arsiv vs arsivi)
CREATE TABLE IF NOT EXISTS public.b1_kumas_arsiv (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kumas_adi   TEXT,
    model_id    UUID,
    uyari_tipi  TEXT,
    seviye      TEXT,
    aciklama    TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.b1_kumas_arsiv ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.b1_kumas_arsiv
    FOR ALL USING (auth.role() = 'service_role');

-- ─── 1.9 b1_maliyet_kalemleri ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_maliyet_kalemleri (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id            UUID,
    maliyet_tipi        TEXT,
    kalem_aciklama      TEXT,
    toplam_maliyet      NUMERIC,
    platform            TEXT,
    kategori            TEXT,
    talep_skoru         INTEGER,
    created_at          TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.b1_maliyet_kalemleri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.b1_maliyet_kalemleri
    FOR ALL USING (auth.role() = 'service_role');

-- ─── 1.10 b2_muhasebe ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b2_muhasebe (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kullanici_adi   TEXT,
    islem_tipi      TEXT,
    tutar_tl        NUMERIC,
    aciklama        TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.b2_muhasebe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.b2_muhasebe
    FOR ALL USING (auth.role() = 'service_role');

-- ─── 1.11 b2_personel_devam ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b2_personel_devam (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    personel_id     UUID,
    tarih           DATE DEFAULT CURRENT_DATE,
    giris_saati     TIMESTAMPTZ,
    cikis_saati     TIMESTAMPTZ,
    durum           TEXT DEFAULT 'present',
    created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.b2_personel_devam ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.b2_personel_devam
    FOR ALL USING (auth.role() = 'service_role');

-- ─── 1.12 teknik_foyler (Storage bucket ama tablo da lazım) ──
-- NOT: teknik-foyler Supabase Storage bucket'ı. Tablo DEĞİL.
-- telegram-webhook route.js storage.from('teknik-foyler') kullanıyor
-- Bucket Supabase Dashboard > Storage > "teknik-foyler" adıyla oluşturulmalı
-- Bu bir SQL değil, dashboard işlemi. Sadece kayıt:
-- CREATE BUCKET IF NOT EXISTS teknik-foyler (PUBLIC: false)


-- ════════════════════════════════════════════════════════════
-- BÖLÜM 2 — EKSİK KOLONLAR (mevcut tablolara ekle)
-- ════════════════════════════════════════════════════════════

-- ─── 2.1 b1_agent_loglari ────────────────────────────────────
ALTER TABLE public.b1_agent_loglari
    ADD COLUMN IF NOT EXISTS durum       TEXT DEFAULT 'calisıyor',
    ADD COLUMN IF NOT EXISTS gorev_tipi  TEXT,
    ADD COLUMN IF NOT EXISTS oncelik     TEXT DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS bitis_tarihi TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sonuc_ozeti TEXT;

-- ─── 2.2 b1_arge_products ────────────────────────────────────
ALTER TABLE public.b1_arge_products
    ADD COLUMN IF NOT EXISTS nizam_decision    TEXT,
    ADD COLUMN IF NOT EXISTS boss_approved     BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS opportunity_score NUMERIC,
    ADD COLUMN IF NOT EXISTS risk_level        TEXT,
    ADD COLUMN IF NOT EXISTS supply_risk       TEXT,
    ADD COLUMN IF NOT EXISTS time_risk         TEXT,
    ADD COLUMN IF NOT EXISTS estimated_profit  NUMERIC,
    ADD COLUMN IF NOT EXISTS outsource_cost    NUMERIC,
    ADD COLUMN IF NOT EXISTS agent_note        TEXT,
    ADD COLUMN IF NOT EXISTS reason            TEXT;

-- ─── 2.3 b1_arge_strategy ────────────────────────────────────
ALTER TABLE public.b1_arge_strategy
    ADD COLUMN IF NOT EXISTS nizam_decision  TEXT,
    ADD COLUMN IF NOT EXISTS islenen_durum   TEXT DEFAULT 'bekliyor'
                             CHECK (islenen_durum IN ('bekliyor','islendi','mock_islendi','hata')),
    ADD COLUMN IF NOT EXISTS boss_approved   BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS isleyen_ajan    TEXT,
    ADD COLUMN IF NOT EXISTS islendigi_tarih TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS veri_kaynagi    TEXT DEFAULT 'GERCEK';

-- ─── 2.4 b1_ai_is_kuyrugu ────────────────────────────────────
ALTER TABLE public.b1_ai_is_kuyrugu
    ADD COLUMN IF NOT EXISTS product_name      TEXT,
    ADD COLUMN IF NOT EXISTS nizam_decision    TEXT,
    ADD COLUMN IF NOT EXISTS boss_approved     BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS estimated_profit  NUMERIC,
    ADD COLUMN IF NOT EXISTS opportunity_score NUMERIC,
    ADD COLUMN IF NOT EXISTS risk_level        TEXT,
    ADD COLUMN IF NOT EXISTS agent_note        TEXT,
    ADD COLUMN IF NOT EXISTS hata              TEXT;

-- ─── 2.5 b1_arge_trend_data ──────────────────────────────────
ALTER TABLE public.b1_arge_trend_data
    ADD COLUMN IF NOT EXISTS social_media_impact TEXT,
    ADD COLUMN IF NOT EXISTS season_fit          TEXT;

-- ─── 2.6 b1_arge_cost_analysis ───────────────────────────────
ALTER TABLE public.b1_arge_cost_analysis
    ADD COLUMN IF NOT EXISTS estimated_fabric_cost  NUMERIC,
    ADD COLUMN IF NOT EXISTS estimated_labor_cost   NUMERIC,
    ADD COLUMN IF NOT EXISTS fabric_type_prediction TEXT,
    ADD COLUMN IF NOT EXISTS labor_difficulty       TEXT;

-- ─── 2.7 b1_arge_risk_analysis ───────────────────────────────
ALTER TABLE public.b1_arge_risk_analysis
    ADD COLUMN IF NOT EXISTS supply_risk_score     NUMERIC,
    ADD COLUMN IF NOT EXISTS production_risk_score NUMERIC;

-- ─── 2.8 camera_events ───────────────────────────────────────
ALTER TABLE public.camera_events
    ADD COLUMN IF NOT EXISTS kamera_adi TEXT,
    ADD COLUMN IF NOT EXISTS uyari      TEXT;

-- ─── 2.9 b1_sistem_uyarilari ─────────────────────────────────
ALTER TABLE public.b1_sistem_uyarilari
    ADD COLUMN IF NOT EXISTS tip       TEXT,
    ADD COLUMN IF NOT EXISTS aciklama  TEXT,
    ADD COLUMN IF NOT EXISTS neden     TEXT,
    ADD COLUMN IF NOT EXISTS potansiyel_zarar TEXT;

-- ─── 2.10 b1_personel_performans ─────────────────────────────
ALTER TABLE public.b1_personel_performans
    ADD COLUMN IF NOT EXISTS isletmeye_katilan_deger NUMERIC,
    ADD COLUMN IF NOT EXISTS kazanilan_prim          NUMERIC;

-- ─── 2.11 b1_arge_trendler ───────────────────────────────────
ALTER TABLE public.b1_arge_trendler
    ADD COLUMN IF NOT EXISTS trend_skoru   NUMERIC,
    ADD COLUMN IF NOT EXISTS artis_yuzdesi NUMERIC;


-- ════════════════════════════════════════════════════════════
-- BÖLÜM 3 — YANLIŞ FAZDAKİLER (Tespit — SQL ile çözüm önerisi)
-- ════════════════════════════════════════════════════════════

-- ⚠️ Bu bölümdeki tablolar MEVCUT ve veri İÇEREBİLİR.
-- Silme veya rename yapmıyoruz — sadece tespit.

-- SORUN 1: b1_kasa_hareketleri → B2 katmanında olmalı (finansal veri)
-- Kod b2_kasa_hareketleri kullanıyor, b1_kasa_hareketleri kullanılmıyor.
-- Aksiyon: İçi boşsa → kaldır. Doluysa → b2_kasa_hareketleri ile birleştir.
-- SELECT COUNT(*) FROM b1_kasa_hareketleri; -- önce kontrol et

-- SORUN 2: sistem_ayarlari → b0_ prefix'i yok, b0_sistem_ayarlari olmalı
-- Kod b1_sistem_ayarlari kullanıyor, sistem_ayarlari kullanılmıyor.
-- Aksiyon: İçi boşsa → kaldır.
-- SELECT COUNT(*) FROM sistem_ayarlari;

-- SORUN 3: b2_personel → b1_personel ile çakışıyor
-- Kod b1_personel kullanıyor. b2_personel Lumora kalıntısı.
-- Aksiyon: İçi boşsa → kaldır.
-- SELECT COUNT(*) FROM b2_personel;


-- ════════════════════════════════════════════════════════════
-- BÖLÜM 4 — DOĞRULAMA SORGULARI
-- ════════════════════════════════════════════════════════════
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c
     WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS kolon_sayisi
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'bot_tracking_logs', 'm2_finans_veto', 'b0_telegram_log',
    'b0_ajan_loglari', 'b1_stok', 'b1_stok_hareketleri',
    'b1_is_emirleri', 'b1_kumas_arsiv', 'b1_maliyet_kalemleri',
    'b2_muhasebe', 'b2_personel_devam'
  )
ORDER BY table_name;

-- Yanlış faz sayımları:
SELECT 'b1_kasa_hareketleri' as tablo, COUNT(*) as kayit_sayisi FROM b1_kasa_hareketleri
UNION ALL
SELECT 'sistem_ayarlari', COUNT(*) FROM sistem_ayarlari  
UNION ALL
SELECT 'b2_personel', COUNT(*) FROM b2_personel;
