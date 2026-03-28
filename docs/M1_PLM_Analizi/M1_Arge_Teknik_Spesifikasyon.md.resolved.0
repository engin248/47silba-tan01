# M1 AR-GE (PLM) TEKNİK SPESİFİKASYON, GÖRSEL VE OPERASYON MİMARİSİ

Önceki "Kör Nokta Analiz Raporu"nda teorik ve stratejik olarak kurgulanan kurumsal (Enterprise) R&D mimarisinin **Mizanet Yazılım Altyapısına** (Supabase + Next.js App Router + TailwindCSS) doğrudan entegre edilecek **Teknik, Görsel ve İşlemsel** detayları aşağıda projelendirilmiştir.

---

## 1. GÖRSELLERİN KODA (MİMARİYE) DÖKÜMÜ
Analiz raporunda çizilen o dünya standartlarındaki ekranların ("Dark/Emerald" Kanban Panosu ve "Light" Tech Pack Reçetesi) sistemde yaratacağı React bileşen (Component) hiyerarşisi:

### A) Yüksek Otorite Paneli (Dark Mode - Koordinatör & Şef Görünümü)
*   **Stil Sınıfları (CSS):** `bg-[#0d1117]`, `backdrop-blur-xl bg-black/40`, `border-[#21262d]`, `text-emerald-400`. "Glassmorphism" dediğimiz o yarı saydam kurumsal cam efekti, Supabase üzerinden akan ajan loglarını gösterirken gözü yormaz.
*   **Kanban Board Bileşeni (`<ArgeKanbanBoard />`):** Ürünlerin "Fikir → İstihbarat → Onay Bekleyen → Kesim (M2) Onaylı" sütunlarında yatay olarak listelendiği, "Sürükle & Bırak" (Drag & Drop) destekli interaktif arayüz.
*   **Radar ve İstatistik (`<TrendRadarChart />`):** Recharts kütüphanesi kullanılarak; sosyal ağlardan veya pazar istihbaratından toplanan anahtar kelimelerin (Örn: "Oversize", "Paraşüt Kumaş") yoğunluklarının anlık işlendiği kutup (polar) grafiği.

### B) Saha & Üretim Reçetesi (Light Mode - Atölye/Usta Görünümü)
*   **Yüksek Kontrast (CSS):** Kesimhane veya atölyelerde ekran parlamasını önlemek ve renk kodlarının doğru okunmasını sağlamak için `bg-white`, `border-slate-200`, okunaklı koyu gri `text-slate-900` metinler.
*   **Teknik Föy (Tech Pack) Bileşeni (`<TechPackViewer />`):** Tasarımcıların yüklediği dikiş detayları, ilik-düğme patları, ölçü tablolarının (BOM - Bill of Materials) hatasız devasa bir tablo şeklinde yan yana gösterilmesi.
*   **Zengin Medya Görüntüleyici:** Kumaş yakından çekim (Macro) fotoğraflarının veya varsa dijital kalıp dosyalarının kayıpsız (Supabase Storage üzerinden CDN ile hızlı yakalanmış) yüksek çözünürlüklü görüntülenmesi.

---

## 2. İŞLEMLER (OPERASYONEL AKIŞLAR)
Sistemin içinde verinin nasıl akacağı, onay zincirinin nasıl kırılmadan çalışacağına dair aşamalar:

**İŞLEM 1: İlham (Ideation) ve Ajan İstihbaratı**
1.  Sisteme (Scraper/Ajan) otomatik veya tasarımcı tarafından manuel olarak "Yeni Ürün Eğilimi" girilir.
2.  Sistem bu kaydı, Supabase `arge_trends` tablosuna yazar.
3.  Karargah yöneticisinin ana ekrandaki Kanban panosunun **"İnceleniyor"** sütununa o model anında (Real-time WebSockets ile) "Yeni Bildirim" olarak düşer.

**İŞLEM 2: Karar Cenderesi (Filtreleme ve Onay)**
1.  Koordinatör, ilgili ürün kartının üzerine tıklar. Sağ taraftan açılan geniş panelde (Drawer) kumaş türü, maliyet tahmini ve trend radar gücü görülür.
2.  Koordinatör, modeli "Eleyici" sorulardan geçirir: *Bu bizim kalite mottomuza (NİZAM) uygun mu? Pazar potansiyeli ne?*
3.  Karar verildiyse; kutucuğu (Drag) tutar ve **"Kesim Emri (M2'ye Aktar)"** sütununa sürükler.

**İŞLEM 3: Mizanet Veritabanı (M2) Entegrasyonu**
1.  Ürün "Onaylandı" durumuna geçtiği an (Update API çalışır), Supabase Trigger'ları veya Next.js Backend fonksiyonları otomatik olarak tetiklenir.
2.  Ar-Ge tablosundaki o tasarım, bir kopyasını **`katalog_urunler`** veya **`uretim_emirleri`** (M2 modülü) veritabanına resmî bir sicil fişi açarak kaydeder.
3.  Artık o hayali tasarım, Mizanet üretim bandında (M18/Kameralı sistemlerin izleyeceği bantta) "Gerçek ve Üretilecek" bir mal haline gelmiştir.

---

## 3. TEKNİK ÖZELLİKLER VE MİMARİ GEREKSİNİMLER
Bu sistemin pürüzsüz işlemesi için kodda kurulacak donanımlar:

1.  **Strict State Management (Kesin Durum Yönetimi):** Sürekli akan ajan verilerinin paneli dondurmaması için Zustand veya React Query kullanılarak sayfa "gereksiz yere" tekrar yüklenmekten (re-render) korunur.
2.  **Role-Based Access Control (Rol Bazlı Yönlendirme):** Koordinatör giriş yaptığında sistem teması otomatik olarak *Dark/Emerald* otorite görünümünde başlar. Ancak sistem, giriş yapanın "Numune Kesim Sorumlusu" olduğunu anlarsa ekranı otomatik olarak *Salt White (Light)* temaya ve Tech Pack (Malzeme Listesi) okuma formuna kilitler. O yetkilinin "Onay verme" butonları sistemde donanımsal olarak çizilmez.
3.  **Supabase Real-Time (Postgres Changes):** Sayfayı manuel F5 yapmaya gerek kalmadan (şu an ar-ge sayfanızda yüklü olan sistem gibi), bir tasarım sisteme girdiği, veya bir iptal emri verildiği anda tünelden akan veri arayüzde animasyonla yer değiştirir.
4.  **İmaj Optimizasyonu (Next/Image & Supabase CDN):** Büyük çözünürlüklü dijital tasarım (kumaş) fotoğraflarının, mobil tarafta veya atölye tabletlerinde interneti sömürmemesi için zorunlu (WebP dönüşümlü) kompresyon ile aktarılması.

> **Sonuç:** M1 Modülünün bu spesifikasyonlara göre kodlanması; "fikrin" masadan çıkıp "üretime" girmesi arasındaki o tehlikeli kağıt, kalem ve WhatsApp trafiğini silecek, yerine şeffaf, anlık (Gerçek zamanlı) ve geri dönük hesabı sorulabilir mükemmel bir "Karar Koridoru" inşa edecektir.
