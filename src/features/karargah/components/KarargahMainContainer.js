'use client';
import {
    Activity, ShieldCheck, Zap, Bot, Camera, Info, ArrowRight, PlayCircle, AlertCircle, ServerCrash, Send, CheckCircle, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const MODULLER = [
    { name: 'Ar-Ge', link: '/arge', renk: 'bg-emerald-800' },
    { name: 'Kumaş', link: '/kumas', renk: 'bg-slate-800' },
    { name: 'Kalıp', link: '/kalip', renk: 'bg-slate-800' },
    { name: 'Modelhane', link: '/modelhane', renk: 'bg-slate-800' },
    { name: 'Kesim', link: '/kesim', renk: 'bg-indigo-800' },
    { name: 'Üretim', link: '/uretim', renk: 'bg-indigo-800' },
    { name: 'Maliyet', link: '/maliyet', renk: 'bg-rose-800' },
    { name: 'Rapor', link: '/raporlar', renk: 'bg-orange-800' },
    { name: 'Ürün', link: '/katalog', renk: 'bg-slate-800' },
    { name: 'Sipariş', link: '/siparisler', renk: 'bg-blue-800' },
    { name: 'Sevkiyat', link: '/stok', renk: 'bg-slate-800' },
    { name: 'Güvenlik', link: '/guvenlik', renk: 'bg-slate-800' },
    { name: '💬 Haberleşme', link: '/haberlesme', renk: 'bg-violet-800' },
    { name: '📋 Görevler', link: '/gorevler', renk: 'bg-teal-800' },
];

export function KarargahMainContainer() {
    const { kullanici } = useAuth();
    const {
        stats, alarms,
        commandText, setCommandText, hizliGorevAtama,
        aiSorgu, setAiSorgu, isAiLoading, aiAnalizBaslat, aiSonuc,
        simulasyon, setSimulasyon,
        mesaj
    } = useKarargah();

    const [aiNedenModal, setAiNedenModal] = useState({ acik: false, metin: '', zarar: 0 });
    const [botLoglar, setBotLoglar] = useState([]);
    const [botDurum, setBotDurum] = useState('kontrol');
    const [sonMesajlar, setSonMesajlar] = useState([]);
    const [mesajSayisi, setMesajSayisi] = useState(0);
    const [gizlenIzleri, setGizlenIzleri] = useState([]);
    const [modelArsiv, setModelArsiv] = useState([]);
    const [izPanelAcik, setIzPanelAcik] = useState(false);
    // [C5] Kamera widget için stream durumu
    const [kameraStreamDurum, setKameraStreamDurum] = useState('kontrol');

    useEffect(() => {
        const kontrol = async () => {
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
        return () => clearInterval(iv);
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
                .limit(20)
                .catch(() => ({ data: null }));

            const izler = (gizli?.data || []).filter(g => !g.b1_ic_mesajlar?.urun_id); // model bağlısı ayrı
            setGizlenIzleri(izler);

            // Model arşiv — urun_id bağlı, HİÇBİR ZAMAN silinmez, koordinatör görebilir
            const { data: model } = await supabase
                .from('b1_ic_mesajlar')
                .select('id, konu, oncelik, urun_id, urun_kodu, urun_adi, gonderen_adi, created_at, okundu_at')
                .not('urun_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(50)
                .catch(() => ({ data: null }));
            setModelArsiv(model?.data || []);

        } catch { /* sessiz */ }
    }, []);

    useEffect(() => { mesajlariGetir(); }, [mesajlariGetir]);

    // Realtime — yeni mesaj / gizleme gelince güncelle
    useEffect(() => {
        const kanal = supabase.channel('karargah-mesaj')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_ic_mesajlar' }, mesajlariGetir)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_mesaj_gizli' }, mesajlariGetir)
            .subscribe();
        return () => supabase.removeChannel(kanal);
    }, [mesajlariGetir]);

    // NİZAMBOT — Son aktiviteleri çek
    useEffect(() => {
        const botLogCek = async () => {
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
        const interval = setInterval(botLogCek, 30000); // 30 sn'de bir güncelle
        return () => clearInterval(interval);
    }, []);


    const fm = (num) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(num);

    const SkeletonKutu = () => (
        <div className="animate-pulse bg-slate-800 p-4 rounded-xl shadow-lg h-28 border border-white/5 flex flex-col justify-between">
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            <div className="h-8 bg-slate-700 rounded w-3/4"></div>
        </div>
    );

    const isAdmin = kullanici?.grup === 'tam' || kullanici?.rol === 'admin';

    return (
        <div className="bg-[#0f172a] min-h-screen p-4 text-white font-sans selection:bg-emerald-500 selection:text-white pb-20">

            {mesaj.text && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 px-8 rounded-lg font-bold shadow-2xl transition-all ${mesaj.type === 'error' ? 'bg-red-600 text-white border-2 border-red-500' : 'bg-emerald-600 text-white'}`}>
                    {mesaj.text}
                </div>
            )}

            {aiNedenModal.acik && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] w-full max-w-md p-6 rounded-2xl border border-rose-500/50 shadow-2xl relative">
                        <button onClick={() => setAiNedenModal({ acik: false })} className="absolute top-4 right-4 text-slate-400 hover:text-white font-black text-xl">✕</button>
                        <h2 className="text-xl font-black text-amber-500 mb-2 flex items-center gap-2"><Bot /> HermAI Yorumlayıcı</h2>
                        <div className="bg-[#0f172a] p-4 rounded-xl mb-4 border border-white/10">
                            <p className="text-sm font-semibold text-slate-300">
                                <strong className="text-white block mb-1">Tespit Edilen Kök Neden (Kovaryans):</strong>
                                {aiNedenModal.metin}
                            </p>
                            <p className="mt-3 text-sm">
                                <strong className="text-rose-400 block mb-1">Günlük Potansiyel Finansal Zarar:</strong>
                                <span className="text-2xl font-black text-rose-500">₺ {fm(aiNedenModal.zarar)}</span>
                            </p>
                        </div>
                        <button onClick={() => setAiNedenModal({ acik: false })} className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-lg font-bold text-white transition-all">Anlaşıldı, Kapat</button>
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
                                    <div className="bg-[#16a34a] p-4 rounded-xl flex flex-col justify-between shadow-lg h-28 transform transition-transform hover:scale-[1.02] cursor-pointer border border-[#16a34a] hover:border-white/20">
                                        <span className="text-sm font-bold opacity-90 uppercase truncate">Günlük Ciro</span>
                                        <span className="text-2xl font-black truncate">
                                            ₺ {isAdmin ? fm(stats.ciro + ((stats.ciro * simulasyon) / 100)) : '****'}
                                        </span>
                                    </div>
                                </Link>
                                <Link href="/maliyet" passHref>
                                    <div className="bg-[#2563eb] p-4 rounded-xl flex flex-col justify-between shadow-lg h-28 transform transition-transform hover:scale-[1.02] cursor-pointer border border-[#2563eb] hover:border-white/20">
                                        <span className="text-sm font-bold opacity-90 uppercase truncate">Toplam Maliyet</span>
                                        <span className="text-2xl font-black truncate">
                                            ₺ {isAdmin ? fm(stats.maliyet) : '****'}
                                        </span>
                                    </div>
                                </Link>
                                <Link href="/personel" passHref>
                                    <div className="bg-[#7c3aed] p-4 rounded-xl flex flex-col justify-between shadow-lg h-28 transform transition-transform hover:scale-[1.02] cursor-pointer border border-[#7c3aed] hover:border-white/20">
                                        <span className="text-sm font-bold opacity-90 uppercase truncate">Personel Gider</span>
                                        <span className="text-2xl font-black truncate">
                                            ₺ {isAdmin ? fm(stats.personel) : '****'}
                                        </span>
                                    </div>
                                </Link>
                                <Link href="/maliyet" passHref>
                                    <div className="bg-[#dc2626] p-4 rounded-xl flex flex-col justify-between shadow-lg h-28 transform transition-transform hover:scale-[1.02] cursor-pointer border border-[#dc2626] hover:border-white/20">
                                        <span className="text-sm font-bold opacity-90 uppercase truncate">Fire / Zayiat {simulasyon !== 0 && `(Sim: %+${simulasyon})`}</span>
                                        <span className="text-2xl font-black truncate">%{stats.fire}</span>
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-slate-700/50 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2 tracking-wider"><Zap size={14} /> Görev Arama Motoru (CMD+K)</h3>
                                <div className="flex gap-2">
                                    <input
                                        value={commandText}
                                        onChange={(e) => setCommandText(e.target.value)}
                                        placeholder="/komut (Zod korumalıdır)"
                                        className="flex-1 bg-[#0f172a] text-white px-4 py-2 rounded-xl border border-slate-600 focus:outline-none focus:border-blue-500 transition-colors text-sm font-semibold placeholder-slate-500"
                                    />
                                    <button onClick={hizliGorevAtama} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2 rounded-xl font-bold transition-colors shadow-lg text-sm tracking-wide">BAŞLAT</button>
                                </div>
                            </div>

                            <div className="mt-2 border-t border-white/10 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-300">Stratejik What-if Analizi (Fiyatlama):</span>
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

                        <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-slate-700/50 flex flex-col justify-between gap-4">
                            <div>
                                <h3 className="text-xs font-bold uppercase text-emerald-500 flex items-center gap-2 tracking-wider mb-2"><Bot size={14} /> Yapay Zeka Komuta Merkezi</h3>
                                <div className="flex gap-2">
                                    <input
                                        value={aiSorgu}
                                        onChange={(e) => setAiSorgu(e.target.value)}
                                        placeholder="Pazar Analizi veya Rapor İste..."
                                        className="flex-1 bg-[#0f172a] text-white px-4 py-2 rounded-xl border border-emerald-900 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-semibold placeholder-slate-500"
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

                            <div className="bg-[#0f172a] p-3 rounded-lg border border-white/5 flex items-center justify-between mt-auto">
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {MODULLER.map((mod, i) => (
                            <Link href={mod.link} key={i}>
                                <div className={`${mod.renk} hover:opacity-80 transition-all p-3 rounded-xl text-center shadow-md flex items-center justify-center border border-white/5 h-16`}>
                                    <span className="font-bold text-sm tracking-wide">{mod.name}</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>

                <div className="flex flex-col gap-4">

                    <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-slate-700/50">
                        <h3 className="text-xs font-black uppercase text-rose-500 mb-3 flex items-center gap-2"><AlertCircle size={14} /> Kriz & Risk Radarı</h3>

                        {alarms.length === 0 ? (
                            <div className="text-emerald-400 font-bold text-sm bg-emerald-900/40 p-3 rounded-lg border border-emerald-800">✅ Risk Tespit Edilmedi.</div>
                        ) : (
                            <div className="space-y-3">
                                {alarms.map(al => (
                                    <div key={al.id} className="bg-[#0f172a] p-3 rounded-lg border-l-4 border-rose-500 shadow-xl group">
                                        <p className="text-xs font-black text-slate-300">{al.text}</p>
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

                    <div className="bg-[#1e293b] p-4 rounded-xl shadow-lg border border-indigo-900/40">
                        <Link href="/kameralar" className="block">
                            <div className={`mb-2 p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${kameraStreamDurum === 'aktif' ? 'bg-indigo-950 hover:bg-indigo-900' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                <div className={`w-10 h-8 bg-black rounded flex items-center justify-center relative overflow-hidden border ${kameraStreamDurum === 'aktif' ? 'border-indigo-500/30 text-indigo-400' : 'border-red-900/40 text-red-400'}`}>
                                    <Camera size={14} className="relative z-10" />
                                    <div className={`absolute inset-0 ${kameraStreamDurum === 'aktif' ? 'bg-indigo-500/20 animate-pulse' : 'bg-red-500/10'}`}></div>
                                </div>
                                <div className="flex flex-col flex-1 pl-1">
                                    <span className={`text-[10px] font-black flex items-center gap-1 ${kameraStreamDurum === 'aktif' ? 'text-indigo-300' : 'text-red-400'}`}>
                                        <PlayCircle size={8} />
                                        {kameraStreamDurum === 'aktif' ? 'Canlı Görüş Aktif' : kameraStreamDurum === 'kapali' ? 'Sunucu Kapalı' : 'Kontrol Ediliyor...'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-semibold leading-tight">
                                        {kameraStreamDurum === 'aktif' ? 'AI 4 kamerayı tarıyor.' : 'go2rtc başlatılmalı → stream-server/BASLAT.bat'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>


                    {/* ── SON MESAJLAR WİDGET ──────────────────────── */}
                    <div className="bg-[#1e293b] p-4 rounded-xl shadow-lg border border-violet-900/40">
                        <h3 className="text-xs font-black uppercase text-violet-400 mb-3 flex items-center justify-between gap-2">
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
                                <Link key={m.id} href="/haberlesme" className="block bg-[#0f172a] rounded-lg p-2 border border-white/5 hover:border-violet-500/40 transition-colors">
                                    <div className="text-[10px] font-black text-white truncate">
                                        {m.oncelik === 'kritik' ? '🔴' : m.oncelik === 'acil' ? '🟡' : '🔵'} {m.konu}
                                        {m.urun_id && <span className="ml-1 text-amber-400">📦</span>}
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{m.gonderen_adi}</div>
                                </Link>
                            ))}
                        </div>
                        <Link href="/haberlesme" className="mt-2 block text-center text-[9px] text-violet-400 font-black hover:text-violet-300 transition-colors">
                            Haberleşme → Tümünü Gör
                        </Link>
                    </div>

                    {/* ── 45-GÜN MESAJ İZ PANELİ ──────────────────── */}
                    <div className="bg-[#1e293b] p-4 rounded-xl shadow-lg border border-amber-900/40">
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
                                    <div className="text-[10px] text-slate-500 text-center py-2">Son 45 günde gizlenen iz yok</div>
                                ) : gizlenIzleri.map((g, i) => (
                                    <div key={i} className="bg-[#0f172a] rounded p-1.5 border border-amber-900/30">
                                        <div className="text-[9px] font-black text-amber-300 truncate">
                                            {g.b1_ic_mesajlar?.konu || 'Bilinmeyen Konu'}
                                        </div>
                                        <div className="text-[8px] text-slate-500">
                                            Gizleyen: {g.kullanici_adi} · {g.b1_ic_mesajlar?.gonderen_modul}
                                        </div>
                                    </div>
                                ))}
                                <div className="text-[8px] text-slate-600 text-center mt-1 font-semibold">
                                    ⚠️ 45. günden sonra sistem bu izleri otomatik temizler
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── MODEL BİLGİ ARŞİVİ — KALICI ─────────────── */}
                    <div className="bg-[#1e293b] p-4 rounded-xl shadow-lg border border-emerald-900/40">
                        <h3 className="text-xs font-black uppercase text-emerald-400 mb-2 flex items-center justify-between gap-2">
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
                                <Link key={m.id} href="/haberlesme" className="block bg-[#0f172a] rounded p-1.5 border border-emerald-900/30 hover:border-emerald-500/40 transition-colors">
                                    <div className="text-[9px] font-black text-emerald-300 truncate">
                                        📦 [{m.urun_kodu || '—'}] {m.konu}
                                    </div>
                                    <div className="text-[8px] text-slate-500">{m.gonderen_adi} · {new Date(m.created_at).toLocaleDateString('tr-TR')}</div>
                                </Link>
                            ))}
                        </div>
                    </div>


                    <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-slate-700/50">
                        <h3 className="text-xs font-black uppercase text-emerald-500 mb-3 flex items-center gap-2"><Activity size={14} /> Sunucu Sağlığı</h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs font-bold"><span>RAM Kullanımı</span> <span className="text-emerald-400">%32</span></div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '32%' }}></div></div>
                            <div className="flex justify-between items-center text-xs font-bold mt-2"><span>DB Soket (Ms)</span> <span className="text-emerald-400">12ms (Realtime)</span></div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '4%' }}></div></div>
                        </div>
                    </div>

                    {/* NİZAMBOT PANELİ */}
                    <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-violet-900/40">
                        <h3 className="text-xs font-black uppercase text-violet-400 mb-3 flex items-center gap-2 justify-between">
                            <span className="flex items-center gap-2"><Bot size={14} /> NİZAMBOT</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${botDurum === 'aktif' ? 'bg-emerald-900 text-emerald-400' :
                                botDurum === 'hata' ? 'bg-red-900 text-red-400' :
                                    'bg-slate-700 text-slate-400'
                                }`}>
                                {botDurum === 'aktif' ? '● AKTİF' : botDurum === 'hata' ? '● HATA' : '● KONTROL'}
                            </span>
                        </h3>

                        {/* Bot kimlik bilgisi */}
                        <div className="bg-[#0f172a] rounded-lg p-2 mb-3 flex items-center gap-2 border border-violet-900/30">
                            <Bot size={12} className="text-violet-400 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-violet-300">@Lumora_47bot</span>
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
                                <div key={i} className="bg-[#0f172a] rounded-lg p-2 border border-white/5">
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
                                    <p className="text-[9px] text-slate-400 font-medium leading-tight truncate">
                                        {log.mesaj || log.islem_tipi}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <Link href="/ajanlar" className="mt-3 block text-center text-[9px] text-violet-400 font-black hover:text-violet-300 transition-colors">
                            Tüm Bot Kayıtları → Ajanlar Sayfası
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}

export { KarargahMainContainer as default };
