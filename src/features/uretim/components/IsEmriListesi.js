'use client';
/**
 * features/uretim/components/IsEmriListesi.js
 * İş Emirleri UI Bileşeni — Listeleme, arama, filtre, toplu işlem, düzenleme, silme
 */
import { Trash2, Factory } from 'lucide-react';

export const ST_RENK = { pending: '#f59e0b', in_progress: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };
export const ST_LABEL = { pending: 'Bekliyor', in_progress: 'Üretimde', completed: 'Tamamlandı', cancelled: 'İptal' };

export default function IsEmriListesi({
    orders, modeller, loading, formAcik, setFormAcik, formOrder, setFormOrder,
    duzenleId, setDuzenleId, aramaMetni, setAramaMetni, filtreDurum, setFiltreDurum,
    seciliSiparisler, yeniIsEmri, duzenleIsEmri, silIsEmri, durumGuncelle,
    toggleSiparisSec, tumunuSec, topluDurumGuncelleAction,
}) {
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    const gorunenler = orders.filter(o =>
        (filtreDurum === 'hepsi' || o.status === filtreDurum) &&
        (!aramaMetni || [o.b1_model_taslaklari?.model_kodu, o.b1_model_taslaklari?.model_adi].some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase())))
    );

    return (
        <div>
            {/* FORM */}
            {formAcik && (
                <div style={{ background: 'white', border: `2px solid #047857`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.08)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>
                        {duzenleId ? '✏️ İş Emri Düzenle' : 'Yeni Üretim İş Emri'}
                    </h3>
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
                        <button onClick={() => { setFormAcik(false); setDuzenleId(null); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={yeniIsEmri} disabled={loading} style={{ padding: '9px 24px', background: duzenleId ? '#d97706' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                            {loading ? '...' : duzenleId ? '✏️ Güncelle' : 'Oluştur'}
                        </button>
                    </div>
                </div>
            )}

            {/* FİLTRE */}
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
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{gorunenler.length} kayıt</span>
            </div>

            {/* LİSTE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {gorunenler.length > 0 && (
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" checked={seciliSiparisler.length > 0 && seciliSiparisler.length === gorunenler.length} onChange={() => tumunuSec(gorunenler)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#047857' }} />
                            <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.85rem' }}>{seciliSiparisler.length > 0 ? `${seciliSiparisler.length} Seçili` : 'Tümünü Seç'}</span>
                        </div>
                        {seciliSiparisler.length > 0 && (
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => topluDurumGuncelleAction('in_progress')} style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' }}>⚡ Toplu Başlat</button>
                                <button onClick={() => topluDurumGuncelleAction('completed')} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' }}>✅ Toplu Bitti</button>
                            </div>
                        )}
                    </div>
                )}

                {gorunenler.map(o => (
                    <div key={o.id} style={{ background: 'white', border: '2px solid', borderColor: o.status === 'completed' ? '#10b981' : seciliSiparisler.includes(o.id) ? '#34d399' : '#f1f5f9', borderRadius: 14, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <input type="checkbox" checked={seciliSiparisler.includes(o.id)} onChange={() => toggleSiparisSec(o.id)} style={{ width: 22, height: 22, cursor: 'pointer', accentColor: '#047857' }} />
                                <div>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: '0.375rem' }}>
                                        <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>{o.b1_model_taslaklari?.model_kodu}</span>
                                        <span style={{ fontSize: '0.65rem', background: '#0f172a', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>{o.quantity} adet</span>
                                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700, background: `${ST_RENK[o.status]}20`, color: ST_RENK[o.status] }}>{ST_LABEL[o.status]}</span>
                                    </div>
                                    <h3 style={{ fontWeight: 800, margin: 0, color: '#0f172a' }}>{o.b1_model_taslaklari?.model_adi}</h3>
                                    {o.planned_start_date && (
                                        <p style={{ fontSize: '0.72rem', color: o.planned_end_date && new Date(o.planned_end_date) < new Date() && o.status !== 'completed' ? '#ef4444' : '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
                                            📅 {o.planned_start_date} → {o.planned_end_date || '?'}
                                            {o.planned_end_date && new Date(o.planned_end_date) < new Date() && o.status !== 'completed' ? ' 🔴 GECİKTİ!' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {o.status === 'pending' && <button onClick={() => durumGuncelle(o.id, 'in_progress')} style={{ padding: '6px 14px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>▶ Başlat</button>}
                                {o.status === 'in_progress' && <button onClick={() => durumGuncelle(o.id, 'completed')} style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>✅ Tamamla</button>}
                                <button onClick={() => duzenleIsEmri(o)} style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#d97706', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>✏️</button>
                                <button onClick={() => silIsEmri(o.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}

                {orders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16 }}>
                        <Factory size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                        <p style={{ color: '#94a3b8', fontWeight: 700 }}>İş emri yok. "Yeni İş Emri" ile başlayın.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
