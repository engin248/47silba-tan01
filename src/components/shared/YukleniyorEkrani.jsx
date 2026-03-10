'use client';
/**
 * 📌 YukleniyorEkrani — Paylaşılan Bileşen
 * Sayfalar yüklenirken gösterilecek spinner/skeleton.
 * 
 * Kullanım:
 *   if (yukleniyor) return <YukleniyorEkrani />;
 */
export default function YukleniyorEkrani({ mesaj = 'Veriler yükleniyor...' }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-semibold">{mesaj}</p>
        </div>
    );
}
