'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/denetmen/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/denetmen/components/DenetmenMainContainer.js
 * Route    : /denetmen
 */
import { DenetmenMainContainer } from '@/features/denetmen';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function DenetmenPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Denetmen modülü yüklenirken hata oluştu.
            </p>
        }>
            <DenetmenMainContainer />
        </ErrorBoundary>
    );
}
