import { Scissors, Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default function KesimUstPanel({
    isAR, formAcik, setFormAcik, istatistik,
    arama, setArama, filtreDurum, setFiltreDurum, filtrelenmisLength
}) {
    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #21262d', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                        <Scissors size={24} color="white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight m-0 uppercase flex items-center gap-3">
                            {isAR ? 'غرفة القص والعمليات الوسيطة' : 'M5 Kesimhane'}
                        </h1>
                        <p className="text-xs font-bold text-emerald-300 mt-1 uppercase tracking-wider">
                            {isAR ? 'وحدة العمليات M5' : 'Hassas kesim, pastal işlemleri ve üretim bandı hazırlığı (M5)'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setFormAcik(!formAcik)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2">
                        <Plus size={18} /> {isAR ? 'قص جديد' : 'Yeni Kesim'}
                    </button>
                    <Link href="/uretim" style={{ textDecoration: 'none' }}>
                        <button className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2">
                            ⚙️ Üretim Bandı (M6)
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Toplam Kayıt', val: istatistik.toplam, color: 'text-emerald-400' },
                    { label: '✂️ Kesimde', val: istatistik.kesimde, color: 'text-amber-400' },
                    { label: '✅ Tamamlandı', val: istatistik.tamamlandi, color: 'text-blue-400' },
                    { label: 'Toplam Adet', val: istatistik.toplamAdet, color: 'text-gray-300' },
                ].map((s, i) => (
                    <div key={i} className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                        <div className={`text-sm font-bold uppercase tracking-wider ${s.color} mb-2`}>{s.label}</div>
                        <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 mb-6 flex-wrap items-center bg-[#161b22] border border-[#21262d] p-3 rounded-xl">
                <div className="relative flex-1 min-w-[220px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
                    <input type="text" value={arama} onChange={e => setArama(e.target.value)}
                        placeholder="Model, kesimci adına göre ara..."
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:border-emerald-500 outline-none transition-colors" />
                </div>
                {[['hepsi', 'Tümü'], ['kesimde', '✂️ Kesimde'], ['tamamlandi', '✅ Tamamlandı'], ['iptal', '❌ İptal']].map(([v, l]) => (
                    <button key={v} onClick={() => setFiltreDurum(v)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filtreDurum === v ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50' : 'bg-[#0d1117] text-[#8b949e] border border-[#30363d] hover:text-white'}`}>
                        {l}
                    </button>
                ))}
                <span className="text-xs text-[#8b949e] font-bold ml-auto">{filtrelenmisLength} kayıt</span>
            </div>
        </>
    );
}
