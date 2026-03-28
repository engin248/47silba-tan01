'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, RefreshCw, Clock, TrendingUp, Package, AlertTriangle, Lock, Camera, UploadCloud, ScanEye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { videoVeResimDenetle } from '@/lib/ai/visionAjanCore';
import SilBastanModal from '@/components/ui/SilBastanModal';
import { fetchDenetmenHaberleri, runOtoTarama, runAiAnalizi, markUyariAsCozuldu, markUyariAsGozArdi, sendTelegramNotification } from '@/features/denetmen/services/denetmenApi';

const SEVYE_RENK = {
    kritik: { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', badge: '#ef4444' },
    uyari: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', badge: '#f59e0b' },
    bilgi: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', badge: '#3b82f6' },
};

const TIP_KON = {
    dusuk_stok: { ikon: <Package size={14} />, etiket: 'Dşk Stok' },
    maliyet_asimi: { ikon: <TrendingUp size={14} />, etiket: 'Maliyet Aşm' },
    fire_yuksek: { ikon: <AlertTriangle size={14} />, etiket: 'Fire Yksek' },
    video_eksik: { ikon: <XCircle size={14} />, etiket: 'Video Eksik' },
    malzeme_eksik: { ikon: <Package size={14} />, etiket: 'Malzeme Eksik' },
    liyakat_uyari: { ikon: <ShieldAlert size={14} />, etiket: 'Liyakat' },
    diger: { ikon: <AlertTriangle size={14} />, etiket: 'Uyar' },
};

export default function DenetmenSayfasi() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [uyarilar, setUyarilar] = useState([]);
    const [loglar, setLoglar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tarama, setTarama] = useState(false);
    const [filtre, setFiltre] = useState('hepsi');
    const [mesaj, setMesaj] = useState('');
    const [aiAnaliz, setAiAnaliz] = useState(null);
    const [aiYukleniyor, setAiYukleniyor] = useState(false);

    // AI VISION STATE (GREV 4)
    const [visionModalAcik, setVisionModalAcik] = useState(false);
    const [visionYukleniyor, setVisionYukleniyor] = useState(false);
    const [visionFotoSecili, setVisionFotoSecili] = useState(null);
    const [visionSonuc, setVisionSonuc] = useState(null);

    useEffect(() => {
        let denetmenPin = false;
        try { denetmenPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { denetmenPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || denetmenPin;
        setYetkiliMi(erisebilir);

        let kanal;
        if (erisebilir) {
            // [AI ZIRHI]: Realtime Websocket (Kriter 20 & 34)
            kanal = supabase.channel('islem-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })
                .subscribe();
        }

        yukle();

        return () => { if (kanal) supabase.removeChannel(kanal); };
    }, [kullanici]);

    const telegramBildirim = (mesaj_metni) => {
        sendTelegramNotification(mesaj_metni);
    };

    const yukle = async () => {
        setLoading(true);
        try {
            const data = await fetchDenetmenHaberleri();
            setUyarilar(data.uyarilar);
            setLoglar(data.loglar);
        } catch (error) { setMesaj('Veriler yklenemedi: ' + error.message); }
        setLoading(false);
    };

    const taramaCalistir = async () => {
        if (tarama) return setMesaj('Tarama zaten devam ediyor...');
        setTarama(true);
        setMesaj('');
        try {
            const yeniUyariSayisi = await runOtoTarama();
            setMesaj(`Tarama tamamlandı. ${yeniUyariSayisi} yeni uyarı oluşturuldu.`);
            yukle();
        } catch (e) {
            setMesaj('Tarama hatası: ' + e.message);
        } finally {
            setTimeout(() => setTarama(false), 3000); // 3 saniye anti-spam
        }
    };

    const aiAnalizYap = async () => {
        if (uyarilar.length === 0) { setMesaj('Uyarı yok, önce Tara & Güncelle\'ye basın.'); return; }
        if (aiYukleniyor) return setMesaj('AI zaten analiz ediyor...');
        setAiYukleniyor(true);
        setAiAnaliz(null);
        try {
            const ozet = uyarilar.slice(0, 10).map(u => `- [${u.seviye?.toUpperCase()}] ${u.baslik}: ${u.mesaj}`).join('\n');
            const data = await runAiAnalizi(ozet);
            setAiAnaliz(data);
        } catch (e) {
            setAiAnaliz('Bağlantı hatası: ' + e.message);
        } finally {
            setTimeout(() => setAiYukleniyor(false), 3000); // 3 saniye anti-spam
        }
    };

    const coz = async (id, baslik) => {
        try {
            await markUyariAsCozuldu(id);
            setUyarilar(prev => prev.filter(u => u.id !== id));
            telegramBildirim(`🚨 ALARM ÇÖZÜLDÜ\nMüfettiş: ${baslik}`);
        } catch (error) { setMesaj('Hata: ' + error.message); }
    };

    const gozArd = async (id) => {
        try {
            await markUyariAsGozArdi(id);
            setUyarilar(prev => prev.filter(u => u.id !== id));
        } catch (error) { setMesaj('Hata: ' + error.message); }
    };

    const formatTarih = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const filtrelendi = filtre === 'hepsi' ? uyarilar : uyarilar.filter(u => u.seviye === filtre || u.uyari_tipi === filtre);
    const kritikSayisi = uyarilar.filter(u => u.seviye === 'kritik').length;
    const uyariSayisi = uyarilar.filter(u => u.seviye === 'uyari').length;

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKSZ GRŞ ENGELLEND</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Sistem denetmeni verileri son derece gizlidir. Grntlemek iğin Yetkili Kullanc girişi gereklidir.</p>
            </div>
        );
    }

    return (
        <div>
            {/* BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Sistem Denetmeni</h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>Otomatik alarm merkezi  gerğek veri</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={taramaCalistir} disabled={tarama}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: tarama ? '#94a3b8' : '#7c3aed', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: tarama ? 'not-allowed' : 'pointer', opacity: tarama ? 0.7 : 1 }}>
                        <RefreshCw size={16} style={{ animation: tarama ? 'spin 1s linear infinite' : 'none' }} />
                        {tarama ? 'Taranyor...' : 'Tara & Gncelle'}
                    </button>
                    {/* VISION MFETTŞ (GREV 4) */}
                    <button onClick={() => { setVisionModalAcik(true); setVisionFotoSecili(null); setVisionSonuc(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', color: '#38bdf8', border: '2px solid #0284c7', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}>
                        <ScanEye size={18} /> Kumaş / Dikim Analiz
                    </button>
                    <button onClick={aiAnalizYap} disabled={aiYukleniyor || uyarilar.length === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: aiYukleniyor ? '#334155' : 'white', color: '#059669', border: '2px solid #059669', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: (aiYukleniyor || uyarilar.length === 0) ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
                        ş {aiYukleniyor ? 'Dşnyor...' : 'Gemini AI Analizi'}
                    </button>
                </div>
            </div>

            {/* ZET KARTLAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Aktif Uyar', val: uyarilar.length, color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Kritik', val: kritikSayisi, color: '#ef4444', bg: '#fef2f2' },
                    { label: 'Uyar', val: uyariSayisi, color: '#f59e0b', bg: '#fffbeb' },
                ].map((k, i) => (
                    <div key={i} style={{ background: k.bg, border: `1px solid ${k.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
                        <div style={{ fontWeight: 900, fontSize: '1.6rem', color: k.color }}>{k.val}</div>
                    </div>
                ))}
            </div>

            {/* MESAJ */}
            {mesaj && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #bbf7d0' }}>
                    {mesaj}
                </div>
            )}

            {/* AI ANALZ SONUCU */}
            {aiAnaliz && (
                <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>ş</span>
                    <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 6 }}>Gemini Otonom Karargh Zekas</div>
                        <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.7 }}>{aiAnaliz}</div>
                        <button onClick={() => setAiAnaliz(null)} style={{ marginTop: 8, fontSize: '0.68rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Kapat</button>
                    </div>
                </div>
            )}

            {/* FLTRE */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['hepsi', 'kritik', 'uyari', 'bilgi', 'dusuk_stok', 'maliyet_asimi', 'video_eksik', 'diger'].map(f => (
                    <button key={f} onClick={() => setFiltre(f)}
                        style={{
                            padding: '5px 12px', borderRadius: 6, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
                            borderColor: filtre === f ? '#7c3aed' : '#e5e7eb',
                            background: filtre === f ? '#7c3aed' : 'white',
                            color: filtre === f ? 'white' : '#374151'
                        }}>
                        {f === 'hepsi' ? 'Tm' : f === 'dusuk_stok' ? 'Stok' : f === 'maliyet_asimi' ? 'Maliyet' : f === 'video_eksik' ? 'Video' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* UYARI LSTES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Ykleniyor...</div>}
                {!loading && filtrelendi.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e5e7eb' }}>
                        <CheckCircle size={40} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                        <p style={{ color: '#10b981', fontWeight: 800 }}>Aktif uyar yok</p>
                    </div>
                )}
                {filtrelendi.map(u => {
                    const r = SEVYE_RENK[u.seviye] || SEVYE_RENK.bilgi;
                    const tip = TIP_KON[u.uyari_tipi] || TIP_KON.diger;
                    return (
                        <div key={u.id} style={{ background: r.bg, border: `2px solid ${r.border}`, borderRadius: 12, padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, background: r.badge, color: 'white', padding: '2px 7px', borderRadius: 4 }}>{u.seviye?.toUpperCase()}</span>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: r.text, display: 'flex', alignItems: 'center', gap: 3 }}>{tip.ikon} {tip.etiket}</span>
                                </div>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{u.baslik}</div>
                                {u.mesaj && <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 3, fontWeight: 600 }}>{u.mesaj}</div>}
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4 }}>{formatTarih(u.olusturma)}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button onClick={() => coz(u.id, u.baslik)} title="zld"
                                    style={{ padding: '5px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle size={12} /> zld
                                </button>
                                <button onClick={() => gozArd(u.id)} title="Gz Ard"
                                    style={{ padding: '5px 10px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>
                                    Yoksay
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* AGENT LOG */}
            {loglar.length > 0 && (
                <div style={{ background: '#0f172a', borderRadius: 12, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} /> Son Ajan Hareketleri
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {loglar.slice(0, 10).map(l => (
                            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', padding: '3px 0', borderBottom: '1px solid #1e293b' }}>
                                <span style={{ color: l.sonuc === 'hata' ? '#f87171' : '#34d399', fontWeight: 700 }}>{l.ajan_adi}</span>
                                <span style={{ color: '#94a3b8' }}>{l.mesaj}</span>
                                <span style={{ color: '#475569' }}>{formatTarih(l.created_at)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI VISION (GR) ANALZ MODALI */}
            <SilBastanModal title="ş Yapay Zeka Vision Analiz ekirdeşi" acik={visionModalAcik} onClose={() => !visionYukleniyor && setVisionModalAcik(false)}>
                <div style={{ padding: '0.5rem', textAlign: 'center' }}>

                    {!visionFotoSecili ? (
                        <div style={{ border: '3px dashed #cbd5e1', borderRadius: '16px', padding: '3rem 1rem', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s', position: 'relative' }}>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                capture="environment"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onload = (e) => setVisionFotoSecili(e.target.result);
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                            <Camera size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ margin: '0 0 0.5rem', color: '#334155', fontWeight: 800 }}>Kameray Ağ veya Fotoşraf Ykle</h3>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Dikim hatasn veya kumaş abrajn buraya taratn.</p>
                        </div>
                    ) : (
                        <div>
                            {/* Ykl Resim Gsterimi */}
                            <img src={visionFotoSecili} alt="Yklenen Kumaş" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '12px', border: '2px solid #e2e8f0', marginBottom: '1.5rem' }} />

                            {/* Sonuğ Yoksa Analiz Et Butonu */}
                            {!visionSonuc && (
                                <button
                                    onClick={async () => {
                                        setVisionYukleniyor(true);
                                        try {
                                            const v = await videoVeResimDenetle(visionFotoSecili);
                                            setVisionSonuc(v);
                                        } finally {
                                            setVisionYukleniyor(false);
                                        }
                                    }}
                                    disabled={visionYukleniyor}
                                    style={{ width: '100%', padding: '14px', borderRadius: '10px', background: visionYukleniyor ? '#94a3b8' : '#0ea5e9', color: 'white', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: visionYukleniyor ? 'not-allowed' : 'pointer' }}
                                >
                                    {visionYukleniyor ? 'ş ekirdek Analiz Ediyor (Ltfen Bekleyin)...' : 'HATA ORANI ANALZN BAŞLAT'}
                                </button>
                            )}

                            {/* Analiz Sonucu (MHR) */}
                            {visionSonuc && (
                                <div style={{ background: visionSonuc.onay ? '#f0fdf4' : '#fef2f2', border: `3px solid ${visionSonuc.onay ? '#22c55e' : '#ef4444'}`, borderRadius: '16px', padding: '1.5rem', textAlign: 'left', animation: 'slideIn 0.3s ease-out' }}>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: `2px solid ${visionSonuc.onay ? '#bbf7d0' : '#fca5a5'}`, paddingBottom: '1rem' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: visionSonuc.onay ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
                                            {visionSonuc.onay ? ' ONAYLANDI (TEMZ)' : ' REDDEDLD (DEFOLU)'}
                                        </div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: visionSonuc.onay ? '#22c55e' : '#ef4444' }}>
                                            % {visionSonuc.kumasHataOrani.toFixed(1)} <span style={{ fontSize: '0.8rem', display: 'block', color: '#64748b' }}>HATA.</span>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700, lineHeight: 1.6 }}>
                                        <strong style={{ color: '#0f172a' }}>Mfettiş Yorumu:</strong><br />
                                        {visionSonuc.yorum}
                                    </div>

                                    <button onClick={() => { setVisionFotoSecili(null); setVisionSonuc(null); }} style={{ width: '100%', marginTop: '1.5rem', padding: '10px', background: 'white', border: '2px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, color: '#475569' }}>
                                        YEN ANALZ
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SilBastanModal>
        </div>
    );
}