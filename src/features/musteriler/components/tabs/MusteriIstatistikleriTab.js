export default function MusteriIstatistikleriTab({ musteriler }) {
    if (!musteriler) return null;

    const istatistik = {
        toplam: musteriler.length,
        aktif: musteriler.filter(m => m.aktif !== false).length,
        karaListe: musteriler.filter(m => m.kara_liste === true).length,
        toptan: musteriler.filter(m => m.musteri_tipi === 'toptan').length,
        vip: musteriler.filter(m => (m.risk_limiti > 50000 || m.musteri_tipi === 'toptan' || ['VIP', 'A'].includes(m.segment))).length,
        potansiyel: musteriler.filter(m => m.segment === 'C' || !m.vergi_no).length
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 animate-fade-in">
            <div className="bg-[#122b27] border border-[#1e4a43] p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <div className="text-[0.65rem] text-[#10b981] font-black uppercase mb-1">👥 Toplam Müşteri</div>
                <div className="font-black text-white text-2xl">{istatistik.toplam}</div>
            </div>
            <div className="bg-[#122b27] border border-[#1e4a43] p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <div className="text-[0.65rem] text-emerald-400 font-black uppercase mb-1">✅ Aktif Olanlar</div>
                <div className="font-black text-emerald-500 text-2xl">{istatistik.aktif}</div>
            </div>
            <div className={`bg-[#122b27] border p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-1 ${istatistik.karaListe > 0 ? 'border-red-900 border-l-4' : 'border-[#1e4a43]'}`}>
                <div className={`text-[0.65rem] font-black uppercase mb-1 ${istatistik.karaListe > 0 ? 'text-red-500' : 'text-slate-500'}`}>🚫 Kara Liste</div>
                <div className={`font-black text-2xl ${istatistik.karaListe > 0 ? 'text-red-500' : 'text-slate-300'}`}>{istatistik.karaListe}</div>
            </div>
            <div className="bg-[#122b27] border border-[#1e4a43] p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <div className="text-[0.65rem] text-amber-500 font-black uppercase mb-1">🏭 Toptan Alıcılar</div>
                <div className="font-black text-amber-400 text-2xl">{istatistik.toptan}</div>
            </div>
            {/* [MS-02] RFM: VIP Segmentasyon */}
            <div className="bg-[#1e1423] border border-fuchsia-900 p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <div className="text-[0.65rem] text-fuchsia-400 font-black uppercase mb-1">⭐️ VIP Müşteriler</div>
                <div className="font-black text-fuchsia-500 text-2xl">{istatistik.vip}</div>
            </div>
            {/* [MS-02] Potansiyel (C Segment) */}
            <div className="bg-[#1c1917] border border-orange-900 p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <div className="text-[0.65rem] text-orange-400 font-black uppercase mb-1">🎯 Potansiyel</div>
                <div className="font-black text-orange-500 text-2xl">{istatistik.potansiyel}</div>
            </div>
        </div>
    );
}
