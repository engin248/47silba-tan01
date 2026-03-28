import { Search } from 'lucide-react';

export default function StokGridTab({
    stokEnvanteri,
    arama,
    setArama,
    setYeniHareket,
    setFormAcik,
    showMessage,
    BOSH_HAREKET,
    erisim,
    isAR
}) {
    const filtrelenmisStok = stokEnvanteri.filter(s =>
        s.urun_kodu?.toLowerCase().includes(arama.toLowerCase()) ||
        s.urun_adi?.toLowerCase().includes(arama.toLowerCase())
    );

    return (
        <div className="mb-10">
            {/* STK-02: FIFO Politikası */}
            <div className="flex items-center gap-3 bg-amber-950/20 border-2 border-amber-900/50 rounded-xl p-4 mb-4 flex-wrap">
                <span className="text-xl">📦</span>
                <div className="flex-1">
                    <div className="text-[0.72rem] font-black text-amber-500 uppercase tracking-widest">Stok Politikası: FIFO (İlk Giren İlk Çıkar) — STK-02</div>
                    <div className="text-[0.68rem] text-amber-300/80 font-bold mt-1">
                        Aktif: <span className="font-black text-amber-400">{stokEnvanteri.filter(s => s.net_stok > 0).length}/{stokEnvanteri.length}</span> kalem &nbsp;|&nbsp;
                        Toplam: <span className="font-black text-emerald-500">{stokEnvanteri.reduce((s, u) => s + (u.net_stok || 0), 0)} adet</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const c = 'Urun Kodu,Urun Adi,Net Stok,Min Stok\n' + stokEnvanteri.map(u => u.urun_kodu + ',' + u.urun_adi + ',' + u.net_stok + ',' + u.min_stok).join('\n');
                        const b = new Blob(['\uFEFF' + c], { type: 'text/csv;charset=utf-8;' });
                        const l = document.createElement('a'); l.href = URL.createObjectURL(b);
                        l.download = 'stok_sayim_' + new Date().toISOString().slice(0, 10) + '.csv'; l.click();
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-black text-xs cursor-pointer shadow-md transition-colors whitespace-nowrap border-0"
                >
                    📋 Sayım Formu (STK-04)
                </button>
            </div>

            {/* ARAMA VE BARKOD */}
            <div className="flex gap-4 mb-6 flex-wrap">
                <div className="relative flex-1 min-w-[280px] max-w-[450px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        value={arama} onChange={e => setArama(e.target.value)}
                        placeholder={isAR ? 'ابحث عن المنتج برمز المنتج...' : 'Ürün Kodu veya Adı ile Ara...'}
                        className="w-full bg-[#122b27] border-2 border-[#1e4a43] text-white font-bold text-sm py-3 pl-10 pr-4 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>
                {erisim === 'full' && (
                    <div className="relative flex-1 min-w-[280px] max-w-[300px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500 font-black">||\||</span>
                        <input type="text" placeholder="Barkod Okut (ST-06)..."
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (!val) return;
                                    const urun = stokEnvanteri.find(u => u.urun_kodu?.toLowerCase() === val.toLowerCase() || u.urun_adi?.toLowerCase() === val.toLowerCase());
                                    if (urun) {
                                        setYeniHareket({ ...BOSH_HAREKET, urun_id: urun.id });
                                        setFormAcik(true);
                                        showMessage(`Barkod Okundu: ${urun.urun_adi}`);
                                    } else showMessage('⚠️ Ürün bulunamadı!', 'error');
                                    e.currentTarget.value = '';
                                }
                            }}
                            className="w-full bg-sky-950/20 border-2 border-sky-900/50 text-white font-black text-sm py-3 pl-12 pr-4 rounded-xl outline-none focus:border-sky-500 transition-colors placeholder:text-sky-700"
                        />
                    </div>
                )}
            </div>

            {/* GRID ENVANTER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtrelenmisStok.map(stok => {
                    const kritikLimiti = stok.min_stok || 10;
                    const kritikMi = stok.net_stok <= kritikLimiti;

                    return (
                        <div key={stok.id} className={`bg-[#0d1117] border-2 rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1 ${kritikMi ? 'border-red-900/50' : 'border-[#1e4a43]'}`}>
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <span className="text-[0.65rem] font-black bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900">KOD: {stok.urun_kodu}</span>
                                            {kritikMi && <span className="text-[0.65rem] font-black bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-900 animate-pulse">KRİTİK STOK</span>}
                                        </div>
                                        <h3 className="font-black text-lg text-white m-0 leading-tight line-clamp-2">{stok.urun_adi}</h3>
                                        {isAR && stok.urun_adi_ar && <p className="text-xs text-emerald-200 mt-1 font-bold" dir="rtl">{stok.urun_adi_ar}</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 pt-4 border-t border-[#1e4a43]/50 flex justify-between items-end">
                                <div>
                                    <div className="text-[0.6rem] text-emerald-400 font-black tracking-widest uppercase mb-1">{isAR ? 'المخزون الفعلي' : 'GERÇEK ZAMANLI STOK'}</div>
                                    <div className={`font-black text-3xl leading-none ${kritikMi ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {stok.net_stok} <span className="text-sm text-slate-500">{isAR ? 'قطعة' : 'Adet'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[0.65rem] text-slate-500 font-black uppercase tracking-wider mb-1">{isAR ? 'السعر' : 'Değer'}</div>
                                    <div className="font-black text-slate-300 text-sm">₺{stok.satis_fiyati_tl || 0}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
