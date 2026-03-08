-- ═══════════════════════════════════════════════════════════════
-- FAZ 2 — SUPABASE SQL KOMUTLARI
-- THE ORDER NIZAM | 47 SİL BAŞTAN 1
-- Tarih: 08.03.2026 | Hazırlayan: Antigravity AI
-- Hedef: Skor 83 → 90 (DB Tutarlılığı + Güvenlik Derinliği)
-- ═══════════════════════════════════════════════════════════════
-- KULLANIM: Supabase Dashboard → SQL Editor → Yapıştır → Run
-- Her bloğu SIRAYLA çalıştırın. Hata olursa duraksayın.
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- ADIM 1: b1_gorevler — UNIQUE CONSTRAINT (Race Condition Kapatma)
-- Aynı başlıkta "bekliyor" statüsünde mükerrer görev açılmasını
-- veritabanı katmanında MUTLAK olarak engeller.
-- ───────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_b1_gorevler_bekleyen_baslik
    ON public.b1_gorevler (baslik)
    WHERE durum = 'bekliyor';

-- Doğrulama (sonuç 1 satır dönmeli):
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'b1_gorevler'
  AND indexname = 'uq_b1_gorevler_bekleyen_baslik';


-- ───────────────────────────────────────────────────────────────
-- ADIM 2: b1_kumas_arsivi — 'aktif' KOLONU VARLIK KONTROLÜ
-- Sonuç 0 satırsa kolon YOK → ADIM 2B'yi çalıştır
-- Sonuç 1 satırsa kolon VAR → ADIM 2B'yi atlayın
-- ───────────────────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'b1_kumas_arsivi'
  AND column_name  = 'aktif';

-- ADIM 2B: Kolon yoksa ekle (Yukarıdaki sorgu 0 satır döndürürse çalıştırın)
-- ALTER TABLE public.b1_kumas_arsivi
--     ADD COLUMN IF NOT EXISTS aktif boolean NOT NULL DEFAULT true;
-- Doğrulama:
-- SELECT id, kumas_adi, aktif FROM public.b1_kumas_arsivi LIMIT 5;


-- ───────────────────────────────────────────────────────────────
-- ADIM 3: PERFORMANS İNDEKSLERİ
-- Sık sorgulanan alanlara index ekler → Büyük veri setinde hızı
-- 10x artırır. IF NOT EXISTS sayesinde zaten varsa sorun olmaz.
-- ───────────────────────────────────────────────────────────────

-- M2 Kumaş Arşivi: kumas_kodu'na göre arama
CREATE INDEX IF NOT EXISTS idx_kumas_kodu
    ON public.b1_kumas_arsivi (kumas_kodu);

-- M6 Üretim Bandı: İş emri durumuna göre filtreleme
CREATE INDEX IF NOT EXISTS idx_production_status
    ON public.production_orders (status);

-- Üretim: Model bazlı iş emri sorgusu
CREATE INDEX IF NOT EXISTS idx_production_model_id
    ON public.production_orders (model_id);

-- Görevler: Durum bazlı filtreleme
CREATE INDEX IF NOT EXISTS idx_gorevler_durum
    ON public.b1_gorevler (durum);

-- M1 Aksesuar: Düşük stok sorgularında hızlanma
CREATE INDEX IF NOT EXISTS idx_aksesuar_kodu
    ON public.b1_aksesuar_arsivi (aksesuar_kodu);

-- Maliyet kayıtları: İş emrine göre toplam hesaplaması
CREATE INDEX IF NOT EXISTS idx_maliyet_order_id
    ON public.b1_maliyet_kayitlari (order_id);

-- Muhasebe raporları: İş emrine göre devir kontrolü
CREATE INDEX IF NOT EXISTS idx_muhasebe_order_id
    ON public.b1_muhasebe_raporlari (order_id);

-- Doğrulama (oluşan indexleri görmek için):
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;


-- ───────────────────────────────────────────────────────────────
-- ADIM 4: RLS (Row Level Security) KONTROL SORGUSU
-- Her tabloda RLS aktif mi? Sonuçta rowsecurity = false olan
-- tablolar için ADIM 4B'yi çalıştırın.
-- ───────────────────────────────────────────────────────────────
SELECT
    tablename,
    rowsecurity AS rls_aktif_mi,
    CASE WHEN rowsecurity THEN '✅ Güvenli' ELSE '🔴 AÇIK - RLS KAPALI!' END AS durum
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
      'b1_kumas_arsivi',
      'b1_aksesuar_arsivi',
      'b1_gorevler',
      'b1_personel',
      'b1_maliyet_kayitlari',
      'b1_muhasebe_raporlari',
      'b1_model_taslaklari',
      'production_orders',
      'b0_sistem_loglari',
      'b2_tedarikciler'
  )
ORDER BY tablename;

-- ADIM 4B: RLS Kapalı tablolarda aktif et (ihtiyaç varsa):
-- ALTER TABLE public.b1_personel ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.b1_muhasebe_raporlari ENABLE ROW LEVEL SECURITY;
-- vb.


-- ───────────────────────────────────────────────────────────────
-- ADIM 5: TABLO BOYUT VE SATIR SAYISI RAPORU
-- Hangi tablo ne kadar büyümüş? Supabase free tier (500MB) takibi.
-- ───────────────────────────────────────────────────────────────
SELECT
    relname AS tablo,
    n_live_tup AS satir_sayisi,
    pg_size_pretty(pg_total_relation_size(relid)) AS toplam_boyut
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;


-- ───────────────────────────────────────────────────────────────
-- ADIM 6: b0_sistem_loglari TABLOSU VAR MI?
-- Kara kutu log mekanizması çalışıyor mu kontrol.
-- ───────────────────────────────────────────────────────────────
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'b0_sistem_loglari'
ORDER BY ordinal_position;


-- ───────────────────────────────────────────────────────────────
-- ADIM 7: SUPABASE ANON KEY GÜVENLİK KONTROLİ
-- public.b1_personel tablosundaki maaş/pin bilgisine
-- anonim erişim var mı? (RLS kapalıysa büyük zafiyet)
-- ───────────────────────────────────────────────────────────────
SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name   = 'b1_personel'
  AND grantee      = 'anon';
-- Sonuç boşsa → Güvenli ✅
-- Sonuç varsa  → 🔴 anon kullanıcılar personel tablosuna erişebiliyor!


-- ═══════════════════════════════════════════════════════════════
-- FAZ 2 TAMAMLANDI. RAPOR EDİN:
-- ADIM 2 sonucu: aktif kolonu var mı / yok mu?
-- ADIM 4 sonucu: hangi tablolarda RLS kapalı?
-- ADIM 7 sonucu: anon erişim var mı?
-- ═══════════════════════════════════════════════════════════════
