'use client';
/**
 * app/giris/page.js — GİRİŞ NOKTASI (21 satır)
 * Tüm UI   → features/giris/components/GirisMainContainer.js
 * Route    : /giris  (PIN Authentication)
 */
import { GirisMainContainer } from '@/features/giris';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function GirisPage() {
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Giriş sayfası yüklenirken hata oluştu. Sayfayı yenileyin.
            </p>
        }>
            <GirisMainContainer />
        </ErrorBoundary>
    );
}
