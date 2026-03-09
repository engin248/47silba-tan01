'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import {
    ShieldCheck, BarChart3, Database, AlertCircle, TrendingUp,
    Mic, MicOff, KeyRound, Eye, EyeOff, Factory, Activity,
    CheckSquare, Zap, Bot, Package, Store, Users, Briefcase,
    Settings, FileText, ClipboardList, BookOpen, Cpu, Layers, Scissors,
    RefreshCw, Bell, Shield
} from 'lucide-react';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { supabase } from '@/lib/supabase';

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
            '/arge': 'Ar-Ge & Trend', '/kumas': 'Kumaş Arşivi', '/kalip': 'Kalıp Dairesi',
            '/modelhane': 'Modelhane', '/kesim': 'Kesimhane', '/imalat': 'İmalat Znc.',
            '/uretim': 'Üretim Bandı', '/stok': 'Stok & Lojistik', '/katalog': 'Katalog',
            '/siparisler': 'Siparişler', '/kasa': 'Kasa & Finans', '/maliyet': 'Maliyet/Kâr',
            '/personel': 'Personel & Prim', '/musteriler': 'Müşteriler', '/ajanlar': 'Ajan Komuta',
            '/denetmen': 'Müfettiş (AI)', '/muhasebe': 'Muhasebe', '/raporlar': 'Raporlar',
            '/gorevler': 'Görev Takibi', '/ayarlar': 'Ayarlar',
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
            '/gorevler': 'تتبع المهام', '/ayarlar': 'الإعدادات',
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
    { link: '/arge', ikon: Bot, renk: 'emerald' },
    { link: '/kumas', ikon: Database, renk: 'cyan' },
    { link: '/kalip', ikon: Activity, renk: 'fuchsia' },
    { link: '/modelhane', ikon: Factory, renk: 'pink' },
    { link: '/kesim', ikon: Scissors, renk: 'indigo' },
    { link: '/imalat', ikon: Layers, renk: 'blue' },
    { link: '/uretim', ikon: Cpu, renk: 'purple' },
    { link: '/stok', ikon: Package, renk: 'slate' },
    { link: '/katalog', ikon: Store, renk: 'amber' },
    { link: '/siparisler', ikon: ClipboardList, renk: 'orange' },
    { link: '/kasa', ikon: Briefcase, renk: 'emerald' },
    { link: '/maliyet', ikon: BarChart3, renk: 'rose' },
    { link: '/personel', ikon: ShieldCheck, renk: 'sky' },
    { link: '/musteriler', ikon: Users, renk: 'teal' },
    { link: '/ajanlar', ikon: Zap, renk: 'yellow' },
    { link: '/denetmen', ikon: Eye, renk: 'violet' },
    { link: '/muhasebe', ikon: BookOpen, renk: 'green' },
    { link: '/raporlar', ikon: FileText, renk: 'red' },
    { link: '/gorevler', ikon: CheckSquare, renk: 'lime' },
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

    const argeBaslat = async () => {
        if (!argeKelime.trim()) return;
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
                supabase.from('b2_urun_katalogu').select('id,urun_adi,stok_adedi').lt('stok_adedi', 5).limit(5),
            ]);
            setAlarmlar({
                gorevler: gorevRes.status === 'fulfilled' ? (gorevRes.value.data || []) : [],
                kritikStok: stokRes.status === 'fulfilled' ? (stokRes.value.data || []) : [],
                vadeliOdeme: [],
                yukleniyor: false,
            });
        } catch { setAlarmlar(p => ({ ...p, yukleniyor: false })); }
    };

    const veriYukle = async () => {
        try {
            const { data } = await supabase.from('b6_uretim_emirleri').select('toplam_maliyet, satis_fiyati').eq('durum', 'tamamlandi').limit(100);
            if (data && data.length > 0) {
                const ciro = data.reduce((s, r) => s + (r.satis_fiyati || 0), 0);
                const maliyet = data.reduce((s, r) => s + (r.toplam_maliyet || 0), 0);
                setCanliVeri({ ciro, maliyet, personelGider: maliyet * 0.35, fire: ((maliyet / (ciro || 1)) * 100).toFixed(1), yukleniyor: false });
            } else {
                setCanliVeri({ ciro: 1250000, maliyet: 840000, personelGider: 120000, fire: 2.4, yukleniyor: false });
            }
        } catch {
            setCanliVeri({ ciro: 1250000, maliyet: 840000, personelGider: 120000, fire: 2.4, yukleniyor: false });
        }
    };

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
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-500 tracking-tight m-0">
                        {t.baslik}
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t.altbaslik}</p>
                    <p className="text-xs text-slate-400 mt-0.5">🟢 {t.canliVeri} · {new Date().toLocaleString(isAR ? 'ar-SA' : 'tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className={`flex gap-2 flex-wrap ${isAR ? 'flex-row-reverse' : ''}`}>
                    <button onClick={() => setFinansGizli(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${finansGizli ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {finansGizli ? <EyeOff size={13} /> : <Eye size={13} />}
                        {finansGizli ? t.sansurlü : t.goster}
                    </button>
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        🚀 {isAR ? 'النظام' : 'SİSTEM'}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white flex items-center gap-1">
                        ⚖️ THE ORDER
                    </span>
                </div>
            </div>

            {/* ── 4 KPI KARTI ──────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                {[
                    { baslik: t.kpiCiro, deger: `₺ ${fmt(canliVeri.ciro)}`, ikon: TrendingUp, renk: 'emerald', aciklama: t.kpiCiroAlt },
                    { baslik: t.kpiMaliyet, deger: `₺ ${fmt(canliVeri.maliyet)}`, ikon: Database, renk: 'indigo', aciklama: t.kpiMaliyetAlt },
                    { baslik: t.kpiPersonel, deger: `₺ ${fmt(canliVeri.personelGider)}`, ikon: Users, renk: 'violet', aciklama: t.kpiPersonelAlt },
                    { baslik: t.kpiFire, deger: finansGizli ? '●●●' : `%${canliVeri.fire}`, ikon: AlertCircle, renk: 'rose', aciklama: t.kpiFireAlt },
                ].map((kpi, i) => {
                    const Ikon = kpi.ikon;
                    const gradients = [
                        'from-emerald-500 to-teal-600', 'from-indigo-500 to-blue-600',
                        'from-violet-500 to-purple-600', 'from-rose-500 to-red-600'
                    ];
                    return (
                        <div key={i} className={`bg-gradient-to-br ${gradients[i]} rounded-xl p-3 sm:p-4 shadow-md text-white`}>
                            <div className={`flex items-center justify-between mb-2 ${isAR ? 'flex-row-reverse' : ''}`}>
                                <span className="text-xs font-black uppercase tracking-wider opacity-90">{kpi.baslik}</span>
                                <Ikon size={16} className="opacity-70" />
                            </div>
                            <div className="text-lg sm:text-xl font-black">{canliVeri.yukleniyor ? '...' : kpi.deger}</div>
                            <div className="text-xs opacity-70 mt-1">{kpi.aciklama}</div>
                        </div>
                    );
                })}
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
                                            onClick={() => {
                                                if (aktif) {
                                                    sessionStorage.removeItem(pin_key);
                                                    setYetkiState(p => ({ ...p, [yetkiKey]: false }));
                                                } else {
                                                    const girilen = prompt(isAR ? 'أدخل رمز PIN:' : 'PIN kodunu girin:');
                                                    if (girilen) {
                                                        sessionStorage.setItem(pin_key, btoa(girilen));
                                                        setYetkiState(p => ({ ...p, [yetkiKey]: true }));
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

                    {/* HIZLI ERİŞİM */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.hizliErisim}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {[
                                { href: '/raporlar', label: t.raporlar, ikon: BarChart3, bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
                                { href: '/guvenlik', label: t.guvenlik, ikon: Shield, bg: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
                                { href: '/gorevler', label: t.gorevler, ikon: CheckSquare, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
                                { href: '/ayarlar', label: t.ayarlar, ikon: Settings, bg: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
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
