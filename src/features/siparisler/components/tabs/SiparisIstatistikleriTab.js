import IstatistikKutulari from '@/components/ui/IstatistikKutulari';

export default function SiparisIstatistikleriTab({ siparisler, istatistik, isAdmin, fm }) {
    if (!siparisler) return null;

    const bugun = new Date();
    const son7 = siparisler.filter(s => {
        const gt = (bugun.getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return gt <= 7 && !['iptal', 'iade'].includes(s.durum);
    });
    const onceki7 = siparisler.filter(s => {
        const gt = (bugun.getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return gt > 7 && gt <= 14 && !['iptal', 'iade'].includes(s.durum);
    });

    const son7Ciro = son7.reduce((t, s) => t + parseFloat(s.toplam_tutar_tl || 0), 0);
    const onceki7Ciro = onceki7.reduce((t, s) => t + parseFloat(s.toplam_tutar_tl || 0), 0);
    let ivme = 0, yon = 'flat';

    if (onceki7Ciro > 0) {
        ivme = ((son7Ciro - onceki7Ciro) / onceki7Ciro) * 100;
        yon = ivme > 0 ? 'up' : ivme < 0 ? 'down' : 'flat';
    } else if (son7Ciro > 0) {
        ivme = 100;
        yon = 'up';
    }

    const renkSinifMap = {
        up: { yazi: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', textLight: 'text-emerald-600/70', emoji: '🚀', label: 'Hızlanış' },
        down: { yazi: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', textLight: 'text-red-600/70', emoji: '📉', label: 'Yavaşlama' },
        flat: { yazi: 'text-emerald-300', bg: 'bg-[#0d1117] text-white', border: 'border-[#1e4a43]', textLight: 'text-emerald-200/70', emoji: '➡️', label: 'Sabit' }
    };
    const rsm = renkSinifMap[yon];

    // Ciro dağılımı
    const gecerliSiparisler = siparisler.filter(s => !['iptal', 'iade'].includes(s.durum));
    const toplamKanalCiro = gecerliSiparisler.reduce((t, s) => t + parseFloat(s.toplam_tutar_tl || 0), 0);

    const kanalHesapla = (kAdi) => {
        const t = gecerliSiparisler.filter(s => s.kanal === kAdi).reduce((s, z) => s + parseFloat(z.toplam_tutar_tl || 0), 0);
        return { ciro: t, yuzde: toplamKanalCiro > 0 ? (t / toplamKanalCiro * 100) : 0 };
    };

    const magaza = kanalHesapla('magaza');
    const toptan = kanalHesapla('toptan');
    const b2b = kanalHesapla('b2b');
    const eticaretList = ['eticaret', 'trendyol', 'amazon', 'instagram', 'diger'];
    const eTicaretCiro = eticaretList.reduce((acc, k) => acc + kanalHesapla(k).ciro, 0);
    const eTicaretYuzde = eticaretList.reduce((acc, k) => acc + kanalHesapla(k).yuzde, 0);

    return (
        <div className="mb-6 animate-fade-in">
            <IstatistikKutulari kartlar={[
                { label: 'Toplam Sipariş', val: istatistik.toplam, color: '#047857', bg: '#ecfdf5' },
                { label: '⏳ Bekleyen', val: istatistik.bekleyen, color: '#d97706', bg: '#fffbeb' },
                { label: '🚛 Kargoda', val: istatistik.kargoda, color: '#e2e8f0', bg: '#f8fafc' },
                { label: '💰 Teslim Ciro', val: `₺${istatistik.gelir.toFixed(0)}`, color: '#059669', bg: '#ecfdf5' },
                ...(istatistik.karliSiparis + istatistik.zararlıSiparis > 0 ? [
                    { label: '🟢 Karlı', val: istatistik.karliSiparis, color: '#059669', bg: '#f0fdf4' },
                    { label: '🔴 Zararlı', val: istatistik.zararlıSiparis, color: '#dc2626', bg: '#fef2f2' },
                ] : []),
            ]} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Sol: Trend Analizi */}
                <div className="bg-[#122b27] p-5 rounded-2xl border-2 border-[#1e4a43] shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform -z-0"></div>
                    <h3 className="m-0 mb-4 text-sm font-black text-white flex items-center gap-2 relative z-10">
                        <span className="text-emerald-600">📈</span> Satış Trend Hız Analizi
                    </h3>
                    <div className={`flex justify-between items-center p-4 rounded-xl border ${rsm.bg} ${rsm.border} relative z-10`}>
                        <div>
                            <div className={`text-sm font-black uppercase tracking-widest ${rsm.yazi}`}>Son 7G: {son7.length} Sipariş | Önceki: {onceki7.length} Sipariş</div>
                            <div className={`text-2xl font-black mt-1 ${rsm.yazi}`}>
                                {yon === 'up' ? '+' : ''}{ivme.toFixed(1)}% <span className="text-sm">{rsm.label}</span>
                            </div>
                            <div className={`text-sm font-bold mt-1 ${rsm.textLight}`}>
                                Son 7G ₺{son7Ciro.toFixed(0)} <span className="mx-1">/</span> Önceki ₺{onceki7Ciro.toFixed(0)}
                            </div>
                        </div>
                        <div className="text-4xl drop-shadow-sm">{rsm.emoji}</div>
                    </div>
                </div>

                {/* Sağ: Mağaza Dağılımı */}
                <div className="bg-[#122b27] p-5 rounded-2xl border-2 border-[#1e4a43] shadow-sm hover:border-sky-200 transition-colors">
                    <h3 className="m-0 mb-4 text-sm font-black text-white flex items-center gap-2">
                        <span className="text-sky-500">🏪</span> Mağaza/Kanal Performans Ciro Ölçümü
                    </h3>
                    <div className="flex flex-col gap-3">
                        {[
                            { ad: 'Perakende Mağaza', ciro: magaza.ciro, yuzde: magaza.yuzde, color: 'bg-sky-500' },
                            { ad: 'Toptan & B2B', ciro: toptan.ciro + b2b.ciro, yuzde: toptan.yuzde + b2b.yuzde, color: 'bg-emerald-500' },
                            { ad: 'E-Ticaret & Sosyal', ciro: eTicaretCiro, yuzde: eTicaretYuzde, color: 'bg-amber-500' },
                        ].map((m, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-24 text-xs font-bold text-emerald-300 tracking-tight leading-tight">{m.ad}</div>
                                <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                                    <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.yuzde}%` }} />
                                </div>
                                <div className="text-xs font-black text-white w-[70px] text-right">₺{(m.ciro || 0).toFixed(0)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
