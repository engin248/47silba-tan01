import { Ruler } from 'lucide-react';

const BEDENLER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const BOSH_KALIP = { id: null, model_id: '', kalip_adi: '', bedenler: ['S', 'M', 'L', 'XL'], pastal_boyu_cm: '', pastal_eni_cm: '', fire_orani_yuzde: '5', versiyon: 'v1.0', kalip_dosya_url: '' };

export default function KalipPastalFormu({ formKalip, setFormKalip, modeller, setFormAcik, kaydetKalip, loading, metrajHesap }) {
    const toggleBeden = (b) => setFormKalip(p => ({ ...p, bedenler: p.bedenler.includes(b) ? p.bedenler.filter(x => x !== b) : [...p.bedenler, b] }));

    return (
        <div className="bg-[#121c1a] lg:bg-[#161b22] border border-amber-500/50 rounded-xl p-6 mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Ruler size={120} /></div>
            <h3 className="font-black text-amber-500 mb-4 text-xs uppercase tracking-widest">📏 {formKalip.id ? 'Kalıp Düzenle' : 'Yeni Kalıp & Pastal Ekle'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                <div className="md:col-span-2">
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Bağımlı Model Seç *</label>
                    <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        value={formKalip.model_id} onChange={e => setFormKalip({ ...formKalip, model_id: e.target.value })}>
                        <option value="">— M3 Taslaklarından Seç —</option>
                        {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} — {m.model_adi}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Kalıp Parça Adı *</label>
                    <input className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        value={formKalip.kalip_adi} onChange={e => setFormKalip({ ...formKalip, kalip_adi: e.target.value })} placeholder="Kaban Ön Beden Tam Kalıp" />
                </div>

                <div>
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Pastal Boyu (cm) *</label>
                    <input type="number" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none font-mono"
                        value={formKalip.pastal_boyu_cm} onChange={e => setFormKalip({ ...formKalip, pastal_boyu_cm: e.target.value })} placeholder="280" />
                </div>
                <div>
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Pastal Eni (cm) *</label>
                    <input type="number" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none font-mono"
                        value={formKalip.pastal_eni_cm} onChange={e => setFormKalip({ ...formKalip, pastal_eni_cm: e.target.value })} placeholder="150" />
                </div>
                <div>
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Fire Oranı (%)</label>
                    <input type="number" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none font-mono"
                        value={formKalip.fire_orani_yuzde} onChange={e => setFormKalip({ ...formKalip, fire_orani_yuzde: e.target.value })} placeholder="5" />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex flex-col justify-center text-center">
                    <span className="text-[0.65rem] font-black uppercase text-amber-500 tracking-widest mb-1 leading-tight">Tekil / Toplam İhtiyaç (m²)</span>
                    <div className="text-xl font-black font-mono text-amber-400">
                        {metrajHesap().tekil} <span className="text-xs text-amber-500/50">/</span> {metrajHesap().toplam}
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <label className="block text-sm font-black text-[#8b949e] mb-2 uppercase tracking-widest">Beden Serilemesi (Seçiniz)</label>
                    <div className="flex flex-wrap gap-2">
                        {BEDENLER.map(b => (
                            <button key={b} type="button" onClick={() => toggleBeden(b)}
                                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors border ${formKalip.bedenler.includes(b) ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-amber-500/50'}`}>
                                {b}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">[KA-01 / KA-06] Dijital Kalıp / Çizim Resmi (URL)</label>
                    <div className="flex gap-2">
                        <input className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-blue-400 font-mono focus:border-amber-500 outline-none"
                            value={formKalip.kalip_dosya_url} onChange={e => setFormKalip({ ...formKalip, kalip_dosya_url: e.target.value })} placeholder="Resim linki (.jpg/.png) veya DXF/PDF belgesi url'si..." />
                        <button type="button" onClick={() => alert('Sistem Depolama Modülü hazırlığında. Şimdilik dış link (.jpg/.png vb.) kullanınız.')}
                            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] rounded-lg border border-[#30363d] text-xs font-black uppercase transition-colors whitespace-nowrap">📸 Dosya Seç</button>
                    </div>
                    {formKalip.kalip_dosya_url && (formKalip.kalip_dosya_url.includes('.png') || formKalip.kalip_dosya_url.includes('.jpg') || formKalip.kalip_dosya_url.includes('.jpeg')) && (
                        <div className="mt-3 border border-[#30363d] rounded-lg overflow-hidden h-[120px] w-[180px] bg-[#0d1117] relative flex items-center justify-center">
                            <img src={formKalip.kalip_dosya_url} alt="Kalıp Önizleme" className="max-w-full max-h-full object-contain opacity-80" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 border-t border-[#30363d] pt-4 relative z-10">
                <button onClick={() => { setFormKalip(BOSH_KALIP); setFormAcik(false); }} className="px-5 py-2 rounded-lg font-bold text-xs bg-[#21262d] text-white hover:bg-[#30363d] transition-colors uppercase tracking-widest">İptal</button>
                <button onClick={kaydetKalip} disabled={loading} className="px-6 py-2 rounded-lg font-black text-xs bg-amber-600 hover:bg-amber-500 text-white uppercase tracking-widest shadow-lg shadow-amber-500/20">{loading ? '...' : 'KALIBI MÜHÜRLE'}</button>
            </div>
        </div>
    );
}
