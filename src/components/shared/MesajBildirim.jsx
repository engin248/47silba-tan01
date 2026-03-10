'use client';
/**
 * 📌 MesajBildirim — Paylaşılan Bileşen
 * Başarı / Hata / Uyarı mesaj kutusu.
 * 
 * Kullanım:
 *   <MesajBildirim mesaj={mesaj} />
 *   mesaj = { text: 'İşlem tamam.', type: 'success' | 'error' | 'warning' }
 */
export default function MesajBildirim({ mesaj }) {
    if (!mesaj?.text) return null;

    const stiller = {
        success: 'border-emerald-500 bg-emerald-50 text-emerald-800',
        error:   'border-red-500 bg-red-50 text-red-800',
        warning: 'border-amber-500 bg-amber-50 text-amber-800',
    };

    return (
        <div className={`p-3 mb-4 rounded-xl border-2 font-bold text-sm ${stiller[mesaj.type] || stiller.success}`}>
            {mesaj.text}
        </div>
    );
}
