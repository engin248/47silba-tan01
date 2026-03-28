import { ArrowUpRight, ArrowDownRight, Trash2, ArrowRightLeft } from 'lucide-react';

export default function StokHareketLoglari({ hareketler, erisim, islemdeId, hareketSilB0Log, isAR }) {
    if (!hareketler || !hareketler.length) return null;

    return (
        <div className="bg-[#122b27] border-2 border-[#1e4a43] rounded-[18px] overflow-hidden shadow-sm mt-8">
            <div className="bg-[#0b1d1a] p-5 border-b-2 border-[#1e4a43]">
                <h2 className="text-lg font-black text-white flex items-center gap-2 m-0 uppercase tracking-widest">
                    <ArrowRightLeft className="text-sky-500" size={20} /> {isAR ? 'الحركات الأخيرة في المستودع' : 'SON HAREKET DÖKÜMÜ (KARA KUTU)'}
                </h2>
                <p className="text-xs font-bold mt-1.5 text-emerald-400">
                    {isAR ? 'بيانات المستودع مقفلة ضد التلاعب' : 'Tüm lojistik veri transferleri manipülasyonlara karşı şifrelenmiştir.'}
                </p>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse min-w-[600px] text-left">
                    <thead>
                        <tr className="bg-[#0d1117] text-emerald-500 text-[0.65rem] uppercase tracking-widest font-black">
                            <th className="p-4 border-b border-[#1e4a43]">Ürün Kodu</th>
                            <th className="p-4 border-b border-[#1e4a43]">Kategori / İşlem Yönü</th>
                            <th className="p-4 border-b border-[#1e4a43]">Adet (Miktar)</th>
                            <th className="p-4 border-b border-[#1e4a43]">Açıklama / Fiş Detayı</th>
                            <th className="p-4 border-b border-[#1e4a43]">Tarih / Zaman</th>
                            {erisim === 'full' && <th className="p-4 border-b border-[#1e4a43] text-center">İptal İşlemi</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {hareketler.map(h => {
                            const isGiris = h.hareket_tipi === 'giris' || h.hareket_tipi === 'iade';
                            return (
                                <tr key={h.id} className="hover:bg-[#183631] transition-colors">
                                    <td className="p-4 border-b border-[#1e4a43]/50 font-black text-[0.85rem] text-white">
                                        {h.b2_urun_katalogu?.urun_kodu || '?'}
                                    </td>
                                    <td className="p-4 border-b border-[#1e4a43]/50">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.7rem] font-black border uppercase tracking-widest ${isGiris ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900' : 'bg-red-950/40 text-red-500 border-red-900'}`}>
                                            {isGiris ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {h.hareket_tipi}
                                        </span>
                                    </td>
                                    <td className={`p-4 border-b border-[#1e4a43]/50 font-black text-lg ${isGiris ? 'text-emerald-500' : 'text-red-500'}`} dir="ltr">
                                        {isGiris ? '+' : '-'}{h.adet} <span className="text-xs text-slate-500 font-bold">{isAR ? 'قطعة' : 'Adet'}</span>
                                    </td>
                                    <td className="p-4 border-b border-[#1e4a43]/50 text-[0.8rem] text-emerald-200 font-bold max-w-[200px] truncate" title={h.aciklama}>
                                        {h.aciklama}
                                    </td>
                                    <td className="p-4 border-b border-[#1e4a43]/50 text-[0.7rem] text-slate-400 font-black tracking-wider">
                                        {new Date(h.created_at).toLocaleString('tr-TR')}
                                    </td>
                                    {erisim === 'full' && (
                                        <td className="p-4 border-b border-[#1e4a43]/50 text-center">
                                            <button
                                                disabled={islemdeId === 'sil_' + h.id}
                                                onClick={() => hareketSilB0Log(h.id, h.b2_urun_katalogu?.urun_kodu)}
                                                className={`bg-red-950/40 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white p-2.5 rounded-xl cursor-pointer transition-colors ${islemdeId === 'sil_' + h.id ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
