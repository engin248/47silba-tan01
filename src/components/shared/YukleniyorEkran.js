'use client';

/**
 * YuklenivorEkran — Spinner / yükleniyor durumu
 * Kullanım: if (loading) return <YuklenivorEkran />;
 */
export default function YukleniyorEkran({ mesaj = 'Yükleniyor...' }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '4rem',
            color: '#94a3b8',
            fontWeight: 700,
            fontSize: '1rem',
        }}>
            ⏳ {mesaj}
        </div>
    );
}
