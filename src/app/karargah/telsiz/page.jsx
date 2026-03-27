import AskeriTelsiz from '@/components/AskeriTelsiz';

export default function KarargahTelsizOdasi() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono">
            <h1 className="text-2xl font-bold text-slate-100 mb-8 tracking-widest border-b border-rose-900 pb-2">
                🎖️ BAŞKOMUTAN (KARARGAH) İLETİŞİM SS
            </h1>
            <p className="text-slate-500 mb-4 text-sm max-w-lg text-center">
                Buradan atılan tm emirler AES-256 algoritmasıyla şifrelenir. <br />
                Sistem dışı girişler veya Supabase zerinden mesaj okunması imkansızdır.
            </p>

            {/* Telsiz Bileşeni */}
            <AskeriTelsiz odaIsmi="KARARGAH" />
        </div>
    );
}
