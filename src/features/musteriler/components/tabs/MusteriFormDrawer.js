import { MUSTERI_TIPLERI, TIP_LABEL, TIP_RENK } from '../MusterilerMainContainer';

export default function MusteriFormDrawer({
    formAcik,
    form,
    setForm,
    BOSH_FORM,
    duzenleId,
    setDuzenleId,
    setFormAcik,
    kaydet,
    loading
}) {
    if (!formAcik) return null;

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #1e4a43', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 5, textTransform: 'uppercase' };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 transition-opacity cursor-pointer" onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }}></div>
            <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-[#0d1117] z-50 flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.5)] border-l border-[#1e4a43] transition-transform translate-x-0">
                <div className="flex justify-between items-center p-6 border-b border-[#1e4a43] bg-[#122b27]">
                    <h3 className="font-black text-xl m-0 text-emerald-400">
                        {duzenleId ? '✏️ Müşteri Profili Düzenle' : '👤 Yeni Müşteri Ekle'}
                    </h3>
                    <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }} className="bg-transparent border-0 text-3xl cursor-pointer text-emerald-200 hover:text-white transition-colors">×</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
                    <div>
                        <label style={lbl}>Müşteri Kodu *</label>
                        <input maxLength={30} value={form.musteri_kodu} onChange={e => setForm({ ...form, musteri_kodu: e.target.value.toUpperCase() })} placeholder="MST-001"
                            className="w-full px-3 py-2 bg-[#0b1d1a] border-2 border-slate-700 rounded-lg text-white font-black outline-none focus:border-emerald-500 uppercase transition-colors" />
                    </div>
                    <div>
                        <label style={lbl}>Ad Soyad (TR) *</label>
                        <input maxLength={200} value={form.ad_soyad} onChange={e => setForm({ ...form, ad_soyad: e.target.value })}
                            className="w-full px-3 py-2 bg-[#122b27] border-2 border-[#1e4a43] rounded-lg text-white font-bold outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div>
                        <label style={lbl}>الاسم (AR)</label>
                        <input maxLength={200} value={form.ad_soyad_ar} onChange={e => setForm({ ...form, ad_soyad_ar: e.target.value })} placeholder="الاسم الكامل"
                            className="w-full px-3 py-2 bg-[#122b27] border-2 border-[#1e4a43] rounded-lg text-white font-bold outline-none focus:border-emerald-500 transition-colors" dir="rtl" />
                    </div>
                    <div>
                        <label style={lbl}>Müşteri Tipi</label>
                        <select value={form.musteri_tipi} onChange={e => setForm({ ...form, musteri_tipi: e.target.value })}
                            style={{ color: TIP_RENK[form.musteri_tipi] || 'white' }}
                            className="w-full px-3 py-2 bg-[#122b27] border-2 border-[#1e4a43] rounded-lg font-black outline-none focus:border-emerald-500 cursor-pointer transition-colors">
                            {MUSTERI_TIPLERI.map(t => <option key={t} value={t} style={{ color: 'white' }}>{TIP_LABEL[t]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Telefon</label>
                        <input maxLength={20} value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} placeholder="+90 555 000 0000"
                            className="w-full px-3 py-2 bg-[#122b27] border-2 border-[#1e4a43] rounded-lg text-white font-bold outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div>
                        <label style={lbl}>E-posta</label>
                        <input type="email" maxLength={100} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="musteri@firma.com"
                            className="w-full px-3 py-2 bg-[#122b27] border-2 border-[#1e4a43] rounded-lg text-white font-bold outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div>
                        <label style={lbl}>Vergi No</label>
                        <input maxLength={50} value={form.vergi_no} onChange={e => setForm({ ...form, vergi_no: e.target.value })}
                            className="w-full px-3 py-2 bg-[#122b27] border-2 border-[#1e4a43] rounded-lg text-white font-bold outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div>
                        <label style={lbl}>Risk Limiti (₺)</label>
                        <input type="number" min="0" step="0.01" value={form.risk_limiti} onChange={e => setForm({ ...form, risk_limiti: e.target.value })} placeholder="0.00"
                            className="w-full px-3 py-2 bg-[#122b27] border-2 border-[#1e4a43] rounded-lg text-amber-400 font-black outline-none focus:border-amber-500 transition-colors" />
                    </div>
                    <div>
                        <label style={lbl}>Adres</label>
                        <textarea maxLength={500} rows={3} value={form.adres} onChange={e => setForm({ ...form, adres: e.target.value })}
                            className="w-full px-3 py-2 bg-[#122b27] border-2 border-[#1e4a43] rounded-lg text-white font-bold outline-none focus:border-emerald-500 resize-y transition-colors" />
                    </div>
                    <div className="flex gap-4 mt-2">
                        <label className={`flex flex-1 items-center gap-2 cursor-pointer font-bold text-sm p-3 rounded-xl border-2 transition-all ${form.kara_liste ? 'bg-red-950 border-red-900 text-red-500' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                            <input type="checkbox" checked={form.kara_liste} onChange={e => setForm({ ...form, kara_liste: e.target.checked })} className="w-4 h-4 accent-red-500" />
                            🚫 Kara Listeye Al
                        </label>
                    </div>
                </div>
                <div className="p-6 border-t border-[#1e4a43] bg-[#0d1117] flex gap-3">
                    <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }} className="flex-1 p-3 border-2 border-slate-700 bg-slate-800 rounded-xl font-black cursor-pointer text-slate-300 hover:bg-slate-700 transition-colors">İptal</button>
                    <button onClick={kaydet} disabled={loading} className={`flex-[2] p-3 text-white border-0 rounded-xl font-black cursor-pointer shadow-lg transition-all ${loading ? 'bg-slate-500' : (duzenleId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700')}`}>
                        {loading ? '...' : (duzenleId ? '✏️ Değişiklikleri Kaydet' : '✅ Müşteriyi Oluştur')}
                    </button>
                </div>
            </div>
        </>
    );
}
