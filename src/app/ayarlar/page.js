'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { Save, Settings2, Globe, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';

const VARSAYILAN = {
    teknik_foy_zorunlu: true,
    vidan_hesaplayici: true,
    siraladim_adim: true,
    aktif_dil: 'ar',
    max_video_sn: 300,
    goruntu_sikiştirma: 'yuksek',
    dakika_basi_ucret: 2.50,
    prim_orani: 0.15,
    yillik_izin_hakki: 15,
};

export default function AyarlarSayfasi() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [ayarlar, setAyarlar] = useState(VARSAYILAN);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {
            // [AI ZIRHI]: Realtime Websocket (Kriter 20 & 34)
            const kanal = supabase.channel('ayarlar-gercek-zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_sistem_ayarlari' }, () => { yukle(); })
                .subscribe();

            yukle();

            return () => { supabase.removeChannel(kanal); };
        }
    }, [kullanici]);

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

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        try {
            const { data, error } = await supabase.from('b1_sistem_ayarlari').select('*').limit(1).maybeSingle();
            if (error) throw error;
            if (data?.deger) {
                try { setAyarlar({ ...VARSAYILAN, ...JSON.parse(data.deger) }); } catch { }
            }
        } catch (error) { goster('Ayarlar yklenemedi: ' + error.message, 'error'); }
    };

    const kaydet = async () => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const pin = prompt('Sistem Ayarlarn kaydetmek iğin Ynetici PN girin:');
            const kilitPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (pin !== kilitPin) return goster('Hatal yetki! şlem engellendi.', 'error');
        }

        // X Kriteri (Snr Gvenlişi)
        if (ayarlar.dakika_basi_ucret < 0 || ayarlar.dakika_basi_ucret > 500) return goster('Dakika creti mantksz (Max 500)', 'error');
        if (ayarlar.prim_orani < 0 || ayarlar.prim_orani >= 1) return goster('Prim oran %0 ile %99 aras olmal', 'error');
        if (ayarlar.yillik_izin_hakki < 0 || ayarlar.yillik_izin_hakki > 90) return goster('zin hakk ğok yksek (Max 90)', 'error');

        setLoading(true);
        try {
            const deger = JSON.stringify(ayarlar);
            const { data: mevcut, error: eqErr } = await supabase.from('b1_sistem_ayarlari').select('id').limit(1).maybeSingle();
            if (eqErr) throw eqErr;

            let error;
            if (mevcut) {
                ({ error } = await supabase.from('b1_sistem_ayarlari').update({ deger, updated_at: new Date().toISOString() }).eq('id', mevcut.id));
            } else {
                ({ error } = await supabase.from('b1_sistem_ayarlari').insert([{ anahtar: 'sistem_genel', deger }]));
            }
            if (error) throw error;

            goster(' Ayarlar kaydedildi.');
            telegramBildirim(` SSTEM AYARLARI GNCELLEND\nPrim: %${(ayarlar.prim_orani * 100).toFixed(0)}\nDk Mlyt: ${ayarlar.dakika_basi_ucret}\nSistem parametreleri ynetici tarafndan deşiştirildi.`);
        } catch (error) {
            // [AI ZIRHI]: Offline guard (Kriter J)
            if (!navigator.onLine || error.message?.includes('fetch')) {
                await cevrimeKuyrugaAl({ tablo: 'b1_sistem_ayarlari', islem_tipi: 'UPSERT', veri: { anahtar: 'sistem_genel', deger: JSON.stringify(ayarlar) } });
                goster('nternet Yok: Ayarlar ğevrimdş kuyruşa alnd.', 'success');
            } else {
                goster('Hata: ' + error.message, 'error');
            }
        }
        setLoading(false);
    };

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };
    const set = (k, v) => setAyarlar(prev => ({ ...prev, [k]: v }));

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKSZ GRŞ ENGELLEND</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Sistem Ayarlar izne tabidir. Grntlemek ve dzenlemek iğin retim PN girişi zorunludur.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}> Sistem Ayarlar</h1>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0', fontWeight: 600 }}>1. Birim  retim Anayasas & Sabit Deşişkenler</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={kaydet} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, background: loading ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                        <Save size={16} /> {loading ? 'Kaydediliyor...' : 'Deşişiklikleri Kaydet'}
                    </button>
                    {/* CC Kriteri Otomatik Rota (Karargaha Dnş/Dng Sonu) */}
                    <a href="/" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', color: '#0f172a', border: '2px solid #e2e8f0', padding: '10px 22px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
                            ş Karargh (Başa Dn)
                        </button>
                    </a>
                </div>
            </div>

            {mesaj.text && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />} {mesaj.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* KARAR KLTLER */}
                <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 16, padding: '1.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '1.25rem' }}>
                        <Settings2 size={18} color="#f97316" /> nisiyatif & Tolerans Kilitleri
                    </h2>

                    {[
                        { key: 'teknik_foy_zorunlu', baslik: 'Teknik Fy Fotoşraf Zorunlu', aciklama: 'A4 formu fotoşraflanmadan retim başlatlamaz.' },
                        { key: 'vidan_hesaplayici', baslik: 'Akll Vicdan Hesaplayc', aciklama: 'Sistemsel duruş sreleri (elektrik, makine) otomatik prim maliyetinden dşlr.' },
                        { key: 'siraladim_adim', baslik: 'Sral Adm Bypass Engeli', aciklama: 'Kesim tamamlanp kant gelmeden fason işği sonraki adma geğemez.' },
                    ].map(({ key, baslik, aciklama }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{baslik}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>{aciklama}</div>
                            </div>
                            <button
                                onClick={() => set(key, !ayarlar[key])}
                                style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: ayarlar[key] ? '#10b981' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', marginLeft: 12, flexShrink: 0 }}
                            >
                                <span style={{ position: 'absolute', top: 3, left: ayarlar[key] ? 24 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                            </button>
                        </div>
                    ))}

                    <div style={{ marginTop: '1rem' }}>
                        <label style={lbl}>Dakika Baş Ortalama cret ()</label>
                        <input type="number" step="0.01" value={ayarlar.dakika_basi_ucret} onChange={e => set('dakika_basi_ucret', parseFloat(e.target.value))} style={inp} />
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>D-C Kronometrede durunca maliyet hesabnda kullanlr.</p>
                    </div>
                    <div style={{ marginTop: '0.875rem' }}>
                        <label style={lbl}>Prim Oran (%  eşik st kazanğ)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <input
                                type="range" min="0" max="99" step="1"
                                value={Math.round(ayarlar.prim_orani * 100)}
                                onChange={e => set('prim_orani', parseFloat(e.target.value) / 100)}
                                style={{
                                    flex: 1, accentColor:
                                        Math.round(ayarlar.prim_orani * 100) >= 30 ? '#ef4444' :
                                            Math.round(ayarlar.prim_orani * 100) >= 15 ? '#f59e0b' : '#10b981'
                                }}
                            />
                            <div style={{ position: 'relative', width: 80 }}>
                                <input
                                    type="number" step="1" min="0" max="99"
                                    value={Math.round(ayarlar.prim_orani * 100)}
                                    onChange={e => {
                                        const val = Math.min(99, Math.max(0, parseInt(e.target.value) || 0));
                                        set('prim_orani', val / 100);
                                    }}
                                    style={{
                                        ...inp, paddingRight: '1.8rem', textAlign: 'center', fontWeight: 900, fontSize: '1rem',
                                        color: Math.round(ayarlar.prim_orani * 100) >= 30 ? '#ef4444' :
                                            Math.round(ayarlar.prim_orani * 100) >= 15 ? '#f59e0b' : '#10b981'
                                    }}
                                />
                                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8', fontSize: '0.85rem' }}>%</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            {[5, 10, 15, 20, 25, 30].map(v => (
                                <button key={v} onClick={() => set('prim_orani', v / 100)}
                                    style={{
                                        padding: '3px 10px', border: '1px solid', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
                                        borderColor: Math.round(ayarlar.prim_orani * 100) === v ? '#0f172a' : '#e5e7eb',
                                        background: Math.round(ayarlar.prim_orani * 100) === v ? '#0f172a' : 'white',
                                        color: Math.round(ayarlar.prim_orani * 100) === v ? 'white' : '#64748b',
                                    }}>%{v}</button>
                            ))}
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', marginLeft: 4 }}>Hzl seğ</span>
                        </div>
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                            şletme karar: %0%99 aras zgrce ayarla. Bu ayda ğok iş  %20, az iş  %10.
                            Eşik aşldşnda ğalşanlar bu oranla prim kazanr.
                        </p>
                    </div>
                    <div style={{ marginTop: '0.875rem' }}>
                        <label style={lbl}>Yllk zin Hakk (Gn)</label>
                        <input type="number" step="1" min="0" max="60" value={ayarlar.yillik_izin_hakki} onChange={e => set('yillik_izin_hakki', parseInt(e.target.value))} style={inp} />
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>Personel modlnde izin bakiyesi hesabnda kullanlr.</p>
                    </div>
                </div>

                {/* DL & MEDYA */}
                <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 16, padding: '1.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '1.25rem' }}>
                        <Globe size={18} color="#3b82f6" /> Dil & Medya Optimizasyonu
                    </h2>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={lbl}>kinci Dil (Arayz evirisi)</label>
                        <select value={ayarlar.aktif_dil} onChange={e => set('aktif_dil', e.target.value)} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                            <option value="ar">Arapğa (ğ)</option>
                            <option value="en">ngilizce (English)</option>
                            <option value="fr">Franszca (Franğais)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={lbl}>Maks. Video Sresi (Saniye)</label>
                        <input type="number" min="30" max="600" value={ayarlar.max_video_sn} onChange={e => set('max_video_sn', parseInt(e.target.value))} style={inp} />
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>
                            Modelhane video kant iğin sre snr.
                            <strong style={{ color: '#059669' }}> Sektr standard: 60300 sn (15 dk).</strong> Min: 30 sn | Şu an: {ayarlar.max_video_sn} sn ({(ayarlar.max_video_sn / 60).toFixed(1)} dk)
                        </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={lbl}>Grsel Skştrma Seviyesi</label>
                        <select value={ayarlar.goruntu_sikiştirma} onChange={e => set('goruntu_sikiştirma', e.target.value)} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                            <option value="yuksek">Yksek Skştrma (WebP  %80 tasarruf)</option>
                            <option value="orta">Orta Kalite (HD  %30 tasarruf)</option>
                            <option value="ham">Ham (Skştrmasz)</option>
                        </select>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '0.875rem', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#374151', marginBottom: '0.375rem' }}>MEVCUT AYARLAR</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace', lineHeight: 1.6 }}>
                            Fy Zorunlu: {ayarlar.teknik_foy_zorunlu ? '' : ''}<br />
                            Vicdan Motor: {ayarlar.vidan_hesaplayici ? '' : ''}<br />
                            Sral Adm: {ayarlar.siraladim_adim ? '' : ''}<br />
                            Dk/: {ayarlar.dakika_basi_ucret}<br />
                            Prim Oran: %{(ayarlar.prim_orani * 100).toFixed(0)}<br />
                            Yllk zin: {ayarlar.yillik_izin_hakki} gn
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1.25rem', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 12, padding: '1rem', fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                 <strong>Sistem Hazr:</strong> Ayarlar Supabase&apos;de <code>b1_sistem_ayarlari</code> tablosuna kalc olarak kaydediliyor. Sayfa yenilenince ayarlar korunur.
            </div>
        </div>
    );
}