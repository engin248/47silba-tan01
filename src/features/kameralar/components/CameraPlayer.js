'use client';

import React, { useState, useEffect } from 'react';
import { CameraOff, Loader2 } from 'lucide-react';

export default function CameraPlayer({ src, type = 'sub' }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Endpoint for Go2RTC WebRTC Stream
    // In production, this should point to the stream gateway API.
    const streamUrl = `http://localhost:1984/stream.html?src=${src}&mode=webrtc`;
    const bgColor = type === 'main' ? 'black' : '#020617';

    useEffect(() => {
        setLoading(true);
        setError(false);
        const timer = setTimeout(() => {
            // Assume loading is done after 2 seconds
            setLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, [src]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: bgColor }}>
            {loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bgColor, color: '#38bdf8' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1.5s linear infinite', marginBottom: 8 }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Stream Aranıyor...</span>
                </div>
            )}

            {error ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bgColor, color: '#ef4444' }}>
                    <CameraOff size={32} style={{ marginBottom: 8 }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Kamera Offline</span>
                </div>
            ) : (
                <iframe
                    src={streamUrl}
                    style={{ border: 'none', width: '100%', height: '100%', background: 'transparent' }}
                    allow="autoplay; fullscreen"
                    onLoad={() => setLoading(false)}
                    onError={() => setError(true)}
                />
            )}

            <style jsx>{`
    @keyframes spin { 100 % { transform: rotate(360deg); } }
    `}</style>
        </div>
    );
}
