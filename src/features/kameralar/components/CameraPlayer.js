'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, EyeOff } from 'lucide-react';

const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL || 'https://kamera.demirtekstiltheondercom.com';

export default function CameraPlayer({ src, type = 'sub', kameraAdi = '', offline = false }) {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);

    // Kameralarımız H.265 (HEVC) ürettiği için tarayıcılar (Chrome/Firefox) bunu gösteremiyor.
    // Bu yüzden go2rtc.yaml'da hazırladığımız H.264 dönüştürülmüş (_web) akışları çağırıyoruz.
    const streamSrc = `${src}_${type}_web`;
    const streamUrl = isVisible ? `${GO2RTC_URL}/stream.html?src=${streamSrc}&mode=mse,webrtc` : '';
    const bgColor = type === 'main' ? '#000' : '#020617';
    // 1. Lazy Loading (Intersection Observer)
    useEffect(() => {
        if (offline) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                } else {
                    // Ekrandan çıkınca yayını durdur (suspend stream)
                    setIsVisible(false);
                }
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [offline]);

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

            {/* go2rtc Native IFrame - Tüm Yükleme ve Hata Yönetimini Kendi İçinde Yapar */}
            {isVisible && (
                <iframe
                    src={streamUrl}
                    style={{ border: 'none', width: '100%', height: '100%', background: 'transparent', display: 'block', position: 'relative', zIndex: 0 }}
                    allow="autoplay; fullscreen; camera; microphone"
                    title={kameraAdi || src}
                />
            )}
        </div>
    );
}
