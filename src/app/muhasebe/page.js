'use client';
/**
 * app/muhasebe/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/muhasebe/components/MuhasebeMainContainer.js
 * Route    : /muhasebe
 */
import { MuhasebeMainContainer } from '@/features/muhasebe';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function MuhasebePage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Muhasebe modülü yüklenirken hata oluştu.
            </p>
        }>
            <MuhasebeMainContainer />
        </ErrorBoundary>
    );
}
