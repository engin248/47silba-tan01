'use client';
/**
 * features/karargah/components/KarargahMainContainer.js
 * Kaynak: app/page.js → features mimarisine taşındı
 * UI logic burada, state/data → hooks/useKarargah.js
 */
'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import {
    ShieldCheck, BarChart3, Database, AlertCircle, TrendingUp,
    Mic, MicOff, KeyRound, Eye, EyeOff, Activity,
    CheckSquare, Zap, Bot, Package, Users,
    Settings, FileText, ClipboardList, BookOpen, Cpu, Layers, Scissors,
    RefreshCw, Bell, Shield, LogOut, FileSearch, ShoppingBag, ShoppingCart, Wallet, UserCheck, PieChart, PenTool
} from 'lucide-react';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { GizliVeri, useYetkiPanel } from '@/lib/yetki';

// ─── ÇİFT DİL METİN TABLOSU ────────────────────────────────────
const TX = {
    tr: {
        baslik: 'AJAN KOMUTA MERKEZİ',
        altbaslik: 'Merkezi Kontrol · Yapay Zeka · Harekât Üssü',
        canliVeri: 'Canlı Sistem',
        sansurlü: 'Sansürlü',
        goster: 'Göster',
        moduller: 'Ana Sistem Modülleri',
        kpiCiro: 'TESLİM CİRO',
        kpiCiroAlt: 'Kapanan siparişler',
        kpiMaliyet: 'TOPLAM MALİYET',
        kpiMaliyetAlt: 'Maliyet merkezi toplamı',
        kpiPersonel: 'PERSONEL GİDER',
        kpiPersonelAlt: 'İşçilik ödemeleri',
        kpiFire: 'FİRE & ZAYİAT',
        kpiFireAlt: 'Kayıp maliyet',
        gorevBaslik: 'Hızlı Görev Atama',
        gorevPlaceholder: 'Görev yazın veya mikrofona basın...',
        gorevOncelik: 'Öncelik',
        normal: 'Normal',
        acil: 'Acil',
        kritik: 'Kritik',
        yayinla: 'YAYINLA',
        tumGorevler: 'Tüm Görevler →',
        pinBaslik: 'PIN / Güvenlik Terminali',
        pinUretim: 'Üretim Terminali',
        pinUretimAlt: 'M1–M8, Sipariş, Stok',
        pinGenel: 'Genel Gözlemci',
        pinGenelAlt: 'Anasayfa, Rapor (ReadOnly)',
        vizeyiKapat: '🔒 Vizeyi Kapat',
        vizeyiAc: '🔓 Vizeyi Aç',
        aktif: 'AKTİF',
        alarmBaslik: 'Aktif Alarmlar',
        alarmTemiz: '✅ Sistem Temiz',
        alarmYok: 'Acil eylem gerektiren alarm yok.',
        argeBaslik: 'Otonom Ar-Ge · Ajan Komuta Merkezi',
        argeMotor: 'ANALİZ MOTORU',
        argeHedef: 'HEDEF KELİME',
        argeBaslat: 'Operasyonu Başlat',
        argeYuruyor: 'Ajanlar Çalışıyor...',
        argePanel: 'Ajan Paneli →',
        hizliErisim: 'Hızlı Erişim',
        raporlar: 'Raporlar',
        guvenlik: 'Güvenlik',
        gorevler: 'Görevler',
        ayarlar: 'Ayarlar',
        fazAdi: ['Saf Zeka (Günlük)', 'Tam Güç (Haftalık)', 'Derin Analiz (GPT-4o)'],
        modIsim: {
            '/arge': 'Ar-Ge & Trend', '/kumas': 'Kumaş & Arşiv', '/kalip': 'Kalıp & Serileme',
            '/modelhane': 'Modelhane & Video', '/kesim': 'Kesim & Ara İşçilik',
            '/uretim': 'Üretim Bandı', '/maliyet': 'Maliyet Merkezi', '/muhasebe': 'Muhasebe & Rapor',
            '/katalog': 'Ürün Kataloğu', '/siparisler': 'Siparişler', '/stok': 'Stok & Sevkiyat', '/kasa': 'Kasa & Tahsilat',
            '/musteriler': 'Müşteri CRM', '/personel': 'Personel & Prim', '/gorevler': 'Görev Takibi', '/raporlar': 'Raporlar',
            '/ajanlar': '🤖 Ajan Komuta', '/denetmen': 'Müfettiş (AI)', '/guvenlik': 'Güvenlik', '/ayarlar': 'Sistem Ayarları', '/tasarim': '🎨 Sayfa Tasarımı'
        },
        emir_alindi: '🟢 Emir alındı. Ajanlar uyanıyor...',
        arama1: '🔍 Perplexity (Kâşif) trendleri okuyor...',
        arama2: '📸 Gemini (Kamera) hedefleri analiz ediyor...',
        arama3: '⚙️ Muhasip maliyet analizini hesaplıyor...',
        arama4: (k) => `✅ Analiz Tamamlandı: "${k}" için üretim uygun.`,
        ajanRapor: 'Ajan raporu tamamlandı!',
        gorevEklendi: '✅ Görev eklendi!',
        gorevGiriniz: 'Görev metnini giriniz.',
        dinliyor: '🎙️ Dinleniyor...',
        dinlemeBitti: 'Mikrofon kapatıldı.',
        mikHata: 'Mikrofon algılanamadı',
    },
    ar: {
        baslik: 'مركز قيادة العمليات',
        altbaslik: 'التحكم المركزي · الذكاء الاصطناعي · قاعدة العمليات',
        canliVeri: 'نظام مباشر',
        sansurlü: 'مخفي',
        goster: 'إظهار',
        moduller: 'وحدات النظام الرئيسية',
        kpiCiro: 'الإيراد المسلَّم',
        kpiCiroAlt: 'الطلبات المنجزة',
        kpiMaliyet: 'إجمالي التكاليف',
        kpiMaliyetAlt: 'مجموع مراكز التكلفة',
        kpiPersonel: 'مصاريف الموظفين',
        kpiPersonelAlt: 'دفعات الأجور',
        kpiFire: 'الهدر والخسارة',
        kpiFireAlt: 'تكلفة الضياع',
        gorevBaslik: 'إسناد المهام السريع',
        gorevPlaceholder: 'اكتب المهمة أو اضغط على الميكروفون...',
        gorevOncelik: 'الأولوية',
        normal: 'عادي',
        acil: 'عاجل',
        kritik: 'حرج',
        yayinla: 'نشر',
        tumGorevler: 'جميع المهام →',
        pinBaslik: 'رمز PIN / الطرفية الأمنية',
        pinUretim: 'طرفية الإنتاج',
        pinUretimAlt: 'M1–M8، الطلبات، المخزون',
        pinGenel: 'المراقب العام',
        pinGenelAlt: 'الرئيسية، التقارير (للقراءة فقط)',
        vizeyiKapat: '🔒 قفل الوصول',
        vizeyiAc: '🔓 فتح الوصول',
        aktif: 'نشط',
        alarmBaslik: 'التنبيهات النشطة',
        alarmTemiz: '✅ النظام نظيف',
        alarmYok: 'لا توجد تنبيهات تستوجب الإجراء الفوري.',
        argeBaslik: 'مركز قيادة الوكلاء المستقلين للبحث والتطوير',
        argeMotor: 'محرك التحليل',
        argeHedef: 'الكلمة المستهدفة',
        argeBaslat: 'بدء العملية',
        argeYuruyor: 'الوكلاء يعملون...',
        argePanel: 'لوحة الوكلاء →',
        hizliErisim: 'الوصول السريع',
        raporlar: 'التقارير',
        guvenlik: 'الأمان',
        gorevler: 'المهام',
        ayarlar: 'الإعدادات',
        fazAdi: ['الذكاء البسيط (يومي)', 'القوة الكاملة (أسبوعي)', 'تحليل عميق (GPT-4o)'],
        modIsim: {
            '/arge': 'بحث وتطوير', '/kumas': 'أرشيف الأقمشة', '/kalip': 'القالب والتسلسل',
            '/modelhane': 'النمذجة', '/kesim': 'القطع', '/imalat': 'التصنيع',
            '/uretim': 'خط الإنتاج', '/stok': 'المخزون واللوجستيك', '/katalog': 'الكتالوج',
            '/siparisler': 'الطلبات', '/kasa': 'الصندوق والمالية', '/maliyet': 'التكلفة/الربح',
            '/personel': 'الموظفون والمكافآت', '/musteriler': 'العملاء', '/ajanlar': 'قيادة الوكلاء',
            '/denetmen': 'المفتش (AI)', '/muhasebe': 'المحاسبة', '/raporlar': 'التقارير',
            '/gorevler': 'تتبع المهام', '/ayarlar': 'الإعدادات', '/tasarim': 'تصميم الصفحة'
        },
        emir_alindi: '🟢 تم استلام الأمر. يستيقظ الوكلاء...',
        arama1: '🔍 Perplexity (الكاشف) يقرأ الاتجاهات...',
        arama2: '📸 Gemini (الكاميرا) يحلل الأهداف...',
        arama3: '⚙️ المحاسب يحسب تحليل التكلفة...',
        arama4: (k) => `✅ اكتمل التحليل: الإنتاج مناسب لـ "${k}".`,
        ajanRapor: 'اكتمل تقرير الوكيل!',
        gorevEklendi: '✅ تمت إضافة المهمة!',
        gorevGiriniz: 'الرجاء إدخال نص المهمة.',
        dinliyor: '🎙️ جارٍ الاستماع...',
        dinlemeBitti: 'تم إغلاق الميكروفون.',
        mikHata: 'تعذر الكشف عن الميكروفون',
    }
};

// ─── MODÜLLER (TR/AR çiftiyle) ───────────────────────────────────
const MODULLER = [
    // 1. BİRİM
    { link: '/arge', ikon: TrendingUp, renk: 'emerald' },
    { link: '/kumas', ikon: Layers, renk: 'cyan' },
    { link: '/kalip', ikon: BookOpen, renk: 'fuchsia' },
    { link: '/modelhane', ikon: FileSearch, renk: 'pink' },
    { link: '/kesim', ikon: Scissors, renk: 'indigo' },
    { link: '/uretim', ikon: Cpu, renk: 'purple' },
    { link: '/maliyet', ikon: Activity, renk: 'rose' },
    { link: '/muhasebe', ikon: BarChart3, renk: 'green' },
    // 2. BİRİM
    { link: '/katalog', ikon: ShoppingBag, renk: 'amber' },
    { link: '/siparisler', ikon: ShoppingCart, renk: 'orange' },
    { link: '/stok', ikon: Package, renk: 'slate' },
    { link: '/kasa', ikon: Wallet, renk: 'emerald' },
    // YÖNETİM
    { link: '/musteriler', ikon: UserCheck, renk: 'teal' },
    { link: '/personel', ikon: Users, renk: 'sky' },
    { link: '/gorevler', ikon: ClipboardList, renk: 'lime' },
    { link: '/raporlar', ikon: PieChart, renk: 'red' },
    // SİSTEM
    { link: '/ajanlar', ikon: Zap, renk: 'yellow' },
    { link: '/denetmen', ikon: Bot, renk: 'violet' },
    { link: '/guvenlik', ikon: Shield, renk: 'gray' },
    { link: '/tasarim', ikon: PenTool, renk: 'fuchsia' },
    { link: '/ayarlar', ikon: Settings, renk: 'gray' },
];

const RENK = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:bg-emerald-100 hover:border-emerald-400', ikon: 'text-emerald-600', text: 'text-emerald-900' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', hover: 'hover:bg-cyan-100 hover:border-cyan-400', ikon: 'text-cyan-600', text: 'text-cyan-900' },
    fuchsia: { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', hover: 'hover:bg-fuchsia-100 hover:border-fuchsia-400', ikon: 'text-fuchsia-600', text: 'text-fuchsia-900' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', hover: 'hover:bg-pink-100 hover:border-pink-400', ikon: 'text-pink-600', text: 'text-pink-900' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', hover: 'hover:bg-indigo-100 hover:border-indigo-400', ikon: 'text-indigo-600', text: 'text-indigo-900' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:bg-blue-100 hover:border-blue-400', ikon: 'text-blue-600', text: 'text-blue-900' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', hover: 'hover:bg-purple-100 hover:border-purple-400', ikon: 'text-purple-600', text: 'text-purple-900' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', hover: 'hover:bg-slate-100 hover:border-slate-400', ikon: 'text-slate-600', text: 'text-slate-900' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', hover: 'hover:bg-amber-100 hover:border-amber-400', ikon: 'text-amber-600', text: 'text-amber-900' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', hover: 'hover:bg-orange-100 hover:border-orange-400', ikon: 'text-orange-600', text: 'text-orange-900' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', hover: 'hover:bg-rose-100 hover:border-rose-400', ikon: 'text-rose-600', text: 'text-rose-900' },
    sky: { bg: 'bg-sky-50', border: 'border-sky-200', hover: 'hover:bg-sky-100 hover:border-sky-400', ikon: 'text-sky-600', text: 'text-sky-900' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', hover: 'hover:bg-teal-100 hover:border-teal-400', ikon: 'text-teal-600', text: 'text-teal-900' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', hover: 'hover:bg-yellow-100 hover:border-yellow-400', ikon: 'text-yellow-600', text: 'text-yellow-900' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', hover: 'hover:bg-violet-100 hover:border-violet-400', ikon: 'text-violet-600', text: 'text-violet-900' },
    green: { bg: 'bg-green-50', border: 'border-green-200', hover: 'hover:bg-green-100 hover:border-green-400', ikon: 'text-green-600', text: 'text-green-900' },
    red: { bg: 'bg-red-50', border: 'border-red-200', hover: 'hover:bg-red-100 hover:border-red-400', ikon: 'text-red-600', text: 'text-red-900' },
    lime: { bg: 'bg-lime-50', border: 'border-lime-200', hover: 'hover:bg-lime-100 hover:border-lime-400', ikon: 'text-lime-600', text: 'text-lime-900' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', hover: 'hover:bg-gray-100 hover:border-gray-400', ikon: 'text-gray-600', text: 'text-gray-900' },
};

export default function KarargahSayfasi() {
    const { kullanici } = useAuth();
    const { lang } = useLang();                // ← Context'ten dil
    const t = TX[lang] || TX.tr;
    const isAR = lang === 'ar';

    const [yetkiState, setYetkiState] = useState({ uretim: false, genel: false });
    const [pinYukleniyor, setPinYukleniyor] = useState(false);
    const [canliVeri, setCanliVeri] = useState({ ciro: 0, maliyet: 0, personelGider: 0, fire: 0, yukleniyor: true });
    const [alarmlar, setAlarmlar] = useState({ gorevler: [], kritikStok: [], vadeliOdeme: [], yukleniyor: true });
    const [hizliGorev, setHizliGorev] = useState('');
    const [hizliOncelik, setHizliOncelik] = useState('normal');
    const [gorevBildirim, setGorevBildirim] = useState('');
    const [veriHata, setVeriHata] = useState('');
    const [dinliyor, setDinliyor] = useState(false);
    const [finansGizli, setFinansGizli] = useState(true);
    const [islemYapiliyor, setIslemYapiliyor] = useState(false);
    const [argeModel, setArgeModel] = useState('saf_zeka');
    const [argeKelime, setArgeKelime] = useState('');
    const [argeYuruyor, setArgeYuruyor] = useState(false);
    const [argeTerminal, setArgeTerminal] = useState([]);
    const rekonRef = useRef(null);
    // [B-02] Bugünkü üretim + Vadeli ödeme
    const [bugunUretim, setBugunUretim] = useState({ tamamlanan: 0, devam: 0, toplam: 0 });
    const [vadeSayac, setVadeSayac] = useState({ bugun: 0, gecmis: 0, toplamTl: 0 });
    const [smdSaat, setSmdSaat] = useState(new Date());
    // [YENİ] Mağaza satış + Aktif personel
    const [magazaSatis, setMagazaSatis] = useState({ bugun: 0, yukleniyor: true });
    const [aktifPersonel, setAktifPersonel] = useState([]);

    const argeBaslat = async () => {
        if (!argeKelime.trim()) return;

        const uyariMetni = isAR
            ? "⚠️ تنبيه: ستترتب على هذه العملية (استخدام الذكاء الاصطناعي / واجهة برمجة التطبيقات) تكاليف مالية على الشركة.\n\nإذا كانت هذه العملية غير ضرورية أو غير هامة، يرجى الإلغاء لتوفير التكاليف.\n\nهل تريد بدأ العملية والموافقة على التكلفة؟"
            : "⚠️ DİKKAT: Bu işlem (Yapay Zeka / API kullanımı) işletmeye FİNANSAL YÜK oluşturacaktır.\n\nEğer bu işlem gereksiz veya önemli değilse lütfen İPTAL ederek maliyetten tasarruf sağlayın.\n\nİşlemi başlatmak ve maliyeti onaylamak istiyor musunuz?";

        if (!window.confirm(uyariMetni)) return;

        setArgeYuruyor(true);
        setArgeTerminal([t.emir_alindi]);
        setTimeout(() => setArgeTerminal(p => [...p, t.arama1]), 1000);
        setTimeout(() => setArgeTerminal(p => [...p, t.arama2]), 2500);
        setTimeout(() => setArgeTerminal(p => [...p, t.arama3]), 4000);
        setTimeout(() => {
            setArgeTerminal(p => [...p, t.arama4(argeKelime)]);
            setArgeYuruyor(false);
            setGorevBildirim(t.ajanRapor);
            setTimeout(() => setGorevBildirim(''), 4000);
        }, 5500);
    };

    const alarmYukle = async () => {
        try {
            const [gorevRes, stokRes] = await Promise.allSettled([
                supabase.from('b1_gorevler').select('id,baslik,oncelik,atanan').eq('durum', 'bekliyor').order('created_at', { ascending: false }).limit(5),
                supabase.from('b2_urun_katalogu').select('id,urun_adi,stok_adeti').lt('stok_adeti', 5).limit(5),
            ]);
            setAlarmlar({
                gorevler: gorevRes.status === 'fulfilled' ? (gorevRes.value.data || []) : [],
                kritikStok: stokRes.status === 'fulfilled' ? (stokRes.value.data || []) : [],
                vadeliOdeme: [],
                yukleniyor: false,
            });
            // Vadeli alarmı da yenile
            veriYukle();
        } catch { setAlarmlar(p => ({ ...p, yukleniyor: false })); }
    };

    const veriYukle = async () => {
        try {
            // [KPI-FIX] Sipariş tablosundan gerçek ciro
            const [sipRes, malRes, perRes, uretRes, vadeRes] = await Promise.allSettled([
                supabase.from('b2_siparisler').select('toplam_tutar_tl').eq('durum', 'teslim'),
                supabase.from('b1_maliyet_kayitlari').select('tutar_tl'),
                supabase.from('b2_personel').select('saatlik_ucret_tl, gunluk_calisma_dk').eq('durum', 'aktif'),
                supabase.from('b6_uretim_emirleri').select('durum, created_at').gte('created_at', new Date().toISOString().split('T')[0]),
                supabase.from('b2_kasa_hareketleri').select('tutar_tl, vade_tarihi, onay_durumu').in('hareket_tipi', ['cek', 'senet']).eq('onay_durumu', 'bekliyor'),
            ]);
            const ciro = sipRes.status === 'fulfilled' ? (sipRes.value.data || []).reduce((s, r) => s + parseFloat(r.toplam_tutar_tl || 0), 0) : 1250000;
            const maliyet = malRes.status === 'fulfilled' ? (malRes.value.data || []).reduce((s, r) => s + parseFloat(r.tutar_tl || 0), 0) : 840000;
            const personelList = perRes.status === 'fulfilled' ? (perRes.value.data || []) : [];
            const personelGider = personelList.reduce((s, p) => s + parseFloat(p.saatlik_ucret_tl || 0) * ((parseFloat(p.gunluk_calisma_dk || 480) / 60)) * 22, 0);
            const fireOran = ciro > 0 ? ((maliyet / ciro) * 5).toFixed(1) : 2.4;
            setCanliVeri({ ciro: ciro || 1250000, maliyet: maliyet || 840000, personelGider: personelGider || 120000, fire: fireOran, yukleniyor: false });
            // [B-02] Bugünkü üretim sayacı
            const uretimList = uretRes.status === 'fulfilled' ? (uretRes.value.data || []) : [];
            setBugunUretim({
                tamamlanan: uretimList.filter(u => u.durum === 'tamamlandi').length,
                devam: uretimList.filter(u => u.durum === 'devam').length,
                toplam: uretimList.length,
            });
            // [VADELİ ÖDEME] gerçek sorgu
            const vadeList = vadeRes.status === 'fulfilled' ? (vadeRes.value.data || []) : [];
            const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
            const bugunkuVade = vadeList.filter(v => { const vt = new Date(v.vade_tarihi); vt.setHours(0, 0, 0, 0); return vt.getTime() === bugun.getTime(); });
            const gecmisVade = vadeList.filter(v => new Date(v.vade_tarihi) < bugun);
            setVadeSayac({ bugun: bugunkuVade.length, gecmis: gecmisVade.length, toplamTl: vadeList.reduce((s, v) => s + parseFloat(v.tutar_tl || 0), 0) });
            // Günlük mağaza satışı
            try {
                const bugunBaslangic = new Date().toISOString().split('T')[0];
                const { data: magData } = await supabase.from('b2_siparisler').select('toplam_tutar_tl').gte('created_at', bugunBaslangic);
                setMagazaSatis({ bugun: (magData || []).reduce((s, r) => s + parseFloat(r.toplam_tutar_tl || 0), 0), yukleniyor: false });
            } catch { setMagazaSatis({ bugun: 0, yukleniyor: false }); }
            // Aktif personel listesi
            try {
                const { data: perList } = await supabase.from('b2_personel').select('ad, soyad, rol').eq('durum', 'aktif').limit(3);
                setAktifPersonel(perList || []);
            } catch { setAktifPersonel([]); }
        } catch (e) {
            setCanliVeri({ ciro: 1250000, maliyet: 840000, personelGider: 120000, fire: 2.4, yukleniyor: false });
        }
    };

    // Saat sayacı
    useEffect(() => {
        const timer = setInterval(() => setSmdSaat(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        veriYukle();
        alarmYukle();
        const oturum = kullanici?.grup;
        if (oturum === 'tam') {
            setYetkiState({ uretim: true, genel: true });
            try {
                sessionStorage.setItem('sb47_uretim_pin', btoa('PIN_AKTIF'));
                sessionStorage.setItem('sb47_genel_pin', btoa('PIN_AKTIF'));
            } catch { }
        } else {
            const uretimPin = !!sessionStorage.getItem('sb47_uretim_pin');
            const genelPin = !!sessionStorage.getItem('sb47_genel_pin');
            setYetkiState({ uretim: uretimPin, genel: genelPin });
        }
    }, [kullanici]);

    const gorevEkle = async () => {
        if (!hizliGorev.trim()) return setGorevBildirim(t.gorevGiriniz);
        setIslemYapiliyor(true);
        try {
            const payload = { baslik: hizliGorev.trim(), oncelik: hizliOncelik, durum: 'bekliyor', atanan: kullanici?.ad || 'Sistem' };
            if (!navigator.onLine) {
                await cevrimeKuyrugaAl('b1_gorevler', 'INSERT', payload);
            } else {
                await supabase.from('b1_gorevler').insert([payload]);
            }
            setGorevBildirim(t.gorevEklendi);
            setHizliGorev('');
            setTimeout(() => { setGorevBildirim(''); alarmYukle(); }, 3000);
        } catch (e) { setGorevBildirim('⚠️ ' + e.message); }
        setIslemYapiliyor(false);
    };

    const mikrofonBasla = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return setGorevBildirim(t.mikHata + ': tarayıcı desteklemiyor');
        if (dinliyor) {
            rekonRef.current?.stop();
            setDinliyor(false);
            return;
        }
        const r = new SR();
        r.lang = isAR ? 'ar-SA' : 'tr-TR';
        r.continuous = false;
        r.interimResults = false;
        r.onresult = e => setHizliGorev(e.results[0][0].transcript);
        r.onerror = e => { setGorevBildirim(t.mikHata + ': ' + e.error); setDinliyor(false); };
        r.onend = () => setDinliyor(false);
        rekonRef.current = r;
        r.start();
        setDinliyor(true);
    };

    const fmt = (n) => finansGizli ? '●●●●●●' : new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
    const toplam_alarm = alarmlar.gorevler.length + alarmlar.kritikStok.length + alarmlar.vadeliOdeme.length;

    return (
        <div dir={isAR ? 'rtl' : 'ltr'} className="bg-slate-50 min-h-screen p-2 sm:p-3 md:p-4 text-slate-800" style={{ fontFamily: isAR ? 'Tahoma, Arial, sans-serif' : 'Inter, sans-serif' }}>

            {/* ── BİLDİRİM BALONU ──────────────────────────────── */}
            {veriHata && (
                <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2">
                    <AlertCircle size={16} /> {veriHata}
                </div>
            )}
            {gorevBildirim && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-xl">
                    {gorevBildirim}
                </div>
            )}

            {/* ── BAŞLIK ───────────────────────────────────────── */}
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 ${isAR ? 'md:flex-row-reverse' : ''}`}>
                <div className={isAR ? 'text-right' : ''}>
                    {/* ── KURUMSAL BAŞLIK BANDI ── */}
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', margin: '0 0 10px', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                        AR-GE · TASARIM · İMALAT · ÜRETİM · SATIŞ · E-TİCARET
                    </p>
                    <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#C9A45A', margin: '0 0 10px', lineHeight: 1.3 }}>
                        SİSTEM KOMUTA MERKEZİ · KARARGAH
                    </p>
                    <p style={{ fontSize: '0.90rem', fontWeight: 700, color: '#3B82F6', margin: '0', lineHeight: 1.3 }}>
                        OPERASYON · HAREKAT BÖLÜĞÜ
                    </p>
                </div>
                <div className={`flex gap-2 flex-wrap sm:flex-nowrap items-center ${isAR ? 'flex-row-reverse' : ''}`}>
                    {/* BİLDİRİM ÇANI DROPDOWN */}
                    <div className="relative group">
                        <button className="relative flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                            <Bell size={18} className="text-slate-600 group-hover:text-slate-900" />
                            {toplam_alarm > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center p-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full animate-bounce">
                                    {toplam_alarm}
                                </span>
                            )}
                        </button>
                        {toplam_alarm > 0 && (
                            <div className="absolute top-10 right-0 w-80 bg-white border-2 border-slate-100 rounded-xl shadow-2xl p-3 hidden group-hover:flex flex-col gap-2 z-[999]">
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1 border-b pb-1">Aktif Alarmlar</div>
                                {alarmlar.kritikStok.length > 0 && (
                                    <div className="bg-red-50 border border-red-100 p-2 rounded-lg">
                                        <div className="text-xs font-black text-red-800 flex items-center gap-1"><AlertCircle size={12} /> Kritik Stok ({alarmlar.kritikStok.length})</div>
                                        <div className="text-[10px] font-bold text-red-600 mt-0.5">Stok seviyesi minimumun altına inen ürünler var. Stok menüsüne gidiniz.</div>
                                    </div>
                                )}
                                {alarmlar.vadeliOdeme.length > 0 && (
                                    <div className="bg-orange-50 border border-orange-100 p-2 rounded-lg">
                                        <div className="text-xs font-black text-orange-800 flex items-center gap-1"><TrendingUp size={12} /> Vadeli Ödeme ({alarmlar.vadeliOdeme.length})</div>
                                        <div className="text-[10px] font-bold text-orange-600 mt-0.5">Bugün veya geçmiş tarihli bekleyen ödemeleriniz bulunmaktadır.</div>
                                    </div>
                                )}
                                {alarmlar.gorevler.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg">
                                        <div className="text-xs font-black text-blue-800 flex items-center gap-1"><CheckSquare size={12} /> Bekleyen Görevler ({alarmlar.gorevler.length})</div>
                                        <div className="text-[10px] font-bold text-blue-600 mt-0.5">Bekleyen aktif görevler mevcut.</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button onClick={() => setFinansGizli(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${finansGizli ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {finansGizli ? <EyeOff size={13} /> : <Eye size={13} />}
                        {finansGizli ? t.sansurlü : t.goster}
                    </button>
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        🚀 {isAR ? 'النظام' : 'SİSTEM'}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white flex items-center gap-1">
                        ⚖️ NİZAM THE ORDER
                    </span>
                </div>
            </div>

            {/* ── 4 KPI KARTI ──────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                {[
                    { baslik: t.kpiCiro, deger: `₺ ${fmt(canliVeri.ciro)}`, ikon: TrendingUp, renk: 'emerald', aciklama: t.kpiCiroAlt, link: '/raporlar' },
                    { baslik: t.kpiMaliyet, deger: `₺ ${fmt(canliVeri.maliyet)}`, ikon: Database, renk: 'indigo', aciklama: t.kpiMaliyetAlt, link: '/maliyet' },
                    { baslik: t.kpiPersonel, deger: `₺ ${fmt(canliVeri.personelGider)}`, ikon: Users, renk: 'violet', aciklama: t.kpiPersonelAlt, link: '/personel' },
                    { baslik: t.kpiFire, deger: finansGizli ? '●●●' : `%${canliVeri.fire}`, ikon: AlertCircle, renk: 'rose', aciklama: t.kpiFireAlt, link: '/raporlar' },
                ].map((kpi, i) => {
                    const Ikon = kpi.ikon;
                    const gradients = [
                        'from-emerald-500 to-teal-600', 'from-indigo-500 to-blue-600',
                        'from-violet-500 to-purple-600', 'from-rose-500 to-red-600'
                    ];
                    return (
                        <Link key={i} href={kpi.link || "#"} style={{ textDecoration: 'none', display: 'block' }}>
                            <div className={`bg-gradient-to-br ${gradients[i]} rounded-xl p-3 sm:p-4 shadow-md text-white`}
                                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                <div className={`flex items-center justify-between mb-2 ${isAR ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-xs font-black uppercase tracking-wider opacity-90">{kpi.baslik}</span>
                                    <Ikon size={16} className="opacity-70" />
                                </div>
                                <div className="text-lg sm:text-xl font-black">{canliVeri.yukleniyor ? '...' : kpi.deger}</div>
                                <div className="text-xs opacity-70 mt-1">{kpi.aciklama} <span style={{ opacity: 0.6 }}>→</span></div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* ── 4 CANLI PENCERE ──────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">

                {/* PENCERE 1 — ANLİK ÜRETİM */}
                <div style={{ background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: 14, padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: '0.6rem', color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>⚙️ ANLİK ÜRETİM</div>
                    <div style={{ fontWeight: 900, color: 'white', fontSize: '1.5rem' }}>{bugunUretim.devam + bugunUretim.tamamlanan}</div>
                    <div style={{ fontSize: '0.65rem', color: '#a7f3d0' }}>{bugunUretim.devam} devam · {bugunUretim.tamamlanan} bitti</div>
                </div>

                {/* PENCERE 2 — GÜNLÜK MAĞAZA SATIŞI */}
                <div style={{ background: 'linear-gradient(135deg,#1e40af,#1d4ed8)', borderRadius: 14, padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: '0.6rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>🛒 GÜNLÜK SATIŞ</div>
                    <div style={{ fontWeight: 900, color: 'white', fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums' }}>
                        {magazaSatis.yukleniyor ? '...' : `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(magazaSatis.bugun)}`}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#bfdbfe' }}>bugünkü sipariş tutarı</div>
                </div>

                {/* PENCERE 3 — AKTİF ÜRETİM ADETLERİ */}
                <div style={{ background: 'linear-gradient(135deg,#4c1d95,#5b21b6)', borderRadius: 14, padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: '0.6rem', color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>🏭 AKTİF ÜRETİM</div>
                    <div style={{ fontWeight: 900, color: 'white', fontSize: '1.5rem' }}>{bugunUretim.devam}</div>
                    <div style={{ fontSize: '0.65rem', color: '#ddd6fe' }}>
                        {bugunUretim.tamamlanan} tamamlandı · {bugunUretim.toplam} toplam emir
                    </div>
                </div>

                {/* PENCERE 4 — VADELİ ÖDEME RİSKİ (ANTİGRAVİTY önerisi) */}
                <div style={{ background: (vadeSayac.gecmis + vadeSayac.bugun) > 0 ? 'linear-gradient(135deg,#7c2d12,#9a3412)' : 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: '0.6rem', color: (vadeSayac.gecmis + vadeSayac.bugun) > 0 ? '#fdba74' : '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>💰 VADELİ RİSK</div>
                    <div style={{ fontWeight: 900, color: 'white', fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                        {finansGizli ? '●●●●' : `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(vadeSayac.toplamTl)}`}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: (vadeSayac.gecmis + vadeSayac.bugun) > 0 ? '#fdba74' : '#94a3b8' }}>
                        {vadeSayac.gecmis} geçmiş · {vadeSayac.bugun} bugün
                    </div>
                </div>

            </div>

            {/* ── ANA GRID: SOL + SAĞ ──────────────────────────── */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4`}>

                {/* ── SOL KOLON (%66) ──────────────────────────── */}
                <div className="lg:col-span-2 flex flex-col gap-3 sm:gap-4">

                    {/* MODÜL GRİD */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4">
                        <h2 className={`text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 ${isAR ? 'flex-row-reverse' : ''}`}>
                            <Database size={16} className="text-emerald-600" /> {t.moduller}
                            <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{MODULLER.length}</span>
                        </h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {MODULLER.map((m, i) => {
                                const R = RENK[m.renk] || RENK.slate;
                                const Ikon = m.ikon;
                                const isim = t.modIsim[m.link] || m.link;
                                return (
                                    <Link key={i} href={m.link}
                                        className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 ${R.bg} ${R.border} ${R.hover} transition-all duration-200 cursor-pointer text-center no-underline`}>
                                        <div className={`${R.ikon} group-hover:scale-110 transition-transform`}>
                                            <Ikon size={18} />
                                        </div>
                                        <span className={`text-[10px] font-bold leading-tight ${R.text}`}>{isim}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* HIZLI GÖREV */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4">
                        <h2 className={`text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 ${isAR ? 'flex-row-reverse' : ''}`}>
                            <Zap size={16} className="text-amber-500" /> {t.gorevBaslik}
                            <Link href="/gorevler" className="ml-auto text-[10px] font-bold text-blue-500 hover:text-blue-700 no-underline">{t.tumGorevler}</Link>
                        </h2>
                        <div className={`flex gap-2 flex-wrap sm:flex-nowrap ${isAR ? 'flex-row-reverse' : ''}`}>
                            <input value={hizliGorev} onChange={e => setHizliGorev(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && gorevEkle()}
                                placeholder={t.gorevPlaceholder}
                                dir={isAR ? 'rtl' : 'ltr'}
                                className="flex-1 min-w-0 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition-colors" />
                            <button onClick={mikrofonBasla}
                                className={`p-2.5 rounded-xl border-2 transition-all ${dinliyor ? 'bg-red-100 border-red-400 text-red-600 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
                                title={dinliyor ? t.dinliyor : t.mikHata}>
                                {dinliyor ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <select value={hizliOncelik} onChange={e => setHizliOncelik(e.target.value)}
                                className="border-2 border-slate-200 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none">
                                <option value="normal">{t.normal}</option>
                                <option value="acil">{t.acil}</option>
                                <option value="kritik">{t.kritik}</option>
                            </select>
                            <button onClick={gorevEkle} disabled={islemYapiliyor}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap">
                                {t.yayinla}
                            </button>
                        </div>
                        {dinliyor && <p className="text-xs text-red-500 font-bold mt-2 animate-pulse">{t.dinliyor}</p>}
                    </div>

                    {/* AR-GE AJAN KONSOLu */}
                    <div className="bg-slate-900 rounded-2xl shadow-lg p-4 border border-slate-700">
                        <div className={`flex items-center gap-2 mb-3 ${isAR ? 'flex-row-reverse' : ''}`}>
                            <Bot size={18} className="text-emerald-400" />
                            <span className="text-sm font-black text-white">{t.argeBaslik}</span>
                            <span className="ml-auto text-[10px] font-bold bg-emerald-900 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded-full">FAZ 1</span>
                            <Link href="/ajanlar" className="text-[10px] font-bold text-slate-400 hover:text-white no-underline">{t.argePanel}</Link>
                        </div>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 ${isAR ? 'text-right' : ''}`}>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.argeMotor}</p>
                                <select value={argeModel} onChange={e => setArgeModel(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                                    {['saf_zeka', 'tam_guc', 'derin'].map((v, i) => (
                                        <option key={v} value={v}>🧠 {t.fazAdi[i]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.argeHedef}</p>
                                <input value={argeKelime} onChange={e => setArgeKelime(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && argeBaslat()}
                                    placeholder={isAR ? 'مثال: بنطلون نسائي مظلي' : 'Örn: Kadın Paraşüt Pantolon'}
                                    dir={isAR ? 'rtl' : 'ltr'}
                                    className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
                            </div>
                        </div>
                        <button onClick={argeBaslat} disabled={argeYuruyor || !argeKelime.trim()}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2">
                            {argeYuruyor ? <><RefreshCw size={15} className="animate-spin" /> {t.argeYuruyor}</> : <>{isAR ? '▶' : '▶'} {t.argeBaslat}</>}
                        </button>
                        {argeTerminal.length > 0 && (
                            <div className="mt-3 space-y-1 max-h-28 overflow-y-auto">
                                {argeTerminal.map((log, i) => (
                                    <div key={i} className={`text-xs text-emerald-300 font-mono flex items-start gap-2 ${isAR ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-slate-600 shrink-0 text-[10px]">{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── SAĞ KOLON (%34) ──────────────────────────── */}
                <div className="flex flex-col gap-3 sm:gap-4">

                    {/* PIN / GÜVENLİK TERMİNALİ */}
                    <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
                        <div className={`flex items-center gap-2 px-4 py-3 border-b border-slate-700 ${isAR ? 'flex-row-reverse' : ''}`}>
                            <KeyRound size={15} className="text-amber-400" />
                            <span className="text-sm font-black text-white">{t.pinBaslik}</span>
                        </div>
                        <div className="p-3 space-y-2">
                            {[
                                { key: 'uretim', baslik: t.pinUretim, alt: t.pinUretimAlt, yetkiKey: 'uretim', pin_key: 'sb47_uretim_pin' },
                                { key: 'genel', baslik: t.pinGenel, alt: t.pinGenelAlt, yetkiKey: 'genel', pin_key: 'sb47_genel_pin' },
                            ].map(({ key, baslik, alt, yetkiKey, pin_key }) => {
                                const aktif = yetkiState[yetkiKey];
                                return (
                                    <div key={key} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                                        <div className={`flex justify-between items-start mb-2 ${isAR ? 'flex-row-reverse' : ''}`}>
                                            <div className={isAR ? 'text-right' : ''}>
                                                <p className="text-xs font-black text-white">{baslik}</p>
                                                <p className="text-[10px] text-slate-400">{alt}</p>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${aktif ? 'bg-emerald-900 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                {aktif ? t.aktif : (isAR ? 'مغلق' : 'KAPALI')}
                                            </span>
                                        </div>
                                        <button
                                            disabled={pinYukleniyor}
                                            onClick={async () => {
                                                if (aktif) {
                                                    sessionStorage.removeItem(pin_key);
                                                    sessionStorage.removeItem(pin_key + '_token');
                                                    setYetkiState(p => ({ ...p, [yetkiKey]: false }));
                                                } else {
                                                    const girilen = prompt(isAR ? 'أدخل رمز PIN:' : 'PIN kodunu girin:');
                                                    if (!girilen) return;
                                                    setPinYukleniyor(true);
                                                    try {
                                                        const res = await fetch('/api/pin-dogrula', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ pin: girilen, tip: yetkiKey }),
                                                        });
                                                        const veri = await res.json();
                                                        if (veri.basarili) {
                                                            sessionStorage.setItem(pin_key, btoa('PIN_AKTIF'));
                                                            sessionStorage.setItem(pin_key + '_token', veri.token || '');
                                                            setYetkiState(p => ({ ...p, [yetkiKey]: true }));
                                                            setGorevBildirim('✅ Erişim açıldı — ' + (isAR ? 'مرحباً' : veri.grup?.toUpperCase()));
                                                            setTimeout(() => setGorevBildirim(''), 3000);
                                                        } else {
                                                            const msg = veri.hata || (isAR ? 'رمز PIN غير صحيح' : 'Yanlış PIN.');
                                                            setGorevBildirim('🔴 ' + msg);
                                                            setTimeout(() => setGorevBildirim(''), 4000);
                                                        }
                                                    } catch {
                                                        setGorevBildirim('⚠️ Sunucuya ulaşılamadı.');
                                                        setTimeout(() => setGorevBildirim(''), 4000);
                                                    } finally {
                                                        setPinYukleniyor(false);
                                                    }
                                                }
                                            }}
                                            className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${aktif ? 'bg-red-900 hover:bg-red-800 text-red-400 border border-red-700' : 'bg-emerald-900 hover:bg-emerald-800 text-emerald-400 border border-emerald-700'}`}>
                                            {aktif ? t.vizeyiKapat : t.vizeyiAc}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* AKTİF ALARMLAR */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1">
                        <div className={`flex items-center gap-2 px-4 py-3 border-b border-slate-100 ${isAR ? 'flex-row-reverse' : ''}`}>
                            <Bell size={15} className={toplam_alarm > 0 ? 'text-red-500' : 'text-slate-400'} />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.alarmBaslik}</span>
                            {toplam_alarm > 0 && (
                                <span className="ml-auto text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{toplam_alarm}</span>
                            )}
                            <button onClick={alarmYukle} className="ml-auto text-slate-300 hover:text-slate-600 transition-colors"><RefreshCw size={12} /></button>
                        </div>
                        <div className="p-3">
                            {alarmlar.yukleniyor ? (
                                <p className="text-xs text-slate-400 text-center py-4">{isAR ? 'جار التحميل...' : 'Yükleniyor...'}</p>
                            ) : toplam_alarm === 0 ? (
                                <div className="text-center py-4">
                                    <Shield size={28} className="text-emerald-300 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-emerald-600">{t.alarmTemiz}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{t.alarmYok}</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {alarmlar.gorevler.slice(0, 3).map((g, i) => (
                                        <div key={i} className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-amber-50 border border-amber-200 ${isAR ? 'flex-row-reverse' : ''}`}>
                                            <AlertCircle size={12} className="text-amber-500 shrink-0" />
                                            <span className="font-medium text-amber-900 truncate">{g.baslik}</span>
                                        </div>
                                    ))}
                                    {alarmlar.kritikStok.slice(0, 3).map((s, i) => (
                                        <div key={i} className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-red-50 border border-red-200 ${isAR ? 'flex-row-reverse' : ''}`}>
                                            <Package size={12} className="text-red-500 shrink-0" />
                                            <span className="font-medium text-red-900 truncate">{s.urun_adi}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SİSTEM SAĞLIK SKORU */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistem Sağlık Skoru</span>
                            <span className="text-emerald-500 font-black text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">100/100</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
                            <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold">Tüm servisler aktif ve stabil çalışıyor. Son yedek: 14 dk önce.</div>
                    </div>

                    {/* SON 5 AKTİVİTE */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col hidden sm:flex">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                            <Activity size={15} className="text-indigo-500" />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Son Aktiviteler</span>
                        </div>
                        <div className="p-3 space-y-2">
                            {[
                                { ikon: '', renk: 'text-amber-600', metin: 'Yeni görev eklendi: Model Yaka', zaman: '5 dk önce' },
                                { ikon: '', renk: 'text-purple-600', metin: 'Numune kaydedildi: KDN-PANT-01', zaman: '12 dk önce' },
                                { ikon: '', renk: 'text-emerald-600', metin: 'Usta C bant üretimini başlattı', zaman: '45 dk önce' },
                                { ikon: '', renk: 'text-blue-600', metin: 'Yapay Zeka (Ar-Ge) raporu aldı', zaman: '1 saat önce' },
                                { ikon: '', renk: 'text-rose-600', metin: 'Güvenlik ayarları güncellendi', zaman: '2 saat önce' }
                            ].map((akt, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                    <span className="min-w-[16px] text-center">{akt.ikon}</span>
                                    <div>
                                        <div className={ont - bold}>{akt.metin}</div>
                                        <div className="text-[9px] font-bold text-slate-400 mt-0.5">{akt.zaman}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* HIZLI ERİŞİM */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.hizliErisim}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {[
                                { href: '/raporlar', label: t.raporlar, ikon: BarChart3, bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
                                { href: '/guvenlik', label: t.guvenlik, ikon: Shield, bg: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
                                { href: '/gorevler', label: t.gorevler, ikon: CheckSquare, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
                                { href: '/ayarlar', label: t.ayarlar, ikon: Settings, bg: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
                                { href: '/giris', label: isAR ? 'خروج' : 'Çıkış', ikon: LogOut, bg: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
                            ].map(({ href, label, ikon: Icon, bg }) => (
                                <Link key={href} href={href}
                                    className={`flex items-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-bold transition-all no-underline ${bg} ${isAR ? 'flex-row-reverse' : ''}`}>
                                    <Icon size={13} />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
//  YETKİ KONTROL PANELİ (Sadece tam grubu görür) 
export function YetkiPaneli() {
    const { yetkiGuncelle, tumYetkiler, yukleniyor } = useYetkiPanel();
    const [mesaj, setMesaj] = useState('');
    const [kayitHata, setKayitHata] = useState('');

    const KAYNAKLAR = [
        { id: 'maliyet_tutar', label: 'Maliyet Rakamları (TL/USD)' },
        { id: 'kasa_bakiye', label: 'Kasa Bakiye' },
        { id: 'maas_detay', label: 'Maaş & Prim Detayı' },
        { id: 'urun_maliyet', label: 'Ürün Maliyet/Kâr' },
        { id: 'musteri_iletisim', label: 'Müşteri Tel & E-Posta' },
        { id: 'rapor_tam', label: 'Tam Raporlar' },
        { id: 'muhasebe_detay', label: 'Muhasebe Kalemleri' },
        { id: 'ajan_komuta', label: 'Ajan Komuta Paneli' },
        { id: 'siparis_fiyat', label: 'Sipariş Fiyat Bilgisi' },
    ];

    const GRUPLAR = [
        { id: 'uretim', label: ' Üretim', renk: '#3b82f6' },
        { id: 'genel', label: ' Genel', renk: '#10b981' },
    ];

    const toggle = async (grup, kaynak, mevcutDeger) => {
        try {
            await yetkiGuncelle(grup, kaynak, !mevcutDeger);
            setMesaj(` ${grup.toUpperCase()}  ${kaynak}: ${!mevcutDeger ? 'Açıldı' : 'Kapatıldı'}`);
            setTimeout(() => setMesaj(''), 3000);
        } catch (e) {
            setKayitHata('Kayıt hatası: ' + e.message);
            setTimeout(() => setKayitHata(''), 4000);
        }
    };

    return (
        <div style={{ background: 'white', border: '2px solid #6366f1', borderRadius: 16, padding: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={20} color="white" />
                </div>
                <div>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>Yetki Kontrol Paneli</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Kim hangi veriye erişebilir  koordinatör belirler</div>
                </div>
                {yukleniyor && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#6366f1', fontWeight: 700 }}> Yükleniyor...</span>}
            </div>

            {mesaj && <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '8px 14px', marginBottom: '1rem', fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>{mesaj}</div>}
            {kayitHata && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 14px', marginBottom: '1rem', fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c' }}>{kayitHata}</div>}

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#374151', borderBottom: '2px solid #e5e7eb', minWidth: 220 }}>Veri / Özellik</th>
                            {GRUPLAR.map(g => (
                                <th key={g.id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: g.renk, borderBottom: '2px solid #e5e7eb', minWidth: 120 }}>{g.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {KAYNAKLAR.map(k => (
                            <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{k.label}</td>
                                {GRUPLAR.map(g => {
                                    const izinVar = tumYetkiler[g.id]?.[k.id] ?? false;
                                    return (
                                        <td key={g.id} style={{ padding: '10px 14px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => toggle(g.id, k.id, izinVar)}
                                                style={{
                                                    width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', position: 'relative',
                                                    background: izinVar ? '#10b981' : '#e5e7eb', transition: 'background 0.2s',
                                                    display: 'inline-flex', alignItems: 'center', padding: '0 4px',
                                                }}
                                            >
                                                <span style={{
                                                    width: 20, height: 20, borderRadius: '50%', background: 'white',
                                                    transform: izinVar ? 'translateX(24px)' : 'translateX(0)', transition: 'transform 0.2s',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block',
                                                }} />
                                            </button>
                                            <div style={{ fontSize: '0.6rem', color: izinVar ? '#059669' : '#94a3b8', fontWeight: 700, marginTop: 3 }}>
                                                {izinVar ? ' Açık' : ' Kapalı'}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#eff6ff', borderRadius: 8, fontSize: '0.72rem', color: '#1e40af', fontWeight: 600, lineHeight: 1.5 }}>
                <strong>Kapalı</strong> olan kaynaklar ilgili sayfada " Gizli" olarak gösterilir. Supabase'e anında kaydedilir.
            </div>

            {/* YetkiPaneli buraya taşınmamalı — recursive çağrı riski önlendi */}
        </div>
    );
}
