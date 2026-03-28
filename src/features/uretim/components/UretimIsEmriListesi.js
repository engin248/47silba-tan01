// @ts-nocheck
import DurumBadge from '@/components/ui/DurumBadge';
import { ST_RENK, ST_LABEL } from '@/features/uretim/hooks/useIsEmri';

export default function UretimIsEmriListesi({
    orders, modeller, formAcik, setFormAcik, formOrder, setFormOrder, loading,
    yeniIsEmri, aramaMetni, setAramaMetni, filtreDurum, setFiltreDurum,
    seciliSiparisler, tumunuSec, topluDurumGuncelleAction, islemdeId, toggleSiparisSec,
    durumGuncelle, duzenleIsEmri, silIsEmri, maliyetler
}) {
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    const gorunenler = orders.filter(o =>
        (filtreDurum === 'hepsi' || o.status === filtreDurum) &&
        (!aramaMetni || [o.b1_model_taslaklari?.model_kodu, o.b1_model_taslaklari?.model_adi].some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase())))
    );

    return (
        <div>
            {formAcik && (
                <div style={{ background: 'white', border: `2px solid #047857`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.08)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>Yeni Üretim İş Emri</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Model *</label>
                            <select value={formOrder.model_id} onChange={e => setFormOrder({ ...formOrder, model_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— Model Seçiniz —</option>
                                {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} — {m.model_adi}</option>)}
                            </select>
                        </div>
                        <div><label style={lbl}>Adet *</label><input type="number" min="1" value={formOrder.quantity} onChange={e => setFormOrder({ ...formOrder, quantity: e.target.value })} placeholder="1000" style={inp} /></div>
                        <div><label style={lbl}>Başlangıç</label><input type="date" value={formOrder.planned_start_date} onChange={e => setFormOrder({ ...formOrder, planned_start_date: e.target.value })} style={inp} /></div>
                        <div><label style={lbl}>Hedef Bitiş</label><input type="date" value={formOrder.planned_end_date} onChange={e => setFormOrder({ ...formOrder, planned_end_date: e.target.value })} style={inp} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setFormAcik(false)} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={yeniIsEmri} disabled={loading} style={{ padding: '9px 24px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{loading ? '...' : 'Oluştur'}</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                    <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} placeholder="Model kodu veya adına göre ara..." style={{ ...inp, paddingLeft: 36 }} />
                </div>
                {[['hepsi', 'Tümü', '#374151'], ['pending', '⏳ Bekliyor', '#d97706'], ['in_progress', '⚡ Üretimde', '#2563eb'], ['completed', '✅ Tamamlandı', '#047857'], ['cancelled', '❌ İptal', '#dc2626']].map(([v, l, c]) => (
                    <button key={v} onClick={() => setFiltreDurum(v)}
                        style={{ padding: '7px 12px', border: '2px solid', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', borderColor: filtreDurum === v ? c : '#e5e7eb', background: filtreDurum === v ? c : 'white', color: filtreDurum === v ? 'white' : '#374151' }}>
                        {l}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {gorunenler.length > 0 && (
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" checked={seciliSiparisler.length > 0 && seciliSiparisler.length === gorunenler.length} onChange={() => tumunuSec(gorunenler)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#047857' }} />
                            <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.85rem' }}>{seciliSiparisler.length > 0 ? `${seciliSiparisler.length} Seçili` : 'Tümünü Seç'}</span>
                        </div>
                        {seciliSiparisler.length > 0 && (
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button disabled={islemdeId === 'toplu_guncelle'} onClick={() => topluDurumGuncelleAction('in_progress')} style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: islemdeId === 'toplu_guncelle' ? 'wait' : 'pointer', fontSize: '0.75rem', opacity: islemdeId === 'toplu_guncelle' ? 0.5 : 1 }}>⚡ Toplu Başlat</button>
                                <button disabled={islemdeId === 'toplu_guncelle'} onClick={() => topluDurumGuncelleAction('completed')} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: islemdeId === 'toplu_guncelle' ? 'wait' : 'pointer', fontSize: '0.75rem', opacity: islemdeId === 'toplu_guncelle' ? 0.5 : 1 }}>✅ Toplu Bitti</button>
                            </div>
                        )}
                    </div>
                )}

                {gorunenler.map(o => {
                    const isGecikmeli = o.planned_end_date && new Date(o.planned_end_date) < new Date();
                    const pt = maliyetler.filter(m => m.order_id === o.id).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
                    const asama = o.status === 'pending' ? 1 : o.status === 'in_progress' ? 2 : 4;
                    return (
                        <div key={o.id} style={{ background: 'white', border: '2px solid', borderColor: o.status === 'completed' ? '#10b981' : seciliSiparisler.includes(o.id) ? '#34d399' : (isGecikmeli ? '#fca5a5' : '#f1f5f9'), borderRadius: 14, padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                    <input type="checkbox" checked={seciliSiparisler.includes(o.id)} onChange={() => toggleSiparisSec(o.id)} style={{ width: 22, height: 22, cursor: 'pointer', accentColor: '#047857', marginTop: 4 }} />
                                    <div>
                                        <div style={{ display: 'flex', gap: 6, marginBottom: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>{o.b1_model_taslaklari?.model_kodu}</span>
                                            <span style={{ fontSize: '0.65rem', background: '#0f172a', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>{o.quantity} adet</span>
                                            <DurumBadge durum={o.status} renkMap={ST_RENK} etiketMap={ST_LABEL} kucuk />
                                            {isGecikmeli && <span style={{ fontSize: '0.65rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }} className="animate-pulse">🚨 GECİKME!</span>}
                                            <span style={{ fontSize: '0.65rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>💰 MLT: ₺{pt.toFixed(2)}</span>
                                        </div>
                                        <h3 style={{ fontWeight: 800, margin: 0, color: '#0f172a' }}>{o.b1_model_taslaklari?.model_adi}</h3>

                                        <div style={{ display: 'flex', gap: 4, marginTop: 12, width: '200px' }}>
                                            {['Kesim', 'İmalat', 'Kalite', 'Sevk'].map((adim, idx) => (
                                                <div key={idx} style={{ flex: 1, height: 6, borderRadius: 3, background: asama >= (idx + 1) ? '#10b981' : '#e2e8f0', position: 'relative' }} title={adim} />
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: 24, fontSize: '0.6rem', color: '#94a3b8', fontWeight: 800, marginTop: 4, textTransform: 'uppercase' }}>
                                            <span>Kes</span><span>İml</span><span>Klt</span><span>Svk</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {o.status === 'pending' && <button disabled={islemdeId === 'durum_' + o.id} onClick={() => durumGuncelle(o.id, 'in_progress')} style={{ padding: '6px 14px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: islemdeId === 'durum_' + o.id ? 'wait' : 'pointer', fontSize: '0.78rem', opacity: islemdeId === 'durum_' + o.id ? 0.5 : 1 }}>▶ Başlat</button>}
                                        {o.status === 'in_progress' && <button disabled={islemdeId === 'durum_' + o.id} onClick={() => durumGuncelle(o.id, 'completed')} style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: islemdeId === 'durum_' + o.id ? 'wait' : 'pointer', fontSize: '0.78rem', opacity: islemdeId === 'durum_' + o.id ? 0.5 : 1 }}>✅ Tamamla</button>}
                                        <button onClick={() => duzenleIsEmri(o)} style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#d97706', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>✏️</button>
                                    </div>
                                    <button disabled={islemdeId === 'sil_' + o.id} onClick={() => silIsEmri(o.id)} style={{ width: '100%', background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: 8, cursor: islemdeId === 'sil_' + o.id ? 'wait' : 'pointer', opacity: islemdeId === 'sil_' + o.id ? 0.5 : 1 }}><Trash2 size={12} className="mx-auto" /></button>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {orders.length === 0 && <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16 }}><Factory size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} /><p style={{ color: '#94a3b8', fontWeight: 700 }}>İş emri yok.</p></div>}
            </div>
        </div>
    );
}
