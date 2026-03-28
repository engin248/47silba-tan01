export default function UretimBekleyenRaporlar({ raporsizemOrders, loading, uretimdenRaporOlustur }) {
    if (raporsizemOrders.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-amber-900/20 to-[#122b27] border-2 border-amber-900/50 rounded-2xl p-5 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl animate-pulse">⚡</span>
                <span className="font-black text-amber-500 text-sm uppercase tracking-wider">
                    {raporsizemOrders.length} Tamamlanmış Üretim — Muhasebe Raporu Bekliyor!
                </span>
            </div>
            <div className="flex flex-col gap-2">
                {raporsizemOrders.map(o => (
                    <div key={o.id} className="flex justify-between items-center bg-[#0b1d1a] rounded-xl p-3 border border-[#1e4a43] shadow-sm hover:border-amber-900/50 transition-colors">
                        <div>
                            <span className="text-[0.65rem] font-black bg-amber-950 text-amber-500 border border-amber-900 px-2 py-1 rounded inline-block mr-2 uppercase">{o.model_kodu}</span>
                            <span className="font-bold text-white text-sm uppercase">{o.model_adi || 'Model'}</span>
                            <span className="text-xs font-bold text-slate-500 ml-2">{o.hedef_adet} adet</span>
                        </div>
                        <button onClick={() => uretimdenRaporOlustur(o)} disabled={loading}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 border-b-4 border-amber-800 text-white rounded-xl font-black text-xs uppercase cursor-pointer transition-all whitespace-nowrap disabled:opacity-50">
                            📋 Rapor Oluştur
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
