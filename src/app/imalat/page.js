'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/imalat/page.js — GİRİŞ NOKTASI (21 satır)
 * Tüm UI   → features/imalat/components/ImalatMainContainer.js
 * Route    : /imalat
 */
import { ImalatMainContainer } from '@/features/imalat';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ImalatPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Imalat modülü yüklenirken hata oluştu.
            </p>
        }>
            <ImalatMainContainer />
        </ErrorBoundary>
    );
}
