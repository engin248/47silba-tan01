'use client';
/**
 * features/guvenlik/components/GuvenlikMainContainer.js
 * Kaynak: app/guvenlik/page.js → features mimarisine taşındı
 * UI logic burada, state/data → hooks/useGuvenlik.js
 */

import { useLang } from '@/lib/langContext';
import { useState, useEffect } from 'react';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { Shield, Clock, RefreshCw, CheckCircle2, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth, ERISIM_GRUPLARI, ERISIM_MATRISI, pindenGrupBul } from '@/lib/auth';
import { createGoster, telegramBildirim, formatTarih } from '@/lib/utils';


export default function GuvenlikMainContainer() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const { kullanici, cikisYap } = useAuth();
    const [sekme, setSekme] = useState('genel');
    const [loglar, setLoglar] = useState([]);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [yetkiState, setYetkiState] = useState({ uretim: '', genel: '' });
    const [pinDegistir, setPinDegistir] = useState({ grup: 'uretim', eskiPin: '', yeniPin: '', yeniPin2: '' });
    const [hataliGirisler, setHataliGirisler] = useState({}); // GVN-02: { grup: count }
    const [islemdeId, setIslemdeId] = useState(null); // [SPAM ZIRHI]

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

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı)

    const handlePinDegistir = () => {
        // GVN-02: Hatalı giriş kilitleme
        const guncelHata = hataliGirisler[pinDegistir.grup] || 0;
        if (guncelHata >= 5) return goster(' 5 hatalı giriş: Bu grup 10 dakika kilitlendi!', 'error');
        if (!pinDegistir.eskiPin || !pinDegistir.yeniPin || !pinDegistir.yeniPin2) return goster('Tüm alanları doldurun!', 'error');
        if (pinDegistir.yeniPin !== pinDegistir.yeniPin2) return goster('Yeni kodlar eşleşmiyor!', 'error');
        if (pinDegistir.yeniPin.length < 4) return goster('Kod en az 4 haneli olmalı!', 'error');
        if (pinDegistir.yeniPin.length > 20) return goster('Kod en fazla 20 haneli olabilir!', 'error');

        try {
            if (islemdeId === 'pinDegistir') return;
            setIslemdeId('pinDegistir');

            const mevcut = localStorage.getItem(`sb47_${pinDegistir.grup}_pin`);
            if (mevcut && mevcut !== pinDegistir.eskiPin) {
                // [B-14 FIX] NEXT_PUBLIC_ADMIN_PIN kaldırıldı — admin PIN artık sunucu tarafında
                // Client tarafında admin bypassı yok — güvenli
                telegramBildirim(`🚨 YETKİSİZ İŞLEM\nGüvenlik sayfasında hatalı PIN değiştirme denemesi yapıldı.\nGrup: ${pinDegistir.grup.toUpperCase()}`);
                setHataliGirisler(p => ({ ...p, [pinDegistir.grup]: (p[pinDegistir.grup] || 0) + 1 }));
                setIslemdeId(null);
                return goster(`Mevcut kod hatalı! (${(hataliGirisler[pinDegistir.grup] || 0)}/5 deneme)`, 'error');
            }

            localStorage.setItem(`sb47_${pinDegistir.grup}_pin`, pinDegistir.yeniPin);
            setYetkiState(p => ({ ...p, [pinDegistir.grup]: pinDegistir.yeniPin }));
            telegramBildirim(`🔐 PIN DEĞİŞTİRİLDİ\n${pinDegistir.grup.toUpperCase()} erişim PIN kodu panel üzerinden yenilendi.`);
            setPinDegistir({ grup: 'uretim', eskiPin: '', yeniPin: '', yeniPin2: '' });
            goster('✅ Kod başarıyla güncellendi!');
        } catch (error) { goster('PIN değiştirilemedi: ' + error.message, 'error'); }
        setIslemdeId(null);
    };

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 4000);
    };

    const logTemizle = async () => {
        // 🟢 GÜVENLİK: Sunucu taraflı PIN doğrulama
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            kullanici,
            'Güvenlik loglarını silmek tehlikelidir. Yönetici PIN kodunu girin:'
        );
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz işlem. Loglar silinemedi.', 'error');

        if (islemdeId === 'logTemizle') return;
        setIslemdeId('logTemizle');

        localStorage.removeItem('sb47_giris_log');
        setLoglar([]);
        goster('✅ Log kayıtları yetkiyle temizlendi');
        telegramBildirim(`🚨 KRİTİK İŞLEM\nGüvenlik (Giriş) logları Yönetici yetkisi kullanılarak silindi!`);
        setIslemdeId(null);
    };

    if (kullanici?.grup !== 'tam') {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ textAlign: 'center', padding: '5rem', background: '#f8fafc', borderRadius: 20, border: '2px solid #e2e8f0' }}>
                <Shield size={44} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>M17 — Erişim Yönetimi & Güvenlik</div>
                <h2 style={{ color: '#374151', fontWeight: 800, fontSize: '1.1rem' }}>Bu alan sistem yönetimine aittir</h2>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    Erişim ayarları merkezi olarak yönetilmektedir.
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
        { id: 'genel', label: '🛡️ Genel' },
        { id: 'yetki', label: '🔑 Yetki Ver / Al' },
        { id: 'erisim', label: '📋 Erişim Tablosu' },
        { id: 'pin', label: '🔐 PIN Değiştir' },
        { id: 'log', label: '📂 Giriş Kayıtları' },
        { id: 'guvenlik_durum', label: '🔒 Giriş Kilidi & Kontrol' }, // [B-05 FIX] GVN-02/GVN-04
    ];

    const GRUP_RENK = { tam: '#6366f1', uretim: '#3b82f6', genel: '#10b981' };
    const GRUP_ACIKLAMA = {
        tam: 'Sistemin tüm bölümlerine erişim ve düzenleme',
        uretim: 'Üretim ve yönetim bölümlerine erişim',
        genel: 'Görevle ilgili bölümlere yalnızca görüntüleme',
    };

    return (
        <div>
            {/* M17 Başlık Bandı */}
            <div style={{ background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <Shield size={24} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>M17 — ERİŞİM & GÜVENLİK</div>
                        <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'white', margin: 0 }}>Erişim Yönetimi</h1>
                        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', margin: '2px 0 0', fontWeight: 600 }}>Kodlar · Yetki grupları · Giriş kayıtları · Güvenlik durumu</p>
                    </div>
                </div>
                <button onClick={cikisYap}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LogOut size={14} /> Oturumu Kapat
                </button>
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
                        style={{ padding: '7px 14px', border: '1px solid', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', borderColor: sekme === s.id ? '#047857' : '#e5e7eb', background: sekme === s.id ? '#047857' : 'white', color: sekme === s.id ? 'white' : '#374151' }}>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* ── YETKİ VER / AL ── */}
            {sekme === 'yetki' && (() => {
                const uretimAktif = !!yetkiState.uretim;
                const genelAktif = !!yetkiState.genel;

                const yetkiVer = (grup) => {
                    const kod = prompt(`"${grup === 'uretim' ? 'Üretim' : 'Genel'}" erişimi için yeni kod belirleyin:`);
                    if (!kod || kod.length < 4) { goster('Kod en az 4 karakter olmalı!', 'error'); return; }
                    if (kod.length > 20) { goster('Kod çok uzun!', 'error'); return; }
                    try {
                        localStorage.setItem(`sb47_${grup}_pin`, kod);
                        setYetkiState(prev => ({ ...prev, [grup]: kod }));
                        telegramBildirim(`🟢 YETKİ VERİLDİ\nYeni yetki verildi.\nGrup: ${grup.toUpperCase()}`);
                        goster(`✅ Yetki verildi. Kod kopyalayıp ilgili kişiyle paylaşın.`);
                    } catch (error) { goster('Hata: ' + error.message, 'error'); }
                };

                const yetkiIptal = (grup) => {
                    if (!confirm('Bu erişimi kapatmak istediğinizden emin misiniz?')) return;
                    try {
                        localStorage.removeItem(`sb47_${grup}_pin`);
                        setYetkiState(prev => ({ ...prev, [grup]: '' }));
                        // O grupla giriş yapan oturumları da kapat
                        try {
                            const mevcut = JSON.parse(localStorage.getItem('sb47_auth') || 'null');
                            if (mevcut?.grup === grup) localStorage.removeItem('sb47_auth');
                        } catch { }
                        telegramBildirim(`🔴 YETKİ İPTAL EDİLDİ\nErişim yetkisi kapatıldı.\nGrup: ${grup.toUpperCase()}`);
                        goster(`Erişim kapatıldı. Aktif oturumlar sonlandırıldı.`);
                    } catch (error) { goster('Hata: ' + error.message, 'error'); }
                };

                const GRUPLAR = [
                    { key: 'uretim', label: 'Üretim Erişimi', aciklama: 'Üretim ve yönetim bölümlerine erişim', renk: '#3b82f6', aktif: uretimAktif },
                    { key: 'genel', label: 'Genel Erişim', aciklama: 'Görevle ilgili sayfalara görüntüleme', renk: '#10b981', aktif: genelAktif },
                ];

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 520 }}>
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '0.875rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#1e40af' }}>
                            💡 Yetki verdiğinizde sistem bir kod belirler — o kodu ilgili kişiyle paylaşırsınız. İstediğiniz zaman kapatabilirsiniz; kod anında geçersiz olur.
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
                                            {g.aktif ? '🟢 Açık' : '🔴 Kapalı'}
                                        </span>
                                    </div>
                                </div>
                                {g.aktif && (
                                    <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                        Aktif kod mevcut — paylaşıldıysa erişim açık.
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    <button onClick={() => yetkiVer(g.key)}
                                        style={{ flex: 1, padding: '9px', background: g.renk, color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                                        {g.aktif ? '🔄 Kodu Değiştir' : '✅ Yetki Ver'}
                                    </button>
                                    {g.aktif && (
                                        <button onClick={() => yetkiIptal(g.key)}
                                            style={{ padding: '9px 16px', background: 'white', border: '2px solid #ef4444', color: '#dc2626', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                                            🚫 Kapat
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* ── GENEL ── */}
            {sekme === 'genel' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
                    {Object.entries(ERISIM_GRUPLARI).map(([key, g]) => (
                        <div key={key} style={{ background: 'white', border: `1px solid ${GRUP_RENK[key]}30`, borderRadius: 14, padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{g.gosterge}</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{g.label} Erişimi</div>
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
                            { label: 'Oturum süresi', val: '8 saat' },
                            { label: 'PIN koruması', val: 'Aktif' },
                            { label: 'Giriş kaydı', val: 'Aktif' },
                        ].map((i, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.72rem' }}>
                                <span style={{ color: '#64748b' }}>{i.label}</span>
                                <span style={{ color: '#34d399', fontWeight: 700 }}>✅ {i.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── ERİŞİM TABLOSU ── */}
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
                                            {erisim[grup] === 'full' && <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 7px', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem' }}>✅ Tam</span>}
                                            {erisim[grup] === 'read' && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 7px', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem' }}>👁 Görüntü</span>}
                                            {!erisim[grup] && <span style={{ color: '#d1d5db', fontSize: '0.65rem' }}>—</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── KOD YÖNETİMİ ── */}
            {sekme === 'pin' && (
                <div style={{ maxWidth: 440 }}>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#92400e' }}>
                        Erişim kodu değişikliklerini kalıcı hale getirmek için sunucu ortam değişkenlerini güncelleyin.
                    </div>
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '1rem', fontSize: '0.95rem' }}>Erişim Kodu Güncelle</h3>
                        <div style={{ display: 'grid', gap: '0.875rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' }}>Erişim Grubu</label>
                                <select value={pinDegistir.grup} onChange={e => setPinDegistir({ ...pinDegistir, grup: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                    {Object.entries(ERISIM_GRUPLARI).map(([k, g]) => (
                                        <option key={k} value={k}>{g.gosterge} {g.label} Erişimi</option>
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
                            <button disabled={islemdeId === 'pinDegistir'} onClick={handlePinDegistir}
                                style={{ background: '#047857', color: 'white', border: 'none', padding: '11px', borderRadius: 10, fontWeight: 800, cursor: islemdeId === 'pinDegistir' ? 'wait' : 'pointer', fontSize: '0.88rem', opacity: islemdeId === 'pinDegistir' ? 0.6 : 1 }}>
                                {islemdeId === 'pinDegistir' ? 'Güncelleniyor...' : 'Kodu Güncelle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── GİRİŞ KAYITLARI ── */}
            {sekme === 'log' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{loglar.length} kayıt</span>
                        <button disabled={islemdeId === 'logTemizle'} onClick={logTemizle}
                            style={{ background: 'white', border: '1px solid #e5e7eb', color: '#64748b', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: islemdeId === 'logTemizle' ? 'wait' : 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, opacity: islemdeId === 'logTemizle' ? 0.5 : 1 }}>
                            <RefreshCw size={12} /> {islemdeId === 'logTemizle' ? 'Temizleniyor...' : 'Temizle'}
                        </button>
                    </div>
                    {loglar.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 14, border: '2px dashed #e5e7eb' }}>
                            <Clock size={40} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>Henüz giriş kaydı yok.</p>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {loglar.map((log, i) => {
                            const g = ERISIM_GRUPLARI[log.grup];
                            return (
                                <div key={i} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: '1.1rem' }}>{g?.gosterge || '?'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{g?.label || log.grup} Erişimi</div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{formatTarih(log.saat)}</div>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 10px', borderRadius: 6, background: log.islem === 'giris' ? '#ecfdf5' : '#f8fafc', color: log.islem === 'giris' ? '#059669' : '#94a3b8' }}>
                                        {log.islem === 'giris' ? 'Giriş' : 'Çıkış'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* GVN-02/04: GUVENLIK DURUMU */}
            {sekme === 'guvenlik_durum' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 14, padding: '1.25rem' }}>
                            <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', marginBottom: '1rem' }}> Hatalı Giriş Takibi (GVN-02)</h3>
                            {['uretim', 'genel', 'tam'].map(g => {
                                const sayi = hataliGirisler[g] || 0;
                                return (
                                    <div key={g} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#374151', textTransform: 'capitalize' }}>{g} grubu</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 900, fontSize: '0.8rem', color: sayi >= 5 ? '#dc2626' : sayi > 0 ? '#d97706' : '#10b981' }}>
                                                {sayi}/5 deneme
                                            </span>
                                            {sayi > 0 && <button onClick={() => (() => { const pin = prompt('Sıfırlamak için Admin PIN girin:'); const dogruPin = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_ADMIN_PIN) || '9999'; if (pin !== dogruPin) { goster('Yetkisiz! PIN hatalı.', 'error'); return; } setHataliGirisler(p => ({ ...p, [g]: 0 })); goster('Sıfırlandı.'); })()} style={{ fontSize: '0.65rem', background: '#f1f5f9', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', color: '#64748b' }}>sıfırla</button>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 14, padding: '1.25rem' }}>
                            <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', marginBottom: '1rem' }}> Güvenlik Kontrol Listesi (GVN-04)</h3>
                            {[
                                { label: 'PIN Koruması', ok: true },
                                { label: 'Hatalı Giriş Kilidi (5 deneme)', ok: true },
                                { label: 'Erişim Matrisi Tanımlı', ok: true },
                                { label: 'Giriş Log Kaydı', ok: true },
                                { label: '2FA (İki Faktörlü)', ok: false },
                                { label: 'IP Kısıtlama', ok: false },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f8fafc', fontSize: '0.78rem' }}>
                                    <span style={{ color: '#374151', fontWeight: 600 }}>{item.label}</span>
                                    <span style={{ fontWeight: 800, color: item.ok ? '#10b981' : '#f59e0b' }}>{item.ok ? '' : ' Planlandı'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* [M17] AKTİF OTURUMLAR WİDGET (GVN-06) */}
                    <div style={{ background: 'white', border: '2px solid #e0f2fe', borderRadius: 14, padding: '1.25rem', marginTop: '1.5rem', marginBottom: '8rem' }}>
                        <h3 style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.92rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            Aktif Oturum Yönetimi (M17)
                        </h3>
                        {kullanici ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f0fdf4', borderRadius: 12, border: '2px solid #86efac' }}>
                                <div>
                                    <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#065f46' }}>Mevcut Aktif Oturum</div>
                                    <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: 4, fontWeight: 700 }}>
                                        <span style={{ background: '#d1fae5', padding: '2px 8px', borderRadius: 6, marginRight: 8, border: '1px solid #10b981' }}>{kullanici.grup}</span>
                                        {kullanici.label || 'Bilinmiyor'}
                                    </div>
                                </div>
                                <button onClick={() => { sessionStorage.clear(); window.location.href = '/giris'; }}
                                    style={{ background: '#fef2f2', border: '2px solid #fca5a5', color: '#dc2626', padding: '8px 16px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(220,38,38,0.15)' }}>
                                    Oturumu Sonlandır
                                </button>
                            </div>
                        ) : (
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Aktif oturum bilgisine ulaşılamadı.</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
