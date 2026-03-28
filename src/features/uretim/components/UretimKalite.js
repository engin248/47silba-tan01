import { Play, Pause, Square } from 'lucide-react';

export default function UretimKalite({ orders, kronometer, sure, formatSure, baslat, duraklat, durdur }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {orders.filter(o => o.status === 'in_progress').map(o => (
                <div key={o.id} style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 14, padding: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>{o.b1_model_taslaklari?.model_adi}</div>
                    <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: kronometer[o.id]?.aktif ? '#f97316' : '#0f172a' }}>
                            {formatSure(sure[o.id] || 0)}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!kronometer[o.id]?.aktif ? (
                            <button onClick={() => baslat(o.id)} style={{ flex: 1, padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <Play size={14} /> {sure[o.id] > 0 ? 'Devam Et' : 'Başla'}
                            </button>
                        ) : (
                            <>
                                <button onClick={() => duraklat(o.id)} style={{ flex: 1, padding: '8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    <Pause size={14} /> Mola
                                </button>
                                <button onClick={() => durdur(o.id)} style={{ flex: 1, padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    <Square size={14} /> Bitir & Yaz
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
            {orders.filter(o => o.status === 'in_progress').length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                    <p style={{ color: '#94a3b8', fontWeight: 700 }}>Aktif üretim yok. D-A'da iş emri başlatın.</p>
                </div>
            )}
        </div>
    );
}
