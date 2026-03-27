'use client';
import { useLang } from '@/context/langContext';
import { KasaMainContainer } from '@/features/kasa';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function KasaPage() {
    const { lang } = useLang();
    return (
        <ErrorBoundary fallback={<p>Kasa modulu yuklenirken hata olustu.</p>}>
            <KasaMainContainer lang={lang} />
        </ErrorBoundary>
    );
}