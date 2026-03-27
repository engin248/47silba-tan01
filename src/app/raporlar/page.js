'use client';
import { useLang } from '@/context/langContext';
import { RaporlarMainContainer } from '@/features/raporlar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RaporlarPage() {
    const { lang } = useLang();
    return (
        <ErrorBoundary fallback={<p>Raporlar modulu yuklenirken hata olustu.</p>}>
            <RaporlarMainContainer lang={lang} />
        </ErrorBoundary>
    );
}