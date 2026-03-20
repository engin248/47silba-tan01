'use client';
/**
 * app/musteriler/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/musteriler/components/MusterilerMainContainer.js
 * Route    : /musteriler
 */
import { MusterilerMainContainer } from '@/features/musteriler';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function MusterilerPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Musteriler modülü yüklenirken hata oluştu.
            </p>
        }>
<<<<<<< HEAD
            <div className="min-h-screen font-sans bg-[#0d1117] text-white">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                    <MusterilerMainContainer />
                </div>
            </div>
=======
            <MusterilerMainContainer />
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        </ErrorBoundary>
    );
}
