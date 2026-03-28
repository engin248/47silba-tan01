import { Image as ImageIcon } from 'lucide-react';

export default function KatalogFormDrawer({
    formAcik,
    setFormAcik,
    form,
    setForm,
    BOSH_URUN,
    duzenleId,
    setDuzenleId,
    kaydet,
    loading,
    DURUMLAR,
    KATEGORILER,
    KAT_LABEL,
    ANA_KATEGORILER,
    ALT_KATEGORILER
}) {
    if (!formAcik) return null;

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #1e4a43', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 5, textTransform: 'uppercase' };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 transition-opacity backdrop-blur-sm">
            <div className="w-full sm:w-[550px] bg-[#0d1117] h-full shadow-2xl border-l-2 border-[#1e4a43] flex flex-col transform transition-transform animate-slide-in">
                <div className="flex justify-between items-center p-6 border-b border-[#1e4a43] bg-[#122b27]">
                    <h3 className="font-black text-xl text-emerald-400 flex items-center gap-2">
                        {duzenleId ? '✏️ Ürün Düzenle' : '✨ Yeni Katalog Ürünü'}
                    </h3>
                    <button onClick={() => { setForm(BOSH_URUN); setFormAcik(false); setDuzenleId(null); }} className="bg-transparent border-0 text-3xl cursor-pointer text-emerald-200 hover:text-white transition-colors">×</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
                    {/* Temel Bilgiler */}
                    <div className="bg-[#122b27] p-4 rounded-xl border border-[#1e4a43]">
                        <h4 className="text-emerald-500 font-black text-xs uppercase mb-3 border-b border-[#1e4a43] pb-2">Temel Kart Bilgileri</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label style={lbl}>Ürün Kodu *</label>
                                <input maxLength={50} value={form.urun_kodu} onChange={e => setForm({ ...form, urun_kodu: e.target.value.toUpperCase() })} placeholder="SR-001" className="bg-[#0b1d1a] border-2 border-slate-700 text-emerald-400 uppercase font-black" style={inp} />
                            </div>
                            <div>
                                <label style={lbl}>Durum</label>
                                <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })} className="bg-[#122b27] text-white border-2 border-[#1e4a43] font-bold" style={inp}>
                                    {DURUMLAR.map(d => <option key={d} value={d}>{d.toUpperCase().replace('_', ' ')}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label style={lbl}>Ürün Adı (TR) *</label>
                                <input maxLength={200} value={form.urun_adi} onChange={e => setForm({ ...form, urun_adi: e.target.value })} className="bg-[#122b27] text-white font-bold" style={inp} />
                            </div>
                            <div className="col-span-2">
                                <label style={lbl}>Ürün Adı (AR)</label>
                                <input maxLength={200} value={form.urun_adi_ar} onChange={e => setForm({ ...form, urun_adi_ar: e.target.value })} dir="rtl" className="bg-[#122b27] text-emerald-200 font-bold" style={inp} />
                            </div>
                        </div>
                    </div>

                    {/* Finans */}
                    <div className="bg-[#1e1423] p-4 rounded-xl border border-fuchsia-900/40">
                        <h4 className="text-fuchsia-500 font-black text-xs uppercase mb-3 border-b border-fuchsia-900/30 pb-2">Finans & Fiyatlama</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label style={lbl}>Satış Fiyatı (TL) *</label>
                                <input type="number" min="0" step="0.01" value={form.satis_fiyati_tl} onChange={e => setForm({ ...form, satis_fiyati_tl: e.target.value })} className="bg-[#1c0f1e] text-fuchsia-400 font-black" style={inp} />
                            </div>
                            <div>
                                <label style={lbl}>Birim Maliyet (TL)</label>
                                <input type="number" min="0" step="0.01" value={form.birim_maliyet_tl} onChange={e => setForm({ ...form, birim_maliyet_tl: e.target.value })} className="bg-[#122b27] text-slate-400 font-bold opacity-70 cursor-not-allowed" style={inp} disabled placeholder="Maliyet'ten (M13) gelir" title="Muhasebe Modülünden otonom beslenir" />
                            </div>
                        </div>
                    </div>

                    {/* Kategori */}
                    <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700">
                        <h4 className="text-slate-400 font-black text-xs uppercase mb-3 border-b border-slate-700 pb-2">Kategori (KAT-03)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label style={lbl}>Üst Kategori</label>
                                <select value={form.kategori_ust} onChange={e => setForm({ ...form, kategori_ust: e.target.value, kategori_alt: '' })} className="bg-[#0f172a] text-white font-bold" style={inp}>
                                    <option value="">Seçiniz</option>
                                    {ANA_KATEGORILER.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={lbl}>Alt Kategori</label>
                                <select value={form.kategori_alt} onChange={e => setForm({ ...form, kategori_alt: e.target.value })} className="bg-[#0f172a] text-white font-bold" style={inp} disabled={!form.kategori_ust}>
                                    <option value="">Seçiniz</option>
                                    {form.kategori_ust && ALT_KATEGORILER[form.kategori_ust]?.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Medya */}
                    <div className="bg-sky-950/20 p-4 rounded-xl border border-sky-900/30">
                        <h4 className="text-sky-400 font-black text-xs uppercase mb-3 border-b border-sky-900/30 pb-2 flex justify-between items-center">
                            Görseller
                            <button className="bg-sky-900 text-sky-200 text-[10px] px-2 py-1 rounded cursor-not-allowed opacity-50 border-0" title="Sunucu Yüklemesi Yakında">Upload 🔒</button>
                        </h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <div className="w-10 h-10 bg-black rounded flex items-center justify-center shrink-0 border border-slate-800">
                                    {form.fotograf_url ? <img src={form.fotograf_url} className="w-full h-full object-cover rounded" /> : <ImageIcon size={16} className="text-slate-600" />}
                                </div>
                                <input value={form.fotograf_url} onChange={e => setForm({ ...form, fotograf_url: e.target.value })} placeholder="Kapak Görsel URL (Örn: https://...)" className="flex-1 bg-black text-slate-300 font-mono text-xs" style={inp} />
                            </div>
                            <div className="flex gap-2">
                                <div className="w-10 h-10 bg-black rounded flex items-center justify-center shrink-0 border border-slate-800">
                                    {form.fotograf_url2 ? <img src={form.fotograf_url2} className="w-full h-full object-cover rounded" /> : <span className="text-slate-600 font-black text-xs">2</span>}
                                </div>
                                <input value={form.fotograf_url2} onChange={e => setForm({ ...form, fotograf_url2: e.target.value })} placeholder="Detay Görsel URL 2" className="flex-1 bg-black text-slate-300 font-mono text-xs" style={inp} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-[#1e4a43] bg-[#0b1d1a] flex gap-3 shadow-2xl z-10">
                    <button onClick={() => { setForm(BOSH_URUN); setFormAcik(false); setDuzenleId(null); }} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-sm rounded-xl cursor-pointer border-2 border-slate-600 transition-colors">Vazgeç</button>
                    <button onClick={kaydet} disabled={loading} className={`flex-2 px-4 py-3 text-white font-black text-sm rounded-xl cursor-pointer border-0 shadow-lg border-b-4 transition-all ${loading ? 'bg-slate-500 border-slate-600' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-800'}`}>
                        {loading ? 'KAYDEDİLİYOR...' : (duzenleId ? '💾 BİLGİLERİ GÜNCELLE' : '✅ ÜRÜNÜ OLUŞTUR')}
                    </button>
                </div>
            </div>
        </div>
    );
}
