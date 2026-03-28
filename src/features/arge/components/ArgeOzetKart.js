import { Activity, TrendingUp } from 'lucide-react';

export default function ArgeOzetKart({ products }) {
    const yukselenler = products.filter(p => p.satar_satmaz_skoru >= 85);

    return (
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <h3 className="text-sm font-black text-[#8b949e] tracking-widest uppercase mb-4 flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" /> Ajan Saha Özeti
            </h3>
            <div className="space-y-4 mb-5">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Son 24h Taranan</div>
                    <div className="text-xl font-black text-white">{products.length}</div>
                </div>
                <div className="h-px bg-[#21262d]"></div>
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">M1 Zırhından Geçen</div>
                    <div className="text-xl font-black text-emerald-400">{yukselenler.length}</div>
                </div>
            </div>

            <h4 className="text-xs font-bold text-[#8b949e] uppercase mb-3 border-t border-[#21262d] pt-4 flex items-center gap-1">
                <TrendingUp size={14} className="text-blue-500" /> [AR-01] Top Yükselenler
            </h4>
            <div className="space-y-3">
                {yukselenler.slice(0, 3).map((tp, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]">
                        <div className="truncate text-[0.7rem] font-bold text-gray-300 w-2/3 uppercase">{tp.isim_orjinal || tp.isim || 'Ürün'}</div>
                        <div className="text-[0.7rem] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">%{tp.satar_satmaz_skoru}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
