import SilBastanModal from '@/components/ui/SilBastanModal';

export function SkuMatrisiModal({ skuAcik, setSkuAcik, seciliUrun, varyantStoklar, setVaryantStoklar, skuBedenler, setSkuBedenler, skuRenkler, setSkuRenkler, varyantKaydet }) {
    if (!seciliUrun) return null;

    const handleCellChange = (beden, renk, value) => {
        const key = `${beden}-${renk}`;
        const nv = parseInt(value, 10);
        setVaryantStoklar(prev => ({ ...prev, [key]: isNaN(nv) ? '' : nv }));
    };

    const handleBedenKaldir = (b) => setSkuBedenler(prev => prev.filter(x => x !== b));
    const handleRenkKaldir = (r) => setSkuRenkler(prev => prev.filter(x => x !== r));
    const handleBedenEkle = () => { const val = prompt('Yeni Beden (örn: XXL)?'); if (val && !skuBedenler.includes(val)) setSkuBedenler([...skuBedenler, val]); };
    const handleRenkEkle = () => { const val = prompt('Yeni Renk (örn: Kırmızı)?'); if (val && !skuRenkler.includes(val)) setSkuRenkler([...skuRenkler, val]); };

    return (
        <SilBastanModal acik={skuAcik} onClose={() => setSkuAcik(false)} title={`[KAT-04] SKU Matrisi: ${seciliUrun?.urun_kodu}`}>
            <div className="bg-[#122b27] p-6 rounded-2xl shadow-inner border border-[#1e4a43] overflow-x-auto custom-scrollbar">
                <div className="flex gap-4 mb-4 items-end">
                    <div className="flex-1 bg-sky-950/30 p-3 rounded-lg border border-sky-900/50">
                        <label className="text-[10px] font-black text-sky-400 uppercase mb-1 block">Beden Sütunları</label>
                        <div className="flex flex-wrap gap-1">
                            {skuBedenler.map(b => (
                                <span key={b} className="bg-sky-950 text-sky-200 text-xs px-2 py-1 rounded font-bold border border-sky-800 flex items-center gap-1">
                                    {b} <button onClick={() => handleBedenKaldir(b)} className="text-sky-500 hover:text-white bg-transparent border-0 cursor-pointer">×</button>
                                </span>
                            ))}
                            <button onClick={handleBedenEkle} className="bg-[#0b1d1a] border border-[#1e4a43] text-emerald-500 text-xs px-2 rounded cursor-pointer font-black hover:bg-[#122b27]">+</button>
                        </div>
                    </div>
                </div>

                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                        <tr>
                            <th className="p-3 border-b-2 border-[#1e4a43] text-emerald-500 font-black text-xs uppercase bg-[#0b1d1a]">RENKLER ↓ / BEDENLER →</th>
                            {skuBedenler.map(b => <th key={b} className="p-3 border-b-2 border-r border-[#1e4a43] text-center text-emerald-400 font-black text-xs uppercase bg-[#0d1117] w-20">{b}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {skuRenkler.map(r => (
                            <tr key={r} className="border-b border-[#1e4a43]/50 hover:bg-[#183631] transition-colors">
                                <td className="p-3 font-bold text-slate-300 text-sm bg-[#0d1117] border-r border-[#1e4a43] flex justify-between items-center group">
                                    {r}
                                    <button onClick={() => handleRenkKaldir(r)} className="text-red-900 border-0 bg-transparent text-lg font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                </td>
                                {skuBedenler.map(b => {
                                    const key = `${b}-${r}`;
                                    const val = varyantStoklar[key] !== undefined ? varyantStoklar[key] : '';
                                    return (
                                        <td key={b} className="p-1 border-r border-[#1e4a43]/50">
                                            <input type="number" value={val} onChange={e => handleCellChange(b, r, e.target.value)} min="0" placeholder="0" className="w-full h-10 bg-black text-center text-white font-mono font-bold rounded outline-none focus:border-emerald-500 border border-transparent focus:bg-[#0b1d1a] transition-all" />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        <tr>
                            <td className="p-2 border-r border-[#1e4a43]">
                                <button onClick={handleRenkEkle} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 rounded text-xs font-black cursor-pointer transition-colors">+ Satır Ekle</button>
                            </td>
                            <td colSpan={skuBedenler.length} className="bg-black/30"></td>
                        </tr>
                    </tbody>
                </table>
                <div className="mt-4 flex justify-between items-center">
                    <p className="text-xs text-slate-400 font-bold m-0"><span className="text-amber-500">Not:</span> Bu stoklar M11 (Depo) modülüne sanal bağlantılıdır.</p>
                    <button onClick={varyantKaydet} className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 px-6 py-2.5 rounded-xl font-black text-sm cursor-pointer shadow-[0_4px_15px_rgba(5,150,105,0.3)] transition-all">💾 MATRİSİ KAYDET</button>
                </div>
            </div>
        </SilBastanModal>
    );
}

export function FiyatGecmisiModal({ acik, setAcik, seciliUrun, fiyatGecmisi }) {
    if (!seciliUrun) return null;
    return (
        <SilBastanModal acik={acik} onClose={() => setAcik(false)} title={`[KAT-05] FIYAT/MALİYET RADARI: ${seciliUrun?.urun_kodu}`}>
            <div className="bg-[#122b27] p-2 rounded-2xl shadow-inner border border-[#1e4a43] min-h-[300px] overflow-auto">
                {fiyatGecmisi.length === 0 ? <p className="p-6 text-center text-slate-400 font-bold">Kayıt Yok</p> : (
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-[#0b1d1a] text-emerald-500 text-[10px] uppercase font-black uppercase sticky top-0 shadow">
                            <tr>
                                <th className="p-3 border-b border-[#1e4a43]">Tarih / Saat</th>
                                <th className="p-3 border-b border-[#1e4a43]">B. Maliyet</th>
                                <th className="p-3 border-b border-[#1e4a43]">Satış Fiyatı</th>
                                <th className="p-3 border-b border-[#1e4a43] text-right">Marj (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fiyatGecmisi.map((h, i) => {
                                const ms = new Date(h.updated_at).toLocaleString('tr-TR');
                                const mal = parseFloat(h.birim_maliyet_tl || 0);
                                const sat = parseFloat(h.satis_fiyati_tl || 0);
                                const marj = mal > 0 ? (((sat - mal) / mal) * 100).toFixed(1) : '100';
                                return (
                                    <tr key={i} className="border-b border-[#1e4a43]/30 hover:bg-[#183631] transition-colors">
                                        <td className="p-3 text-slate-300 font-bold">{ms}</td>
                                        <td className="p-3 text-slate-400 font-mono">₺{mal.toFixed(2)}</td>
                                        <td className="p-3 text-emerald-400 font-mono font-black">₺{sat.toFixed(2)}</td>
                                        <td className={`p-3 text-right font-black ${parseFloat(marj) > 50 ? 'text-fuchsia-500' : 'text-amber-500'}`}>%{marj}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </SilBastanModal>
    );
}
