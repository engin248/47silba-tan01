import { Scale, Scissors } from 'lucide-react';

export default function KumasFizibiliteModal({
    seciliTalep, setFizibiliteModalAcik,
    maliyetForm, setMaliyetForm,
    toplamMaliyet, karMarjiTutar, karMarjiYuzde, karlilikUygun, m3eAktar
}) {
    if (!seciliTalep) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0d1117] border border-emerald-500/30 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden">
                <div className="bg-[#161b22] p-5 border-b border-[#30363d] flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <Scale size={18} /> M2 FİZİBİLİTE KONTROLÜ
                        </h2>
                        <p className="text-xs text-[#8b949e] mt-1 font-semibold">Tedarikçi/Kartela Kumaşıyla Kârlılık Testi</p>
                    </div>
                    <button onClick={() => setFizibiliteModalAcik(false)} className="text-[#8b949e] hover:text-white">✕</button>
                </div>

                <div className="p-6">
                    <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-xl mb-6 flex justify-between items-center">
                        <div>
                            <div className="text-sm text-[#8b949e] font-bold uppercase mb-1">AR-GE'NİN BULDUĞU HEDEF (BİNGO)</div>
                            <div className="text-sm font-black text-white">{seciliTalep.baslik}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-amber-500 font-bold uppercase mb-1">Rakip Pazar Satış Fiyatı</div>
                            <input
                                type="number"
                                value={maliyetForm.rakipSatis}
                                onChange={e => setMaliyetForm({ ...maliyetForm, rakipSatis: e.target.value })}
                                className="bg-[#0b121a] text-amber-400 font-mono text-right border border-amber-500/30 rounded px-2 py-1 w-24 text-sm outline-none focus:border-amber-500"
                            /> ₺
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[#8b949e] uppercase mb-1">Bulunan Kartela Metre Fiyatı (₺)</label>
                                <input type="number" placeholder="Örn: 85" value={maliyetForm.kumasFiyat} onChange={e => setMaliyetForm({ ...maliyetForm, kumasFiyat: e.target.value })} className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#8b949e] uppercase mb-1">Takıma Kaç Metre Gider?</label>
                                <input type="number" placeholder="Örn: 2.5" value={maliyetForm.kumasMiktar} onChange={e => setMaliyetForm({ ...maliyetForm, kumasMiktar: e.target.value })} className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[#8b949e] uppercase mb-1">Toplam İşçilik/Aksesuar (₺)</label>
                                <input type="number" placeholder="Örn: 75" value={maliyetForm.iscilik} onChange={e => setMaliyetForm({ ...maliyetForm, iscilik: e.target.value })} className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
                            </div>

                            <div className={`p-4 rounded-xl border-2 flex flex-col justify-center items-center h-[66px] transition-colors ${toplamMaliyet > 0 ? (karlilikUygun ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-rose-500/10 border-rose-500/50') : 'bg-[#161b22] border-[#30363d]'}`}>
                                <div className="text-sm font-bold uppercase tracking-widest text-[#8b949e] mb-1">BİZİM MALİYETİMİZ</div>
                                <div className="text-xl font-black font-mono text-white">₺ {toplamMaliyet.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {toplamMaliyet > 0 && (
                        <div className={`p-5 rounded-xl border flex justify-between items-center mb-6 transition-all ${karlilikUygun ? 'bg-emerald-950/20 border-emerald-500' : 'bg-rose-950/20 border-rose-500'}`}>
                            <div>
                                <div className={`text-xs font-bold uppercase tracking-widest ${karlilikUygun ? 'text-emerald-400' : 'text-rose-400'}`}>Tahmini Kâr Marjı</div>
                                <div className={`text-3xl font-black font-mono mt-1 ${karlilikUygun ? 'text-emerald-400' : 'text-rose-500'}`}>%{karMarjiYuzde}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-[#8b949e] uppercase font-bold">Adet Başı Net Kâr</div>
                                <div className={`text-xl font-black font-mono ${karlilikUygun ? 'text-white' : 'text-rose-400'}`}>₺ {karMarjiTutar.toFixed(2)}</div>
                                {karlilikUygun ? (
                                    <div className="text-sm text-emerald-400 font-bold uppercase mt-1">✓ Fizibilite Onaylandı</div>
                                ) : (
                                    <div className="text-sm text-rose-500 font-bold uppercase mt-1">⚠ Zarar Kes (Uzak Dur)</div>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        disabled={!karlilikUygun || toplamMaliyet === 0}
                        onClick={() => {
                            setFizibiliteModalAcik(false);
                            m3eAktar({ ...seciliTalep, maliyet: toplamMaliyet, kar_marji: karMarjiYuzde });
                        }}
                        className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${karlilikUygun && toplamMaliyet > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-[#21262d] text-[#64748b] cursor-not-allowed'}`}>
                        <Scissors size={18} />
                        {karlilikUygun && toplamMaliyet > 0 ? "BİNGO! ONAYLANDI -> M3 KALIPHANEYE GÖNDER" : "KÂRLILIK YETERSİZ (BEKLİYOR)"}
                    </button>
                </div>
            </div>
        </div>
    );
}
