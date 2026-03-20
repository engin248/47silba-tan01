# 47 SİL BAŞTAN — ESKİ SİSTEM TABLOLARI YEDEĞİ
>
> **Oluşturulma:** 2026-03-07  
> **Durum:** Supabase'den KALDIRILABİLİR — Yeni sistem (b1_/b2_ prefix) aktif  
> **Kaynak:** `01_GEMINI_SUPABASE_TABLOLARI.sql`

---

## ⚠️ UYARI

Bu tablolar **ESKİ SİSTEM** tasarımından kalmadır.  
Yeni sistem `b1_` ve `b2_` prefix'li tablolar kullanmaktadır.  
Bu tablolar **ÜRETİMDE KULLANILMIYOR** — güvenle Supabase'den kaldırılabilir.

---

## 📋 Kaldırılacak Eski Tablolar

```sql
-- Supabase SQL Editor'de çalıştırın:
-- ADIM 1: Trigger'ları kaldır (bağımlılık sırası önemli)
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
DROP TRIGGER IF EXISTS models_updated_at ON public.models;
DROP TRIGGER IF EXISTS downtime_events_updated_at ON public.downtime_events;
DROP FUNCTION IF EXISTS public.update_timestamp();

-- ADIM 2: Bağımlı tablolar önce silinir
DROP TABLE IF EXISTS public.social_points_transactions CASCADE;
DROP TABLE IF EXISTS public.order_production_steps CASCADE;
DROP TABLE IF EXISTS public.downtime_events CASCADE;
DROP TABLE IF EXISTS public.model_workflows CASCADE;
DROP TABLE IF EXISTS public.production_orders CASCADE;
DROP TABLE IF EXISTS public.production_steps CASCADE;
DROP TABLE IF EXISTS public.models CASCADE;
DROP TABLE IF EXISTS public.machines CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```

---

## 📐 Eski Tablo Şemaları (Referans)

### 1. `public.users`

```sql
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) DEFAULT auth.uid(),
    full_name text NOT NULL,
    email text UNIQUE NOT NULL,
    role text NOT NULL CHECK (role IN ('worker', 'supervisor', 'admin')),
    fp_yield numeric DEFAULT 1.0,        -- İlk Geçiş Verimi
    social_points integer DEFAULT 0,     -- Sosyal Yardım Puanı
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### 2. `public.machines`

```sql
CREATE TABLE public.machines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    status text NOT NULL DEFAULT 'idle' CHECK (status IN ('running', 'maintenance', 'idle', 'error')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### 3. `public.models` (Eski Teknik Föy)

```sql
CREATE TABLE public.models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name text UNIQUE NOT NULL,
    description text,
    difficulty_score numeric NOT NULL DEFAULT 5.0 CHECK (difficulty_score >= 0.0 AND difficulty_score <= 10.0),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### 4. `public.production_steps`

```sql
CREATE TABLE public.production_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    step_name text UNIQUE NOT NULL,
    requires_proof boolean NOT NULL DEFAULT TRUE,
    estimated_duration_minutes integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### 5. `public.model_workflows`

```sql
CREATE TABLE public.model_workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id uuid NOT NULL REFERENCES public.models(id),
    step_id uuid NOT NULL REFERENCES public.production_steps(id),
    step_order integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (model_id, step_order),
    UNIQUE (model_id, step_id)
);
```

### 6. `public.production_orders` (ESKİ — Yeni: b1_model_taslaklari)

```sql
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
```

> ⚡ **Yeni Karşılığı:** `b1_model_taslaklari` (model_kodu, model_adi, durum)

### 7. `public.order_production_steps`

```sql
CREATE TABLE public.order_production_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.production_orders(id),
    model_workflow_id uuid NOT NULL REFERENCES public.model_workflows(id),
    worker_id uuid REFERENCES public.users(id),
    machine_id uuid REFERENCES public.machines(id),
    status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'assigned', 'in_progress', 'completed', 'waiting_for_proof')),
    start_time timestamptz,
    end_time timestamptz,
    proof_data jsonb,
    rework_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (order_id, model_workflow_id)
);
```

### 8. `public.downtime_events`

```sql
CREATE TABLE public.downtime_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id uuid REFERENCES public.machines(id),
    reported_by uuid NOT NULL REFERENCES public.users(id),
    downtime_type text NOT NULL CHECK (downtime_type IN ('systemic_power_outage', 'systemic_machine_breakdown', 'worker_error', 'material_shortage')),
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    approved_by uuid REFERENCES public.users(id),
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### 9. `public.social_points_transactions`

```sql
CREATE TABLE public.social_points_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES public.users(id),
    granted_by uuid NOT NULL REFERENCES public.users(id),
    points_amount integer NOT NULL,
    reason text NOT NULL,
    transaction_date timestamptz DEFAULT now()
);
```

---

## ✅ YENİ SİSTEM TABLOLARI (Aktif — Silmeyin!)

| Prefix | Tablolar |
|--------|---------|
| `b1_` | `b1_model_taslaklari`, `b1_arge_trendler`, `b1_kumas_arsivi`, `b1_aksesuar_arsivi`, `b1_personel`, `b1_personel_devam`, `b1_maliyet_kayitlari`, `b1_muhasebe_raporlari`, `b1_sistem_ayarlari` |
| `b2_` | `b2_musteriler`, `b2_urun_katalogu`, `b2_kategoriler`, `b2_siparisler`, `b2_siparis_kalemleri`, `b2_stok_hareketleri`, `b2_kasa_hareketleri`, `b2_musteri_iletisim` |

---

## 🧹 Supabase'de Kaldırma SQL'i

Supabase SQL Editor'de 2 ayrı sorgu olarak çalıştırın:

**SORGU 1 (DROP TRIGGER + FUNCTION):**

```sql
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
DROP TRIGGER IF EXISTS models_updated_at ON public.models;
DROP TRIGGER IF EXISTS downtime_events_updated_at ON public.downtime_events;
DROP FUNCTION IF EXISTS public.update_timestamp() CASCADE;
```

**SORGU 2 (DROP TABLE — CASCADE ile bağımlı tablolar dahil):**

```sql
DROP TABLE IF EXISTS public.social_points_transactions CASCADE;
DROP TABLE IF EXISTS public.order_production_steps CASCADE;
DROP TABLE IF EXISTS public.downtime_events CASCADE;
DROP TABLE IF EXISTS public.model_workflows CASCADE;
DROP TABLE IF EXISTS public.production_orders CASCADE;
DROP TABLE IF EXISTS public.production_steps CASCADE;
DROP TABLE IF EXISTS public.models CASCADE;
DROP TABLE IF EXISTS public.machines CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```
