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
import AjanKomutaGostergesi from '@/components/AjanKomutaGostergesi';
import { ServerCrash, Gauge } from 'lucide-react';

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

    // M5 - Stres Testi State
    const [stresTest, setStresTest] = useState(/** @type {{aktif: boolean, url: string, count: number, concurrency: number, sonuc: any, durum: string, hata: any}} */({ aktif: false, url: '/api/cron-ajanlar', count: 100, concurrency: 10, sonuc: null, durum: 'bekliyor', hata: null }));

    const baslatStresTesti = async () => {
        setStresTest(prv => ({ ...prv, durum: 'yukleniyor', sonuc: null, hata: null }));
        try {
            const res = await fetch('/api/stress-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: stresTest.url, count: Number(stresTest.count), concurrency: Number(stresTest.concurrency) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Test başarısız oldu');
            setStresTest(prv => ({ ...prv, durum: 'tamamlandi', sonuc: data }));
        } catch (/** @type {any} */ err) {
            setStresTest(prv => ({ ...prv, durum: 'hata', hata: err.message }));
        }
    };

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
        <div className="min-h-screen font-sans">

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
                        { label: 'Günlük Ciro', value: `₺${fm(stats.ciro + ((stats.ciro * simulasyon) / 100))}`, color: '#22c55e', tx: 'text-white' },
                        { label: 'Toplam Maliyet', value: `₺${fm(stats.maliyet)}`, color: '#3b82f6', tx: 'text-white' },
                        { label: 'Personel Gider', value: `₺${fm(stats.personel)}`, color: '#8b5cf6', tx: 'text-white' },
                        { label: 'Fire / Zayiat', value: `%${stats.fire}`, color: '#ef4444', tx: 'text-white' },
                    ].map((m, i) => (
                        <div key={i} className="rounded-xl p-5 shadow-lg border border-white/10 hover:shadow-xl transition-shadow" style={{ background: m.color }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">{m.label}</span>
                                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]"></div>
                            </div>
                            <span className="text-3xl font-bold text-white tracking-tight">{isAdmin ? m.value : '••••'}</span>
                        </div>
                    ))}
                </div>

                {/* ── GÖREV + AI ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                    {/* Komut */}
                    <div className="bg-[#122b27] border border-[#1e4a43] rounded-xl p-5 shadow-md">
                        <div className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Zap size={12} className="text-emerald-400" /> Görev Arama Motoru (CMD+K)
                        </div>
                        <div className="flex gap-2 mb-4">
                            <input value={commandText} onChange={(e) => setCommandText(e.target.value)} placeholder="/komut (Zod korumalıdır)"
                                className="flex-1 bg-[#0b1d1a] border border-[#1e4a43] rounded-lg px-4 py-2.5 text-sm text-white placeholder-emerald-600/50 outline-none focus:border-emerald-500/50 transition-colors" />
                            <button onClick={hizliGorevAtama} className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                                BAŞLAT
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
                    <div className="bg-[#122b27] border border-[#1e4a43] rounded-xl p-5 shadow-md">
                        <div className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Bot size={12} className="text-emerald-400" /> Yapay Zeka Komuta Merkezi
                        </div>
                        <div className="flex gap-2 mb-4">
                            <input value={aiSorgu} onChange={(e) => setAiSorgu(e.target.value)} placeholder="Pazar Analizi veya Rapor İsteyin..."
                                className="flex-1 bg-[#0b1d1a] border border-[#1e4a43] rounded-lg px-4 py-2.5 text-sm text-white placeholder-emerald-600/50 outline-none focus:border-emerald-500/50 transition-colors" />
                            <button onClick={aiAnalizBaslat} disabled={isAiLoading}
                                className="px-5 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-40">
                                {isAiLoading ? '...' : 'ANALİZ'}
                            </button>
                        </div>
                        {aiSonuc && (
                            <div className="bg-[#0b1d1a] border border-emerald-500/30 rounded-lg p-4 mb-3">
                                <p className="text-sm text-emerald-100 leading-relaxed whitespace-pre-wrap">{aiSonuc}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">Bant Akışı:</span>
                            <div className="flex items-center gap-1 flex-1">
                                <div className="h-1.5 flex-[3] bg-emerald-500 rounded-full"></div>
                                <div className="h-1.5 flex-[2] bg-amber-500 rounded-full"></div>
                                <div className="h-1.5 flex-[5] bg-[#1e4a43] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── EVRENSEL AJAN KOMUTA AĞI ── */}
                <div className="mb-6" style={{ animation: 'fadeUp 0.5s ease-out' }}>
                    <AjanKomutaGostergesi />
                </div>

                {/* ── ANA İÇERİK: SOL MODÜLLER + SAĞ PANEL ── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">

                    {/* SOL: Modüller (3 kolon) */}
                    <div className="lg:col-span-3 space-y-3">
                        {MODUL_GRUPLARI.map((grup, gIdx) => (
                            <div key={gIdx} className="bg-[#122b27] border border-[#1e4a43] rounded-xl p-5 shadow-lg">
                                <h3 className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-4 border-b border-[#1e4a43] pb-2">{grup.baslik}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {grup.moduller.map((md, mIdx) => {
                                        const MIcon = md.icon;
                                        return (
                                            <Link href={md.link} key={mIdx}>
                                                <div className="bg-[#173a34] hover:bg-white hover:text-[#0D2825] border border-[#265e54] rounded-xl p-3 flex flex-col items-center justify-center gap-2 group transition-all duration-300 cursor-pointer h-24 shadow-md">
                                                    <MIcon size={24} className="text-emerald-400 group-hover:text-[#0D2825] transition-colors" />
                                                    <span className="text-xs font-semibold text-white/90 group-hover:text-[#0D2825] text-center">{md.name}</span>
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
                        <Link href="/kameralar" className="bg-[#122b27] border border-[#1e4a43] rounded-xl p-4 flex items-center gap-3 hover:border-emerald-500/50 transition-colors block shadow-md">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kameraStreamDurum === 'aktif' ? 'bg-emerald-500/20' : 'bg-[#0b1d1a]'}`}>
                                <Camera size={15} className={kameraStreamDurum === 'aktif' ? 'text-emerald-400' : 'text-emerald-300'} />
                            </div>
                            <div>
                                <div className={`text-xs font-semibold ${kameraStreamDurum === 'aktif' ? 'text-emerald-400' : 'text-emerald-200'}`}>
                                    {kameraStreamDurum === 'aktif' ? 'Kameralar Aktif' : 'Görüş Kapalı'}
                                </div>
                                <div className="text-[10px] text-emerald-100/70">{kameraStreamDurum === 'aktif' ? 'AI tarama aktif' : 'go2rtc başlatılmalı'}</div>
                            </div>
                        </Link>

                        {/* Mesajlar */}
                        <div className="bg-[#122b27] border border-[#1e4a43] rounded-xl p-5 shadow-md">
                            <h3 className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-2"><MessageSquare size={12} /> Mesajlar</span>
                                {mesajSayisi > 0 && <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{mesajSayisi}</span>}
                            </h3>
                            {sonMesajlar.length === 0 ? (
                                <div className="text-xs text-emerald-100/50 text-center py-3">Yeni mesaj yok</div>
                            ) : sonMesajlar.map(m => (
                                <Link key={m.id} href="/haberlesme" className="bg-[#0b1d1a] border border-[#1e4a43] rounded-lg p-3 mb-2 last:mb-0 block hover:border-emerald-500/50 transition-colors">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${m.oncelik === 'kritik' ? 'bg-red-400' : m.oncelik === 'acil' ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                                        <span className="text-xs font-medium text-white truncate">{m.konu}</span>
                                    </div>
                                    <div className="text-[10px] text-emerald-100/70 pl-4">{m.gonderen_adi}</div>
                                </Link>
                            ))}
                        </div>

                        {/* NİZAMBOT Mini */}
                        <div className="bg-[#122b27] border border-[#1e4a43] rounded-xl p-5 shadow-md">
                            <h3 className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Activity size={12} /> NİZAMBOT
                            </h3>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Bot size={14} className={botDurum === 'aktif' ? 'text-emerald-400' : 'text-emerald-100/50'} />
                                    <span className="text-xs font-medium text-white">@Lumora_47bot</span>
                                </div>
                                <span className={`text-[10px] font-mono ${ping !== null && ping < 200 ? 'text-emerald-400' : 'text-emerald-100/70'}`}>
                                    {ping === null ? '...' : `${ping}ms`}
                                </span>
                            </div>
                            <div className="space-y-1.5 max-h-28 overflow-y-auto styled-scroll">
                                {botLoglar.length === 0 ? (
                                    <div className="text-[10px] text-emerald-100/50 text-center py-2">Log yok</div>
                                ) : botLoglar.slice(0, 5).map((log, i) => (
                                    <div key={i} className="flex items-center justify-between py-1 border-b border-[#1e4a43] last:border-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-1 h-1 rounded-full ${log.sonuc === 'basarili' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                            <span className="text-[10px] text-emerald-100/90 truncate max-w-[140px]">{log.mesaj || log.islem_tipi}</span>
                                        </div>
                                        <span className="text-[9px] text-emerald-100/50 font-mono shrink-0">
                                            {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gizlenen İzler — Minimal */}
                        {gizlenIzleri.length > 0 && (
                            <div className="bg-[#122b27] border border-[#1e4a43] rounded-xl p-5 shadow-md">
                                <button onClick={() => setIzPanelAcik(v => !v)} className="w-full flex items-center justify-between text-[11px] font-medium text-emerald-200 uppercase tracking-wider">
                                    <span>İzler ({gizlenIzleri.length})</span>
                                    <ChevronRight size={12} className={`transition-transform ${izPanelAcik ? 'rotate-90' : ''}`} />
                                </button>
                                {izPanelAcik && (
                                    <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto styled-scroll">
                                        {gizlenIzleri.map((g, i) => {
                                            const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar;
                                            return (
                                                <div key={i} className="text-[10px] text-emerald-100/90 py-1 border-b border-[#1e4a43] last:border-0 truncate">
                                                    {b1?.konu || '—'} <span className="text-emerald-100/50">· {g.kullanici_adi}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* M5 - Sunucu Yük (Stres) Testi */}
                        {isAdmin && (
                            <div className="bg-[#122b27] border border-red-500/20 rounded-xl p-5 shadow-lg">
                                <h3 className="text-[11px] font-medium text-red-300 uppercase tracking-wider mb-4 flex items-center justify-between border-b border-red-500/20 pb-2">
                                    <span className="flex items-center gap-2"><ServerCrash size={12} className="text-red-400" /> STRES TESTİ MERKEZİ</span>
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input value={stresTest.url} onChange={e => setStresTest(p => ({ ...p, url: e.target.value }))} className="flex-1 bg-[#0b1d1a] border border-[#1e4a43] rounded-lg px-3 py-1.5 text-xs text-white" placeholder="Hedef URL" />
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="number" value={stresTest.count} onChange={e => setStresTest(p => ({ ...p, count: Number(e.target.value) }))} className="w-1/2 bg-[#0b1d1a] border border-[#1e4a43] rounded-lg px-3 py-1.5 text-xs text-white" placeholder="İstek Sayısı" />
                                        <input type="number" value={stresTest.concurrency} onChange={e => setStresTest(p => ({ ...p, concurrency: Number(e.target.value) }))} className="w-1/2 bg-[#0b1d1a] border border-[#1e4a43] rounded-lg px-3 py-1.5 text-xs text-white" placeholder="Eşzamanlı (10..)" />
                                    </div>
                                    <button onClick={baslatStresTesti} disabled={stresTest.durum === 'yukleniyor'} className="w-full py-2 bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                                        {stresTest.durum === 'yukleniyor' ? 'Test Ediliyor (Zorlanıyor)...' : 'YÜK TESTİNİ BAŞLAT'}
                                    </button>
                                </div>

                                {stresTest.durum === 'hata' && (
                                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-300">
                                        Hata: {stresTest.hata}
                                    </div>
                                )}

                                {stresTest.durum === 'tamamlandi' && stresTest.sonuc && (
                                    <div className="mt-4 bg-[#0b1d1a] p-3 rounded-lg border border-emerald-500/30">
                                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#1e4a43]">
                                            <span className="text-[10px] text-emerald-300 font-bold uppercase">Skor Tablosu</span>
                                            <Gauge size={12} className="text-emerald-400" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="flex flex-col"><span className="text-white/50">Başarılı:</span><span className="font-mono text-emerald-400">{stresTest.sonuc.success}</span></div>
                                            <div className="flex flex-col"><span className="text-white/50">Çöken:</span><span className="font-mono text-red-400">{stresTest.sonuc.failed}</span></div>
                                            <div className="flex flex-col"><span className="text-white/50">Süre:</span><span className="font-mono text-amber-200">{(stresTest.sonuc.totalTimeMs / 1000).toFixed(1)} sn</span></div>
                                            <div className="flex flex-col"><span className="text-white/50">RPS:</span><span className="font-mono text-blue-300">{(stresTest.sonuc.totalRequests / (stresTest.sonuc.totalTimeMs / 1000)).toFixed(1)} req/s</span></div>
                                            <div className="flex flex-col col-span-2"><span className="text-white/50">OrtGecikme (Latency):</span><span className="font-mono text-white">{stresTest.sonuc.avgLatencyMs} ms</span></div>
                                        </div>
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
                input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; height:14px; width:14px; border-radius:50%; background:#22c55e; cursor:pointer; border:2px solid #173a34; }
                input[type=range]::-moz-range-thumb { height:14px; width:14px; border-radius:50%; background:#22c55e; cursor:pointer; border:2px solid #173a34; }
            `}} />
        </div >
    );
}

export { KarargahMainContainer as default };
