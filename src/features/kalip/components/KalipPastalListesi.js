import { ChevronRight, Ruler, Scissors, Settings, Trash2 } from 'lucide-react';

export default function KalipPastalListesi({ kaliplar, loading, sil, islemdeId, setFormKalip, setSekme, setFormAcik }) {
    if (kaliplar.length === 0 && !loading) {
        return <div className="text-center py-20 border border-dashed border-[#30363d] rounded-xl text-[#8b949e]">Kayıtlı kalıp/pastal bulunamadı. Lütfen ekleyin.</div>;
    }

    return (
        <div className="flex flex-col gap-4">
            {kaliplar.map(k => {
                const boy = parseFloat(k.pastal_boyu_cm) / 100;
                const en = parseFloat(k.pastal_eni_cm) / 100;
                const fire = parseFloat(k.fire_orani_yuzde) / 100;
                const metraj = (boy * en * (1 + fire)).toFixed(3);

                return (
                    <div key={k.id} className="bg-[#161b22] border border-[#21262d] hover:border-[#30363d] rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 shadow-lg transition-colors">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-black bg-[#21262d] text-emerald-400 border border-[#30363d] px-2 py-0.5 rounded tracking-widest">{k.b1_model_taslaklari?.model_kodu}</span>
                                <ChevronRight size={14} className="text-[#8b949e]" />
                                <h3 className="font-bold text-white text-sm m-0">{k.kalip_adi}</h3>
                                <span className="text-xs font-black text-amber-500 border border-amber-500/20 bg-amber-500/10 px-2 rounded-full">{k.versiyon}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {(k.bedenler || []).map(b => (
                                    <span key={b} className="text-xs font-black bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-widest">{b}</span>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm font-bold text-[#8b949e] uppercase tracking-widest items-center">
                                <span className="flex items-center gap-1"><Ruler size={12} className="text-amber-500" /> {k.pastal_boyu_cm}cm × {k.pastal_eni_cm}cm</span>
                                <span className="flex items-center gap-1"><Scissors size={12} className="text-rose-400" /> Fire: %{k.fire_orani_yuzde}</span>
                            </div>

                            {k.kalip_dosya_url && (
                                <div className="mt-3">
                                    {(k.kalip_dosya_url.includes('.png') || k.kalip_dosya_url.includes('.jpg') || k.kalip_dosya_url.includes('.jpeg')) ? (
                                        <a href={k.kalip_dosya_url} target="_blank" rel="noreferrer" className="block max-w-[150px] border border-[#30363d] rounded-lg overflow-hidden relative">
                                            <img src={k.kalip_dosya_url} alt="Çizim" className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity" />
                                        </a>
                                    ) : (
                                        <a href={k.kalip_dosya_url} target="_blank" rel="noreferrer" className="text-blue-400 font-mono text-xs hover:underline bg-[#0d1117] px-2 py-1.5 rounded border border-[#30363d] inline-flex items-center gap-2">
                                            🔗 PDF/DXF Dosyayı Aç
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 flex gap-4 w-full md:w-auto mt-4 md:mt-0 items-center justify-between md:justify-end">
                            <div className="bg-[#0d1117] border border-amber-500/30 rounded-lg p-3 text-center min-w-[120px]">
                                <div className="text-[0.65rem] font-black text-amber-500/70 uppercase tracking-widest mb-1">Gereken (m²)</div>
                                <div className="text-xl font-black font-mono text-amber-500 leading-none">{(parseFloat(metraj) * (k.bedenler?.length || 1)).toFixed(3)}</div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => {
                                    setFormKalip({
                                        id: k.id, model_id: k.model_id || '', kalip_adi: k.kalip_adi, bedenler: k.bedenler || [],
                                        pastal_boyu_cm: String(k.pastal_boyu_cm || ''), pastal_eni_cm: String(k.pastal_eni_cm || ''),
                                        fire_orani_yuzde: String(k.fire_orani_yuzde || '5'), versiyon: k.versiyon || 'v1.0', kalip_dosya_url: k.kalip_dosya_url || ''
                                    });
                                    setSekme('kaliplar'); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} className="bg-[#21262d] hover:bg-[#30363d] text-white p-2 rounded-lg transition-colors">
                                    <Settings size={14} />
                                </button>
                                <button onClick={() => sil('b1_model_kaliplari', k.id)} disabled={islemdeId === 'sil_' + k.id} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 p-2 rounded-lg transition-colors disabled:opacity-50">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
