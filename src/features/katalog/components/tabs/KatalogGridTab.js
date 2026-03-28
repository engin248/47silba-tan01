import { Image as ImageIcon, Grid3X3, QrCode, Trash2, History, Send } from 'lucide-react';

export default function KatalogGridTab({
    filtreli,
    kategoriAltAcik,
    setKategoriAltAcik,
    ALT_KATEGORILER,
    izPanelAcik,
    setIzPanelAcik,
    setBarkodAcik,
    setSeciliUrun,
    setSkuAcik,
    skuMatrisiAc,
    fiyatGecmisiniAc,
    duzenleId,
    setDuzenleId,
    setForm,
    BOSH_URUN,
    setFormAcik,
    sil,
    whatsappTeklif,
    islemdeId,
    finansGizli
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {filtreli.map(u => {
                const maliyetTl = parseFloat(u.birim_maliyet_tl || 0);
                const satisTl = parseFloat(u.satis_fiyati_tl || 0);
                let karMarji = 0;
                if (maliyetTl > 0) karMarji = ((satisTl - maliyetTl) / maliyetTl) * 100;
                let cV = '#10b981';
                if (karMarji < 20) cV = '#ef4444'; else if (karMarji < 50) cV = '#f59e0b';

                return (
                    <div key={u.id} className="bg-[#122b27] border border-[#1e4a43] rounded-2xl p-4 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
                        <div className="flex gap-4">
                            <div className="w-20 h-24 bg-[#0d1117] rounded-xl flex items-center justify-center text-slate-700 border border-slate-800 shrink-0 overflow-hidden relative group">
                                {u.fotograf_url ? (
                                    <img src={u.fotograf_url} alt={u.urun_kodu} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                ) : (
                                    <ImageIcon size={32} className="opacity-50" />
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center cursor-pointer hover:bg-black" onClick={() => { setSeciliUrun(u); setBarkodAcik(true); }}>
                                    <QrCode size={14} className="text-white inline" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start gap-1">
                                        <span className="text-[0.65rem] font-black bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-900 leading-tight">
                                            {u.urun_kodu}
                                        </span>
                                        <span className={`text-[0.6rem] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${u.durum === 'aktif' ? 'bg-emerald-950 text-emerald-500 border-emerald-900' : 'bg-rose-950 text-rose-500 border-rose-900'}`}>
                                            {u.durum === 'aktif' ? '• AKTİF' : '• PASİF'}
                                        </span>
                                    </div>
                                    <div className="font-black text-white text-base tracking-tight leading-tight mt-1 line-clamp-2">{u.urun_adi}</div>
                                    {u.urun_adi_ar && <div className="text-[0.65rem] text-slate-400 font-bold leading-tight" dir="rtl">{u.urun_adi_ar}</div>}
                                </div>
                                <div>
                                    {/* M13 Bütçe Kalkanı (Devre dışı bırakılabilir gizlilik) */}
                                    <div className={`mt-2 flex items-center justify-between p-1.5 rounded-lg border ${!finansGizli ? 'bg-[#0b1d1a] border-[#1e4a43]' : 'bg-transparent border-transparent'}`}>
                                        <div className="flex flex-col">
                                            <span className="text-[0.6rem] text-slate-500 font-black uppercase tracking-wider">{!finansGizli ? 'Satış' : 'Stok'}</span>
                                            <span className="font-black text-emerald-400 text-sm">
                                                {!finansGizli ? `₺${satisTl.toFixed(2)}` : `${u.stok_adeti || 0} Adet`}
                                            </span>
                                        </div>
                                        {/* Maliyet Gösterimi */}
                                        {!finansGizli && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[0.6rem] font-black tracking-wider flex items-center gap-1" style={{ color: cV }}>
                                                    %{karMarji.toFixed(1)} Marj
                                                </span>
                                                <span className="font-bold text-slate-400 text-xs line-through opacity-70">₺{maliyetTl.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AKSİYONLAR */}
                        <div className="mt-4 flex gap-1 justify-between pt-3 border-t border-[#1e4a43]/50">
                            <button onClick={() => skuMatrisiAc(u)} title="SKU Beden/Stok Matrisi" className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg text-xs font-black cursor-pointer border border-slate-700 flex items-center justify-center gap-1">
                                <Grid3X3 size={12} /> SKU
                            </button>
                            {!finansGizli && (
                                <button onClick={() => fiyatGecmisiniAc(u)} title="Fiyat Geçmişi Analizi" className="flex-1 bg-blue-950 hover:bg-blue-900 border border-blue-900 text-blue-400 py-1.5 rounded-lg text-xs font-black cursor-pointer flex items-center justify-center gap-1">
                                    <History size={12} /> Fiyat
                                </button>
                            )}
                            <button onClick={() => { setForm({ ...BOSH_URUN, ...u }); setDuzenleId(u.id); setFormAcik(true); }} className="flex-1 bg-amber-950 hover:bg-amber-900 border border-amber-900 text-amber-500 py-1.5 rounded-lg text-xs font-black cursor-pointer">
                                Düzenle
                            </button>
                            <button onClick={() => whatsappTeklif(u)} title="WhatsApp ile Teklif At" className="w-8 shrink-0 bg-emerald-950 hover:bg-emerald-900 border border-emerald-900 text-emerald-400 py-1.5 rounded-lg cursor-pointer flex items-center justify-center">
                                <Send size={12} />
                            </button>
                            <button disabled={islemdeId === 'sil_' + u.id} onClick={() => sil(u.id, u.urun_kodu)} title="Kalıcı Olarak Sil"
                                className={`w-8 shrink-0 bg-red-950 border border-red-900 text-red-500 hover:bg-red-900 py-1.5 rounded-lg cursor-pointer flex items-center justify-center transition-colors ${islemdeId === 'sil_' + u.id ? 'opacity-50' : ''}`}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
