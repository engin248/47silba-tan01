// =========================================================================
// DİL SİSTEMİ - TÜRKÇE (ANA) / ARAPÇA (İKİNCİL)
// Kullanım: import { T, useLang } from '@/lib/lang'
// =========================================================================

export const TRANSLATIONS = {
    tr: {
        // GENEL
        sistem_adi: '47 SİL BAŞTAN',
        sistem_alt: 'Sıfır İnisiyatif / Tam Adalet',
        karargah: 'Karargâh',
        aktif: 'Aktif',
        iptal: 'İptal',
        bekliyor: 'Bekliyor',
        onaylandi: 'Onaylandı',
        kaydet: 'Kaydet',
        sil: 'Sil',
        duzenle: 'Düzenle',
        ekle: 'Ekle',
        tamam: 'Tamam',
        iptal_et: 'İptal Et',
        yükle: 'Yükle',
        ara: 'Ara...',
        filtrele: 'Filtrele',
        tumu: 'Tümü',
        yukleniyor: 'Yükleniyor...',
        hata: 'Hata',
        basarili: 'Başarılı',
        evet: 'Evet',
        hayir: 'Hayır',
        zorunlu: 'Zorunlu alan',
        litre: 'Litre',
        metre: 'Metre',
        adet: 'Adet',
        kg: 'Kg',

        // NAVİGASYON
        nav_karargah: 'Karargâh (Ana Ekran)',
        nav_arge: 'Ar-Ge & Trend (M1)',
        nav_kumas: 'Kumaş & Arşiv (M2)',
        nav_kalip: 'Kalıp & Serileme (M3)',
        nav_modelhane: 'Modelhane & Video (M4)',
        nav_kesim: 'Kesim & Ara İşçilik (M5)',
        nav_uretim: 'Üretim Bandı (M6)',
        nav_maliyet: 'Maliyet Merkezi (M7)',
        nav_muhasebe: 'Muhasebe & Rapor (M8)',
        nav_denetmen: 'Müfettiş (AI)',
        nav_ayarlar: 'Sistem Ayarları',
        nav_personel: 'Personel',

        // M1: AR-GE & TREND
        arge_baslik: 'Ar-Ge & Trend Araştırması',
        arge_alt: 'Pazar analizi ile üretim hedefini belirle. Onaylanmadan model taslağı açılmaz.',
        arge_yeni: 'Yeni Trend Kaydı',
        arge_baslik_alan: 'Trend Başlığı',
        arge_platform: 'Platform',
        arge_kategori: 'Ürün Kategorisi',
        arge_talep_skoru: 'Pazar Talep Skoru (1-10)',
        arge_referans_link: 'Referans Link',
        arge_gorsel: 'Görsel URL',
        arge_aciklama: 'Açıklama / Not',
        arge_durum: 'Durum',
        arge_kaydet: 'Trendi Kaydet',
        arge_onayla: 'Onayla → Tasarıma Gönder',
        arge_inceleniyor: 'İnceleniyor',
        arge_onaylandi: 'Onaylandı',
        arge_iptal_edildi: 'İptal Edildi',

        // Platform seçenekleri
        platform_trendyol: 'Trendyol',
        platform_amazon: 'Amazon',
        platform_instagram: 'Instagram',
        platform_pinterest: 'Pinterest',
        platform_diger: 'Diğer',

        // Kategori seçenekleri
        kat_gomlek: 'Gömlek',
        kat_pantolon: 'Pantolon',
        kat_elbise: 'Elbise',
        kat_dis_giyim: 'Dış Giyim',
        kat_spor: 'Spor / Activewear',
        kat_ic_giyim: 'İç Giyim',
        kat_aksesuar: 'Aksesuar',
        kat_diger: 'Diğer',

        // M2: KUMAŞ ARŞİVİ
        kumas_baslik: 'Kumaş & Materyal Arşivi',
        kumas_alt: 'Dijital kartela. Modele hangi kumaşın gideceği buradan seçilir.',
        kumas_yeni: 'Yeni Kumaş / Aksesuar Ekle',
        kumas_kodu: 'Kumaş Kodu (Benzersiz)',
        kumas_adi: 'Kumaş Adı',
        kumas_tipi: 'Kumaş Tipi',
        kumas_kompozisyon: 'Kompozisyon (Örn: %100 Pamuk)',
        kumas_birim_maliyet: 'Birim Maliyet (TL/Metre)',
        kumas_genislik: 'Genişlik (cm)',
        kumas_gramaj: 'Gramaj (gr/m²)',
        kumas_esneme: 'Esneme Payı (%)',
        kumas_renkler: 'Mevcut Renkler',
        kumas_fotograf: 'Fotoğraf URL',
        kumas_tedarikci: 'Tedarikçi Adı',
        kumas_stok: 'Mevcut Stok (Metre)',
        kumas_min_stok: 'Minimum Stok Eşiği (Metre)',
        kumas_stok_durum: 'Stok Durumu',
        kumas_stok_alarm: '⚠️ DÜŞÜK STOK!',
        aksesuar_baslik: 'Aksesuar Arşivi',

        // M3
        kalip_baslik: 'Kalıp & Serileme',
        kalip_alt: 'Model taslağından kalıp çıkar, beden serileme yap.',

        // M4
        modelhane_baslik: 'Modelhane — İlk Numune & Video Kanıt',
        modelhane_alt: 'Fasoncuya mal vermeden önce 1 adet kendi içimizde dikip VİDEOYA çekiyoruz.',
        modelhane_video_uyari: '🔴 Video kanıtı yüklenmeden fason üretim başlatılamaz!',
        modelhane_video_yukle: 'Video Kanıtını Yükle',
        modelhane_adim_ekle: 'İşlem Adımı Ekle',

        // M5
        kesim_baslik: 'Kesim & Ara İşçilik',
        kesim_alt: 'Numune onayından sonra kumaş kesilir, ara işçilik planlanır.',

        // M6 - Üretim Bandı Departmanları
        uretim_baslik: 'Üretim Bandı',
        dept_a: 'İş Emri',
        dept_b: 'Usta & Makine Eşleştirme',
        dept_c: 'Operasyon & Vicdan',
        dept_d: 'Maliyet Merkezi',
        dept_e: 'Muhasebe & Devir',

        // Duruş Tipleri
        durus_elk: 'Elektrik Kesintisi',
        durus_mkn: 'Makine Arızası',
        durus_mlz: 'Malzeme Eksikliği',
        durus_kisisel: 'Kişisel Hata',
        durus_tuvalet: 'Tuvalet Molası',
        durus_ogle: 'Öğle Molası',
        durus_etkisi_hayir: 'İşçiyi Etkilemez',
        durus_etkisi_evet: 'İşçi FPY Düşer',

        // Liyakat Seviyeleri
        liyakat_acemi: 'Acemi',
        liyakat_orta: 'Orta',
        liyakat_kidemli: 'Kıdemli',
        liyakat_usta: 'Usta',

        // Uyarılar
        uyari_kritik: '🔴 KRİTİK',
        uyari_uyari: '🟡 UYARI',
        uyari_bilgi: '🔵 BİLGİ',
        uyari_coz: 'Çözüldü İşaretle',
    },

    // =========================================================================
    ar: {
        // GENEL
        sistem_adi: '47 ابدأ من جديد',
        sistem_alt: 'صفر مبادرة / عدالة كاملة',
        karargah: 'المقر الرئيسي',
        aktif: 'نشط',
        iptal: 'ملغي',
        bekliyor: 'في الانتظار',
        onaylandi: 'تمت الموافقة',
        kaydet: 'حفظ',
        sil: 'حذف',
        duzenle: 'تعديل',
        ekle: 'إضافة',
        tamam: 'موافق',
        iptal_et: 'إلغاء',
        yükle: 'رفع',
        ara: 'بحث...',
        filtrele: 'تصفية',
        tumu: 'الكل',
        yukleniyor: 'جار التحميل...',
        hata: 'خطأ',
        basarili: 'نجح',
        evet: 'نعم',
        hayir: 'لا',
        zorunlu: 'حقل إلزامي',
        litre: 'لتر',
        metre: 'متر',
        adet: 'قطعة',
        kg: 'كغم',

        // NAVİGASYON
        nav_karargah: 'المقر الرئيسي',
        nav_arge: 'بحث وتطوير (M1)',
        nav_kumas: 'أرشيف الأقمشة (M2)',
        nav_kalip: 'القالب والتسلسل (M3)',
        nav_modelhane: 'النموذج والفيديو (M4)',
        nav_kesim: 'القطع والتشطيب (M5)',
        nav_uretim: 'خط الإنتاج (M6)',
        nav_maliyet: 'مركز التكلفة (M7)',
        nav_muhasebe: 'المحاسبة والتقرير (M8)',
        nav_denetmen: 'المفتش (AI)',
        nav_ayarlar: 'إعدادات النظام',
        nav_personel: 'الموظفون',

        // M1: AR-GE & TREND
        arge_baslik: 'بحث وتطوير وأبحاث الاتجاهات',
        arge_alt: 'حدد هدف الإنتاج من خلال تحليل السوق. لا يمكن فتح مسودة النموذج دون موافقة.',
        arge_yeni: 'تسجيل اتجاه جديد',
        arge_baslik_alan: 'عنوان الاتجاه',
        arge_platform: 'المنصة',
        arge_kategori: 'فئة المنتج',
        arge_talep_skoru: 'درجة الطلب في السوق (1-10)',
        arge_referans_link: 'رابط مرجعي',
        arge_gorsel: 'رابط الصورة',
        arge_aciklama: 'الوصف / الملاحظات',
        arge_durum: 'الحالة',
        arge_kaydet: 'حفظ الاتجاه',
        arge_onayla: 'موافقة → إرسال للتصميم',
        arge_inceleniyor: 'قيد المراجعة',
        arge_onaylandi: 'تمت الموافقة',
        arge_iptal_edildi: 'ملغي',

        // Platform
        platform_trendyol: 'ترندیول',
        platform_amazon: 'أمازون',
        platform_instagram: 'إنستغرام',
        platform_pinterest: 'بينتريست',
        platform_diger: 'أخرى',

        // Kategori
        kat_gomlek: 'قميص',
        kat_pantolon: 'بنطلون',
        kat_elbise: 'فستان',
        kat_dis_giyim: 'ملابس خارجية',
        kat_spor: 'ملابس رياضية',
        kat_ic_giyim: 'ملابس داخلية',
        kat_aksesuar: 'إكسسوارات',
        kat_diger: 'أخرى',

        // M2
        kumas_baslik: 'أرشيف الأقمشة والمواد',
        kumas_alt: 'عينة رقمية. يتم اختيار القماش المناسب لكل نموذج من هنا.',
        kumas_yeni: 'إضافة قماش / إكسسوار جديد',
        kumas_kodu: 'رمز القماش (فريد)',
        kumas_adi: 'اسم القماش',
        kumas_tipi: 'نوع القماش',
        kumas_kompozisyon: 'التركيب (مثال: 100% قطن)',
        kumas_birim_maliyet: 'التكلفة للوحدة (ليرة/متر)',
        kumas_genislik: 'العرض (سم)',
        kumas_gramaj: 'الوزن (غ/م²)',
        kumas_esneme: 'هامش المرونة (%)',
        kumas_renkler: 'الألوان المتاحة',
        kumas_fotograf: 'رابط الصورة',
        kumas_tedarikci: 'اسم المورد',
        kumas_stok: 'المخزون الحالي (متر)',
        kumas_min_stok: 'حد المخزون الأدنى (متر)',
        kumas_stok_durum: 'حالة المخزون',
        kumas_stok_alarm: '⚠️ مخزون منخفض!',
        aksesuar_baslik: 'أرشيف الإكسسوارات',

        // M3
        kalip_baslik: 'القالب والتسلسل',
        kalip_alt: 'استخرج القالب من مسودة النموذج، وقم بعمل توليف المقاسات.',

        // M4
        modelhane_baslik: 'مرحلة النمذجة — العينة الأولى ودليل الفيديو',
        modelhane_alt: 'قبل تسليم البضاعة للمقاول، نخيط قطعة واحدة داخلياً ونصورها بالفيديو.',
        modelhane_video_uyari: '🔴 لا يمكن بدء إنتاج المقاول دون رفع دليل الفيديو!',
        modelhane_video_yukle: 'رفع دليل الفيديو',
        modelhane_adim_ekle: 'إضافة خطوة عملية',

        // M5
        kesim_baslik: 'القطع والتشطيب الوسيط',
        kesim_alt: 'بعد الموافقة على العينة، يُقطع القماش ويُخطط التشطيب الوسيط.',

        // M6
        uretim_baslik: 'خط الإنتاج',
        dept_a: 'أمر العمل',
        dept_b: 'مطابقة الأستاذ والآلة',
        dept_c: 'العمليات والضمير',
        dept_d: 'مركز التكلفة',
        dept_e: 'المحاسبة والتحويل',

        // Duruş
        durus_elk: 'انقطاع الكهرباء',
        durus_mkn: 'عطل في الآلة',
        durus_mlz: 'نقص المواد',
        durus_kisisel: 'خطأ شخصي',
        durus_tuvalet: 'استراحة الحمام',
        durus_ogle: 'استراحة الغداء',
        durus_etkisi_hayir: 'لا يؤثر على العامل',
        durus_etkisi_evet: 'ينخفض FPY العامل',

        // Liyakat
        liyakat_acemi: 'مبتدئ',
        liyakat_orta: 'متوسط',
        liyakat_kidemli: 'أقدمية',
        liyakat_usta: 'أستاذ',

        // Uyarılar
        uyari_kritik: '🔴 حرج',
        uyari_uyari: '🟡 تحذير',
        uyari_bilgi: '🔵 معلومة',
        uyari_coz: 'تعليم كمحلول',
    }
};

// Ana çeviri fonksiyonu
export function T(key, lang = 'tr') {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['tr']?.[key] || key;
}

// Dil yönü (RTL/LTR)
export function langDir(lang) {
    return lang === 'ar' ? 'rtl' : 'ltr';
}

// Mevcut dil seçenekleri
export const LANGS = [
    { code: 'tr', label: 'TR', flag: '🇹🇷', name: 'Türkçe' },
    { code: 'ar', label: 'AR', flag: '🇸🇦', name: 'العربية' },
];
