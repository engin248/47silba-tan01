import { Layers, Plus } from 'lucide-react';

export default function KumasUstPanel({ kumasRaporu }) {
    const aktifKodSayisi = kumasRaporu?.length || 0;
    const tekTedarikciSayisi = kumasRaporu?.filter(k => k.durum === 'riskli').length || 0;

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#21262d] pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                        <Layers size={24} className="text-emerald-50" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight m-0 uppercase flex items-center gap-3">
                            M2: Malzeme & Kumaş Kütüphanesi
                        </h1>
                        <p className="text-xs font-bold text-emerald-300 mt-1 uppercase tracking-wider">
                            Aşama 2: Tedarik Riski & Maliyet Filtresi (Kural: Tek Tedarikçi = RİSK)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2">
                        <Plus size={16} /> YENİ MATERYAL GİRİŞİ
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Aktif Kod Sayısı', val: aktifKodSayisi, desc: 'Sisteme Kayıtlı Materyal', color: 'text-emerald-400' },
                    { label: 'Tek Tedarikçi (RİSK)', val: tekTedarikciSayisi, desc: 'Alternatifi Yok (Ted. Riski)', color: 'text-rose-400' },
                    { label: 'Sürekli Kumaş', val: '158', desc: 'Kesintisiz Tedarik Devamı', color: 'text-blue-400' },
                    { label: 'Yüksek MOQ', val: '5', desc: 'Minimum Sipariş Riski', color: 'text-amber-400' }
                ].map((s, i) => (
                    <div key={i} className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                        <span className={`text-sm font-bold uppercase tracking-wider ${s.color}`}>{s.label}</span>
                        <div className="text-2xl font-black text-white mt-2 border-b border-[#30363d] pb-2">{s.val}</div>
                        <div className="text-sm text-[#8b949e] font-semibold mt-2">{s.desc}</div>
                    </div>
                ))}
            </div>
        </>
    );
}
