import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function DenetmenSikayetlerTab() {
    return (
        <div style={{ background: '#1e1b4b', padding: '1.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 8px 32px rgba(49, 46, 129, 0.3)', minHeight: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem', borderBottom: '1px solid #312e81', paddingBottom: '1rem' }}>
                <div>
                    <h2 style={{ margin: '0', fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={20} color="#ea580c" /> [DN-05] Müşteri Şikayetleri & İade İnceleme Merkezi</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#c7d2fe' }}>Gelen sipariş şikayetlerini, abraj hatalarını ve ölçü sorunlarını kayıt altına alın.</p>
                </div>
                <button style={{ background: '#ea580c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}><ShieldAlert size={16} /> Yeni Şikayet Kaydı Aç</button>
            </div>

            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '2px dashed #4338ca' }}>
                <ShieldAlert size={48} color="#6366f1" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#c7d2fe' }}>Aktif Şikayet Kaydı Bulunmuyor</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>Şikayetler eklendiğinde AI Kalite Sınırları otomatik olarak güncellenecek ve ilgili departmana iade kesintisi yansıtılacaktır.</p>
            </div>
        </div>
    );
}
