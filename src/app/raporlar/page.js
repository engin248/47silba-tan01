'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/raporlar/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/raporlar/components/RaporlarMainContainer.js
 * Route    : /raporlar
 */
import { RaporlarMainContainer } from '@/features/raporlar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RaporlarPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Raporlar modülü yüklenirken hata oluştu.
            </p>
        }>
            <RaporlarMainContainer />
        </ErrorBoundary>
    );
}
