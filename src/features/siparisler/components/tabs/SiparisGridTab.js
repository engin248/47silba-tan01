import { ShoppingCart } from 'lucide-react';
import { formatTarih } from '@/lib/utils';

const DURUM_RENK = { beklemede: '#f59e0b', onaylandi: '#3b82f6', hazirlaniyor: '#8b5cf6', kargoda: '#f97316', teslim: '#10b981', iptal: '#ef4444', iade: '#64748b' };
const DURUM_LABEL = { beklemede: '⏳ Beklemede', onaylandi: '✅ Onaylandı', hazirlaniyor: '⚙️ Hazır.', kargoda: '🚛 Kargoda', teslim: '🎉 Teslim', iptal: '❌ İptal', iade: '↩️ İade' };
const PARA_BIRIMLERI = [
    { kod: 'TL', simge: '₺', bayrak: '🇹🇷' },
    { kod: 'USD', simge: '$', bayrak: '🇺🇸' },
    { kod: 'EUR', simge: '€', bayrak: '🇪🇺' },
];

export default function SiparisGridTab({ filtreli, aktifSiparis, detayAc, dahaFazlaVar, yukle, sayfaNo, loading, siparislerLength, SAYFA_BOYUTU }) {

    const getGecikmeAlarm = (s) => {
        if (['kargoda', 'teslim', 'iptal', 'iade'].includes(s.durum)) return null;
        if (!s.created_at) return null;
        const gecenSaat = (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60);
        const limit = s.acil ? 24 : 48;
        if (gecenSaat > limit) {
            return <span className="text-xs font-black bg-red-500 text-white px-2 py-0.5 rounded ml-1.5 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse">🔥 {Math.floor(gecenSaat - limit)}S GECİKTİ!</span>;
        }
        return null;
    };

    return (
        <div className="flex-[1_1_340px] flex flex-col gap-3">
            {filtreli.length === 0 && (
                <div className="text-center py-16 bg-[#0d1117] text-white rounded-2xl border-2 border-dashed border-[#1e4a43]">
                    <ShoppingCart size={48} className="text-emerald-900 mx-auto mb-3" />
                    <p className="text-emerald-700 font-bold m-0">Sipariş bulunamadı.</p>
                </div>
            )}

            {filtreli.map(s => {
                const karZarar = s.gercek_maliyet_tl > 0 ? parseFloat(s.toplam_tutar_tl || 0) - parseFloat(s.gercek_maliyet_tl || 0) : null;
                const karlilik = karZarar === null ? 'bilinmiyor' : karZarar >= 0 ? 'karli' : 'zarari';
                const aktifMi = aktifSiparis?.id === s.id;
                const teslimMi = s.durum === 'teslim';

                return (
                    <div key={s.id} onClick={() => detayAc(s)}
                        className={`bg-[#122b27] border-2 rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md
                            ${aktifMi ? 'border-emerald-500 ring-2 ring-emerald-500/20' : teslimMi ? 'border-[#1e4a43] bg-[#0d1117]' : 'border-slate-800'}`}>
                        <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex gap-1.5 flex-wrap items-center mb-2">
                                    <span className="text-xs font-black bg-emerald-900/50 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-md truncate max-w-[100px]">{s.siparis_no}</span>
                                    <span className="text-xs font-black bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-wider">{s.kanal}</span>
                                    {s.para_birimi && s.para_birimi !== 'TL' && (
                                        <span className="text-xs font-black bg-slate-800 text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            {PARA_BIRIMLERI.find(p => p.kod === s.para_birimi)?.bayrak} {s.para_birimi}
                                        </span>
                                    )}
                                    <span className="text-xs font-black px-2 py-0.5 rounded-md" style={{ background: `${DURUM_RENK[s.durum]}20`, color: DURUM_RENK[s.durum] }}>{DURUM_LABEL[s.durum]}</span>
                                    {s.acil && <span className="text-xs font-black bg-red-900/50 text-red-400 px-2 py-0.5 rounded-md border border-red-800 shadow-sm">🚨 ACİL</span>}

                                    {karlilik === 'karli' && <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">🟢 +₺{karZarar?.toFixed(0)}</span>}
                                    {karlilik === 'zarari' && <span className="text-xs font-black px-2 py-0.5 rounded-md bg-red-900/30 text-red-400 border border-red-800/50">🔴 {karZarar?.toFixed(0)}₺</span>}

                                    {getGecikmeAlarm(s)}
                                </div>
                                <div className="font-black text-white text-sm truncate">{s.b2_musteriler?.ad_soyad || 'Anonim'}</div>
                                <div className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1">
                                    🕐 {formatTarih(s.created_at)}
                                </div>
                            </div>
                            <div className="font-black text-white text-base text-right shrink-0">
                                <div className="flex items-baseline justify-end gap-0.5">
                                    <span className="text-sm text-emerald-500">{PARA_BIRIMLERI.find(p => p.kod === (s.para_birimi || 'TL'))?.simge || '₺'}</span>
                                    {parseFloat(s.toplam_tutar_tl).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {dahaFazlaVar && (
                <div className="flex justify-center mt-4 mb-2">
                    <button onClick={() => yukle(sayfaNo + 1, false)} disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-900 text-emerald-100 border-2 border-emerald-700 rounded-xl font-black text-sm hover:bg-emerald-800 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-wait">
                        {loading ? '⏳ Yükleniyor...' : `📥 Daha Fazla Yükle (${siparislerLength} / Tümü)`}
                    </button>
                </div>
            )}
            {!dahaFazlaVar && siparislerLength >= SAYFA_BOYUTU && (
                <div className="text-center mt-3 text-xs text-slate-600 font-bold py-2">✅ Tüm siparişler yüklendi ({siparislerLength})</div>
            )}
        </div>
    );
}
