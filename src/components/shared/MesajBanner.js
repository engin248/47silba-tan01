'use client';

/**
 * MesajBanner — Tüm sayfalardaki başarı/hata mesaj kutusu
 * Kullanım: <MesajBanner mesaj={mesaj} />
 */
export default function MesajBanner({ mesaj }) {
    if (!mesaj?.text) return null;
    const hata = mesaj.type === 'error';
    return (
        <div style={{
            padding: '10px 16px',
            marginBottom: '1rem',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '0.875rem',
            border: '2px solid',
            borderColor: hata ? '#ef4444' : '#10b981',
            background: hata ? '#fef2f2' : '#ecfdf5',
            color: hata ? '#b91c1c' : '#065f46',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        }}>
            {hata ? '⚠️' : '✅'} {mesaj.text}
        </div>
    );
}
