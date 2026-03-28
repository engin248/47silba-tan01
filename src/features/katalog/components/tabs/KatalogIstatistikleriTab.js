import { Package, Tag, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function KatalogIstatistikleriTab({ urunler }) {
    if (!urunler) return null;

    const aktifler = urunler.filter(u => u.durum === 'aktif');
    const tukenenler = urunler.filter(u => parseFloat(u.stok_adeti || 0) <= parseFloat(u.min_stok || 10));
    const toptanOrt = (urunler.reduce((s, u) => s + parseFloat(u.satis_fiyati_tl || 0), 0) / (urunler.length || 1)).toFixed(2);
    // [A-04] Marj Algoritması
    const cokKarli = urunler.filter((u) => {
        const mh = parseFloat(u.birim_maliyet_tl || 0);
        const st = parseFloat(u.satis_fiyati_tl || 0);
        if (mh > 0) return ((st - mh) / mh) * 100 > 50;
        return false;
    }).length;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#122b27] border border-[#1e4a43] p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <div className="text-[0.65rem] text-emerald-400 font-black uppercase mb-1 flex items-center gap-1"><Package size={12} /> Toplam Ürün</div>
                <div className="font-black text-white text-2xl">{urunler.length}</div>
            </div>
            <div className={`bg-[#122b27] border p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-1 ${tukenenler.length > 0 ? 'border-red-900 border-l-4' : 'border-[#1e4a43]'}`}>
                <div className={`text-[0.65rem] font-black uppercase mb-1 flex items-center gap-1 ${tukenenler.length > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                    <AlertTriangle size={12} /> Kritik Stok
                </div>
                <div className={`font-black text-2xl ${tukenenler.length > 0 ? 'text-red-500' : 'text-slate-300'}`}>{tukenenler.length}</div>
            </div>
            <div className="bg-[#122b27] border border-[#1e4a43] p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <div className="text-[0.65rem] text-blue-400 font-black uppercase mb-1 flex items-center gap-1"><Tag size={12} /> Ortalama Fiyat</div>
                <div className="font-black text-blue-500 text-2xl">₺{toptanOrt}</div>
            </div>
            <div className="bg-[#1e1423] border border-fuchsia-900 p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <div className="text-[0.65rem] text-fuchsia-400 font-black uppercase mb-1 flex items-center gap-1"><ShieldCheck size={12} /> Yüksek Marj (&gt;%50)</div>
                <div className="font-black text-fuchsia-500 text-2xl">{cokKarli}</div>
            </div>
        </div>
    );
}
