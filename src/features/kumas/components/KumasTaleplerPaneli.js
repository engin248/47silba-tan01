import { AlertTriangle, Scale } from 'lucide-react';

export default function KumasTaleplerPaneli({ m1Talepleri, setSeciliTalep, setFizibiliteModalAcik }) {
    return (
        <div className="xl:col-span-1 bg-[#161b22] border border-[#21262d] rounded-xl flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#21262d]">
                <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={14} /> M1'den Bekleyenler
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {m1Talepleri.length === 0 && <p className="text-[#8b949e] text-sm text-center mt-4">Henüz onaylanmış yeni bir M1 Karar talebi yok.</p>}
                {m1Talepleri.map(talep => (
                    <div key={talep.id} className="bg-[#0d1117] border border-amber-500/30 p-3 rounded-lg flex flex-col gap-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-amber-400 font-bold uppercase">YENİ MODEL (AŞAMA 2)</span>
                            <span className="text-sm text-emerald-400 font-bold border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10">M1 ONAYLI</span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{talep.baslik}</h3>
                        {talep.aciklama && (
                            <div className="text-sm text-[#8b949e] border-l-2 border-amber-500/50 pl-2 bg-[#21262d] p-2 rounded italic">
                                {talep.aciklama.substring(0, 100)}...
                            </div>
                        )}
                        <button
                            onClick={() => {
                                setSeciliTalep(talep);
                                setFizibiliteModalAcik(true);
                            }}
                            className="w-full text-sm font-bold text-center py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded mt-2 text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2">
                            <Scale size={12} /> BİZ KAÇA MAL EDERİZ? (FİZİBİLİTE)
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
