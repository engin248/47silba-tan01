'use client';
/**
 * app/katalog/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/katalog/components/KatalogMainContainer.js
 * Route    : /katalog
 */
import { KatalogMainContainer } from '@/features/katalog';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function KatalogPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Katalog modülü yüklenirken hata oluştu.
            </p>
        }>
            <KatalogMainContainer />
        </ErrorBoundary>
    );
}
