import { Database } from 'lucide-react';

export default function AjanlarMaliyetTab() {
    return (
        <div className="bg-[#122b27] rounded-3xl p-8 border-2 border-emerald-500/50 text-center animate-fade-in shadow-xl">
            <Database size={48} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-white font-black text-2xl mb-2">API Maliyet ve Token Takip Merkezi</h2>
            <p className="text-emerald-200 text-sm mb-8 max-w-2xl mx-auto">
                THE ORDER sisteminin merkezi yapay zeka ajanlarının harcadığı token miktarlarını ve anlık API (Gemini/Perplexity) maliyetlerini buradan izleyebilirsiniz.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                {/* Ayın Özeti */}
                <div className="bg-[#0b1d1a] border border-emerald-500 p-6 rounded-2xl shadow-inner text-center">
                    <div className="text-[0.65rem] text-emerald-400 font-extrabold uppercase tracking-widest mb-1">Dönem (MART) TOPLAM</div>
                    <div className="font-black text-4xl text-emerald-300">₺0.00</div>
                    <div className="mt-3 text-xs font-bold text-slate-400">Tahmini Kalan Limit: ₺15,000.00</div>
                </div>

                {/* Gemini Detay */}
                <div className="bg-[#0b1d1a] border border-[#1e4a43] p-6 rounded-2xl">
                    <div className="text-[0.65rem] text-blue-400 font-extrabold uppercase tracking-widest mb-3">GEMİNİ 1.5 PRO / FLASH YÜKÜ</div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-[#1e4a43]/50">
                            <span className="text-sm font-bold text-slate-300">Input Token (Girdi)</span>
                            <span className="text-sm font-black text-blue-300">0</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-[#1e4a43]/50">
                            <span className="text-sm font-bold text-slate-300">Output Token (Çıktı)</span>
                            <span className="text-sm font-black text-blue-300">0</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-xs font-black text-emerald-500 uppercase">Maliyet</span>
                            <span className="text-lg font-black text-white">₺0.00</span>
                        </div>
                    </div>
                </div>

                {/* Perplexity Detay */}
                <div className="bg-[#0b1d1a] border border-[#1e4a43] p-6 rounded-2xl">
                    <div className="text-[0.65rem] text-rose-400 font-extrabold uppercase tracking-widest mb-3">PERPLEXITY SONAR BATCH YÜKÜ</div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-[#1e4a43]/50">
                            <span className="text-sm font-bold text-slate-300">Arama İstekleri / Gün</span>
                            <span className="text-sm font-black text-rose-300">0</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-[#1e4a43]/50">
                            <span className="text-sm font-bold text-slate-300">Kaynak Tarama İnişi</span>
                            <span className="text-sm font-black text-rose-300">0</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-xs font-black text-emerald-500 uppercase">Maliyet</span>
                            <span className="text-lg font-black text-white">₺0.00</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
