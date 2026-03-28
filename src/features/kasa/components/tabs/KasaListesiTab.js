import { Trash2, CheckCircle, DollarSign } from 'lucide-react';
import { formatTarih } from '@/lib/utils';

const TIP_RENK = { tahsilat: '#059669', iade_odeme: '#ef4444', cek: '#f59e0b', senet: '#8b5cf6', avans: '#3b82f6', diger: '#64748b' };
const TIP_ICON = { tahsilat: '📈', iade_odeme: '↩️', cek: '📄', senet: '📋', avans: '💵', diger: '💰' };

export default function KasaListesiTab({ filtreli, kasaSayfa, loading, islemdeId, onayDegistir, sil, setKasaSayfa }) {
    return (
        <div className="flex flex-col gap-3">
            {loading && filtreli.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest bg-[#0d1117] text-white rounded-2xl border-2 border-slate-100">⏳ Yükleniyor...</div>
            )}
            {!loading && filtreli.length === 0 && (
                <div className="text-center py-16 bg-[#0d1117] text-white border-2 border-dashed border-[#1e4a43] rounded-2xl">
                    <DollarSign size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-emerald-200 font-bold text-lg">Kasa hareketi bulunamadı.</p>
                    <p className="text-slate-400 text-sm">"Yeni Hareket" butonu ile ilk işlemi ekleyin.</p>
                </div>
            )}
            {filtreli.slice(0, kasaSayfa).map(h => (
                <div key={h.id} style={{ borderColor: h.onay_durumu === 'onaylandi' ? '#34d399' : h.onay_durumu === 'iptal' ? '#fca5a5' : '#fcd34d' }} className="bg-[#122b27] border-l-8 border-y border-r border-[#1e4a43] rounded-xl p-4 flex justify-between items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div style={{ backgroundColor: (TIP_RENK[h.hareket_tipi] || '#64748b') + '20', color: TIP_RENK[h.hareket_tipi] || '#64748b' }} className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 font-black">
                            {TIP_ICON[h.hareket_tipi] || '💰'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-black text-white text-lg truncate whitespace-normal mb-1">{h.aciklama}</div>
                            <div className="flex gap-2 flex-wrap items-center">
                                <span style={{ backgroundColor: (TIP_RENK[h.hareket_tipi] || '#64748b') + '20', color: TIP_RENK[h.hareket_tipi] || '#64748b' }} className="text-xs font-black px-2 py-1 rounded uppercase tracking-wider">
                                    {h.hareket_tipi?.replace('_', ' ')}
                                </span>
                                <span className="text-xs font-black px-2 py-1 rounded bg-[#0d1117] text-emerald-300 uppercase tracking-wider">
                                    {h.odeme_yontemi?.replace('_', ' ')}
                                </span>
                                {h.b2_musteriler?.ad_soyad && (
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">👤 {h.b2_musteriler.ad_soyad}</span>
                                )}
                                {h.b1_personel?.ad_soyad && (
                                    <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">👷 {h.b1_personel.ad_soyad} (Avans)</span>
                                )}
                                {h.vade_tarihi && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${new Date(h.vade_tarihi) < new Date() ? 'text-red-600 bg-red-50 border-red-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                                        ⏰ Vade: {formatTarih(h.vade_tarihi)}
                                    </span>
                                )}
                                <span className="text-xs font-medium text-slate-400">🗓 {formatTarih(h.created_at)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <div style={{ color: TIP_RENK[h.hareket_tipi] || '#0f172a' }} className="font-black text-xl text-right">
                            ₺{parseFloat(h.tutar_tl || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex flex-col gap-1 w-[110px]">
                            <span className={`text-xs font-black w-full text-center px-1 py-1.5 rounded-lg border ${h.onay_durumu === 'onaylandi' ? 'bg-[#065f46] text-emerald-100 border-[#047857]' : h.onay_durumu === 'iptal' ? 'bg-[#991b1b] text-red-100 border-[#7f1d1d]' : 'bg-[#92400e] text-amber-100 border-[#78350f]'}`}>
                                {h.onay_durumu === 'onaylandi' ? '✅ ONAYLI' : h.onay_durumu === 'iptal' ? '❌ İPTAL' : '⏳ BEKLİYOR'}
                            </span>
                            {h.onay_durumu === 'bekliyor' && (
                                <button disabled={islemdeId === h.id} onClick={() => onayDegistir(h.id, 'onaylandi')} title="Onayla"
                                    className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-1.5 rounded-lg border-0 flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-md ${islemdeId === h.id ? 'opacity-50 cursor-wait' : ''}`}>
                                    <CheckCircle size={10} /> {islemdeId === h.id ? '...' : 'TASDİK ET'}
                                </button>
                            )}
                        </div>
                        <button disabled={islemdeId === h.id} onClick={() => sil(h.id)} className={`p-2 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg cursor-pointer transition-colors border border-red-800 ${islemdeId === h.id ? 'opacity-50 cursor-wait' : ''}`}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
            {filtreli.length > kasaSayfa && (
                <div className="text-center mt-4 border-t-2 border-[#1e4a43] pt-4">
                    <button
                        onClick={() => setKasaSayfa(p => p + 50)}
                        className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white border-0 font-black text-sm rounded-xl cursor-pointer shadow-lg border-b-4 border-emerald-900 transition-all"
                    >
                        ⬇ Daha Fazla Göster ({filtreli.length - kasaSayfa} kaldı)
                    </button>
                </div>
            )}
        </div>
    );
}
