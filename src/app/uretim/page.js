import UretimSayfasi from '@/features/uretim/components/UretimSayfasi';

export default function UretimPage() {
    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                <UretimSayfasi />
            </div>
        </div>
    );
}
