'use client';
/**
 * 📌 SayfaBasligi — Paylaşılan Bileşen
 * Tüm modül sayfalarının üst başlık alanı.
 * 
 * Kullanım:
 *   <SayfaBasligi ikon={<Factory />} baslik="Üretim Bandı" altbaslik="5 Departman" />
 */
export default function SayfaBasligi({ ikon, baslik, altbaslik, sagIcerik }) {
    return (
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
                {ikon && (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg">
                        <span className="text-white">{ikon}</span>
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">{baslik}</h1>
                    {altbaslik && (
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{altbaslik}</p>
                    )}
                </div>
            </div>
            {sagIcerik && <div>{sagIcerik}</div>}
        </div>
    );
}
