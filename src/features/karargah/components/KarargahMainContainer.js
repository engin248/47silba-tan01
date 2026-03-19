'use client';
import {
    Activity, ShieldCheck, Zap, Bot, ArrowRight, AlertTriangle, Cpu, Network,
    ChevronRight, Search, BarChart3, Scissors, Factory, ShoppingBag, Package,
    Users, Wallet, PieChart, TrendingUp, AlertCircle, Shirt, Ruler, Layers, CheckCircle2, Lock
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { useKarargah } from '@/features/karargah/hooks/useKarargah';

export function KarargahMainContainer() {
    const { kullanici } = useAuth();
    const { kpiData, aiOutputs, uretimDurumu, hazineDurumu } = useKarargah();
    const [yetkiliMi, setYetkiliMi] = useState(false);

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: KarargahMainContainer.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);
    }, [kullanici]);

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-red-950/20 shadow-2xl rounded-2xl m-8 border border-red-900/50">
                <Lock size={64} className="mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-black text-red-500 uppercase">KARARGAHA GİRİŞ YASAKTIR (KORUMA)</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>

                <div className="mb-6 flex flex-col border-b border-[#21262d] pb-4">
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                        <ShieldCheck className="text-indigo-400" size={28} /> MERKEZİ KARARGAH (NİZAM BEYNİ)
                    </h1>
                    <span className="text-xs font-mono text-[#8b949e] mt-1 tracking-widest uppercase">
                        Tam Kontrol ve Komuta Ağı Devrede. Sistem Sağlığı: 🟡 DİKKAT (API İYİLEŞTİRMELERİ GEREKİYOR)
                    </span>
                </div>

                {/* 1. ÜST PANEL: GERÇEK KPI'LAR (% ARTIŞ, HEDEF VS GERÇEKLEŞEN) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* CİRO */}
                    <div className="bg-[#161b22] border-t-2 border-emerald-500 rounded-b-xl p-5 shadow-lg flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Aylık/Günlük Ciro</span>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-500/30">DURUM: İYİ</span>
                        </div>
                        <span className="text-3xl font-black text-white">₺{kpiData.ciro.anlik.toLocaleString()}</span>
                        <div className="flex justify-between items-end mt-2">
                            <span className="text-[11px] font-bold text-emerald-400">▲ +%{kpiData.ciro.artisYuzde} Büyüme</span>
                            <span className="text-[10px] font-mono text-gray-500">Hedef: ₺{kpiData.ciro.hedef.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* MALİYET */}
                    <div className="bg-[#161b22] border-t-2 border-amber-500 rounded-b-xl p-5 shadow-lg flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Kümülatif Maliyet & Fire</span>
                            <span className="bg-amber-500/20 text-amber-400 text-[9px] font-black px-2 py-0.5 rounded border border-amber-500/30">DURUM: RİSKLİ</span>
                        </div>
                        <span className="text-3xl font-black text-white">₺{kpiData.maliyet.anlik.toLocaleString()}</span>
                        <div className="flex justify-between items-end mt-2">
                            <span className="text-[11px] font-bold text-emerald-400">▼ %{Math.abs(kpiData.maliyet.artisYuzde)} Düşüş (Olumlu)</span>
                            <span className="text-[10px] font-mono text-amber-500">Fire Dikkat</span>
                        </div>
                    </div>

                    {/* ÜRETİM & PERSONEL */}
                    <div className="bg-[#161b22] border-t-2 border-blue-500 rounded-b-xl p-5 shadow-lg flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Personel Üretim Verimi</span>
                            <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black px-2 py-0.5 rounded border border-blue-500/30">STANDART</span>
                        </div>
                        <span className="text-3xl font-black text-white">{kpiData.personel.uretimSkoru} <span className="text-sm text-gray-500">Puan</span></span>
                        <div className="flex justify-between items-end mt-2">
                            <span className="text-[11px] font-bold text-blue-400">Kişi Başı Üretim: {kpiData.personel.verimlilik}</span>
                            <span className="text-[10px] font-mono text-gray-500">M14 Personel</span>
                        </div>
                    </div>

                    {/* SİSTEM SAĞLIĞI & ALARM */}
                    <div className="bg-[#161b22] border-t-2 border-rose-500 rounded-b-xl p-5 shadow-lg flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Ağır Sistem Olayları</span>
                            <span className="bg-rose-500/20 text-rose-400 text-[9px] font-black px-2 py-0.5 rounded border border-rose-500/30 animate-pulse">2 KRİTİK</span>
                        </div>
                        <span className="text-3xl font-black text-rose-500">{kpiData.sistem.hata} <span className="text-sm text-rose-400">Hata</span></span>
                        <div className="flex justify-between items-end mt-2">
                            <span className="text-[11px] font-bold text-rose-400">API: {kpiData.sistem.api} | {kpiData.sistem.uyarilar} Uyarı</span>
                            <Link href="/guvenlik" className="text-[10px] font-bold text-indigo-400 hover:underline">Loglar ↗</Link>
                        </div>
                    </div>
                </div>

                {/* 2. ORTA PANEL: AI ÇIKTILARI (GÖSTERGE DEĞİL, KARAR MERCİİ) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* YAPAY ZEKA CANLI PANOSU (ÖNERİ YERİNE KARAR/BİLDİRİM) */}
                    <div className="bg-[#122b27] border border-[#1e4a43] rounded-xl flex flex-col overflow-hidden h-[350px]">
                        <div className="p-4 border-b border-[#1e4a43] flex justify-between items-center bg-[#0d211e]">
                            <h2 className="text-xs font-black text-emerald-400 tracking-widest uppercase flex items-center gap-2">
                                <Bot size={16} /> EVRENSEL AI KOMUTA İSTİHBARATI
                            </h2>
                            <Link href="/ajanlar" className="text-[#8b949e] hover:text-white text-[10px] font-bold uppercase tracking-wider">Tüm Ajanlar ↗</Link>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 styled-scroll">
                            {aiOutputs.map((out, i) => (
                                <div key={i} className={`p-4 border rounded-lg flex items-start justify-between gap-4 
                                    ${out.tur === 'trend' ? 'bg-[#0d1117] border-emerald-500/30' :
                                        out.tur === 'dikkat' ? 'bg-[#0d1117] border-amber-500/30' : 'bg-[#0d1117] border-rose-500/30'}`}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${out.tur === 'trend' ? 'bg-emerald-500/20 text-emerald-400' :
                                                out.tur === 'dikkat' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                                                }`}>{out.ajan}</span>
                                        </div>
                                        <p className="text-white text-xs font-medium leading-relaxed">{out.mesaj}</p>
                                    </div>
                                    <div>
                                        <button className={`whitespace-nowrap px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all
                                            ${out.tur === 'trend' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
                                                'bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d]'}`}>
                                            Kararı Uygula
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* OPERASYON: ÜRETİM VE FİNANS */}
                    <div className="space-y-6 flex flex-col h-[350px]">
                        {/* ÜRETİM BLOĞU */}
                        <div className="flex-1 bg-[#161b22] border border-[#21262d] rounded-xl flex flex-col">
                            <div className="p-3 border-b border-[#21262d]">
                                <h2 className="text-[10px] font-black text-[#8b949e] tracking-widest uppercase flex items-center gap-2">
                                    <Cpu size={14} className="text-blue-500" /> ÜRETİM MOTORU & DARBOĞAZ
                                </h2>
                            </div>
                            <div className="p-3 space-y-2 overflow-y-auto styled-scroll">
                                {uretimDurumu.map((u, i) => (
                                    <div key={i} className="flex justify-between items-center bg-[#0d1117] border border-[#30363d] p-3 rounded-lg">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white">{u.hat}</span>
                                            <span className="text-[10px] text-[#8b949e]">{u.islem}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${u.durum === 'Darbogaz' ? 'text-rose-500' : 'text-emerald-400'}`}>
                                                {u.durum}
                                            </span>
                                            {u.durum === 'Darbogaz' && <span className="text-[10px] font-mono text-rose-400">Gecikme: {u.gecikme}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* HAZİNE VE E-TİCARET BLOĞU */}
                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 grid grid-cols-2 gap-4">
                            {hazineDurumu.map((h, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="flex flex-col border-l-2 border-indigo-500 pl-3">
                                        <span className="text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">{h.baslik}</span>
                                        <span className="text-sm font-bold text-indigo-400">{h.deger}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. ALT BÖLÜM: 22 MODÜLE GİRİŞ */}
                <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6 shadow-md">
                    <h2 className="text-sm font-bold text-[#8b949e] uppercase tracking-widest mb-4 flex items-center justify-between border-b border-[#30363d] pb-4">
                        <span className="flex items-center gap-2"><Network size={18} className="text-indigo-400" /> Merkezi Üretim Modülleri</span>
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                        <Link href="/arge" className="group bg-[#0d1117] border border-[#30363d] hover:border-emerald-500/50 hover:bg-[#122b27] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
                            <Search size={22} className="text-[#8b949e] group-hover:text-emerald-400 transition-colors" />
                            <span className="text-[11px] font-bold text-[#8b949e] group-hover:text-emerald-400 uppercase tracking-widest text-center">M1<br /><span className="text-white/80 group-hover:text-white capitalize tracking-normal font-semibold">Ar-Ge</span></span>
                        </Link>
                        <Link href="/kumas" className="group bg-[#0d1117] border border-[#30363d] hover:border-blue-500/50 hover:bg-[#112a46] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
                            <Layers size={22} className="text-[#8b949e] group-hover:text-blue-400 transition-colors" />
                            <span className="text-[11px] font-bold text-[#8b949e] group-hover:text-blue-400 uppercase tracking-widest text-center">M2<br /><span className="text-white/80 group-hover:text-white capitalize tracking-normal font-semibold">Kumaş</span></span>
                        </Link>
                        <Link href="/kalip" className="group bg-[#0d1117] border border-[#30363d] hover:border-purple-500/50 hover:bg-[#201538] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
                            <Ruler size={22} className="text-[#8b949e] group-hover:text-purple-400 transition-colors" />
                            <span className="text-[11px] font-bold text-[#8b949e] group-hover:text-purple-400 uppercase tracking-widest text-center">M3<br /><span className="text-white/80 group-hover:text-white capitalize tracking-normal font-semibold">Kalıp</span></span>
                        </Link>
                        <Link href="/modelhane" className="group bg-[#0d1117] border border-[#30363d] hover:border-pink-500/50 hover:bg-[#341624] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
                            <Shirt size={22} className="text-[#8b949e] group-hover:text-pink-400 transition-colors" />
                            <span className="text-[11px] font-bold text-[#8b949e] group-hover:text-pink-400 uppercase tracking-widest text-center">M4<br /><span className="text-white/80 group-hover:text-white capitalize tracking-normal font-semibold">Modelhane</span></span>
                        </Link>
                        <Link href="/kesim" className="group bg-[#0d1117] border border-[#30363d] hover:border-amber-500/50 hover:bg-[#3b2813] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
                            <Scissors size={22} className="text-[#8b949e] group-hover:text-amber-400 transition-colors" />
                            <span className="text-[11px] font-bold text-[#8b949e] group-hover:text-amber-400 uppercase tracking-widest text-center">M5<br /><span className="text-white/80 group-hover:text-white capitalize tracking-normal font-semibold">Kesim</span></span>
                        </Link>
                        <Link href="/uretim" className="group bg-[#0d1117] border border-[#30363d] hover:border-orange-500/50 hover:bg-[#381b11] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
                            <Factory size={22} className="text-[#8b949e] group-hover:text-orange-400 transition-colors" />
                            <span className="text-[11px] font-bold text-[#8b949e] group-hover:text-orange-400 uppercase tracking-widest text-center">M6<br /><span className="text-white/80 group-hover:text-white capitalize tracking-normal font-semibold">Üretim/Bant</span></span>
                        </Link>
                        <Link href="/maliyet" className="group bg-[#0d1117] border border-[#30363d] hover:border-emerald-500/50 hover:bg-[#122b27] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
                            <PieChart size={22} className="text-[#8b949e] group-hover:text-emerald-400 transition-colors" />
                            <span className="text-[11px] font-bold text-[#8b949e] group-hover:text-emerald-400 uppercase tracking-widest text-center">M7<br /><span className="text-white/80 group-hover:text-white capitalize tracking-normal font-semibold">Maliyet</span></span>
                        </Link>
                        <Link href="/katalog" className="group bg-[#0d1117] border border-[#30363d] hover:border-indigo-500/50 hover:bg-[#171638] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
                            <ShoppingBag size={22} className="text-[#8b949e] group-hover:text-indigo-400 transition-colors" />
                            <span className="text-[11px] font-bold text-[#8b949e] group-hover:text-indigo-400 uppercase tracking-widest text-center">M9<br /><span className="text-white/80 group-hover:text-white capitalize tracking-normal font-semibold">Katalog</span></span>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}

export { KarargahMainContainer as default };
