import { Scissors } from 'lucide-react';

export default function ModelhaneKalipTalepleri({ m3Talepleri, numuneDikimiBitir }) {

    const baslatSayac = async (talep) => {
        const Swal = (await import('sweetalert2')).default;

        const { isConfirmed } = await Swal.fire({
            title: 'Dikim Kronometresi Başlatılsın mı?',
            html: `<b>${talep.b1_model_taslaklari?.model_kodu}</b> kodlu kalıp için işçilik süresi hesaplaması başlatılacak.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: '► BAŞLAT',
            cancelButtonText: 'İptal',
            background: '#0d1117',
            color: '#c9d1d9',
            confirmButtonColor: '#9333ea',
        });

        if (isConfirmed) {
            const baslamaZamani = Date.now();

            Swal.fire({
                title: 'NUMUNE DİKİLİYOR...',
                html: `
                    <div style="font-size: 24px; font-weight: bold; font-family: monospace; color: #34d399; margin: 20px 0;">
                        <span id="swal-timer">00:00</span>
                    </div>
                    <p style="font-size:12px; color:#8b949e">Bitirdiğinizde yandaki butona tıklayın.</p>
                `,
                showConfirmButton: true,
                confirmButtonText: '◼ BİTİR VE PROVAYA GÖNDER',
                confirmButtonColor: '#ef4444',
                background: '#0d1117',
                color: '#f8fafc',
                allowOutsideClick: false,
                didOpen: () => {
                    const timerEl = document.getElementById('swal-timer');
                    let saniye = 0;
                    const interval = setInterval(() => {
                        saniye += 1;
                        const m = String(Math.floor(saniye / 60)).padStart(2, '0');
                        const s = String(saniye % 60).padStart(2, '0');
                        if (timerEl) timerEl.innerText = `${m}:${s}`;
                    }, 1000);
                    Swal.getPopup().setAttribute('data-interval', String(interval));
                },
                willClose: () => {
                    const timerId = Swal.getPopup().getAttribute('data-interval');
                    if (timerId) clearInterval(Number(timerId));
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const bitisZamani = Date.now();
                    const sureSn = Math.floor((bitisZamani - baslamaZamani) / 1000);

                    await numuneDikimiBitir(talep.b1_model_taslaklari?.model_kodu, sureSn);

                    Swal.fire({
                        title: 'Dikim Tamamlandı!',
                        html: `Geçen Süre: <b>${sureSn} Saniye</b><br>Ürün şimdi <b>Teknik Analiz ve Prova Onay</b> listesine aktarıldı.`,
                        icon: 'success',
                        confirmButtonText: 'Tamam',
                        background: '#0d1117',
                        color: '#34d399',
                    });
                }
            });
        }
    };

    return (
        <div className="xl:col-span-1 bg-[#161b22] border border-[#21262d] rounded-xl flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#21262d]">
                <h2 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                    <Scissors size={14} /> M3 Kalıphane Çıktıları
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {m3Talepleri.length === 0 && <p className="text-[#8b949e] text-sm text-center mt-4">Şu an M3 Kalıphane'den gelen bir onay yok.</p>}
                {m3Talepleri.map(talep => (
                    <div key={talep.id} className="bg-[#0d1117] border border-blue-500/30 p-3 rounded-lg flex flex-col gap-2 shadow-lg">
                        <div className="text-sm text-blue-400 font-bold uppercase flex justify-between">
                            <span>NUMUNE DİKİM EMRİ</span>
                            <span className="bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded text-xs">M3 ONAYLI</span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{talep.b1_model_taslaklari?.model_adi || 'Bilinmiyor'}</h3>
                        <div className="text-sm text-[#8b949e] bg-[#21262d] p-1.5 rounded flex justify-between items-center">
                            <span>Kod: <span className="text-white font-bold">{talep.b1_model_taslaklari?.model_kodu || '-'}</span></span>
                            <span className="text-purple-400 font-bold py-0.5 px-2 bg-purple-500/10 border border-purple-500/20 rounded">Kalıp: {talep.kalip_adi}</span>
                        </div>
                        <p className="text-sm text-[#8b949e] mb-1">Bedenler: <span className="text-emerald-400 font-mono tracking-wider">{(talep.bedenler || []).join(', ')}</span></p>
                        <button
                            onClick={() => baslatSayac(talep)}
                            className="w-full text-sm font-bold py-2 bg-purple-600 hover:bg-purple-500 transition-colors border border-purple-400/50 hover:border-purple-300 rounded-lg text-white shadow-[0_0_10px_rgba(147,51,234,0.3)] hover:shadow-purple-500/50 active:scale-[0.98]">
                            DİKİME BAŞLA (SAYAÇ)
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
