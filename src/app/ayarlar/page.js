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
    goruntu_siki┼ştirma: 'yuksek',
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
        } catch (error) { goster('Ayarlar y├╝klenemedi: ' + error.message, 'error'); }
    };

    const kaydet = async () => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const pin = prompt('Sistem Ayarlar─▒n─▒ kaydetmek i├ğin Y├Ânetici P─░N girin:');
            const kilitPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (pin !== kilitPin) return goster('Hatal─▒ yetki! ─░┼şlem engellendi.', 'error');
        }

        // X Kriteri (S─▒n─▒r G├╝venli─şi)
        if (ayarlar.dakika_basi_ucret < 0 || ayarlar.dakika_basi_ucret > 500) return goster('Dakika ├╝creti mant─▒ks─▒z (Max 500)', 'error');
        if (ayarlar.prim_orani < 0 || ayarlar.prim_orani >= 1) return goster('Prim oran─▒ %0 ile %99 aras─▒ olmal─▒', 'error');
        if (ayarlar.yillik_izin_hakki < 0 || ayarlar.yillik_izin_hakki > 90) return goster('─░zin hakk─▒ ├ğok y├╝ksek (Max 90)', 'error');

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

            goster('Ô£à Ayarlar kaydedildi.');
            telegramBildirim(`ÔÜÖ´©Å S─░STEM AYARLARI G├£NCELLEND─░\nPrim: %${(ayarlar.prim_orani * 100).toFixed(0)}\nDk Mlyt: Ôé║${ayarlar.dakika_basi_ucret}\nSistem parametreleri y├Ânetici taraf─▒ndan de─şi┼ştirildi.`);
        } catch (error) {
            // [AI ZIRHI]: Offline guard (Kriter J)
            if (!navigator.onLine || error.message?.includes('fetch')) {
                await cevrimeKuyrugaAl({ tablo: 'b1_sistem_ayarlari', islem_tipi: 'UPSERT', veri: { anahtar: 'sistem_genel', deger: JSON.stringify(ayarlar) } });
                goster('─░nternet Yok: Ayarlar ├ğevrimd─▒┼ş─▒ kuyru─şa al─▒nd─▒.', 'success');
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
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETK─░S─░Z G─░R─░┼Ş ENGELLEND─░</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Sistem Ayarlar─▒ izne tabidir. G├Âr├╝nt├╝lemek ve d├╝zenlemek i├ğin ├£retim P─░N giri┼şi zorunludur.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>ÔÜÖ´©Å Sistem Ayarlar─▒</h1>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0', fontWeight: 600 }}>1. Birim ÔÇö ├£retim Anayasas─▒ & Sabit De─şi┼şkenler</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={kaydet} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, background: loading ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                        <Save size={16} /> {loading ? 'Kaydediliyor...' : 'De─şi┼şiklikleri Kaydet'}
                    </button>
                    {/* CC Kriteri Otomatik Rota (Karargaha D├Ân├╝┼ş/D├Âng├╝ Sonu) */}
                    <a href="/" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', color: '#0f172a', border: '2px solid #e2e8f0', padding: '10px 22px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
                            ­şÅø´©Å Kararg├óh (Ba┼şa D├Ân)
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
                {/* KARAR K─░L─░TLER─░ */}
                <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 16, padding: '1.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '1.25rem' }}>
                        <Settings2 size={18} color="#f97316" /> ─░nisiyatif & Tolerans Kilitleri
                    </h2>

                    {[
                        { key: 'teknik_foy_zorunlu', baslik: 'Teknik F├Ây Foto─şraf─▒ Zorunlu', aciklama: 'A4 formu foto─şraflanmadan ├╝retim ba┼şlat─▒lamaz.' },
                        { key: 'vidan_hesaplayici', baslik: 'Ak─▒ll─▒ Vicdan Hesaplay─▒c─▒', aciklama: 'Sistemsel duru┼ş s├╝releri (elektrik, makine) otomatik prim maliyetinden d├╝┼ş├╝l├╝r.' },
                        { key: 'siraladim_adim', baslik: 'S─▒ral─▒ Ad─▒m Bypass Engeli', aciklama: 'Kesim tamamlan─▒p kan─▒t gelmeden fason i┼ş├ği sonraki ad─▒ma ge├ğemez.' },
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
                        <label style={lbl}>Dakika Ba┼ş─▒ Ortalama ├£cret (Ôé║)</label>
                        <input type="number" step="0.01" value={ayarlar.dakika_basi_ucret} onChange={e => set('dakika_basi_ucret', parseFloat(e.target.value))} style={inp} />
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>D-C Kronometrede durunca maliyet hesab─▒nda kullan─▒l─▒r.</p>
                    </div>
                    <div style={{ marginTop: '0.875rem' }}>
                        <label style={lbl}>Prim Oran─▒ (% ÔÇö e┼şik ├╝st├╝ kazan├ğ)</label>
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
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', marginLeft: 4 }}>H─▒zl─▒ se├ğ</span>
                        </div>
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                            ─░┼şletme karar─▒: %0ÔÇô%99 aras─▒ ├Âzg├╝rce ayarla. Bu ayda ├ğok i┼ş ÔåÆ %20, az i┼ş ÔåÆ %10.
                            E┼şik a┼ş─▒ld─▒─ş─▒nda ├ğal─▒┼şanlar bu oranla prim kazan─▒r.
                        </p>
                    </div>
                    <div style={{ marginTop: '0.875rem' }}>
                        <label style={lbl}>Y─▒ll─▒k ─░zin Hakk─▒ (G├╝n)</label>
                        <input type="number" step="1" min="0" max="60" value={ayarlar.yillik_izin_hakki} onChange={e => set('yillik_izin_hakki', parseInt(e.target.value))} style={inp} />
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>Personel mod├╝l├╝nde izin bakiyesi hesab─▒nda kullan─▒l─▒r.</p>
                    </div>
                </div>

                {/* D─░L & MEDYA */}
                <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 16, padding: '1.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '1.25rem' }}>
                        <Globe size={18} color="#3b82f6" /> Dil & Medya Optimizasyonu
                    </h2>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={lbl}>─░kinci Dil (Aray├╝z ├çevirisi)</label>
                        <select value={ayarlar.aktif_dil} onChange={e => set('aktif_dil', e.target.value)} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                            <option value="ar">Arap├ğa (Ïğ┘äÏ╣Ï▒Ï¿┘èÏ®)</option>
                            <option value="en">─░ngilizce (English)</option>
                            <option value="fr">Frans─▒zca (Fran├ğais)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={lbl}>Maks. Video S├╝resi (Saniye)</label>
                        <input type="number" min="30" max="600" value={ayarlar.max_video_sn} onChange={e => set('max_video_sn', parseInt(e.target.value))} style={inp} />
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>
                            Modelhane video kan─▒t─▒ i├ğin s├╝re s─▒n─▒r─▒.
                            <strong style={{ color: '#059669' }}> Sekt├Âr standard─▒: 60ÔÇô300 sn (1ÔÇô5 dk).</strong> Min: 30 sn | ┼Şu an: {ayarlar.max_video_sn} sn ({(ayarlar.max_video_sn / 60).toFixed(1)} dk)
                        </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={lbl}>G├Ârsel S─▒k─▒┼şt─▒rma Seviyesi</label>
                        <select value={ayarlar.goruntu_siki┼ştirma} onChange={e => set('goruntu_siki┼ştirma', e.target.value)} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                            <option value="yuksek">Y├╝ksek S─▒k─▒┼şt─▒rma (WebP ÔÇö %80 tasarruf)</option>
                            <option value="orta">Orta Kalite (HD ÔÇö %30 tasarruf)</option>
                            <option value="ham">Ham (S─▒k─▒┼şt─▒rmas─▒z)</option>
                        </select>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '0.875rem', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#374151', marginBottom: '0.375rem' }}>MEVCUT AYARLAR</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace', lineHeight: 1.6 }}>
                            F├Ây Zorunlu: {ayarlar.teknik_foy_zorunlu ? 'Ô£à' : 'ÔØî'}<br />
                            Vicdan Motor: {ayarlar.vidan_hesaplayici ? 'Ô£à' : 'ÔØî'}<br />
                            S─▒ral─▒ Ad─▒m: {ayarlar.siraladim_adim ? 'Ô£à' : 'ÔØî'}<br />
                            Dk/Ôé║: {ayarlar.dakika_basi_ucret}<br />
                            Prim Oran─▒: %{(ayarlar.prim_orani * 100).toFixed(0)}<br />
                            Y─▒ll─▒k ─░zin: {ayarlar.yillik_izin_hakki} g├╝n
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1.25rem', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 12, padding: '1rem', fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                Ô£à <strong>Sistem Haz─▒r:</strong> Ayarlar Supabase&apos;de <code>b1_sistem_ayarlari</code> tablosuna kal─▒c─▒ olarak kaydediliyor. Sayfa yenilenince ayarlar korunur.
            </div>
        </div>
    );
}