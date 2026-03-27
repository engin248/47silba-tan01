'use client';
import { useLang } from '@/context/langContext';
/**
 * app/raporlar/page.js — GÝRÝÞ NOKTASI (20 satýr)
 * Tüm UI   › features/raporlar/components/RaporlarMainContainer.js
 * Route    : /raporlar
 */
import { RaporlarMainContainer } from '@/features/raporlar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RaporlarPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ?? Raporlar modülü yüklenirken hata oluþtu.
            </p>
        }>
            <div className="min-h-screen font-sans bg-[#0d1117] text-white">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }} dir={isAR ? 'rtl' : 'ltr'}>
                    <RaporlarMainContainer />
                </div>
            </div>
        </ErrorBoundary>
    );
}
