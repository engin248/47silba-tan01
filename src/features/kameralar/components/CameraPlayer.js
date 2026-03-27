'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CameraOff, Loader2, WifiOff, EyeOff } from 'lucide-react';

const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL || 'http://localhost:1984';

export default function CameraPlayer({ src, type = 'sub', kameraAdi = '', offline = false }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const containerRef = useRef(null);
    const iframeRef = useRef(null);

    const streamSrc = `${src}_${type}`;
    // Ekranda görünürse stream'i başlat (Cloudflare Tunnel uyumu için MSE/WebSocket kullanılır)
    const streamUrl = isVisible ? `${GO2RTC_URL}/stream.html?src=${streamSrc}&mode=mse` : '';
    const bgColor = type === 'main' ? '#000' : '#020617';

    // 1. Lazy Loading (Intersection Observer)
    useEffect(() => {
        if (offline) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                } else {
                    // Ekrandan çıkınca askıya al (suspend)
                    setIsVisible(false);
                    setLoading(true);
                }
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [offline]);

    // 2. Timeout Kontrolü (Connection delay)
    // FİX: loading state dependency array'den çıkarıldı → sonsuz render döngüsü engellendi
    // loadingRef.current ile anlık state okunur (stale closure olmadan)
    const loadingRef = useRef(loading);
    useEffect(() => { loadingRef.current = loading; }, [loading]);

    useEffect(() => {
        if (!isVisible || offline || error) return;
        setLoading(true);
        const timeout = type === 'main' ? 5000 : 3000;
        const timer = setTimeout(() => {
            if (loadingRef.current) {
                setError(true);
                setLoading(false);
            }
        }, timeout);
        return () => clearTimeout(timer);
    }, [isVisible, type, retryCount, offline, error]);

    // 3. Auto-Reconnect / Self Healing
    useEffect(() => {
        if (error && isVisible) {
            const reconnectDelay = Math.min(1000 * Math.pow(2, retryCount), 15000); // 1s, 2s, 4s, 8s, 15s max
            const retryTimer = setTimeout(() => {
                setError(false);
                setLoading(true);
                setRetryCount((prev) => prev + 1);
            }, reconnectDelay);
            return () => clearTimeout(retryTimer);
        }
    }, [error, isVisible, retryCount]);

    useEffect(() => {
        if (!error && isVisible) {
            setRetryCount(0); // Bağlantı kurulunca retry sıfırla
        }
    }, [error, isVisible]);


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
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', background: bgColor }}>

            {/* Görünür Değilse */}
            {!isVisible && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bgColor, color: '#64748b', zIndex: 1 }}>
                    <EyeOff size={24} style={{ marginBottom: 6 }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Askıda (Uyku)</span>
                </div>
            )}

            {/* Yükleniyor spinner */}
            {isVisible && loading && !error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bgColor, color: '#38bdf8', zIndex: 2 }}>
                    <Loader2 size={28} style={{ marginBottom: 6, animation: 'camSpin 1.2s linear infinite' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Bağlanıyor...</span>
                    {retryCount > 0 && <span style={{ fontSize: '0.6rem', color: '#f59e0b', marginTop: 3 }}>Yeniden Deneniyor ({retryCount})</span>}
                </div>
            )}

            {/* Hata durumu */}
            {isVisible && error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bgColor, color: '#ef4444', zIndex: 2 }}>
                    <CameraOff size={28} style={{ marginBottom: 6 }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Stream Hatası</span>
                    <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 2 }}>Otomatik bağlanılacak... ({retryCount})</span>
                </div>
            )}

            {/* go2rtc WebRTC iframe */}
            {isVisible && !error && (
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

