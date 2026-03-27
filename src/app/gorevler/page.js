'use client';
import { useLang } from '@/context/langContext';
import { GorevlerMainContainer } from '@/features/gorevler';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function GorevlerPage() {
    const { lang } = useLang();
    return (
        <ErrorBoundary fallback={<p>Gorevler modulu yuklenirken hata olustu.</p>}>
            <GorevlerMainContainer lang={lang} />
        </ErrorBoundary>
    );
}