'use client';
import {
    Activity, ShieldCheck, Zap, Bot, Camera, Info, ArrowRight, PlayCircle, AlertCircle, ServerCrash, Send, CheckCircle, MessageSquare, Database, Cpu, Network
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Dünyanın En İyi Psikoloğu ve Tasarımcısı Perspektifinden: "ZEN / BİLGE" Mimarisi
// Renk Psikolojisi: Göz yormayan toprak tonları (Stone), zihni dinç tutan yumuşak su yeşilleri (Teal/Mint),
// keskin olmayan, yavaşça eriyen yuvarlatılmış hatlar (rounded-3xl). Karanlık ama bunaltıcı değil.

const MODUL_GRUPLARI = [
    {
        baslik: 'KARARGAH İSTİHBARATI',
        renk: 'text-stone-400',
        moduller: [
            { name: 'Ajanlar', link: '/ajanlar' },
            { name: 'Ar-Ge', link: '/arge' },
            { name: 'Denetmen', link: '/denetmen' },
            { name: 'Kameralar', link: '/kameralar' },
            { name: 'Haberleşme', link: '/haberlesme' }
        ]
    },
    {
        baslik: 'ÜRETİM MOTORU',
        renk: 'text-stone-400',
        moduller: [
            { name: 'Modelhane', link: '/modelhane' },
            { name: 'Kalıp', link: '/kalip' },
            { name: 'Kumaş', link: '/kumas' },
            { name: 'Kesim', link: '/kesim' },
            { name: 'İmalat', link: '/imalat' },
            { name: 'Üretim', link: '/uretim' }
        ]
    },
    {
        baslik: 'HAZİNE & E-TİCARET',
        renk: 'text-stone-400',
        moduller: [
            { name: 'Katalog', link: '/katalog' },
            { name: 'Siparişler', link: '/siparisler' },
            { name: 'Müşteriler', link: '/musteriler' },
            { name: 'Kasa', link: '/kasa' },
            { name: 'Maliyet', link: '/maliyet' },
            { name: 'Muhasebe', link: '/muhasebe' },
            { name: 'Stok', link: '/stok' }
        ]
    },
    {
        baslik: 'İNSAN KAYNAKLARI',
        renk: 'text-stone-400',
        moduller: [
            { name: 'Personel', link: '/personel' },
            { name: 'Görevler', link: '/gorevler' }
        ]
    },
    {
        baslik: 'SİSTEM YÖNETİMİ',
        renk: 'text-stone-400',
        moduller: [
            { name: 'Raporlar', link: '/raporlar' },
            { name: 'Tasarım', link: '/tasarim' },
            { name: 'Güvenlik', link: '/guvenlik' },
            { name: 'Ayarlar', link: '/ayarlar' },
            { name: 'Giriş', link: '/giris' }
        ]
    }
];

export function KarargahMainContainer() {
    const { kullanici } = useAuth();
    const {
        stats, alarms, ping,
        commandText, setCommandText, hizliGorevAtama,
        aiSorgu, setAiSorgu, isAiLoading, aiAnalizBaslat, aiSonuc,
        simulasyon, setSimulasyon,
        mesaj
    } = useKarargah();

    const [aiNedenModal, setAiNedenModal] = useState({ acik: false, metin: '', zarar: 0 });
    const [botLoglar, setBotLoglar] = useState(/** @type {any[]} */([]));
    const [botDurum, setBotDurum] = useState('kontrol');
    const [sonMesajlar, setSonMesajlar] = useState(/** @type {any[]} */([]));
    const [mesajSayisi, setMesajSayisi] = useState(0);
    const [gizlenIzleri, setGizlenIzleri] = useState(/** @type {any[]} */([]));
    const [modelArsiv, setModelArsiv] = useState(/** @type {any[]} */([]));
    const [izPanelAcik, setIzPanelAcik] = useState(false);
    const [kameraStreamDurum, setKameraStreamDurum] = useState('kontrol');

    useEffect(() => {
        const kontrol = async () => {
            if (document.hidden) return;
            try {
                const res = await fetch('/api/stream-durum', { signal: AbortSignal.timeout(4000), cache: 'no-store' });
                const d = await res.json();
                setKameraStreamDurum(d.durum === 'aktif' ? 'aktif' : 'kapali');
            } catch {
                setKameraStreamDurum('kapali');
            }
        };
        kontrol();
        const iv = setInterval(kontrol, 15000);
        const handleVisibility = () => { if (!document.hidden) kontrol(); };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => { clearInterval(iv); document.removeEventListener('visibilitychange', handleVisibility); };
    }, []);

    const gun45Once = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();

    const mesajlariGetir = useCallback(async () => {
        try {
            const { count } = await supabase
                .from('b1_ic_mesajlar')
                .select('id', { count: 'exact', head: true })
                .is('okundu_at', null);
            setMesajSayisi(count || 0);

            const { data: aktif } = await supabase
                .from('b1_ic_mesajlar')
                .select('id, konu, oncelik, gonderen_adi, created_at, urun_id')
                .order('created_at', { ascending: false })
                .limit(3);
            setSonMesajlar(aktif || []);

            const { data: gizli } = await supabase
                .from('b1_mesaj_gizli')
                .select('mesaj_id, kullanici_adi, gizlendi_at, b1_ic_mesajlar(konu, oncelik, urun_id, urun_kodu, gonderen_adi, gonderen_modul)')
                .gte('gizlendi_at', gun45Once)
                .order('gizlendi_at', { ascending: false })
                .limit(20);

            const izler = (gizli || []).filter(g => {
                const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar;
                return !(b1?.urun_id);
            });
            setGizlenIzleri(izler);

            const { data: model } = await supabase
                .from('b1_ic_mesajlar')
                .select('id, konu, oncelik, urun_id, urun_kodu, urun_adi, gonderen_adi, created_at, okundu_at')
                .not('urun_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(50);
            setModelArsiv(model || []);

        } catch { /* sessiz */ }
    }, [gun45Once]);

    useEffect(() => { mesajlariGetir(); }, [mesajlariGetir]);

    useEffect(() => {
        const kanal = supabase.channel('karargah-mesaj-optimize')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_ic_mesajlar' }, () => { if (!document.hidden) mesajlariGetir(); })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_mesaj_gizli' }, () => { if (!document.hidden) mesajlariGetir(); })
            .subscribe();
        return () => { supabase.removeChannel(kanal); };
    }, [mesajlariGetir]);

    useEffect(() => {
        const botLogCek = async () => {
            if (document.hidden) return;
            try {
                await fetch('/api/telegram-bildirim', { method: 'GET' }).catch(() => null);
                const { data } = await supabase
                    .from('b1_agent_loglari')
                    .select('ajan_adi, islem_tipi, mesaj, sonuc, created_at')
                    .eq('ajan_adi', 'NİZAMBOT')
                    .order('created_at', { ascending: false })
                    .limit(8);
                setBotLoglar(data || []);
                setBotDurum('aktif');
            } catch { setBotDurum('hata'); }
        };
        botLogCek();

        const kanal = supabase.channel('nizambot-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_agent_loglari', filter: 'ajan_adi=eq.NİZAMBOT' }, botLogCek)
            .subscribe();

        const handleVisibility = () => { if (!document.hidden) botLogCek(); };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            supabase.removeChannel(kanal);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);


    const fm = (/** @type {any} */ num) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(num);

    const SkeletonKutu = () => (
        <div className="animate-pulse bg-stone-800/40 p-5 rounded-[2rem] h-32 flex flex-col justify-between">
            <div className="h-4 bg-stone-700 rounded-full w-1/2"></div>
            <div className="h-8 bg-stone-700 rounded-lg w-3/4"></div>
        </div>
    );

    const isAdmin = /** @type {any} */ (kullanici)?.grup === 'tam' || /** @type {any} */ (kullanici)?.rol === 'admin';

    return (
        <div className="bg-[#151515] min-h-screen p-4 lg:p-8 text-stone-300 font-sans selection:bg-teal-900 selection:text-teal-200 pb-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1f1e1c] via-[#151515] to-[#101010]">

            {/* Bildirim Baloncuğu */}
            {mesaj.text && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 py-3 px-8 rounded-full font-medium shadow-2xl transition-all backdrop-blur-md ${mesaj.type === 'error' ? 'bg-rose-900/80 text-rose-100 border border-rose-800/50' : 'bg-teal-900/80 text-teal-100 border border-teal-800/50'}`}>
                    {mesaj.text}
                </div>
            )}

            {/* AI Neden Modal - Huzurlu Hata Penceresi */}
            {aiNedenModal.acik && (
                <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all">
                    <div className="bg-[#1c1a19] w-full max-w-md p-8 rounded-[2rem] border border-stone-800 shadow-2xl relative">
                        <button onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })} className="absolute top-6 right-6 text-stone-500 hover:text-stone-300 transition-colors">✕</button>
                        <h2 className="text-xl font-medium text-stone-200 mb-4 flex items-center gap-3"><Bot className="text-teal-500/80" /> Derin Analiz</h2>
                        <div className="bg-[#242220] p-5 rounded-2xl mb-6 border border-stone-700/30">
                            <p className="text-sm font-normal text-stone-400 leading-relaxed mb-4">
                                <span className="text-stone-300 block mb-1 font-medium">Tespit Edilen Kök Neden:</span>
                                {aiNedenModal.metin}
                            </p>
                            <p className="border-t border-stone-800 pt-4">
                                <span className="text-stone-500 block mb-1 text-xs uppercase tracking-wider">Potansiyel Etki:</span>
                                <span className="text-2xl font-light text-rose-300/80">₺ {fm(aiNedenModal.zarar)}</span>
                            </p>
                        </div>
                        <button onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })} className="w-full bg-[#2a2826] hover:bg-[#322f2c] p-4 rounded-2xl font-medium text-stone-300 transition-all border border-stone-700/50">Anlaşıldı</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8 min-h-[90vh]">
                <div className="lg:col-span-3 flex flex-col gap-6">

                    {/* -- 4'LÜ BİLGELİK ve STRATEJİ METRİK KUTULARI -- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.yukleniyor ? (
                            <><SkeletonKutu /><SkeletonKutu /><SkeletonKutu /><SkeletonKutu /></>
                        ) : (
                            <>
                                <Link href="/raporlar" className="group">
                                    <div className="bg-gradient-to-br from-[#1c1a19] to-[#151413] p-6 rounded-[2rem] flex flex-col justify-between shadow-xl shadow-black/10 h-32 border border-stone-800/80 hover:border-teal-900/50 transition-all duration-500 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-colors"></div>
                                        <span className="text-xs font-medium uppercase tracking-widest text-stone-500 relative z-10 flex items-center justify-between">
                                            Günlük Ciro <span className="text-teal-600/50">✦</span>
                                        </span>
                                        <span className="text-3xl font-light tracking-tight text-stone-200 relative z-10">
                                            {isAdmin ? `₺ ${fm(stats.ciro + ((stats.ciro * simulasyon) / 100))}` : '••••••'}
                                        </span>
                                    </div>
                                </Link>

                                <Link href="/maliyet" className="group">
                                    <div className="bg-gradient-to-br from-[#1c1a19] to-[#151413] p-6 rounded-[2rem] flex flex-col justify-between shadow-xl shadow-black/10 h-32 border border-stone-800/80 hover:border-rose-900/30 transition-all duration-500 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors"></div>
                                        <span className="text-xs font-medium uppercase tracking-widest text-stone-500 relative z-10 flex items-center justify-between">
                                            Toplam Maliyet <span className="text-rose-900/50">✦</span>
                                        </span>
                                        <span className="text-3xl font-light tracking-tight text-stone-300 relative z-10">
                                            {isAdmin ? `₺ ${fm(stats.maliyet)}` : '••••••'}
                                        </span>
                                    </div>
                                </Link>

                                <Link href="/personel" className="group">
                                    <div className="bg-gradient-to-br from-[#1c1a19] to-[#151413] p-6 rounded-[2rem] flex flex-col justify-between shadow-xl shadow-black/10 h-32 border border-stone-800/80 hover:border-sky-900/30 transition-all duration-500 relative overflow-hidden">
                                        <span className="text-xs font-medium uppercase tracking-widest text-stone-500 relative z-10 flex items-center justify-between">
                                            Personel Gider <span className="text-sky-900/50">✦</span>
                                        </span>
                                        <span className="text-3xl font-light tracking-tight text-stone-300 relative z-10">
                                            {isAdmin ? `₺ ${fm(stats.personel)}` : '••••••'}
                                        </span>
                                    </div>
                                </Link>

                                <Link href="/maliyet" className="group">
                                    <div className="bg-gradient-to-br from-[#1c1a19] to-[#151413] p-6 rounded-[2rem] flex flex-col justify-between shadow-xl shadow-black/10 h-32 border border-stone-800/80 hover:border-amber-900/30 transition-all duration-500 relative overflow-hidden">
                                        <span className="text-xs font-medium uppercase tracking-widest text-stone-500 relative z-10 flex items-center justify-between">
                                            Fire / Zayiat <span className="text-amber-700/50">✦</span>
                                        </span>
                                        <span className="text-3xl font-light tracking-tight text-stone-300 relative z-10">
                                            %{stats.fire}
                                            {simulasyon !== 0 && <span className="text-sm ml-2 text-stone-500">[{simulasyon > 0 ? '+' : ''}{simulasyon}]</span>}
                                        </span>
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* GÖREV ARAMA MOTORU (Yumuşak Zen Modu) */}
                        <div className="bg-[#1c1a19]/80 backdrop-blur-3xl p-6 rounded-[2rem] shadow-xl border border-stone-800/50 flex flex-col gap-6">
                            <div className="flex flex-col gap-3">
                                <h3 className="text-[10px] font-medium uppercase text-stone-500 flex items-center gap-2 tracking-[0.15em]">
                                    <Zap size={12} className="text-teal-600/60" /> Görev & Komut (CMD+K)
                                </h3>
                                <div className="flex gap-3">
                                    <input
                                        value={commandText}
                                        onChange={(e) => setCommandText(e.target.value)}
                                        placeholder="Zihninizi buraya aktarın..."
                                        className="flex-1 bg-[#151413] text-stone-300 px-5 py-3 rounded-2xl border border-stone-800 focus:outline-none focus:border-teal-800/50 transition-colors text-sm font-light placeholder-stone-600 shadow-inner"
                                    />
                                    <button onClick={hizliGorevAtama} className="bg-[#242220] hover:bg-[#2a2826] text-stone-300 px-6 py-3 rounded-2xl font-medium transition-colors border border-stone-700/50 text-sm">
                                        Başlat
                                    </button>
                                </div>
                            </div>

                            <div className="mt-auto border-t border-stone-800/50 pt-5">
                                <div className="flex items-center justify-between mb-3 text-sm font-light">
                                    <span className="text-stone-400">Gelecek Projeksiyonu (What-if)</span>
                                    <span className="text-stone-300">%{simulasyon}</span>
                                </div>
                                <input
                                    type="range"
                                    min="-20" max="20" step="1"
                                    value={simulasyon}
                                    onChange={(e) => setSimulasyon(parseInt(e.target.value))}
                                    className="w-full accent-teal-700/50 h-1 bg-stone-800 rounded-lg outline-none appearance-none"
                                    style={{
                                        WebkitAppearance: 'none'
                                    }}
                                />
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                    input[type=range]::-webkit-slider-thumb {
                                        -webkit-appearance: none;
                                        height: 16px;
                                        width: 16px;
                                        border-radius: 50%;
                                        background: #2dd4bf;
                                        cursor: pointer;
                                        opacity: 0.7;
                                        transition: opacity 0.2s;
                                    }
                                    input[type=range]::-webkit-slider-thumb:hover {
                                        opacity: 1;
                                    }
                                `}} />
                            </div>
                        </div>

                        {/* YAPAY ZEKA DANIŞMANI */}
                        <div className="bg-[#1c1a19]/80 backdrop-blur-3xl p-6 rounded-[2rem] shadow-xl border border-stone-800/50 flex flex-col justify-between gap-6">
                            <div>
                                <h3 className="text-[10px] font-medium uppercase text-stone-500 flex items-center gap-2 tracking-[0.15em] mb-3">
                                    <Bot size={12} className="text-teal-600/60" /> Dijital Asistan / Yapay Zeka
                                </h3>
                                <div className="flex gap-3">
                                    <input
                                        value={aiSorgu}
                                        onChange={(e) => setAiSorgu(e.target.value)}
                                        placeholder="Pazar analizi veya yorum isteyin..."
                                        className="flex-1 bg-[#151413] text-stone-300 px-5 py-3 rounded-2xl border border-stone-800 focus:outline-none focus:border-teal-800/50 transition-colors text-sm font-light placeholder-stone-600 shadow-inner"
                                    />
                                    <button
                                        onClick={aiAnalizBaslat}
                                        disabled={isAiLoading}
                                        className="bg-[#242220] hover:bg-[#2a2826] text-stone-300 px-6 py-3 rounded-2xl font-medium transition-colors border border-stone-700/50 text-sm disabled:opacity-50"
                                    >
                                        {isAiLoading ? 'Süzülüyor..' : 'Analiz'}
                                    </button>
                                </div>
                            </div>

                            {aiSonuc && (
                                <div className="bg-[#151413] border border-stone-800 rounded-2xl p-4 mt-2">
                                    <p className="text-sm font-light text-stone-300 leading-relaxed whitespace-pre-wrap">{aiSonuc}</p>
                                </div>
                            )}

                            <div className="bg-[#151413] p-4 rounded-2xl border border-stone-800 flex items-center justify-between mt-auto">
                                <span className="text-[10px] font-medium text-stone-500 uppercase tracking-[0.2em] shrink-0">BANT AKIŞI</span>
                                <div className="flex items-center gap-1.5 flex-1 px-6">
                                    <div className="h-1 flex-1 bg-teal-800/60 rounded-full relative"></div>
                                    <div className="h-1 flex-1 bg-amber-900/40 relative rounded-full overflow-hidden">
                                        <div className="h-full w-1/2 bg-amber-600/40 rounded-full animate-pulse"></div>
                                    </div>
                                    <div className="h-1 flex-1 bg-stone-800 rounded-full relative"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MODÜL GRUPLARI */}
                    <div className="flex flex-col gap-6 mt-2">
                        {MODUL_GRUPLARI.map((grup, gIdx) => (
                            <div key={gIdx} className="bg-[#1c1a19]/50 p-6 rounded-[2rem] border border-stone-800/50">
                                <h3 className={`text-[10px] font-medium uppercase mb-4 ${grup.renk} tracking-[0.2em]`}>{grup.baslik}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                    {grup.moduller.map((mod, i) => (
                                        <Link href={mod.link} key={i}>
                                            <div className={`${mod.renk} transition-all duration-300 px-4 py-3 rounded-2xl flex items-center justify-center border font-light text-sm tracking-wide`}>
                                                {mod.name}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SAĞ PANEL - RADAR VE AKIŞ */}
                <div className="flex flex-col gap-6">

                    {/* Kriz & Risk Radarı -> Huzurlu Kontrol */}
                    <div className="bg-[#1c1a19]/80 backdrop-blur-3xl p-6 rounded-[2rem] shadow-xl border border-stone-800/50">
                        <h3 className="text-[10px] font-medium uppercase text-stone-500 mb-4 flex items-center gap-2 tracking-[0.15em]">
                            <AlertCircle size={12} className="text-rose-900/60" /> Durum Radarı
                        </h3>

                        {alarms.length === 0 ? (
                            <div className="text-teal-600/80 font-light text-sm bg-teal-900/10 p-4 rounded-2xl border border-teal-900/20 text-center">
                                Sistem dengede. Risk yok.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alarms.map(al => (
                                    <div key={al.id} className="bg-[#151413] p-4 rounded-2xl border border-stone-800 group">
                                        <p className="text-xs font-normal text-stone-300 leading-relaxed mb-3">{al.text}</p>
                                        <button
                                            onClick={() => setAiNedenModal({ acik: true, metin: al.neden, zarar: al.zarar })}
                                            className="text-[10px] text-stone-500 hover:text-stone-300 font-medium flex items-center gap-1 w-full justify-between transition-colors uppercase tracking-wider"
                                        >
                                            <span>Detaylı Etki Analizi</span>
                                            <ArrowRight size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-[#1c1a19]/80 backdrop-blur-3xl p-4 rounded-[2rem] shadow-xl border border-stone-800/50">
                        <Link href="/kameralar" className="block">
                            <div className={`p-3 rounded-2xl flex items-center gap-4 transition-colors ${kameraStreamDurum === 'aktif' ? 'bg-teal-900/10 hover:bg-teal-900/20' : 'bg-[#151413] hover:bg-[#242220]'}`}>
                                <div className={`w-12 h-10 rounded-xl flex items-center justify-center relative border ${kameraStreamDurum === 'aktif' ? 'border-teal-800/50 text-teal-500/80 bg-[#1c1a19]' : 'border-stone-800 text-stone-600 bg-[#151413]'}`}>
                                    <Camera size={16} className="relative z-10" />
                                    {kameraStreamDurum === 'aktif' && <div className="absolute inset-0 bg-teal-500/5 animate-pulse rounded-xl"></div>}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className={`text-[11px] font-medium flex items-center gap-1.5 uppercase tracking-wider mb-0.5 ${kameraStreamDurum === 'aktif' ? 'text-teal-600/80' : 'text-stone-500'}`}>
                                        <PlayCircle size={10} />
                                        {kameraStreamDurum === 'aktif' ? 'Görüş Aktif' : 'Görüş Kapalı'}
                                    </span>
                                    <span className={`text-[9px] font-light ${kameraStreamDurum === 'aktif' ? 'text-stone-400' : 'text-stone-600'}`}>
                                        {kameraStreamDurum === 'aktif' ? 'AI kameraları tarıyor.' : 'go2rtc başlatılmalı.'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* 8 ÇEKİRDEK AJAN AĞI (Çok yumuşak bir tasarım) */}
                    <div className="bg-[#151413] p-6 rounded-[2rem] shadow-2xl border border-stone-800/50 relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-stone-800/20 blur-3xl rounded-full"></div>

                        <h3 className="text-[10px] font-medium uppercase text-stone-500 mb-5 flex items-center justify-between gap-2 relative z-10 tracking-[0.15em]">
                            <span className="flex items-center gap-2"><Cpu size={12} className="text-stone-600" /> Ajan Ekosistemi</span>
                            <span className="flex items-center gap-1.5 text-[9px] text-teal-600/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600/60 animate-ping"></span> Otonom
                            </span>
                        </h3>

                        <div className="flex flex-col gap-3 relative z-10">
                            <div className="border border-stone-800/40 rounded-2xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Network size={12} className="text-stone-600" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-medium text-stone-400">Veri Madencileri</span>
                                        <span className="text-[9px] text-stone-500 font-light">Derin web taranıyor...</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-light text-stone-500">24/s</span>
                            </div>

                            <div className="border border-stone-800/40 rounded-2xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap size={12} className="text-stone-600" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-medium text-stone-400">Analistler</span>
                                        <span className="text-[9px] text-stone-500 font-light">Modeller güncel</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-light text-stone-500">18ms</span>
                            </div>
                        </div>

                        <Link href="/arge" className="mt-5 block text-center text-[9px] text-stone-500 hover:text-stone-300 font-medium transition-colors relative z-10 uppercase tracking-widest">
                            Detaylı Panele Geç →
                        </Link>
                    </div>

                    {/* SON MESAJLAR */}
                    <div className="bg-[#1c1a19]/80 backdrop-blur-3xl p-6 rounded-[2rem] shadow-xl border border-stone-800/50">
                        <h3 className="text-[10px] font-medium uppercase text-stone-500 mb-4 flex items-center justify-between gap-2 tracking-[0.15em]">
                            <span className="flex items-center gap-2"><MessageSquare size={12} className="text-stone-600" /> Son Mesajlar</span>
                            {mesajSayisi > 0 && (
                                <span className="text-stone-400 text-[9px]">
                                    ({mesajSayisi})
                                </span>
                            )}
                        </h3>
                        <div className="flex flex-col gap-2">
                            {sonMesajlar.length === 0 ? (
                                <div className="text-[11px] text-stone-600 text-center py-4 font-light">Sessizlik hakim.</div>
                            ) : sonMesajlar.map(m => (
                                <Link key={m.id} href="/haberlesme" className="block bg-[#151413] rounded-2xl p-3 border border-stone-800 hover:border-stone-700 transition-colors">
                                    <div className="text-[11px] font-medium text-stone-300 truncate mb-1">
                                        {m.oncelik === 'kritik' ? '🔴' : m.oncelik === 'acil' ? '🟡' : '🔵'} {m.konu}
                                    </div>
                                    <div className="text-[9px] text-stone-500 font-light">{m.gonderen_adi}</div>
                                </Link>
                            ))}
                        </div>
                        <Link href="/haberlesme" className="mt-4 block text-center text-[9px] text-stone-500 hover:text-stone-300 font-medium transition-colors uppercase tracking-widest">
                            Tümünü Gör
                        </Link>
                    </div>

                    {/* GİZLENEN MESAJLAR */}
                    <div className="bg-[#1c1a19]/80 backdrop-blur-3xl p-6 rounded-[2rem] shadow-xl border border-stone-800/50">
                        <button
                            onClick={() => setIzPanelAcik(v => !v)}
                            className="w-full flex items-center justify-between text-[10px] font-medium uppercase text-stone-500 mb-1 tracking-[0.15em]"
                        >
                            <span>Mesaj İzleri ({gizlenIzleri.length})</span>
                            <span className="text-[8px] text-stone-600">45 Gün Kuralı</span>
                        </button>
                        {izPanelAcik && (
                            <div className="flex flex-col gap-2 mt-4 max-h-40 overflow-y-auto pr-2">
                                {gizlenIzleri.length === 0 ? (
                                    <div className="text-[10px] text-stone-600 text-center py-2 font-light">Gizlenen iz yok.</div>
                                ) : gizlenIzleri.map((g, i) => {
                                    const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar;
                                    return (
                                        <div key={i} className="bg-[#151413] rounded-2xl p-3 border border-stone-800">
                                            <div className="text-[10px] font-medium text-stone-400 truncate mb-1">
                                                {b1?.konu || 'Bilinmeyen Konu'}
                                            </div>
                                            <div className="text-[9px] text-stone-600 font-light">
                                                Gizleyen: {g.kullanici_adi}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* MODEL BİLGİ ARŞİVİ */}
                    <div className="bg-[#1c1a19]/80 backdrop-blur-3xl p-6 rounded-[2rem] shadow-xl border border-stone-800/50">
                        <h3 className="text-[10px] font-medium uppercase text-stone-500 mb-3 flex items-center justify-between gap-2 tracking-[0.15em]">
                            <span>Model Arşivi</span>
                            <span className="text-[8px] text-stone-600">{modelArsiv.length} Kayıt</span>
                        </h3>
                        <div className="text-[9px] text-stone-600 mb-4 font-light leading-relaxed">
                            Bu veriler sistem hafızasına işlenir ve kalıcıdır. Sadece yetkili koordinatör silebilir.
                        </div>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                            {modelArsiv.length === 0 ? (
                                <div className="text-[10px] text-stone-600 text-center py-2 font-light">Arşiv boş.</div>
                            ) : modelArsiv.slice(0, 8).map(m => (
                                <Link key={m.id} href="/haberlesme" className="block bg-[#151413] rounded-2xl p-3 border border-stone-800 hover:border-stone-700 transition-colors">
                                    <div className="text-[10px] font-medium text-stone-300 truncate mb-1">
                                        [{m.urun_kodu || '—'}] {m.konu}
                                    </div>
                                    <div className="text-[9px] text-stone-500 font-light">{m.gonderen_adi}</div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* SUNUCU SAĞLIĞI & NİZAMBOT */}
                    <div className="bg-[#1c1a19]/80 backdrop-blur-3xl p-6 rounded-[2rem] shadow-xl border border-stone-800/50">
                        <h3 className="text-[10px] font-medium uppercase text-stone-500 mb-4 tracking-[0.15em] flex items-center gap-2">
                            <Activity size={12} className="text-stone-600" /> Sistem Nöbetçisi (NİZAMBOT)
                        </h3>

                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex justify-between items-center text-[11px] font-light text-stone-400">
                                <span>Veri Akışı Gecikmesi (Ping)</span>
                                <span className={ping === null ? 'text-stone-600' : ping < 200 ? 'text-teal-600/80' : 'text-stone-500'}>
                                    {ping === null ? 'Ölçülüyor...' : `${ping}ms`}
                                </span>
                            </div>
                            <div className="w-full bg-[#151413] rounded-full h-1 border border-stone-800 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${ping === null ? 'bg-stone-800' : ping < 200 ? 'bg-teal-800/50' : 'bg-stone-700'}`}
                                    style={{ width: ping === null ? '0%' : `${Math.min(100, (ping / 1000) * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-[#151413] rounded-2xl p-4 mb-4 flex items-center gap-3 border border-stone-800">
                            <Bot size={16} className={botDurum === 'aktif' ? 'text-teal-600/60' : 'text-stone-600'} />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-medium text-stone-300">@Lumora_47bot</span>
                                <span className="text-[9px] text-stone-500 font-light">Durum: {botDurum === 'aktif' ? 'Aktif Dinliyor' : 'Kapasite Kontrolü'}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                            {botLoglar.length === 0 ? (
                                <div className="text-[10px] text-stone-600 text-center py-2 font-light">
                                    Hareket yok.
                                </div>
                            ) : botLoglar.map((log, i) => (
                                <div key={i} className="border-b border-stone-800/50 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[9px] font-medium flex items-center gap-1 ${log.sonuc === 'basarili' ? 'text-stone-400' : 'text-rose-900/60'}`}>
                                            {log.sonuc === 'basarili' ? 'İLETİLDİ' : 'HATA'}
                                        </span>
                                        <span className="text-[8px] text-stone-600 font-light">
                                            {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-stone-500 font-light leading-snug truncate">
                                        {log.mesaj || log.islem_tipi}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export { KarargahMainContainer as default };
