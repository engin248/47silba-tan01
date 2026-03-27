'use client';
/**
 * app/muhasebe/page.js — GİRİŞ NOKTASI (20 satır)
 * Tm UI   → features/muhasebe/components/MuhasebeMainContainer.js
 * Route    : /muhasebe
 */
import { MuhasebeMainContainer } from '@/features/muhasebe';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function MuhasebePage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ️ Muhasebe modl yklenirken hata oluştu.
            </p>
        }>
            <div className="min-h-screen font-sans bg-[#0d1117] text-white">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                    <MuhasebeMainContainer />
                </div>
            </div>
        </ErrorBoundary>
    );
}
