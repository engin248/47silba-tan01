'use client';
/**
 * app/katalog/page.js — GİRİŞ NOKTASI (20 satır)
 * Tm UI   → features/katalog/components/KatalogMainContainer.js
 * Route    : /katalog
 */
import { KatalogMainContainer } from '@/features/katalog';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function KatalogPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ️ Katalog modl yklenirken hata oluştu.
            </p>
        }>
            <div className="min-h-screen font-sans bg-[#0d1117] text-white">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                    <KatalogMainContainer />
                </div>
            </div>
        </ErrorBoundary>
    );
}
