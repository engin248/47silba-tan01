import { Scissors, Trash2, Plus, QrCode, CheckCircle2 } from 'lucide-react';

export default function KesimListesi({
    loading, filtrelenmis, setSeciliKesim, setBarkodAcik,
    duzenleKesim, sil, islemdeId, durumGuncelle, isEmriOlustur
}) {
    if (loading) return <p className="text-center py-10 text-[#8b949e] font-bold">Veriler Yükleniyor...</p>;

    if (!loading && filtrelenmis.length === 0) {
        return (
            <div className="text-center py-16 bg-[#161b22] border border-dashed border-[#30363d] rounded-xl flex flex-col items-center">
                <Scissors size={48} className="text-[#30363d] mb-4" />
                <p className="text-[#8b949e] font-bold text-sm">Kesim kaydı bulunamadı. "Yeni Kesim" butonu ile başlayın.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtrelenmis.map(k => {
                const tmm = k.durum === 'tamamlandi';
                return (
                    <div key={k.id} className={`bg-[#161b22] rounded-xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-lg ${tmm ? 'border-emerald-500/30' : k.durum === 'iptal' ? 'border-rose-500/30' : 'border-[#30363d]'}`}>
                        <div className="p-5 flex flex-col h-full">
                            <div className="flex justify-between items-start border-b border-[#21262d] pb-3 mb-3">
                                <div>
                                    <span className={`text-sm font-black px-2 py-0.5 rounded border uppercase tracking-widest ${tmm ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#21262d] text-white border-[#30363d]'}`}>{k.b1_model_taslaklari?.model_kodu || 'BİLİNMİYOR'}</span>
                                    <h3 className="font-bold text-white text-sm mt-2">{k.b1_model_taslaklari?.model_adi || 'TANIMSIZ MODEL'}</h3>

                                    <div className="flex gap-2 flex-wrap mt-2">
                                        {k.kesimci_adi && <span className="text-xs bg-[#0d1117] text-[#8b949e] border border-[#30363d] px-2 py-0.5 rounded font-bold">✂️ {k.kesimci_adi}</span>}
                                        {k.kesim_tarihi && <span className="text-xs bg-[#0d1117] text-[#8b949e] border border-[#30363d] px-2 py-0.5 rounded font-bold">📅 {new Date(k.kesim_tarihi).toLocaleDateString('tr-TR')}</span>}
                                        {k.kumas_topu_no && <span className="text-xs bg-[#0d1117] text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-bold">🧵 {k.kumas_topu_no}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => { setSeciliKesim(k); setBarkodAcik(true); }} className="bg-[#0b121a] hover:bg-[#0d1117] border border-[#30363d] text-white p-1.5 rounded-lg transition-colors"><QrCode size={14} /></button>
                                    <button onClick={() => duzenleKesim(k)} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 p-1.5 rounded-lg transition-colors"><Plus size={14} style={{ transform: 'rotate(45deg)' }} /></button>
                                    <button onClick={() => sil(k.id, k.b1_model_taslaklari?.model_kodu)} disabled={islemdeId === 'sil_' + k.id} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-1.5 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
                                    <div className="text-xs text-[#8b949e] font-bold tracking-widest uppercase mb-1">Pastal Katı</div>
                                    <div className="font-bold text-white text-lg font-mono">{k.pastal_kat_sayisi || 0}</div>
                                </div>
                                <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
                                    <div className="text-xs text-[#8b949e] font-bold tracking-widest uppercase mb-1">Net Çıkan Adet</div>
                                    <div className="font-bold text-emerald-400 text-lg font-mono">{k.kesilen_net_adet || '?'}</div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-3">
                                <div className={`text-sm font-bold uppercase tracking-wider ${k.fire_orani > 3 ? 'text-rose-400' : 'text-[#8b949e]'}`}>
                                    FİRE: %{k.fire_orani} {k.fire_orani > 3 && '⚠️ (RİSK BÖLGESİ)'}
                                </div>
                                {k.beden_dagilimi && (
                                    <div className="text-sm text-white font-mono bg-[#21262d] border border-[#30363d] px-2 py-0.5 rounded">
                                        📐 BEDENLER
                                    </div>
                                )}
                            </div>

                            {k.notlar && (
                                <div className="text-sm text-[#8b949e] italic mb-4 border-l-2 border-[#30363d] pl-2 py-1">
                                    "{k.notlar}"
                                </div>
                            )}

                            <div className="mt-auto pt-4 border-t border-[#21262d]">
                                {k.durum === 'kesimde' && (
                                    <button onClick={() => durumGuncelle(k.id, 'tamamlandi', k.b1_model_taslaklari?.model_kodu)} disabled={islemdeId === 'durum_' + k.id}
                                        className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                                        <CheckCircle2 size={16} /> KESİMİ TAMAMLA VE KAYDET
                                    </button>
                                )}
                                {k.durum === 'tamamlandi' && (
                                    <div className="flex flex-col gap-2">
                                        <div className="w-full py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-black text-center uppercase tracking-widest">
                                            ✅ KESİM ONAYLANDI VE KUMAŞ STOKTAN DÜŞÜLDÜ
                                        </div>
                                        <button onClick={() => isEmriOlustur(k)} disabled={islemdeId === 'emr_' + k.id}
                                            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:bg-[#30363d]">
                                            🔗 M6 ÜRETİM BANTI İŞ EMRİ YARAT
                                        </button>
                                    </div>
                                )}
                                {k.durum === 'iptal' && (
                                    <div className="w-full py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-black text-center uppercase tracking-widest">
                                        ❌ ARŞİVLENDİ / İPTAL EDİLDİ
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
