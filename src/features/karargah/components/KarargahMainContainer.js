'use client';
import {
    Activity, ShieldCheck, Zap, Bot, Camera, Info, ArrowRight, PlayCircle, AlertCircle, ServerCrash
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState } from 'react';

const MODULLER = [
    { name: 'Ar-Ge', link: '/arge', renk: 'bg-emerald-800' },
    { name: 'Kumaş', link: '/kumas', renk: 'bg-slate-800' },
    { name: 'Kalıp', link: '/kalip', renk: 'bg-slate-800' },
    { name: 'Modelhane', link: '/modelhane', renk: 'bg-slate-800' },
    { name: 'Kesim', link: '/kesim', renk: 'bg-indigo-800' },
    { name: 'İmalat', link: '/imalat', renk: 'bg-indigo-800' },
    { name: 'Üretim', link: '/uretim', renk: 'bg-indigo-800' },
    { name: 'Maliyet', link: '/maliyet', renk: 'bg-rose-800' },
    { name: 'Muhasebe', link: '/muhasebe', renk: 'bg-rose-900' },
    { name: 'Kasa', link: '/kasa', renk: 'bg-amber-800' },
    { name: 'Stok', link: '/stok', renk: 'bg-slate-800' },
    { name: 'Katalog', link: '/katalog', renk: 'bg-slate-800' },
    { name: 'Siparişler', link: '/siparisler', renk: 'bg-blue-800' },
    { name: 'Müşteriler', link: '/musteriler', renk: 'bg-blue-900' },
    { name: 'Personel', link: '/personel', renk: 'bg-violet-800' },
    { name: 'Görevler', link: '/gorevler', renk: 'bg-violet-900' },
    { name: 'Kameralar', link: '/kameralar', renk: 'bg-cyan-800' },
    { name: 'Ajanlar', link: '/ajanlar', renk: 'bg-emerald-900' },
    { name: 'Denetmen', link: '/denetmen', renk: 'bg-orange-800' },
    { name: 'Raporlar', link: '/raporlar', renk: 'bg-orange-900' },
    { name: 'Tasarım', link: '/tasarim', renk: 'bg-pink-800' },
    { name: 'Güvenlik', link: '/guvenlik', renk: 'bg-red-900' },
    { name: 'Ayarlar', link: '/ayarlar', renk: 'bg-slate-700' },
    { name: 'Giriş', link: '/giris', renk: 'bg-slate-600' },
];

export function KarargahMainContainer() {
    const { kullanici } = useAuth();
    const {
        stats, alarms, ping,
        commandText, setCommandText, hizliGorevAtama,
        aiSorgu, setAiSorgu, isAiLoading, aiAnalizBaslat,
        simulasyon, setSimulasyon,
        mesaj
    } = useKarargah();

    const [aiNedenModal, setAiNedenModal] = useState({ acik: false, metin: '', zarar: 0 });

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
                        <div className="mb-2 bg-indigo-950 p-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-indigo-900 transition-colors">
                            <div className="w-10 h-8 bg-black rounded flex items-center justify-center text-indigo-400 relative overflow-hidden border border-indigo-500/30">
                                <Camera size={14} className="relative z-10" />
                                <div className="absolute inset-0 bg-indigo-500/20 animate-pulse"></div>
                            </div>
                            <div className="flex flex-col flex-1 pl-1">
                                <span className="text-[10px] font-black text-indigo-300 flex items-center gap-1"><PlayCircle size={8} /> Canlı Görüş Aktif</span>
                                <span className="text-[9px] text-slate-400 font-semibold leading-tight">AI 4 kamerayı tarıyor.</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-slate-700/50">
                        <h3 className="text-xs font-black uppercase text-emerald-500 mb-3 flex items-center gap-2"><Activity size={14} /> Sunucu Sağlığı</h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span>DB Soket (ms)</span>
                                <span className={ping === null ? 'text-slate-400' : ping < 200 ? 'text-emerald-400' : ping < 500 ? 'text-amber-400' : 'text-rose-400'}>
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
                </div>
            </div>
        </div>
    );
}

export { KarargahMainContainer as default };
