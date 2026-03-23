import AskeriTelsiz from '@/components/AskeriTelsiz';

export default function BasmimarOdasi() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono">
            <h1 className="text-xl font-bold text-sky-500 mb-8 tracking-widest border-b border-sky-900 pb-2">
                📐 BAŞMİMAR ÇALIŞMA MASASI
            </h1>
            <p className="text-slate-500 mb-4 text-sm max-w-lg text-center">
                Sistem mühendisliği ve kod lehimleme emirleri buradan alınacaktır.
            </p>

            <AskeriTelsiz odaIsmi="BASMIMAR" />
        </div>
    );
}
