export default function TrendTab({ maliyetler }) {
    // Client-side aylık gruplama — maliyetler state'inden
    const aylikMap = {};
    maliyetler.forEach(k => {
        const t = new Date(k.created_at);
        const ayKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
        if (!aylikMap[ayKey]) aylikMap[ayKey] = { ay: ayKey, toplam: 0 };
        aylikMap[ayKey].toplam += parseFloat(k.tutar_tl || 0);
    });

    const aylar = Object.values(aylikMap).sort((a, b) => a.ay.localeCompare(b.ay)).slice(-12);

    return (
        <div className="animate-fade-in bg-[#122b27] border-2 border-[#1e4a43] rounded-2xl p-6 shadow-sm">
            <div className="text-[0.75rem] font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="text-xl">📈</span> [ML-05] Dönemsel Maliyet Trendi — Son 12 Ay
            </div>

            {aylar.length === 0 ? (
                <div className="text-center p-8 text-slate-400 font-bold border-2 border-dashed border-[#1e4a43] rounded-xl">
                    Henüz maliyet verisi yok.
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {aylar.map(a => {
                        const maxToplam = Math.max(...aylar.map(x => x.toplam));
                        const pct = maxToplam > 0 ? (a.toplam / maxToplam * 100) : 0;
                        const [yil, ay] = a.ay.split('-');
                        const ayAd = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][parseInt(ay)];

                        return (
                            <div key={a.ay} className="grid grid-cols-[80px_1fr_120px] items-center gap-4 group">
                                <div className="text-xs font-black text-emerald-200 text-right uppercase tracking-wider">{ayAd} {yil}</div>
                                <div className="h-6 bg-[#0b1d1a] rounded-md overflow-hidden border border-[#1e4a43]/50">
                                    <div
                                        className={`h-full rounded-md transition-all duration-1000 group-hover:brightness-110 ${pct > 75 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="text-sm font-black text-white text-right font-mono tracking-tight">
                                    ₺{a.toplam.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
