'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Lock, Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react';

const MAX_DENEME = 5;
const KILIT_SURE_SN = 30;
const DEPO_ANAHTAR = 'sb47_giris_kilit';

export default function GirisSayfasi() {
    const { girisYap } = useAuth();
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [goster, setGoster] = useState(false);
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);
    const [deneme, setDeneme] = useState(0);
    const [kilitliSaniye, setKilitliSaniye] = useState(0);

    // Sayfa açıldığında kalan kilidi kontrol et
    useEffect(() => {
        try {
            const kayit = JSON.parse(localStorage.getItem(DEPO_ANAHTAR) || 'null');
            if (kayit) {
                const kalan = Math.ceil((kayit.acilisZamani - Date.now()) / 1000);
                if (kalan > 0) { setKilitliSaniye(kalan); setDeneme(MAX_DENEME); }
                else { localStorage.removeItem(DEPO_ANAHTAR); }
            }
        } catch { }
    }, []);

    // Geri sayım
    useEffect(() => {
        if (kilitliSaniye <= 0) return;
        const t = setInterval(() => {
            setKilitliSaniye(prev => {
                if (prev <= 1) { clearInterval(t); setDeneme(0); setHata(''); localStorage.removeItem(DEPO_ANAHTAR); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [kilitliSaniye]);

    const handleGiris = useCallback(async () => {
        if (kilitliSaniye > 0) return;
        setHata('');
        if (!pin.trim()) { setHata('PIN alanı boş bırakılamaz.'); return; }
        setYukleniyor(true);
        await new Promise(r => setTimeout(r, 300));
        const sonuc = await girisYap(pin);
        if (sonuc === true || (sonuc && sonuc.basarili !== false)) {
            localStorage.removeItem(DEPO_ANAHTAR);
            router.push('/');
        } else {
            const yeniDeneme = deneme + 1;
            setDeneme(yeniDeneme);
            setPin('');
            if (yeniDeneme >= MAX_DENEME) {
                const acilisZamani = Date.now() + KILIT_SURE_SN * 1000;
                localStorage.setItem(DEPO_ANAHTAR, JSON.stringify({ acilisZamani }));
                setKilitliSaniye(KILIT_SURE_SN);
                setHata('');
            } else {
                const mesaj = sonuc?.mesaj || `PIN tanınmadı. ${MAX_DENEME - yeniDeneme} deneme hakkınız kaldı.`;
                setHata(mesaj);
            }
        }
        setYukleniyor(false);
    }, [pin, deneme, kilitliSaniye, girisYap, router]);


    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            padding: '1rem',
        }}>
            <div style={{ width: '100%', maxWidth: '360px', animation: 'fadeIn 0.4s ease' }}>

                {/* Başlık — sade */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: 56, height: 56,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                    }}>
                        <Lock size={26} color="#94a3b8" />
                    </div>
                    <h1 style={{
                        fontSize: '1.3rem', fontWeight: 800,
                        color: '#e2e8f0', margin: 0, letterSpacing: '-0.01em',
                    }}>
                        47 Sil Baştan
                    </h1>
                    <p style={{ fontSize: '0.72rem', color: '#475569', margin: '6px 0 0', fontWeight: 600 }}>
                        Üretim & Mağaza Sistemi
                    </p>
                </div>

                {/* PIN Kartı */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: '1.75rem',
                }}>
                    <label style={{
                        fontSize: '0.68rem', fontWeight: 700,
                        color: '#64748b', textTransform: 'uppercase',
                        letterSpacing: '0.08em', display: 'block', marginBottom: '0.625rem',
                    }}>
                        Erişim Kodu
                    </label>

                    <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                        <input
                            type={kilitliSaniye > 0 ? 'password' : (goster ? 'text' : 'password')}
                            value={pin}
                            onChange={e => { if (kilitliSaniye > 0) return; setPin(e.target.value); setHata(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleGiris()}
                            placeholder="••••"
                            autoFocus
                            disabled={kilitliSaniye > 0}
                            style={{
                                width: '100%',
                                padding: '13px 48px 13px 16px',
                                background: kilitliSaniye > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${kilitliSaniye > 0 ? 'rgba(239,68,68,0.3)' : hata ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: 10,
                                color: '#f1f5f9',
                                fontSize: '1.2rem',
                                letterSpacing: '0.3em',
                                fontFamily: 'monospace',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                                opacity: kilitliSaniye > 0 ? 0.4 : 1,
                            }}
                        />
                        <button
                            onClick={() => setGoster(!goster)}
                            style={{
                                position: 'absolute', right: 12, top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none', border: 'none',
                                color: '#475569', cursor: 'pointer', padding: 4,
                                display: 'flex',
                            }}>
                            {goster ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {hata && (
                        <div style={{
                            fontSize: '0.78rem', fontWeight: 600, color: '#f87171',
                            marginBottom: '1rem', padding: '8px 12px',
                            background: 'rgba(239,68,68,0.08)',
                            borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)',
                        }}>
                            {hata}
                        </div>
                    )}

                    {/* KİLİTLİ MOD */}
                    {kilitliSaniye > 0 ? (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <ShieldAlert size={32} color="#f87171" style={{ marginBottom: 10 }} />
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f87171', marginBottom: 6 }}>
                                Erişim Geçici Olarak Kilitlendi
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fca5a5', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                {kilitliSaniye}s
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 6, fontWeight: 600 }}>
                                {MAX_DENEME} başarısız deneme — lütfen bekleyin
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleGiris}
                            disabled={yukleniyor || kilitliSaniye > 0}
                            style={{
                                width: '100%',
                                padding: '13px',
                                background: yukleniyor ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
                                color: yukleniyor ? '#475569' : '#e2e8f0',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 10,
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: yukleniyor ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                transition: 'all 0.2s',
                                letterSpacing: '0.02em',
                            }}>
                            {yukleniyor ? '...' : <><LogIn size={16} /> Giriş</>}
                        </button>
                    )}
                </div>

                <p style={{
                    textAlign: 'center', fontSize: '0.62rem',
                    color: '#334155', marginTop: '1.25rem', fontWeight: 600,
                }}>
                    Oturum 8 saat geçerlidir &nbsp;•&nbsp; {MAX_DENEME} yanlış denemede {KILIT_SURE_SN}s kilit
                </p>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                input:focus { border-color: rgba(255,255,255,0.25) !important; }
                input::placeholder { color: #334155; letter-spacing: 0.1em; }
            `}</style>
        </div>
    );
}
