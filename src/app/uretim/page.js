<<<<<<< HEAD
import UretimSayfasi from '@/features/uretim/components/UretimSayfasi';

export default function UretimPage() {
    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                <UretimSayfasi />
            </div>
        </div>
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    );
}
