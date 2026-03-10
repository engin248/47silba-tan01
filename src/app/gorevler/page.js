'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/gorevler/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/gorevler/components/GorevlerMainContainer.js
 * Route    : /gorevler
 */
import { GorevlerMainContainer } from '@/features/gorevler';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function GorevlerPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Gorevler modülü yüklenirken hata oluştu.
            </p>
        }>
            <GorevlerMainContainer />
        </ErrorBoundary>
    );
}
