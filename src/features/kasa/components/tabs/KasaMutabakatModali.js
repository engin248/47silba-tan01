export default function KasaMutabakatModali({ sayimFormuAcik, setSayimFormuAcik, netBakiye }) {
    if (!sayimFormuAcik) return null;

    return (
        <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                <h3 className="font-black text-emerald-400 uppercase tracking-widest text-lg">[KK-02] GÜN SONU KASA MUTABAKATI & SAYIMI</h3>
                <button onClick={() => setSayimFormuAcik(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 text-center border-b border-slate-800 pb-2">Sistemdeki Yazılı Kasa (₺)</h4>
                    <div className="text-center text-4xl font-black text-emerald-500 font-mono tracking-tighter">₺{netBakiye.toFixed(2)}</div>
                </div>
                <div className="bg-[#122b27] border border-emerald-900 p-4 rounded-xl flex flex-col justify-center gap-2">
                    <h4 className="text-sm font-bold text-emerald-500 uppercase mb-1 border-b border-emerald-900/50 pb-2">Fiziki Para Sayımı (₺)</h4>
                    <input type="number" placeholder="Saydığınız TL..." className="w-full bg-[#0d1117] text-white font-black text-2xl px-4 py-3 rounded-lg border-2 border-emerald-700 outline-none focus:border-emerald-400" />
                    <p className="text-[10px] text-slate-500 uppercase font-bold text-center mt-1">Sistem ve fiziki para eşleşmiyorsa muhasebe fişi (Eksik/Fazla) kesilecektir.</p>
                </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => { setSayimFormuAcik(false); window.print(); }} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-2 rounded-lg text-sm uppercase cursor-pointer">Z Raporu Çıktısı Al 🖨️</button>
                <button onClick={() => { alert('Sayım beyanı Yöneticiye onay için gönderildi.'); setSayimFormuAcik(false); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-2 rounded-lg text-sm uppercase cursor-pointer">Mutabakatı Onayla ✓</button>
            </div>
        </div>
    );
}
