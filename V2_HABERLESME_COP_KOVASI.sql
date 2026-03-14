-- =========================================================================================
-- M7 - İÇ HABERLEŞME & ÇÖP KOVASI PROTOKOLÜ (45 GÜN OTOMATİK SİLİNME + MODEL ARŞİV KORUMASI)
-- =========================================================================================

-- 1. Tabloya Çöp Kovası kolonlarını ekle
ALTER TABLE public.b1_ic_mesajlar ADD COLUMN IF NOT EXISTS copte BOOLEAN DEFAULT false;
ALTER TABLE public.b1_ic_mesajlar ADD COLUMN IF NOT EXISTS cop_tarihi TIMESTAMPTZ;

-- 2. 45 Günlük Otomatik Temizlik Fonksiyonu (Model referanslı olanlar HARİÇ)
CREATE OR REPLACE FUNCTION uretim_mesajlari_copu_temizle()
RETURNS trigger AS $$
BEGIN
    -- Çöpte olan, 45 günü geçmiş ve herhangi bir modele (urun_id) BAĞLI OLMAYAN mesajları kalıcı siler.
    -- Model bilgisi içeren mesajlar (urun_id dolu olanlar) referans olduğu için sonsuza kadar korunur.
    DELETE FROM public.b1_ic_mesajlar
    WHERE copte = true 
      AND (urun_id IS NULL OR urun_id = '') 
      AND cop_tarihi < NOW() - INTERVAL '45 days';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Tetikleyici (Trigger) - Sisteme her mesaj girildiğinde veya güncellendiğinde arka planda çalışan pasif temizlikçi
DROP TRIGGER IF EXISTS mesaj_cop_temizleyici_trigger ON public.b1_ic_mesajlar;
CREATE TRIGGER mesaj_cop_temizleyici_trigger
AFTER INSERT OR UPDATE ON public.b1_ic_mesajlar
FOR EACH STATEMENT
EXECUTE FUNCTION uretim_mesajlari_copu_temizle();
