'use client';
import { useLang } from '@/context/langContext';
import { AyarlarMainContainer } from '@/features/ayarlar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AyarlarPage() {
    const { lang } = useLang();
    return (
        <ErrorBoundary fallback={<p>Ayarlar modulu yuklenirken hata olustu.</p>}>
            <AyarlarMainContainer lang={lang} />
        </ErrorBoundary>
    );
}