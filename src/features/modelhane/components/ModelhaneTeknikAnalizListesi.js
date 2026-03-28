import { Clock, ChevronRight } from 'lucide-react';

export default function ModelhaneTeknikAnalizListesi({ teknikAnalizVerileri, durumGuncelle }) {
    if (teknikAnalizVerileri.length === 0) {
        return <p className="text-[#8b949e] text-xs text-center py-10">Gösterilecek numune bulgu kaydı yok.</p>;
    }

    return (
        <div className="space-y-3 mt-4">
            {teknikAnalizVerileri.map((k, idx) => {
                const ozelMakineRef = k.aciklama?.toLowerCase().includes('özel makine') || false;
                const iscilikSuresiMatch = k.aciklama?.match(/Numune (\d+) saniyede dikildi/);
                const iscilikSuresiText = iscilikSuresiMatch ? `${iscilikSuresiMatch[1]} Saniye` : 'Bilinmiyor';
                const isRiskli = k.durum === 'iptal_riskli';

                return (
                    <div key={k.id || idx} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4 transition-colors ${isRiskli ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[#0d1117] border-[#30363d] hover:bg-[#0b121a]'}`}>

                        {/* Model Kimliği */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black uppercase bg-[#21262d] text-white px-2 py-0.5 rounded border border-[#30363d]">{k.model_kodu}</span>
                                {isRiskli && <span className="text-xs font-black uppercase bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse">RAPOR: KRİTİK RİSK (REDDEDİLDİ)</span>}
                            </div>
                            <h3 className="text-sm font-bold text-white tracking-wide">{k.model_adi}</h3>
                            <p className="text-sm text-[#8b949e] mt-2 mb-1 font-mono">{k.aciklama}</p>
                        </div>

                        {/* Analiz Matrixi (AŞAMA 4: Teknik 5 Soru) */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 border-l border-[#21262d] pl-4 shrink-0">
                            <div className="flex flex-col gap-1 justify-center bg-[#0d1117] px-2 rounded">
                                <span className="text-xs text-[#8b949e] font-bold uppercase tracking-wider">İşçilik Süresi (Bant Başına)</span>
                                <span className="text-[15px] font-mono font-bold text-white flex items-center gap-1">
                                    <Clock size={12} className="text-purple-400" /> {iscilikSuresiText}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 justify-center">
                                <span className="text-xs text-[#8b949e] font-bold uppercase tracking-wider">Özel Makine</span>
                                <span className={`text-sm font-mono font-bold ${ozelMakineRef ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {ozelMakineRef ? 'Evet (Risk)' : 'Gerekmez'}
                                </span>
                            </div>
                        </div>

                        {/* Aksiyon Barı */}
                        <div className="flex flex-col justify-center items-end gap-2 shrink-0 border-l border-[#21262d] pl-4 flex-1 md:flex-none">
                            {isRiskli ? (
                                <button onClick={() => durumGuncelle(k.id, 'taslak')} className="text-sm w-full md:w-auto font-bold text-center text-white bg-rose-600/80 hover:bg-rose-500 border border-rose-500/50 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-md shadow-rose-500/20">
                                    M1 BEYİNE GERİ GÖNDER (İPTAL)
                                </button>
                            ) : (
                                <button onClick={() => durumGuncelle(k.id, 'uretime_hazir')} className="text-sm font-bold text-center text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-lg transition-colors border border-emerald-500/20 border-b-emerald-500/50 flex items-center justify-center gap-1 w-full md:w-auto">
                                    M5 KESİM SÜRECİNİ BAŞLAT <ChevronRight size={14} />
                                </button>
                            )}
                        </div>

                    </div>
                );
            })}
        </div>
    );
}
