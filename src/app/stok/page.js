'use client';
/**
 * app/stok/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/stok/components/StokMainContainer.js
 * Route    : /stok
 */
import { StokMainContainer } from '@/features/stok';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function StokPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Stok modülü yüklenirken hata oluştu.
            </p>
        }>
            <StokMainContainer />
        </ErrorBoundary>
    );
}
