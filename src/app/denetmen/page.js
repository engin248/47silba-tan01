'use client';
import { useLang } from '@/context/langContext';
import { DenetmenMainContainer } from '@/features/denetmen';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function DenetmenPage() {
    const { lang } = useLang();
    return (
        <ErrorBoundary fallback={<p>Denetmen modulu yuklenirken hata olustu.</p>}>
            <DenetmenMainContainer lang={lang} />
        </ErrorBoundary>
    );
}