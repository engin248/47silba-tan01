-- =========================================================================
-- 47 SİL BAŞTAN PROJESİ - SUPABASE (POSTGRESQL) KUSURSUZ MİMARİSİ
-- Yazar: GEMINI (Veritabanı Şefi) -> Aktaran: Antigravity
-- =========================================================================

-- 1. KULLANICILAR (Personel Sicil Liyakat Tablosu)
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) DEFAULT auth.uid(),
    full_name text NOT NULL,
    email text UNIQUE NOT NULL,
    role text NOT NULL CHECK (role IN ('worker', 'supervisor', 'admin')),
    fp_yield numeric DEFAULT 1.0, -- İlk Geçiş Verimi (Hata Puanı)
    social_points integer DEFAULT 0, -- Sosyal Yardım Puanı (+Multiplier)
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. MAKİNELER VE BANT
CREATE TABLE public.machines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    status text NOT NULL DEFAULT 'idle' CHECK (status IN ('running', 'maintenance', 'idle', 'error')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. ÜRÜN MODELLERİ (Teknik Föy)
CREATE TABLE public.models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name text UNIQUE NOT NULL,
    description text,
    difficulty_score numeric NOT NULL DEFAULT 5.0 CHECK (difficulty_score >= 0.0 AND difficulty_score <= 10.0), -- İşlem Zorluk Barajı
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. ÜNİVERSAL ÜRETİM ADIMLARI
CREATE TABLE public.production_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    step_name text UNIQUE NOT NULL,
    requires_proof boolean NOT NULL DEFAULT TRUE, -- Kanıt Resim İster Mi? KİLİT!
    estimated_duration_minutes integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. MODELE ÖZEL DİNAMİK İŞ AKIŞI (ŞABLONSUZ LİSTE)
CREATE TABLE public.model_workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id uuid NOT NULL REFERENCES public.models(id),
    step_id uuid NOT NULL REFERENCES public.production_steps(id),
    step_order integer NOT NULL, -- Sıralama (1, 2, 3...)
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (model_id, step_order),
    UNIQUE (model_id, step_id)
);

-- 6. SİPARİŞLER (ANA ÜRETİM BAŞLANGICI)
CREATE TABLE public.production_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code text UNIQUE NOT NULL,
    model_id uuid NOT NULL REFERENCES public.models(id),
    quantity integer NOT NULL CHECK (quantity > 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'on_hold_material', 'completed', 'cancelled')),
    start_date timestamptz,
    end_date timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 7. BANTTAKİ (SAHADAKİ) ÜRETİM OPERASYONLARI
CREATE TABLE public.order_production_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.production_orders(id),
    model_workflow_id uuid NOT NULL REFERENCES public.model_workflows(id),
    worker_id uuid REFERENCES public.users(id),
    machine_id uuid REFERENCES public.machines(id),
    status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'assigned', 'in_progress', 'completed', 'waiting_for_proof')),
    start_time timestamptz,
    end_time timestamptz,
    proof_data jsonb, -- Resim URL vb. { "image_url": "...", "approved_by": "..." }
    rework_count integer DEFAULT 0, -- Hata/Tekrar Sayısı
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (order_id, model_workflow_id)
);

-- 8. VİCDAN VE İSTİSNA: DURUŞ/ARIZA OLAYLARI (Elektrik, Kırık İğne)
CREATE TABLE public.downtime_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id uuid REFERENCES public.machines(id),
    reported_by uuid NOT NULL REFERENCES public.users(id),
    downtime_type text NOT NULL CHECK (downtime_type IN ('systemic_power_outage', 'systemic_machine_breakdown', 'worker_error', 'material_shortage')),
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    approved_by uuid REFERENCES public.users(id), -- Şefin onayladığı sütun (SAHTEKARLIGI ÖNLER)
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 9. (LİYAKAT/TAKIM RUHU) SOSYAL PUAN KÜTÜĞÜ
CREATE TABLE public.social_points_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES public.users(id),
    granted_by uuid NOT NULL REFERENCES public.users(id),
    points_amount integer NOT NULL,
    reason text NOT NULL,
    transaction_date timestamptz DEFAULT now()
);

-- GÜNCELLEME (UPDATED_AT) TRİGGERLARI
CREATE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER models_updated_at BEFORE UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER downtime_events_updated_at BEFORE UPDATE ON public.downtime_events FOR EACH ROW EXECUTE FUNCTION update_timestamp();
