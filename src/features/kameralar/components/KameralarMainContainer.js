'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Camera, Maximize, Minimize, ShieldCheck, RefreshCw,
    Eye, Filter, Clock, Download, AlertTriangle, Wifi, WifiOff,
    Activity, Video, Lock
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { supabase } from '@/lib/supabase';
import { telegramBildirim, formatTarih } from '@/lib/utils';
import CameraPlayer from './CameraPlayer';

// ── NVR Gerçek Kamera Listesi (Neutron NEU-NVR116-SHD @ 192.168.1.200) ──
// RTSP: rtsp://admin:tuana1452.@192.168.1.200:554/unicast/c{n}/s{0=main,1=sub}/live
const VARSAYILAN_KAMERALAR = [
    { id: 1, nvr_kanal: 'D1', name: 'Ana Giriş', src: 'd1', role: 'security', status: 'offline', work_center: 'Güvenlik', ip: '192.168.1.201' },
    { id: 2, nvr_kanal: 'D2', name: 'Kesim Masası A', src: 'd2', role: 'processing', status: 'online', work_center: 'Kesimhane', ip: '192.168.1.202' },
    { id: 3, nvr_kanal: 'D3', name: 'Dikim Bandı 1', src: 'd3', role: 'processing', status: 'online', work_center: 'İmalat', ip: '192.168.1.203' },
    { id: 4, nvr_kanal: 'D4', name: 'Dikim Bandı 2', src: 'd4', role: 'processing', status: 'online', work_center: 'İmalat', ip: '192.168.1.204' },
    { id: 5, nvr_kanal: 'D5', name: 'Kalite Kontrol', src: 'd5', role: 'qa', status: 'online', work_center: 'KK Birimi', ip: '192.168.1.205' },
    { id: 6, nvr_kanal: 'D6', name: 'Ütü & Paketleme', src: 'd6', role: 'qa', status: 'online', work_center: 'KK Birimi', ip: '192.168.1.206' },
    { id: 7, nvr_kanal: 'D7', name: 'Kumaş Deposu', src: 'd7', role: 'storage', status: 'online', work_center: 'Depo', ip: '192.168.1.207' },
    { id: 8, nvr_kanal: 'D8', name: 'Yükleme Alanı', src: 'd8', role: 'storage', status: 'online', work_center: 'Depo', ip: '192.168.1.208' },
    { id: 9, nvr_kanal: 'D9', name: 'Üretim Koridoru', src: 'd9', role: 'security', status: 'online', work_center: 'Güvenlik', ip: '192.168.1.209' },
    { id: 10, nvr_kanal: 'D10', name: 'Depo Girişi', src: 'd10', role: 'storage', status: 'online', work_center: 'Depo', ip: '192.168.1.210' },
    { id: 11, nvr_kanal: 'D11', name: 'Makine Alanı', src: 'd11', role: 'processing', status: 'online', work_center: 'İmalat', ip: '192.168.1.211' },
    { id: 12, nvr_kanal: 'D12', name: 'Ofis / Yönetim', src: 'd12', role: 'security', status: 'online', work_center: 'Güvenlik', ip: '192.168.1.212' },
];

const ROL_ETİKET = {
    hepsi: { label: 'Tüm Kameralar', emoji: '📹', renk: '#334155' },
    processing: { label: 'Üretim', emoji: '⚙️', renk: '#047857' },
    qa: { label: 'Kalite', emoji: '✅', renk: '#0284c7' },
    storage: { label: 'Depo', emoji: '📦', renk: '#b45309' },
    security: { label: 'Güvenlik', emoji: '🛡️', renk: '#7c3aed' },
};

export default function KameralarMainContainer() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';

    const [yetkili, setYetkili] = useState(false);
    const [kameralar, setKameralar] = useState(VARSAYILAN_KAMERALAR);
    const [odakliKamera, setOdakliKamera] = useState(null);
    const [aktifRol, setAktifRol] = useState('hepsi');
    const [erisimLog, setErisimLog] = useState([]);
    const [logPanelAcik, setLogPanelAcik] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [streamDurum, setStreamDurum] = useState('kontrol'); // kontrol | aktif | kapali

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    // ── Yetki Kontrolü ─────────────────────────────────────────
    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); }
        catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const adminMi = kullanici?.grup === 'tam';
        if (uretimPin || adminMi) {
            setYetkili(true);
            kameraErisimLogAt('SİSTEM GİRİŞİ');
        } else {
            setYetkili(false);
        }
    }, [kullanici]);

    // ── DB'den kamera listesi çek ──────────────────────────────
    useEffect(() => {
        if (!yetkili) return;
        const kameraYukle = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('cameras')
                    .select('*')
                    .order('id', { ascending: true });
                if (!error && data && data.length > 0) {
                    setKameralar(data);
                }
                // Tablo yoksa veya boşsa VARSAYILAN_KAMERALAR kullanılmaya devam eder
            } catch (e) {
                // Tablo henüz oluşturulmamış — varsayılan kullan
            }
            setLoading(false);
        };
        kameraYukle();
        streamDurumKontrol();
    }, [yetkili]);

    // ── Stream Sunucu Durumu ──────────────────────────────────
    const streamDurumKontrol = async () => {
        try {
            const res = await fetch('http://localhost:1984/', { signal: AbortSignal.timeout(2000) });
            setStreamDurum(res.ok ? 'aktif' : 'kapali');
        } catch {
            setStreamDurum('kapali');
        }
    };

    // ── Erişim Logu Yaz ──────────────────────────────────────
    const kameraErisimLogAt = useCallback(async (islem, kameraAdi = null) => {
        const logEntry = {
            kullanici: kullanici?.email || kullanici?.ad || 'Bilinmeyen',
            islem,
            kamera: kameraAdi,
            zaman: new Date().toISOString(),
        };
        setErisimLog(prev => [logEntry, ...prev].slice(0, 50));
        try {
            await supabase.from('camera_access_log').insert([{
                user_id: kullanici?.id || null,
                kullanici_adi: logEntry.kullanici,
                islem_tipi: islem,
                kamera_adi: kameraAdi,
                ip_adresi: 'client',
            }]);
        } catch { /* tablo henüz yoksa sessizce geç */ }
    }, [kullanici]);

    // ── Kamera Büyüt (Focus) ──────────────────────────────────
    const kameraOdakla = (kam) => {
        setOdakliKamera(kam);
        kameraErisimLogAt('TAM EKRAN AÇILDI', kam.name);
    };

    // ── Snapshot + Telegram ──────────────────────────────────
    const snapshotGonder = async (kam) => {
        goster(`📸 ${kam.name} anlık görüntü Telegram'a gönderiliyor...`);
        telegramBildirim(
            `📸 KAMERA SNAPSHOT\nKamera: ${kam.name}\nKonum: ${kam.work_center || '—'}\nTarih: ${new Date().toLocaleString('tr-TR')}\n\n⚠️ İnsansız görüntü / İşlem dışı alan tespit bildirimleri için bu kanalı takip edin.`
        );
        kameraErisimLogAt('SNAPSHOT TELEGRAM', kam.name);
        // DB'ye event log
        try {
            await supabase.from('camera_events').insert([{
                camera_id: kam.id,
                event_type: 'snapshot',
                video_url: null,
            }]);
        } catch { /* tablo yoksa geç */ }
    };

    // ── Filtrelenmiş Kameralar ──────────────────────────────
    const filtreliKameralar = aktifRol === 'hepsi'
        ? kameralar
        : kameralar.filter(k => k.role === aktifRol);

    // ── Erişimsiz Ekran ──────────────────────────────────────
    if (!yetkili) return (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 20, margin: '2rem', border: '2px solid #334155' }}>
            <div style={{ width: 72, height: 72, background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid #38bdf8' }}>
                <Lock size={36} color="#38bdf8" />
            </div>
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.4rem' }}>ÜRETİM GÜVENLİK PROTOKOLÜ</h2>
            <p style={{ color: '#94a3b8', fontWeight: 600, marginTop: 8 }}>
                Endüstriyel kamera sistemi için Üretim PIN doğrulaması gereklidir.
            </p>
            <a href="/" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '10px 24px', background: '#38bdf8', color: '#0f172a', borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>
                🔑 Karargâh'a Git (PIN Giriş)
            </a>
        </div>
    );

    return (
        <div dir={isAR ? 'rtl' : 'ltr'} style={{ position: 'relative' }}>

            {/* ÜST BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #38bdf8' }}>
                        <Camera size={24} color="#38bdf8" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            KARARGÂH VİZYON PANELİ
                        </h1>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                            {kameralar.length} Kamera · Endüstriyel AI İzleme (go2rtc WebRTC)
                        </p>
                    </div>
                </div>

                {/* DURUM ROZETLERI */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* Stream Durumu */}
                    <div style={{
                        padding: '6px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.75rem',
                        background: streamDurum === 'aktif' ? '#ecfdf5' : streamDurum === 'kapali' ? '#fef2f2' : '#f8fafc',
                        border: `1px solid ${streamDurum === 'aktif' ? '#10b981' : streamDurum === 'kapali' ? '#ef4444' : '#e2e8f0'}`,
                        color: streamDurum === 'aktif' ? '#059669' : streamDurum === 'kapali' ? '#dc2626' : '#94a3b8',
                    }}>
                        {streamDurum === 'aktif' ? <Wifi size={14} /> : streamDurum === 'kapali' ? <WifiOff size={14} /> : <Activity size={14} />}
                        {streamDurum === 'aktif' ? 'Stream Aktif' : streamDurum === 'kapali' ? 'Stream Kapalı' : 'Kontrol Ediliyor...'}
                    </div>

                    {/* Aktif kamera sayısı */}
                    <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '6px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>
                        <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }} />
                        {filtreliKameralar.length} / {kameralar.length} Aktif
                    </div>

                    {/* Log Panel */}
                    <button onClick={() => setLogPanelAcik(!logPanelAcik)}
                        style={{ background: logPanelAcik ? '#1e293b' : 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 8, color: logPanelAcik ? 'white' : '#374151', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={14} /> Erişim Logu ({erisimLog.length})
                    </button>

                    {/* Yenile */}
                    <button onClick={() => { streamDurumKontrol(); }}
                        style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: 8, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* BİLDİRİM */}
            {mesaj.text && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.text}
                </div>
            )}

            {/* ERİŞİM LOG PANELİ */}
            {logPanelAcik && (
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', maxHeight: 200, overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        🔐 Kamera Erişim Logu (Son {erisimLog.length} Kayıt)
                    </div>
                    {erisimLog.length === 0 && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Henüz kayıt yok.</div>}
                    {erisimLog.map((log, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: '#94a3b8', padding: '3px 0', borderBottom: '1px solid #1e293b' }}>
                            <span style={{ color: '#38bdf8', fontWeight: 700, whiteSpace: 'nowrap' }}>{new Date(log.zaman).toLocaleTimeString('tr-TR')}</span>
                            <span style={{ color: '#f8fafc', fontWeight: 700 }}>{log.islem}</span>
                            {log.kamera && <span style={{ color: '#fbbf24' }}>{log.kamera}</span>}
                            <span style={{ marginLeft: 'auto', color: '#475569' }}>{log.kullanici}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ROL FİLTRELERİ */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {Object.entries(ROL_ETİKET).map(([rol, meta]) => (
                    <button key={rol} onClick={() => setAktifRol(rol)}
                        style={{
                            padding: '7px 16px', border: '2px solid', borderRadius: 9, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem',
                            borderColor: aktifRol === rol ? meta.renk : '#e2e8f0',
                            background: aktifRol === rol ? meta.renk : 'white',
                            color: aktifRol === rol ? 'white' : '#374151',
                            transition: 'all 0.15s',
                        }}>
                        {meta.emoji} {meta.label}
                    </button>
                ))}
            </div>

            {/* STREAM KAPALI UYARISI */}
            {streamDurum === 'kapali' && (
                <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertTriangle size={20} color="#d97706" />
                    <div>
                        <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.9rem' }}>go2rtc Stream Sunucusu Kapalı</div>
                        <div style={{ fontSize: '0.78rem', color: '#78350f', marginTop: 2 }}>
                            Canlı video aktarımı için stream sunucusunu başlatın: <code style={{ background: '#fde68a', padding: '1px 6px', borderRadius: 4 }}>cd stream-server && go2rtc</code>
                            &nbsp;·&nbsp;Şu an kamera grid UI aktif, stream bağlanınca otomatik yayına geçer.
                        </div>
                    </div>
                </div>
            )}

            {/* ODAK (FOCUS) EKRANI */}
            {odakliKamera && (
                <div style={{ background: '#0f172a', borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '2px solid #1e293b' }}>
                    <div style={{ padding: '0.75rem 1.25rem', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%', animation: 'camPulse 1s infinite' }} />
                            <span style={{ color: 'white', fontWeight: 800 }}>{odakliKamera.name}</span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b', background: '#0f172a', padding: '2px 8px', borderRadius: 4 }}>MAIN STREAM · 1080p 25fps</span>
                            <span style={{ fontSize: '0.68rem', background: `${ROL_ETİKET[odakliKamera.role]?.renk}30`, color: ROL_ETİKET[odakliKamera.role]?.renk, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                                {ROL_ETİKET[odakliKamera.role]?.emoji} {ROL_ETİKET[odakliKamera.role]?.label}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => snapshotGonder(odakliKamera)}
                                style={{ background: '#0ea5e9', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Download size={13} /> Snapshot → Telegram
                            </button>
                            <button onClick={() => setOdakliKamera(null)}
                                style={{ background: '#ef4444', border: 'none', color: 'white', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 800 }}>
                                ✖ Kapat
                            </button>
                        </div>
                    </div>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'black' }}>
                        <CameraPlayer src={odakliKamera.src} type="main" kameraAdi={odakliKamera.name} offline={odakliKamera.status === 'offline'} />
                    </div>
                </div>
            )}

            {/* KAMERA GRİD */}
            {filtreliKameralar.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                    <Camera size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                    <p style={{ color: '#94a3b8', fontWeight: 700 }}>Bu kategoride kamera bulunamadı.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {filtreliKameralar.map(kam => (
                        <div key={kam.id} style={{
                            background: '#1e293b', borderRadius: 14, overflow: 'hidden',
                            border: `2px solid ${odakliKamera?.id === kam.id ? '#38bdf8' : '#334155'}`,
                            transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}>
                            {/* Kamera Başlığı */}
                            <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, background: kam.status === 'online' ? '#10b981' : '#ef4444', borderRadius: '50%' }} />
                                    <Camera size={13} color="#38bdf8" />
                                    <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.82rem' }}>{kam.name}</span>
                                    {kam.work_center && (
                                        <span style={{ fontSize: '0.6rem', background: '#0f172a', color: '#64748b', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{kam.work_center}</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {/* Snapshot */}
                                    <button onClick={() => snapshotGonder(kam)} title="Telegram'a Snapshot Gönder"
                                        style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                                        <Download size={13} />
                                    </button>
                                    {/* Büyüt */}
                                    <button onClick={() => kameraOdakla(kam)} title="Tam Ekran (Main Stream)"
                                        style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                                        <Maximize size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Video Alanı */}
                            <div style={{ width: '100%', aspectRatio: '16/9', background: '#020617', position: 'relative' }}>
                                {(!odakliKamera || odakliKamera.id !== kam.id) ? (
                                    <CameraPlayer src={kam.src} type="sub" kameraAdi={kam.name} offline={kam.status === 'offline'} />
                                ) : (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontWeight: 800, fontSize: '0.8rem', gap: 6 }}>
                                        <Video size={16} /> TAM EKRANDA AÇIK
                                    </div>
                                )}
                            </div>

                            {/* Alt Bilgi Şeridi */}
                            <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #0f172a' }}>
                                <span style={{ fontSize: '0.62rem', color: ROL_ETİKET[kam.role]?.renk || '#64748b', fontWeight: 700 }}>
                                    {ROL_ETİKET[kam.role]?.emoji} {ROL_ETİKET[kam.role]?.label || kam.role}
                                </span>
                                <span style={{ fontSize: '0.6rem', color: '#475569', fontWeight: 600 }}>360p · 10fps sub</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* AI BÖLÜMÜ (FAZ 4 Planı) */}
            <div style={{ marginTop: '2rem', background: 'linear-gradient(135deg,#0f172a,#1e293b)', border: '1px solid #334155', borderRadius: 16, padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                    <Activity size={18} color="#a78bfa" />
                    <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>AI Üretim Analiz Motoru (FAZ 4 — Geliştiriliyor)</span>
                    <span style={{ fontSize: '0.65rem', background: '#312e81', color: '#a78bfa', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>YAKIN</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {[
                        { ikon: '🏭', baslik: 'Bant Durma Tespiti', durum: 'Planlandı', renk: '#7c3aed' },
                        { ikon: '👤', baslik: 'İşçi Yokluğu Alarmı', durum: 'Planlandı', renk: '#7c3aed' },
                        { ikon: '⚙️', baslik: 'Makine Duruşu', durum: 'Planlandı', renk: '#7c3aed' },
                        { ikon: '🚨', baslik: 'Güvenlik İhlali', durum: 'Planlandı', renk: '#7c3aed' },
                    ].map((item, i) => (
                        <div key={i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '0.875rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.2rem' }}>{item.ikon}</span>
                            <div>
                                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.8rem' }}>{item.baslik}</div>
                                <div style={{ color: item.renk, fontSize: '0.65rem', fontWeight: 700, marginTop: 2 }}>⏱ {item.durum}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes camPulse {
                    0%, 100% { transform: scale(0.9); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 8px rgba(239,68,68,0.8); }
                }
            `}</style>
        </div>
    );
}
