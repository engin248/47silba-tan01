'use client';
import { useLang } from '@/context/langContext';
/**
 * app/ajanlar/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/ajanlar/components/AjanlarMainContainer.js
 * Route    : /ajanlar
 */
import { AjanlarMainContainer } from '@/features/ajanlar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AjanlarPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Ajanlar modülü yüklenirken hata oluştu.
            </p>
        }>
            <AjanlarMainContainer />
        </ErrorBoundary>
    );
}
