import { Printer, Truck } from 'lucide-react';
import { faturaYazdir } from '@/lib/utils/faturaYazdir';
import HermAiAciklama from '@/components/ui/HermAiAciklama';

const ADIMLAR = [
    { key: 'beklemede', label: 'Alındı', emoji: '📥' },
    { key: 'onaylandi', label: 'Onaylandı', emoji: '✅' },
    { key: 'hazirlaniyor', label: 'Üretimde', emoji: '⚙️' },
    { key: 'kargoda', label: 'Hazır', emoji: '📦' },
    { key: 'teslim', label: 'Teslim', emoji: '🎉' },
];

const SiparisStepperBileseni = ({ durum }) => {
    const aktifIndex = ADIMLAR.findIndex(a => a.key === durum);
    const teslimEdildi = durum === 'teslim';
    const iptalEdildi = ['iptal', 'iade'].includes(durum);

    return (
        <div className={`flex items-center gap-0 my-3 py-3 px-4 rounded-xl border overflow-x-auto custom-scrollbar ${iptalEdildi ? 'bg-red-950 border-red-900' : 'bg-[#0d1117] border-[#1e4a43]'}`}>
            {ADIMLAR.map((adim, i) => {
                const tamamlandi = aktifIndex > i || teslimEdildi;
                const aktif = aktifIndex === i && !teslimEdildi;
                return (
                    <div key={adim.key} className="flex items-center min-w-0">
                        <div className="flex flex-col items-center min-w-[52px]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300
                                ${iptalEdildi ? 'bg-red-900 text-red-400' : tamamlandi ? 'bg-emerald-900 text-emerald-400' : aktif ? 'bg-sky-900 text-sky-400 border-2 border-sky-500/50' : 'bg-slate-800 text-slate-500'}`}>
                                {iptalEdildi ? '✗' : tamamlandi ? '✓' : adim.emoji}
                            </div>
                            <div className={`text-xs font-black mt-1.5 whitespace-nowrap ${tamamlandi ? 'text-emerald-500' : aktif ? 'text-sky-400' : 'text-slate-600'}`}>
                                {adim.label}
                            </div>
                        </div>
                        {i < ADIMLAR.length - 1 && (
                            <div className={`h-[3px] w-7 rounded-sm mb-4 transition-colors duration-300 mx-1 ${tamamlandi ? 'bg-emerald-800' : 'bg-slate-800'}`} />
                        )}
                    </div>
                );
            })}
            {iptalEdildi && (
                <span className="text-sm font-black text-red-500 ml-2 whitespace-nowrap">
                    {durum === 'iptal' ? '❌ İptal' : '↩️ İade'}
                </span>
            )}
        </div>
    );
};

export default function SiparisDetayPanel({
    aktifSiparis,
    setAktifSiparis,
    siparisSil,
    durumGuncelle,
    islemdeId,
    setKargoModal,
    setKargoNo,
    hermTemizle,
    hermCalistir,
    hermYukleniyor,
    hermSonuc,
    siparisler,
    gercekMaliyetGuncelle,
    terminGuncelle
}) {
    if (!aktifSiparis) return null;

    return (
        <div className="flex-[1.4_1_350px] bg-[#122b27] border-2 border-emerald-600/50 rounded-2xl p-5 self-start sticky top-4 shadow-[0_10px_40px_rgba(4,120,87,0.1)]">
            <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-[#1e4a43]">
                <h3 className="font-black text-white m-0 text-lg flex items-center gap-2">
                    <span className="text-emerald-500">📋</span> {aktifSiparis.siparis_no}
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => faturaYazdir(aktifSiparis)} className="flex items-center gap-1.5 bg-emerald-900 border border-emerald-700 text-emerald-200 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-emerald-800 transition-colors shadow-sm cursor-pointer">
                        <Printer size={14} /> Fatura
                    </button>
                    <button disabled={islemdeId === 'sil_' + aktifSiparis.id} onClick={() => siparisSil(aktifSiparis.id)}
                        className={`flex items-center gap-1.5 bg-red-950 border-0 text-red-400 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors hover:bg-red-900 ${islemdeId === 'sil_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>
                        🗑 {islemdeId === 'sil_' + aktifSiparis.id ? '...' : 'Sil'}
                    </button>
                    <button onClick={() => setAktifSiparis(null)} className="flex items-center gap-1.5 bg-slate-800 border-0 text-slate-300 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors hover:bg-slate-700 hover:text-white">
                        ✕
                    </button>
                </div>
            </div>

            <SiparisStepperBileseni durum={aktifSiparis.durum} />

            <div className="flex gap-2 flex-wrap mb-5 pt-2 border-t-2 border-[#1e4a43]">
                {aktifSiparis.durum === 'beklemede' && <button disabled={islemdeId === 'durum_' + aktifSiparis.id} onClick={() => durumGuncelle(aktifSiparis.id, 'onaylandi')} className={`px-4 py-2 bg-emerald-700 text-white border-0 rounded-xl font-black text-sm transition-all shadow-md hover:bg-emerald-800 ${islemdeId === 'durum_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>✅ {islemdeId === 'durum_' + aktifSiparis.id ? '...' : 'Siparişi Onayla'}</button>}
                {aktifSiparis.durum === 'onaylandi' && (
                    <>
                        <button disabled={islemdeId === 'durum_' + aktifSiparis.id} onClick={() => durumGuncelle(aktifSiparis.id, 'hazirlaniyor')} className={`px-4 py-2 bg-sky-600 text-white border-0 rounded-xl font-bold text-sm transition-all shadow-md hover:bg-sky-700 ${islemdeId === 'durum_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>📦 Stoktan Hazırla</button>
                        <button onClick={() => { window.open(`/uretim?siparis=${aktifSiparis.siparis_no}`, '_blank'); }} className="px-4 py-2 bg-indigo-700 text-white border-0 rounded-xl font-black text-sm transition-all shadow-[0_4px_10px_rgba(79,70,229,0.2)] hover:bg-indigo-800 cursor-pointer">🚀 Üretime Sevk Et (M6)</button>
                    </>
                )}
                {aktifSiparis.durum === 'hazirlaniyor' && <button disabled={islemdeId === 'durum_' + aktifSiparis.id} onClick={() => { setKargoModal(aktifSiparis); setKargoNo(''); }} className={`px-4 py-2 bg-amber-600 border-0 text-amber-50 rounded-xl font-bold text-sm transition-all shadow-md hover:bg-amber-700 ${islemdeId === 'durum_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>🚛 {islemdeId === 'durum_' + aktifSiparis.id ? '...' : 'Kargoya Ver'}</button>}
                {aktifSiparis.durum === 'kargoda' && <button disabled={islemdeId === 'durum_' + aktifSiparis.id} onClick={() => durumGuncelle(aktifSiparis.id, 'teslim')} className={`px-4 py-2 bg-emerald-600 text-white border-0 rounded-xl font-bold text-sm transition-all shadow-md hover:bg-emerald-700 ${islemdeId === 'durum_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>🎉 {islemdeId === 'durum_' + aktifSiparis.id ? '...' : 'Teslim Edildi'}</button>}
                {!['teslim', 'iptal'].includes(aktifSiparis.durum) && <button disabled={islemdeId === 'durum_' + aktifSiparis.id} onClick={() => durumGuncelle(aktifSiparis.id, 'iptal')} className={`px-4 py-2 bg-red-700 text-white border-0 rounded-xl font-bold text-sm transition-all shadow-md hover:bg-red-800 ${islemdeId === 'durum_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>❌ {islemdeId === 'durum_' + aktifSiparis.id ? '...' : 'İptal'}</button>}

                <button
                    onClick={async () => {
                        hermTemizle();
                        await hermCalistir({
                            aiKarari: aktifSiparis,
                            etkenler: [
                                { ad: 'Sipariş Tutarı (TL)', deger: parseFloat(aktifSiparis.toplam_tutar_tl || 0), agirlik: 2.0 },
                                { ad: 'Kanal', deger: aktifSiparis.kanal === 'toptan' ? 1 : 0.6, agirlik: 1.5 },
                                { ad: 'Aciliyet', deger: aktifSiparis.acil ? 1 : 0, agirlik: 1.8 },
                            ],
                            gecmisDegerler: siparisler.slice(0, 20).map(s => parseFloat(s.toplam_tutar_tl || 0)).filter(n => n > 0),
                            anaMetrik: parseFloat(aktifSiparis.toplam_tutar_tl || 0),
                            birim: 'siparis',
                        });
                    }}
                    disabled={hermYukleniyor}
                    className={`px-4 py-2 text-white border-0 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all shadow-md ${hermYukleniyor ? 'bg-slate-700' : 'bg-blue-800 hover:bg-blue-900 cursor-pointer'}`}
                >
                    🧠 {hermYukleniyor ? 'Analiz...' : 'AI Analiz (M12)'}
                </button>
            </div>

            <HermAiAciklama sonuc={hermSonuc} baslik="SİPARİŞ RİSK ANALİZİ" />

            <div className="mt-6">
                <div className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-3">Sipariş Kalemleri</div>
                <div className="space-y-1.5">
                    {aktifSiparis.kalemler?.map((k, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-[#0d1117] text-white rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                            <div>
                                <div className="font-bold text-white text-sm mb-0.5">{k.b2_urun_katalogu?.urun_adi}</div>
                                <div className="text-sm font-bold text-emerald-400">
                                    {k.adet} Adet × ₺{parseFloat(k.birim_fiyat_tl).toFixed(2)}{k.iskonto_pct > 0 ? ` (-%${k.iskonto_pct})` : ''} {k.beden ? `| Beden: ${k.beden}` : ''}
                                </div>
                            </div>
                            <div className="font-black text-white text-base">₺{parseFloat(k.tutar_tl).toFixed(2)}</div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-900 border border-slate-800 rounded-xl mt-3 shadow-inner">
                    <span className="font-black text-slate-400 tracking-wider">TOPLAM</span>
                    <span className="font-black text-emerald-400 text-xl">₺{parseFloat(aktifSiparis.toplam_tutar_tl).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {aktifSiparis.kargo_takip_no && (
                    <div className="p-3 bg-orange-950/50 border border-orange-800 rounded-xl mt-3 text-sm font-bold text-orange-400 flex items-center gap-2 shadow-sm">
                        <Truck size={16} /> Kargo Takip: {aktifSiparis.kargo_takip_no}
                    </div>
                )}

                {aktifSiparis.notlar && (
                    <div className="p-4 bg-yellow-950/30 border-l-4 border-yellow-600 rounded-r-xl rounded-l-sm mt-4 text-xs font-medium text-yellow-500 whitespace-pre-wrap leading-relaxed">
                        <div className="font-black mb-1 flex items-center gap-1.5 text-yellow-600 tracking-wide"><span className="text-lg">✍️</span> Müşteri / Operasyon Notları</div>
                        {aktifSiparis.notlar}
                    </div>
                )}

                {/* Karlılık ve Termin */}
                <div className="mt-4 p-4 bg-[#0d1117] text-white rounded-xl border border-[#1e4a43]">
                    <div className="font-black text-emerald-400 text-sm uppercase tracking-widest mb-3 flex items-center gap-1.5"><span className="text-emerald-500 text-lg">💹</span> Karlılık Takibi</div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-xs font-black text-emerald-600 mb-1">GERÇEK MALİYET (₺)</label>
                            <input
                                type="number" step="0.01" min="0"
                                defaultValue={aktifSiparis.gercek_maliyet_tl || ''}
                                placeholder="0.00"
                                onBlur={(e) => gercekMaliyetGuncelle(aktifSiparis.id, parseFloat(e.target.value || 0))}
                                className="w-full px-3 py-2 bg-[#122b27] border border-[#1e4a43] rounded-lg font-bold text-emerald-100 outline-none focus:border-emerald-500 text-sm transition-all text-center"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-emerald-600 mb-1">TERMİN TARİHİ</label>
                            <input
                                type="date"
                                defaultValue={aktifSiparis.termin_tarihi || ''}
                                onBlur={(e) => terminGuncelle(aktifSiparis.id, e.target.value)}
                                className="w-full px-3 py-2 bg-[#122b27] border border-[#1e4a43] rounded-lg font-bold text-emerald-100 outline-none focus:border-emerald-500 text-sm transition-all text-center"
                            />
                        </div>
                    </div>

                    {aktifSiparis.gercek_maliyet_tl > 0 && (() => {
                        const kar = parseFloat(aktifSiparis.toplam_tutar_tl) - parseFloat(aktifSiparis.gercek_maliyet_tl);
                        const marj = ((kar / parseFloat(aktifSiparis.toplam_tutar_tl)) * 100).toFixed(1);
                        const isKarli = kar >= 0;
                        return (
                            <div className={`p-2.5 rounded-lg flex justify-between items-center ${isKarli ? 'bg-emerald-900/30 border border-emerald-800' : 'bg-red-900/30 border border-red-800'}`}>
                                <span className={`text-sm font-black ${isKarli ? 'text-emerald-500' : 'text-red-500'}`}>{isKarli ? '🟢 KAR' : '🔴 ZARAR'}</span>
                                <span className={`text-base font-black ${isKarli ? 'text-emerald-400' : 'text-red-400'}`}>₺{Math.abs(kar).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs opacity-75">(%{marj})</span></span>
                            </div>
                        );
                    })()}

                    {aktifSiparis.termin_tarihi && (() => {
                        const gun = Math.ceil((new Date(aktifSiparis.termin_tarihi).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isGecti = gun < 0;
                        const isYakin = gun >= 0 && gun <= 3;
                        return (
                            <div className={`mt-2 p-2 rounded-lg border flex justify-between items-center
                                ${isGecti ? 'bg-red-950/60 border-red-800/50' : isYakin ? 'bg-amber-950/60 border-amber-800/50' : 'bg-emerald-950/60 border-emerald-800/50'}`}>
                                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">⏳ Termine Kalan</span>
                                <span className={`text-xs font-black ${isGecti ? 'text-red-400' : isYakin ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {isGecti ? `${Math.abs(gun)} Gün GEÇTİ!` : gun === 0 ? 'BUGÜN TESLİM!' : `${gun} Gün İçinde`}
                                </span>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
