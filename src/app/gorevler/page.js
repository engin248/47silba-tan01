'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/gorevler/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/gorevler/components/GorevlerMainContainer.js
 * Route    : /gorevler
 */
import { GorevlerMainContainer } from '@/features/gorevler';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function GorevlerPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Gorevler modülü yüklenirken hata oluştu.
            </p>
        }>
            <div className="min-h-screen font-sans bg-[#0d1117] text-white">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }} dir={isAR ? 'rtl' : 'ltr'}>
                    <GorevlerMainContainer />
                </div>
            </div>
        </ErrorBoundary>
    );
}
