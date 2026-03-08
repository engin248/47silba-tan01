# 🛡️ DANIŞMA VE İSTİŞARE RAPORU: 47_SIL_BASTAN_01 - 1. BİRİM MİMARİ ANALİZİ

**Görevli Ajan:** GEMİNİ (Veritabanı, Bellek ve Bilgi İşlem Şefi)
**Talep Edilen:** Engin Koordinatör & Siber Mimar (Antigravity)

---

Sayın Koordinatör,

"47_SIL_BASTAN_01" projesinin 1. Birim (İmalat/Üretim) planını ve geçmiş projenin acı derslerini detaylıca inceledim. Bu rapor, sunduğunuz vizyonun veritabanı ve mantıksal mimari açısından sağlamlığını değerlendirmekte, olası kör noktaları belirlemekte ve Supabase (PostgreSQL) üzerinde kusursuz bir yapı için öneriler sunmaktadır.

Genel itibarıyla, geçmiş hatalardan ders çıkarılmış ve proaktif, liyakat odaklı bir sistem taslağı oluşturulmuştur. Bu yeni yaklaşım, hem operasyonel verimliliği artıracak hem de insani faktörleri gözeten bir denge kuracaktır.

---

## 1. Yüzde Yüz (%100) Onay ve Kör Nokta Taraması

**Plana Katılım:** **%100 Katılıyorum.** Mevcut plan, geçmiş projenin temel hatalarını ele almakla kalmıyor, aynı zamanda modern üretim yönetim sistemlerinde aranan esneklik, şeffaflık ve adalet ilkelerini de benimsiyor. Özellikle "Dinamik Föy Girişi" ve "Vicdan Toleransı ve Liyakat" maddeleri, hem iş akışını optimize edecek hem de çalışan motivasyonunu artıracaktır.

### Kör Nokta Uyarıları ve Çözüm Önerileri:

1.  **Görsel Kanıt (Resim/Onay) Depolama ve Doğrulama:**
    *   **Kör Nokta:** Her adım için resim veya belge onayı istenirken, bu verilerin boyutları ve depolama maliyetleri zamanla şişebilir. Ayrıca, gönderilen resimlerin kalitesi, içeriği ve sahteliği riskleri mevcuttur.
    *   **Veritabanı Şişmesi Riski:** Yüksek çözünürlüklü binlerce resim, Supabase Storage (S3 uyumlu) tarafında maliyeti artırabilir ve görüntüleme sürelerini uzatabilir.
    *   **Çözüm Önerisi:**
        *   **Resim Optimizasyonu:** Mümkünse, client tarafında (tablet/kamera uygulaması) resimlerin belirli bir çözünürlüğe ve sıkıştırma oranına (örn: WebP formatı) düşürülerek gönderilmesi sağlanmalı.
        *   **Meta Veri ile Doğrulama:** Resmin çekildiği zaman damgası, cihaz bilgisi (varsa konum) gibi meta verilerin saklanması.
        *   **Basit Görsel Analiz (Opsiyonel):** İlerleyen aşamalarda, anlamsız veya boş resimleri tespit edebilecek basit bir yapay zeka/görüntü işleme modülü entegrasyonu düşünülebilir. Şimdilik, supervisor onayı temel doğrulama mekanizması olmalı.
        *   **RLS (Row Level Security):** Supabase'te depolanan kanıtlara sadece yetkili kişilerin (ilgili işçi, supervisor, admin) erişebilmesi için RLS kuralları titizlikle uygulanmalı.

2.  **FPY (First Pass Yield) Hesaplama ve Liyakat Ataması Mantığı:**
    *   **Kör Nokta:** FPY'nin ne sıklıkta güncelleneceği, nasıl hesaplanacağı (son X görev mi, ortalama mı?), yeni işçiler için başlangıç FPY değeri ne olacağı ve FPY'si düşük bir işçi için görev ataması yapılmadığında boşta kalma durumu.
    *   **Çözüm Önerisi:**
        *   **Dinamik FPY:** FPY, her görev tamamlandığında (veya belirli periyotlarda) güncellenmeli. `order_production_steps` tablosundaki `rework_count` ve tamamlanma süreleri FPY hesabına dahil edilebilir.
        *   **Başlangıç FPY:** Yeni işçilere başlangıç olarak bir ortalama FPY atanmalı veya "deneme süreci" boyunca özel bir FPY hesaplama mekanizması işletilmeli.
        *   **Esneklik:** Sistem, yüksek FPY'li işçinin meşgul olması durumunda, bir sonraki en uygun FPY'ye sahip işçiyi önerebilmeli ve son kararı supervisora bırakabilmeli. Kırmızı alarm, sadece sisteme rağmen uygun olmayan bir atama yapıldığında tetiklenmeli, işçiyi tamamen engellememeli (ancak supervisor onayı gerektirmeli).

3.  **Sistemsel Arıza Tespiti ve Onayı:**
    *   **Kör Nokta:** Elektrik kesintisi veya makine arızası gibi "sistemsel" hataların kim tarafından, nasıl ve ne kadar sürede onaylanacağı belirsizliği. Kötü niyetli kullanım (işçinin kendi hatasını sistemsel olarak bildirmesi) riski.
    *   **Çözüm Önerisi:**
        *   **Onay Mekanizması:** `downtime_events` tablosundaki "systemic" türdeki arızalar mutlaka bir supervisor veya admin tarafından onaylanmalıdır.
        *   **Otomatik Entegrasyon (Gelecek):** İleride, makine sensörleri veya enerji izleme sistemleri ile entegrasyon düşünülerek bu tür arızaların otomatik olarak algılanması ve kayda geçirilmesi sağlanabilir. Şimdilik, manuel bildirim ve supervisor onayı esas olmalı.

4.  **Envanter Takibinde Gerçek Zamanlılık ve Hata Payı:**
    *   **Kör Nokta:** "Sıfır İnisiyatif" için envanterin anlık ve doğru olması kritik. Fiziksel envanter ile sistemdeki envanter arasında tutarsızlıklar oluşabilir (hasarlı ürün, kayıp, hatalı giriş).
    *   **Çözüm Önerisi:**
        *   **Periyodik Sayım:** Düzenli fiziksel envanter sayımları ve sistemle karşılaştırma mekanizması.
        *   **İade/Fire Takibi:** Üretim sırasında oluşan fire veya iade edilen malzemelerin sisteme doğru şekilde işlenmesi için süreçler oluşturulmalı.
        *   **Supabase Realtime:** Envanter değişiklikleri anında sistemdeki ilgili modüllere (örn: üretim emri başlatma ekranı) yansıtılmalı.

### Geçmiş Hatalardan Arınma Durumu:

*   **1. İsraf ve Şov (Chatbotlar):** Yeni planda doğrudan chatbotlardan bahsedilmediği için bu hata tamamen arınmıştır. Sistem, temel iş akışına odaklanmıştır.
*   **2. Sabit Şablon Hantallığı:** "Dinamik Föy Girişi" ve "Sıfır İnisiyatif" maddeleri ile bu hata tamamen çözülmüştür. Her modele özel esnek iş akışları ve malzeme kontrolü sayesinde fason firmalarının inisiyatifi sıfırlanmıştır.
*   **3. Mekanik ve Acımasız Kronometre:** "Vicdan Toleransı ve Liyakat" maddesi sayesinde bu hata da temelden çözülmüştür. Sistemsel hatalardan işçi sorumlu tutulmayacak ve liyakat ödüllendirilecektir.

---

## 2. Veritabanı Çekirdek Şeması (Supabase / PostgreSQL)

Aşağıda, "inisiyatifsiz ve kanıtlı" sistem prensiplerini destekleyecek Supabase (PostgreSQL) tablo yapıları, ilişkileri ve temel sütunları sunulmuştur. Bu yapı, esneklik, ölçeklenebilirlik ve veri bütünlüğünü hedeflemektedir.

```sql
-- PostgreSQL / Supabase Schema

-- Kullanıcılar: Çalışanlar, Denetmenler, Yöneticiler
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) DEFAULT auth.uid(), -- Supabase Auth ile entegrasyon
    full_name text NOT NULL,
    email text UNIQUE NOT NULL,
    role text NOT NULL CHECK (role IN ('worker', 'supervisor', 'admin')), -- Yetki rolleri
    fp_yield numeric DEFAULT 1.0, -- First Pass Yield (İlk Geçiş Verimi), 0.0 - 1.0 arası
    social_points integer DEFAULT 0, -- Sosyal Yardım Puanları
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Makine Tanımları
CREATE TABLE public.machines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    description text,
    location text,
    status text NOT NULL DEFAULT 'idle' CHECK (status IN ('running', 'maintenance', 'idle', 'error')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ürün Modelleri
CREATE TABLE public.models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name text UNIQUE NOT NULL,
    description text,
    difficulty_score numeric NOT NULL DEFAULT 5.0 CHECK (difficulty_score >= 0.0 AND difficulty_score <= 10.0), -- Zorluk Skoru
    material_cost numeric,
    selling_price numeric,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Genel Üretim Adımları (Kesim, Dikim, Ütü vb.)
CREATE TABLE public.production_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    step_name text UNIQUE NOT NULL,
    description text,
    requires_proof boolean NOT NULL DEFAULT TRUE, -- Adım tamamlandığında kanıt (resim/onay) gerektirir mi?
    estimated_duration_minutes integer, -- Ortalama tamamlanma süresi
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Modele Özgü İş Akışları (Dinamik Föy)
CREATE TABLE public.model_workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id uuid NOT NULL REFERENCES public.models(id),
    step_id uuid NOT NULL REFERENCES public.production_steps(id),
    step_order integer NOT NULL, -- Adımın sırası (1, 2, 3...)
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (model_id, step_order), -- Bir modelde aynı sıradan iki adım olamaz
    UNIQUE (model_id, step_id) -- Bir modelde aynı adım birden fazla olamaz (sırası farklı olsa bile)
);

-- Envanter Malzemeleri
CREATE TABLE public.inventory_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name text UNIQUE NOT NULL,
    item_type text NOT NULL CHECK (item_type IN ('fabric', 'thread', 'button', 'zipper', 'other_accessory', 'chemical')),
    current_stock numeric NOT NULL DEFAULT 0,
    unit_of_measure text NOT NULL, -- Örn: 'meter', 'adet', 'kg'
    min_stock_level numeric DEFAULT 0, -- Minimum stok seviyesi
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Modele Göre Malzeme İhtiyaçları (Hangi model için hangi adımda hangi malzeme ne kadar gerekli)
CREATE TABLE public.model_material_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id uuid NOT NULL REFERENCES public.models(id),
    step_id uuid REFERENCES public.production_steps(id), -- Hangi adım için gerekli (null ise tüm model için)
    item_id uuid NOT NULL REFERENCES public.inventory_items(id),
    quantity_needed numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (model_id, step_id, item_id) -- Bir modelde, bir adım için aynı malzemeden birden fazla gereksinim olamaz
);

-- Üretim Siparişleri (Ana Sipariş Takibi)
CREATE TABLE public.production_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code text UNIQUE NOT NULL,
    model_id uuid NOT NULL REFERENCES public.models(id),
    quantity integer NOT NULL CHECK (quantity > 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'on_hold_material', 'on_hold_machine', 'completed', 'cancelled')),
    start_date timestamptz,
    end_date timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Sipariş Bazında Üretim Adımları İlerlemesi (Her bir siparişin her bir adımının durumu)
CREATE TABLE public.order_production_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.production_orders(id),
    model_workflow_id uuid NOT NULL REFERENCES public.model_workflows(id),
    worker_id uuid REFERENCES public.users(id), -- Hangi işçi atandı
    machine_id uuid REFERENCES public.machines(id), -- Hangi makinede yapıldı
    status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'assigned', 'in_progress', 'completed', 'blocked_material', 'blocked_machine', 'rework_needed', 'waiting_for_proof')),
    start_time timestamptz,
    end_time timestamptz,
    proof_data jsonb, -- Resim URL'leri, onay bilgileri vb. { "image_url": "...", "approved_by": "...", "approved_at": "..." }
    rework_count integer DEFAULT 0, -- Yeniden çalışma sayısı
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (order_id, model_workflow_id) -- Bir siparişte, bir iş akışı adımı sadece bir kez takip edilir
);

-- Çalışma Duruş Olayları (Elektrik Kesintisi, Makine Arızası vb.)
CREATE TABLE public.downtime_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id uuid REFERENCES public.machines(id), -- Hangi makine etkilendi (genel arıza ise null olabilir)
    reported_by uuid NOT NULL REFERENCES public.users(id), -- Kim raporladı
    downtime_type text NOT NULL CHECK (downtime_type IN ('systemic_power_outage', 'systemic_machine_breakdown', 'worker_error', 'material_shortage', 'maintenance', 'other')),
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    description text,
    is_worker_fault boolean NOT NULL, -- İşçi hatası mı (downtime_type'dan türetilebilir ama saklamak faydalı)
    approved_by uuid REFERENCES public.users(id), -- Kim onayladı (supervisor/admin)
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Sosyal Puan Hareketleri
CREATE TABLE public.social_points_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES public.users(id),
    granted_by uuid NOT NULL REFERENCES public.users(id), -- Kim tarafından verildi (supervisor)
    points_amount integer NOT NULL,
    reason text NOT NULL, -- Örn: 'Yardımlaşma', 'Ekstra Çaba', 'Öneri'
    transaction_date timestamptz DEFAULT now()
);

-- Sistem Uyarıları ve Bildirimleri
CREATE TABLE public.alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type text NOT NULL CHECK (alert_type IN ('low_fp_yield_assignment', 'material_shortage', 'machine_down', 'step_overdue', 'quality_issue', 'low_stock', 'other')),
    related_order_step_id uuid REFERENCES public.order_production_steps(id),
    related_worker_id uuid REFERENCES public.users(id),
    related_machine_id uuid REFERENCES public.machines(id),
    related_inventory_item_id uuid REFERENCES public.inventory_items(id),
    message text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Trigger: `updated_at` sütununu otomatik güncelleme
CREATE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER machines_updated_at BEFORE UPDATE ON public.machines FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER models_updated_at BEFORE UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER production_steps_updated_at BEFORE UPDATE ON public.production_steps FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER model_workflows_updated_at BEFORE UPDATE ON public.model_workflows FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER model_material_requirements_updated_at BEFORE UPDATE ON public.model_material_requirements FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER production_orders_updated_at BEFORE UPDATE ON public.production_orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER order_production_steps_updated_at BEFORE UPDATE ON public.order_production_steps FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER downtime_events_updated_at BEFORE UPDATE ON public.downtime_events FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS (Row Level Security) Politikaları (Örnekler)
-- Her tablonun kendi yetki gereksinimlerine göre detaylı RLS politikaları yazılmalıdır.
-- Örneğin:
-- İşçiler sadece kendilerine atanmış `order_production_steps` verilerini görebilmeli ve güncelleyebilmeli.
-- Supervisor'lar kendi ekiplerindeki işçilerin verilerini görebilmeli.
-- Admin'ler tüm verilere erişebilmeli.

-- Örneğin: İşçinin kendi görevlerini okuma
ALTER TABLE public.order_production_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_tasks ON public.order_production_steps FOR SELECT TO authenticated USING (worker_id = auth.uid());
CREATE POLICY update_own_tasks ON public.order_production_steps FOR UPDATE TO authenticated USING (worker_id = auth.uid());

-- Örnek: Supervisor'ın kendi ekibini yönetmesi için (Ekipler için ayrı bir tabloya ihtiyaç duyulacaktır.)
-- Şimdilik, supervisorların tüm verilere eriştiğini varsayalım veya kullanıcı rolüne göre erişim tanımlayalım.
CREATE POLICY select_all_for_admin_supervisor ON public.order_production_steps FOR SELECT TO authenticated USING (auth.role() = 'admin' OR auth.role() = 'supervisor');


-- Supabase Fonksiyonları ve Trigger'lar (Veritabanı Mantığı)
-- Supabase Edge Functions veya doğrudan PostgreSQL fonksiyonları ile iş mantığı uygulanabilir.

-- Malzeme kontrolü için fonksiyon (Örnek)
CREATE OR REPLACE FUNCTION check_material_for_step(p_order_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_model_id uuid;
    v_next_step_id uuid;
    v_has_materials BOOLEAN := TRUE;
BEGIN
    SELECT po.model_id, (SELECT mws.step_id FROM public.model_workflows mws WHERE mws.model_id = po.model_id AND mws.step_order = (SELECT ops.step_order + 1 FROM public.order_production_steps ops JOIN public.model_workflows mw ON ops.model_workflow_id = mw.id WHERE ops.order_id = p_order_id ORDER BY mw.step_order DESC LIMIT 1))
    INTO v_model_id, v_next_step_id
    FROM public.production_orders po
    WHERE po.id = p_order_id;

    IF v_next_step_id IS NULL THEN
        -- Son adımsa veya henüz adım atanmamışsa malzeme kontrolüne gerek yok
        RETURN TRUE;
    END IF;

    -- Gerekli malzemeleri ve mevcut stokları kontrol et
    SELECT NOT EXISTS (
        SELECT 1
        FROM public.model_material_requirements mmr
        JOIN public.inventory_items ii ON mmr.item_id = ii.id
        WHERE mmr.model_id = v_model_id
          AND (mmr.step_id = v_next_step_id OR mmr.step_id IS NULL) -- Adım özelinde veya tüm model için
          AND ii.current_stock < mmr.quantity_needed
    ) INTO v_has_materials;

    IF NOT v_has_materials THEN
        UPDATE public.production_orders SET status = 'on_hold_material' WHERE id = p_order_id;
        INSERT INTO public.alerts (alert_type, related_order_step_id, message, severity)
        VALUES ('material_shortage', NULL, 'Sipariş ' || p_order_id || ' için malzeme eksikliği!', 'critical');
    END IF;

    RETURN v_has_materials;
END;
$$;


-- FPY güncelleme fonksiyonu (bir adım tamamlandığında veya rework olduğunda çağrılabilir)
CREATE OR REPLACE FUNCTION update_worker_fp_yield(p_worker_id uuid)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Son 100 görevin veya belirli bir zaman aralığındaki görevlerin FPY'sini hesapla
    UPDATE public.users
    SET fp_yield = (
        SELECT
            COALESCE(SUM(CASE WHEN ops.rework_count = 0 THEN 1 ELSE 0 END)::numeric / COUNT(ops.id), 1.0)
        FROM public.order_production_steps ops
        WHERE ops.worker_id = p_worker_id
          AND ops.end_time IS NOT NULL
          AND ops.status = 'completed'
          AND ops.created_at > now() - INTERVAL '30 days' -- Son 30 gün
    )
    WHERE id = p_worker_id;
END;
$$;

-- Sosyal puan eklendiğinde veya çıkarıldığında `users` tablosundaki toplam puanı güncellemek için trigger
CREATE OR REPLACE FUNCTION update_user_social_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET social_points = social_points + NEW.points_amount
    WHERE id = NEW.worker_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_social_points_insert
AFTER INSERT ON public.social_points_transactions
FOR EACH ROW EXECUTE FUNCTION update_user_social_points();

-- Bir adım tamamlandığında envanterden düşmek için trigger (örn: Dikim adımı tamamlandığında iplik düşmek gibi)
-- Bu trigger, `order_production_steps` tablosunun 'completed' statüsüne geçtiğinde tetiklenebilir
-- Daha karmaşık bir iş mantığı gerektirebilir, bu sadece bir örnek.
CREATE OR REPLACE FUNCTION deduct_materials_on_step_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_model_id uuid;
    v_step_id uuid;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        SELECT mw.model_id, mw.step_id
        INTO v_model_id, v_step_id
        FROM public.model_workflows mw
        WHERE mw.id = NEW.model_workflow_id;

        -- İlgili adım ve model için malzeme ihtiyaçlarını bul ve stoktan düş
        UPDATE public.inventory_items ii
        SET current_stock = ii.current_stock - (
            SELECT mmr.quantity_needed * po.quantity -- Sipariş miktarı kadar çarpılmalı
            FROM public.model_material_requirements mmr
            JOIN public.production_orders po ON po.id = NEW.order_id
            WHERE mmr.model_id = v_model_id
              AND (mmr.step_id = v_step_id OR mmr.step_id IS NULL)
              AND mmr.item_id = ii.id
        )
        WHERE id IN (
            SELECT mmr.item_id
            FROM public.model_material_requirements mmr
            WHERE mmr.model_id = v_model_id
              AND (mmr.step_id = v_step_id OR mmr.step_id IS NULL)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_step_completion
AFTER UPDATE ON public.order_production_steps
FOR EACH ROW EXECUTE FUNCTION deduct_materials_on_step_completion();
```

---

## 3. Maliyet-Zaman Tasarrufu Önerisi (UI/UX - Claude'a Yönelik)

Tasarım şefi Claude'a, veri akışını optimize etmek ve UI performansını artırmak adına aşağıdaki uyarıları ve önerileri iletiyorum:

1.  **Akıllı Veri Çekimi ve Realtime Kullanımı:**
    *   **Uyarı:** Her UI bileşeni için sürekli tüm veriyi (full data fetch) çekmekten kaçın. Supabase Realtime özelliğini, sadece değişmesi beklenen veya anlık güncellenmesi gereken veriler (örn: sipariş durumu, makine durumu, anlık alarm) için kullan.
    *   **Öneri:** Bir işçinin görev listesi veya bir yöneticinin genel dashboard'u gibi daha statik veriler için, ilk yüklemede veriyi çek ve yalnızca ilgili bir işlem gerçekleştiğinde (örn: işçi bir adımı tamamladığında) o bölümü yeniden yükle veya Realtime ile ilgili satırı güncelle.
    *   **Verimli Filtreleme/Sıralama:** Sunucu tarafında (Supabase RPC ile veya View'ler aracılığıyla) filtreleme ve sıralama yaparak, client'a sadece gösterilecek veriyi gönder. Büyük veri kümelerinde client tarafı filtreleme/sıralama performansı düşürür.

2.  **Görsel Kanıt (Resim) Optimizasyonu:**
    *   **Uyarı:** Yüksek çözünürlüklü resimlerin doğrudan sisteme yüklenmesi hem bant genişliği tüketimini artırır hem de depolama maliyetlerini şişirir.
    *   **Öneri:** Kamera/tablet uygulaması tarafından çekilen resimlerin UI katmanında (client side) belirli bir boyuta (örn: 1024px en fazla kenar) ve sıkıştırma oranına getirilerek (örn: JPEG kalitesi 70% veya WebP) Supabase Storage'a yüklenmesi sağlanmalı.
    *   **Lazy Loading / Placeholders:** Dashboard'larda veya görev detaylarında resimlerin anında yüklenmesi yerine, kullanıcının kaydırma hareketiyle görünür hale geldikçe yüklenmesi (lazy loading) veya yüklenirken düşük çözünürlüklü bir placeholder gösterilmesi performans hissini artırır.

3.  **Toplu İşlemler ve Debouncing/Throttling:**
    *   **Uyarı:** Kullanıcının hızlı ve tekrar eden aksiyonları (örn: bir forma sürekli veri girişi) her tuş vuruşunda/değişikliğinde veritabanına istek göndermeye çalışırsa aşırı yük oluşturur.
    *   **Öneri:** Veri giriş formlarında `debouncing` kullanarak, kullanıcı yazmayı bıraktıktan sonra belirli bir süre (örn: 300ms) geçmeden veritabanına istek gönderme. Büyük listelerde scroll olayları için `throttling` kullanarak belirli aralıklarla tetiklenmeyi sağla.

4.  **Hata Yönetimi ve Kullanıcı Geri Bildirimi:**
    *   **Uyarı:** Veritabanı hataları veya API sorunları kullanıcıya anlaşılmaz teknik mesajlarla gösterilirse kötü bir deneyim sunar.
    *   **Öneri:** Hata durumlarında (örn: malzeme eksikliği, FPY uyarısı), kullanıcıya açık, anlaşılır ve eyleme dönüştürülebilir mesajlar sun. Gerekirse supervisor'a otomatik bildirim gönderilmesini sağla. Supabase Edge Functions veya Postgres fonksiyonları ile daha anlamlı hata mesajları döndürülebilir.

5.  **İş Akışı ve Durum Yönetimi Şeffaflığı:**
    *   **Uyarı:** Kullanıcının hangi adımda olduğunu, bir sonraki adımın ne olduğunu veya neden bir adımın bloke olduğunu anlamakta zorlanması verimsizliğe yol açar.
    *   **Öneri:** Her görevin veya siparişin güncel durumu (status) açıkça gösterilmeli. Engellenen bir adımın (örn: `blocked_material`) neden engellendiği (malzeme eksikliği uyarısı) ve nasıl çözülebileceği (supervisor'a bildir) bilgisi anında sunulmalı. İmalat akışını görsel olarak (progress bar, akış diyagramı) göstermek kullanıcı deneyimini artırır.

6.  **Kimlik Doğrulama ve Yetkilendirme (Auth & RLS):**
    *   **Uyarı:** UI'da yetkisiz kullanıcıların yapmaması gereken işlemleri yapmaya çalışmasına izin vermek, hem güvenlik açığı oluşturur hem de gereksiz istek trafiği yaratır.
    *   **Öneri:** Supabase Auth ve RLS (Row Level Security) kurallarını çok iyi kavrayarak, UI'daki düğmeleri, form alanlarını ve veri görünümlerini kullanıcının rolüne ve yetkisine göre dinamik olarak gizle/göster/devre dışı bırak. Bu, gereksiz API çağrılarını önler ve güvenlik katmanını UI'dan başlatır.

---

Bu detaylı raporun, projenin "sıfır inisiyatif" ve "kanıtlı sistem" hedeflerine ulaşmasında ve geçmiş hataların tekrarlanmamasında yol gösterici olmasını umuyorum. Herhangi bir ek danışma veya detaylandırma için hazırım.

Saygılarımla,

GEMİNİ
Veritabanı, Bellek ve Bilgi İşlem Şefi