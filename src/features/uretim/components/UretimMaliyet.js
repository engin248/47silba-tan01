// @ts-nocheck

export default function UretimMaliyet({
    maliyetFormAcik, setMaliyetFormAcik, maliyetForm, setMaliyetForm,
    loading, maliyetKaydet, maliyetler, orders
}) {
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    return (
        <div>
            {maliyetFormAcik && (
                <div style={{ background: 'white', border: '2px solid #047857', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.08)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>Maliyet Girişi</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>İş Emri *</label>
                            <select value={maliyetForm.order_id} onChange={e => setMaliyetForm({ ...maliyetForm, order_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— İş Emri Seçiniz —</option>
                                {orders.map(o => <option key={o.id} value={o.id}>{o.b1_model_taslaklari?.model_kodu} | {o.quantity} adet</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Maliyet Tipi *</label>
                            <select value={maliyetForm.maliyet_tipi} onChange={e => setMaliyetForm({ ...maliyetForm, maliyet_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {MALIYET_TIPLERI.map(t => <option key={t.deger} value={t.deger}>{t.etiket}</option>)}
                            </select>
                        </div>
                        <div><label style={lbl}>Tutar (₺) *</label><input type="number" step="0.01" min="0" value={maliyetForm.tutar_tl} onChange={e => setMaliyetForm({ ...maliyetForm, tutar_tl: e.target.value })} placeholder="0.00" style={inp} /></div>
                        <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Açıklama *</label><input maxLength={200} value={maliyetForm.kalem_aciklama} onChange={e => setMaliyetForm({ ...maliyetForm, kalem_aciklama: e.target.value })} placeholder="örn: 3 personel × 4 saat" style={inp} /></div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setMaliyetFormAcik(false)} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                            <button onClick={maliyetKaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{loading ? '...' : 'Kaydet'}</button>
                        </div>
                    </div>
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {maliyetler.map(m => (
                    <div key={m.id} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.68rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{m.maliyet_tipi?.replace(/_/g, ' ')}</span>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginTop: 3 }}>{m.kalem_aciklama}</div>
                        </div>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.1rem' }}>₺{parseFloat(m.tutar_tl).toFixed(2)}</div>
                    </div>
                ))}
                {maliyetler.length > 0 && (
                    <div style={{ background: '#0f172a', borderRadius: 10, padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: 'white' }}>TOPLAM</span>
                        <span style={{ fontWeight: 900, color: '#34d399', fontSize: '1.3rem' }}>₺{maliyetler.reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0).toFixed(2)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
