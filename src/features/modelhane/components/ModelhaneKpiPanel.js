import { Shirt, FileText, Clock, Factory, AlertTriangle } from 'lucide-react';

export default function ModelhaneKpiPanel() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {[
                { label: 'Şu Anki Numune Yükü', val: '12', desc: 'Dikilen Numuneler', color: 'text-purple-400', icon: Shirt },
                { label: 'M3 Kalıp Bekleyen', val: '4', desc: 'Onay Bekliyor', color: 'text-blue-400', icon: FileText },
                { label: 'Ort. İşçilik Süresi', val: '42 dk', desc: 'Tüm Modeller Ortalaması', color: 'text-emerald-400', icon: Clock },
                { label: 'Özel Makine İhtiyacı', val: '2', desc: 'Kritik Darboğaz Riski', color: 'text-amber-400', icon: Factory },
                { label: 'İmalat Hatası Öngörüsü', val: '%8.4', desc: 'Karargah Risk Ortalaması', color: 'text-rose-400', icon: AlertTriangle }
            ].map((s, i) => {
                const Icon = s.icon;
                return (
                    <div key={i} className="bg-[#161b22] border border-[#21262d] flex flex-col justify-between rounded-xl p-4 shadow-md">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-bold uppercase tracking-wider ${s.color}`}>{s.label}</span>
                            <Icon size={14} className={s.color} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white mt-1 border-b border-[#30363d] pb-1">{s.val}</div>
                            <div className="text-sm text-[#8b949e] font-semibold mt-2">{s.desc}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
