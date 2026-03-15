'use client';
import {
    Activity, ShieldCheck, Zap, Bot, Camera, Info, ArrowRight, PlayCircle, AlertCircle, ServerCrash, Send, CheckCircle, MessageSquare
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
            { name: 'Ajanlar', link: '/ajanlar', renk: 'bg-[#02624B] border-[#02624B] text-white uppercase shadow-sm hover:brightness-110' },
            { name: 'Ar-Ge', link: '/arge', renk: 'bg-[#047857] border-[#047857] text-white shadow-sm hover:brightness-110' },
            { name: 'Denetmen', link: '/denetmen', renk: 'bg-[#047857] border-[#047857] text-white shadow-sm hover:brightness-110' },
            { name: 'Kameralar', link: '/kameralar', renk: 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm hover:bg-emerald-100' },
            { name: 'Haberleşme', link: '/haberlesme', renk: 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm hover:bg-emerald-100' }
        ]
    },
    {
        baslik: '⚙️ ÜRETİM MOTORU',
        renk: 'text-emerald-800',
        moduller: [
            { name: 'Modelhane', link: '/modelhane', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' },
            { name: 'Kalıp', link: '/kalip', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' },
            { name: 'Kumaş', link: '/kumas', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' },
            { name: 'Kesim', link: '/kesim', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' },
            { name: 'İmalat', link: '/imalat', renk: 'bg-[#047857] border-[#047857] text-white shadow-sm hover:brightness-110' },
            { name: 'Üretim', link: '/uretim', renk: 'bg-[#02624B] border-[#02624B] text-white shadow-sm hover:brightness-110' }
        ]
    },
    {
        baslik: '💰 HAZİNE & E-TİCARET',
        renk: 'text-emerald-800',
        moduller: [
            { name: 'Katalog', link: '/katalog', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' },
            { name: 'Siparişler', link: '/siparisler', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' },
            { name: 'Müşteriler', link: '/musteriler', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' },
            { name: 'Kasa', link: '/kasa', renk: 'bg-[#02624B] border-[#02624B] text-amber-200 shadow-sm hover:brightness-110' },
            { name: 'Maliyet', link: '/maliyet', renk: 'bg-[#047857] border-[#047857] text-amber-100 shadow-sm hover:brightness-110' },
            { name: 'Muhasebe', link: '/muhasebe', renk: 'bg-[#047857] border-[#047857] text-amber-100 shadow-sm hover:brightness-110' },
            { name: 'Stok', link: '/stok', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' }
        ]
    },
    {
        baslik: '🤝 İNSAN KAYNAKLARI',
        renk: 'text-emerald-800',
        moduller: [
            { name: 'Personel', link: '/personel', renk: 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm hover:bg-emerald-100' },
            { name: 'Görevler', link: '/gorevler', renk: 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm hover:bg-emerald-100' }
        ]
    },
    {
        baslik: '🛠️ SİSTEM YÖNETİMİ',
        renk: 'text-emerald-800',
        moduller: [
            { name: 'Raporlar', link: '/raporlar', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' },
            { name: 'Tasarım', link: '/tasarim', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' },
            { name: 'Güvenlik', link: '/guvenlik', renk: 'bg-[#02624B] border-[#02624B] text-white shadow-sm hover:brightness-110' },
            { name: 'Ayarlar', link: '/ayarlar', renk: 'bg-white border-emerald-200 text-emerald-800 shadow-sm hover:bg-emerald-50' },
            { name: 'Giriş', link: '/giris', renk: 'bg-slate-100 border-slate-300 text-slate-600 shadow-sm hover:bg-slate-200' }
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
        <div className="bg-slate-50 min-h-screen p-4 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white pb-20">

            {mesaj.text && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 px-8 rounded-lg font-bold shadow-2xl transition-all ${mesaj.type === 'error' ? 'bg-red-600 text-white border-2 border-red-500' : 'bg-emerald-600 text-white'}`}>
                    {mesaj.text}
                </div>
            )}

            {aiNedenModal.acik && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md p-6 rounded-2xl border border-rose-500/50 shadow-2xl relative">
                        <button onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })} className="absolute top-4 right-4 text-slate-500 hover:text-white font-black text-xl">✕</button>
                        <h2 className="text-xl font-black text-amber-600 mb-2 flex items-center gap-2"><Bot /> HermAI Yorumlayıcı</h2>
                        <div className="bg-white p-4 rounded-xl mb-4 border border-white/10">
                            <p className="text-sm font-semibold text-slate-600">
                                <strong className="text-white block mb-1">Tespit Edilen Kök Neden (Kovaryans):</strong>
                                {aiNedenModal.metin}
                            </p>
                            <p className="mt-3 text-sm">
                                <strong className="text-rose-600 block mb-1">Günlük Potansiyel Finansal Zarar:</strong>
                                <span className="text-2xl font-black text-rose-600">₺ {fm(aiNedenModal.zarar)}</span>
                            </p>
                        </div>
                        <button onClick={() => setAiNedenModal({ acik: false, metin: '', zarar: 0 })} className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-lg font-bold text-white transition-all">Anlaşıldı, Kapat</button>
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
                                    <div className="bg-[#022c22] text-amber-400 p-4 rounded-xl flex flex-col justify-between shadow-2xl h-28 transform transition-transform hover:scale-[1.03] cursor-pointer border-[1.5px] border-amber-500/40 hover:border-amber-400 hover:shadow-amber-500/20 group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent"></div>
                                        <span className="text-xs font-black opacity-90 uppercase truncate relative z-10 text-emerald-100 flex items-center justify-between">Günlük Ciro <span className="text-amber-500/50">💰</span></span>
                                        <span className="text-3xl font-black truncate relative z-10 drop-shadow-md tracking-tight">
                                            ₺ {isAdmin ? fm(stats.ciro + ((stats.ciro * simulasyon) / 100)) : '••••••'}
                                        </span>
                                    </div>
                                </Link>
                                <Link href="/maliyet" passHref>
                                    <div className="bg-[#022c22] text-rose-300 p-4 rounded-xl flex flex-col justify-between shadow-2xl h-28 transform transition-transform hover:scale-[1.03] cursor-pointer border-[1.5px] border-emerald-900 hover:border-emerald-600 hover:shadow-emerald-500/20 group relative overflow-hidden">
                                        <span className="text-xs font-black opacity-90 uppercase truncate relative z-10 text-emerald-100 flex items-center justify-between">Toplam Maliyet <span className="text-rose-400/50">📉</span></span>
                                        <span className="text-2xl font-black truncate relative z-10">
                                            ₺ {isAdmin ? fm(stats.maliyet) : '••••••'}
                                        </span>
                                    </div>
                                </Link>
                                <Link href="/personel" passHref>
                                    <div className="bg-[#022c22] text-blue-300 p-4 rounded-xl flex flex-col justify-between shadow-2xl h-28 transform transition-transform hover:scale-[1.03] cursor-pointer border-[1.5px] border-emerald-900 hover:border-emerald-600 hover:shadow-emerald-500/20 group relative overflow-hidden">
                                        <span className="text-xs font-black opacity-90 uppercase truncate relative z-10 text-emerald-100 flex items-center justify-between">Personel Gider <span className="text-blue-400/50">👥</span></span>
                                        <span className="text-2xl font-black truncate relative z-10">
                                            ₺ {isAdmin ? fm(stats.personel) : '••••••'}
                                        </span>
                                    </div>
                                </Link>
                                <Link href="/maliyet" passHref>
                                    <div className="bg-[#022c22] text-amber-500 p-4 rounded-xl flex flex-col justify-between shadow-2xl h-28 transform transition-transform hover:scale-[1.03] cursor-pointer border-[1.5px] border-rose-900/50 hover:border-rose-500 hover:shadow-rose-500/20 group relative overflow-hidden">
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
                        <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider"><Zap size={14} /> Görev Arama Motoru (CMD+K)</h3>
                                <div className="flex gap-2">
                                    <input
                                        value={commandText}
                                        onChange={(e) => setCommandText(e.target.value)}
                                        placeholder="/komut (Zod korumalıdır)"
                                        className="flex-1 bg-white text-white px-4 py-2 rounded-xl border border-slate-600 focus:outline-none focus:border-blue-500 transition-colors text-sm font-semibold placeholder-slate-500"
                                    />
                                    <button onClick={hizliGorevAtama} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2 rounded-xl font-bold transition-colors shadow-lg text-sm tracking-wide">BAŞLAT</button>
                                </div>
                            </div>

                            <div className="mt-2 border-t border-white/10 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-600">Stratejik What-if Analizi (Fiyatlama):</span>
                                    <span className="text-xs font-black text-emerald-400">%{simulasyon}</span>
                                </div>
                                <input
                                    type="range"
                                    min="-20" max="20" step="1"
                                    value={simulasyon}
                                    onChange={(e) => setSimulasyon(parseInt(e.target.value))}
                                    className="w-full accent-emerald-500"
                                />
                                <span className="text-[10px] text-slate-500 font-bold block mt-1">Bu sürgüyü kaydırırsanız Ciro panelindeki değer anlık revize olur.</span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200 flex flex-col justify-between gap-4">
                            <div>
                                <h3 className="text-xs font-bold uppercase text-emerald-700 flex items-center gap-2 tracking-wider mb-2"><Bot size={14} /> Yapay Zeka Komuta Merkezi</h3>
                                <div className="flex gap-2">
                                    <input
                                        value={aiSorgu}
                                        onChange={(e) => setAiSorgu(e.target.value)}
                                        placeholder="Pazar Analizi veya Rapor İste..."
                                        className="flex-1 bg-white text-white px-4 py-2 rounded-xl border border-emerald-900 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-semibold placeholder-slate-500"
                                    />
                                    <button
                                        onClick={aiAnalizBaslat}
                                        disabled={isAiLoading}
                                        className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-2 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap text-sm tracking-wide disabled:opacity-50"
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

                            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between mt-auto">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">BANT AKIŞI:</span>
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
                            <div key={gIdx} className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-md">
                                <h3 className={`text-[11px] font-black uppercase mb-3 ${grup.renk} tracking-widest`}>{grup.baslik}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                    {grup.moduller.map((mod, i) => (
                                        <Link href={mod.link} key={i}>
                                            <div className={`${mod.renk} transition-all p-3 rounded-xl text-center flex items-center justify-center border h-16`}>
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

                    <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200">
                        <h3 className="text-xs font-black uppercase text-rose-600 mb-3 flex items-center gap-2"><AlertCircle size={14} /> Kriz & Risk Radarı</h3>

                        {alarms.length === 0 ? (
                            <div className="text-emerald-400 font-bold text-sm bg-emerald-900/40 p-3 rounded-lg border border-emerald-800">✅ Risk Tespit Edilmedi.</div>
                        ) : (
                            <div className="space-y-3">
                                {alarms.map(al => (
                                    <div key={al.id} className="bg-white p-3 rounded-lg border-l-4 border-rose-500 shadow-xl group">
                                        <p className="text-xs font-black text-slate-600">{al.text}</p>
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

                    <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-200">
                        <Link href="/kameralar" className="block">
                            <div className={`mb-2 p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${kameraStreamDurum === 'aktif' ? 'bg-[#047857] hover:bg-[#02624B]' : 'bg-slate-100 hover:bg-slate-200'}`}>
                                <div className={`w-10 h-8 bg-white rounded flex items-center justify-center relative overflow-hidden border ${kameraStreamDurum === 'aktif' ? 'border-emerald-500/30 text-emerald-600' : 'border-red-200 text-red-500'}`}>
                                    <Camera size={14} className="relative z-10" />
                                    <div className={`absolute inset-0 ${kameraStreamDurum === 'aktif' ? 'bg-indigo-500/20 animate-pulse' : 'bg-red-500/10'}`}></div>
                                </div>
                                <div className="flex flex-col flex-1 pl-1">
                                    <span className={`text-[10px] font-black flex items-center gap-1 ${kameraStreamDurum === 'aktif' ? 'text-emerald-100' : 'text-red-600'}`}>
                                        <PlayCircle size={8} />
                                        {kameraStreamDurum === 'aktif' ? 'Canlı Görüş Aktif' : kameraStreamDurum === 'kapali' ? 'Sunucu Kapalı' : 'Kontrol Ediliyor...'}
                                    </span>
                                    <span className={`text-[9px] font-semibold leading-tight ${kameraStreamDurum === 'aktif' ? 'text-emerald-200' : 'text-slate-500'}`}>
                                        {kameraStreamDurum === 'aktif' ? 'AI 4 kamerayı tarıyor.' : 'go2rtc başlatılmalı → stream-server/BASLAT.bat'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>


                    {/* ── SON MESAJLAR WİDGET ──────────────────────── */}
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-200">
                        <h3 className="text-xs font-black uppercase text-emerald-800 mb-3 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2"><MessageSquare size={13} /> Son Mesajlar</span>
                            {mesajSayisi > 0 && (
                                <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                    {mesajSayisi} OKUNMADI
                                </span>
                            )}
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            {sonMesajlar.length === 0 ? (
                                <div className="text-[10px] text-slate-500 text-center py-2 font-semibold">✅ Okunmamış mesaj yok</div>
                            ) : sonMesajlar.map(m => (
                                <Link key={m.id} href="/haberlesme" className="block bg-white rounded-lg p-2 border border-slate-200 hover:border-emerald-500/40 transition-colors">
                                    <div className="text-[10px] font-black text-slate-800 truncate">
                                        {m.oncelik === 'kritik' ? '🔴' : m.oncelik === 'acil' ? '🟡' : '🔵'} {m.konu}
                                        {m.urun_id && <span className="ml-1 text-amber-500">📦</span>}
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{m.gonderen_adi}</div>
                                </Link>
                            ))}
                        </div>
                        <Link href="/haberlesme" className="mt-2 block text-center text-[9px] text-emerald-600 font-black hover:text-emerald-500 transition-colors">
                            Haberleşme → Tümünü Gör
                        </Link>
                    </div>

                    {/* ── 45-GÜN MESAJ İZ PANELİ ──────────────────── */}
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-amber-200">
                        <button
                            onClick={() => setIzPanelAcik(v => !v)}
                            className="w-full flex items-center justify-between text-xs font-black uppercase text-amber-600 mb-1"
                        >
                            <span>🗂️ Gizlenen Mesaj İzleri ({gizlenIzleri.length})</span>
                            <span className="text-[9px] text-slate-500 font-semibold">45 Gün Kuralı</span>
                        </button>
                        {izPanelAcik && (
                            <div className="flex flex-col gap-1 mt-2 max-h-40 overflow-y-auto">
                                {gizlenIzleri.length === 0 ? (
                                    <div className="text-[10px] text-slate-500 text-center py-2">Son 45 günde gizlenen iz yok</div>
                                ) : gizlenIzleri.map((g, i) => {
                                    const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar;
                                    return (
                                        <div key={i} className="bg-amber-50/50 rounded p-1.5 border border-amber-200/50">
                                            <div className="text-[9px] font-black text-amber-700 truncate">
                                                {b1?.konu || 'Bilinmeyen Konu'}
                                            </div>
                                            <div className="text-[8px] text-slate-500">
                                                Gizleyen: {g.kullanici_adi} · {b1?.gonderen_modul}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="text-[8px] text-slate-600 text-center mt-1 font-semibold">
                                    ⚠️ 45. günden sonra sistem bu izleri otomatik temizler
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-200">
                        <h3 className="text-xs font-black uppercase text-emerald-700 mb-2 flex items-center justify-between gap-2">
                            <span>📦 Model Bilgi Arşivi</span>
                            <span className="text-[9px] text-slate-500 font-semibold">{modelArsiv.length} kayıt · KALıcı</span>
                        </h3>
                        <div className="text-[8px] text-slate-500 mb-2 leading-tight">
                            Ürün/model bağlı mesajlar hiçbir zaman silinmez. AI ajanlar bu veriyle eğitim alır.
                            Tek silme yetkisi: Koordinatör (PIN).
                        </div>
                        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                            {modelArsiv.length === 0 ? (
                                <div className="text-[10px] text-slate-500 text-center py-2">Model bağlı mesaj yok</div>
                            ) : modelArsiv.slice(0, 8).map(m => (
                                <Link key={m.id} href="/haberlesme" className="block bg-emerald-50/30 rounded p-1.5 border border-emerald-100 hover:border-emerald-300 transition-colors">
                                    <div className="text-[9px] font-black text-emerald-800 truncate">
                                        📦 [{m.urun_kodu || '—'}] {m.konu}
                                    </div>
                                    <div className="text-[8px] text-slate-500">{m.gonderen_adi} · {new Date(m.created_at).toLocaleDateString('tr-TR')}</div>
                                </Link>
                            ))}
                        </div>
                    </div>


                    <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200">
                        <h3 className="text-xs font-black uppercase text-emerald-700 mb-3 flex items-center gap-2"><Activity size={14} /> Sunucu Sağlığı</h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span>DB Soket (ms)</span>
                                <span className={ping === null ? 'text-slate-500' : ping < 200 ? 'text-emerald-400' : ping < 500 ? 'text-amber-400' : 'text-rose-600'}>
                                    {ping === null ? 'Ölçülüyor...' : `${ping}ms`}
                                </span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${ping === null ? 'bg-slate-600' : ping < 200 ? 'bg-emerald-500' : ping < 500 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: ping === null ? '0%' : `${Math.min(100, (ping / 1000) * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold mt-2">
                                <span>Realtime</span>
                                <span className="text-emerald-400">✅ Aktif</span>
                            </div>
                        </div>
                    </div>

                    {/* NİZAMBOT PANELİ */}
                    <div className="bg-white p-5 rounded-2xl shadow-lg border border-emerald-200">
                        <h3 className="text-xs font-black uppercase text-emerald-800 mb-3 flex items-center gap-2 justify-between">
                            <span className="flex items-center gap-2"><Bot size={14} /> NİZAMBOT</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${botDurum === 'aktif' ? 'bg-emerald-100 text-emerald-700' :
                                botDurum === 'hata' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {botDurum === 'aktif' ? '● AKTİF' : botDurum === 'hata' ? '● HATA' : '● KONTROL'}
                            </span>
                        </h3>

                        {/* Bot kimlik bilgisi */}
                        <div className="bg-slate-50 rounded-lg p-2 mb-3 flex items-center gap-2 border border-slate-200">
                            <Bot size={12} className="text-emerald-600 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-emerald-800">@Lumora_47bot</span>
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
                                <div key={i} className="bg-white rounded-lg p-2 border border-slate-200">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={`text-[9px] font-black flex items-center gap-1 ${log.sonuc === 'basarili' ? 'text-emerald-400' : 'text-red-400'
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
                                    <p className="text-[9px] text-slate-500 font-medium leading-tight truncate">
                                        {log.mesaj || log.islem_tipi}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <Link href="/ajanlar" className="mt-3 block text-center text-[9px] text-emerald-600 font-black hover:text-emerald-500 transition-colors">
                            Tüm Bot Kayıtları → Ajanlar Sayfası
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}

export { KarargahMainContainer as default };
