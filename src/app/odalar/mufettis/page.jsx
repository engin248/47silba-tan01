import AskeriTelsiz from '@/components/AskeriTelsiz';

export default function MufettisOdasi() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono">
            <h1 className="text-xl font-bold text-purple-500 mb-8 tracking-widest border-b border-purple-900 pb-2">
                👁️ SİSTEM MÜFETTİŞİ DENETİM ODASI
            </h1>
            <p className="text-slate-500 mb-4 text-sm max-w-lg text-center">
                Kör noktalar, liyakat denetimleri ve infaz kararları bu hattan raporlanır.
            </p>

            <AskeriTelsiz odaIsmi="MUFETTIS" />
        </div>
    );
}
