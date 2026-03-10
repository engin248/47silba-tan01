'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/kasa/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/kasa/components/KasaMainContainer.js
 * Route    : /kasa
 */
import { KasaMainContainer } from '@/features/kasa';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function KasaPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Kasa modülü yüklenirken hata oluştu.
            </p>
        }>
            <KasaMainContainer />
        </ErrorBoundary>
    );
}
