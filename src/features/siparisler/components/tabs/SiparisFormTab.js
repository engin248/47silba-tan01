import { Plus, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const KANALLAR = ['trendyol', 'amazon', 'magaza', 'toptan', 'diger'];
const PARA_BIRIMLERI = [
    { kod: 'TL', simge: '₺', bayrak: '🇹🇷' },
    { kod: 'USD', simge: '$', bayrak: '🇺🇸' },
    { kod: 'EUR', simge: '€', bayrak: '🇪🇺' },
];

export default function SiparisFormTab({ form, setForm, kalemler, setKalemler, urunler, musteriler, BOSH_FORM, kaydet, loading, setFormAcik, goster }) {
    const [barkodOkuyucu, setBarkodOkuyucu] = useState('');

    const kalemEkle = () => setKalemler(prev => [...prev, { urun_id: '', beden: '', renk: '', adet: 1, birim_fiyat_tl: 0, iskonto_pct: 0, kalem_notu: '' }]);
    const kalemSil = (i) => setKalemler(prev => prev.filter((_, idx) => idx !== i));
    const kalemGuncelle = (i, alan, val) => {
        const yeni = [...kalemler];
        yeni[i] = { ...yeni[i], [alan]: val };
        if (alan === 'urun_id') {
            const urun = urunler.find(u => u.id === val);
            if (urun) yeni[i].birim_fiyat_tl = parseFloat(urun.satis_fiyati_tl);
        }
        setKalemler(yeni);
    };

    const handleBarkodOkutma = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (barkodOkuyucu.trim() === '') return;
            const b = barkodOkuyucu.trim().toLowerCase();
            const urun = urunler.find(u => (u.urun_kodu && u.urun_kodu.toLowerCase() === b) || (u.barkod && u.barkod === b) || (u.id === b));
            if (urun) {
                setKalemler([...kalemler, { urun_id: urun.id, beden: '', renk: '', adet: 1, birim_fiyat_tl: urun.satis_fiyati_tl, iskonto_pct: 0, kalem_notu: '' }]);
                goster(`Okundu: ${urun.urun_kodu}`, 'success');
            } else {
                goster(`⚠️ Barkod bulunamadı: ${barkodOkuyucu}`, 'error');
            }
            setBarkodOkuyucu('');
        }
    };

    const toplamHesapla = () => kalemler.reduce((s, k) => s + (parseInt(k.adet) || 0) * parseFloat(k.birim_fiyat_tl || 0) * (1 - (parseFloat(k.iskonto_pct) || 0) / 100), 0);

    return (
        <div className="bg-[#122b27] border-2 border-emerald-600 rounded-2xl p-6 mb-6 shadow-[0_8px_32px_rgba(4,120,87,0.08)] animate-fade-in">
            <h3 className="font-black text-emerald-800 mb-5 text-lg">✨ Yeni Sipariş Oluştur</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-black text-emerald-200 mb-1.5 uppercase tracking-widest">Sipariş No *</label>
                    <input maxLength={50} value={form.siparis_no} onChange={e => setForm({ ...form, siparis_no: e.target.value })} className="w-full px-3 py-2.5 bg-[#0d1117] text-white border-2 border-[#1e4a43] rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-black text-emerald-200 mb-1.5 uppercase tracking-widest">Müşteri</label>
                    <select value={form.musteri_id} onChange={e => setForm({ ...form, musteri_id: e.target.value })} className="w-full px-3 py-2.5 bg-[#122b27] text-white border-2 border-[#1e4a43] rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm cursor-pointer">
                        <option value="">— Perakende / Anonim —</option>
                        {musteriler.map(m => <option key={m.id} value={m.id}>{m.musteri_kodu} | {m.ad_soyad}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-black text-emerald-200 mb-1.5 uppercase tracking-widest">Kanal *</label>
                    <select value={form.kanal} onChange={e => setForm({ ...form, kanal: e.target.value })} className="w-full px-3 py-2.5 bg-[#122b27] text-white border-2 border-[#1e4a43] rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm cursor-pointer">
                        {KANALLAR.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-black text-emerald-700 mb-1.5 uppercase tracking-widest">Ödeme Yöntemi</label>
                    <select value={form.odeme_yontemi} onChange={e => setForm({ ...form, odeme_yontemi: e.target.value })} className="w-full px-3 py-2.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl font-bold text-emerald-900 outline-none focus:border-emerald-500 transition-all text-sm cursor-pointer">
                        <option value="nakit">💵 Nakit / Peşin</option>
                        <option value="kredi_karti">💳 Kredi Kartı</option>
                        <option value="eft">🏦 EFT / Havale</option>
                        <option value="cek">📜 Çek / Evrak</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-black text-emerald-200 mb-1.5 uppercase tracking-widest">Para Birimi</label>
                    <select value={form.para_birimi} onChange={e => setForm({ ...form, para_birimi: e.target.value })} className="w-full px-3 py-2.5 bg-[#122b27] text-white border-2 border-[#1e4a43] rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm cursor-pointer">
                        {PARA_BIRIMLERI.map(p => <option key={p.kod} value={p.kod}>{p.bayrak} {p.kod} ({p.simge})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-black text-red-600 mb-1.5 uppercase tracking-widest">📅 Termin Tarihi *</label>
                    <input type='date' value={form.termin_tarihi || ''} onChange={e => setForm({ ...form, termin_tarihi: e.target.value })} min={new Date().toISOString().slice(0, 10)}
                        className={`w-full px-3 py-2.5 bg-[#122b27] text-white border-2 rounded-xl font-bold outline-none transition-all text-sm ${form.termin_tarihi ? 'border-emerald-500' : 'border-red-400'}`} />
                </div>
                <div className="flex items-end lg:col-span-2">
                    <Link href='/katalog' target='_blank' className="w-full no-underline">
                        <button type='button' className="w-full h-[45px] bg-gradient-to-r from-emerald-700 to-emerald-800 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:from-emerald-800 transition-colors shadow-md cursor-pointer">
                            📋 Katalog'dan Ürün Seç (M10)
                        </button>
                    </Link>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-black text-emerald-200 mb-1.5 uppercase tracking-widest">Notlar</label>
                    <textarea maxLength={300} rows={1} value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#0d1117] text-white border-2 border-[#1e4a43] rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm resize-none custom-scrollbar" />
                </div>
                <div className="md:col-span-1 lg:col-span-1 flex items-end">
                    <label className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 cursor-pointer transition-all ${form.acil ? 'bg-red-50 border-red-500 text-red-700' : 'bg-[#0d1117] text-white border-[#1e4a43] text-emerald-200 hover:bg-slate-100'}`}>
                        <input type="checkbox" checked={form.acil} onChange={e => setForm({ ...form, acil: e.target.checked })} className="w-4 h-4 cursor-pointer accent-red-600" />
                        <span className="text-sm font-black tracking-wide">🚨 ACİL </span>
                    </label>
                </div>
            </div>

            <div className="bg-[#0d1117] text-white p-4 rounded-xl border-2 border-[#1e4a43] mb-6 relative overflow-hidden">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-3 border-b-2 border-slate-700 pb-3">
                    <label className="font-black text-slate-300 text-sm m-0 uppercase flex items-center gap-2"><ShoppingCart size={16} className="text-emerald-500" /> Ürün Kalemleri *</label>
                    <div className="flex flex-1 max-w-[200px] ml-auto relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">🔫</span>
                        <input value={barkodOkuyucu} onChange={e => setBarkodOkuyucu(e.target.value)} onKeyDown={handleBarkodOkutma} placeholder="Barkod (Enter)" className="w-full pl-9 pr-3 py-1.5 bg-[#0d1117] border border-amber-500/50 focus:border-amber-400 rounded-lg text-xs font-bold text-amber-100 outline-none transition-shadow" />
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="font-black text-emerald-400 text-lg">Toplam: ₺{toplamHesapla().toFixed(2)}</span>
                        <button type="button" onClick={kalemEkle} className="bg-slate-800 hover:bg-black text-emerald-400 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1"><Plus size={14} /> Ürün</button>
                    </div>
                </div>

                {kalemler.length === 0 && <div className="text-center py-8 bg-[#122b27] rounded-xl border-2 border-dashed border-[#1e4a43]"><p className="text-slate-400 font-bold text-sm m-0">Ürün eklenmedi.</p></div>}

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {kalemler.map((k, i) => {
                        const kalemTutar = (parseInt(k.adet) || 0) * parseFloat(k.birim_fiyat_tl || 0) * (1 - (parseFloat(k.iskonto_pct) || 0) / 100);
                        return (
                            <div key={i} className="bg-[#122b27] p-3.5 rounded-xl border border-slate-700 shadow-sm relative group hover:border-emerald-500 transition-colors">
                                <button type="button" onClick={() => kalemSil(i)} className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm border border-red-200 cursor-pointer"><X size={12} /></button>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-3">
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-black text-slate-400 mb-1 uppercase tracking-widest">Ürün</label>
                                        <select value={k.urun_id} onChange={e => kalemGuncelle(i, 'urun_id', e.target.value)} className="w-full px-2.5 py-2 bg-[#0d1117] text-white border border-[#1e4a43] rounded-lg font-bold outline-none focus:border-emerald-500 text-xs cursor-pointer truncate">
                                            <option value="">— Seçiniz —</option>
                                            {urunler.map(u => <option key={u.id} value={u.id}>{u.urun_kodu} | ₺{(parseFloat(u.satis_fiyati_tl) || 0).toFixed(0)}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-slate-400 mb-1 uppercase tracking-widest">Beden</label>
                                        <input maxLength={20} value={k.beden} onChange={e => kalemGuncelle(i, 'beden', e.target.value)} placeholder="Örn: M" className="w-full px-2.5 py-2 bg-[#0d1117] text-white border border-[#1e4a43] rounded-lg font-bold outline-none focus:border-emerald-500 text-xs" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-slate-400 mb-1 uppercase tracking-widest">Adet</label>
                                        <input type="number" min="1" value={k.adet} onChange={e => kalemGuncelle(i, 'adet', e.target.value)} className="w-full px-2.5 py-2 bg-[#0d1117] text-white border border-[#1e4a43] rounded-lg font-bold outline-none focus:border-emerald-500 text-xs text-center" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-slate-400 mb-1 uppercase tracking-widest">Br. Fiyat</label>
                                        <input type="number" step="0.01" value={k.birim_fiyat_tl} onChange={e => kalemGuncelle(i, 'birim_fiyat_tl', e.target.value)} className="w-full px-2.5 py-2 bg-[#0d1117] text-white border border-[#1e4a43] rounded-lg font-bold outline-none focus:border-emerald-500 text-xs" />
                                    </div>
                                    <div className="md:col-span-2 text-right self-center pt-2">
                                        <div className="text-sm font-black text-slate-400 uppercase tracking-widest mb-0.5">Tutar</div>
                                        <div className="font-black text-emerald-400 text-[15px]">₺{kalemTutar.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center bg-slate-900 p-2 rounded-lg border border-slate-700">
                                    <span className="text-xs text-sky-400 font-bold whitespace-nowrap bg-sky-900/50 px-2 py-1 rounded">NOT:</span>
                                    <input maxLength={100} value={k.kalem_notu || ''} onChange={e => kalemGuncelle(i, 'kalem_notu', e.target.value)} placeholder="Ürün revize notları..." className="w-full bg-transparent border-0 outline-none font-medium text-xs text-slate-300" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t-2 border-[#1e4a43] mt-2">
                <button onClick={() => { setForm(BOSH_FORM); setKalemler([]); setFormAcik(false); }} className="px-6 py-2.5 border-2 border-[#1e4a43] hover:border-slate-500 hover:bg-[#0d1117] text-slate-300 cursor-pointer rounded-xl font-bold transition-all">İptal</button>
                <button onClick={kaydet} disabled={loading} className={`px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 border-b-4 border-emerald-800 text-white rounded-xl font-black cursor-pointer transition-all flex items-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}>
                    {loading ? '...' : '✅ Kaydet'}
                </button>
            </div>
        </div>
    );
}
