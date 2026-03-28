-- M6 OTONOM ÜRETİM VE PERSONEL PERFORMANS SİSTEMİ
-- Bu scripti Supabase SQL Editor üzerinden "Kopyala-Yapıştır" yaparak çalıştırınız.

-- 1. YENİ: Makineler Tablosu (Fiziksel makine parkurunun envanteri)
CREATE TABLE IF NOT EXISTS public.b1_makineler (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    makine_kodu TEXT NOT NULL UNIQUE,  -- Örn: OVL-01
    makine_adi TEXT NOT NULL,          -- Örn: 4 İplik Overlok Makinesi
    durum TEXT DEFAULT 'aktif' CHECK (durum IN ('aktif', 'arizali', 'bakimda')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. YENİ: Üretim Operasyonları (Ürün Reçetesi - Bir tişörtün dikilme aşamaları)
CREATE TABLE IF NOT EXISTS public.b1_uretim_operasyonlari (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES public.b1_model_taslaklari(id) ON DELETE CASCADE,
    operasyon_adi TEXT NOT NULL,       -- Örn: Yaka Takma, Omuz Çatma
    makine_id UUID REFERENCES public.b1_makineler(id), -- Hangi makinede yapılacak (opsiyonel)
    sira_no INTEGER NOT NULL,          -- Operasyonun sırası (1, 2, 3...)
    zorluk_derecesi INTEGER DEFAULT 5 CHECK (zorluk_derecesi BETWEEN 1 AND 10),
    hazirlik_suresi_sn INTEGER DEFAULT 0, -- Makinede iplik/aparat değiştirme süresi
    parca_basi_deger_tl NUMERIC(10, 2) DEFAULT 0, -- Prim hak ediş tutarı
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. GÜNCELLEME: Personel Performans (Zaman Aşımı ve Gerçek Zamanlı Takip Revizyonu)
-- Eğer b1_personel_performans tablosu varsa alter ile ek kolonlar açalım.
DO $$
BEGIN
    -- Sipariş bağlantısı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_personel_performans' AND column_name='order_id') THEN
        ALTER TABLE public.b1_personel_performans ADD COLUMN order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE;
    END IF;

    -- Operasyon bağlantısı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_personel_performans' AND column_name='operasyon_id') THEN
        ALTER TABLE public.b1_personel_performans ADD COLUMN operasyon_id UUID REFERENCES public.b1_uretim_operasyonlari(id) ON DELETE CASCADE;
    END IF;

    -- Fire Adeti
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_personel_performans' AND column_name='fire_adet') THEN
        ALTER TABLE public.b1_personel_performans ADD COLUMN fire_adet INTEGER DEFAULT 0;
    END IF;

    -- Üretilen (Sağlam) Adet
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_personel_performans' AND column_name='uretilen_adet') THEN
        ALTER TABLE public.b1_personel_performans ADD COLUMN uretilen_adet INTEGER DEFAULT 0;
    END IF;

    -- Kazanılan Prim (Operasyon değerine göre)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_personel_performans' AND column_name='hiza_gore_prim_tl') THEN
        ALTER TABLE public.b1_personel_performans ADD COLUMN hiza_gore_prim_tl NUMERIC(10, 2) DEFAULT 0;
    END IF;

    -- Unutulan / Askıda Kalan İşlem Uyarısı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_personel_performans' AND column_name='zaman_asimi_durus') THEN
        ALTER TABLE public.b1_personel_performans ADD COLUMN zaman_asimi_durus BOOLEAN DEFAULT false;
    END IF;

    -- Hangi Sepet / İş Barkodu 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_personel_performans' AND column_name='is_barkodu') THEN
        ALTER TABLE public.b1_personel_performans ADD COLUMN is_barkodu TEXT;
    END IF;
    
    -- Sipariş veya Operasyon Hedef Miktarı (Toplam Yapılması Gereken)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_personel_performans' AND column_name='hedef_adet') THEN
        ALTER TABLE public.b1_personel_performans ADD COLUMN hedef_adet INTEGER DEFAULT 1;
    END IF;
END $$;

-- 4. GÜNCELLEME: Personel Tablosu (Tablet Login Barkod No)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_personel' AND column_name='barkod_no') THEN
        ALTER TABLE public.b1_personel ADD COLUMN barkod_no TEXT UNIQUE;
    END IF;
END $$;

-- RLS (Row Level Security) Etkinleştirme
ALTER TABLE public.b1_makineler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_uretim_operasyonlari ENABLE ROW LEVEL SECURITY;

-- Okuma ve Yazma Politikaları (Güvenli, Serbest)
CREATE POLICY "Herkes görebilir ve yazabilir (makineler)" ON public.b1_makineler FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Herkes görebilir ve yazabilir (operasyonlar)" ON public.b1_uretim_operasyonlari FOR ALL USING (true) WITH CHECK (true);
