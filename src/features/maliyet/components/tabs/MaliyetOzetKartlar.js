export default function MaliyetOzetKartlar({ genelToplam, toplamlar, siparisFistiklari, onaysiz }) {
    const KARTLAR = [
        { label: '💰 GENEL TOPLAM', val: `₺${genelToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, color: 'text-white', bg: 'bg-slate-800/80', border: 'border-slate-700' },
        { label: '🧵 KUMAŞ / HAMMADDE', val: `₺${toplamlar.hammadde_kumas.toFixed(2)}`, color: 'text-violet-400', bg: 'bg-violet-950/30', border: 'border-violet-900/50' },
        { label: '👷 PERSONEL / İŞÇİLİK', val: `₺${toplamlar.personel_iscilik.toFixed(2)}`, color: 'text-sky-400', bg: 'bg-sky-950/30', border: 'border-sky-900/50' },
        { label: '🔥 FİRE EKSİ TAZMİNAT', val: `₺${toplamlar.fire_kaybi.toFixed(2)}`, color: 'text-rose-400', bg: 'bg-rose-950/30', border: 'border-rose-900/50' },
        { label: '📦 TOPLAM SİPARİŞ', val: `${siparisFistiklari.length} sipariş`, color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-900/50' },
        { label: '⏳ ONAY BEKLEYEN', val: `${onaysiz} kalem`, color: onaysiz > 0 ? 'text-amber-400' : 'text-emerald-400', bg: onaysiz > 0 ? 'bg-amber-950/30' : 'bg-emerald-950/30', border: onaysiz > 0 ? 'border-amber-900/50' : 'border-emerald-900/50' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {KARTLAR.map((k, i) => (
                <div key={i} className={`rounded-xl p-4 border transition-transform hover:-translate-y-1 shadow-sm ${k.bg} ${k.border}`}>
                    <div className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 line-clamp-1">{k.label}</div>
                    <div className={`text-lg lg:text-xl font-black ${k.color} tracking-tight`}>{k.val}</div>
                </div>
            ))}
        </div>
    );
}
