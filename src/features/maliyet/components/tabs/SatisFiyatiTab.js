import { TrendingUp, Package } from 'lucide-react';

export default function SatisFiyatiTab({ siparisFistiklari, karMarji, setKarMarji }) {
    return (
        <div className="animate-fade-in">
            {/* Hedef Kar Ayarı */}
            <div className="bg-[#122b27] border-2 border-[#1e4a43] rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-5 border-b border-[#1e4a43] pb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center border border-emerald-900">
                        <TrendingUp size={18} className="text-emerald-400" />
                    </div>
                    <h3 className="m-0 font-black text-lg text-white uppercase tracking-widest">Hedef Kar Marjı</h3>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
                    <input
                        type="range" min="5" max="99" step="1" value={karMarji}
                        onChange={e => setKarMarji(parseInt(e.target.value))}
                        className="flex-1 w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: karMarji >= 50 ? '#10b981' : karMarji >= 25 ? '#f59e0b' : '#ef4444' }}
                    />

                    <div className="relative w-24 shrink-0">
                        <input
                            type="number" min="5" max="99" value={karMarji}
                            onChange={e => setKarMarji(Math.min(99, Math.max(5, parseInt(e.target.value) || 5)))}
                            className="w-full bg-[#0b1d1a] border-2 border-[#1e4a43] rounded-xl text-center font-black text-2xl text-emerald-400 py-2 pr-6 outline-none focus:border-emerald-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-slate-500 text-lg">%</span>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {[15, 20, 25, 30, 40, 50].map(v => (
                        <button
                            key={v}
                            onClick={() => setKarMarji(v)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-colors border-2 ${karMarji === v ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                        >
                            %{v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sipariş Kar Analizi */}
            {siparisFistiklari.length === 0 ? (
                <div className="text-center p-12 bg-[#0b1d1a] rounded-2xl border-2 border-dashed border-[#1e4a43]">
                    <Package size={48} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 font-black text-lg m-0">Önce maliyet kalemi giriniz.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {siparisFistiklari.map(o => {
                        const satisFiyati = o.birimMaliyet * (1 + karMarji / 100);
                        const brutKar = satisFiyati - o.birimMaliyet;
                        const toplamKar = brutKar * o.adet;

                        return (
                            <div key={o.id} className="bg-[#122b27] border-2 border-emerald-900/50 rounded-[14px] p-6 shadow-sm hover:border-emerald-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-6 flex-wrap gap-4 border-b border-[#1e4a43] pb-6">
                                    <div>
                                        <div className="font-black text-white text-lg">{o.b1_model_taslaklari?.model_kodu} — {o.b1_model_taslaklari?.model_adi}</div>
                                        <div className="text-sm font-bold text-emerald-200 mt-1">{o.adet} adet · Birim Maliyet: ₺{o.birimMaliyet.toFixed(2)}</div>
                                    </div>

                                    <div className="bg-emerald-950 border-2 border-emerald-800 rounded-xl px-4 py-2 text-center shadow-inner">
                                        <div className="text-[0.65rem] text-emerald-400 font-black tracking-widest uppercase mb-1">ÖNERİLEN SATIŞ FİYATI</div>
                                        <div className="text-2xl font-black text-emerald-500">₺{satisFiyati.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Birim Maliyet', val: `₺${o.birimMaliyet.toFixed(2)}`, color: 'text-white', bg: 'bg-slate-800/50 border-slate-700' },
                                        { label: `Birim Kar (%${karMarji})`, val: `₺${brutKar.toFixed(2)}`, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-900/50' },
                                        { label: 'Satış Fiyatı', val: `₺${satisFiyati.toFixed(2)}`, color: 'text-sky-400', bg: 'bg-sky-950/30 border-sky-900/50' },
                                        { label: `Toplam Kar (${o.adet} ad.)`, val: `₺${toplamKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, color: 'text-fuchsia-400', bg: 'bg-fuchsia-950/30 border-fuchsia-900/50' },
                                    ].map((k, i) => (
                                        <div key={i} className={`rounded-xl p-4 text-center border ${k.bg}`}>
                                            <div className="text-[0.65rem] text-slate-400 font-black uppercase tracking-wider mb-2">{k.label}</div>
                                            <div className={`font-black text-lg ${k.color}`}>{k.val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
