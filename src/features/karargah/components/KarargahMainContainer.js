'use client';
import {
    Activity, ShieldCheck, Zap, Bot, Camera, ArrowRight, PlayCircle,
    AlertCircle, ServerCrash, Send, CheckCircle, MessageSquare,
    Database, Cpu, Network, AlertTriangle, Radio, Eye, Target, Shield
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ████████████████████████████████████████████████████████████████████████
// MİZANET SİBER KARARGAH — ASKERİ OPERASYON MERKEZİ
// Renk Protokolü: Askeri Yeşil (#00ff41) / Kırmızı Alarm (#ff0033) / Koyu Zemin (#0a0a0a)
// ████████████████████████████████████████████████████████████████████████

const MODUL_GRUPLARI = [
    {
        baslik: '[ İSTİHBARAT AĞLARI ]',
        renk: 'text-green-400',
        sinif: 'border-green-900/40 hover:border-green-500/60 hover:bg-green-950/30 text-green-300',
        moduller: [
            { name: 'AJANLAR', link: '/ajanlar' },
            { name: 'AR-GE', link: '/arge' },
            { name: 'DENETMEN', link: '/denetmen' },
            { name: 'KAMERALAR', link: '/kameralar' },
            { name: 'HABERLEŞME', link: '/haberlesme' }
        ]
    },
    {
        baslik: '[ ÜRETİM MOTORU ]',
        renk: 'text-yellow-500',
        sinif: 'border-yellow-900/40 hover:border-yellow-500/50 hover:bg-yellow-950/20 text-yellow-300',
        moduller: [
            { name: 'MODELHANE', link: '/modelhane' },
            { name: 'KALIP', link: '/kalip' },
            { name: 'KUMAŞ', link: '/kumas' },
            { name: 'KESİM', link: '/kesim' },
            { name: 'İMALAT', link: '/imalat' },
            { name: 'ÜRETİM', link: '/uretim' }
        ]
    },
    {
        baslik: '[ HAZİNE & E-TİCARET ]',
        renk: 'text-emerald-400',
        sinif: 'border-emerald-900/40 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-emerald-300',
        moduller: [
            { name: 'KATALOG', link: '/katalog' },
            { name: 'SİPARİŞLER', link: '/siparisler' },
            { name: 'MÜŞTERİLER', link: '/musteriler' },
            { name: 'KASA', link: '/kasa' },
            { name: 'MALİYET', link: '/maliyet' },
            { name: 'MUHASEBE', link: '/muhasebe' },
            { name: 'STOK', link: '/stok' }
        ]
    },
    {
        baslik: '[ İNSAN KAYNAKLARI ]',
        renk: 'text-sky-400',
        sinif: 'border-sky-900/40 hover:border-sky-500/50 hover:bg-sky-950/20 text-sky-300',
        moduller: [
            { name: 'PERSONEL', link: '/personel' },
            { name: 'GÖREVLER', link: '/gorevler' }
        ]
    },
    {
        baslik: '[ SİSTEM KOMANDÖRLİĞİ ]',
        renk: 'text-red-400',
        sinif: 'border-red-900/40 hover:border-red-500/50 hover:bg-red-950/20 text-red-300',
        moduller: [
            { name: 'RAPORLAR', link: '/raporlar' },
            { name: 'TASARIM', link: '/tasarim' },
            { name: 'GÜVENLİK', link: '/guvenlik' },
            { name: 'AYARLAR', link: '/ayarlar' },
            { name: 'GİRİŞ', link: '/giris' }
        ]
    }
];

export function KarargahMainContainer() {
    const { kullanici } = useAuth();
    const _hook = /** @type {any} */ (useKarargah());
    const stats = _hook.stats;
    const alarms = /** @type {any[]} */ (_hook.alarms ?? []);
    const ping = _hook.ping;
    const commandText = _hook.commandText;
    const setCommandText = _hook.setCommandText;
    const hizliGorevAtama = _hook.hizliGorevAtama;
    const aiSorgu = _hook.aiSorgu;
    const setAiSorgu = _hook.setAiSorgu;
    const isAiLoading = _hook.isAiLoading;
    const aiAnalizBaslat = _hook.aiAnalizBaslat;
    const aiSonuc = _hook.aiSonuc;
    const simulasyon = _hook.simulasyon;
    const setSimulasyon = _hook.setSimulasyon;
    const mesaj = /** @type {any} */ (_hook.mesaj ?? {});
    const aiOutputs = /** @type {any[]} */ (_hook.aiOutputs ?? []);


    const [botLoglar, setBotLoglar] = useState(/** @type {any[]} */([]));;
    const [botDurum, setBotDurum] = useState('kontrol');
    const [sonMesajlar, setSonMesajlar] = useState(/** @type {any[]} */([]));;
    const [mesajSayisi, setMesajSayisi] = useState(0);
    const [gizlenIzleri, setGizlenIzleri] = useState(/** @type {any[]} */([]));;
    const [modelArsiv, setModelArsiv] = useState(/** @type {any[]} */([]));;
    const _kul = /** @type {any} */ (kullanici);
    const [kameraStreamDurum, setKameraStreamDurum] = useState('kontrol');
    const [saat, setSaat] = useState('');
    const [aiNedenModal, setAiNedenModal] = useState({ acik: false, metin: '', zarar: 0 });
    const [izPanelAcik, setIzPanelAcik] = useState(false);
    const [mesajYukleniyor, setMesajYukleniyor] = useState(false);
    const [botYukleniyor, setBotYukleniyor] = useState(false);

    // ─── FEATURE FLAGS ───────────────────────────────────────────────────────
    const KAMERA_AKTIF = process.env.NEXT_PUBLIC_KAMERA_AKTIF === 'true';
    const MESAJ_AKTIF = process.env.NEXT_PUBLIC_MESAJ_AKTIF === 'true';
    const BOT_AKTIF = process.env.NEXT_PUBLIC_BOT_AKTIF !== 'false'; // varsayılan: açık

    // Saat
    useEffect(() => {
        const guncelle = () => setSaat(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        guncelle();
        const iv = setInterval(guncelle, 1000);
        return () => clearInterval(iv);
    }, []);

    // Kamera stream — sadece KAMERA_AKTIF=true ise çalışır
    useEffect(() => {
        if (!KAMERA_AKTIF) { setKameraStreamDurum('kapali'); return; }
        const kontrol = async () => {
            if (document.hidden) return;
            try {
                const res = await fetch('/api/stream-durum', { signal: AbortSignal.timeout(4000), cache: 'no-store' });
                if (!res.ok) { setKameraStreamDurum('kapali'); return; }
                const d = await res.json();
                setKameraStreamDurum(d.durum === 'aktif' ? 'aktif' : 'kapali');
            } catch { setKameraStreamDurum('kapali'); }
        };
        kontrol();
        const iv = setInterval(kontrol, 30000);
        const handleVisibility = () => { if (!document.hidden) kontrol(); };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => { clearInterval(iv); document.removeEventListener('visibilitychange', handleVisibility); };
    }, [KAMERA_AKTIF]);

    const gun45Once = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();

    // Mesaj servisi — sadece MESAJ_AKTIF=true ise çalışır
    const mesajlariGetir = useCallback(async () => {
        if (!MESAJ_AKTIF) return;
        try {
            const { count } = await supabase.from('b1_ic_mesajlar').select('id', { count: 'exact', head: true }).is('okundu_at', null);
            setMesajSayisi(count || 0);
        } catch { /* sessiz */ }
        try {
            const { data: aktif } = await supabase.from('b1_ic_mesajlar').select('id, konu, oncelik, gonderen_adi, created_at, urun_id').order('created_at', { ascending: false }).limit(3);
            setSonMesajlar(aktif || []);
        } catch { setSonMesajlar([]); }
        try {
            const { data: gizli } = await supabase.from('b1_mesaj_gizli').select('mesaj_id, kullanici_adi, gizlendi_at, b1_ic_mesajlar(konu, oncelik, urun_id, urun_kodu, gonderen_adi, gonderen_modul)').gte('gizlendi_at', gun45Once).order('gizlendi_at', { ascending: false }).limit(20);
            const izler = (gizli || []).filter(g => { const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar; return !(b1?.urun_id); });
            setGizlenIzleri(izler);
        } catch { setGizlenIzleri([]); }
        try {
            const { data: model } = await supabase.from('b1_ic_mesajlar').select('id, konu, oncelik, urun_id, urun_kodu, urun_adi, gonderen_adi, created_at, okundu_at').not('urun_id', 'is', null).order('created_at', { ascending: false }).limit(50);
            setModelArsiv(model || []);
        } catch { setModelArsiv([]); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [MESAJ_AKTIF]);

    useEffect(() => { mesajlariGetir(); }, [mesajlariGetir]);

    useEffect(() => {
        if (!MESAJ_AKTIF) return;
        const kanal = supabase.channel('karargah-mesaj-optimize')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_ic_mesajlar' }, () => { if (!document.hidden) mesajlariGetir(); })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_mesaj_gizli' }, () => { if (!document.hidden) mesajlariGetir(); })
            .subscribe();
        return () => { supabase.removeChannel(kanal); };
    }, [mesajlariGetir, MESAJ_AKTIF]);

    useEffect(() => {
        const botLogCek = async () => {
            if (document.hidden) return;
            if (!BOT_AKTIF) return;
            try {
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
    }, [BOT_AKTIF]);

    const fm = (num) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(num);
    const isAdmin = _kul?.grup === 'tam' || _kul?.rol === 'admin';

    return (
        <div className="bg-[#080a08] min-h-screen text-green-300 font-mono pb-20 relative overflow-hidden"
            style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(0,40,0,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,20,0,0.4) 0%, transparent 60%)' }}>

            {/* Tarama çizgileri efekti */}
            <div className="pointer-events-none fixed inset-0 z-0"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px)' }} />

            {/* Bildirim */}
            {mesaj.text && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 py-2 px-6 font-mono text-sm font-bold uppercase tracking-widest border ${mesaj.type === 'error' ? 'bg-red-950/90 text-red-300 border-red-500/60' : 'bg-green-950/90 text-green-300 border-green-500/60'}`}>
                    {mesaj.type === 'error' ? '⚠ HATA: ' : '✓ '}{mesaj.text}
                </div>
            )}

            {/* AI Modal */}
            {aiNedenModal.acik && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#0a0f0a] border border-green-500/40 w-full max-w-md p-6 relative">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />
                        <button onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })} className="absolute top-4 right-4 text-green-600 hover:text-green-300 text-xs">[ KAPAT ]</button>
                        <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Bot size={12} /> YAPAY ZEKA ANALİZİ
                        </h2>
                        <div className="bg-black/60 border border-green-900/50 p-4 mb-4">
                            <p className="text-xs text-green-300 leading-relaxed mb-3">{aiNedenModal.metin}</p>
                            <p className="border-t border-green-900/50 pt-3 text-xs text-red-400">
                                POTANSİYEL ZARAR: <span className="text-red-300 font-bold">₺ {fm(aiNedenModal.zarar)}</span>
                            </p>
                        </div>
                        <button onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })} className="w-full border border-green-800/60 hover:border-green-500 text-green-400 text-xs py-2 uppercase tracking-widest transition-colors">
                            ONAYLANDI — KAPAT
                        </button>
                    </div>
                </div>
            )}

            {/* ── ÜST BAR ── */}
            <div className="relative z-10 border-b border-green-900/60 bg-black/40 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm font-bold uppercase tracking-[0.3em] text-green-400">MİZANET SİBER KARARGAH</span>
                    </div>
                    <span className="text-green-900/60">|</span>
                    <span className="text-xs text-green-700 uppercase tracking-widest">OPERATIONAL</span>
                </div>
                <div className="flex items-center gap-6 text-xs text-green-700 uppercase tracking-widest">
                    <span>KULLANICI: <span className="text-green-400">{_kul?.ad || 'KOMUTAN'}</span></span>
                    <span className="text-green-400 font-bold tabular-nums">{saat}</span>
                    <span className={`flex items-center gap-1 ${ping !== null && ping < 200 ? 'text-green-400' : 'text-yellow-600'}`}>
                        <Radio size={10} /> PING: {ping === null ? '---' : `${ping}ms`}
                    </span>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 lg:p-6">
                {/* ── SOL / ORTA KOLON ── */}
                <div className="lg:col-span-3 flex flex-col gap-4">

                    {/* ── ADALET MÜHÜRÜ BANNER ── */}
                    <div className="relative border border-green-900/60 bg-black/70 overflow-hidden" style={{ minHeight: 120 }}>
                        <div className="absolute inset-0 opacity-20"
                            style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,255,65,0.05) 40px, rgba(0,255,65,0.05) 41px)' }} />
                        <div className="absolute inset-0 flex flex-col justify-center pl-6 z-10">
                            <div className="text-xs text-green-700 uppercase tracking-[0.4em] mb-1">Demir Tekstil — THE ORDER</div>
                            <div className="text-base font-bold text-green-400 uppercase tracking-[0.25em] leading-tight">
                                MİZANET<br />
                                <span className="text-sm text-green-600">SİBER KARARGAH</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs text-green-600 uppercase tracking-[0.3em]">OPERASYONEL</span>
                            </div>
                            <div className="mt-1 text-sm text-green-900 uppercase tracking-widest">Adil Düzen · Şeffaf Maliyet · Adaletli Dağıtım</div>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-40 flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-green-500/10 blur-xl scale-150" />
                                <Image
                                    src="/adalet_muhuru.png"
                                    alt="Adalet Mühürü — Divine Justice"
                                    width={110}
                                    height={110}
                                    className="relative z-10 opacity-85"
                                    style={{ filter: 'drop-shadow(0 0 12px rgba(0,255,65,0.4))' }}
                                />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
                    </div>

                    {/* METRİK PANELLER — KG-03/04/05/06/07 */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {[
                            { baslik: 'GÜNLÜK CİRO', deger: isAdmin ? `₺ ${fm(stats.ciro)}` : '▓▓▓▓▓▓', renk: 'green', link: '/raporlar', ikon: <Target size={11} /> },
                            { baslik: 'TOPLAM MALİYET', deger: isAdmin ? `₺ ${fm(stats.maliyet)}` : '▓▓▓▓▓▓', renk: 'red', link: '/maliyet', ikon: <Database size={11} /> },
                            { baslik: 'PERSONEL GİDER', deger: isAdmin ? `₺ ${fm(stats.personel)}` : '▓▓▓▓', renk: 'yellow', link: '/personel', ikon: <Shield size={11} /> },
                            { baslik: 'FIRE/ZAYİAT', deger: `%${stats.fire}`, renk: 'orange', link: '/maliyet', ikon: <AlertTriangle size={11} /> },
                            { baslik: 'BEKLEyen SİP.', deger: `${stats.bekleyenSiparis} adet`, renk: stats.bekleyenSiparis > 5 ? 'orange' : 'green', link: '/siparisler', ikon: <Shield size={11} /> },
                            { baslik: 'AKTİF ÜRETİM', deger: `${stats.aktifUretim} emir`, renk: stats.aktifUretim > 0 ? 'green' : 'yellow', link: '/uretim', ikon: <Database size={11} /> },
                            { baslik: 'STOK ALARM', deger: `${stats.stokAlarm} ürün`, renk: stats.stokAlarm > 0 ? 'red' : 'green', link: '/stok', ikon: <AlertTriangle size={11} /> },
                        ].map((m, i) => (
                            <Link key={i} href={m.link} className="group block">
                                <div className={`border bg-black/60 p-3 relative overflow-hidden transition-all duration-300
                                    ${m.renk === 'green' ? 'border-green-900/60 group-hover:border-green-500/80' :
                                        m.renk === 'red' ? 'border-red-900/60 group-hover:border-red-500/60' :
                                            m.renk === 'yellow' ? 'border-yellow-900/40 group-hover:border-yellow-500/50' :
                                                'border-orange-900/40 group-hover:border-orange-500/40'}`}>
                                    <div className={`flex items-center gap-1 mb-1 text-[10px] uppercase tracking-widest font-bold
                                        ${m.renk === 'green' ? 'text-green-700' :
                                            m.renk === 'red' ? 'text-red-700' :
                                                m.renk === 'yellow' ? 'text-yellow-700' :
                                                    'text-orange-700'}`}>
                                        {m.ikon} {m.baslik}
                                    </div>
                                    <div className={`text-base font-bold tabular-nums
                                        ${m.renk === 'green' ? 'text-green-300' :
                                            m.renk === 'red' ? 'text-red-300' :
                                                m.renk === 'yellow' ? 'text-yellow-300' :
                                                    'text-orange-300'}`}>
                                        {stats.yukleniyor ? <span className="animate-pulse">---</span> : m.deger}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>


                    {/* GÖREV & AI PANEL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-green-900/50 bg-black/50 p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-4 bg-green-500" />
                                <span className="text-xs font-bold uppercase tracking-[0.25em] text-green-600">GÖREV MERKEZİ / CMD</span>
                            </div>
                            <div className="flex gap-2 mb-4">
                                <input id="karargah-komut" name="karargah-komut" value={commandText} onChange={(e) => setCommandText(e.target.value)} placeholder="komut gir..." className="flex-1 bg-black/80 text-green-300 text-xs px-3 py-2 border border-green-900/60 focus:outline-none focus:border-green-500/60 placeholder-green-900 font-mono" />
                                <button onClick={hizliGorevAtama} className="bg-green-900/30 hover:bg-green-800/40 text-green-300 text-xs px-4 py-2 border border-green-800/50 hover:border-green-500/60 font-bold uppercase tracking-wider transition-colors">GÖNDER</button>
                            </div>
                            <div className="border-t border-green-900/40 pt-4">
                                <div className="flex items-center justify-between mb-2 text-xs uppercase tracking-widest">
                                    <span className="text-green-700">PROJEKSİYON SİMÜLATÖRÜ</span>
                                    <span className="text-green-400 font-bold">{simulasyon > 0 ? '+' : ''}{simulasyon}%</span>
                                </div>
                                <input id="karargah-simulasyon" name="karargah-simulasyon" type="range" min="-20" max="20" step="1" value={simulasyon} onChange={(e) => setSimulasyon(parseInt(e.target.value))} className="w-full h-1 bg-green-900/40 accent-green-500 cursor-pointer" />
                            </div>
                        </div>

                        <div className="border border-green-900/50 bg-black/50 p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-4 bg-yellow-500" />
                                <span className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-600">DİJİTAL DANIŞMAN / AI</span>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <input id="karargah-ai-sorgu" name="karargah-ai-sorgu" value={aiSorgu} onChange={(e) => setAiSorgu(e.target.value)} placeholder="analiz isteği..." className="flex-1 bg-black/80 text-green-300 text-xs px-3 py-2 border border-green-900/60 focus:outline-none focus:border-yellow-600/50 placeholder-green-900 font-mono" />
                                <button onClick={aiAnalizBaslat} disabled={isAiLoading} className="bg-yellow-900/20 hover:bg-yellow-800/30 text-yellow-300 text-xs px-4 py-2 border border-yellow-900/40 hover:border-yellow-500/50 font-bold uppercase tracking-wider transition-colors disabled:opacity-40">
                                    {isAiLoading ? '...' : 'ANALİZ'}
                                </button>
                            </div>
                            {aiSonuc && (
                                <div className="bg-black/60 border border-green-900/40 p-3 max-h-20 overflow-y-auto">
                                    <p className="text-sm text-green-300 leading-relaxed font-mono whitespace-pre-wrap">{aiSonuc}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MODÜL IZGARASI */}
                    <div className="flex flex-col gap-3">
                        {MODUL_GRUPLARI.map((grup, gIdx) => (
                            <div key={gIdx} className="border border-green-950/60 bg-black/30 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-px flex-1 bg-green-950/60" />
                                    <span className={`text-xs font-bold uppercase tracking-[0.2em] ${grup.renk}`}>{grup.baslik}</span>
                                    <div className="h-px flex-1 bg-green-950/60" />
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                    {grup.moduller.map((mod, i) => (
                                        <Link href={mod.link} key={i}>
                                            <div className={`border text-sm font-bold text-center py-2.5 px-2 uppercase tracking-wider transition-all duration-200 cursor-pointer ${grup.sinif}`}>
                                                {mod.name}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── SAĞ KOLON ── */}
                <div className="flex flex-col gap-4">

                    {/* DURUM RADARI */}
                    <div className="border border-green-900/50 bg-black/50 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-4 bg-red-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">DURUM RADARI</span>
                        </div>
                        {alarms.length === 0 ? (
                            <div className="border border-green-900/40 bg-green-950/20 p-3 text-center">
                                <CheckCircle size={14} className="text-green-500 mx-auto mb-1" />
                                <span className="text-xs text-green-600 uppercase tracking-widest">SİSTEM NORMAL</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {alarms.map(al => (
                                    <div key={al.id} className="border border-red-900/60 bg-red-950/20 p-3">
                                        <div className="flex items-start gap-2 mb-2">
                                            <AlertTriangle size={10} className="text-red-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-red-300 leading-relaxed">{al.text}</p>
                                        </div>
                                        <button onClick={() => setAiNedenModal({ acik: true, metin: al.neden, zarar: al.zarar })} className="text-xs text-red-600 hover:text-red-400 font-bold flex items-center gap-1 uppercase tracking-wider transition-colors">
                                            <span>ETKİ ANALİZİ</span>
                                            <ArrowRight size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* KAMERA */}
                    <div className="border border-green-900/50 bg-black/50 p-4">
                        <Link href="/kameralar" className="block">
                            <div className={`border p-3 flex items-center gap-3 transition-colors ${kameraStreamDurum === 'aktif' ? 'border-green-700/50 bg-green-950/20' : 'border-green-950/50'}`}>
                                <div className={`w-8 h-8 flex items-center justify-center border relative ${kameraStreamDurum === 'aktif' ? 'border-green-600/60 text-green-400' : 'border-green-950 text-green-900'}`}>
                                    <Camera size={14} className="relative z-10" />
                                    {kameraStreamDurum === 'aktif' && <div className="absolute inset-0 bg-green-500/10 animate-pulse" />}
                                </div>
                                <div>
                                    <div className={`text-xs font-bold uppercase tracking-widest ${kameraStreamDurum === 'aktif' ? 'text-green-400' : 'text-green-800'}`}>
                                        {kameraStreamDurum === 'aktif' ? '◉ GÖRÜŞ AKTİF' : '◎ GÖRÜŞ KAPALI'}
                                    </div>
                                    <div className="text-sm text-green-900 mt-0.5">
                                        {kameraStreamDurum === 'aktif' ? 'AI tarama modunda' : 'go2rtc devreye girmeli'}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* AJAN EKOSİSTEMİ */}
                    <div className="border border-green-900/50 bg-black/50 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-green-500" />
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-green-600">AJAN EKOSİSTEMİ</span>
                            </div>
                            <span className="text-xs text-green-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                                OTONOM
                            </span>
                        </div>
                        <div className="space-y-2">
                            {/* KG-08: Gerçek b1_agent_loglari'ndan besleniyor */}
                            {aiOutputs.length > 0 ? aiOutputs.slice(0, 3).map((a, i) => (
                                <div key={i} className={`border p-2 flex items-center justify-between ${a.tur === 'hata' ? 'border-red-950/60' : a.tur === 'trend' ? 'border-green-950/60' : 'border-yellow-950/60'}`}>
                                    <div>
                                        <div className={`text-xs font-bold uppercase ${a.tur === 'hata' ? 'text-red-400' : a.tur === 'trend' ? 'text-green-400' : 'text-yellow-500'}`}>{a.ajan}</div>
                                        <div className="text-xs text-green-800 mt-0.5 truncate max-w-[140px]">{a.mesaj}</div>
                                    </div>
                                    <span className={`text-xs font-bold ${a.tur === 'hata' ? 'text-red-700' : a.tur === 'trend' ? 'text-green-700' : 'text-yellow-700'}`}>
                                        {a.tur === 'hata' ? '⚠' : a.tur === 'trend' ? '↑' : '→'}
                                    </span>
                                </div>
                            )) : (
                                <div className="border border-green-950/60 p-2 text-center">
                                    <div className="text-xs text-green-800 uppercase tracking-widest">Ajan sinyali bekleniyor...</div>
                                </div>
                            )}
                        </div>
                        <Link href="/arge" className="block mt-3 text-center text-xs text-green-800 hover:text-green-500 uppercase tracking-[0.2em] transition-colors">
                            DETAY PANELE GEÇ →
                        </Link>
                    </div>

                    {/* SON MESAJLAR */}
                    <div className="border border-green-900/50 bg-black/50 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-yellow-500" />
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-600">İLETİŞİM</span>
                            </div>
                            {mesajSayisi > 0 && (
                                <span className="text-xs text-red-400 border border-red-800/50 px-1.5 py-0.5">{mesajSayisi} OKUNMADI</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {mesajYukleniyor ? (
                                <div className="text-xs text-green-800 text-center py-3 uppercase tracking-widest animate-pulse">VERİ ÇEKİLİYOR...</div>
                            ) : sonMesajlar.length === 0 ? (
                                <div className="text-xs text-green-900 text-center py-3 uppercase tracking-widest">— SESSİZLİK —</div>
                            ) : sonMesajlar.map(m => (
                                <Link key={m.id} href="/haberlesme" className="block border border-green-950/50 hover:border-green-800/50 p-2 transition-colors">
                                    <div className="text-xs font-bold text-green-300 truncate mb-0.5">
                                        {m.oncelik === 'kritik' ? '🔴' : m.oncelik === 'acil' ? '🟡' : '🟢'} {m.konu}
                                    </div>
                                    <div className="text-xs text-green-800">{m.gonderen_adi}</div>
                                </Link>
                            ))}
                        </div>
                        <Link href="/haberlesme" className="block mt-3 text-center text-xs text-green-800 hover:text-green-500 uppercase tracking-[0.2em] transition-colors">
                            TÜMÜNÜ GÖR →
                        </Link>
                    </div>

                    {/* NİZAMBOT */}
                    <div className="border border-green-900/50 bg-black/50 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-4 bg-green-500" />
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-green-600">SİSTEM NÖBETÇİSİ</span>
                        </div>
                        <div className="flex items-center gap-3 border border-green-950/50 p-2 mb-3">
                            <Bot size={14} className={botDurum === 'aktif' ? 'text-green-400' : 'text-green-900'} />
                            <div>
                                <div className="text-xs font-bold text-green-300">@Lumora_47bot</div>
                                <div className="text-xs text-green-800">
                                    {botDurum === 'aktif' ? '◉ AKTİF DİNLİYOR' : '◎ KAPASİTE KONTROLÜ'}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {botYukleniyor ? (
                                <div className="text-xs text-green-800 text-center py-2 uppercase tracking-widest animate-pulse">NIZAMBOT SORGULANYOR...</div>
                            ) : botLoglar.length === 0 ? (
                                <div className="text-xs text-green-900 text-center py-2 uppercase tracking-widest">HAREKET YOK</div>
                            ) : botLoglar.map((log, i) => (
                                <div key={i} className="border-b border-green-950/40 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${log.sonuc === 'basarili' ? 'text-green-600' : 'text-red-600'}`}>
                                            {log.sonuc === 'basarili' ? '✓ İLETİLDİ' : '✗ HATA'}
                                        </span>
                                        <span className="text-sm text-green-900">
                                            {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-green-800 truncate mt-0.5">{log.mesaj || log.islem_tipi}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GİZLENEN MESAJLAR */}
                    <div className="border border-green-900/50 bg-black/50 p-4">
                        <button onClick={() => setIzPanelAcik(v => !v)} className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-[0.15em] text-green-700 mb-1">
                            <span>MESAJ İZLERİ [{gizlenIzleri.length}]</span>
                            <span className="text-sm text-green-900">45 GÜN KURALI</span>
                        </button>
                        {izPanelAcik && (
                            <div className="space-y-1 mt-3 max-h-32 overflow-y-auto">
                                {gizlenIzleri.length === 0 ? (
                                    <div className="text-xs text-green-900 text-center py-2">GİZLENEN İZ YOK</div>
                                ) : gizlenIzleri.map((g, i) => {
                                    const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar;
                                    return (
                                        <div key={i} className="border border-green-950/40 p-2">
                                            <div className="text-xs font-bold text-green-400 truncate">{b1?.konu || '—'}</div>
                                            <div className="text-sm text-green-800">GİZLEYEN: {g.kullanici_adi}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Alt durum çubuğu */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-green-900/40 bg-black/80 px-6 py-2 flex items-center justify-between z-20">
                <div className="flex items-center gap-4 text-xs uppercase tracking-widest">
                    <span className="text-green-700">SİSTEM: <span className="text-green-400">AKTİF</span></span>
                    <span className="text-green-900">|</span>
                    <span className="text-green-700">VERİTABANI: <span className="text-green-400">BAĞLI</span></span>
                    <span className="text-green-900">|</span>
                    <span className="text-green-700">AJAN: <span className={botDurum === 'aktif' ? 'text-green-400' : 'text-yellow-500'}>{botDurum.toUpperCase()}</span></span>
                </div>
                <div className="text-xs text-green-900 uppercase tracking-widest">mizanet.com — THE ORDER / NİZAM</div>
            </div>
        </div >
    );
}

export { KarargahMainContainer as default };
