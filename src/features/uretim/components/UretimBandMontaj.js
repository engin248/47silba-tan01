// @ts-nocheck
import Link from 'next/link';
import { getST_RENK } from '@/features/uretim/hooks/useIsEmri';

export default function UretimBandMontaj({
    aktifPersonel, isReworkMod, setIsReworkMod,
    barkodOkutulanIsId, setBarkodOkutulanIsId, barkodInputRef,
    ciftBarkodOtonomIslem, orders, personel
}) {
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };

    return (
        <div>
            <div style={{ background: '#0f172a', border: `2px solid ${aktifPersonel ? '#10b981' : '#334155'}`, borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: 12, alignItems: 'center', transition: 'all 0.3s' }}>
                <div style={{ padding: 10, background: aktifPersonel ? '#064e3b' : '#1e293b', borderRadius: 8 }}><Play size={24} color="#34d399" /></div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'white', margin: '0 0 6px', fontWeight: 800 }}>Otonom Performans Terminali (Çift Barkod)</h4>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>1. Önce personel kartını okutun. 2. Sonra sepet/iş barkodunu okutarak işi başlatın veya bitirin.</p>
                    {aktifPersonel && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800 }}>👨‍🔧 İşleme Hazır: {aktifPersonel.ad_soyad}</div>
                            <button onClick={() => setIsReworkMod(!isReworkMod)} style={{ padding: '6px 12px', background: isReworkMod ? 'rgba(239, 68, 68, 0.15)' : 'rgba(51, 65, 85, 0.5)', border: `1px solid ${isReworkMod ? '#ef4444' : '#475569'}`, color: isReworkMod ? '#f87171' : '#94a3b8', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isReworkMod ? '#ef4444' : '#64748b', boxShadow: isReworkMod ? '0 0 8px #ef4444' : 'none' }}></div>
                                {isReworkMod ? '🔧 TAMİR (REWORK)' : 'Normal Üretim'}
                            </button>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input ref={barkodInputRef} type="text" value={barkodOkutulanIsId} onChange={e => setBarkodOkutulanIsId(e.target.value)}
                        placeholder={aktifPersonel ? "SEPET Barkodunu Okut..." : "YAKA Barkodunu Okut..."} style={{ ...inp, width: 220, border: `2px solid ${aktifPersonel ? '#10b981' : '#3b82f6'}`, background: '#1e293b', color: 'white', fontWeight: 700 }}
                        onKeyDown={e => { if (e.key === 'Enter') ciftBarkodOtonomIslem(barkodOkutulanIsId); }} />
                    <Link href="/uretim-kiosk" target="_blank">
                        <button style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '0 16px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s', height: '100%' }}>
                            📱 TAM EKRAN KİOSK
                        </button>
                    </Link>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>📋 Aktif İş Emirleri</div>
                    {orders.filter(o => ['pending', 'in_progress'].includes(o.status)).map(o => (
                        <div key={o.id} style={{ background: 'white', border: `2px solid ${getST_RENK(o.status)}40`, borderRadius: 10, padding: '0.875rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.62rem', background: '#ecfdf5', color: '#047857', padding: '2px 7px', borderRadius: 4, fontWeight: 800 }}>{o.b1_model_taslaklari?.model_kodu}</span>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', marginTop: 4 }}>{o.b1_model_taslaklari?.model_adi}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{o.quantity} adet</div>
                        </div>
                    ))}
                </div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>👥 Aktif Personel ({personel.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 400, overflowY: 'auto' }}>
                        {personel.map(p => (
                            <div key={p.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.ad_soyad}</div>
                                <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#059669', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>✅ Aktif</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
