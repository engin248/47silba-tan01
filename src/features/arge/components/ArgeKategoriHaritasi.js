import { PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ArgeKategoriHaritasi({ products }) {
    if (!products || products.length === 0) {
        return (
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
                <h3 className="text-sm font-black text-[#8b949e] tracking-widest uppercase mb-2 flex items-center gap-2">
                    <PieChartIcon size={16} className="text-purple-500" /> [AR-03] Kategori Haritası
                </h3>
                <div className="h-[200px] w-full flex items-center justify-center">
                    <div className="text-xs text-gray-500">Veri bekleniyor...</div>
                </div>
            </div>
        );
    }

    const cats = {};
    products.forEach(p => {
        const k = p.kategori || 'DİĞER';
        cats[k] = (cats[k] || 0) + 1;
    });

    const pieData = Object.keys(cats).map(k => ({ name: k, value: cats[k] }));
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    return (
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
            <h3 className="text-sm font-black text-[#8b949e] tracking-widest uppercase mb-2 flex items-center gap-2">
                <PieChartIcon size={16} className="text-purple-500" /> [AR-03] Kategori Haritası
            </h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
