'use client';
import './globals.css';
import {
    LayoutDashboard, Scissors, Activity, FileSearch, Settings, Users, Bot,
    Layers, Cpu, BookOpen, TrendingUp, ShoppingBag, ShoppingCart, Package,
    Wallet, UserCheck, BarChart3, Shield, ClipboardList, PieChart, LogOut, Zap, Camera
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth, ERISIM_MATRISI } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { bekleyenleriGetir, offlineSenkronizasyonuBaslat } from '@/lib/offlineKuyruk';
import { LangProvider, useLang } from '@/context/langContext';
import { YetkiProvider } from '@/lib/yetki';
import { TasarimProvider } from '@/context/TasarimContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import BildirimZili from '@/lib/components/ui/BildirimZili';
import MesajBildirimButonu from '@/components/MesajBildirimButonu';
import NizamVoiceAgent from '@/components/NizamVoiceAgent';

// ¦¦¦ NAV YAPISI ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, labelTR: 'Karargâh', labelAR: '????? ???????', group: 'ana' },
    // 1. BÝRÝM
    { href: '/arge', icon: TrendingUp, labelTR: 'Ar-Ge & Trend', labelAR: '??? ??????', badge: 'M1', group: 'birim1' },
    { href: '/kumas', icon: Layers, labelTR: 'Kumaþ & Malzeme', labelAR: '????? ???????', badge: 'M2', group: 'birim1' },
    { href: '/kalip', icon: BookOpen, labelTR: 'Kalýp & Serileme', labelAR: '?????? ????????', badge: 'M3', group: 'birim1' },
    { href: '/modelhane', icon: FileSearch, labelTR: 'Modelhane & Prova', labelAR: '??????? ????????', badge: 'M4', group: 'birim1' },
    { href: '/kesim', icon: Scissors, labelTR: 'Kesim & Fire', labelAR: '????? ????????', badge: 'M5', group: 'birim1' },
    { href: '/uretim', icon: Cpu, labelTR: 'Üretim & Bant', labelAR: '??????? ??? ???????', badge: 'M6', group: 'birim1' },
    { href: '/maliyet', icon: Activity, labelTR: 'Maliyet Merkezi', labelAR: '???? ???????', badge: 'M7', group: 'birim1' },
    { href: '/muhasebe', icon: BarChart3, labelTR: 'Muhasebe & Nakit', labelAR: '???????? ????????', badge: 'M8', group: 'birim1' },
    // 2. BÝRÝM
    { href: '/katalog', icon: ShoppingBag, labelTR: 'Ürün Kartlarý', labelAR: '?????? ????????', badge: 'M9', group: 'birim2' },
    { href: '/siparisler', icon: ShoppingCart, labelTR: 'Sipariþler & Kargo', labelAR: '????? ???????', badge: 'M10', group: 'birim2' },
    { href: '/stok', icon: Package, labelTR: 'Stok & Depo', labelAR: '????? ??????', badge: 'M11', group: 'birim2' },
    { href: '/kasa', icon: Wallet, labelTR: 'Kasa & Tahsilat', labelAR: '??????? ????????', badge: 'M12', group: 'birim2' },
    // YÖNETÝM
    { href: '/musteriler', icon: UserCheck, labelTR: 'Müþteri CRM', labelAR: '????? ???????', badge: 'M13', group: 'yonetim' },
    { href: '/personel', icon: Users, labelTR: 'Personel & Performans', labelAR: '????????', badge: 'M14', group: 'yonetim' },
    { href: '/gorevler', icon: ClipboardList, labelTR: 'Görev & Kanban', labelAR: '?????? ??????', badge: 'M15', group: 'yonetim' },
    { href: '/raporlar', icon: PieChart, labelTR: 'Analitik Raporlar', labelAR: '????????', badge: 'M16', group: 'yonetim' },

    // SÝSTEM
    { href: '/kameralar', icon: Camera, labelTR: 'Kameralar (Vizyon)', labelAR: '?????????', badge: 'M18', group: 'sistem' },
    { href: '/ajanlar', icon: Zap, labelTR: '?? AI Komuta Merkezi', labelAR: '????? ???????', group: 'sistem' },

    { href: '/denetmen', icon: Bot, labelTR: 'Müfettiþ & Öðrenme', labelAR: '??????', group: 'sistem' },
    { href: '/guvenlik', icon: Shield, labelTR: 'Güvenlik & Loglar', labelAR: '??????', group: 'sistem' },
    { href: '/ayarlar', icon: Settings, labelTR: 'Sistem Ayarlarý', labelAR: '?????????', group: 'sistem' },
];

// ¦¦¦ SAYFA ERÝÞÝM KONTROLÜ ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
function SidebarInner({ isAR }) {
    /** @type {any} */
    const { kullanici, cikisYap, sayfaErisim } = useAuth();
    const pathname = usePathname();

    const gorunur = (href) => {
        if (!kullanici) return false;
        return sayfaErisim(href) !== null;
    };

    /** @param {{item: any}} props */
    const NavItem = ({ item }) => {
        if (!gorunur(item.href)) return null;
        const aktif = pathname === item.href;
        return (
            <Link href={item.href} className="nav-item"
                aria-label={item.labelTR}
                aria-current={aktif ? 'page' : undefined}
                style={{ paddingLeft: isAR ? '8px' : '14px', paddingRight: isAR ? '14px' : '8px', opacity: aktif ? 1 : 0.85, minHeight: '36px', marginBottom: '2px' }}>
                <item.icon size={18} aria-hidden="true" />
                <span style={{ flex: 1, fontSize: '1.05rem', fontWeight: 600 }}>{isAR ? item.labelAR : item.labelTR}</span>
                {item.badge && (
                    <span style={{ fontSize: '0.55rem', padding: '2px 5px', borderRadius: '4px', fontWeight: 700 }}
                        className={`badge-${item.group}`}>
                        {item.badge}
                    </span>
                )}
            </Link>
        );
    };

    const NavGroup = ({ label, labelAR, color, groupKey }) => {
        const items = NAV_ITEMS.filter(n => n.group === groupKey).filter(n => gorunur(n.href));
        if (items.length === 0) return null;
        return (
            <>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color, letterSpacing: '0.15em', padding: '12px 8px 4px', textTransform: 'uppercase' }}>
                    {isAR ? labelAR : label}
                </div>
                {items.map(item => <NavItem key={item.href} item={item} />)}
            </>
        );
    };

    return (
        <>
            {/* Ana */}
            {NAV_ITEMS.filter(n => n.group === 'ana').map(item => (
                gorunur(item.href) && (
                    <Link key={item.href} href={item.href} className="nav-item" aria-label={item.labelTR}>
                        <item.icon size={16} />
                        <span>{isAR ? item.labelAR : item.labelTR}</span>
                    </Link>
                )
            ))}

            <NavGroup label="? 1. BÝRÝM" labelAR="? ?????? ??????" color="#6ee7b7" groupKey="birim1" />
            <NavGroup label="? 2. BÝRÝM" labelAR="? ?????? ???????" color="#fcd34d" groupKey="birim2" />
            <NavGroup label="? YÖNETÝM" labelAR="? ???????" color="#cbd5e1" groupKey="yonetim" />
            <NavGroup label="? SÝSTEM" labelAR="? ??????" color="#c4b5fd" groupKey="sistem" />

            {/* Alt — Kullanýcý bilgisi + çýkýþ */}
            {kullanici && (
                <div style={{ marginTop: 'auto', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', margin: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.72rem' }}>
                                {kullanici.gosterge} {kullanici.label}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#475569' }}>Aktif oturum</div>
                        </div>
                        <button onClick={cikisYap} title="Çýkýþ Yap" aria-label="Sistemden çýkýþ yap"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <LogOut size={11} /> Çýkýþ
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

/** @param {{children: any}} props */
function LayoutInner({ children }) {
    /** @type {any} */
    const { kullanici, yukleniyor } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { lang, setLang } = useLang();
    const [sidebarAcik, setSidebarAcik] = useState(false);
    /** @type {[any, any]} */
    const [canliBildirim, setCanliBildirim] = useState(null);
    const isAR = lang === 'ar';

    const isGiris = pathname === '/giris';

    // ¦¦¦ KÖR NOKTA 5: ?NTERNET KESÝNTÝSÝ (OFFLINE ÇÖKÜÞ KALKANI) ¦¦¦
    const [internetVar, setInternetVar] = useState(true);
    const [bekleyenIslemAdeti, setBekleyenIslemAdeti] = useState(0);

    const kuyruklariSay = async () => {
        try {
            const kuyruk = await bekleyenleriGetir();
            setBekleyenIslemAdeti(kuyruk.length);
        } catch (e) {
            // IndexedDB kapalý veya henüz yüklenmedi
        }
    };

    useEffect(() => {
        setInternetVar(navigator.onLine);
        kuyruklariSay();

        const onOnline = async () => {
            setInternetVar(true);
            const snc = await offlineSenkronizasyonuBaslat();
            if (snc && snc.basarili > 0) {
                alert(`? ÝNTERNET GELDÝ!\nÇevrimdýþý iken attýðýnýz ${snc.basarili} iþlem baþarýyla ana sunucuya aktarýldý.`);
            }
            if (snc && snc.basarisiz > 0) {
                alert(`?? DÝKKAT!\n${snc.basarisiz} adet kuyruktaki iþlem hata verdi.`);
            }
            kuyruklariSay();
        };

        const onOffline = () => {
            setInternetVar(false);
            kuyruklariSay();
        };

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        // K-16: Gerçek Service Worker Kaydý (Stale-While-Revalidate offline fallback)
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .catch(() => { /* SW kaydý sessiz baþarýsýz olabilir */ });
        }

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    // ¦¦¦ KÖR NOKTA 4: SÝSTEM ÇAPINDA CANLI AÐ ¦¦¦
    useEffect(() => {
        if (!kullanici || isGiris) return;

        const sub = supabase.channel('global_izleme')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                let islemTR = payload.eventType === 'INSERT' ? 'Yeni Ekleme' : payload.eventType === 'UPDATE' ? 'Güncelleme' : 'Silme';
                let msg = `? Bir personel iþlem yaptý: ${payload.table} (${islemTR}). Taze veriyi görmek için týklayýn.`;
                setCanliBildirim(msg);
                setTimeout(() => setCanliBildirim(null), 10000);
            }).subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [kullanici, isGiris]);

    useEffect(() => {
        if (!yukleniyor && !kullanici && pathname !== '/giris') {
            window.location.href = '/giris';
        }
    }, [kullanici, yukleniyor, pathname]);

    // KÖKLÜ ÇÖZÜM: Kullanýcý yoksa bile içeriði çiz ki Kameralar paneli giriþ izni kilidini kullanabilsin.
    // Eðer direkt null dönerseniz tamamen SÝYAH ekran hatasý oluyordu!
    if (!kullanici) {
        return <>{children}</>;
    }


    return (
        <div className="layout-container" style={{ flexDirection: isAR ? 'row-reverse' : 'row' }}>
            {/* SIDEBAR */}
            <aside className={`sidebar${sidebarAcik ? ' mobile-open' : ''}`}>
                {/* Baþlýk */}
                <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.25rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em', margin: 0 }}>
                        <span style={{ color: '#f59e0b' }}>mizanet</span>
                        <span style={{ color: '#6ee7b7' }}>.com</span>
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: '6px 0 0', fontWeight: 700, letterSpacing: '0.05em', lineHeight: '1.4' }}>
                        Adil Düzen · Þeffaf Maliyet<br />Adaletli Daðýtým
                    </p>
                </div>

                {/* Dil */}
                <div style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '3px' }}>
                        <button onClick={() => setLang('tr')} style={{ flex: 1, padding: '5px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, background: lang === 'tr' ? '#3b82f6' : 'transparent', color: lang === 'tr' ? 'white' : '#94a3b8', transition: 'all 0.2s' }}>???? TR</button>
                        <button onClick={() => setLang('ar')} style={{ flex: 1, padding: '5px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, background: lang === 'ar' ? '#8b5cf6' : 'transparent', color: lang === 'ar' ? 'white' : '#94a3b8', transition: 'all 0.2s' }}>???? AR</button>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '0 0.625rem', overflowY: 'auto', flex: 1 }}
                    role="navigation" aria-label="Ana Navigasyon">
                    <SidebarInner isAR={isAR} />
                </nav>

                {/* Sistem durumu */}
                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', margin: '0 0.75rem 0.75rem', borderRadius: '8px', fontSize: '10px', color: '#475569', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 3 }}>? Sistem Aktif</div>
                    <div style={{ color: '#60a5fa' }}>1. Birim M1–M8 ?</div>
                    <div style={{ color: '#fb923c' }}>2. Birim M9–M12 ?</div>
                    <div style={{ color: '#a3e635', marginTop: 1 }}>Yönetim M13–M16 ?</div>
                    <div style={{ color: '#8b5cf6', marginTop: 1 }}>Sistem AI/Güvenlik ?</div>
                </div>
            </aside>

            {/* MOBÝL OVERLAY */}
            <div
                className={`sidebar-overlay ${sidebarAcik ? 'mobile-open' : ''}`}
                onClick={() => setSidebarAcik(false)}
            />

            {/* MAIN */}
            <main className="main-content">
                <header className="topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            className="hamburger-btn"
                            onClick={() => setSidebarAcik(v => !v)}
                            aria-label="Menüyü aç/kapat"
                            aria-expanded={sidebarAcik}
                            aria-controls="sidebar"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            {(() => {
                                const aktifItem = NAV_ITEMS.find(n => n.href === pathname);
                                const baslikMtn = pathname === '/'
                                    ? "KARARGÂH OPERASYON MERKEZÝ"
                                    : aktifItem
                                        ? (isAR ? aktifItem.labelAR : aktifItem.labelTR).toUpperCase()
                                        : "THE ORDER / NÝZAM";

                                return (
                                    <h2 style={{ margin: 0, fontSize: pathname === '/' ? '1.5rem' : '1.2rem', fontWeight: 900, color: '#34d399', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {aktifItem && <aktifItem.icon size={pathname === '/' ? 26 : 20} style={{ color: '#6ee7b7' }} />}
                                        {baslikMtn}
                                    </h2>
                                );
                            })()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {!internetVar ? (
                            <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#b45309' }}>
                                ? {bekleyenIslemAdeti > 0 ? `${bekleyenIslemAdeti} Bekliyor` : 'Çevrimdýþý'}
                            </span>
                        ) : (
                            <span style={{ background: 'rgba(52,211,153,0.15)', color: '#6ee7b7', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(52,211,153,0.2)' }}>
                                {isAR ? '?????? ???' : 'Sistem Aktif'}
                            </span>
                        )}
                        <BildirimZili />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#e2e8f0' }}>
                            {kullanici?.gosterge} {kullanici?.label}
                        </span>
                    </div>
                </header>

                <div className="page-content" data-lang={lang}>
                    {children}
                </div>
            </main>

            {/* KÖR NOKTA 4: CANLI AÐ BÝLDÝRÝM BALONU */}
            {canliBildirim && (
                <div onClick={() => window.location.reload()}
                    style={{ position: 'fixed', bottom: 20, right: 20, background: '#10b981', color: 'white', padding: '12px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 10px 30px rgba(16,185,129,0.4)', cursor: 'pointer', zIndex: 9999, animation: 'slideIn 0.3s ease-out' }}>
                    {canliBildirim}
                </div>
            )}

            {/* KÖR NOKTA 5: ÝNTERNET KESÝNTÝSÝ ALARM BALONU */}
            {!internetVar && (
                <div style={{ position: 'fixed', bottom: 20, left: 20, background: '#ef4444', color: 'white', padding: '12px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, border: '2px solid #b91c1c', boxShadow: '0 10px 30px rgba(239,68,68,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Zap size={20} />
                    <div>
                        <div style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>BAÐLANTI KOPTU (ÇEVRÝMDIÞI ÇALIÞIYORSUNUZ)</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#fef2f2', marginTop: 2 }}>Cihazdaki {bekleyenIslemAdeti} iþlem beklemede. Üretime devam edin, internet gelince aktarýlacak.</div>
                    </div>
                </div>
            )}

            {/* MESAJ BÝLDÝRÝM BUTONU — tüm sayfalarda sabit, okunmamýþ varsa kýrmýzý */}
            <MesajBildirimButonu />

            {/* KÜRESEL SESLÝ KOMUT ASÝSTANI (GÖLGE) */}
            <NizamVoiceAgent />

            <style>{`
                .badge-birim1 { background: #1e3a5f; color: #60a5fa; }
                .badge-birim2 { background: #431407; color: #fb923c; }
                .badge-yonetim { background: #1e293b; color: #94a3b8; }
                .badge-sistem { background: #2e1065; color: #c4b5fd; }
                @keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; }}
            `}</style>
        </div>
    );
}

/** @param {{children: any}} props */
export default function ClientLayout({ children }) {
    return (
        <ErrorBoundary modulAd="Uygulama Çekirdeði">
            <AuthProvider>
                <YetkiProvider>
                    <TasarimProvider>
                        <LangProvider>
                            <ErrorBoundary modulAd="Ana Layout">
                                <LayoutInner>{children}</LayoutInner>
                            </ErrorBoundary>
                        </LangProvider>
                    </TasarimProvider>
                </YetkiProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}
