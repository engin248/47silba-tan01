'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Maximize, Activity, AlertTriangle, PlayCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih } from '@/lib/utils';
import CameraPlayer from './CameraPlayer';

// Mocked kameralar from the system plan (These will come from DB eventually)
const INITIAL_CAMERAS = [
    { id: 1, name: 'Kesim Masası A', src: 'cam_1', role: 'processing', status: 'online' },
    { id: 2, name: 'Dikim Bandı 1', src: 'cam_2', role: 'processing', status: 'online' },
    { id: 3, name: 'Dikim Bandı 2', src: 'cam_3', role: 'processing', status: 'online' },
    { id: 4, name: 'Kalite Kontrol', src: 'cam_4', role: 'qa', status: 'online' },
    { id: 5, name: 'Ütü Paketleme', src: 'cam_5', role: 'qa', status: 'online' },
    { id: 6, name: 'Kumaş Deposu', src: 'cam_6', role: 'storage', status: 'online' },
    { id: 7, name: 'Yükleme Alanı', src: 'cam_7', role: 'storage', status: 'online' },
    { id: 8, name: 'Koridor 1', src: 'cam_8', role: 'security', status: 'online' },
    { id: 9, name: 'Ana Giriş', src: 'cam_9', role: 'security', status: 'online' },
];

export default function KameralarMainContainer() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [kameralar, setKameralar] = useState(INITIAL_CAMERAS);
    const [odakliKamera, setOdakliKamera] = useState(null);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [pinAktif, setPinAktif] = useState(false);
    const [yetkili, setYetkili] = useState(false);

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const adminMi = kullanici?.grup === 'tam';
        if (uretimPin || adminMi) {
            setYetkili(true);
        } else {
            setYetkili(false);
        }
    }, [kullanici]);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 4000); };

    if (!yetkili) return (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 16, margin: '2rem' }}>
            <ShieldCheck size={48} color="#0f172a" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#0f172a', fontWeight: 900 }}>ÜRETİM GÜVENLİK PROTOKOLÜ</h2>
            <p style={{ color: '#64748b', fontWeight: 600 }}>Endüstriyel kamera analiz sistemine erişim için Üretim PİN doğrulaması gereklidir.</p>
        </div>
    );

    return (
        <div style={{ position: 'relative' }}>
            {/* ÜST BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: '#0f172a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={24} color="#38bdf8" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>KARARGÂH AI VİZYON PANELİ</h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>Endüstriyel Kamera Grid & AI Verimlilik Altyapısı (Faz 3)</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ background: '#ecfdf5', border: '1px solid #10b981', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: '0.75rem', fontWeight: 700 }}>
                        <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                        9 Stream Aktif
                    </div>
                </div>
            </div>

            {/* ODAK(FOCUS) EKRANI */}
            {odakliKamera && (
                <div style={{ background: '#0f172a', borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ padding: '0.75rem 1rem', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                            <span style={{ color: 'white', fontWeight: 800 }}>{odakliKamera.name} (MAIN STREAM)</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>1080p 25fps</span>
                        </div>
                        <button onClick={() => setOdakliKamera(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 800 }}>✖ Kapat</button>
                    </div>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'black' }}>
                        <CameraPlayer src={`${odakliKamera.src}_main`} type="main" />
                    </div>
                </div>
            )}

            {/* GRID EKRANI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {kameralar.map(kam => (
                    <div key={kam.id} style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '1px solid #334155' }}>
                        <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Camera size={14} color="#38bdf8" />
                                <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.8rem' }}>{kam.name}</span>
                            </div>
                            <button onClick={() => setOdakliKamera(kam)} title="Büyüt (Main Stream)" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                                <Maximize size={16} />
                            </button>
                        </div>
                        <div style={{ width: '100%', aspectRatio: '16/9', background: '#020617', position: 'relative' }}>
                            {/* IF ODAKLI KAMERA DEĞİLSE SUB STREAM YÜKLE */}
                            {(!odakliKamera || odakliKamera.id !== kam.id) ? (
                                <CameraPlayer src={`${kam.src}_sub`} type="sub" />
                            ) : (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontWeight: 800, fontSize: '0.8rem' }}>
                                    TAM EKRANDA AÇIK
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 8px rgba(239, 68, 68, 0.8); }
                    100% { transform: scale(0.95); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
}
