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
import { LangProvider, useLang } from '@/lib/langContext';
import { YetkiProvider } from '@/lib/yetki';
import { TasarimProvider } from '@/lib/TasarimContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import BildirimZili from '@/lib/components/ui/BildirimZili';
import MesajBildirimButonu from '@/components/MesajBildirimButonu';

// ─── NAV YAPISI ───────────────────────────────────────────────
const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, labelTR: 'Karargâh', labelAR: 'المقر الرئيسي', group: 'ana' },
    // 1. BİRİM
    { href: '/arge', icon: TrendingUp, labelTR: 'Ar-Ge & Trend', labelAR: 'بحث وتطوير', badge: 'M1', group: 'birim1' },
    { href: '/kumas', icon: Layers, labelTR: 'Kumaş & Arşiv', labelAR: 'أرشيف الأقمشة', badge: 'M2', group: 'birim1' },
    { href: '/kalip', icon: BookOpen, labelTR: 'Kalıp & Serileme', labelAR: 'القالب والتسلسل', badge: 'M3', group: 'birim1' },
    { href: '/modelhane', icon: FileSearch, labelTR: 'Modelhane & Video', labelAR: 'النمذجة والفيديو', badge: 'M4', group: 'birim1' },
    { href: '/kesim', icon: Scissors, labelTR: 'Kesim & Ara İşçilik', labelAR: 'القطع والتشطيب', badge: 'M5', group: 'birim1' },
    { href: '/uretim', icon: Cpu, labelTR: 'Üretim Bandı', labelAR: 'خط الإنتاج', badge: 'M6', group: 'birim1' },
    { href: '/maliyet', icon: Activity, labelTR: 'Maliyet Merkezi', labelAR: 'مركز التكلفة', badge: 'M7', group: 'birim1' },
    { href: '/muhasebe', icon: BarChart3, labelTR: 'Muhasebe & Rapor', labelAR: 'المحاسبة والتقرير', badge: 'M8', group: 'birim1' },
    // 2. BİRİM
    { href: '/katalog', icon: ShoppingBag, labelTR: 'Ürün Kataloğu', labelAR: 'كتالوج المنتجات', badge: 'M9', group: 'birim2' },
    { href: '/siparisler', icon: ShoppingCart, labelTR: 'Siparişler', labelAR: 'إدارة الطلبات', badge: 'M10', group: 'birim2' },
    { href: '/stok', icon: Package, labelTR: 'Stok & Sevkiyat', labelAR: 'الجرد والشحن', badge: 'M11', group: 'birim2' },
    { href: '/kasa', icon: Wallet, labelTR: 'Kasa & Tahsilat', labelAR: 'الصندوق والتحصيل', badge: 'M12', group: 'birim2' },
    { href: '/kameralar', icon: Camera, labelTR: 'Kameralar (AI)', labelAR: 'الكاميرات', badge: 'M18', group: 'birim2' },
    // YÖNETİM
    { href: '/musteriler', icon: UserCheck, labelTR: 'Müşteri CRM', labelAR: 'إدارة العملاء', badge: 'M13', group: 'yonetim' },
    { href: '/personel', icon: Users, labelTR: 'Personel & Prim', labelAR: 'الموظفون', badge: 'M14', group: 'yonetim' },
    { href: '/gorevler', icon: ClipboardList, labelTR: 'Görev Takibi', labelAR: 'متابعة المهام', badge: 'M15', group: 'yonetim' },
    { href: '/raporlar', icon: PieChart, labelTR: 'Raporlar', labelAR: 'التقارير', badge: 'M16', group: 'yonetim' },
    { href: '/ajanlar', icon: Zap, labelTR: '🤖 Ajan Komuta', labelAR: 'قيادة الوكلاء', badge: 'AI', group: 'sistem' },
    { href: '/denetmen', icon: Bot, labelTR: 'Müfettiş (AI)', labelAR: 'المفتش', group: 'sistem' },
    { href: '/guvenlik', icon: Shield, labelTR: 'Güvenlik', labelAR: 'الأمان', group: 'sistem' },
    { href: '/ayarlar', icon: Settings, labelTR: 'Sistem Ayarları', labelAR: 'الإعدادات', group: 'sistem' },
];

// ─── SAYFA ERİŞİM KONTROLÜ ────────────────────────────────────
function SidebarInner({ isAR }) {
    const { kullanici, cikisYap, sayfaErisim } = useAuth();
    const pathname = usePathname();

    const gorunur = (href) => {
        if (!kullanici) return false;
        return sayfaErisim(href) !== null;
    };

    const NavItem = ({ item }) => {
        if (!gorunur(item.href)) return null;
        const aktif = pathname === item.href;
        return (
            <Link href={item.href} className="nav-item"
                style={{ paddingLeft: isAR ? '8px' : '14px', paddingRight: isAR ? '14px' : '8px', opacity: aktif ? 1 : 0.85, minHeight: '44px' }}>
                <item.icon size={16} />
                <span style={{ flex: 1, fontSize: '0.94rem' }}>{isAR ? item.labelAR : item.labelTR}</span>
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
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color, letterSpacing: '0.1em', padding: '10px 8px 3px', textTransform: 'uppercase' }}>
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
                    <Link key={item.href} href={item.href} className="nav-item">
                        <item.icon size={16} />
                        <span>{isAR ? item.labelAR : item.labelTR}</span>
                    </Link>
                )
            ))}

            <NavGroup label="▸ 1. BİRİM" labelAR="▸ الوحدة الأولى" color="#3b82f6" groupKey="birim1" />
            <NavGroup label="▸ 2. BİRİM" labelAR="▸ الوحدة الثانية" color="#f97316" groupKey="birim2" />
            <NavGroup label="▸ YÖNETİM" labelAR="▸ الإدارة" color="#6b7280" groupKey="yonetim" />
            <NavGroup label="▸ SİSTEM" labelAR="▸ النظام" color="#8b5cf6" groupKey="sistem" />

            {/* Alt — Kullanıcı bilgisi + çıkış */}
            {kullanici && (
                <div style={{ marginTop: 'auto', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', margin: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.72rem' }}>
                                {kullanici.gosterge} {kullanici.label}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#475569' }}>Aktif oturum</div>
                        </div>
                        <button onClick={cikisYap} title="Çıkış Yap"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <LogOut size={11} /> Çıkış
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── LAYOUT WRAPPER (Auth kontrolü) ───────────────────────────
function LayoutInner({ children }) {
    const { kullanici, yukleniyor } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { lang, setLang } = useLang();
    const [sidebarAcik, setSidebarAcik] = useState(false);
    const [canliBildirim, setCanliBildirim] = useState(null);
    const isAR = lang === 'ar';

    const isGiris = pathname === '/giris';

    // ─── KÖR NOKTA 5: ИNTERNET KESİNTİSİ (OFFLINE ÇÖKÜŞ KALKANI) ───
    const [internetVar, setInternetVar] = useState(true);
    const [bekleyenIslemAdeti, setBekleyenIslemAdeti] = useState(0);

    const kuyruklariSay = async () => {
        try {
            const kuyruk = await bekleyenleriGetir();
            setBekleyenIslemAdeti(kuyruk.length);
        } catch (e) {
            // IndexedDB kapalı veya henüz yüklenmedi
        }
    };

    useEffect(() => {
        setInternetVar(navigator.onLine);
        kuyruklariSay();

        const onOnline = async () => {
            setInternetVar(true);
            const snc = await offlineSenkronizasyonuBaslat();
            if (snc && snc.basarili > 0) {
                alert(`✅ İNTERNET GELDİ!\nÇevrimdışı iken attığınız ${snc.basarili} işlem başarıyla ana sunucuya aktarıldı.`);
            }
            if (snc && snc.basarisiz > 0) {
                alert(`⚠️ DİKKAT!\n${snc.basarisiz} adet kuyruktaki işlem hata verdi.`);
            }
            kuyruklariSay();
        };

        const onOffline = () => {
            setInternetVar(false);
            kuyruklariSay();
        };

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                }
            }).catch(function (err) {
                console.error('Service Worker temizleme hatası:', err);
            });
        }

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    // ─── KÖR NOKTA 4: SİSTEM ÇAPINDA CANLI AĞ ───
    useEffect(() => {
        if (!kullanici || isGiris) return;

        const sub = supabase.channel('global_izleme')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                let islemTR = payload.eventType === 'INSERT' ? 'Yeni Ekleme' : payload.eventType === 'UPDATE' ? 'Güncelleme' : 'Silme';
                let msg = `⚡ Bir personel işlem yaptı: ${payload.table} (${islemTR}). Taze veriyi görmek için tıklayın.`;
                setCanliBildirim(msg);
                setTimeout(() => setCanliBildirim(null), 10000);
            }).subscribe();

        return () => supabase.removeChannel(sub);
    }, [kullanici, isGiris]);

    useEffect(() => {
        if (!yukleniyor && !kullanici && pathname !== '/giris') {
            router.push('/giris');
        }
    }, [kullanici, yukleniyor, pathname]);

    if (yukleniyor) {
        return (
            <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em' }}>SİSTEME BAĞLANILIYOR...</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (isGiris || !kullanici) {
        return <>{children}</>;
    }

    return (
        <div className="layout-container" style={{ flexDirection: isAR ? 'row-reverse' : 'row' }}>
            {/* SIDEBAR */}
            <aside className={`sidebar${sidebarAcik ? ' mobile-open' : ''}`}>
                {/* Başlık */}
                <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.25rem' }}>
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.1em', margin: 0 }}>
                        <span style={{ color: '#f59e0b' }}>mizanet</span>
                        <span style={{ color: '#6ee7b7' }}>.com</span>
                    </h1>
                    <p style={{ fontSize: '0.75rem', color: '#e2e8f0', margin: '6px 0 0', fontWeight: 700, letterSpacing: '0.05em' }}>
                        Adil Düzen · Şeffaf Maliyet · Adaletli Dağıtım
                    </p>
                </div>

                {/* Dil */}
                <div style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '3px' }}>
                        <button onClick={() => setLang('tr')} style={{ flex: 1, padding: '5px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, background: lang === 'tr' ? '#3b82f6' : 'transparent', color: lang === 'tr' ? 'white' : '#94a3b8', transition: 'all 0.2s' }}>🇹🇷 TR</button>
                        <button onClick={() => setLang('ar')} style={{ flex: 1, padding: '5px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, background: lang === 'ar' ? '#8b5cf6' : 'transparent', color: lang === 'ar' ? 'white' : '#94a3b8', transition: 'all 0.2s' }}>🇸🇦 AR</button>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '0 0.625rem', overflowY: 'auto', flex: 1 }}>
                    <SidebarInner isAR={isAR} />
                </nav>

                {/* Sistem durumu */}
                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', margin: '0 0.75rem 0.75rem', borderRadius: '8px', fontSize: '10px', color: '#475569', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 3 }}>✅ Sistem Aktif</div>
                    <div style={{ color: '#60a5fa' }}>1. Birim M1–M8 ✅</div>
                    <div style={{ color: '#fb923c' }}>2. Birim M9–M12 ✅</div>
                    <div style={{ color: '#a3e635', marginTop: 1 }}>Yönetim M13–M16 ✅</div>
                    <div style={{ color: '#8b5cf6', marginTop: 1 }}>Sistem AI/Güvenlik ✅</div>
                </div>
            </aside>

            {/* MOBİL OVERLAY */}
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
                            aria-label="Menü"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <div>
                            {(() => {
                                const aktifItem = NAV_ITEMS.find(n => n.href === pathname);
                                const baslikMtn = pathname === '/'
                                    ? "KARARGÂH OPERASYON MERKEZİ"
                                    : aktifItem
                                        ? (isAR ? aktifItem.labelAR : aktifItem.labelTR).toUpperCase()
                                        : "THE ORDER / NİZAM";

                                return (
                                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#1e293b', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {aktifItem && <aktifItem.icon size={18} style={{ color: '#047857' }} />}
                                        {baslikMtn}
                                    </h2>
                                );
                            })()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {!internetVar ? (
                            <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#b45309' }}>
                                ⚡ {bekleyenIslemAdeti > 0 ? `${bekleyenIslemAdeti} Bekliyor` : 'Çevrimdışı'}
                            </span>
                        ) : (
                            <span className="badge badge-success">
                                {isAR ? 'النظام نشط' : 'Sistem Aktif'}
                            </span>
                        )}
                        <BildirimZili />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {kullanici?.gosterge} {kullanici?.label}
                        </span>
                    </div>
                </header>

                <div className="page-content" data-lang={lang}>
                    {children}
                </div>
            </main>

            {/* KÖR NOKTA 4: CANLI AĞ BİLDİRİM BALONU */}
            {canliBildirim && (
                <div onClick={() => window.location.reload()}
                    style={{ position: 'fixed', bottom: 20, right: 20, background: '#10b981', color: 'white', padding: '12px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 10px 30px rgba(16,185,129,0.4)', cursor: 'pointer', zIndex: 9999, animation: 'slideIn 0.3s ease-out' }}>
                    {canliBildirim}
                </div>
            )}

            {/* KÖR NOKTA 5: İNTERNET KESİNTİSİ ALARM BALONU */}
            {!internetVar && (
                <div style={{ position: 'fixed', bottom: 20, left: 20, background: '#ef4444', color: 'white', padding: '12px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, border: '2px solid #b91c1c', boxShadow: '0 10px 30px rgba(239,68,68,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Zap size={20} />
                    <div>
                        <div style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>BAĞLANTI KOPTU (ÇEVRİMDIŞI ÇALIŞIYORSUNUZ)</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#fef2f2', marginTop: 2 }}>Cihazdaki {bekleyenIslemAdeti} işlem beklemede. Üretime devam edin, internet gelince aktarılacak.</div>
                    </div>
                </div>
            )}

            {/* MESAJ BİLDİRİM BUTONU — tüm sayfalarda sabit, okunmamış varsa kırmızı */}
            <MesajBildirimButonu />

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

// ─── ANA EXPORT: CLIENT LAYOUT SARMALAYICI ────────────────────
export default function ClientLayout({ children }) {
    return (
        <ErrorBoundary modulAd="Uygulama Çekirdeği">
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
