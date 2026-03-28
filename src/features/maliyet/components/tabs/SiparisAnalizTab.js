import { Calculator, Package } from 'lucide-react';

export default function SiparisAnalizTab({ siparisFistiklari, MALIYET_TIPLERI, MALIYET_RENK, MALIYET_LABEL, maliyetler }) {
    return (
        <div className="animate-fade-in">
            <div className="bg-sky-950/20 border-2 border-sky-900/50 rounded-xl p-4 mb-5 text-[0.82rem] text-sky-400 font-bold flex items-center gap-3">
                <Calculator size={20} className="text-sky-500 shrink-0" />
                <span><strong className="text-sky-300">Birim Maliyet = Toplam Maliyet ÷ Üretim Adedi.</strong> Satış fiyatı için önce bu hesabın karargah tarafından tamamlanması mecburidir.</span>
            </div>

            {siparisFistiklari.length === 0 ? (
                <div className="text-center p-12 bg-[#0b1d1a] rounded-2xl border-2 border-dashed border-[#1e4a43]">
                    <Package size={48} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 font-black text-lg m-0">Henüz maliyet girilmiş sipariş bulunamadı.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {siparisFistiklari.map(o => (
                        <div key={o.id} className="bg-[#122b27] border-2 border-slate-700 rounded-[14px] overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-br from-slate-900 to-[#0b1d1a] px-5 py-3 flex justify-between items-center border-b border-slate-800">
                                <div>
                                    <div className="font-black text-white text-[0.95rem] tracking-wide">{o.b1_model_taslaklari?.model_kodu} — {o.b1_model_taslaklari?.model_adi}</div>
                                    <div className="text-[0.7rem] text-slate-400 font-bold mt-0.5">{o.adet} adet · {o.kalemSayisi} maliyet kalemi</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[0.65rem] text-slate-500 font-black tracking-widest mb-0.5 uppercase">BİRİM MALİYET</div>
                                    <div className="text-[1.4rem] font-black text-sky-400 leading-none">₺{o.birimMaliyet.toFixed(2)}</div>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                                    {MALIYET_TIPLERI.map(tip => {
                                        const tutarBu = maliyetler.filter(m => m.order_id === o.id && m.maliyet_tipi === tip).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
                                        if (tutarBu === 0) return null;

                                        const pct = o.sipToplam > 0 ? (tutarBu / o.sipToplam * 100).toFixed(1) : 0;
                                        const rnk = MALIYET_RENK[tip] || '#fff';

                                        return (
                                            <div key={tip} className="rounded-lg p-3 border" style={{ backgroundColor: rnk + '12', borderColor: rnk + '30' }}>
                                                <div className="text-[0.65rem] font-black tracking-widest uppercase mb-1" style={{ color: rnk }}>{MALIYET_LABEL[tip]}</div>
                                                <div className="font-black text-white text-[0.88rem]">₺{tutarBu.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                                                <div className="text-[0.65rem] text-slate-400 font-bold mt-0.5">% {pct}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-between items-end border-t-2 border-[#1e4a43] pt-4 flex-wrap gap-4 bg-[#0b1d1a] -mx-5 -mb-5 px-5 pb-5">
                                    <div>
                                        <span className="text-[0.7rem] text-emerald-400 font-black tracking-widest uppercase block mb-1">TOPLAM MALİYET</span>
                                        <strong className="text-white text-lg">₺{o.sipToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div>
                                        <span className="text-[0.7rem] text-emerald-400 font-black tracking-widest uppercase block mb-1">ÜRETİM ADEDİ</span>
                                        <strong className="text-white text-lg">{o.adet} adet</strong>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[0.7rem] text-sky-400 font-black tracking-widest uppercase block mb-1">DÜNYAK İLK BİRİM MALİYET</span>
                                        <strong className="text-sky-400 text-xl tracking-tight">₺{o.birimMaliyet.toFixed(2)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
