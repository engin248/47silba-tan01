'use client';
import { useEffect } from 'react';

//  GLOBAL HATA SINIRI (Next.js Error Boundary) 
// Herhangi bir sayfa ktğnde bu ekran gsterilir.
// Vercel + Sentry entegrasyonu iin hazır.
export default function HataSayfasi({ error, reset }) {
    useEffect(() => {
        // Hata loglama — console'a yaz (Sentry bağlanınca buraya hook edilir)
        console.error('[GLOBAL HATA]', error?.message, error?.stack);

        //  SENTRY HAZIR HOOK (Sentry kurulunca aktif olur) 
        // if (typeof window !== 'undefined' && window.Sentry) {
        //     window.Sentry.captureException(error);
        // }
    }, [error]);

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
            {/* İkon */}
            <div style={{ fontSize: '3rem' }}>️</div>

            {/* Başlık */}
            <h1 style={{
                color: '#f1f5f9',
                fontSize: '1.5rem',
                fontWeight: 900,
                letterSpacing: '0.05em',
                margin: 0,
                textAlign: 'center',
            }}>
                SİSTEM HATASI
            </h1>

            {/* Aıklama */}
            <p style={{
                color: '#94a3b8',
                fontSize: '0.9rem',
                textAlign: 'center',
                maxWidth: '400px',
                margin: 0,
                lineHeight: 1.6,
            }}>
                Beklenmedik bir hata oluştu. Verileriniz gvende, işlem kaydedilmedi.
            </p>

            {/* Hata detayı (sadece geliştirme ortamında) */}
            {process.env.NODE_ENV === 'development' && (
                <pre style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#fca5a5',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    maxWidth: '600px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                }}>
                    {error?.message}
                </pre>
            )}

            {/* Yeniden Dene */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={reset}
                    style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.03em',
                    }}
                >
                    🔄 Yeniden Dene
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.15)',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    🏠 Karargha Dn
                </button>
            </div>

            {/* Alt bilgi */}
            <p style={{ color: '#334155', fontSize: '0.7rem', margin: 0 }}>
                THE ORDER NIZAM — Hata Ref: {Date.now().toString(36).toUpperCase()}
            </p>
        </div>
    );
}
