import { Search, Eye } from 'lucide-react';
import Link from 'next/link';

export default function KumasEnvanterRadari({
    sekme, sekmeIsimleri, aktifSekme, setAktifSekme,
    firsatlar, kumasRaporu
}) {
    return (
        <div className="xl:col-span-3 flex flex-col">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {sekmeIsimleri.map((s, i) => (
                    <button key={i} onClick={() => setAktifSekme(i)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${aktifSekme === i ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50' : 'bg-[#161b22] text-[#8b949e] border border-[#21262d] hover:text-white'
                        }`}>
                        {s}
                    </button>
                ))}
            </div>

            <div className="bg-[#161b22] border border-[#21262d] rounded-xl flex-1 p-4 overflow-y-auto">
                <div className="relative mb-4 w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 text-[#8b949e]" size={14} />
                    <input type="text" placeholder="Kumaş Kodu, Adı veya Kompozisyon (Örn: Polyamid)..." className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-emerald-500 outline-none transition-colors" />
                </div>

                <div className="space-y-3">
                    {sekme === 'firsat' ? (
                        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-6 text-center">
                            <h3 className="text-lg font-black text-amber-500 mb-2 uppercase tracking-wide">AI Fırsat Radarı (Upcycle) Devrede</h3>
                            <p className="text-sm text-amber-200/70 mb-6">Depoda bekleyen, hareketsiz kumaşlarınızı (Ölü Stok) sisteme yükleyin. M1 Trend İstihbarat motoru ile eşleşen güncel modelleri bulup, doğrudan M3 Modelhaneye üretim tavsiyesi ve marj analizi sunalım.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                {firsatlar && firsatlar.length > 0 ? (
                                    firsatlar.map((f, i) => {
                                        const aiVeri = f.ai_trend_eslesme || {};
                                        return (
                                            <div key={i} className="bg-[#0b121a] border border-[#21262d] rounded-xl p-4 flex gap-4">
                                                <div className="w-20 h-20 bg-[#161b22] rounded-lg border border-[#30363d] shrink-0 overflow-hidden flex items-center justify-center relative">
                                                    {f.fotograf_urls && f.fotograf_urls[0] ? (
                                                        <img src={f.fotograf_urls[0]} alt="Kumas" className="w-full h-full object-cover opacity-80" />
                                                    ) : (
                                                        <span className="text-sm text-[#8b949e]">FOTOĞRAF</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-white text-sm">{f.ad} {f.kondisyon_notu ? `(${f.kondisyon_notu})` : ''}</h4>
                                                        <span className="text-sm bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                                                            %{aiVeri.beklenen_marj_yuzdesi || 65} TAHMİNİ MARJ
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[#8b949e] mt-1 mb-2">
                                                        M1 Trend Eşleşmesi: {aiVeri.model_tavsiyesi || "Sistem eşleşme arıyor..."}. Stok: {f.stok_miktar} {f.stok_birimi}
                                                    </p>
                                                    <button className="text-sm font-bold text-black bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-md transition-colors w-full">
                                                        MODEL UYARLA VE M3'E YOLLA
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-1 border border-dashed border-amber-500/30 p-4 text-center rounded-xl text-amber-500/50">
                                        Şu an için "is_firsat = true" olarak M2 veritabanına eklenmiş kayıt bulunmuyor.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {kumasRaporu.map((k, idx) => (
                                <div key={idx} className={`rounded-xl border flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${k.durum === 'riskli' ? 'border-rose-500/30' : 'border-[#30363d]'}`}>
                                    <div className="h-40 bg-[#0b121a] relative flex items-center justify-center border-b border-[#21262d]">
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] to-transparent z-10"></div>
                                        <span className="text-sm text-[#8b949e] font-black tracking-widest uppercase">GÖRSEL EKLENMEDİ</span>
                                        {k.durum === 'riskli' && (
                                            <div className="absolute top-2 right-2 z-20 bg-rose-500/90 text-white text-xs font-black uppercase px-2 py-0.5 rounded shadow-[0_0_10px_rgba(244,63,94,0.5)]">RİSK</div>
                                        )}
                                    </div>

                                    <div className={`p-4 flex flex-col flex-1 bg-[#0d1117]`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-black uppercase bg-[#21262d] text-emerald-400 px-2 py-0.5 rounded border border-[#30363d]">{k.kodu}</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-white tracking-wide">{k.ad}</h3>
                                        <p className="text-sm text-[#8b949e] mt-1 mb-4 border-l-2 border-[#30363d] pl-2">{k.kompozisyon}</p>

                                        <div className="grid grid-cols-2 gap-3 mb-4 bg-[#161b22] p-3 rounded-lg border border-[#21262d]">
                                            <div className="flex flex-col gap-1 border-r border-[#30363d]">
                                                <span className="text-xs text-[#8b949e] font-bold uppercase tracking-wider">Maliyet</span>
                                                <span className="text-lg font-mono text-white">₺{k.birimFiyat.toFixed(2)}<span className="text-sm text-gray-500">/mt</span></span>
                                            </div>
                                            <div className="flex flex-col gap-1 pl-2">
                                                <span className="text-xs text-[#8b949e] font-bold uppercase tracking-wider">M11 Stok</span>
                                                <span className={`text-lg font-mono font-bold ${k.stok <= k.minStok ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {k.stok}<span className="text-sm text-gray-500">mt</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest border-t border-[#30363d] pt-3 mb-4">
                                            <span className="text-[#8b949e]">Alternatif:</span>
                                            <span className={k.alternatifVar ? 'text-[#c9d1d9]' : 'text-rose-400'}>{k.tedarikci}</span>
                                        </div>

                                        <div className="flex gap-2 mt-auto">
                                            <button className="flex-1 text-sm font-bold text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 uppercase tracking-widest border border-[#30363d]">
                                                <Eye size={14} /> KARTELA
                                            </button>
                                            <Link href="/kalip" className="flex-1 w-full">
                                                <button className="w-full text-sm font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 py-2.5 rounded-lg transition-colors border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] uppercase tracking-widest flex items-center justify-center gap-1">
                                                    M3'E AT
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
