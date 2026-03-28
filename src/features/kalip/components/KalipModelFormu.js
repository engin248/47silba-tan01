import { BookOpen } from 'lucide-react';

const HEDEF_KITLE = ['kadin', 'erkek', 'cocuk', 'unisex'];
const SEZON = ['ilkbahar', 'yaz', 'sonbahar', 'kis', '4mevsim'];
const BOSH_MODEL = { id: null, model_kodu: '', model_adi: '', model_adi_ar: '', trend_id: '', hedef_kitle: 'kadin', sezon: 'yaz', aciklama: '' };

export default function KalipModelFormu({ formModel, setFormModel, trendler, setFormAcik, kaydetModel, loading }) {
    return (
        <div className="bg-[#121c1a] lg:bg-[#161b22] border border-amber-500/50 rounded-xl p-6 mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BookOpen size={120} /></div>
            <h3 className="font-black text-amber-500 mb-4 text-xs uppercase tracking-widest">📐 {formModel.id ? 'Model Düzenle (Değişiklik M4\'ü Etkileyebilir!)' : 'Yeni Model Taslağı'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                <div>
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Model Kodu *</label>
                    <input className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        value={formModel.model_kodu} onChange={e => setFormModel({ ...formModel, model_kodu: e.target.value })} placeholder="MDL-001" />
                </div>
                <div>
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Model Adı *</label>
                    <input className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        value={formModel.model_adi} onChange={e => setFormModel({ ...formModel, model_adi: e.target.value })} placeholder="Yazlık Keten Gömlek" />
                </div>
                <div>
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">İlgili Trend (M1 İstihbaratı)</label>
                    <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        value={formModel.trend_id} onChange={e => setFormModel({ ...formModel, trend_id: e.target.value })}>
                        <option value="">— M1 Trendlerinden Seç —</option>
                        {trendler.map(t => <option key={t.id} value={t.id}>{t.product_name?.substring(0, 50)}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Hedef Kitle</label>
                    <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none uppercase"
                        value={formModel.hedef_kitle} onChange={e => setFormModel({ ...formModel, hedef_kitle: e.target.value })}>
                        {HEDEF_KITLE.map(h => <option key={h} value={h} className="uppercase">{h}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Sezon</label>
                    <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none uppercase"
                        value={formModel.sezon} onChange={e => setFormModel({ ...formModel, sezon: e.target.value })}>
                        {SEZON.map(s => <option key={s} value={s} className="uppercase">{s}</option>)}
                    </select>
                </div>
                <div className="lg:col-span-3">
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Açıklama / Reçete Notları</label>
                    <textarea className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none min-h-[60px]"
                        value={formModel.aciklama} onChange={e => setFormModel({ ...formModel, aciklama: e.target.value })} />
                </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 border-t border-[#30363d] pt-4 relative z-10">
                <button onClick={() => { setFormModel(BOSH_MODEL); setFormAcik(false); }} className="px-5 py-2 rounded-lg font-bold text-xs bg-[#21262d] text-white hover:bg-[#30363d] transition-colors uppercase tracking-widest">İptal</button>
                <button onClick={kaydetModel} disabled={loading} className="px-6 py-2 rounded-lg font-black text-xs bg-amber-600 hover:bg-amber-500 text-white uppercase tracking-widest shadow-lg shadow-amber-500/20">{loading ? '...' : 'MODELİ MÜHÜRLE'}</button>
            </div>
        </div>
    );
}
