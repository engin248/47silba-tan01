import SilBastanModal from '@/components/ui/SilBastanModal';

export default function MusteriGecmisModali({
    timelineAcik,
    setTimelineAcik,
    seciliMusteri,
    timelineLoglari,
    yeniNot,
    setYeniNot,
    notEkle,
    notEkleniyor
}) {
    if (!seciliMusteri) return null;

    return (
        <SilBastanModal acik={timelineAcik} onClose={() => setTimelineAcik(false)} title={`İletişim Geçmişi / Zaman Tüneli — ${seciliMusteri?.ad_soyad}`}>
            <div className="bg-[#122b27] p-6 rounded-2xl shadow-inner border-2 border-[#1e4a43]">
                <div className="flex gap-2 mb-6">
                    <input
                        value={yeniNot}
                        onChange={e => setYeniNot(e.target.value)}
                        placeholder="Yeni görüşme notu, toplantı özeti veya hatırlatma..."
                        className="flex-1 px-4 py-3 bg-[#0d1117] border-2 border-[#1e4a43] rounded-xl text-white font-bold outline-none focus:border-emerald-500 transition-colors"
                        onKeyDown={e => e.key === 'Enter' && notEkle()}
                    />
                    <button
                        onClick={notEkle}
                        disabled={notEkleniyor}
                        className={`px-6 py-3 font-black text-white border-0 rounded-xl cursor-pointer shadow-md transition-all ${notEkleniyor ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                        Ekle
                    </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {timelineLoglari.length === 0 ? (
                        <p className="text-center text-slate-400 p-8 font-bold border-2 border-dashed border-[#1e4a43] rounded-xl bg-[#0b1d1a]">
                            Henüz bir iletişim geçmişi kaydı bulunmuyor.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-4 relative">
                            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[#1e4a43] z-0"></div>
                            {timelineLoglari.map(log => (
                                <div key={log.id} className="flex gap-4 relative z-10 transition-transform hover:translate-x-1">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 shadow-sm ${log.islem_tipi === 'NOT' ? 'bg-emerald-950 border-emerald-700 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                                        {log.islem_tipi === 'NOT' ? '📝' : '⚙️'}
                                    </div>
                                    <div className={`flex-1 p-4 rounded-xl shadow-sm border ${log.islem_tipi === 'NOT' ? 'bg-emerald-950/20 border-emerald-900' : 'bg-[#0d1117] border-[#1e4a43]'}`}>
                                        <div className="flex justify-between mb-2 items-center">
                                            <span className="text-xs font-black text-emerald-500">{log.kullanici_adi}</span>
                                            <span className="text-[0.65rem] text-slate-500 font-bold bg-[#122b27] px-2 py-0.5 rounded">{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="text-sm text-slate-300 font-bold leading-relaxed whitespace-pre-wrap">
                                            {log.islem_tipi === 'NOT' ? log.eski_veri?.mesaj : `${log.islem_tipi} işlemi gerçekleştirildi. ${log.eski_veri?.mesaj || ''}`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </SilBastanModal>
    );
}
