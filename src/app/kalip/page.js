'use client';
/**
 * app/kalip/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/kalip/components/KalipMainContainer.js
 * Route    : /kalip
 */
import { KalipMainContainer } from '@/features/kalip';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function KalipPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Kalip modülü yüklenirken hata oluştu.
            </p>
        }>
            <div className="min-h-screen font-sans bg-[#0d1117] text-white">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                    <KalipMainContainer />
                </div>
            </div>
        </ErrorBoundary>
    );
}
