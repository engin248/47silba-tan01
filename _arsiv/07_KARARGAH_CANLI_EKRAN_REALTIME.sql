-- =====================================================================
-- 47 SİL BAŞTAN — KÖR NOKTA 4: SİSTEM ÇAPINDA CANLI YAYIN (REALTIME)
-- =====================================================================
-- Bu SQL Dosyası, tüm kritik tablolarda Supabase "Realtime" özelliğini aktifleştirir.
-- Ustalardan biri veriyi kaydettiğinde veya sildiğinde Karargâhın haberi milisaniyesinde olur.

begin;

-- Yalnızca gerekli (kritik) tabloları Realtime yayınına (Websockets) bağlıyoruz
alter publication supabase_realtime add table public.b1_model_taslaklari;
alter publication supabase_realtime add table public.production_orders;
alter publication supabase_realtime add table public.b1_maliyet_kayitlari;
alter publication supabase_realtime add table public.b1_kumas_arsivi;
alter publication supabase_realtime add table public.b2_musteriler;
alter publication supabase_realtime add table public.b2_siparisler;
alter publication supabase_realtime add table public.b2_siparis_kalemleri;
alter publication supabase_realtime add table public.b2_kasa_hareketleri;
alter publication supabase_realtime add table public.b2_stok_hareketleri;

commit;

-- İşlem Tamamlandı. layout.js'deki "supabase.channel" aboneliği artık çalışacak.
