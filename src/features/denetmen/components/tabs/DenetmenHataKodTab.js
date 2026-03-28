import { TrendingUp } from 'lucide-react';

export default function DenetmenHataKodTab() {
    return (
        <div style={{ background: '#881337', padding: '1.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 8px 32px rgba(136, 19, 55, 0.3)', minHeight: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #9f1239', paddingBottom: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={20} color="#fda4af" /> [DN-02, DN-04] Hata Kodları & Pareto Analizi</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#fecaca' }}>Üretimdeki en sık görülen hataları Pareto prensibine (80/20) göre analiz edin. b2_hata_kodlari tablosundan beslenir.</p>
                </div>
            </div>

            <div style={{ background: '#4c0519', padding: '1.5rem', borderRadius: 12, border: '1px solid #7f1d1d', marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'white', fontWeight: 800 }}>En Sık Görülen Hatalar (Pareto %80 Dilimi)</h3>
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #9f1239', paddingBottom: 8 }}>
                        <span style={{ color: '#fda4af', fontWeight: 600 }}>D-01: Dikiş Atlaması</span>
                        <span style={{ color: 'white', fontWeight: 900 }}>45 Vaka (%40)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #9f1239', paddingBottom: 8 }}>
                        <span style={{ color: '#fda4af', fontWeight: 600 }}>K-03: Kumaş Abrajı</span>
                        <span style={{ color: 'white', fontWeight: 900 }}>28 Vaka (%25)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#fda4af', fontWeight: 600 }}>O-02: Ölçü Sapması (1cm+)</span>
                        <span style={{ color: 'white', fontWeight: 900 }}>17 Vaka (%15)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
