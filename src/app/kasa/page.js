'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/kasa/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/kasa/components/KasaMainContainer.js
 * Route    : /kasa
 */
import { KasaMainContainer } from '@/features/kasa';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function KasaPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Kasa modülü yüklenirken hata oluştu.
            </p>
        }>
<<<<<<< HEAD
            <div className="min-h-screen font-sans bg-[#0d1117] text-white">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }} dir={isAR ? 'rtl' : 'ltr'}>
                    <KasaMainContainer />
                </div>
            </div>
=======
            <KasaMainContainer />
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        </ErrorBoundary>
    );
}
