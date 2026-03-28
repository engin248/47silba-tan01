import { Phone, Mail, History, ShieldOff, ShieldCheck, Edit3, Trash2, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { TIP_LABEL, TIP_RENK } from '../MusterilerMainContainer';

export default function MusteriListesiTab({
    filtreli,
    loading,
    aramaMetni,
    islemdeId,
    timelineAc,
    karaListeDegistir,
    duzenle,
    sil
}) {
    return (
        <div className="flex flex-col gap-2">
            {loading && filtreli.length === 0 && (
                <div className="text-center py-16 text-slate-400 font-bold">⏳ Yükleniyor...</div>
            )}
            {!loading && filtreli.length === 0 && (
                <div className="text-center py-16 bg-[#0b1d1a] rounded-2xl border-2 border-dashed border-emerald-900">
                    <UserCheck size={40} className="text-emerald-800 mx-auto mb-2" />
                    <p className="text-emerald-500 font-bold">
                        {aramaMetni ? `"${aramaMetni}" için sonuç bulunamadı.` : 'Henüz müşteri yok.'}
                    </p>
                </div>
            )}
            {filtreli.map(m => (
                <div key={m.id} style={{ borderLeft: m.kara_liste ? '5px solid #ef4444' : (m.aktif === false ? '5px solid #475569' : `5px solid ${TIP_RENK[m.musteri_tipi] || '#cbd5e1'}`) }}
                    className="bg-[#122b27] border border-[#1e4a43] p-4 rounded-xl flex justify-between items-center flex-wrap gap-4 mb-1 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div style={{ background: (TIP_RENK[m.musteri_tipi] || '#64748b') + '20', color: TIP_RENK[m.musteri_tipi] || '#64748b' }}
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 font-black">
                            {m.musteri_tipi === 'toptan' ? '🏭' : m.musteri_tipi === 'magaza' ? '🏪' : '👤'}
                        </div>
                        <div>
                            <div className="flex gap-2 items-center flex-wrap mb-1">
                                <span className="text-[0.65rem] font-black bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-900">{m.musteri_kodu}</span>
                                <span style={{ background: (TIP_RENK[m.musteri_tipi] || '#64748b') + '20', color: TIP_RENK[m.musteri_tipi] || '#64748b' }} className="text-[0.65rem] font-black px-2 py-0.5 rounded">{TIP_LABEL[m.musteri_tipi]}</span>
                                {m.kara_liste && <span className="text-[0.65rem] font-black bg-red-950 text-red-500 px-2 py-0.5 rounded border border-red-900 animate-pulse">🚫 KARA LİSTE</span>}
                                {m.aktif === false && <span className="text-[0.65rem] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Pasif</span>}
                                {m.segment && (
                                    <span className={`text-[0.65rem] font-black px-2 py-0.5 rounded border ${m.segment === 'A' ? 'bg-amber-950 text-amber-500 border-amber-900' : m.segment === 'B' ? 'bg-blue-950 text-blue-400 border-blue-900' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                        {m.segment === 'A' ? 'VIP' : m.segment === 'B' ? 'Aktif' : 'Standart'}
                                    </span>
                                )}
                            </div>
                            <div className="font-black text-white text-lg tracking-tight">{m.ad_soyad}</div>
                            {m.ad_soyad_ar && <div className="text-sm text-emerald-200 font-bold" dir="rtl">{m.ad_soyad_ar}</div>}
                            <div className="flex gap-4 mt-2 flex-wrap items-center">
                                {m.telefon && <span className="text-xs text-emerald-200 flex items-center gap-1 font-bold"><Phone size={12} /> {m.telefon}</span>}
                                {m.email && <span className="text-xs text-emerald-200 flex items-center gap-1 font-bold"><Mail size={12} /> {m.email}</span>}
                                {m.risk_limiti && <span className="text-xs text-amber-500 font-black px-2 py-0.5 bg-amber-950 rounded border border-amber-900">💳 Risk: ₺{parseFloat(m.risk_limiti).toFixed(0)}</span>}
                                {/* MS-03 Cari Bakiye Mockup */}
                                <span className="text-xs text-emerald-400 font-black px-2 py-0.5 bg-emerald-950 rounded border border-emerald-900">
                                    💵 Bakiye: 0.00 TL (Yakında)
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center shrink-0 flex-wrap">
                        <Link href={`/siparisler?musteri_kodu=${m.musteri_kodu}`} className="no-underline">
                            <button title='Sipariş Geçmişi' className="bg-blue-950 border border-blue-900 text-blue-400 px-3 py-1.5 rounded-lg cursor-pointer font-bold text-xs flex items-center gap-1.5 hover:bg-blue-900 transition-colors">
                                📋 Siparişler
                            </button>
                        </Link>
                        <button onClick={() => timelineAc(m)} title='İletişim Geçmişi' className="bg-slate-900 border border-slate-700 text-emerald-300 px-3 py-1.5 rounded-lg cursor-pointer font-bold text-xs flex items-center gap-1.5 hover:bg-slate-800 transition-colors">
                            <History size={14} /> Geçmiş
                        </button>
                        <button disabled={islemdeId === 'kliste_' + m.id} onClick={() => karaListeDegistir(m.id, !m.kara_liste)}
                            className={`px-3 py-1.5 rounded-lg cursor-pointer font-bold text-xs flex items-center gap-1.5 transition-colors border ${m.kara_liste ? 'bg-emerald-950 border-emerald-900 text-emerald-500 hover:bg-emerald-900' : 'bg-red-950 border-red-900 text-red-500 hover:bg-red-900'} ${islemdeId === 'kliste_' + m.id ? 'opacity-50 cursor-wait' : ''}`}>
                            {m.kara_liste ? <><ShieldCheck size={14} /> Aktifleştir</> : <><ShieldOff size={14} /> Kara Liste</>}
                        </button>
                        <button onClick={() => duzenle(m)} className="bg-amber-950 border border-amber-900 text-amber-500 px-3 py-1.5 rounded-lg cursor-pointer font-bold text-xs flex items-center gap-1.5 hover:bg-amber-900 transition-colors">
                            <Edit3 size={14} /> Düzenle
                        </button>
                        <button disabled={islemdeId === 'sil_' + m.id} onClick={() => sil(m.id, m.musteri_kodu)}
                            className={`p-2 bg-slate-900 border border-slate-800 text-red-500 rounded-lg cursor-pointer hover:bg-red-950 hover:border-red-900 transition-colors ${islemdeId === 'sil_' + m.id ? 'opacity-50 cursor-wait' : ''}`}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
