'use client';
/**
 * app/arge/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/arge/components/ArgeMainContainer.js
 * Route    : /arge
 */
import { ArgeMainContainer } from '@/features/arge';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ArgePage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Arge modülü yüklenirken hata oluştu.
            </p>
        }>
            <ArgeMainContainer />
        </ErrorBoundary>
    );
}
