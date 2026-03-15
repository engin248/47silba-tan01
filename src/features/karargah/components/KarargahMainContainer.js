'use client';
import {
    Activity, ShieldCheck, Zap, Bot, Camera, Info, ArrowRight, PlayCircle, AlertCircle, ServerCrash, Send, CheckCircle, MessageSquare, Database, Cpu, Network
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const MODUL_GRUPLARI = [
    {
        baslik: '🛡️ KARARGAH İSTİHBARATI',
        renk: 'text-emerald-800',
        moduller: [
            { name: 'Ajanlar', link: '/ajanlar', renk: 'bg-emerald-600/10 text-emerald-500 ring-1 ring-emerald-600/20 shadow-lg hover:bg-emerald-600/20 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(4,120,87,0.3)] transition-all duration-300' },
            { name: 'Ar-Ge', link: '/arge', renk: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg hover:bg-emerald-500/20 hover:ring-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300' },
            { name: 'Denetmen', link: '/denetmen', renk: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg hover:bg-emerald-500/20 hover:ring-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300' },
            { name: 'Kameralar', link: '/kameralar', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 transition-all duration-300' },
            { name: 'Haberleşme', link: '/haberlesme', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 transition-all duration-300' }
        ]
    },
    {
        baslik: '⚙️ ÜRETİM MOTORU',
        renk: 'text-emerald-800',
        moduller: [
            { name: 'Modelhane', link: '/modelhane', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'Kalıp', link: '/kalip', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'Kumaş', link: '/kumas', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'Kesim', link: '/kesim', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'İmalat', link: '/imalat', renk: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg hover:bg-emerald-500/20 hover:ring-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300' },
            { name: 'Üretim', link: '/uretim', renk: 'bg-emerald-600/10 text-emerald-500 ring-1 ring-emerald-600/20 shadow-lg hover:bg-emerald-600/20 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(4,120,87,0.3)] transition-all duration-300' }
        ]
    },
    {
        baslik: '💰 HAZİNE & E-TİCARET',
        renk: 'text-slate-100',
        moduller: [
            { name: 'Katalog', link: '/katalog', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'Siparişler', link: '/siparisler', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'Müşteriler', link: '/musteriler', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'Kasa', link: '/kasa', renk: 'bg-emerald-600/10 text-emerald-500 ring-1 ring-emerald-600/20 shadow-lg hover:bg-emerald-600/20 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(4,120,87,0.3)] transition-all duration-300' },
            { name: 'Maliyet', link: '/maliyet', renk: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg hover:bg-emerald-500/20 hover:ring-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300' },
            { name: 'Muhasebe', link: '/muhasebe', renk: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg hover:bg-emerald-500/20 hover:ring-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300' },
            { name: 'Stok', link: '/stok', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' }
        ]
    },
    {
        baslik: '🤝 İNSAN KAYNAKLARI',
        renk: 'text-slate-100',
        moduller: [
            { name: 'Personel', link: '/personel', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'Görevler', link: '/gorevler', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' }
        ]
    },
    {
        baslik: '🛠️ SİSTEM YÖNETİMİ',
        renk: 'text-slate-100',
        moduller: [
            { name: 'Raporlar', link: '/raporlar', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'Tasarım', link: '/tasarim', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'Güvenlik', link: '/guvenlik', renk: 'bg-emerald-600/10 text-emerald-500 ring-1 ring-emerald-600/20 shadow-lg hover:bg-emerald-600/20 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(4,120,87,0.3)] transition-all duration-300' },
            { name: 'Ayarlar', link: '/ayarlar', renk: 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300' },
            { name: 'Giriş', link: '/giris', renk: 'bg-[#121C2D]/60 text-slate-400 ring-1 ring-stone-500/20 hover:bg-[#18263C]/90 hover:text-slate-200 transition-all duration-300' }
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
    // [C5] Kamera widget için stream durumu
    const [kameraStreamDurum, setKameraStreamDurum] = useState('kontrol');

    useEffect(() => {
        const kontrol = async () => {
            if (document.hidden) return; // 0 MALIYET POLITIKASI
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

    // ── 45 GÜN KURALI HESAPLAMA ────────────────────────────────────────────
    const gun45Once = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();

    // ── Mesaj verilerini çek ───────────────────────────────────────────────
    const mesajlariGetir = useCallback(async () => {
        try {
            const { count } = await supabase
                .from('b1_ic_mesajlar')
                .select('id', { count: 'exact', head: true })
                .is('okundu_at', null);
            setMesajSayisi(count || 0);

            // Son 3 aktif mesaj (widget)
            const { data: aktif } = await supabase
                .from('b1_ic_mesajlar')
                .select('id, konu, oncelik, gonderen_adi, created_at, urun_id')
                .order('created_at', { ascending: false })
                .limit(3);
            setSonMesajlar(aktif || []);

            // Gizlenmiş mesaj izleri — 45 gün içindekiler (urun_id OLMAYAN)
            // Kural: urun_id varsa → Model Arşiv (kalıcı), yoksa → 45 gün sonra silinir
            const { data: gizli } = await supabase
                .from('b1_mesaj_gizli')
                .select('mesaj_id, kullanici_adi, gizlendi_at, b1_ic_mesajlar(konu, oncelik, urun_id, urun_kodu, gonderen_adi, gonderen_modul)')
                .gte('gizlendi_at', gun45Once)  // sadece son 45 gün
                .order('gizlendi_at', { ascending: false })
                .limit(20);

            const izler = (gizli || []).filter(g => {
                const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar;
                return !(b1?.urun_id);
            });
            setGizlenIzleri(izler);

            // Model arşiv — urun_id bağlı, HİÇBİR ZAMAN silinmez, koordinatör görebilir
            const { data: model } = await supabase
                .from('b1_ic_mesajlar')
                .select('id, konu, oncelik, urun_id, urun_kodu, urun_adi, gonderen_adi, created_at, okundu_at')
                .not('urun_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(50);
            setModelArsiv(model || []);

        } catch { /* sessiz */ }
    }, []);

    useEffect(() => { mesajlariGetir(); }, [mesajlariGetir]);

    // Realtime — yeni mesaj / gizleme gelince güncelle
    useEffect(() => {
        const kanal = supabase.channel('karargah-mesaj-optimize')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_ic_mesajlar' }, () => { if (!document.hidden) mesajlariGetir(); })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_mesaj_gizli' }, () => { if (!document.hidden) mesajlariGetir(); })
            .subscribe();
        return () => { supabase.removeChannel(kanal); };
    }, [mesajlariGetir]);

    // NİZAMBOT — Son aktiviteleri çek
    useEffect(() => {
        const botLogCek = async () => {
            if (document.hidden) return; // 0 MALIYET POLITIKASI
            try {
                // Bot token doğrulama
                const res = await fetch('/api/telegram-bildirim', { method: 'GET' }).catch(() => null);
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

        // Polling (setInterval) yerine Realtime ile izle
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


    const fm = (num) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(num);

    const SkeletonKutu = () => (
        <div className="animate-pulse bg-slate-100 p-4 rounded-xl shadow-lg h-28 border border-slate-200 flex flex-col justify-between">
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            <div className="h-8 bg-slate-700 rounded w-3/4"></div>
        </div>
    );

    const isAdmin = /** @type {any} */ (kullanici)?.grup === 'tam' || /** @type {any} */ (kullanici)?.rol === 'admin';

    return (
        <div className="bg-[#050B14] min-h-screen p-4 lg:p-6 text-slate-300 font-sans selection:bg-emerald-500 selection:bg-[#050B14] selection:text-emerald-400 pb-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0A192F] via-[#050B14] to-[#010409]">

            {mesaj.text && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 px-8 rounded-lg font-bold shadow-2xl transition-all ${mesaj.type === 'error' ? 'bg-red-600 text-slate-100 border-2 border-red-500' : 'bg-emerald-600 text-slate-100'}`}>
                    {mesaj.text}
                </div>
            )}

            {aiNedenModal.acik && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md p-6 rounded-2xl border border-rose-500/50 shadow-2xl relative">
                        <button onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })} className="absolute top-4 right-4 text-slate-500 hover:text-slate-100 font-black text-xl">✕</button>
                        <h2 className="text-xl font-black text-amber-600 mb-2 flex items-center gap-2"><Bot /> HermAI Yorumlayıcı</h2>
                        <div className="bg-white p-4 rounded-xl mb-4 ring-1 ring-white/5 border-0">
                            <p className="text-sm font-semibold text-slate-600">
                                <strong className="text-slate-100 block mb-1">Tespit Edilen Kök Neden (Kovaryans):</strong>
                                {aiNedenModal.metin}
                            </p>
                            <p className="mt-3 text-sm">
                                <strong className="text-rose-600 block mb-1">Günlük Potansiyel Finansal Zarar:</strong>
                                <span className="text-2xl font-black text-rose-600">₺ {fm(aiNedenModal.zarar)}</span>
                            </p>
                        </div>
                        <button onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })} className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-lg font-bold text-slate-100 transition-all">Anlaşıldı, Kapat</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 xl:gap-6 min-h-[90vh]">
                <div className="lg:col-span-3 flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.yukleniyor ? (
                            <><SkeletonKutu /><SkeletonKutu /><SkeletonKutu /><SkeletonKutu /></>
                        ) : (
                            <>
                                <Link href="/raporlar" passHref>
                                    <div className="bg-[#030907]/80 backdrop-blur-xl ring-1 ring-emerald-900/40 text-amber-400 p-4 rounded-xl flex flex-col justify-between shadow-2xl h-28 transform transition-transform hover:scale-[1.03] cursor-pointer border-[1.5px] border-amber-500/40 hover:border-amber-400 hover:shadow-amber-500/20 group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent"></div>
                                        <span className="text-xs font-black opacity-90 uppercase truncate relative z-10 text-emerald-100 flex items-center justify-between">Günlük Ciro <span className="text-amber-500/50">💰</span></span>
                                        <span className="text-3xl font-black truncate relative z-10 drop-shadow-md tracking-tight">
                                            ₺ {isAdmin ? fm(stats.ciro + ((stats.ciro * simulasyon) / 100)) : '••••••'}
                                        </span>
                                    </div>
                                </Link>
                                <Link href="/maliyet" passHref>
                                    <div className="bg-[#030907]/80 backdrop-blur-xl ring-1 ring-emerald-900/40 text-rose-300 p-4 rounded-xl flex flex-col justify-between shadow-2xl h-28 transform transition-transform hover:scale-[1.03] cursor-pointer border-[1.5px] border-emerald-900 hover:border-emerald-600 hover:shadow-emerald-500/20 group relative overflow-hidden">
                                        <span className="text-xs font-black opacity-90 uppercase truncate relative z-10 text-emerald-100 flex items-center justify-between">Toplam Maliyet <span className="text-rose-400/50">📉</span></span>
                                        <span className="text-2xl font-black truncate relative z-10">
                                            ₺ {isAdmin ? fm(stats.maliyet) : '••••••'}
                                        </span>
                                    </div>
                                </Link>
                                <Link href="/personel" passHref>
                                    <div className="bg-[#030907]/80 backdrop-blur-xl ring-1 ring-emerald-900/40 text-slate-500 p-4 rounded-xl flex flex-col justify-between shadow-2xl h-28 transform transition-transform hover:scale-[1.03] cursor-pointer border-[1.5px] border-emerald-900 hover:border-emerald-600 hover:shadow-emerald-500/20 group relative overflow-hidden">
                                        <span className="text-xs font-black opacity-90 uppercase truncate relative z-10 text-emerald-100 flex items-center justify-between">Personel Gider <span className="text-slate-400/50">👥</span></span>
                                        <span className="text-2xl font-black truncate relative z-10">
                                            ₺ {isAdmin ? fm(stats.personel) : '••••••'}
                                        </span>
                                    </div>
                                </Link>
                                <Link href="/maliyet" passHref>
                                    <div className="bg-[#030907]/80 backdrop-blur-xl ring-1 ring-emerald-900/40 text-amber-500 p-4 rounded-xl flex flex-col justify-between shadow-2xl h-28 transform transition-transform hover:scale-[1.03] cursor-pointer border-[1.5px] border-rose-900/50 hover:border-rose-500 hover:shadow-rose-500/20 group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/5 to-transparent"></div>
                                        <span className="text-xs font-black opacity-90 uppercase truncate relative z-10 text-emerald-100 flex items-center justify-between">Fire / Zayiat <span className="text-amber-500/50">⚠️</span></span>
                                        <span className="text-2xl font-black truncate relative z-10">
                                            %{stats.fire} <span className="text-xs text-rose-500">{simulasyon !== 0 && `(Sim: %+${simulasyon})`}</span>
                                        </span>
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5 p-5 rounded-2xl shadow-lg border-0 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xs font-bold uppercase text-slate-100 flex items-center gap-2 tracking-wider"><Zap size={14} className="text-amber-400" /> Görev Arama Motoru (CMD+K)</h3>
                                <div className="flex gap-2">
                                    <input
                                        value={commandText}
                                        onChange={(e) => setCommandText(e.target.value)}
                                        placeholder="/komut (Zod korumalıdır)"
                                        className="flex-1 bg-[#020610]/40 ring-1 ring-white/5 shadow-inner text-slate-100 px-4 py-2 rounded-xl border-0 ring-1 ring-white/10 focus:outline-none focus:border-amber-400 transition-colors text-sm font-semibold placeholder-slate-600"
                                    />
                                    <button onClick={hizliGorevAtama} className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 px-5 py-2 rounded-xl font-bold transition-colors shadow-lg text-sm tracking-wide">BAŞLAT</button>
                                </div>
                            </div>

                            <div className="mt-2 border-t border-white/5 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-100">Stratejik What-if Analizi (Fiyatlama):</span>
                                    <span className="text-xs font-black text-amber-400">%{simulasyon}</span>
                                </div>
                                <input
                                    type="range"
                                    min="-20" max="20" step="1"
                                    value={simulasyon}
                                    onChange={(e) => setSimulasyon(parseInt(e.target.value))}
                                    className="w-full accent-emerald-500"
                                />
                                <span className="text-[10px] text-slate-400 font-bold block mt-1">Bu sürgüyü kaydırırsanız Ciro panelindeki değer anlık revize olur.</span>
                            </div>
                        </div>

                        <div className="bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5 p-5 rounded-2xl shadow-lg border-0 flex flex-col justify-between gap-4">
                            <div>
                                <h3 className="text-xs font-bold uppercase text-slate-100 flex items-center gap-2 tracking-wider mb-2"><Bot size={14} className="text-emerald-400" /> Yapay Zeka Komuta Merkezi</h3>
                                <div className="flex gap-2">
                                    <input
                                        value={aiSorgu}
                                        onChange={(e) => setAiSorgu(e.target.value)}
                                        placeholder="Pazar Analizi veya Rapor İste..."
                                        className="flex-1 bg-[#020610]/40 ring-1 ring-white/5 shadow-inner text-slate-100 px-4 py-2 rounded-xl border-0 ring-1 ring-white/10 focus:outline-none focus:border-emerald-400 transition-colors text-sm font-semibold placeholder-slate-600"
                                    />
                                    <button
                                        onClick={aiAnalizBaslat}
                                        disabled={isAiLoading}
                                        className="bg-[#10b981] hover:bg-[#059669] text-slate-100 px-5 py-2 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap text-sm tracking-wide disabled:opacity-50"
                                    >
                                        {isAiLoading ? 'Bitiyor...' : 'ANALİZ'}
                                    </button>
                                </div>
                            </div>

                            {/* [C3] AI SONUÇ KUTUSU */}
                            {aiSonuc && (
                                <div className="mt-3 bg-[#052e16] border border-emerald-800 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Bot size={12} className="text-emerald-400" />
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">AI Analiz Sonucu</span>
                                    </div>
                                    <p className="text-xs text-emerald-200 font-semibold leading-relaxed whitespace-pre-wrap">{aiSonuc}</p>
                                </div>
                            )}

                            <div className="bg-[#020610]/40 ring-1 ring-white/5 shadow-inner p-3 rounded-lg border-0 flex items-center justify-between mt-auto">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">BANT AKIŞI:</span>
                                <div className="flex items-center gap-1 flex-1 px-4">
                                    <div className="h-2 flex-1 bg-emerald-500 rounded-l-full relative shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-400">Kesim</span>
                                    </div>
                                    <div className="h-2 flex-1 bg-amber-500 relative animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-400">Dikim</span>
                                    </div>
                                    <div className="h-2 flex-1 bg-slate-700 rounded-r-full relative">
                                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-500">Kalite</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 mt-4">
                        {MODUL_GRUPLARI.map((grup, gIdx) => (
                            <div key={gIdx} className="bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5 p-4 rounded-2xl border-0 shadow-md">
                                <h3 className={`text-[11px] font-black uppercase mb-3 ${grup.renk} tracking-widest`}>{grup.baslik}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                    {grup.moduller.map((mod, i) => (
                                        <Link href={mod.link} key={i}>
                                            <div className={`${mod.renk} transition-all p-3 rounded-xl text-center flex items-center justify-center ring-1 ring-white/5 border-0 h-16`}>
                                                <span className="font-bold text-xs tracking-wide">{mod.name}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                <div className="flex flex-col gap-4">

                    <div className="bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5 p-5 rounded-2xl shadow-lg border-0">
                        <h3 className="text-xs font-black uppercase text-amber-400 mb-3 flex items-center gap-2"><AlertCircle size={14} className="text-rose-400" /> Kriz & Risk Radarı</h3>

                        {alarms.length === 0 ? (
                            <div className="text-emerald-400 font-bold text-sm bg-[#020610]/40 ring-1 ring-white/5 shadow-inner p-3 rounded-lg border border-emerald-800">✅ Risk Tespit Edilmedi.</div>
                        ) : (
                            <div className="space-y-3">
                                {alarms.map(al => (
                                    <div key={al.id} className="bg-[#020610]/40 ring-1 ring-white/5 shadow-inner p-3 rounded-lg border-l-4 border-rose-500 shadow-xl group">
                                        <p className="text-xs font-black text-slate-100">{al.text}</p>
                                        <button
                                            onClick={() => setAiNedenModal({ acik: true, metin: al.neden, zarar: al.zarar })}
                                            className="mt-2 text-[10px] bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-amber-400 font-bold flex items-center gap-1 w-full justify-between transition-colors"
                                        >
                                            <span className="flex items-center gap-1"><Info size={12} /> HermAI: Neden & Zarar Analizi</span>
                                            <ArrowRight size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5 p-4 rounded-xl shadow-lg border-0">
                        <Link href="/kameralar" className="block">
                            <div className={`mb-2 p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${kameraStreamDurum === 'aktif' ? 'bg-[#047857] hover:bg-[#02624B]' : 'bg-blue-800 hover:bg-blue-700'}`}>
                                <div className={`w-10 h-8 bg-[#020610]/40 ring-1 ring-white/5 shadow-inner rounded flex items-center justify-center relative overflow-hidden border ${kameraStreamDurum === 'aktif' ? 'border-emerald-500/30 text-emerald-400' : 'border-red-400/50 text-red-400'}`}>
                                    <Camera size={14} className="relative z-10" />
                                    <div className={`absolute inset-0 ${kameraStreamDurum === 'aktif' ? 'bg-indigo-500/20 animate-pulse' : 'bg-red-500/10'}`}></div>
                                </div>
                                <div className="flex flex-col flex-1 pl-1">
                                    <span className={`text-[10px] font-black flex items-center gap-1 ${kameraStreamDurum === 'aktif' ? 'text-emerald-100' : 'text-rose-400'}`}>
                                        <PlayCircle size={8} />
                                        {kameraStreamDurum === 'aktif' ? 'Canlı Görüş Aktif' : kameraStreamDurum === 'kapali' ? 'Sunucu Kapalı' : 'Kontrol Ediliyor...'}
                                    </span>
                                    <span className={`text-[9px] font-semibold leading-tight ${kameraStreamDurum === 'aktif' ? 'text-emerald-200' : 'text-slate-400'}`}>
                                        {kameraStreamDurum === 'aktif' ? 'AI 4 kamerayı tarıyor.' : 'go2rtc başlatılmalı → stream-server/BASLAT.bat'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* ── 🤖 YENİ: AJAN SENATOSU (8 ÇEKİRDEK) WİDGET'I ──────────────────────── */}
                    <div className="bg-gradient-to-b from-[#022c22] to-[#047857] p-4 rounded-xl shadow-2xl border border-[#d4af37]/30 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#d4af37] opacity-20 blur-2xl rounded-full group-hover:opacity-40 transition-opacity"></div>

                        <h3 className="text-[11px] font-black uppercase text-[#d4af37] mb-3 flex items-center justify-between gap-2 relative z-10">
                            <span className="flex items-center gap-2 tracking-widest"><Cpu size={14} /> 8 Çekirdek Ajan Ağı</span>
                            <span className="flex items-center gap-1 text-[9px] bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-700/50 text-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Otonom
                            </span>
                        </h3>

                        <div className="flex flex-col gap-2 relative z-10">
                            <div className="bg-black/30 border border-emerald-800/50 rounded-lg p-2 flex items-center justify-between relative overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <Network size={12} className="text-slate-400" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-300">Veri Madencileri (Ajan 1-3)</span>
                                        <span className="text-[8px] text-slate-400">Trendyol, Zara kazınıyor...</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 font-mono">24/s</span>
                            </div>

                            <div className="bg-black/30 border border-emerald-800/50 rounded-lg p-2 flex items-center justify-between relative overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <Zap size={12} className="text-amber-400" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-300">Analistler (Ajan 4-7)</span>
                                        <span className="text-[8px] text-slate-400">Risk & Skor modelleniyor</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-amber-400 font-mono">18ms</span>
                            </div>

                            <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg p-2 flex items-center justify-between relative overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <Database size={12} className="text-[#d4af37]" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-[#d4af37]">Baş Stratejist (Ajan 8)</span>
                                        <span className="text-[8px] text-amber-200/70">M1 Ar-Ge'ye Rapor Aktarıldı</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-[#d4af37]">AKTİF</span>
                            </div>
                        </div>

                        <Link href="/arge" className="mt-3 block text-center text-[9px] text-emerald-300 font-black hover:text-[#d4af37] transition-colors relative z-10 uppercase tracking-widest">
                            Ar-Ge Paneline Git →
                        </Link>
                    </div>



                    {/* ── SON MESAJLAR WİDGET ──────────────────────── */}
                    <div className="bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5 p-4 rounded-xl shadow-lg border-0">
                        <h3 className="text-xs font-black uppercase text-slate-100 mb-3 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2"><MessageSquare size={13} className="text-emerald-400" /> Son Mesajlar</span>
                            {mesajSayisi > 0 && (
                                <span className="bg-red-600 text-slate-100 text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                    {mesajSayisi} OKUNMADI
                                </span>
                            )}
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            {sonMesajlar.length === 0 ? (
                                <div className="text-[10px] text-slate-400 text-center py-2 font-semibold">✅ Okunmamış mesaj yok</div>
                            ) : sonMesajlar.map(m => (
                                <Link key={m.id} href="/haberlesme" className="block bg-[#020610]/40 ring-1 ring-white/5 shadow-inner rounded-lg p-2 border-0 hover:border-emerald-500/80 transition-colors">
                                    <div className="text-[10px] font-black text-slate-100 truncate">
                                        {m.oncelik === 'kritik' ? '🔴' : m.oncelik === 'acil' ? '🟡' : '🔵'} {m.konu}
                                        {m.urun_id && <span className="ml-1 text-amber-500">📦</span>}
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{m.gonderen_adi}</div>
                                </Link>
                            ))}
                        </div>
                        <Link href="/haberlesme" className="mt-2 block text-center text-[9px] text-emerald-400 font-black hover:text-emerald-300 transition-colors">
                            Haberleşme → Tümünü Gör
                        </Link>
                    </div>

                    {/* ── 45-GÜN MESAJ İZ PANELİ ──────────────────── */}
                    <div className="bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5 p-4 rounded-xl shadow-lg border-0">
                        <button
                            onClick={() => setIzPanelAcik(v => !v)}
                            className="w-full flex items-center justify-between text-xs font-black uppercase text-amber-400 mb-1"
                        >
                            <span>🗂️ Gizlenen Mesaj İzleri ({gizlenIzleri.length})</span>
                            <span className="text-[9px] text-slate-500 font-semibold">45 Gün Kuralı</span>
                        </button>
                        {izPanelAcik && (
                            <div className="flex flex-col gap-1 mt-2 max-h-40 overflow-y-auto">
                                {gizlenIzleri.length === 0 ? (
                                    <div className="text-[10px] text-slate-400 text-center py-2">Son 45 günde gizlenen iz yok</div>
                                ) : gizlenIzleri.map((g, i) => {
                                    const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar;
                                    return (
                                        <div key={i} className="bg-[#020610]/40 ring-1 ring-white/5 shadow-inner rounded p-1.5 border-0">
                                            <div className="text-[9px] font-black text-amber-400 truncate">
                                                {b1?.konu || 'Bilinmeyen Konu'}
                                            </div>
                                            <div className="text-[8px] text-slate-500">
                                                Gizleyen: {g.kullanici_adi} · {b1?.gonderen_modul}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="text-[8px] text-amber-300/80 text-center mt-1 font-semibold">
                                    ⚠️ 45. günden sonra sistem bu izleri otomatik temizler
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5 p-4 rounded-xl shadow-lg border-0">
                        <h3 className="text-xs font-black uppercase text-slate-100 mb-2 flex items-center justify-between gap-2">
                            <span><span className="text-emerald-400">📦</span> Model Bilgi Arşivi</span>
                            <span className="text-[9px] text-slate-500 font-semibold">{modelArsiv.length} kayıt · KALICI</span>
                        </h3>
                        <div className="text-[8px] text-slate-500 mb-2 leading-tight">
                            Ürün/model bağlı mesajlar hiçbir zaman silinmez. AI ajanlar bu veriyle eğitim alır.
                            Tek silme yetkisi: Koordinatör (PIN).
                        </div>
                        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                            {modelArsiv.length === 0 ? (
                                <div className="text-[10px] text-slate-500 text-center py-2">Model bağlı mesaj yok</div>
                            ) : modelArsiv.slice(0, 8).map(m => (
                                <Link key={m.id} href="/haberlesme" className="block bg-[#020610]/40 ring-1 ring-white/5 shadow-inner rounded p-1.5 border-0 hover:border-emerald-500 transition-colors">
                                    <div className="text-[9px] font-black text-emerald-400 truncate">
                                        📦 [{m.urun_kodu || '—'}] {m.konu}
                                    </div>
                                    <div className="text-[8px] text-slate-400">{m.gonderen_adi} · {new Date(m.created_at).toLocaleDateString('tr-TR')}</div>
                                </Link>
                            ))}
                        </div>
                    </div>


                    <div className="bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5 p-5 rounded-2xl shadow-lg border-0">
                        <h3 className="text-xs font-black uppercase text-slate-100 mb-3 flex items-center gap-2"><Activity size={14} className="text-emerald-400" /> Sunucu Sağlığı</h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                                <span>DB Soket (ms)</span>
                                <span className={ping === null ? 'text-slate-500' : ping < 200 ? 'text-emerald-400' : ping < 500 ? 'text-amber-400' : 'text-rose-500'}>
                                    {ping === null ? 'Ölçülüyor...' : `${ping}ms`}
                                </span>
                            </div>
                            <div className="w-full bg-[#020610]/40 ring-1 ring-white/5 shadow-inner rounded-full h-1.5 border-0">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${ping === null ? 'bg-slate-600' : ping < 200 ? 'bg-emerald-500' : ping < 500 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: ping === null ? '0%' : `${Math.min(100, (ping / 1000) * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold mt-2 text-slate-200">
                                <span>Realtime</span>
                                <span className="text-emerald-400">✅ Aktif</span>
                            </div>
                        </div>
                    </div>

                    {/* NİZAMBOT PANELİ */}
                    <div className="bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5 p-5 rounded-2xl shadow-lg border-0">
                        <h3 className="text-xs font-black uppercase text-slate-100 mb-3 flex items-center gap-2 justify-between">
                            <span className="flex items-center gap-2"><Bot size={14} className="text-emerald-400" /> NİZAMBOT</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${botDurum === 'aktif' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/50' :
                                botDurum === 'hata' ? 'bg-rose-900/50 text-rose-400 border border-rose-500/50' :
                                    'bg-blue-800 text-slate-400'
                                }`}>
                                {botDurum === 'aktif' ? '● AKTİF' : botDurum === 'hata' ? '● HATA' : '● KONTROL'}
                            </span>
                        </h3>

                        {/* Bot kimlik bilgisi */}
                        <div className="bg-[#020610]/40 ring-1 ring-white/5 shadow-inner rounded-lg p-2 mb-3 flex items-center gap-2 border-0">
                            <Bot size={12} className="text-emerald-400 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-100">@Lumora_47bot</span>
                                <span className="text-[9px] text-slate-500">Sistem Adı: NİZAMBOT</span>
                            </div>
                        </div>

                        {/* Son aktiviteler */}
                        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                            {botLoglar.length === 0 ? (
                                <div className="text-[10px] text-slate-500 text-center py-3 font-semibold">
                                    Henüz bot aktivitesi yok
                                </div>
                            ) : botLoglar.map((log, i) => (
                                <div key={i} className="bg-[#020610]/40 ring-1 ring-white/5 shadow-inner rounded-lg p-2 border-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={`text-[9px] font-black flex items-center gap-1 ${log.sonuc === 'basarili' ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                            {log.sonuc === 'basarili'
                                                ? <><CheckCircle size={8} /> GÖNDER</>
                                                : <><AlertCircle size={8} /> HATA</>
                                            }
                                        </span>
                                        <span className="text-[8px] text-slate-500 font-semibold">
                                            {new Date(log.created_at).toLocaleString('tr-TR', {
                                                day: '2-digit', month: '2-digit',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-slate-200 font-medium leading-tight truncate">
                                        {log.mesaj || log.islem_tipi}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <Link href="/ajanlar" className="mt-3 block text-center text-[9px] text-emerald-400 font-black hover:text-emerald-300 transition-colors">
                            Tüm Bot Kayıtları → Ajanlar Sayfası
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}

export { KarargahMainContainer as default };
