import { Zap } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function ArgeTrendRadar({ products }) {
    if (!products || products.length === 0) {
        return (
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
                <h3 className="text-sm font-black text-[#8b949e] tracking-widest uppercase mb-2 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" /> [AR-02] Trend Radar
                </h3>
                <div className="h-[220px] w-full flex items-center justify-center">
                    <div className="text-xs text-gray-500">Veri bekleniyor...</div>
                </div>
            </div>
        );
    }

    const cats = {};
    products.forEach(p => {
        const k = p.kategori || 'DİĞER';
        if (!cats[k]) cats[k] = { kat: k, toplam: 0, adet: 0 };
        cats[k].toplam += (p.satar_satmaz_skoru || 50);
        cats[k].adet++;
    });

    const radarData = Object.values(cats).map(c => ({
        subject: c.kat.substring(0, 10),
        A: Math.round(c.toplam / c.adet),
        fullMark: 100
    })).slice(0, 6);

    return (
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
            <h3 className="text-sm font-black text-[#8b949e] tracking-widest uppercase mb-2 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" /> [AR-02] Trend Radar
            </h3>
            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                        <PolarGrid stroke="#30363d" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Skor" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
