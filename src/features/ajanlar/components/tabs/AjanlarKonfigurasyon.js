import { Settings, ToggleRight, ToggleLeft, Clock } from 'lucide-react';

export default function AjanlarKonfigurasyon({ konfig, gorevToggle, telegramBildirim, goster, yukle }) {
    return (
        <div className="animate-fade-in">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 mb-5 flex gap-3 items-center">
                <Settings size={18} className="text-orange-500" />
                <div>
                    <div className="font-extrabold text-orange-800 text-sm">Koordinatör Yapılandırma Paneli</div>
                    <div className="text-xs text-orange-900">Her ajanın hangi görevi yapacağını buradan belirleyin. Pasif görevler çalıştırılmaz.</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(konfig).map(([ajanKey, ajan]) => {
                    const aktifSayisi = ajan.gorevler.filter(g => g.aktif).length;
                    return (
                        <div key={ajanKey} className="bg-[#122b27] rounded-2xl border-2 border-[#1e4a43] overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b-2 border-slate-50 flex justify-between items-center" style={{ backgroundColor: `${ajan.renk}10` }}>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-2xl">{ajan.ikon}</span>
                                    <div>
                                        <div className="font-black text-white text-sm">{ajan.isim}</div>
                                        <div className="text-[0.65rem] text-emerald-200">{aktifSayisi}/{ajan.gorevler.length} görev aktif</div>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 items-center">
                                    <div className={`w-2 h-2 rounded-full ${aktifSayisi > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                    <span className={`text-[0.65rem] font-bold ${aktifSayisi > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {aktifSayisi > 0 ? 'AKTİF' : 'PASİF'}
                                    </span>
                                </div>
                            </div>

                            <div className="py-2">
                                {ajan.gorevler.map(gorev => (
                                    <div key={gorev.id} className="flex items-center gap-2.5 px-4 py-2 border-b border-slate-50/10 hover:bg-slate-50/5 transition-colors">
                                        <button onClick={() => gorevToggle(ajanKey, gorev.id)} className="bg-transparent border-0 cursor-pointer p-0 flex items-center shrink-0">
                                            {gorev.aktif ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-slate-400" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-xs font-bold leading-tight ${gorev.aktif ? 'text-white' : 'text-slate-500'}`}>{gorev.ad}</div>
                                            <div className="text-[0.6rem] mt-0.5 flex items-center gap-1.5 text-slate-400">
                                                <span className="bg-[#173a34] px-1.5 py-0.5 rounded font-mono">{gorev.tablo}</span>
                                                {!gorev.aktif && gorev.neden_pasif && <span className="text-amber-500">⚠️ {gorev.neden_pasif}</span>}
                                            </div>
                                        </div>
                                        <span className={`text-[0.6rem] font-extrabold px-2 py-0.5 rounded-lg shrink-0 ${gorev.aktif ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>
                                            {gorev.aktif ? '✓ AKTİF' : '✗ PASİF'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Vercel Cron */}
            <div className="mt-5 bg-[#0b1d1a] rounded-2xl p-5 border-2 border-slate-200/20">
                <div className="flex items-center gap-2.5 mb-4">
                    <Clock size={20} className="text-blue-500" />
                    <div>
                        <div className="text-sm font-extrabold text-white">Zamanlanmış Ajan Görevleri (Cron Jobs)</div>
                        <div className="text-xs text-emerald-200">Ajanların belirli saatlerde otomatik uyanıp görev almasını sağlayan sistem uç noktaları.</div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-[#122b27] border border-slate-300/30 rounded-xl p-3">
                        <div className="flex justify-between mb-2">
                            <div className="font-extrabold text-amber-500 text-xs">🌅 Sabah Operasyonu (08:00)</div>
                            <span className="text-[0.65rem] bg-[#173a34] text-emerald-200 px-1.5 py-0.5 rounded font-mono">0 8 * * *</span>
                        </div>
                        <div className="text-[0.7rem] text-emerald-200 mb-3">Tüm gece üretimini toparlar, dünkü verilerle güne başlama özeti oluşturur.</div>
                        <button onClick={() => { telegramBildirim('⏰ Manuel tetikleme: Sabah Cron Job çalıştırıldı.'); goster('Sabah cronu manuel tetiklendi.', 'success'); fetch('/api/cron-ajanlar?gorev=sabah_ozeti', { credentials: 'include' }).then(() => yukle()); }} className="w-full py-1.5 bg-amber-50 border border-amber-300 text-amber-600 rounded-lg font-bold text-[0.75rem] cursor-pointer hover:bg-amber-100 transition-colors">Dürt & Manuel Tetikle</button>
                    </div>

                    <div className="bg-[#122b27] border border-slate-300/30 rounded-xl p-3">
                        <div className="flex justify-between mb-2">
                            <div className="font-extrabold text-indigo-500 text-xs">🌌 Gece Yedekleme (03:00)</div>
                            <span className="text-[0.65rem] bg-[#173a34] text-emerald-200 px-1.5 py-0.5 rounded font-mono">0 3 * * *</span>
                        </div>
                        <div className="text-[0.7rem] text-emerald-200 mb-3">Günlük tabloları sıkıştırır, eski logları arşive kaldırır ve bakım yapar.</div>
                        <button onClick={() => { telegramBildirim('⏰ Manuel tetikleme: Gece Cron Job çalıştırıldı.'); goster('Gece cronu manuel tetiklendi.', 'success'); fetch('/api/cron-ajanlar?gorev=gece_yedekleme_ve_temizlik', { credentials: 'include' }).then(() => yukle()); }} className="w-full py-1.5 bg-indigo-50 border border-indigo-300 text-indigo-600 rounded-lg font-bold text-[0.75rem] cursor-pointer hover:bg-indigo-100 transition-colors">Dürt & Manuel Tetikle</button>
                    </div>

                    <div className="bg-[#122b27] border-2 border-red-500 rounded-xl p-3">
                        <div className="flex justify-between mb-2">
                            <div className="font-black text-red-500 text-xs">⚡ BATCH AI (Toplu Yapay Zeka İstekleri)</div>
                            <span className="text-[0.65rem] bg-red-950 text-red-300 px-1.5 py-0.5 rounded font-mono">2 Saatte 1</span>
                        </div>
                        <div className="text-[0.7rem] text-red-300 mb-3">API maliyetini %95 düşürür. Tüm bekleyen işleri paket yapıp tek seferde LLM'e yollar.</div>
                        <button onClick={async () => {
                            goster('Toplu AI Görevi (Batch) başlatıldı...', 'success');
                            try {
                                const r = await fetch('/api/batch-ai', { method: 'POST' });
                                const d = await r.json();
                                goster(d.mesaj || 'Batch işlem bitti.', d.basarili ? 'success' : 'error');
                                yukle();
                            } catch (e) { goster('Batch hatası: ' + e.message, 'error'); }
                        }} className="w-full py-1.5 bg-red-50 border border-red-400 text-red-600 rounded-lg font-black text-[0.78rem] cursor-pointer hover:bg-red-100 transition-colors shadow-sm">🚀 Toplu AI Kuyruğunu Çalıştır</button>
                    </div>
                </div>
            </div>

            <div className="mt-5 bg-[#122b27] rounded-2xl p-5 border-2 border-[#1e4a43] flex gap-8 flex-wrap justify-between items-center">
                <div className="text-[0.75rem] font-extrabold text-emerald-200 uppercase">📊 Toplam Görev Özeti</div>
                <div className="flex gap-8">
                    {Object.values(konfig).map(ajan => {
                        const aktif = ajan.gorevler.filter(g => g.aktif).length;
                        const toplam = ajan.gorevler.length;
                        return (
                            <div key={ajan.isim} className="text-center">
                                <div className="text-xl">{ajan.ikon}</div>
                                <div className="text-[0.65rem] font-bold text-emerald-200">{ajan.isim}</div>
                                <div className={`text-[0.85rem] font-black ${aktif > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>{aktif}/{toplam}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
