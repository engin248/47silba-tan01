'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Lock, Eye, EyeOff, LogIn, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react';
import { T, langDir } from '@/lib/lang';

const MAX_DENEME = 5;
const KILIT_SURE_SN = 30;
const DEPO_ANAHTAR = 'sb47_giris_kilit';

export default function GirisSayfasi() {
    const { girisYap } = useAuth();
    const router = useRouter();

    // PIN state
    const [pin, setPin] = useState('');
    const [goster, setGoster] = useState(false);
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);
    const [deneme, setDeneme] = useState(0);
    const [kilitliSaniye, setKilitliSaniye] = useState(0);
    const [dil, setDil] = useState('tr');

    // 2FA state
    const [adim, setAdim] = useState('pin'); // 'pin' | '2fa'
    const [totpKod, setTotpKod] = useState('');
    const [totpHata, setTotpHata] = useState('');
    const [totpYukle, setTotpYukle] = useState(false);
    const [tempToken, setTempToken] = useState(null);

    useEffect(() => {
        try {
            const kayit = JSON.parse(localStorage.getItem(DEPO_ANAHTAR) || 'null');
            if (kayit) {
                const kalan = Math.ceil((kayit.acilisZamani - Date.now()) / 1000);
                if (kalan > 0) { setKilitliSaniye(kalan); setDeneme(MAX_DENEME); }
                else { localStorage.removeItem(DEPO_ANAHTAR); }
            }
            const localDil = localStorage.getItem('sb47_dil') || 'tr';
            setDil(localDil);
        } catch { }
    }, []);

    const handleDilDegis = (yeniDil) => {
        setDil(yeniDil);
        localStorage.setItem('sb47_dil', yeniDil);
    };

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
            // 'tam' grubu için 2FA adımı
            try {
                const auth = JSON.parse(localStorage.getItem('sb47_auth') || '{}');
                const tkn = document.cookie.match(/sb47_jwt_token=([^;]+)/)?.[1];
                if (auth.grup === 'tam' && tkn) {
                    setTempToken(tkn);
                    setAdim('2fa');
                    setYukleniyor(false);
                    return;
                }
            } catch { }
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
                setHata(dil === 'ar'
                    ? `رمز PIN غير معروف. تبقى لك ${MAX_DENEME - yeniDeneme} محاولات.`
                    : `PIN tanınmadı. ${MAX_DENEME - yeniDeneme} deneme hakkınız kaldı.`);
            }
        }
        setYukleniyor(false);
    }, [pin, deneme, kilitliSaniye, girisYap, router, dil]);

    const handle2FA = useCallback(async () => {
        if (!totpKod.trim() || totpKod.length !== 6) { setTotpHata('6 haneli kod giriniz.'); return; }
        setTotpYukle(true); setTotpHata('');
        try {
            const res = await fetch('/api/2fa-dogrula', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kod: totpKod.trim(), temp_token: tempToken }),
            });
            const data = await res.json();
            if (data.basarili) {
                router.push('/');
            } else {
                setTotpHata(data.hata || 'Yanlış kod. Tekrar deneyin.');
                setTotpKod('');
            }
        } catch {
            setTotpHata('Sunucuya ulaşılamadı.');
        }
        setTotpYukle(false);
    }, [totpKod, tempToken, router]);

    const arka = {
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #022c22 0%, #0f6c52 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: '1rem',
    };

    // ── 2FA EKRANI ─────────────────────────────────────────────────
    if (adim === '2fa') {
        return (
            <div style={arka}>
                <div style={{ width: '100%', maxWidth: '360px', animation: 'fadeIn 0.4s ease' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ width: 56, height: 56, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                            <Smartphone size={26} color="#34d399" />
                        </div>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>İki Faktörlü Doğrulama</h1>
                        <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '6px 0 0', fontWeight: 600 }}>
                            Google Authenticator → 47 Antigravity ERP
                        </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.75rem' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.625rem' }}>
                            6 Haneli Kod
                        </label>
                        <input
                            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                            value={totpKod}
                            onChange={e => { setTotpKod(e.target.value.replace(/\D/g, '')); setTotpHata(''); }}
                            onKeyDown={e => e.key === 'Enter' && handle2FA()}
                            placeholder="000000" autoFocus
                            style={{ width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${totpHata ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: '#f1f5f9', fontSize: '1.5rem', letterSpacing: '0.5em', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', textAlign: 'center', marginBottom: '1rem' }}
                        />
                        {totpHata && (
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f87171', marginBottom: '1rem', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                                {totpHata}
                            </div>
                        )}
                        <button onClick={handle2FA} disabled={totpYukle || totpKod.length !== 6}
                            style={{ width: '100%', padding: '13px', background: totpKod.length === 6 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: totpKod.length === 6 ? '#34d399' : '#475569', border: `1px solid ${totpKod.length === 6 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: totpKod.length === 6 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {totpYukle ? '...' : <><ShieldCheck size={16} /> Doğrula</>}
                        </button>
                        <button onClick={() => { setAdim('pin'); setPin(''); setTotpKod(''); setTotpHata(''); }}
                            style={{ width: '100%', marginTop: 8, padding: '8px', background: 'none', color: '#475569', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                            ← Geri Dön
                        </button>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '0.62rem', color: '#334155', marginTop: '1.25rem', fontWeight: 600 }}>
                        Authenticator uygulamasını açın → 47 Antigravity ERP → 6 haneli kodu girin
                    </p>
                    <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} } input:focus{border-color:#34d399!important}`}</style>
                </div>
            </div>
        );
    }

    // ── PIN EKRANI ─────────────────────────────────────────────────
    return (
        <div style={arka}>
            <div style={{ width: '100%', maxWidth: '360px', animation: 'fadeIn 0.4s ease', direction: langDir(dil) }}>

                {/* Dil Seçici */}
                <div style={{ position: 'absolute', top: 20, right: 20 }}>
                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '8px' }}>
                        <button onClick={() => handleDilDegis('tr')} style={{ border: 'none', background: dil === 'tr' ? 'rgba(255,255,255,0.2)' : 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🇹🇷 TR</button>
                        <button onClick={() => handleDilDegis('ar')} style={{ border: 'none', background: dil === 'ar' ? 'rgba(255,255,255,0.2)' : 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🇸🇦 AR</button>
                    </div>
                </div>

                {/* Başlık */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                        <Lock size={26} color="#d8b863" />
                    </div>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e2e8f0', margin: 0, letterSpacing: '-0.01em' }}>
                        {T('sistem_adi', dil)}
                    </h1>
                    <p style={{ fontSize: '0.72rem', color: '#475569', margin: '6px 0 0', fontWeight: 600 }}>
                        {dil === 'ar' ? 'نظام الإنتاج والمتجر' : 'Üretim & Mağaza Sistemi'}
                    </p>
                </div>

                {/* PIN Kartı */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.75rem' }}>
                    <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.625rem' }}>
                        {dil === 'ar' ? 'رمز الوصول' : 'Erişim Kodu'}
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
                                padding: dil === 'ar' ? '13px 16px 13px 48px' : '13px 48px 13px 16px',
                                background: kilitliSaniye > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${kilitliSaniye > 0 ? 'rgba(239,68,68,0.3)' : hata ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: 10, color: '#f1f5f9', fontSize: '1.2rem',
                                letterSpacing: '0.3em', fontFamily: 'monospace', outline: 'none',
                                boxSizing: 'border-box', transition: 'border-color 0.2s',
                                opacity: kilitliSaniye > 0 ? 0.4 : 1,
                                textAlign: dil === 'ar' ? 'right' : 'left'
                            }}
                        />
                        <button onClick={() => setGoster(!goster)}
                            style={{ position: 'absolute', right: dil === 'ar' ? 'auto' : 12, left: dil === 'ar' ? 12 : 'auto', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, display: 'flex' }}>
                            {goster ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {hata && (
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f87171', marginBottom: '1rem', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                            {hata}
                        </div>
                    )}

                    {kilitliSaniye > 0 ? (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <ShieldAlert size={32} color="#f87171" style={{ marginBottom: 10 }} />
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f87171', marginBottom: 6 }}>
                                {dil === 'ar' ? 'تم قفل الوصول مؤقتاً' : 'Erişim Geçici Olarak Kilitlendi'}
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fca5a5', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                {kilitliSaniye}s
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 6, fontWeight: 600 }}>
                                {MAX_DENEME} {dil === 'ar' ? 'محاولات فاشلة — يرجى الانتظار' : 'başarısız deneme — lütfen bekleyin'}
                            </div>
                        </div>
                    ) : (
                        <button onClick={handleGiris} disabled={yukleniyor || kilitliSaniye > 0}
                            style={{ width: '100%', padding: '13px', background: yukleniyor ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)', color: yukleniyor ? '#475569' : '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: yukleniyor ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', letterSpacing: '0.02em', flexDirection: dil === 'ar' ? 'row-reverse' : 'row' }}>
                            {yukleniyor ? '...' : <><LogIn size={16} color="#d8b863" /> {dil === 'ar' ? 'تسجيل الدخول' : 'Giriş'}</>}
                        </button>
                    )}
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.62rem', color: '#334155', marginTop: '1.25rem', fontWeight: 600 }}>
                    {dil === 'ar' ? `الجلسة صالحة لمدة 4 ساعات • ${MAX_DENEME} محاولات خاطئة قفل ${KILIT_SURE_SN} ثانية` : `Oturum 4 saat geçerlidir • ${MAX_DENEME} yanlış denemede ${KILIT_SURE_SN}s kilit`}
                </p>
            </div>

            <style>{`
                @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                input:focus { border-color: #d8b863 !important; }
                input::placeholder { color: #576b63; letter-spacing: 0.1em; }
            `}</style>
        </div>
    );
}
