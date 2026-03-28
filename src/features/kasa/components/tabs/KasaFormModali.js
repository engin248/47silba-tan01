const HAREKET_TIPLERI = ['tahsilat', 'iade_odeme', 'cek', 'senet', 'avans', 'diger'];
const ODEME_YONTEMLERI = ['nakit', 'eft', 'kredi_karti', 'cek', 'senet', 'diger'];

const TIP_RENK = { tahsilat: '#059669', iade_odeme: '#ef4444', cek: '#f59e0b', senet: '#8b5cf6', avans: '#3b82f6', diger: '#64748b' };
const TIP_ICON = { tahsilat: '📈', iade_odeme: '↩️', cek: '📄', senet: '📋', avans: '💵', diger: '💰' };

export default function KasaFormModali({ formAcik, form, setForm, setFormAcik, BOSH_FORM, personeller, musteriler, kaydet, loading }) {
    if (!formAcik) return null;

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #1e4a43', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 5, textTransform: 'uppercase' };

    return (
        <div style={{ background: '#122b27', border: '2px solid #059669', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(5,150,105,0.1)' }}>
            <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>Yeni Kasa Hareketi</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
                <div>
                    <label style={lbl}>Hareket Tipi *</label>
                    <select value={form.hareket_tipi} onChange={e => setForm({ ...form, hareket_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: '#122b27', fontWeight: 700, color: TIP_RENK[form.hareket_tipi] }}>
                        {HAREKET_TIPLERI.map(t => <option key={t} value={t}>{TIP_ICON[t]} {t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </select>
                </div>
                <div>
                    <label style={lbl}>Ödeme Yöntemi *</label>
                    <select value={form.odeme_yontemi} onChange={e => setForm({ ...form, odeme_yontemi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: '#122b27', color: '#fff' }}>
                        {ODEME_YONTEMLERI.map(y => <option key={y} value={y}>{y.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </select>
                </div>
                <div>
                    <label style={lbl}>Tutar (₺) *</label>
                    <input type="number" min="0.01" step="0.01" value={form.tutar_tl} onChange={e => setForm({ ...form, tutar_tl: e.target.value })} placeholder="0.00" style={{ ...inp, fontWeight: 800, color: '#059669', background: '#fff' }} />
                </div>
                <div>
                    <label style={lbl}>Vade Tarihi (Çek/Senet)</label>
                    <input type="date" value={form.vade_tarihi} onChange={e => setForm({ ...form, vade_tarihi: e.target.value })} style={{ ...inp, background: '#fff' }} />
                </div>
                <div>
                    <label style={lbl}>{form.hareket_tipi === 'avans' ? 'İlişkili Personel' : 'Müşteri (İsteğe Bağlı)'}</label>
                    {form.hareket_tipi === 'avans' ? (
                        <select value={form.personel_id} onChange={e => setForm({ ...form, personel_id: e.target.value, musteri_id: '' })} style={{ ...inp, cursor: 'pointer', background: '#122b27', color: '#fff' }}>
                            <option value="">— Avans Verilen Personeli Seçin —</option>
                            {personeller.map(p => <option key={p.id} value={p.id}>{p.personel_kodu} | {p.ad_soyad}</option>)}
                        </select>
                    ) : (
                        <select value={form.musteri_id} onChange={e => setForm({ ...form, musteri_id: e.target.value, personel_id: '' })} style={{ ...inp, cursor: 'pointer', background: '#122b27', color: '#fff' }}>
                            <option value="">— Anonim / Perakende —</option>
                            {musteriler.map(m => <option key={m.id} value={m.id}>{m.musteri_kodu} | {m.ad_soyad}</option>)}
                        </select>
                    )}
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Açıklama *</label>
                    <input maxLength={500} value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} placeholder="Kasa hareketinin detayını yazın..." style={{ ...inp, background: '#fff' }} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); }} style={{ padding: '9px 18px', border: '2px solid #1e4a43', borderRadius: 8, background: '#122b27', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                <button onClick={kaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#059669', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                    {loading ? '...' : 'Kaydet'}
                </button>
            </div>
        </div>
    );
}
