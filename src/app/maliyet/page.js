'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/maliyet/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/maliyet/components/MaliyetMainContainer.js
 * Route    : /maliyet
 */
import { MaliyetMainContainer } from '@/features/maliyet';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function MaliyetPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Maliyet modülü yüklenirken hata oluştu.
            </p>
        }>
            <MaliyetMainContainer />
        </ErrorBoundary>
    );
}
