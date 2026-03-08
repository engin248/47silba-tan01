import { Lock } from 'lucide-react';

export default function ErisimBariyeri({ mesaj, yetki }) {
    if (yetki) return null;
    return (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
            <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
            <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>{mesaj || 'Bu verileri görüntülemek için Yetkili Kullanıcı girişi gereklidir.'}</p>
        </div>
    );
}
