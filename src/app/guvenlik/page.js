'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/guvenlik/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/guvenlik/components/GuvenlikMainContainer.js
 * Route    : /guvenlik
 */
import { GuvenlikMainContainer } from '@/features/guvenlik';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function GuvenlikPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Guvenlik modülü yüklenirken hata oluştu.
            </p>
        }>
            <GuvenlikMainContainer />
        </ErrorBoundary>
    );
}
