import ScraperKarantinaContainer from '@/features/arge/components/ScraperKarantinaContainer';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata = {
    title: 'Ar-Ge Karantina Merkezi - Karargah',
    description: 'l İşi botunun kazıdığı verilerin kontrol paneli',
};

export default function ScraperKarantinaPage() {
    return (
        <ErrorBoundary fallback={
            <div className="p-8 text-red-700 font-bold text-center bg-red-50 rounded-xl m-8">
                ️ Scraper Karantina modl yklenirken hata oluştu.
            </div>
        }>
            <ScraperKarantinaContainer />
        </ErrorBoundary>
    );
}
