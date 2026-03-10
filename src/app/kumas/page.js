'use client';
/**
 * app/kumas/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/kumas/components/KumasMainContainer.js
 * Route    : /kumas
 */
import { KumasMainContainer } from '@/features/kumas';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function KumasPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Kumas modülü yüklenirken hata oluştu.
            </p>
        }>
            <KumasMainContainer />
        </ErrorBoundary>
    );
}
