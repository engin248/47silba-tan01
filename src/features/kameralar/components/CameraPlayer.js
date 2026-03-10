'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CameraOff, Loader2, WifiOff } from 'lucide-react';

// go2rtc stream sunucu URL — RTSP proxy WebRTC gateway
const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL || 'http://localhost:1984';

export default function CameraPlayer({ src, type = 'sub', kameraAdi = '', offline = false }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const iframeRef = useRef(null);

    // go2rtc WebRTC stream URL: src = 'd1_sub' veya 'd1_main'
    const streamSrc = `${src}_${type}`;
    const streamUrl = `${GO2RTC_URL}/stream.html?src=${streamSrc}&mode=webrtc`;
    const bgColor = type === 'main' ? '#000' : '#020617';

    useEffect(() => {
        setLoading(true);
        setError(false);
        // go2rtc bağlantı timeout: sub=3sn, main=5sn
        const timeout = type === 'main' ? 5000 : 3000;
        const timer = setTimeout(() => setLoading(false), timeout);
        return () => clearTimeout(timer);
    }, [src, type]);

    // Offline kamera — doğrudan hata göster
    if (offline) {
        return (
            <div style={{ width: '100%', height: '100%', position: 'relative', background: bgColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <WifiOff size={28} color="#ef4444" style={{ marginBottom: 6 }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444' }}>Kamera Offline</span>
                {kameraAdi && <span style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 3 }}>{kameraAdi}</span>}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: bgColor }}>

            {/* Yükleniyor spinner */}
            {loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bgColor, color: '#38bdf8', zIndex: 2 }}>
                    <Loader2 size={28} style={{ marginBottom: 6, animation: 'camSpin 1.2s linear infinite' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Stream Bağlanıyor...</span>
                    {kameraAdi && <span style={{ fontSize: '0.58rem', color: '#64748b', marginTop: 2 }}>{kameraAdi}</span>}
                </div>
            )}

            {/* Hata durumu */}
            {error && !loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bgColor, color: '#ef4444', zIndex: 2 }}>
                    <CameraOff size={28} style={{ marginBottom: 6 }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Stream Bağlanamadı</span>
                    <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 2 }}>go2rtc çalışıyor mu?</span>
                </div>
            )}

            {/* go2rtc WebRTC iframe */}
            {!error && (
                <iframe
                    ref={iframeRef}
                    src={streamUrl}
                    style={{ border: 'none', width: '100%', height: '100%', background: 'transparent', display: loading ? 'none' : 'block' }}
                    allow="autoplay; fullscreen; camera; microphone"
                    onLoad={() => setLoading(false)}
                    onError={() => { setLoading(false); setError(true); }}
                    title={kameraAdi || src}
                />
            )}

            <style>{`
                @keyframes camSpin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
