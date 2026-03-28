import { Tag, Settings, Trash2 } from 'lucide-react';

const DURUM_RENK = {
    taslak: 'text-gray-400 bg-[#21262d]',
    kumas_secildi: 'text-emerald-400 bg-emerald-500/20',
    kalip_hazir: 'text-amber-400 bg-amber-500/20',
    numune_onay_bekliyor: 'text-blue-400 bg-blue-500/20',
    uretim_hazir: 'text-emerald-400 bg-emerald-500/20',
    iptal: 'text-rose-400 bg-rose-500/20'
};

export default function KalipModelTaslakListesi({ modeller, loading, sil, islemdeId, setFormModel, setSekme, setFormAcik }) {
    if (modeller.length === 0 && !loading) {
        return <div className="lg:col-span-3 text-center py-20 border border-dashed border-[#30363d] rounded-xl text-[#8b949e]">Model bulunamadı. Lütfen yeni bir taslak oluşturun.</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {modeller.map(m => (
                <div key={m.id} className="bg-[#161b22] border border-[#21262d] hover:border-[#30363d] rounded-xl p-5 shadow-lg flex flex-col justify-between transition-colors">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black bg-[#21262d] text-emerald-400 border border-[#30363d] px-2 py-0.5 rounded tracking-widest">{m.model_kodu}</span>
                                {m.trend_id && <Tag size={12} className="text-amber-500" />}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => {
                                    setFormModel({ id: m.id, model_kodu: m.model_kodu, model_adi: m.model_adi, model_adi_ar: m.model_adi_ar || '', trend_id: m.trend_id || '', hedef_kitle: m.hedef_kitle, sezon: m.sezon, aciklama: m.aciklama || '' });
                                    setSekme('modeller');
                                    setFormAcik(true);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} className="text-[#8b949e] hover:text-white transition-colors">
                                    <Settings size={14} />
                                </button>
                                <button onClick={() => sil('b1_model_taslaklari', m.id)} disabled={islemdeId === 'sil_' + m.id} className="text-rose-500 hover:text-rose-400 transition-colors disabled:opacity-50">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-white text-sm mb-2">{m.model_adi}</h3>
                        <p className="text-sm text-[#8b949e] mb-3 line-clamp-2">{m.aciklama || 'Reçete detayı girilmedi.'}</p>
                    </div>
                    <div className="border-t border-[#21262d] pt-3 flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold uppercase text-white bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">{m.sezon}</span>
                        <span className="text-xs font-bold uppercase text-white bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">{m.hedef_kitle}</span>
                        <span className={`text-xs font-black uppercase px-2 py-1 rounded border border-[#30363d] ml-auto ${DURUM_RENK[m.durum] || 'text-gray-400'}`}>
                            {m.durum?.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
