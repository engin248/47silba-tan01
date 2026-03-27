'use client';
import { useLang } from '@/context/langContext';
import { ImalatMainContainer } from '@/features/imalat';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ImalatPage() {
    const { lang } = useLang();
    return (
        <ErrorBoundary fallback={<p>Imalat modulu yuklenirken hata olustu.</p>}>
            <ImalatMainContainer lang={lang} />
        </ErrorBoundary>
    );
}
