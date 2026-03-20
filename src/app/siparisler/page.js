'use client';
/**
 * app/siparisler/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/siparisler/components/SiparislerMainContainer.js
 * Route    : /siparisler
 */
import { SiparislerMainContainer } from '@/features/siparisler';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function SiparislerPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Siparisler modülü yüklenirken hata oluştu.
            </p>
        }>
<<<<<<< HEAD
            <div className="min-h-screen font-sans bg-[#0d1117] text-white">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                    <SiparislerMainContainer />
                </div>
            </div>
=======
            <SiparislerMainContainer />
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        </ErrorBoundary>
    );
}
