import { X } from 'lucide-react';

export default function RaporDuzenleModal({ duzenleModal, setDuzenleModal, duzenleForm, setDuzenleForm, loading, duzenleKaydet }) {
    if (!duzenleModal) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fade-in">
            <div className="bg-[#122b27] rounded-[2rem] p-8 w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-[#1e4a43]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-white text-xl m-0 flex items-center gap-2">✏️ Rapor Düzenle</h3>
                    <button onClick={() => setDuzenleModal(null)} className="w-8 h-8 flex items-center justify-center bg-transparent border-0 hover:bg-slate-800 text-emerald-200 rounded-lg transition-colors cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-3 mb-6 text-sm font-black text-emerald-800 flex items-center flex-wrap gap-2 uppercase tracking-wide">
                    📁 {duzenleModal.model_kodu || duzenleModal.id?.slice(0, 8)}
                    {duzenleModal.zeyilname_modu && <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded ml-2 text-xs">M8 Zeyilname Ek Fatura</span>}
                </div>

                <div className="flex flex-col gap-5">
                    {!duzenleModal.zeyilname_modu ? (
                        <>
                            <div>
                                <label className="block text-sm font-black text-emerald-200 mb-2 uppercase tracking-widest">Zayiat Adet</label>
                                <input type="number" min="0" value={duzenleForm.zayiat_adet}
                                    onChange={e => setDuzenleForm({ ...duzenleForm, zayiat_adet: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0d1117] text-white border-2 border-[#1e4a43] rounded-xl font-bold outline-none focus:border-emerald-500 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-emerald-200 mb-2 uppercase tracking-widest">Bütçelenen Hedef Maliyet Kapasitesi</label>
                                <div className="relative">
                                    <input type="number" min="0" step="100" value={duzenleForm.hedeflenen_maliyet_tl}
                                        onChange={e => setDuzenleForm({ ...duzenleForm, hedeflenen_maliyet_tl: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-[#0d1117] text-white border-2 border-[#1e4a43] rounded-xl font-bold outline-none focus:border-emerald-500 transition-all" />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₺</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
                            <label className="block text-sm font-black text-amber-800 mb-2 uppercase tracking-widest">Ek Maliyet Farkı (Zeyilname)</label>
                            <div className="relative">
                                <input type="number" min="0" step="10" value={duzenleForm.ek_maliyet_tl}
                                    onChange={e => setDuzenleForm({ ...duzenleForm, ek_maliyet_tl: e.target.value })} placeholder="Fason fiyat farkı, kargo vb.."
                                    className="w-full pl-10 pr-4 py-3 bg-[#122b27] border-2 border-amber-300 rounded-xl font-black text-amber-900 outline-none focus:border-amber-500 transition-all placeholder:text-amber-300 placeholder:font-medium" />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-amber-600">₺</span>
                            </div>
                            <p className="text-sm font-bold text-amber-700/70 mt-3 leading-relaxed">Devri yapılmış ve kilidi açılmayan rapordaki maliyet sızıntısını legal şekilde ekler.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-black text-emerald-200 mb-2 uppercase tracking-widest">Notlar / Zayiat Nedeni / {duzenleModal.zeyilname_modu ? 'Fatura/İtiraz Özeti' : ''}</label>
                        <textarea rows={3} maxLength={300} value={duzenleForm.notlar}
                            onChange={e => setDuzenleForm({ ...duzenleForm, notlar: e.target.value })}
                            placeholder="İç not, açıklama..." className="w-full px-4 py-3 bg-[#0d1117] text-white border-2 border-[#1e4a43] rounded-xl font-bold outline-none focus:border-emerald-500 transition-all resize-y custom-scrollbar" />
                    </div>
                </div>

                <div className="flex gap-3 justify-end mt-8 border-t border-[#1e4a43] pt-6">
                    <button onClick={() => setDuzenleModal(null)} className="px-6 py-2.5 bg-slate-800 border-2 border-[#1e4a43] hover:bg-slate-700 text-emerald-300 rounded-xl font-black transition-all cursor-pointer">İptal</button>
                    <button onClick={duzenleKaydet} disabled={loading}
                        className={`px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 border-b-4 border-emerald-800 text-white rounded-xl font-black transition-all flex items-center gap-2 cursor-pointer ${loading ? 'opacity-70 cursor-wait' : ''}`}>
                        {loading ? '...' : '✅ Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
}
