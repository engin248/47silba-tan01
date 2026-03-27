'use client';
import { useLang } from '@/context/langContext';
import { useState, useEffect } from 'react';
import { Shield, Clock, RefreshCw, CheckCircle2, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth, ERISIM_GRUPLARI, ERISIM_MATRISI, pindenGrupBul } from '@/lib/auth';

const formatTarih = (iso) => {
    if (!iso) return 'ÔÇö';
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

export default function GuvenlikSayfasi() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const { kullanici, cikisYap } = useAuth();
    const [sekme, setSekme] = useState('genel');
    const [loglar, setLoglar] = useState([]);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [yetkiState, setYetkiState] = useState({ uretim: '', genel: '' });
    const [pinDegistir, setPinDegistir] = useState({ grup: 'uretim', eskiPin: '', yeniPin: '', yeniPin2: '' });

    useEffect(() => {
        try {
            const kayit = JSON.parse(localStorage.getItem('sb47_giris_log') || '[]');
            setLoglar(kayit);
            setYetkiState({
                uretim: localStorage.getItem('sb47_uretim_pin') || '',
                genel: localStorage.getItem('sb47_genel_pin') || '',
            });
        } catch (e) { console.error('Log okuma hatasi', e); }
    }, []);

    const telegramBildirim = (mesaj_metni) => {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 10000);
        fetch('/api/telegram-bildirim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj: mesaj_metni }),
            signal: controller.signal
        }).finally(() => clearTimeout(tId)).catch(() => null);
    };

    const handlePinDegistir = () => {
        if (!pinDegistir.eskiPin || !pinDegistir.yeniPin || !pinDegistir.yeniPin2) return goster('T├╝m alanlar─▒ doldurun!', 'error');
        if (pinDegistir.yeniPin !== pinDegistir.yeniPin2) return goster('Yeni kodlar e┼şle┼şmiyor!', 'error');
        if (pinDegistir.yeniPin.length < 4) return goster('Kod en az 4 haneli olmal─▒!', 'error');
        if (pinDegistir.yeniPin.length > 20) return goster('Kod en fazla 20 haneli olabilir!', 'error');

        try {
            const mevcut = localStorage.getItem(`sb47_${pinDegistir.grup}_pin`);
            if (mevcut && mevcut !== pinDegistir.eskiPin && pinDegistir.eskiPin !== process.env.NEXT_PUBLIC_ADMIN_PIN) {
                telegramBildirim(`­şÜ¿ YETK─░S─░Z ─░┼ŞLEM\nG├╝venlik sayfas─▒nda hatal─▒ PIN de─şi┼ştirme denemesi yap─▒ld─▒.\nGrup: ${pinDegistir.grup.toUpperCase()}`);
                return goster('Mevcut kod hatal─▒!', 'error');
            }

            localStorage.setItem(`sb47_${pinDegistir.grup}_pin`, pinDegistir.yeniPin);
            setYetkiState(p => ({ ...p, [pinDegistir.grup]: pinDegistir.yeniPin }));
            telegramBildirim(`­şöÉ PIN DE─Ş─░┼ŞT─░R─░LD─░\n${pinDegistir.grup.toUpperCase()} eri┼şim PIN kodu panel ├╝zerinden yenilendi.`);
            setPinDegistir({ grup: 'uretim', eskiPin: '', yeniPin: '', yeniPin2: '' });
            goster('Ô£à Kod ba┼şar─▒yla g├╝ncellendi!');
        } catch (error) { goster('PIN de─şi┼ştirilemedi: ' + error.message, 'error'); }
    };

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 4000);
    };

    const logTemizle = () => {
        // ­şøæ AA Kriteri: ─░zinsiz Silme Engeli (Patron ┼şifresi sor)
        const adminPin = prompt('G├╝venlik loglar─▒n─▒ silmek tehlikelidir. Y├Ânetici P─░N kodunu girin:');
        const dogruPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
        if (adminPin !== dogruPin) return goster('Yetkisiz ─░┼şlem! Loglar silinemedi.', 'error');

        localStorage.removeItem('sb47_giris_log');
        setLoglar([]);
        goster('Ô£à Log kay─▒tlar─▒ yetkiyle temizlendi');
        telegramBildirim(`­şÜ¿ KR─░T─░K ─░┼ŞLEM\nG├╝venlik (Giri┼ş) loglar─▒ Y├Ânetici yetkisi kullan─▒larak silindi!`);
    };

    // Sadece "tam" eri┼şim grubu bu sayfay─▒ g├Âr├╝r
    if (kullanici?.grup !== 'tam') {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ textAlign: 'center', padding: '5rem', background: '#f8fafc', borderRadius: 20, border: '2px solid #e2e8f0' }}>
                <Shield size={44} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                <h2 style={{ color: '#374151', fontWeight: 800, fontSize: '1.1rem' }}>Bu alan sistem y├Ânetimine aittir</h2>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    Eri┼şim ayarlar─▒ merkezi olarak y├Ânetilmektedir.
                </p>
            </div>
        );
    }

    const inp = {
        width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb',
        borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit',
        boxSizing: 'border-box', outline: 'none',
    };

    const SEKMELER = [
        { id: 'genel', label: '­şøí´©Å Genel' },
        { id: 'yetki', label: '­şöæ Yetki Ver / Al' },
        { id: 'erisim', label: '­şôï Eri┼şim Tablosu' },
        { id: 'pin', label: '­şöÉ PIN De─şi┼ştir' },
        { id: 'log', label: '­şôé Giri┼ş Kay─▒tlar─▒' },
    ];

    const GRUP_RENK = { tam: '#6366f1', uretim: '#3b82f6', genel: '#10b981' };
    const GRUP_ACIKLAMA = {
        tam: 'Sistemin t├╝m b├Âl├╝mlerine eri┼şim ve d├╝zenleme',
        uretim: '├£retim ve y├Ânetim b├Âl├╝mlerine eri┼şim',
        genel: 'G├Ârevle ilgili b├Âl├╝mlere yaln─▒zca g├Âr├╝nt├╝leme',
    };

    return (
        <div>
            {/* Ba┼şl─▒k */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Eri┼şim Y├Ânetimi</h1>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>Kodlar ┬À Eri┼şim alanlar─▒ ┬À Giri┼ş kay─▒tlar─▒</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* CC Kriteri Otomatik Rota (Ayarlar Mod├╝l├╝ne Ge├ği┼ş) */}
                    <a href="/ayarlar" style={{ textDecoration: 'none' }}>
                        <button style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '7px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            ÔÜÖ´©Å Ayarlar (M20)
                        </button>
                    </a>
                    <button onClick={cikisYap}
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '7px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <LogOut size={14} /> ├ç─▒k─▒┼ş
                    </button>
                </div>
            </div>

            {mesaj.text && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', border: '1px solid', borderColor: mesaj.type === 'error' ? '#fca5a5' : '#6ee7b7', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />} {mesaj.text}
                </div>
            )}

            {/* Sekmeler */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {SEKMELER.map(s => (
                    <button key={s.id} onClick={() => setSekme(s.id)}
                        style={{ padding: '7px 14px', border: '1px solid', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', borderColor: sekme === s.id ? '#6366f1' : '#e5e7eb', background: sekme === s.id ? '#6366f1' : 'white', color: sekme === s.id ? 'white' : '#374151' }}>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* ÔöÇÔöÇ YETK─░ VER / AL ÔöÇÔöÇ */}
            {sekme === 'yetki' && (() => {
                const uretimAktif = !!yetkiState.uretim;
                const genelAktif = !!yetkiState.genel;

                const yetkiVer = (grup) => {
                    const kod = prompt(`"${grup === 'uretim' ? '├£retim' : 'Genel'}" eri┼şimi i├ğin yeni kod belirleyin:`);
                    if (!kod || kod.length < 4) { goster('Kod en az 4 karakter olmal─▒!', 'error'); return; }
                    if (kod.length > 20) { goster('Kod ├ğok uzun!', 'error'); return; }
                    try {
                        localStorage.setItem(`sb47_${grup}_pin`, kod);
                        setYetkiState(prev => ({ ...prev, [grup]: kod }));
                        telegramBildirim(`­şşó YETK─░ VER─░LD─░\nYeni yetki verildi.\nGrup: ${grup.toUpperCase()}`);
                        goster(`Ô£à Yetki verildi. Kod kopyalay─▒p ilgili ki┼şiyle payla┼ş─▒n.`);
                    } catch (error) { goster('Hata: ' + error.message, 'error'); }
                };

                const yetkiIptal = (grup) => {
                    if (!confirm('Bu eri┼şimi kapatmak istedi─şinizden emin misiniz?')) return;
                    try {
                        localStorage.removeItem(`sb47_${grup}_pin`);
                        setYetkiState(prev => ({ ...prev, [grup]: '' }));
                        // O grupla giri┼ş yapan oturumlar─▒ da kapat
                        try {
                            const mevcut = JSON.parse(localStorage.getItem('sb47_auth') || 'null');
                            if (mevcut?.grup === grup) localStorage.removeItem('sb47_auth');
                        } catch { }
                        telegramBildirim(`­şö┤ YETK─░ ─░PTAL ED─░LD─░\nEri┼şim yetkisi kapat─▒ld─▒.\nGrup: ${grup.toUpperCase()}`);
                        goster(`Eri┼şim kapat─▒ld─▒. Aktif oturumlar sonland─▒r─▒ld─▒.`);
                    } catch (error) { goster('Hata: ' + error.message, 'error'); }
                };

                const GRUPLAR = [
                    { key: 'uretim', label: '├£retim Eri┼şimi', aciklama: '├£retim ve y├Ânetim b├Âl├╝mlerine eri┼şim', renk: '#3b82f6', aktif: uretimAktif },
                    { key: 'genel', label: 'Genel Eri┼şim', aciklama: 'G├Ârevle ilgili sayfalara g├Âr├╝nt├╝leme', renk: '#10b981', aktif: genelAktif },
                ];

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 520 }}>
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '0.875rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#1e40af' }}>
                            ­şÆí Yetki verdi─şinizde sistem bir kod belirler ÔÇö o kodu ilgili ki┼şiyle payla┼ş─▒rs─▒n─▒z. ─░stedi─şiniz zaman kapatabilirsiniz; kod an─▒nda ge├ğersiz olur.
                        </div>
                        {GRUPLAR.map(g => (
                            <div key={g.key} style={{ background: 'white', border: `2px solid ${g.aktif ? g.renk + '40' : '#e5e7eb'}`, borderRadius: 14, padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', marginBottom: 4 }}>{g.label}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{g.aciklama}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: g.aktif ? '#ecfdf5' : '#fef2f2', color: g.aktif ? '#059669' : '#dc2626' }}>
                                            {g.aktif ? '­şşó A├ğ─▒k' : '­şö┤ Kapal─▒'}
                                        </span>
                                    </div>
                                </div>
                                {g.aktif && (
                                    <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                        Aktif kod mevcut ÔÇö payla┼ş─▒ld─▒ysa eri┼şim a├ğ─▒k.
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    <button onClick={() => yetkiVer(g.key)}
                                        style={{ flex: 1, padding: '9px', background: g.renk, color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                                        {g.aktif ? '­şöä Kodu De─şi┼ştir' : 'Ô£à Yetki Ver'}
                                    </button>
                                    {g.aktif && (
                                        <button onClick={() => yetkiIptal(g.key)}
                                            style={{ padding: '9px 16px', background: 'white', border: '2px solid #ef4444', color: '#dc2626', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                                            ­şÜ½ Kapat
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* ÔöÇÔöÇ GENEL ÔöÇÔöÇ */}
            {sekme === 'genel' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
                    {Object.entries(ERISIM_GRUPLARI).map(([key, g]) => (
                        <div key={key} style={{ background: 'white', border: `1px solid ${GRUP_RENK[key]}30`, borderRadius: 14, padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{g.gosterge}</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{g.label} Eri┼şimi</div>
                                    <div style={{ fontSize: '0.65rem', color: GRUP_RENK[key], fontWeight: 700 }}>
                                        {Object.values(ERISIM_MATRISI).filter(m => m[key] !== null && m[key] !== undefined).length} sayfa
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{GRUP_ACIKLAMA[key]}</p>
                        </div>
                    ))}
                    <div style={{ background: '#0f172a', borderRadius: 14, padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Sistem Durumu</div>
                        {[
                            { label: 'Oturum s├╝resi', val: '8 saat' },
                            { label: 'PIN korumas─▒', val: 'Aktif' },
                            { label: 'Giri┼ş kayd─▒', val: 'Aktif' },
                        ].map((i, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.72rem' }}>
                                <span style={{ color: '#64748b' }}>{i.label}</span>
                                <span style={{ color: '#34d399', fontWeight: 700 }}>Ô£à {i.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ÔöÇÔöÇ ER─░┼Ş─░M TABLOSU ÔöÇÔöÇ */}
            {sekme === 'erisim' && (
                <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Sayfa</th>
                                {Object.entries(ERISIM_GRUPLARI).map(([k, g]) => (
                                    <th key={k} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: GRUP_RENK[k], borderBottom: '2px solid #e5e7eb' }}>
                                        {g.gosterge} {g.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(ERISIM_MATRISI).map(([href, erisim]) => (
                                <tr key={href} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '7px 14px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.72rem' }}>{href}</td>
                                    {Object.keys(ERISIM_GRUPLARI).map(grup => (
                                        <td key={grup} style={{ padding: '7px 14px', textAlign: 'center' }}>
                                            {erisim[grup] === 'full' && <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 7px', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem' }}>Ô£à Tam</span>}
                                            {erisim[grup] === 'read' && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 7px', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem' }}>­şæü G├Âr├╝nt├╝</span>}
                                            {!erisim[grup] && <span style={{ color: '#d1d5db', fontSize: '0.65rem' }}>ÔÇö</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ÔöÇÔöÇ KOD Y├ûNET─░M─░ ÔöÇÔöÇ */}
            {sekme === 'pin' && (
                <div style={{ maxWidth: 440 }}>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#92400e' }}>
                        Eri┼şim kodu de─şi┼şikliklerini kal─▒c─▒ hale getirmek i├ğin sunucu ortam de─şi┼şkenlerini g├╝ncelleyin.
                    </div>
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '1rem', fontSize: '0.95rem' }}>Eri┼şim Kodu G├╝ncelle</h3>
                        <div style={{ display: 'grid', gap: '0.875rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' }}>Eri┼şim Grubu</label>
                                <select value={pinDegistir.grup} onChange={e => setPinDegistir({ ...pinDegistir, grup: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                    {Object.entries(ERISIM_GRUPLARI).map(([k, g]) => (
                                        <option key={k} value={k}>{g.gosterge} {g.label} Eri┼şimi</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' }}>Mevcut Kod</label>
                                <input type="password" value={pinDegistir.eskiPin} onChange={e => setPinDegistir({ ...pinDegistir, eskiPin: e.target.value })} style={inp} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' }}>Yeni Kod</label>
                                <input type="password" maxLength={20} value={pinDegistir.yeniPin} onChange={e => setPinDegistir({ ...pinDegistir, yeniPin: e.target.value })} style={inp} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' }}>Yeni Kod (Tekrar)</label>
                                <input type="password" maxLength={20} value={pinDegistir.yeniPin2} onChange={e => setPinDegistir({ ...pinDegistir, yeniPin2: e.target.value })} style={inp} />
                            </div>
                            <button onClick={handlePinDegistir}
                                style={{ background: '#6366f1', color: 'white', border: 'none', padding: '11px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}>
                                Kodu G├╝ncelle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ÔöÇÔöÇ G─░R─░┼Ş KAYITLARI ÔöÇÔöÇ */}
            {sekme === 'log' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{loglar.length} kay─▒t</span>
                        <button onClick={logTemizle}
                            style={{ background: 'white', border: '1px solid #e5e7eb', color: '#64748b', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <RefreshCw size={12} /> Temizle
                        </button>
                    </div>
                    {loglar.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 14, border: '2px dashed #e5e7eb' }}>
                            <Clock size={40} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>Hen├╝z giri┼ş kayd─▒ yok.</p>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {loglar.map((log, i) => {
                            const g = ERISIM_GRUPLARI[log.grup];
                            return (
                                <div key={i} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: '1.1rem' }}>{g?.gosterge || '?'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{g?.label || log.grup} Eri┼şimi</div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{formatTarih(log.saat)}</div>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 10px', borderRadius: 6, background: log.islem === 'giris' ? '#ecfdf5' : '#f8fafc', color: log.islem === 'giris' ? '#059669' : '#94a3b8' }}>
                                        {log.islem === 'giris' ? 'Giri┼ş' : '├ç─▒k─▒┼ş'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}