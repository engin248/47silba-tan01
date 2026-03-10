'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/ayarlar/page.js — GİRİŞ NOKTASI (20 satır)
 * Tüm UI   → features/ayarlar/components/AyarlarMainContainer.js
 * Route    : /ayarlar
 */
import { AyarlarMainContainer } from '@/features/ayarlar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AyarlarPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Ayarlar modülü yüklenirken hata oluştu.
            </p>
        }>
            <AyarlarMainContainer />
        </ErrorBoundary>
    );
}
