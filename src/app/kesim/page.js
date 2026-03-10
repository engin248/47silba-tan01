'use client';
/**
 * app/kesim/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/kesim/components/KesimMainContainer.js
 * Route    : /kesim
 */
import { KesimMainContainer } from '@/features/kesim';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function KesimPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Kesim modülü yüklenirken hata oluştu.
            </p>
        }>
            <KesimMainContainer />
        </ErrorBoundary>
    );
}
