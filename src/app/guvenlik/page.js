'use client';
import { useLang } from '@/context/langContext';
import { GuvenlikMainContainer } from '@/features/guvenlik';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function GuvenlikPage() {
    const { lang } = useLang();
    return (
        <ErrorBoundary fallback={<p>Guvenlik modulu yuklenirken hata olustu.</p>}>
            <GuvenlikMainContainer lang={lang} />
        </ErrorBoundary>
    );
}