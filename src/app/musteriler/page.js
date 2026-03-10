'use client';
/**
 * app/musteriler/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/musteriler/components/MusterilerMainContainer.js
 * Route    : /musteriler
 */
import { MusterilerMainContainer } from '@/features/musteriler';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function MusterilerPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Musteriler modülü yüklenirken hata oluştu.
            </p>
        }>
            <MusterilerMainContainer />
        </ErrorBoundary>
    );
}
