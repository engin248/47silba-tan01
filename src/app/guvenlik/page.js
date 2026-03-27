'use client';
import { useLang } from '@/context/langContext';
/**
 * app/guvenlik/page.js — GÝRÝÞ NOKTASI (20 satýr)
 * Tüm UI   › features/guvenlik/components/GuvenlikMainContainer.js
 * Route    : /guvenlik
 */
import { GuvenlikMainContainer } from '@/features/guvenlik';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function GuvenlikPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ?? Guvenlik modülü yüklenirken hata oluþtu.
            </p>
        }>
            <div className="min-h-screen font-sans bg-[#0d1117] text-white">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }} dir={isAR ? 'rtl' : 'ltr'}>
                    <GuvenlikMainContainer />
                </div>
            </div>
        </ErrorBoundary>
    );
}
