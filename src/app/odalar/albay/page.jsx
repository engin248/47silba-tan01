import AskeriTelsiz from '@/components/AskeriTelsiz';

export default function AlbayOdasi() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono">
            <h1 className="text-xl font-bold text-amber-500 mb-8 tracking-widest border-b border-amber-900 pb-2">
                🪖 EMİR KOMUTA SUBAYI (ALBAY) SS
            </h1>
            <p className="text-slate-500 mb-4 text-sm max-w-lg text-center">
                Albay Burhan; şifreli telsiz ağına bağlandınız. Karargaha ve Mimarlara talimat verebilirsiniz.
            </p>

            <AskeriTelsiz odaIsmi="ALBAY" />
        </div>
    );
}
