import { CheckCircle } from 'lucide-react';

export default function DenetmenAqlTab() {
    return (
        <div style={{ background: '#064e3b', padding: '1.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 8px 32px rgba(6, 78, 59, 0.3)', minHeight: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem', borderBottom: '1px solid #047857', paddingBottom: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={20} color="#a7f3d0" /> [DN-01] AQL Kalite Kontrol Formu</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#6ee7b7' }}>Uluslararası AQL standartlarına (Kabul Edilebilir Kalite Seviyesi) göre üretim bandı lotlarını denetleyin.</p>
                </div>
                <button style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>📑 Yeni AQL Raporu</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#022c22', padding: '1.5rem', borderRadius: 12, border: '1px solid #065f46' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Geçen Parti (Pass)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>12 <span style={{ fontSize: '1rem', color: '#a7f3d0' }}>Lot</span></div>
                </div>
                <div style={{ background: '#450a0a', padding: '1.5rem', borderRadius: 12, border: '1px solid #7f1d1d' }}>
                    <div style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Reddedilen Parti (Fail)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f87171' }}>1 <span style={{ fontSize: '1rem', color: '#fecaca' }}>Lot</span></div>
                </div>
            </div>
        </div>
    );
}
