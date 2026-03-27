'use client';
/**
 * app/page.js — GİRİŞ NOKTASI (20 satır)
 * Tm UI   → features/karargah/components/KarargahMainContainer.js
 * Route    : /
 */
import { KarargahMainContainer } from '@/features/karargah';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function KarargahPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ️ Karargah modl yklenirken hata oluştu.
            </p>
        }>
            <KarargahMainContainer />
        </ErrorBoundary>
    );
}
