-- =========================================================================
-- B1 AR-GE TRENDLER VE AGENT LOGLARI EKSİK SÜTUN (KOLON) YAMASI
-- Neden: ArGe sayfasındaki (400 Bad Request) hatasını çözmek için oluşturulmuştur.
-- Hatanın kaynağı: Yeni arayüzdeki hedef kitle ve zorluk derecesi veritabanında karşılık bulamadığı için çökmekteydi.
-- =========================================================================

-- 1. Hedef Kitle kolonu ekle
ALTER TABLE public.b1_arge_trendler 
ADD COLUMN IF NOT EXISTS hedef_kitle varchar(50) DEFAULT 'kadın';

-- 2. Zorluk Derecesi kolonu ekle
ALTER TABLE public.b1_arge_trendler 
ADD COLUMN IF NOT EXISTS zorluk_derecesi integer DEFAULT 5;

-- BILGI: b1_agent_loglari tablosundaki "durum" sutunu hatası için 
-- frontend kodları (ArgeMainContainer.js ve useArge.js) veritabanına uyumlu 
-- olacak sekilde "sonuc" olarak guncellenmistir. Bu SQL SADECE ARGE tablosu icindir.
