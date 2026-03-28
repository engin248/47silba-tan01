// @ts-nocheck
import MesajBanner from '@/components/shared/MesajBanner';

export default function UretimRecete({
    receteMesaj, receteLoading, rIslemdeId,
    frmMakine, setFrmMakine, makineFormAcik, setMakineFormAcik,
    makineKaydet, makineDuzenle, makineSil,
    frmOperasyon, setFrmOperasyon, opFormAcik, setOpFormAcik,
    operasyonKaydet, operasyonDuzenle, operasyonSil,
    makineler, operasyonlar, modeller
}) {
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    return (
        <div>
            {receteMesaj?.text && <MesajBanner mesaj={receteMesaj} />}

            {makineFormAcik && (
                <div style={{ background: 'white', border: `2px solid #1e293b`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(30,41,59,0.08)' }}>
                    <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Makine Ekle / Düzenle</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                        <div><label style={lbl}>Makine Kodu *</label><input value={frmMakine.makine_kodu} onChange={e => setFrmMakine({ ...frmMakine, makine_kodu: e.target.value })} placeholder="Örn: OVL-01" style={inp} /></div>
                        <div><label style={lbl}>Makine Adı *</label><input value={frmMakine.makine_adi} onChange={e => setFrmMakine({ ...frmMakine, makine_adi: e.target.value })} placeholder="Örn: 4 İplik Overlok" style={inp} /></div>
                        <div><label style={lbl}>Durum</label>
                            <select value={frmMakine.durum} onChange={e => setFrmMakine({ ...frmMakine, durum: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                <option value="aktif">Aktif</option>
                                <option value="arizali">Arızalı</option>
                                <option value="bakimda">Bakımda</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setMakineFormAcik(false)} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={makineKaydet} disabled={receteLoading} style={{ padding: '9px 24px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{receteLoading ? '...' : 'Kaydet'}</button>
                    </div>
                </div>
            )}

            {opFormAcik && (
                <div style={{ background: 'white', border: `2px solid #047857`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.08)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>Üretim Operasyonu (Reçete Adımı) Ekle / Düzenle</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={lbl}>Model (Hangi Ürün) *</label>
                            <select value={frmOperasyon.model_id} onChange={e => setFrmOperasyon({ ...frmOperasyon, model_id: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                <option value="">— Model Seçiniz —</option>
                                {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} — {m.model_adi}</option>)}
                            </select>
                        </div>
                        <div><label style={lbl}>Operasyon / İşlem Adı *</label><input value={frmOperasyon.operasyon_adi} onChange={e => setFrmOperasyon({ ...frmOperasyon, operasyon_adi: e.target.value })} placeholder="Örn: Yaka Çatma" style={inp} /></div>
                        <div><label style={lbl}>Sıra No (Örn: 1, 2, 3)</label><input type="number" min="1" value={frmOperasyon.sira_no} onChange={e => setFrmOperasyon({ ...frmOperasyon, sira_no: e.target.value })} style={inp} /></div>
                        <div>
                            <label style={lbl}>Hangi Makinede (Opsiyonel)</label>
                            <select value={frmOperasyon.makine_id} onChange={e => setFrmOperasyon({ ...frmOperasyon, makine_id: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                <option value="">— Herhangi / El İşi —</option>
                                {makineler.map(m => <option key={m.id} value={m.id}>{m.makine_kodu} - {m.makine_adi}</option>)}
                            </select>
                        </div>
                        <div><label style={lbl}>Zorluk Endeksi (1-10)</label><input type="number" min="1" max="10" value={frmOperasyon.zorluk_derecesi} onChange={e => setFrmOperasyon({ ...frmOperasyon, zorluk_derecesi: e.target.value })} style={inp} /></div>
                        <div><label style={lbl}>Aparat Değişim vs (Sn)</label><input type="number" min="0" value={frmOperasyon.hazirlik_suresi_sn} onChange={e => setFrmOperasyon({ ...frmOperasyon, hazirlik_suresi_sn: e.target.value })} placeholder="Saniye" style={inp} /></div>
                        <div><label style={lbl}>Parça Başı Prim / Değer (TL)</label><input type="number" step="0.01" min="0" value={frmOperasyon.parca_basi_deger_tl} onChange={e => setFrmOperasyon({ ...frmOperasyon, parca_basi_deger_tl: e.target.value })} placeholder="Örn: 2.50" style={inp} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setOpFormAcik(false)} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={operasyonKaydet} disabled={receteLoading} style={{ padding: '9px 24px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{receteLoading ? '...' : 'Kaydet'}</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 2fr)', gap: '1.5rem', alignItems: 'start' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 16 }}>
                    <h4 style={{ fontWeight: 800, margin: '0 0 1rem 0', color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
                        FİZİKSEL MAKİNELER ({makineler.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {makineler.map(m => (
                            <div key={m.id} style={{ background: 'white', padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: '0.65rem', background: '#1e293b', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>{m.makine_kodu}</span>
                                        <span style={{ fontSize: '0.65rem', background: m.durum === 'aktif' ? '#ecfdf5' : '#fef2f2', color: m.durum === 'aktif' ? '#047857' : '#ef4444', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>{m.durum.toUpperCase()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{m.makine_adi}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => makineDuzenle(m)} style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#d97706', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem' }}>✏️</button>
                                    <button disabled={rIslemdeId === 'mak_sil_' + m.id} onClick={() => makineSil(m.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12} /></button>
                                </div>
                            </div>
                        ))}
                        {makineler.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Kayıtlı makine yok.</span>}
                    </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 16 }}>
                    <h4 style={{ fontWeight: 800, margin: '0 0 1rem 0', color: '#334155' }}>
                        ÜRETİM REÇETELERİ (Model Rotaları)
                    </h4>
                    {(() => {
                        const gruplu = operasyonlar.reduce((acc, curr) => {
                            const mAdi = curr.b1_model_taslaklari?.model_kodu + ' - ' + curr.b1_model_taslaklari?.model_adi;
                            if (!acc[mAdi]) acc[mAdi] = [];
                            acc[mAdi].push(curr);
                            return acc;
                        }, {});

                        return Object.keys(gruplu).map(modelAd => (
                            <div key={modelAd} style={{ marginBottom: '1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: 12, overflow: 'hidden' }}>
                                <div style={{ background: '#0f172a', padding: '0.75rem 1rem', display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <span style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>{modelAd}</span>
                                    <span style={{ background: '#047857', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>{gruplu[modelAd].length} Adım</span>
                                </div>
                                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {gruplu[modelAd].map(op => (
                                        <div key={op.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ background: '#cbd5e1', color: '#334155', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>{op.sira_no}</div>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{op.operasyon_adi}</div>
                                                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                                                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>⚙️ {op.b1_makineler?.makine_kodu || 'Yok (El İşi)'}</span>
                                                        <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>Zorluk: {op.zorluk_derecesi}/10</span>
                                                        <span style={{ fontSize: '0.65rem', color: '#047857', fontWeight: 700 }}>💰 {op.parca_basi_deger_tl} TL/Adet</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => operasyonDuzenle(op)} style={{ background: 'white', border: '1px solid #fde68a', color: '#d97706', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem' }}>✏️</button>
                                                <button disabled={rIslemdeId === 'op_sil_' + op.id} onClick={() => operasyonSil(op.id)} style={{ background: 'white', border: '1px solid #fecaca', color: '#dc2626', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                    {operasyonlar.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Hiç reçete (operasyon) tanımlanmamış.</span>}
                </div>
            </div>
        </div>
    );
}
