import { X } from 'lucide-react';

export default function MaliyetFormModal({
    formAcik, setFormAcik, form, setForm, BOSH_FORM,
    duzenleId, setDuzenleId, kaydet, loading,
    orderler, MALIYET_TIPLERI, MALIYET_LABEL,
    handleMiktarFiyatDegisim
}) {
    if (!formAcik) return null;

    const lbl = "block text-[0.7rem] font-bold text-slate-300 mb-2 uppercase";
    const inpBase = "w-full bg-[#0b1d1a] border-2 border-[#1e4a43] text-white font-bold py-2.5 px-3 rounded-xl outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600";

    return (
        <div className="bg-[#122b27] border-2 rounded-2xl p-6 mb-6 shadow-xl animate-fade-in relative overflow-hidden" style={{ borderColor: duzenleId ? '#f59e0b' : '#047857' }}>
            <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-[0.6rem] font-black uppercase tracking-widest text-white shadow-sm ${duzenleId ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                {duzenleId ? 'Güncelleme Modu' : 'Yeni Kayıt'}
            </div>

            <div className="flex justify-between items-center mb-6">
                <h3 className={`font-black m-0 text-lg flex items-center gap-2 ${duzenleId ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {duzenleId ? '✏️ Maliyet Düzenle' : '💰 Yeni Maliyet Kalemi'}
                </h3>
                <button
                    onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }}
                    className="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-white transition-colors p-1"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                    <label className={lbl}>Sipariş / Parti *</label>
                    <select
                        value={form.order_id}
                        onChange={e => setForm({ ...form, order_id: e.target.value })}
                        className={`${inpBase} cursor-pointer`}
                    >
                        <option value="">— Sipariş Seçiniz —</option>
                        {orderler.map(o => <option key={o.id} value={o.id}>{o.b1_model_taslaklari?.model_kodu || 'Sipariş'} | {o.quantity} adet</option>)}
                        {orderler.length === 0 && <option disabled>⚠ Sipariş bulunamadı</option>}
                    </select>
                </div>

                <div className="lg:col-span-2">
                    <label className={lbl}>Maliyet Tipi *</label>
                    <select
                        value={form.maliyet_tipi}
                        onChange={e => setForm({ ...form, maliyet_tipi: e.target.value })}
                        className={`${inpBase} cursor-pointer`}
                    >
                        {MALIYET_TIPLERI.map(t => <option key={t} value={t}>{MALIYET_LABEL[t]}</option>)}
                    </select>
                </div>

                <div className="md:col-span-2 lg:col-span-4">
                    <label className={lbl}>Kalem Açıklaması *</label>
                    <input
                        value={form.kalem_aciklama}
                        onChange={e => setForm({ ...form, kalem_aciklama: e.target.value })}
                        placeholder="Örn: Gömleklik poplin kumaş — 45m × 85 TL/m"
                        className={inpBase}
                    />
                </div>

                <div className="lg:col-span-2 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className={lbl}>Miktar (İsteğe Bağlı)</label>
                        <div className="flex gap-2">
                            <input
                                type="number" step="0.01" min="0"
                                value={form.miktar}
                                onChange={e => handleMiktarFiyatDegisim('miktar', e.target.value)}
                                placeholder="Örn: 45"
                                className={`${inpBase} w-3/5`}
                            />
                            <select
                                value={form.birim}
                                onChange={e => setForm({ ...form, birim: e.target.value })}
                                className={`${inpBase} w-2/5 cursor-pointer px-1`}
                            >
                                {['adet', 'metre', 'kg', 'saat', 'gün', 'paket'].map(b => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className={lbl}>Birim Fiyat (TL)</label>
                    <input
                        type="number" step="0.01" min="0"
                        value={form.birim_fiyat}
                        onChange={e => handleMiktarFiyatDegisim('birim_fiyat', e.target.value)}
                        placeholder="Örn: 85.00"
                        className={inpBase}
                    />
                </div>

                <div>
                    <label className={`${lbl} flex items-center`}>
                        Toplam Tutar (TL) *
                        {form.miktar && form.birim_fiyat && <span className="text-emerald-400 ml-2 animate-pulse font-black text-[0.6rem] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-900">OTOMATİK</span>}
                    </label>
                    <input
                        type="number" step="0.01" min="0.01"
                        value={form.tutar_tl}
                        onChange={e => setForm({ ...form, tutar_tl: e.target.value })}
                        placeholder="3825.00"
                        className={`${inpBase} font-black text-lg ${form.miktar && form.birim_fiyat ? 'text-emerald-400 border-emerald-500 bg-emerald-950/20' : ''}`}
                    />
                </div>
            </div>

            <div className="flex gap-3 mt-8 justify-end border-t border-[#1e4a43] pt-4">
                <button
                    onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border-2 border-slate-600 rounded-xl font-black text-sm cursor-pointer transition-colors"
                >
                    İPTAL ET
                </button>
                <button
                    onClick={kaydet}
                    disabled={loading}
                    className={`px-8 py-2.5 text-white border-0 rounded-xl font-black text-sm cursor-pointer border-b-4 transition-all ${loading ? 'bg-slate-500 border-slate-700 cursor-wait' : duzenleId ? 'bg-amber-600 hover:bg-amber-500 border-amber-800' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-800 shadow-[0_4px_15px_rgba(4,120,87,0.3)]'}`}
                >
                    {loading ? 'YÜKLENİYOR...' : duzenleId ? 'GÜNCELLE' : 'SİSTEME KAYDET'}
                </button>
            </div>
        </div>
    );
}
