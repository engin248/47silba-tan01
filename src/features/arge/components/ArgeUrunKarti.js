import { CheckCircle2, BarChart3 } from 'lucide-react';

export default function ArgeUrunKarti({ p, kararVer }) {
    const skor = p.satar_satmaz_skoru || 0;
    let riskRenk = 'emerald';
    let tavsiye = 'ÜRETİME GİR (BİNGO)';
    if (skor < 50) { riskRenk = 'rose'; tavsiye = 'İPTAL / ÇÖP'; }
    else if (skor < 70) { riskRenk = 'amber'; tavsiye = 'RİSKLİ / BEKLE'; }
    else if (skor < 85) { riskRenk = 'blue'; tavsiye = 'POTANSİYEL (TAKİP)'; }

    return (
        <div className={`bg-[#161b22] border-l-4 border-[#30363d] rounded-r-xl p-5 hover:bg-[#1a2029] transition-all
            ${skor >= 85 ? 'border-l-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.05)]' :
                skor < 50 ? 'border-l-rose-500' : 'border-l-blue-500'}`}>

            <div className="flex justify-between items-start mb-4">
                <div>
                    {/* ERKEN TESPİT ETİKETİ */}
                    {(p.viral_izlenme_hizi > 50000 && p.satici_sayisi < 5) && (
                        <span className="inline-block bg-purple-500/20 text-purple-400 border border-purple-500/50 px-2 py-0.5 rounded text-xs font-black tracking-widest uppercase mb-2">
                            ⚡ ERKEN TREND TESPİTİ (REKABET DÜŞÜK)
                        </span>
                    )}
                    <h3 className="text-lg font-bold text-white mb-1">{p.title || p.isim || p.isim_orjinal || 'İsimsiz Sinyal'}</h3>
                    <a href={p.product_url || p.hedef_url || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">Kaynak Linkine Git ↗</a>
                </div>

                {/* OTOMATİK SKOR PANELİ */}
                <div className="text-right">
                    <div className="text-sm text-[#8b949e] font-bold uppercase tracking-widest mb-1">M1 Karar Skoru</div>
                    <div className={`text-3xl font-black text-${riskRenk}-400`}>
                        %{skor}
                    </div>
                    <div className={`text-xs font-black tracking-widest uppercase text-${riskRenk}-400 mt-1`}>
                        {tavsiye}
                    </div>
                </div>
            </div>

            {/* SOSYAL + PAZAR YERİ EŞLEŞME METRİKLERİ */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-bold uppercase">Sepet Deltası (Talep)</span>
                    <span className="text-sm font-mono text-emerald-400 font-bold">+{p.sepet_deltasi || 0}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-bold uppercase">Yorum İvmesi</span>
                    <span className="text-sm font-mono text-blue-400 font-bold">+{p.yorum_deltasi || 0}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-bold uppercase">Viral Kopma Hızı</span>
                    <span className="text-sm font-mono text-purple-400 font-bold">{p.viral_izlenme_hizi || 0} /G</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-bold uppercase">Rakip Satıcı</span>
                    <span className="text-sm font-mono text-amber-400 font-bold">{p.satici_sayisi || 0} Kişi</span>
                </div>
                <div className="flex flex-col border-l border-[#30363d] pl-3">
                    <span className="text-xs text-gray-500 font-bold uppercase">Yorum Zehri / Risk</span>
                    <span className={`text-xs font-black uppercase mt-0.5 ${(p.iade_risk_sinyali || '').includes('YÜKSEK') ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {p.iade_risk_sinyali || 'TEMİZ'}
                    </span>
                </div>
            </div>

            {/* [AR-05] MALİYET ÖN HESABI MOCKUP */}
            <div className="mt-3 bg-[#111827] border border-[#1f2937] rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-900/30 p-2 rounded-lg border border-blue-500/30">
                        <BarChart3 size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-0.5">[AR-05] ÜRETİM MALİYETİ TAHMİNİ (AI)</div>
                        <div className="text-xs text-gray-400">Kumaş, Kalıp ve İşçilik öngörüsü (±%5 yanılma payı)</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-black text-white font-mono">{p.teorik_maliyet ? `₺${Number(p.teorik_maliyet).toFixed(0)}` : 'Hesaplanmadi'} <span className="text-xs text-gray-500">/Birim</span></div>
                    <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Firsat Skoru: %{p.satar_satmaz_skoru ? Number(p.satar_satmaz_skoru).toFixed(0) : '?'}</div>
                </div>
            </div>

            {/* KARAR PANELİ (ÖLÜMCÜL NOKTA) */}
            <div className="mt-4 flex flex-col md:flex-row justify-between items-center bg-[#161b22] border-t border-[#30363d] pt-4">
                <div className="text-sm text-gray-500 mb-3 md:mb-0">
                    Ajan Raporu Düştü: {new Date(p.created_at).toLocaleString('tr-TR')}
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => kararVer(p.id, 'iptal')} className="flex-1 md:flex-none px-4 py-2 rounded border border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-black tracking-widest uppercase transition-all">
                        ÇÖPE AT (İPTAL)
                    </button>

                    <button onClick={() => kararVer(p.id, 'inceleniyor')} className="flex-1 md:flex-none px-4 py-2 rounded border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-black tracking-widest uppercase transition-all">
                        RADARDA BEKLET
                    </button>

                    <button onClick={() => kararVer(p.id, 'uretim_onay')} className="flex-1 md:flex-none px-6 py-2 rounded border border-emerald-500 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} /> ÜRETİME SEVK ET (M2)
                    </button>
                </div>
            </div>

        </div>
    );
}
