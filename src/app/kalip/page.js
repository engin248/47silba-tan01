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
            <KalipMainContainer />
        </ErrorBoundary>
    );
}
