'use client';
/**
 * features/ayarlar/components/AyarlarMainContainer.js
 * Kaynak: app/ayarlar/page.js → features mimarisine taşındı
 * UI logic burada, state/data → hooks/useAyarlar.js
 */
﻿'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { Save, Settings2, Globe, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

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
    firma_adi: '',
    firma_logo_url: '',
    firma_adres: '',
    firma_vergi_no: '',
    bildirim_uretim: true,
    bildirim_stok: true,
    bildirim_siparis: true,
    bildirim_personel: false,
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
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
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
        } catch (error) { goster('Ayarlar yüklenemedi: ' + error.message, 'error'); }
    };

    const kaydet = async () => {
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            kullanici,
            'Sistem Ayarlarını kaydetmek için Yönetici PIN girin:'
        );
        if (!yetkili) return goster(yetkiMesaj || 'Hatalı yetki! İşlem engellendi.', 'error');

        // X Kriteri (Sınır Güvenliği)
        if (ayarlar.dakika_basi_ucret < 0 || ayarlar.dakika_basi_ucret > 500) return goster('Dakika ücreti mantıksız (Max 500)', 'error');
        if (ayarlar.prim_orani < 0 || ayarlar.prim_orani >= 1) return goster('Prim oranı %0 ile %99 arası olmalı', 'error');
        if (ayarlar.yillik_izin_hakki < 0 || ayarlar.yillik_izin_hakki > 90) return goster('İzin hakkı çok yüksek (Max 90)', 'error');

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

            goster('✅ Ayarlar kaydedildi.');
            telegramBildirim(`⚙️ SİSTEM AYARLARI GÜNCELLENDİ\nPrim: %${(ayarlar.prim_orani * 100).toFixed(0)}\nDk Mlyt: ₺${ayarlar.dakika_basi_ucret}\nSistem parametreleri yönetici tarafından değiştirildi.`);
        } catch (error) {
            // [AI ZIRHI]: Offline guard (Kriter J)
            if (!navigator.onLine || error.message?.includes('fetch')) {
                await cevrimeKuyrugaAl({ tablo: 'b1_sistem_ayarlari', islem_tipi: 'UPSERT', veri: { anahtar: 'sistem_genel', deger: JSON.stringify(ayarlar) } });
                goster('İnternet Yok: Ayarlar çevrimdışı kuyruğa alındı.', 'success');
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
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Sistem Ayarları izne tabidir. Görüntülemek ve düzenlemek için Üretim PİN girişi zorunludur.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>⚙️ Sistem Ayarları</h1>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0', fontWeight: 600 }}>1. Birim — Üretim Anayasası & Sabit Değişkenler</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={kaydet} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, background: loading ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                        <Save size={16} /> {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                    {/* CC Kriteri Otomatik Rota (Karargaha Dönüş/Döngü Sonu) */}
                    <a href="/" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', color: '#0f172a', border: '2px solid #e2e8f0', padding: '10px 22px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
                            🏛️ Karargâh (Başa Dön)
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
                {/* KARAR KİLİTLERİ */}
                <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 16, padding: '1.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '1.25rem' }}>
                        <Settings2 size={18} color="#f97316" /> İnisiyatif & Tolerans Kilitleri
                    </h2>

                    {[
                        { key: 'teknik_foy_zorunlu', baslik: 'Teknik Föy Fotoğrafı Zorunlu', aciklama: 'A4 formu fotoğraflanmadan üretim başlatılamaz.' },
                        { key: 'vidan_hesaplayici', baslik: 'Akıllı Vicdan Hesaplayıcı', aciklama: 'Sistemsel duruş süreleri (elektrik, makine) otomatik prim maliyetinden düşülür.' },
                        { key: 'siraladim_adim', baslik: 'Sıralı Adım Bypass Engeli', aciklama: 'Kesim tamamlanıp kanıt gelmeden fason işçi sonraki adıma geçemez.' },
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
                        <label style={lbl}>Dakika Başı Ortalama Ücret (₺)</label>
                        <input type="number" step="0.01" value={ayarlar.dakika_basi_ucret} onChange={e => set('dakika_basi_ucret', parseFloat(e.target.value))} style={inp} />
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>D-C Kronometrede durunca maliyet hesabında kullanılır.</p>
                    </div>
                    <div style={{ marginTop: '0.875rem' }}>
                        <label style={lbl}>Prim Oranı (% — eşik üstü kazanç)</label>
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
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', marginLeft: 4 }}>Hızlı seç</span>
                        </div>
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                            İşletme kararı: %0–%99 arası özgürce ayarla. Bu ayda çok iş → %20, az iş → %10.
                            Eşik aşıldığında çalışanlar bu oranla prim kazanır.
                        </p>
                    </div>
                    <div style={{ marginTop: '0.875rem' }}>
                        <label style={lbl}>Yıllık İzin Hakkı (Gün)</label>
                        <input type="number" step="1" min="0" max="60" value={ayarlar.yillik_izin_hakki} onChange={e => set('yillik_izin_hakki', parseInt(e.target.value))} style={inp} />
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>Personel modülünde izin bakiyesi hesabında kullanılır.</p>
                    </div>
                </div>

                {/* DİL & MEDYA */}
                <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 16, padding: '1.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '1.25rem' }}>
                        <Globe size={18} color="#3b82f6" /> Dil & Medya Optimizasyonu
                    </h2>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={lbl}>İkinci Dil (Arayüz Çevirisi)</label>
                        <select value={ayarlar.aktif_dil} onChange={e => set('aktif_dil', e.target.value)} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                            <option value="ar">Arapça (العربية)</option>
                            <option value="en">İngilizce (English)</option>
                            <option value="fr">Fransızca (Français)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={lbl}>Maks. Video Süresi (Saniye)</label>
                        <input type="number" min="30" max="600" value={ayarlar.max_video_sn} onChange={e => set('max_video_sn', parseInt(e.target.value))} style={inp} />
                        <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>
                            Modelhane video kanıtı için süre sınırı.
                            <strong style={{ color: '#059669' }}> Sektör standardı: 60–300 sn (1–5 dk).</strong> Min: 30 sn | Şu an: {ayarlar.max_video_sn} sn ({(ayarlar.max_video_sn / 60).toFixed(1)} dk)
                        </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={lbl}>Görsel Sıkıştırma Seviyesi</label>
                        <select value={ayarlar.goruntu_sikiştirma} onChange={e => set('goruntu_sikiştirma', e.target.value)} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                            <option value="yuksek">Yüksek Sıkıştırma (WebP — %80 tasarruf)</option>
                            <option value="orta">Orta Kalite (HD — %30 tasarruf)</option>
                            <option value="ham">Ham (Sıkıştırmasız)</option>
                        </select>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '0.875rem', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#374151', marginBottom: '0.375rem' }}>MEVCUT AYARLAR</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace', lineHeight: 1.6 }}>
                            Föy Zorunlu: {ayarlar.teknik_foy_zorunlu ? '✅' : '❌'}<br />
                            Vicdan Motor: {ayarlar.vidan_hesaplayici ? '✅' : '❌'}<br />
                            Sıralı Adım: {ayarlar.siraladim_adim ? '✅' : '❌'}<br />
                            Dk/₺: {ayarlar.dakika_basi_ucret}<br />
                            Prim Oranı: %{(ayarlar.prim_orani * 100).toFixed(0)}<br />
                            Yıllık İzin: {ayarlar.yillik_izin_hakki} gün
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1.25rem', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 12, padding: '1rem', fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                ✅ <strong>Sistem Hazır:</strong> Ayarlar Supabase&apos;de <code>b1_sistem_ayarlari</code> tablosuna kalıcı olarak kaydediliyor. Sayfa yenilenince ayarlar korunur.
            </div>

            {/* AYR-01: FIRMA PROFILI */}
            <div style={{ marginTop: '1.25rem', background: 'white', border: '2px solid #f1f5f9', borderRadius: 16, padding: '1.5rem' }}>
                <h2 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '1rem' }}> Firma Profili</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    {[
                        { key: 'firma_adi', label: 'Firma Adi', ph: '47 Tekstil...' },
                        { key: 'firma_vergi_no', label: 'Vergi No / VKN', ph: '1234567890' },
                        { key: 'firma_logo_url', label: 'Logo URL', ph: 'https://...' },
                        { key: 'firma_adres', label: 'Firma Adresi', ph: 'Ilce, Sehir' },
                    ].map(({ key, label, ph }) => (
                        <div key={key}>
                            <label style={lbl}>{label}</label>
                            <input type="text" value={ayarlar[key] || ''} onChange={e => set(key, e.target.value)} placeholder={ph} style={inp} />
                        </div>
                    ))}
                </div>
            </div>

            {/* AYR-02: BILDIRIM TERCIHLERI */}
            <div style={{ marginTop: '1.25rem', background: 'white', border: '2px solid #f1f5f9', borderRadius: 16, padding: '1.5rem' }}>
                <h2 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '1rem' }}> Telegram Bildirim Tercihleri</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {[
                        { key: 'bildirim_uretim', label: 'Uretim Bandi Olaylari' },
                        { key: 'bildirim_stok', label: 'Kritik Stok Uyarilari' },
                        { key: 'bildirim_siparis', label: 'Yeni Siparis Bildirimi' },
                        { key: 'bildirim_personel', label: 'Personel Devamlilik' },
                    ].map(({ key, label }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>{label}</span>
                            <button onClick={() => set(key, !ayarlar[key])} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: ayarlar[key] ? '#10b981' : '#e5e7eb', position: 'relative', transition: 'background 0.2s' }}>
                                <span style={{ position: 'absolute', top: 2, left: ayarlar[key] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
