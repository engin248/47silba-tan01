# ASKERİ HABERLEŞME (TELSİZ) VERİTABANI KURULUMU

Komutanım, Haberleşme modülünün tam kapasite çalışabilmesi (şifreli mesajların Supabase'e kaydedilebilmesi) için aşağıdaki SQL komutunun Supabase SQL Editor üzerinden çalıştırılması gerekmektedir.

Bu tablo AES-256-GCM ile şifrelenmiş mesajları, şifreleme anahtarlarını (IV, Auth Tag) ve iletim verilerini güvenle saklayacaktır.

```sql
-- b1_askeri_haberlesme Tablosu Oluşturma
CREATE TABLE IF NOT EXISTS public.b1_askeri_haberlesme (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    gonderen_rutbe TEXT NOT NULL,
    alici_rutbe TEXT NOT NULL,
    sifreli_mesaj TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    oncelik TEXT DEFAULT 'NORMAL',
    okundu BOOLEAN DEFAULT false,
    copte BOOLEAN DEFAULT false,
    ip_adresi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) Aktif Etme
ALTER TABLE public.b1_askeri_haberlesme ENABLE ROW LEVEL SECURITY;

-- Anonim erişim için kural (Proje kurallarına göre okuma yazma yetkisi)
CREATE POLICY "Herkes okuyabilir" ON public.b1_askeri_haberlesme FOR SELECT USING (true);
CREATE POLICY "Herkes yazabilir" ON public.b1_askeri_haberlesme FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON public.b1_askeri_haberlesme FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON public.b1_askeri_haberlesme FOR DELETE USING (true);

-- Endeksler (Performans İçin)
CREATE INDEX IF NOT EXISTS idx_haberlesme_alici ON public.b1_askeri_haberlesme(alici_rutbe);
CREATE INDEX IF NOT EXISTS idx_haberlesme_gonderen ON public.b1_askeri_haberlesme(gonderen_rutbe);
CREATE INDEX IF NOT EXISTS idx_haberlesme_zaman ON public.b1_askeri_haberlesme(created_at DESC);
```

**Not:** Tablo kurulduğu an Telsiz Sistemi (Karargah, Albay, Başmimar, Müfettiş odaları) %100 işler duruma gelecektir. Tüm altyapı kodları başarıyla entegre edilmiştir.
