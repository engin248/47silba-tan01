'use client';
import { Search, Zap, Globe, Tag, CheckCircle2, AlertTriangle, PackageSearch } from 'lucide-react';
import { useState } from 'react';

/**
 * M1_AramaMotoru.js
 * Hermes V2 AI arama kutusu — Perplexity Sonar tetikleyicisi
 * THE ORDER Özel Filtreleri (TailwindCSS Optimized)
 */
export default function M1_AramaMotoru({ aiSorgu, setAiSorgu, trendAra, aiAraniyor, aiAjanDurumu, isAR }) {
    const HIZLI_ARAMALAR = isAR
        ? ['قمصان كتان صيفية 2026', 'سراويل بوجاتي', 'فساتين عباءة', 'ملابس رياضية نسائية']
        : ['2026 Yazlık Keten Gömlek', 'Baggy Pantolon Erkek', 'Elbise Vintage', 'Kadın Spor Giyim'];

    const [filtreler, setFiltreler] = useState({
        medyaAlgisi: true,
        rakipHata: true,
        m2Stok: false
    });

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !aiAraniyor) trendAra();
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-emerald-900/40 rounded-2xl p-5 mb-6 shadow-2xl relative overflow-hidden group">
            {/* Altın Parıltı Efekti */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/10 transition-colors duration-1000"></div>

            {/* Başlık */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                    <Zap size={20} className="text-emerald-100" />
                </div>
                <div>
                    <span className="text-white font-black text-base tracking-wide flex items-center gap-2">
                        {isAR ? 'محرك البحث عن الاتجاهات (Hermes V2)' : 'Hermes V2 — Ajan İstihbarat Ağı'}
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs uppercase rounded border border-amber-500/20">C2M Core</span>
                    </span>
                    <div className="text-xs text-slate-400 font-bold mt-0.5">
                        {isAR ? 'Perplexity Sonar · تحليل السوق' : 'Açık Kaynak İstihbarat · Pazar ve Rakip Taraması'}
                    </div>
                </div>
            </div>

            {/* THE ORDER Vize Parametreleri (Kalkanlar) */}
            <div className="flex gap-2 mb-3">
                <button
                    onClick={() => setFiltreler(f => ({ ...f, medyaAlgisi: !f.medyaAlgisi }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-black uppercase transition-all border ${filtreler.medyaAlgisi ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-300' : 'bg-slate-800/80 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                >
                    <CheckCircle2 size={12} className={filtreler.medyaAlgisi ? 'text-emerald-400' : ''} />
                    Sosyal Medya Onayı
                </button>
                <button
                    onClick={() => setFiltreler(f => ({ ...f, rakipHata: !f.rakipHata }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-black uppercase transition-all border ${filtreler.rakipHata ? 'bg-amber-900/40 border-amber-500/50 text-amber-300' : 'bg-slate-800/80 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                >
                    <AlertTriangle size={12} className={filtreler.rakipHata ? 'text-amber-400' : ''} />
                    Rakip Kök Hata (Şikayet)
                </button>
                <button
                    onClick={() => setFiltreler(f => ({ ...f, m2Stok: !f.m2Stok }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-black uppercase transition-all border ${filtreler.m2Stok ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' : 'bg-slate-800/80 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                >
                    <PackageSearch size={12} className={filtreler.m2Stok ? 'text-blue-400' : ''} />
                    M2 Kumaş Deposu Uyumu
                </button>
            </div>

            {/* Ana arama kutusu */}
            <div className={`flex gap-3 mb-4 ${isAR ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-1 relative flex items-center">
                    <Search size={18} className={`text-slate-500 absolute ${isAR ? 'right-4' : 'left-4'}`} />
                    <input
                        value={aiSorgu}
                        onChange={(e) => setAiSorgu(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isAR ? 'ابحث عن منتج... (مثال: قميص كتان صيفي)' : 'Ürün veya Kategori Ara... (Örn: Erkek Kargo Pantolon)'}
                        maxLength={150}
                        className={`w-full py-3 bg-slate-950/50 border-2 border-slate-700 rounded-xl text-white text-sm font-bold outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500 placeholder:font-semibold ${isAR ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4'}`}
                        dir="auto"
                    />
                </div>
                <button
                    onClick={trendAra}
                    disabled={aiAraniyor || !aiSorgu.trim()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all whitespace-nowrap shadow-lg ${aiAraniyor || !aiSorgu.trim()
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-emerald-50 border border-emerald-400/50 shadow-[0_0_15px_rgba(5,150,105,0.4)] hover:shadow-[0_0_20px_rgba(5,150,105,0.6)]'
                        }`}
                >
                    {aiAraniyor ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {isAR ? 'جارٍ البحث...' : 'İstihbarat Toplanıyor'}
                        </>
                    ) : (
                        <>
                            <Globe size={16} />
                            {isAR ? 'تحليل' : 'TARAMAYI BAŞLAT'}
                        </>
                    )}
                </button>
            </div>

            {/* DİNAMİK AJAN DURUMU */}
            {aiAraniyor && aiAjanDurumu && (
                <div className="mb-4 px-4 py-2 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r shadow-inner flex items-center gap-3 animate-pulse">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]" />
                    <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider">{aiAjanDurumu}</span>
                </div>
            )}

            {/* Hızlı arama butonları */}
            <div className="flex gap-2 flex-wrap">
                {HIZLI_ARAMALAR.map((sorgu, i) => (
                    <button
                        key={i}
                        onClick={() => setAiSorgu(sorgu)}
                        className="bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-600/50 px-3 py-1.5 rounded-full text-sm font-black flex items-center gap-1.5 transition-colors uppercase"
                    >
                        <Tag size={10} />
                        {sorgu}
                    </button>
                ))}
            </div>
        </div>
    );
}
