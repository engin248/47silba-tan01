'use client';
import { useState } from 'react';
import { Shirt, Plus, Search, Lock, ShieldAlert } from 'lucide-react';

import { useAuth } from '@/lib/auth';
import { useModelhane } from '@/features/modelhane/hooks/useModelhane';

import ModelhaneKpiPanel from './ModelhaneKpiPanel';
import ModelhaneKalipTalepleri from './ModelhaneKalipTalepleri';
import ModelhaneTeknikAnalizListesi from './ModelhaneTeknikAnalizListesi';

export default function ModelhaneMainContainer() {
    const { kullanici } = useAuth();
    const { yetkiliMi, loading, m3Talepleri, teknikAnalizVerileri, numuneDikimiBitir, durumGuncelle } = useModelhane(kullanici);

    const [sekmeler] = useState(['Provalar & Teknik Analiz (Numunesi Çıkanlar)', 'Onaylanan Modeller', 'İptal Edilenler']);
    const [aktifSekme, setAktifSekme] = useState(0);

    if (loading) return <div className="p-12 text-center text-purple-400 font-bold tracking-widest animate-pulse">SUPABASE M4 YÜKLENİYOR...</div>;

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 shadow-2xl rounded-2xl m-8 border-2 border-rose-900/50">
                <Lock size={48} className="mx-auto mb-4 text-rose-500" />
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">YETKİSİZ GİRİŞ (M4)</h2>
                <p className="text-rose-300 font-bold mt-2">Bu modül Teknik İnceleme ve Modelhane personeline özeldir.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>

                {/* 1. BAŞLIK VE HEDEF GÖSTERİCİ */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#21262d] pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-900 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 border border-purple-500/30">
                            <Shirt size={24} className="text-purple-50" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight m-0 uppercase flex items-center gap-3">
                                M4: Modelhane ve Teknik Analiz
                            </h1>
                            <p className="text-xs font-bold text-purple-300 mt-1 uppercase tracking-wider flex items-center gap-2">
                                <ShieldAlert size={14} /> Aşama 4 Teknik Kurallar: (Zor Model + Özel Makine = RİSK)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2">
                            <Plus size={16} /> NUMUNE DİKİM FORMU Aç
                        </button>
                    </div>
                </div>

                {/* 2. TEKNİK ANALİZ (5 SORU) KPI'LARI */}
                <ModelhaneKpiPanel />

                {/* 3. İKİLİ PANE (SOL: M3 KALIP ONAYLARI, SAĞ: TEKNİK BİLGİ/ANALİZ LİSTESİ) */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">

                    {/* SOL PANEL (M3'TEN GELEN TALEPLER - NUMUNE İÇİN) */}
                    <ModelhaneKalipTalepleri m3Talepleri={m3Talepleri} numuneDikimiBitir={numuneDikimiBitir} />

                    {/* SAĞ PANEL (TEKNİK ANALİZ VE 5 SORU RAPORLARI) */}
                    <div className="xl:col-span-3 flex flex-col">
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {sekmeler.map((s, i) => (
                                <button key={i} onClick={() => setAktifSekme(i)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${aktifSekme === i ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' : 'bg-[#161b22] text-[#8b949e] border border-[#21262d] hover:text-white'
                                    }`}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl flex-1 p-4 overflow-y-auto">
                            <div className="relative mb-4 w-full max-w-md">
                                <Search className="absolute left-3 top-2.5 text-[#8b949e]" size={14} />
                                <input type="text" placeholder="Model Kodu veya Adı..." className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-purple-500 outline-none transition-colors" />
                            </div>

                            <ModelhaneTeknikAnalizListesi teknikAnalizVerileri={teknikAnalizVerileri} durumGuncelle={durumGuncelle} />

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
