export default function BilancoTab() {
    return (
        <div className="bg-[#122b27] p-6 rounded-2xl border border-[#1e4a43] shadow-xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-[#1e4a43] pb-4 mb-6">
                <div>
                    <h2 className="text-xl font-black text-white m-0 tracking-tight flex items-center gap-3">
                        ⚖️ BİLANÇO DENGESİ (AKTİF / PASİF)
                    </h2>
                    <p className="text-emerald-400 font-bold mt-1 text-sm uppercase tracking-widest">
                        [MU-06] Gerçek Zamanlı Varlık & Kaynak Özeti
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-black text-emerald-200 bg-[#0b1d1a] px-3 py-1.5 rounded-lg border border-[#1e4a43]">
                        Dönem: 2026/03
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AKTİF SÜTUNU */}
                <div className="space-y-4">
                    <div className="bg-[#0b1d1a] px-4 py-3 rounded-xl border border-emerald-900/50 flex justify-between items-center shadow-inner">
                        <h3 className="text-lg font-black text-emerald-400 m-0 uppercase tracking-widest">AKTİF (VARLIKLAR)</h3>
                        <span className="text-sm font-black text-emerald-200">1 Dönem</span>
                    </div>

                    <div className="space-y-3 pl-2">
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-white">100 Kasa</div>
                            <div className="text-base font-black text-emerald-300 font-mono">₺1,245,600.00</div>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-white">102 Bankalar</div>
                            <div className="text-base font-black text-emerald-300 font-mono">₺4,850,230.50</div>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-white">120 Alıcılar (Müşteriler)</div>
                            <div className="text-base font-black text-emerald-300 font-mono">₺895,450.00</div>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-emerald-400 tracking-wider">TOPLAM DÖNEN VARLIKLAR</div>
                            <div className="text-lg font-black text-emerald-400 font-mono">₺6,991,280.50</div>
                        </div>
                        <div className="h-4"></div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-white">253 Tesis, Makine ve Cihazlar</div>
                            <div className="text-base font-black text-emerald-300 font-mono">₺3,200,000.00</div>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-emerald-400 tracking-wider">TOPLAM DURAN VARLIKLAR</div>
                            <div className="text-lg font-black text-emerald-400 font-mono">₺3,200,000.00</div>
                        </div>
                    </div>

                    <div className="bg-emerald-900/40 p-4 rounded-xl border-t-4 border-emerald-500 flex justify-between items-center mt-6">
                        <div className="text-xl font-black text-white">AKTİF TOPLAMI</div>
                        <div className="text-2xl font-black text-emerald-400 font-mono">₺10,191,280.50</div>
                    </div>
                </div>

                {/* PASİF SÜTUNU */}
                <div className="space-y-4">
                    <div className="bg-[#0b1d1a] px-4 py-3 rounded-xl border border-amber-900/50 flex justify-between items-center shadow-inner">
                        <h3 className="text-lg font-black text-amber-500 m-0 uppercase tracking-widest">PASİF (KAYNAKLAR)</h3>
                        <span className="text-sm font-black text-amber-200">1 Dönem</span>
                    </div>

                    <div className="space-y-3 pl-2">
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-white">300 Banka Kredileri</div>
                            <div className="text-base font-black text-amber-400 font-mono">₺1,500,000.00</div>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-white">320 Satıcılar (Tedarikçiler)</div>
                            <div className="text-base font-black text-amber-400 font-mono">₺1,245,600.00</div>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-white">335 Personele Borçlar</div>
                            <div className="text-base font-black text-amber-400 font-mono">₺180,450.00</div>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-amber-500 tracking-wider">KISA VADELİ YABANCI KAYNAKLAR</div>
                            <div className="text-lg font-black text-amber-500 font-mono">₺2,926,050.00</div>
                        </div>
                        <div className="h-4"></div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-white">500 Sermaye</div>
                            <div className="text-base font-black text-amber-400 font-mono">₺5,000,000.00</div>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-white">590 Dönem Net Kârı</div>
                            <div className="text-base font-black text-emerald-400 font-mono">₺2,265,230.50</div>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e4a43]/50 pb-2">
                            <div className="text-sm font-bold text-amber-500 tracking-wider">ÖZ KAYNAKLAR</div>
                            <div className="text-lg font-black text-amber-500 font-mono">₺7,265,230.50</div>
                        </div>
                    </div>

                    <div className="bg-amber-900/20 p-4 rounded-xl border-t-4 border-amber-600 flex justify-between items-center mt-6">
                        <div className="text-xl font-black text-white">PASİF TOPLAMI</div>
                        <div className="text-2xl font-black text-amber-500 font-mono">₺10,191,280.50</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
