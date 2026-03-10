'use client';
import { useLang } from '@/lib/langContext';
/**
 * app/uretim/page.js — SADECE GİRİŞ NOKTASI (20 satır)
 *
 * Tüm logic  → features/uretim/hooks/useIsEmri.js    (325 satır)
 * Tüm UI     → features/uretim/components/UretimSayfasi.js (368 satır)
 * Public API → features/uretim/index.js (barrel)
 */
import { UretimMainContainer } from '@/features/uretim';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function UretimPage() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    return (
        <ErrorBoundary fallback={
            <p className="p-8 text-red-700 font-bold text-center">
                ⚠️ Üretim modülü yüklenirken hata oluştu. Sayfayı yenileyin.
            </p>
        }>
            <UretimMainContainer />
        </ErrorBoundary>
    );
}
