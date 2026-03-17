'use client';
import {
    Activity, ShieldCheck, Zap, Bot, Camera, ArrowRight, AlertCircle, Send,
    MessageSquare, Cpu, Network, ChevronRight, Search, BarChart3, Scissors,
    Factory, ShoppingBag, Package, Users, Wallet, FileText, Settings,
    Lock, Palette, ClipboardCheck, BookOpen, Eye, Radio, Shirt, Ruler, Layers,
    Boxes, UserCircle, Receipt, PieChart, Database, MonitorPlay
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ═══════════════════════════════════════════════
// KARARGAH v3 — Final Tasarım
// GitHub Dark (#0d1117) · İndigo Aksan · Lucide İkonlar
// ═══════════════════════════════════════════════

const MODUL_GRUPLARI = [
    {
        baslik: 'Karargah İstihbaratı',
        moduller: [
            { name: 'Ajanlar', link: '/ajanlar', icon: Bot },
            { name: 'Ar-Ge & Trend', link: '/arge', icon: Search },
            { name: 'Denetmen', link: '/denetmen', icon: Eye },
            { name: 'Kameralar', link: '/kameralar', icon: MonitorPlay },
            { name: 'Haberleşme', link: '/haberlesme', icon: Radio }
        ]
    },
    {
        baslik: 'Üretim Motoru',
        moduller: [
            { name: 'Modelhane', link: '/modelhane', icon: Shirt },
            { name: 'Kalıp', link: '/kalip', icon: Ruler },
            { name: 'Kumaş', link: '/kumas', icon: Layers },
            { name: 'Kesim', link: '/kesim', icon: Scissors },
            { name: 'İmalat', link: '/imalat', icon: Factory },
            { name: 'Üretim', link: '/uretim', icon: Settings }
        ]
    },
    {
        baslik: 'Hazine & E-Ticaret',
        moduller: [
            { name: 'Katalog', link: '/katalog', icon: ShoppingBag },
            { name: 'Siparişler', link: '/siparisler', icon: Package },
            { name: 'Müşteriler', link: '/musteriler', icon: Users },
            { name: 'Kasa', link: '/kasa', icon: Wallet },
            { name: 'Maliyet', link: '/maliyet', icon: PieChart },
            { name: 'Muhasebe', link: '/muhasebe', icon: Receipt },
            { name: 'Stok', link: '/stok', icon: Boxes }
        ]
    },
    {
        baslik: 'İnsan Kaynakları',
        moduller: [
            { name: 'Personel', link: '/personel', icon: UserCircle },
            { name: 'Görevler', link: '/gorevler', icon: ClipboardCheck }
        ]
    },
    {
        baslik: 'Sistem Yönetimi',
        moduller: [
            { name: 'Raporlar', link: '/raporlar', icon: BarChart3 },
            { name: 'Tasarım', link: '/tasarim', icon: Palette },
            { name: 'Güvenlik', link: '/guvenlik', icon: Lock },
            { name: 'Ayarlar', link: '/ayarlar', icon: Settings }
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
            } catch { setKameraStreamDurum('kapali'); }
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
            const { count } = await supabase.from('b1_ic_mesajlar').select('id', { count: 'exact', head: true }).is('okundu_at', null);
            setMesajSayisi(count || 0);
            const { data: aktif } = await supabase.from('b1_ic_mesajlar').select('id, konu, oncelik, gonderen_adi, created_at, urun_id').order('created_at', { ascending: false }).limit(3);
            setSonMesajlar(aktif || []);
            const { data: gizli } = await supabase.from('b1_mesaj_gizli').select('mesaj_id, kullanici_adi, gizlendi_at, b1_ic_mesajlar(konu, oncelik, urun_id, urun_kodu, gonderen_adi, gonderen_modul)').gte('gizlendi_at', gun45Once).order('gizlendi_at', { ascending: false }).limit(20);
            const izler = (gizli || []).filter(g => { const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar; return !(b1?.urun_id); });
            setGizlenIzleri(izler);
            const { data: model } = await supabase.from('b1_ic_mesajlar').select('id, konu, oncelik, urun_id, urun_kodu, urun_adi, gonderen_adi, created_at, okundu_at').not('urun_id', 'is', null).order('created_at', { ascending: false }).limit(50);
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
                const { data } = await supabase.from('b1_agent_loglari').select('ajan_adi, islem_tipi, mesaj, sonuc, created_at').eq('ajan_adi', 'NİZAMBOT').order('created_at', { ascending: false }).limit(8);
                setBotLoglar(data || []);
                setBotDurum('aktif');
            } catch { setBotDurum('hata'); }
        };
        botLogCek();
        const kanal = supabase.channel('nizambot-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_agent_loglari', filter: 'ajan_adi=eq.NİZAMBOT' }, botLogCek).subscribe();
        const handleVisibility = () => { if (!document.hidden) botLogCek(); };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => { supabase.removeChannel(kanal); document.removeEventListener('visibilitychange', handleVisibility); };
    }, []);

    const fm = (/** @type {any} */ num) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(num);
    const isAdmin = /** @type {any} */ (kullanici)?.grup === 'tam' || /** @type {any} */ (kullanici)?.rol === 'admin';

    // ═══════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════
    return (
        <div className="min-h-screen text-white font-sans" style={{ background: '#0d1117' }}>

            {/* Bildirim Toast */}
            {mesaj.text && (
                <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 py-3 px-6 rounded-xl text-sm font-medium shadow-2xl border ${mesaj.type === 'error' ? 'bg-red-500/15 text-red-300 border-red-500/25' : 'bg-indigo-500/15 text-indigo-200 border-indigo-500/25'}`}>
                    {mesaj.text}
                </div>
            )}

            {/* AI Modal */}
            {aiNedenModal.acik && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })}>
                    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()} style={{ animation: 'fadeUp 0.2s ease-out' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-semibold flex items-center gap-2"><Bot size={16} className="text-indigo-400" /> Derin Analiz</h2>
                            <button onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })} className="text-[#8b949e] hover:text-white text-lg">✕</button>
                        </div>
                        <p className="text-sm text-[#8b949e] leading-relaxed mb-6">{aiNedenModal.metin}</p>
                        <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4 mb-6">
                            <span className="text-[10px] text-[#484f58] uppercase tracking-widest">Potansiyel Etki</span>
                            <p className="text-2xl font-light text-red-400 mt-1">₺ {fm(aiNedenModal.zarar)}</p>
                        </div>
                        <button onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })} className="w-full py-3 text-sm font-medium text-[#8b949e] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-colors">Kapat</button>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>

                {/* ── METRİK KARTLARI ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Günlük Ciro', value: `₺${fm(stats.ciro + ((stats.ciro * simulasyon) / 100))}`, color: '#818cf8' },
                        { label: 'Toplam Maliyet', value: `₺${fm(stats.maliyet)}`, color: '#f472b6' },
                        { label: 'Personel Gider', value: `₺${fm(stats.personel)}`, color: '#38bdf8' },
                        { label: 'Fire / Zayiat', value: `%${stats.fire}`, color: '#fbbf24' },
                    ].map((m, i) => (
                        <div key={i} className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 hover:border-[#30363d] transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-medium text-[#484f58] uppercase tracking-wider">{m.label}</span>
                                <div className="w-2 h-2 rounded-full" style={{ background: m.color }}></div>
                            </div>
                            <span className="text-2xl font-semibold text-[#e6edf3]">{isAdmin ? m.value : '••••'}</span>
                        </div>
                    ))}
                </div>

                {/* ── GÖREV + AI ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                    {/* Komut */}
                    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
                        <div className="text-[11px] font-medium text-[#484f58] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Zap size={12} className="text-indigo-400" /> Görev & Komut
                        </div>
                        <div className="flex gap-2 mb-4">
                            <input value={commandText} onChange={(e) => setCommandText(e.target.value)} placeholder="Ne yapmamı istersiniz..."
                                className="flex-1 bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-2.5 text-sm text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-indigo-500/50 transition-colors" />
                            <button onClick={hizliGorevAtama} className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                                Gönder
                            </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#484f58] mb-2">
                            <span>Projeksiyon</span>
                            <span className="text-[#8b949e] font-medium">%{simulasyon}</span>
                        </div>
                        <input type="range" min="-20" max="20" step="1" value={simulasyon} onChange={(e) => setSimulasyon(parseInt(e.target.value))}
                            className="w-full h-1 rounded-lg outline-none appearance-none cursor-pointer bg-[#21262d]" />
                    </div>

                    {/* AI */}
                    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
                        <div className="text-[11px] font-medium text-[#484f58] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Bot size={12} className="text-indigo-400" /> Dijital Asistan
                        </div>
                        <div className="flex gap-2 mb-4">
                            <input value={aiSorgu} onChange={(e) => setAiSorgu(e.target.value)} placeholder="Analiz veya yorum isteyin..."
                                className="flex-1 bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-2.5 text-sm text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-indigo-500/50 transition-colors" />
                            <button onClick={aiAnalizBaslat} disabled={isAiLoading}
                                className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-40">
                                {isAiLoading ? '...' : 'Analiz'}
                            </button>
                        </div>
                        {aiSonuc && (
                            <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-4 mb-3">
                                <p className="text-sm text-[#8b949e] leading-relaxed whitespace-pre-wrap">{aiSonuc}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-[#484f58] uppercase tracking-widest">Bant</span>
                            <div className="flex items-center gap-1 flex-1">
                                <div className="h-1 flex-[3] bg-indigo-500/30 rounded-full"></div>
                                <div className="h-1 flex-[2] bg-amber-500/20 rounded-full"></div>
                                <div className="h-1 flex-[5] bg-[#21262d] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── ANA İÇERİK: SOL MODÜLLER + SAĞ PANEL ── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">

                    {/* SOL: Modüller (3 kolon) */}
                    <div className="lg:col-span-3 space-y-3">
                        {MODUL_GRUPLARI.map((grup, gIdx) => (
                            <div key={gIdx} className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
                                <h3 className="text-[11px] font-medium text-[#484f58] uppercase tracking-wider mb-3">{grup.baslik}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                                    {grup.moduller.map((mod, i) => {
                                        const Icon = mod.icon;
                                        return (
                                            <Link href={mod.link} key={i}>
                                                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#0d1117] border border-[#21262d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#30363d] hover:bg-[#161b22] transition-all group cursor-pointer">
                                                    <Icon size={14} className="text-[#484f58] group-hover:text-indigo-400 transition-colors shrink-0" />
                                                    <span className="text-sm font-medium truncate">{mod.name}</span>
                                                    <ChevronRight size={11} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SAĞ: Durum Panelleri (1 kolon) */}
                    <div className="space-y-3">

                        {/* Durum Radarı — sadece ilk 3 alarm, tekrar yok */}
                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
                            <h3 className="text-[11px] font-medium text-[#484f58] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <AlertCircle size={12} className="text-amber-400/60" /> Durum Radarı
                            </h3>
                            {alarms.length === 0 ? (
                                <div className="text-sm text-[#30363d] text-center py-4 flex flex-col items-center gap-2">
                                    <ShieldCheck size={20} className="text-emerald-500/40" />
                                    <span>Sistem dengede</span>
                                </div>
                            ) : alarms.slice(0, 3).map((al, idx) => (
                                <div key={al.id || idx} className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 mb-2 last:mb-0">
                                    <p className="text-xs text-[#8b949e] leading-relaxed mb-2 line-clamp-2">{al.text}</p>
                                    <button onClick={() => setAiNedenModal({ acik: true, metin: al.neden, zarar: al.zarar })}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 uppercase tracking-wider transition-colors">
                                        Analiz <ArrowRight size={9} />
                                    </button>
                                </div>
                            ))}
                            {alarms.length > 3 && (
                                <div className="text-center mt-2">
                                    <span className="text-[10px] text-[#484f58]">+{alarms.length - 3} alarm daha</span>
                                </div>
                            )}
                        </div>

                        {/* Kamera */}
                        <Link href="/kameralar" className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex items-center gap-3 hover:border-[#30363d] transition-colors block">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kameraStreamDurum === 'aktif' ? 'bg-emerald-500/10' : 'bg-[#21262d]'}`}>
                                <Camera size={15} className={kameraStreamDurum === 'aktif' ? 'text-emerald-400' : 'text-[#484f58]'} />
                            </div>
                            <div>
                                <div className={`text-xs font-semibold ${kameraStreamDurum === 'aktif' ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                                    {kameraStreamDurum === 'aktif' ? 'Kameralar Aktif' : 'Görüş Kapalı'}
                                </div>
                                <div className="text-[10px] text-[#484f58]">{kameraStreamDurum === 'aktif' ? 'AI tarama aktif' : 'go2rtc başlatılmalı'}</div>
                            </div>
                        </Link>

                        {/* Ajan Ağı */}
                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
                            <h3 className="text-[11px] font-medium text-[#484f58] uppercase tracking-wider mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Cpu size={12} /> Ajan Ağı</span>
                                <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" style={{ animation: 'subtle-pulse 2s ease-in-out infinite' }}></span> Otonom
                                </span>
                            </h3>
                            {[
                                { label: 'Veri Madencileri', desc: 'Web tarama aktif', stat: '24/s', icon: Network },
                                { label: 'Analistler', desc: 'Modeller güncel', stat: '18ms', icon: Zap },
                            ].map((a, i) => (
                                <div key={i} className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 mb-2 last:mb-0 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <a.icon size={13} className="text-[#484f58]" />
                                        <div><div className="text-xs font-medium text-[#8b949e]">{a.label}</div><div className="text-[10px] text-[#484f58]">{a.desc}</div></div>
                                    </div>
                                    <span className="text-[10px] text-[#484f58] font-mono">{a.stat}</span>
                                </div>
                            ))}
                            <Link href="/arge" className="mt-3 block text-center text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors uppercase tracking-wider">
                                Detay →
                            </Link>
                        </div>

                        {/* Mesajlar */}
                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
                            <h3 className="text-[11px] font-medium text-[#484f58] uppercase tracking-wider mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-2"><MessageSquare size={12} /> Mesajlar</span>
                                {mesajSayisi > 0 && <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{mesajSayisi}</span>}
                            </h3>
                            {sonMesajlar.length === 0 ? (
                                <div className="text-xs text-[#30363d] text-center py-3">Yeni mesaj yok</div>
                            ) : sonMesajlar.map(m => (
                                <Link key={m.id} href="/haberlesme" className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 mb-2 last:mb-0 block hover:border-[#30363d] transition-colors">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${m.oncelik === 'kritik' ? 'bg-red-400' : m.oncelik === 'acil' ? 'bg-amber-400' : 'bg-indigo-400'}`}></span>
                                        <span className="text-xs font-medium text-[#e6edf3] truncate">{m.konu}</span>
                                    </div>
                                    <div className="text-[10px] text-[#484f58] pl-4">{m.gonderen_adi}</div>
                                </Link>
                            ))}
                        </div>

                        {/* NİZAMBOT Mini */}
                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
                            <h3 className="text-[11px] font-medium text-[#484f58] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Activity size={12} /> NİZAMBOT
                            </h3>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Bot size={14} className={botDurum === 'aktif' ? 'text-indigo-400' : 'text-[#484f58]'} />
                                    <span className="text-xs font-medium text-[#8b949e]">@Lumora_47bot</span>
                                </div>
                                <span className={`text-[10px] font-mono ${ping !== null && ping < 200 ? 'text-emerald-400' : 'text-[#484f58]'}`}>
                                    {ping === null ? '...' : `${ping}ms`}
                                </span>
                            </div>
                            <div className="space-y-1.5 max-h-28 overflow-y-auto styled-scroll">
                                {botLoglar.length === 0 ? (
                                    <div className="text-[10px] text-[#30363d] text-center py-2">Log yok</div>
                                ) : botLoglar.slice(0, 5).map((log, i) => (
                                    <div key={i} className="flex items-center justify-between py-1 border-b border-[#21262d] last:border-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-1 h-1 rounded-full ${log.sonuc === 'basarili' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                            <span className="text-[10px] text-[#8b949e] truncate max-w-[140px]">{log.mesaj || log.islem_tipi}</span>
                                        </div>
                                        <span className="text-[9px] text-[#30363d] font-mono shrink-0">
                                            {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gizlenen İzler — Minimal */}
                        {gizlenIzleri.length > 0 && (
                            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
                                <button onClick={() => setIzPanelAcik(v => !v)} className="w-full flex items-center justify-between text-[11px] font-medium text-[#484f58] uppercase tracking-wider">
                                    <span>İzler ({gizlenIzleri.length})</span>
                                    <ChevronRight size={12} className={`transition-transform ${izPanelAcik ? 'rotate-90' : ''}`} />
                                </button>
                                {izPanelAcik && (
                                    <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto styled-scroll">
                                        {gizlenIzleri.map((g, i) => {
                                            const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar;
                                            return (
                                                <div key={i} className="text-[10px] text-[#484f58] py-1 border-b border-[#21262d] last:border-0 truncate">
                                                    {b1?.konu || '—'} <span className="text-[#30363d]">· {g.kullanici_adi}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Slider thumb */}
            <style dangerouslySetInnerHTML={{
                __html: `
                input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; height:14px; width:14px; border-radius:50%; background:#6366f1; cursor:pointer; border:2px solid #0d1117; }
                input[type=range]::-moz-range-thumb { height:14px; width:14px; border-radius:50%; background:#6366f1; cursor:pointer; border:2px solid #0d1117; }
            `}} />
        </div>
    );
}

export { KarargahMainContainer as default };
