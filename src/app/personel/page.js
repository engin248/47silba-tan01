'use client';
/**
 * app/personel/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/personel/components/PersonelMainContainer.js
 * Route    : /personel
 */
import { PersonelMainContainer } from '@/features/personel';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function PersonelPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Personel modülü yüklenirken hata oluştu.
            </p>
        }>
            <PersonelMainContainer />
        </ErrorBoundary>
    );
}
