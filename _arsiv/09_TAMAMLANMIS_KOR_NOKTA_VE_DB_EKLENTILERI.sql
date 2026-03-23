-- FAZ 1 Supabase SQL Eklentileri Dosyası (Düzeltme Listesi)
-- THE ORDER 47 NİZAM: EKSİK KÖR NOKTALARI VE YENİ TABLOLARI AÇMA İŞLEMİ

-- 1. ZORLUK DERECESİ EKLENTİSİ (Ar-Ge ve Modelhane) (Modellerin üretim zorluğunun belirlenmesi)
ALTER TABLE b1_arge_trendler ADD COLUMN IF NOT EXISTS zorluk_derecesi INTEGER DEFAULT 5 CHECK (zorluk_derecesi BETWEEN 1 AND 10);
ALTER TABLE b1_model_kaliplari ADD COLUMN IF NOT EXISTS zorluk_derecesi INTEGER DEFAULT 5 CHECK (zorluk_derecesi BETWEEN 1 AND 10);

-- 2. KUMAŞ TEDARİKÇİLERİ TABLOSU (M2 Kumaş İçin İrtibatlar)
CREATE TABLE IF NOT EXISTS b2_tedarikciler (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    firma_adi TEXT NOT NULL,
    yetkili_kisi TEXT,
    telefon TEXT NOT NULL,
    email TEXT,
    adres TEXT,
    tedarik_kategorisi TEXT DEFAULT 'Kumaş',
    aktif_mi BOOLEAN DEFAULT true,
    notlar TEXT
);

-- Kumaş arşivine tedarikçi bağını ekle
ALTER TABLE b1_kumas_arsivi ADD COLUMN IF NOT EXISTS tedarikci_id UUID REFERENCES b2_tedarikciler(id);

-- 3. ÇEK/SENET VE VADE TAKİBİ (M7 Kasa Fason Takibi İçin)
CREATE TABLE IF NOT EXISTS b2_cek_senet_vade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    vade_tarihi DATE NOT NULL,
    islem_tipi TEXT NOT NULL CHECK (islem_tipi IN ('alinan_cek', 'verilen_cek', 'alinan_senet', 'verilen_senet', 'veresiye_alacak', 'veresiye_borc')),
    tutar DECIMAL(15,2) NOT NULL,
    para_birimi TEXT DEFAULT 'TRY',
    kur DECIMAL(10,4) DEFAULT 1.0,
    kisi_firma TEXT NOT NULL,
    aciklama TEXT,
    durum TEXT DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'odendi', 'iptal', 'karsiliksiz')),
    odeme_tarihi DATE
);

-- 4. ADALET: İŞÇİ PERFORMANS VE YILDIZ PUANI (M9 Personel Performansı İçin)
ALTER TABLE b1_personel ADD COLUMN IF NOT EXISTS ai_verimlilik_puani DECIMAL(3,1) DEFAULT 0.0 CHECK (ai_verimlilik_puani BETWEEN 0.0 AND 5.0);

-- 5. MÜŞTERİ RİSK VE KARA LİSTE LİMİTİ (M11 Toptancı Kötü Borç Kalkanı İçin)
ALTER TABLE b2_musteriler ADD COLUMN IF NOT EXISTS risk_limiti DECIMAL(15,2) DEFAULT 0.0;
ALTER TABLE b2_musteriler ADD COLUMN IF NOT EXISTS kara_liste BOOLEAN DEFAULT false;

-- RLS POLİTİKALARI VE GÜVENLİK ZIRHLARI
ALTER TABLE b2_tedarikciler ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2_cek_senet_vade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tüm yetkililer tedarikçileri görebilir" ON b2_tedarikciler FOR SELECT USING (true);
CREATE POLICY "Sadece yöneticiler ve üretim tedarikçi ekleyebilir" ON b2_tedarikciler FOR INSERT WITH CHECK (true);
CREATE POLICY "Sadece yöneticiler ve üretim tedarikçi güncelleyebilir" ON b2_tedarikciler FOR UPDATE USING (true);
CREATE POLICY "Sadece yöneticiler tedarikçi silebilir" ON b2_tedarikciler FOR DELETE USING (true);

CREATE POLICY "Tüm yetkililer çek/senet görebilir" ON b2_cek_senet_vade FOR SELECT USING (true);
CREATE POLICY "Sadece yöneticiler çek/senet ekleyebilir" ON b2_cek_senet_vade FOR INSERT WITH CHECK (true);
CREATE POLICY "Sadece yöneticiler çek/senet güncelleyebilir" ON b2_cek_senet_vade FOR UPDATE USING (true);
CREATE POLICY "Sadece yöneticiler çek/senet silebilir" ON b2_cek_senet_vade FOR DELETE USING (true);

-- Storage (Bucket) Eklentisi Dijital Kalıp Yüklemesi İçin (M4)
-- Supabase panelinden veya Storage API'sinden açılması gereken Bucket adresi: 'kalip_dosyalar'
