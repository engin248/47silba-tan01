'use client';

/**
 * VeriYokEkran — Boş liste durumu
 * Kullanım: <VeriYokEkran mesaj="Henüz kayıt yok." icon="📋" />
 */
export default function VeriYokEkran({ mesaj = 'Kayıt bulunamadı.', icon = '📋', aksiyon }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '4rem',
            background: '#f8fafc',
            borderRadius: 16,
            border: '2px dashed #e5e7eb',
        }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
            <p style={{ color: '#94a3b8', fontWeight: 700, margin: 0 }}>{mesaj}</p>
            {aksiyon && (
                <div style={{ marginTop: '1rem' }}>{aksiyon}</div>
            )}
        </div>
    );
}
