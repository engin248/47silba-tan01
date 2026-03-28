import { BookOpen, Plus, Ruler, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function KalipUstPanel({
    sekme, setSekme, formAcik, setFormAcik, modellerSayisi, kaliplarSayisi
}) {
    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#21262d] pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-900 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-500/30">
                        <BookOpen size={24} className="text-amber-50" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight m-0 uppercase">M3: Kalıp & Üretim Planlama</h1>
                        <p className="text-xs font-bold text-amber-300/80 mt-1 uppercase tracking-wider flex items-center gap-2">
                            <Ruler size={14} /> Kritik Aşama: Metraj hesaplamasını titizlikle yapın.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setFormAcik(!formAcik)} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg text-xs font-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center gap-2 uppercase tracking-widest">
                        <Plus size={16} /> {sekme === 'modeller' ? 'YENİ MODEL TASLAĞI' : 'YENİ KALIP & PASTAL'}
                    </button>
                    <Link href="/modelhane">
                        <button className="bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-white px-5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 uppercase tracking-widest">
                            M4 MODELHANE (DİKİM) <ChevronRight size={16} />
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                    <span className="text-sm font-bold uppercase tracking-wider text-[#8b949e]">Model Taslağı</span>
                    <div className="text-2xl font-black text-white mt-1">{modellerSayisi}</div>
                </div>
                <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                    <span className="text-sm font-bold uppercase tracking-wider text-amber-400">Onaylı Kalıp / Pastal</span>
                    <div className="text-2xl font-black text-white mt-1">{kaliplarSayisi}</div>
                </div>
                <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                    <span className="text-sm font-bold uppercase tracking-wider text-blue-400">Ortalama Beden Seti</span>
                    <div className="text-2xl font-black text-white mt-1">4.5 <span className="text-xs text-[#8b949e]">Beden/Model</span></div>
                </div>
                <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                    <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">Üretime Geçiş (M4)</span>
                    <div className="text-2xl font-black text-white mt-1">100%</div>
                </div>
            </div>

            <div className="flex gap-2 mb-6 border-b border-[#21262d] pb-2">
                <button onClick={() => { setSekme('modeller'); setFormAcik(false); }} className={`px-5 py-2.5 rounded-t-lg text-xs font-black uppercase tracking-widest transition-colors ${sekme === 'modeller' ? 'bg-[#161b22] text-amber-500 border-t border-x border-[#30363d]' : 'text-[#8b949e] hover:text-white'}`}>
                    📐 MODEL TASLAKLARI
                </button>
                <button onClick={() => { setSekme('kaliplar'); setFormAcik(false); }} className={`px-5 py-2.5 rounded-t-lg text-xs font-black uppercase tracking-widest transition-colors ${sekme === 'kaliplar' ? 'bg-[#161b22] text-amber-500 border-t border-x border-[#30363d]' : 'text-[#8b949e] hover:text-white'}`}>
                    📏 KALIPLAR & BEDENLER
                </button>
            </div>
        </>
    );
}
