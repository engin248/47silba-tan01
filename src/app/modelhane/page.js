'use client';
/**
 * app/modelhane/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/modelhane/components/ModelhaneMainContainer.js
 * Route    : /modelhane
 */
import { ModelhaneMainContainer } from '@/features/modelhane';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ModelhanePage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Modelhane modülü yüklenirken hata oluştu.
            </p>
        }>
            <ModelhaneMainContainer />
        </ErrorBoundary>
    );
}
