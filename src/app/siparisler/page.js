'use client';
/**
 * app/siparisler/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/siparisler/components/SiparislerMainContainer.js
 * Route    : /siparisler
 */
import { SiparislerMainContainer } from '@/features/siparisler';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function SiparislerPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Siparisler modülü yüklenirken hata oluştu.
            </p>
        }>
            <SiparislerMainContainer />
        </ErrorBoundary>
    );
}
