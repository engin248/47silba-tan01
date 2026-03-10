'use client';
/**
 * MesajBanner — Üretim ve diğer sayfalarda başarı/hata banner'ı.
 * mesaj = { text: string, type: 'success' | 'error' | 'warning' }
 */

const STILLER = {
    success: 'border-emerald-500 bg-emerald-50 text-emerald-800',
    error: 'border-red-500 bg-red-50 text-red-800',
    warning: 'border-amber-500 bg-amber-50 text-amber-800',
    info: 'border-blue-500 bg-blue-50 text-blue-800',
};

export default function MesajBanner({ mesaj }) {
    if (!mesaj?.text) return null;
    return (
        <div className={`p-3 mb-4 rounded-xl border-2 font-bold text-sm animate-pulse-once ${STILLER[mesaj.type] || STILLER.success}`}>
            {mesaj.text}
        </div>
    );
}
