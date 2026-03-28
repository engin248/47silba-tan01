import { CheckCircle2, AlertTriangle, Send, Bot } from 'lucide-react';

export default function AjanlarIstatistikCards({ istatistik }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            {[
                { label: 'Toplam', val: istatistik.toplam, renk: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                { label: 'Bekliyor', val: istatistik.bekliyor, renk: 'text-emerald-200', bg: 'bg-[#0d1117] text-white', border: 'border-slate-100' },
                { label: 'Çalışıyor', val: istatistik.calisıyor, renk: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
                { label: 'Tamamlandı', val: istatistik.tamamlandi, renk: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                { label: 'Hata', val: istatistik.hata, renk: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
                { label: 'Başarı (%)', val: (istatistik.tamamlandi + istatistik.hata) > 0 ? `%${Math.round((istatistik.tamamlandi / (istatistik.tamamlandi + istatistik.hata)) * 100)}` : '%0', renk: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            ].map((k, i) => (
                <div key={i} className={`${k.bg} border-2 ${k.border} rounded-xl p-3.5 text-center`}>
                    <div className="text-xs text-emerald-800 font-extrabold uppercase mb-1 tracking-wider">{k.label}</div>
                    <div className={`font-black text-2xl md:text-3xl leading-none ${k.renk}`}>{k.val}</div>
                </div>
            ))}
        </div>
    );
}
