import { DollarSign, BarChart2, Edit2, Trash2 } from 'lucide-react';

export default function MaliyetGirisTab({
    filtreTip, setFiltreTip, MALIYET_TIPLERI, MALIYET_LABEL,
    filtreOrder, setFiltreOrder, orderler,
    aramaMetni, setAramaMetni, filtreli,
    maliyetSayfa, setMaliyetSayfa, MALIYET_RENK,
    duzenle, onayla, sil, islemdeId
}) {
    return (
        <div className="animate-fade-in">
            {/* Filtreler */}
            <div className="flex flex-wrap items-center gap-3 mb-6 bg-[#122b27] p-3 rounded-xl border border-[#1e4a43]">
                <select
                    value={filtreTip}
                    onChange={e => setFiltreTip(e.target.value)}
                    className="bg-[#0b1d1a] border-2 border-slate-700 text-white font-bold py-2 px-3 rounded-lg text-sm cursor-pointer outline-none focus:border-emerald-500"
                >
                    <option value="hepsi">Tüm Tipler</option>
                    {MALIYET_TIPLERI.map(t => <option key={t} value={t}>{MALIYET_LABEL[t]}</option>)}
                </select>

                <select
                    value={filtreOrder}
                    onChange={e => setFiltreOrder(e.target.value)}
                    className="bg-[#0b1d1a] border-2 border-slate-700 text-white font-bold py-2 px-3 rounded-lg text-sm cursor-pointer outline-none focus:border-emerald-500"
                >
                    <option value="hepsi">Tüm Siparişler</option>
                    {orderler.map(o => <option key={o.id} value={o.id}>{o.b1_model_taslaklari?.model_kodu || o.id.slice(0, 8)}</option>)}
                </select>

                <div className="relative flex-1 min-w-[150px] max-w-[250px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                    <input
                        value={aramaMetni}
                        onChange={e => setAramaMetni(e.target.value)}
                        placeholder="Açıklama ara..."
                        className="w-full bg-[#0b1d1a] border-2 border-slate-700 text-white font-bold py-2 pl-9 pr-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                    />
                </div>

                <div className="ml-auto text-sm font-black text-emerald-300 flex items-center gap-2 bg-[#0b1d1a] p-2 px-4 rounded-lg border border-[#1e4a43]">
                    <BarChart2 size={16} /> {filtreli.length} kayıt | <span className="text-white">₺{filtreli.reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>

            {/* Liste */}
            <div className="flex flex-col gap-3">
                {filtreli.length === 0 && (
                    <div className="text-center p-12 bg-[#0b1d1a] rounded-2xl border-2 border-dashed border-[#1e4a43]">
                        <DollarSign size={48} className="text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400 font-black text-lg m-0">Maliyet kaydı yok.</p>
                        <p className="text-slate-500 text-xs font-bold mt-1">Sağ üstteki "Maliyet Ekle" butonuna tıklayarak yeni kayıt oluşturun.</p>
                    </div>
                )}

                {filtreli.slice(0, maliyetSayfa).map(m => {
                    const onaylandi = m.onay_durumu === 'onaylandi';
                    const siparis = orderler.find(o => o.id === m.order_id);
                    const tipRenk = MALIYET_RENK[m.maliyet_tipi] || '#94a3b8';

                    return (
                        <div key={m.id} className={`bg-[#0d1117] border-2 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-all hover:-translate-y-0.5 shadow-sm ${onaylandi ? 'border-emerald-900/40' : 'border-[#1e4a43]'}`}>
                            <div className="w-2 h-12 rounded bg-slate-700 hidden sm:block" style={{ backgroundColor: tipRenk }}></div>

                            <div className="flex-1">
                                <div className="flex flex-wrap gap-2 items-center mb-1.5">
                                    <span className="text-[0.65rem] font-black uppercase px-2 py-0.5 rounded border" style={{ color: tipRenk, borderColor: tipRenk + '40', backgroundColor: tipRenk + '15' }}>
                                        {MALIYET_LABEL[m.maliyet_tipi]}
                                    </span>
                                    {siparis && <span className="text-[0.65rem] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-bold">{siparis.b1_model_taslaklari?.model_kodu}</span>}
                                </div>
                                <div className="font-black text-white text-sm md:text-base">{m.kalem_aciklama}</div>
                                <div className="text-[0.68rem] text-slate-500 font-bold mt-1 tracking-wider">
                                    {onaylandi ? <span className="text-emerald-500">✅ Onaylandı</span> : <span className="text-amber-500">⏳ Onay Bekliyor</span>} · {new Date(m.created_at).toLocaleDateString('tr-TR')}
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t sm:border-t-0 border-[#1e4a43] pt-3 sm:pt-0">
                                <div className="font-black text-emerald-400 text-lg md:text-xl">
                                    ₺{parseFloat(m.tutar_tl).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => duzenle(m)} className="bg-sky-950/40 border border-sky-900 text-sky-400 hover:bg-sky-900 hover:text-white px-2.5 py-1.5 rounded-lg font-black text-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                                        <Edit2 size={12} /> Düz.
                                    </button>
                                    {!onaylandi && (
                                        <button disabled={islemdeId === m.id} onClick={() => onayla(m.id)} className={`bg-emerald-950/40 border border-emerald-900 text-emerald-500 hover:bg-emerald-900 hover:text-white px-2.5 py-1.5 rounded-lg font-black text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${islemdeId === m.id ? 'opacity-50' : ''}`}>
                                            ✅ Onay
                                        </button>
                                    )}
                                    <button disabled={islemdeId === m.id} onClick={() => sil(m.id)} className={`bg-rose-950/40 border border-rose-900 text-rose-500 hover:bg-rose-900 hover:text-white px-2.5 py-1.5 rounded-lg font-black text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${islemdeId === m.id ? 'opacity-50' : ''}`}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PAGINATION */}
            {filtreli.length > maliyetSayfa && (
                <div className="text-center mt-6">
                    <button
                        onClick={() => setMaliyetSayfa(p => p + 50)}
                        className="bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-600 px-6 py-2.5 rounded-xl font-black text-xs cursor-pointer transition-colors shadow-sm"
                    >
                        ⬇ Daha Fazla Göster ({filtreli.length - maliyetSayfa} Kaldı)
                    </button>
                </div>
            )}
        </div>
    );
}
