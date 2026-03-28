export default function FaturaTab() {
    return (
        <div className="bg-[#122b27] p-6 rounded-2xl border border-[#1e4a43] shadow-xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-[#1e4a43] pb-4 mb-6">
                <div>
                    <h2 className="text-xl font-black text-white m-0 tracking-tight flex items-center gap-3">
                        📅 [MU-03] VERGİ & SGK TAKVİMİ
                    </h2>
                    <p className="text-emerald-400 font-bold mt-1 text-sm uppercase tracking-widest">Resmi Ödeme ve Beyanname Tarihleri</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0b1d1a] border border-[#1e4a43] p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <div className="text-white font-black text-sm uppercase">KDV Beyannamesi (1 Nolu)</div>
                        <div className="text-emerald-400 font-bold text-xs mt-1">Son Gün: Ayın 28. Günü</div>
                    </div>
                    <div className="text-amber-500 font-black px-3 py-1 bg-amber-500/10 rounded-lg text-xs uppercase border border-amber-500/20">Yaklaşıyor</div>
                </div>
                <div className="bg-[#0b1d1a] border border-[#1e4a43] p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <div className="text-white font-black text-sm uppercase">SGK Prim Ödemeleri</div>
                        <div className="text-emerald-400 font-bold text-xs mt-1">Son Gün: Sonraki Ayın Sonu</div>
                    </div>
                    <div className="text-emerald-500 font-black px-3 py-1 bg-emerald-500/10 rounded-lg text-xs uppercase border border-emerald-500/20">Güvenli</div>
                </div>
                <div className="bg-[#0b1d1a] border border-red-900/50 p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <div className="text-red-400 font-black text-sm uppercase">Muhtasar Beyanname</div>
                        <div className="text-red-300 font-bold text-xs mt-1">Son Gün: Ayın 26. Günü</div>
                    </div>
                    <div className="text-red-500 font-black px-3 py-1 bg-red-500/10 rounded-lg text-xs uppercase border border-red-500/20">Gecikti!</div>
                </div>
            </div>
        </div>
    );
}
