-- ═══════════════════════════════════════════════════════════════════
-- M4 İMALAT + M6 ÜRETİM BANDI — v2 TABLO KURULUM SQL'İ
-- Hazırlayan: Antigravity AI | 14 Mart 2026
--
-- NASIL KULLANILIR:
--   Supabase Dashboard → SQL Editor → Bu dosyayı aç → Run
--
-- KONTROL: Bu tablolar daha önce hiç oluşturulmamıştı.
--           Tüm .sql dosyaları tarandı, v2_ tablosu bulunamadı.
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. v2_users — Üretim bandındaki işçiler / personel
--    Kullanım: ImalatMainContainer.js satır 206
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_users (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   text NOT NULL,
    email       text,
    role        text DEFAULT 'worker',
    fp_yield    numeric(5,4) DEFAULT 1.0,
    social_points integer DEFAULT 0,
    aktif       boolean DEFAULT true,
    created_at  timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────────────
-- 2. v2_models — Teknik föyler (Firma'dan gelen modeller)
--    Kullanım: ImalatMainContainer.js satır 91, 106, 114
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_models (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name       text NOT NULL,
    description      text,
    difficulty_score numeric(3,1) DEFAULT 5.0,
    material_cost    numeric(12,2) DEFAULT 0,
    created_at       timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────────────
-- 3. v2_production_orders — Üretim siparişleri
--    Kullanım: ImalatMainContainer.js satır 156, 165
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_production_orders (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code   text NOT NULL,
    model_id     uuid REFERENCES public.v2_models(id) ON DELETE SET NULL,
    quantity     integer DEFAULT 0,
    status       text DEFAULT 'pending'
                 CHECK (status IN ('pending','in_progress','completed','cancelled')),
    created_at   timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────────────
-- 4. v2_production_steps — Üretim adımları (Fasona gidecek iş sırası)
--    Kullanım: ImalatMainContainer.js satır 171
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_production_steps (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    step_name                   text NOT NULL,
    estimated_duration_minutes  integer DEFAULT 30,
    created_at                  timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────────────
-- 5. v2_model_workflows — Modele ait iş akışı sıralaması
--    Kullanım: ImalatMainContainer.js satır 175
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_model_workflows (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id    uuid REFERENCES public.v2_models(id) ON DELETE CASCADE,
    step_id     uuid REFERENCES public.v2_production_steps(id) ON DELETE CASCADE,
    step_order  integer DEFAULT 1,
    created_at  timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────────────
-- 6. v2_order_production_steps — ANA BANT TAKİP TABLOSU
--    Kullanım: ImalatMainContainer.js satır 64, 179, 198, 216, 229, 242, 254, 264, 281
--    Bu tablo yoktu → M6 tamamen çöküyordu
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_order_production_steps (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            uuid REFERENCES public.v2_production_orders(id) ON DELETE CASCADE,
    model_workflow_id   uuid REFERENCES public.v2_model_workflows(id) ON DELETE SET NULL,
    worker_id           uuid REFERENCES public.v2_users(id) ON DELETE SET NULL,
    status              text DEFAULT 'assigned'
                        CHECK (status IN ('assigned','in_progress','waiting_for_proof','completed','blocked_machine')),
    start_time          timestamptz,
    end_time            timestamptz,
    rework_count        integer DEFAULT 0,
    fp_yield            numeric(5,4) DEFAULT 1.0,
    created_at          timestamptz DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════
-- GÜVENLİK: Row Level Security (RLS) Politikaları
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.v2_users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_models                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_production_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_production_steps         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_model_workflows          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_order_production_steps   ENABLE ROW LEVEL SECURITY;

-- Okuma politikaları
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_users' AND policyname='v2_users_okur') THEN
    CREATE POLICY v2_users_okur ON public.v2_users FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_models' AND policyname='v2_models_okur') THEN
    CREATE POLICY v2_models_okur ON public.v2_models FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_production_orders' AND policyname='v2_prod_orders_okur') THEN
    CREATE POLICY v2_prod_orders_okur ON public.v2_production_orders FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_production_steps' AND policyname='v2_prod_steps_okur') THEN
    CREATE POLICY v2_prod_steps_okur ON public.v2_production_steps FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_model_workflows' AND policyname='v2_workflows_okur') THEN
    CREATE POLICY v2_workflows_okur ON public.v2_model_workflows FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_order_production_steps' AND policyname='v2_ops_okur') THEN
    CREATE POLICY v2_ops_okur ON public.v2_order_production_steps FOR SELECT USING (true);
  END IF;
END $$;

-- Yazma politikaları
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_users' AND policyname='v2_users_yazar') THEN
    CREATE POLICY v2_users_yazar ON public.v2_users FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_models' AND policyname='v2_models_yazar') THEN
    CREATE POLICY v2_models_yazar ON public.v2_models FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_production_orders' AND policyname='v2_prod_orders_yazar') THEN
    CREATE POLICY v2_prod_orders_yazar ON public.v2_production_orders FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_production_steps' AND policyname='v2_prod_steps_yazar') THEN
    CREATE POLICY v2_prod_steps_yazar ON public.v2_production_steps FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_model_workflows' AND policyname='v2_workflows_yazar') THEN
    CREATE POLICY v2_workflows_yazar ON public.v2_model_workflows FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_order_production_steps' AND policyname='v2_ops_yazar') THEN
    CREATE POLICY v2_ops_yazar ON public.v2_order_production_steps FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Güncelleme politikaları (bant işlemleri için)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_order_production_steps' AND policyname='v2_ops_gunceller') THEN
    CREATE POLICY v2_ops_gunceller ON public.v2_order_production_steps FOR UPDATE USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='v2_production_orders' AND policyname='v2_prod_orders_gunceller') THEN
    CREATE POLICY v2_prod_orders_gunceller ON public.v2_production_orders FOR UPDATE USING (true);
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════
-- PERFORMANS: Index'ler (Sık kullanılan sorgular için)
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_v2_ops_status ON public.v2_order_production_steps(status);
CREATE INDEX IF NOT EXISTS idx_v2_ops_order_id ON public.v2_order_production_steps(order_id);
CREATE INDEX IF NOT EXISTS idx_v2_prod_orders_model ON public.v2_production_orders(model_id);
CREATE INDEX IF NOT EXISTS idx_v2_prod_orders_status ON public.v2_production_orders(status);


-- ═══════════════════════════════════════════════════════════════════
-- DOĞRULAMA: Başarılı mı?
-- ═══════════════════════════════════════════════════════════════════
SELECT
    table_name,
    'OLUŞTURULDU ✅' as durum
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'v2_users',
      'v2_models',
      'v2_production_orders',
      'v2_production_steps',
      'v2_model_workflows',
      'v2_order_production_steps'
  )
ORDER BY table_name;
