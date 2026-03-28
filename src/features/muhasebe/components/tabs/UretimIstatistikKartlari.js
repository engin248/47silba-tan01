export default function UretimIstatistikKartlari({ istatistik }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
                { label: 'Toplam Rapor', val: istatistik.toplam, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-950/30 border-emerald-900/50' },
                { label: '⏳ Onay Bekl.', val: istatistik.bekleyen, colorClass: 'text-amber-400', bgClass: 'bg-amber-950/30 border-amber-900/50' },
                { label: '✅ Onaylı', val: istatistik.onaylandi, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-950/30 border-emerald-900/50' },
                { label: '🔒 Kilitli', val: istatistik.kilitli, colorClass: 'text-white', bgClass: 'bg-[#0d1117] border-[#1e4a43]' },
            ].map((s, i) => (
                <div key={i} className={`${s.bgClass} border-2 rounded-2xl p-4 shadow-sm`}>
                    <div className="text-sm text-slate-400 font-black uppercase mb-1 tracking-widest">{s.label}</div>
                    <div className={`font-black text-2xl tracking-tight ${s.colorClass}`}>{s.val}</div>
                </div>
            ))}
        </div>
    );
}
