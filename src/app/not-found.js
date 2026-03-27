'use client';
import Link from 'next/link';

//  404 SAYFASI 
export default function BulunamadiSayfasi() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
        }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>
                404
            </div>
            <h1 style={{
                color: '#f59e0b',
                fontSize: '1.25rem',
                fontWeight: 900,
                letterSpacing: '0.1em',
                margin: 0,
                textTransform: 'uppercase',
            }}>
                SAYFA BULUNAMADI
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', maxWidth: '320px', margin: 0 }}>
                Bu rota sistemde tanımlı değil. Karargha dnn.
            </p>
            <Link href="/" style={{
                background: '#f59e0b',
                color: '#0f172a',
                textDecoration: 'none',
                padding: '10px 28px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
            }}>
                🏠 KARARGHA DN
            </Link>
        </div>
    );
}
