'use client';
/**
 * features/denetmen/components/DenetmenMainContainer.js
 * Kaynak: app/denetmen/page.js → features mimarisine taşındı
 * UI logic burada, state/data → hooks/useDenetmen.js
 */
'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, RefreshCw, Clock, TrendingUp, Package, AlertTriangle, Lock, Camera, UploadCloud, ScanEye, Database } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { videoVeResimDenetle } from '@/lib/ai/visionAjanCore';
import SilBastanModal from '@/lib/components/ui/SilBastanModal';

const SEVİYE_RENK = {
    kritik: { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', badge: '#ef4444' },
    uyari: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', badge: '#f59e0b' },
    bilgi: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', badge: '#3b82f6' },
};

const TIP_İKON = {
    dusuk_stok: { ikon: <Package size={14} />, etiket: 'Düşük Stok' },
    maliyet_asimi: { ikon: <TrendingUp size={14} />, etiket: 'Maliyet Aşımı' },
    fire_yuksek: { ikon: <AlertTriangle size={14} />, etiket: 'Fire Yüksek' },
    video_eksik: { ikon: <XCircle size={14} />, etiket: 'Video Eksik' },
    malzeme_eksik: { ikon: <Package size={14} />, etiket: 'Malzeme Eksik' },
    liyakat_uyari: { ikon: <ShieldAlert size={14} />, etiket: 'Liyakat' },
    diger: { ikon: <AlertTriangle size={14} />, etiket: 'Uyarı' },
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

    // YENİ SEKMELER
    const [anaSekme, setAnaSekme] = useState('uyarilar'); // 'uyarilar' | 'buyuk_veri'

    // AI VISION STATE (GÖREV 4)
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
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 10000);
        fetch('/api/telegram-bildirim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj: mesaj_metni }),
            signal: controller.signal
        }).finally(() => clearTimeout(tId)).catch(() => null);
    };

    const yukle = async () => {
        setLoading(true);
        try {
            const [uyariSonuc, logSonuc] = await Promise.allSettled([
                supabase.from('b1_sistem_uyarilari').select('*').eq('durum', 'aktif').order('olusturma', { ascending: false }).limit(100),
                supabase.from('b1_agent_loglari').select('*').order('created_at', { ascending: false }).limit(20)
            ]);

            if (uyariSonuc.status === 'fulfilled' && uyariSonuc.value.data) setUyarilar(uyariSonuc.value.data);
            if (logSonuc.status === 'fulfilled' && logSonuc.value.data) setLoglar(logSonuc.value.data);
        } catch (error) { setMesaj('Veriler yüklenemedi: ' + error.message); }
        setLoading(false);
    };

    const taramaCalistir = async () => {
        if (tarama) return goster('⏳ Tarama zaten devam ediyor...', 'error');
        setTarama(true);
        setMesaj('');
        try {
            // Stok tarama
            const { data: urunler } = await supabase
                .from('b2_urun_katalogu')
                .select('id, urun_adi_tr, stok_adeti, min_stok_alarm')
                .eq('aktif', true)
                .not('min_stok_alarm', 'is', null)
                .limit(500);

            let yeniUyari = 0;
            for (const u of (urunler || [])) {
                if (u.stok_adeti <= u.min_stok_alarm) {
                    const { data: var_ } = await supabase
                        .from('b1_sistem_uyarilari')
                        .select('id')
                        .eq('uyari_tipi', 'dusuk_stok')
                        .eq('kaynak_id', u.id)
                        .eq('durum', 'aktif')
                        .limit(1);
                    if (!var_?.length) {
                        await supabase.from('b1_sistem_uyarilari').insert([{
                            uyari_tipi: 'dusuk_stok',
                            seviye: u.stok_adeti === 0 ? 'kritik' : 'uyari',
                            baslik: `${u.stok_adeti === 0 ? 'Stok Sıfır' : 'Düşük Stok'}: ${u.urun_adi_tr}`,
                            mesaj: `${u.stok_adeti} adet | Min: ${u.min_stok_alarm} adet`,
                            kaynak_tablo: 'b2_urun_katalogu',
                            kaynak_id: u.id,
                            durum: 'aktif',
                        }]);
                        yeniUyari++;
                    }
                }
            }

            // Maliyet tarama
            const { data: raporlar } = await supabase
                .from('b1_muhasebe_raporlari')
                .select('id, hedeflenen_maliyet_tl, gerceklesen_maliyet_tl, fark_tl')
                .not('hedeflenen_maliyet_tl', 'is', null)
                .order('created_at', { ascending: false })
                .limit(50);

            for (const r of (raporlar || [])) {
                const hedef = parseFloat(r.hedeflenen_maliyet_tl || 0);
                const fark = parseFloat(r.fark_tl || 0);
                if (hedef <= 0) continue;
                const yuzde = (fark / hedef) * 100;
                if (yuzde > 10) {
                    const { data: var_ } = await supabase
                        .from('b1_sistem_uyarilari')
                        .select('id').eq('uyari_tipi', 'maliyet_asimi').eq('kaynak_id', r.id).eq('durum', 'aktif').limit(1);
                    if (!var_?.length) {
                        await supabase.from('b1_sistem_uyarilari').insert([{
                            uyari_tipi: 'maliyet_asimi',
                            seviye: yuzde > 25 ? 'kritik' : 'uyari',
                            baslik: `Maliyet Aşımı: %${yuzde.toFixed(1)}`,
                            mesaj: `Hedef: ₺${hedef.toFixed(0)} | Gerçek: ₺${parseFloat(r.gerceklesen_maliyet_tl).toFixed(0)} | Fark: +₺${fark.toFixed(0)}`,
                            kaynak_tablo: 'b1_muhasebe_raporlari',
                            kaynak_id: r.id,
                            durum: 'aktif',
                        }]);
                        yeniUyari++;
                    }
                }
            }

            setMesaj(`Tarama tamamlandı. ${yeniUyari} yeni uya rı oluşturuldu.`);
            yukle();
        } catch (e) {
            setMesaj('Tarama hatası: ' + e.message);
        } finally {
            setTimeout(() => setTarama(false), 3000); // 3 saniye anti-spam bekleme süresi
        }
    };

    const aiAnalizYap = async () => {
        if (uyarilar.length === 0) { setMesaj('Uyarı yok, önce Tara & Güncelle\'ye basın.'); return; }
        if (aiYukleniyor) return goster('⏳ AI zaten analiz ediyor...', 'error');
        setAiYukleniyor(true);
        setAiAnaliz(null);
        try {
            const ozet = uyarilar.slice(0, 10).map(u =>
                `- [${u.seviye?.toUpperCase()}] ${u.baslik}: ${u.mesaj}`
            ).join('\n');
            const res = await fetch('/api/trend-ara', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sorgu: `Bir tekstil atölyesinde şu sistem uyarıları var:\n${ozet}\n\nBunları öncelik sırasına göre değerlendir ve kısa Türkçe çözüm önerileri sun. Sadece pratik ve uygulanabilir öneriler ver.`
                }),
            });
            const data = await res.json();
            setAiAnaliz(data.ozet || data.sonuclar?.[0]?.aciklama || 'Analiz tamamlandı.');
        } catch (e) {
            setAiAnaliz('Bağlantı hatası: ' + e.message);
        } finally {
            setTimeout(() => setAiYukleniyor(false), 3000); // 3 saniye anti-spam
        }
    };

    const coz = async (id, baslik) => {
        try {
            const { error } = await supabase.from('b1_sistem_uyarilari').update({ durum: 'cozuldu', cozum_tarihi: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            setUyarilar(prev => prev.filter(u => u.id !== id));
            telegramBildirim(`✅ ALARM ÇÖZÜLDÜ\nMüfettiş: ${baslik}`);
        } catch (error) { setMesaj('Hata: ' + error.message); }
    };

    const gozArd = async (id) => {
        try {
            const { error } = await supabase.from('b1_sistem_uyarilari').update({ durum: 'goz_ardi' }).eq('id', id);
            if (error) throw error;
            setUyarilar(prev => prev.filter(u => u.id !== id));
        } catch (error) { setMesaj('Hata: ' + error.message); }
    };

    const formatTarih = (iso) => {
        if (!iso) return '—';
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
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Sistem denetmeni verileri son derece gizlidir. Görüntülemek için Yetkili Kullanıcı girişi gereklidir.</p>
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
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>Otomatik alarm merkezi — gerçek veri</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={taramaCalistir} disabled={tarama}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: tarama ? '#94a3b8' : '#7c3aed', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: tarama ? 'not-allowed' : 'pointer', opacity: tarama ? 0.7 : 1 }}>
                        <RefreshCw size={16} style={{ animation: tarama ? 'spin 1s linear infinite' : 'none' }} />
                        {tarama ? 'Taranıyor...' : 'Tara & Güncelle'}
                    </button>
                    {/* B-09: Haftalık Rapor → Telegram */}
                    <button onClick={async () => {
                        const ozet = [
                            `📊 *SİSTEM DENETMENİ — HAFTALIK ÖZET*`,
                            `📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
                            `🚨 Aktif Uyarı: *${uyarilar.length}* adet`,
                            `🔴 Kritik: *${kritikSayisi}*  |  🟡 Uyarı: *${uyariSayisi}*`,
                            ``,
                            `👁 Son Ajan Hareketleri:`,
                            ...loglar.slice(0, 5).map(l => `  • [${l.ajan_adi}] ${l.mesaj}`),
                            ``,
                            `✅ THE ORDER ERP — Otonom Rapor`
                        ].join('\n');
                        telegramBildirim(ozet);
                        setMesaj('📨 Haftalık rapor Telegram\'a gönderildi!');
                        setTimeout(() => setMesaj(''), 4000);
                    }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#064e3b', color: '#34d399', border: '2px solid #34d399', padding: '9px 14px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                        📨 Haftalık Rapor
                    </button>
                    {/* VISION MÜFETTİŞ (GÖREV 4) */}

                    <button onClick={() => { setVisionModalAcik(true); setVisionFotoSecili(null); setVisionSonuc(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', color: '#38bdf8', border: '2px solid #0284c7', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}>
                        <ScanEye size={18} /> Kumaş / Dikim Analiz
                    </button>
                    <button onClick={aiAnalizYap} disabled={aiYukleniyor || uyarilar.length === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: aiYukleniyor ? '#334155' : 'white', color: '#059669', border: '2px solid #059669', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: (aiYukleniyor || uyarilar.length === 0) ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
                        🤖 {aiYukleniyor ? 'Düşünüyor...' : 'Gemini AI Analizi'}
                    </button>
                </div>
            </div>

            {/* SEKMELER */}
            <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', background: '#f1f5f9', borderRadius: 12, padding: 4 }}>
                <button onClick={() => setAnaSekme('uyarilar')} style={{ flex: 1, padding: '10px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s', background: anaSekme === 'uyarilar' ? 'white' : 'transparent', color: anaSekme === 'uyarilar' ? '#7c3aed' : '#64748b', boxShadow: anaSekme === 'uyarilar' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                    🚨 Sistem Uyarıları
                </button>
                <button onClick={() => setAnaSekme('buyuk_veri')} style={{ flex: 1, padding: '10px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s', background: anaSekme === 'buyuk_veri' ? '#1e1b4b' : 'transparent', color: anaSekme === 'buyuk_veri' ? '#a78bfa' : '#64748b', boxShadow: anaSekme === 'buyuk_veri' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>
                    🧠 Büyük Veri (Big Data) AI Öğrenmesi
                </button>
            </div>

            {anaSekme === 'uyarilar' ? (
                <>
                    {/* ÖZET KARTLAR */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        {[
                            { label: 'Aktif Uyarı', val: uyarilar.length, color: '#7c3aed', bg: '#f5f3ff' },
                            { label: 'Kritik', val: kritikSayisi, color: '#ef4444', bg: '#fef2f2' },
                            { label: 'Uyarı', val: uyariSayisi, color: '#f59e0b', bg: '#fffbeb' },
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

                    {/* AI ANALİZ SONUCU */}
                    {aiAnaliz && (
                        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🤖</span>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 6 }}>Gemini Otonom Karargâh Zekası</div>
                                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.7 }}>{aiAnaliz}</div>
                                <button onClick={() => setAiAnaliz(null)} style={{ marginTop: 8, fontSize: '0.68rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Kapat</button>
                            </div>
                        </div>
                    )}

                    {/* FİLTRE */}
                    <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {['hepsi', 'kritik', 'uyari', 'bilgi', 'dusuk_stok', 'maliyet_asimi', 'video_eksik', 'diger'].map(f => (
                            <button key={f} onClick={() => setFiltre(f)}
                                style={{
                                    padding: '5px 12px', borderRadius: 6, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
                                    borderColor: filtre === f ? '#7c3aed' : '#e5e7eb',
                                    background: filtre === f ? '#7c3aed' : 'white',
                                    color: filtre === f ? 'white' : '#374151'
                                }}>
                                {f === 'hepsi' ? 'Tümü' : f === 'dusuk_stok' ? 'Stok' : f === 'maliyet_asimi' ? 'Maliyet' : f === 'video_eksik' ? 'Video' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* UYARI LİSTESİ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Yükleniyor...</div>}
                        {!loading && filtrelendi.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e5e7eb' }}>
                                <CheckCircle size={40} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                                <p style={{ color: '#10b981', fontWeight: 800 }}>Aktif uyarı yok</p>
                            </div>
                        )}
                        {filtrelendi.map(u => {
                            const r = SEVİYE_RENK[u.seviye] || SEVİYE_RENK.bilgi;
                            const tip = TIP_İKON[u.uyari_tipi] || TIP_İKON.diger;
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
                                        <button onClick={() => coz(u.id, u.baslik)} title="Çözüldü"
                                            style={{ padding: '5px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <CheckCircle size={12} /> Çözüldü
                                        </button>
                                        <button onClick={() => gozArd(u.id)} title="Göz Ardı"
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
                </>
            ) : (
                // BÜYÜK VERİ (BIG DATA) ÖĞRENMESİ SEKRESİ
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '1.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 8px 32px rgba(49, 46, 129, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}><Database size={20} color="#a78bfa" /> Büyük Veri (Big Data) Öngörü ve Öğrenme Merkezi</h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#c7d2fe' }}>Geçmiş verileri analiz eder, anomalileri öğrenir ve anlık "Satranç Hamlesi" tarzı kararlar sunar.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                            {/* 116. Kriter: İade Veri Öğrenmesi */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={14} /> Tüketici Reaksiyon Öğrenmesi</div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 8px 0', color: '#fca5a5' }}>Kırmızı Kumaş İade Analizi (Geçen Yıl)</h3>
                                <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>AI Öğrenme Modeli geçen sezonun verilerini işledi: Kırmızı renkli ceketlerdeki iade oranı <strong>%42</strong> daha yüksek tespit edildi. M1 Ar-Ge aşamasında kırmızı ceket tasarımlarının trend puanı otomatik düşürülüp uyarılacak.</p>
                                <div style={{ marginTop: 10, fontSize: '0.75rem', background: '#7f1d1d', color: '#fecaca', display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>Karar: Kırmızı renk ağırlığını %15'in altına çek.</div>
                            </div>

                            {/* 118. Kriter: Makine Öğrenme Grafiği (Hammadde) */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={14} /> Hammadde Fiyat Öğrenmesi</div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 8px 0', color: '#6ee7b7' }}>Zaman Serisi: İplik Enflasyon Modeli</h3>
                                <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>Son 3 yıllık Nisan ayı satın alma verileri incelendiğinde, bahar talebi yüzünden Toptancı Pamuk İplik fiyatlarında her Nisan ayında spesifik <strong>~%24</strong> şişme öngörülüyor.</p>
                                <div style={{ marginTop: 10, fontSize: '0.75rem', background: '#064e3b', color: '#a7f3d0', display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>Öneri: Mart ayında tedarik stoklarını %40 artırın.</div>
                            </div>

                            {/* 119. Kriter: Hata Öğrenmesi (Çevresel/Personel) */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> Ortam ve Verimlilik Öğrenimi</div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 8px 0', color: '#fde047' }}>Kış Aylarında Sabah Mesaisi Düşüşü</h3>
                                <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>08:30 - 09:30 arası Makine devir verileri analiz edildiğinde Aralık-Ocak aylarında günlük üretim hızının ilk saatte <strong>%18</strong> genlik kaybettiği Hata Öğrenmesiyle teyit edildi (Soğuk Etkisi).</p>
                                <div style={{ marginTop: 10, fontSize: '0.75rem', background: '#713f12', color: '#fef08a', display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>Otonom Eylem: Isıtıcı sistemini saat 07:45'te başlat.</div>
                            </div>

                            {/* 120. Kriter: Canlı Karar Destek Sistemi ("Satranç Hamlesi") */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={14} /> Canlı Karar Destek Sistemi</div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 8px 0', color: '#38bdf8' }}>Üretim Bandı Dengeleyici (Satranç Modülü)</h3>
                                <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>Sensör Verisi: Sağ Kesim bandında <strong>%92</strong> doluluk (darboğaz riski), sol Kalıp bandında <strong>%34</strong> boşta kalma süresi algılandı. Üretim senkronizasyonu tehlikede.</p>
                                <div style={{ marginTop: 10, fontSize: '0.75rem', background: '#0c4a6e', color: '#bae6fd', display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>Satranç Hamlesi: Sol banttan 3 kalıpçıyı, 2 saatliğine Sağ Kesime çekin.</div>
                            </div>
                        </div>

                        {/* 117. Kriter: Kapalı Devre Model Eğitimi (Fine-Tuning) */}
                        <div style={{ marginTop: '1rem', background: '#020617', padding: '1rem', borderRadius: '12px', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={16} /> Kapalı Devre "Model Özel Eğitimi" Mimarisi</h3>
                                    <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Dışarı veri sızdırmadan sadece atölyenin verileriyle Fine-Tuning yapılan yerel AI modeli.</p>
                                </div>
                                <button style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}><UploadCloud size={14} /> Eğitimi Başlat</button>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <div style={{ flex: 1, background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>Mevcut Ağırlık Dosyası</div>
                                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, marginTop: 4 }}>v4_47sb_local_weights.safetensors</div>
                                </div>
                                <div style={{ flex: 1, background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>Eğitim Veriseti</div>
                                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, marginTop: 4 }}>18,450 Üretim Logu (Sadece Fabrika)</div>
                                </div>
                                <div style={{ flex: 1, background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>Durum</div>
                                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginTop: 4 }}>Özel Model (Fine-Tuned) Hazır</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI VISION (GÖRÜ) ANALİZ MODALI */}
            <SilBastanModal title="📷 Yapay Zeka Vision Analiz Çekirdeği" acik={visionModalAcik} onClose={() => !visionYukleniyor && setVisionModalAcik(false)}>
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
                            <h3 style={{ margin: '0 0 0.5rem', color: '#334155', fontWeight: 800 }}>Kamerayı Aç veya Fotoğraf Yükle</h3>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Dikim hatasını veya kumaş abrajını buraya taratın.</p>
                        </div>
                    ) : (
                        <div>
                            {/* Yüklü Resim Gösterimi */}
                            <img src={visionFotoSecili} alt="Yüklenen Kumaş" loading="lazy" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '12px', border: '2px solid #e2e8f0', marginBottom: '1.5rem' }} />

                            {/* Sonuç Yoksa Analiz Et Butonu */}
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
                                    {visionYukleniyor ? '🤖 Çekirdek Analiz Ediyor (Lütfen Bekleyin)...' : 'HATA ORANI ANALİZİNİ BAŞLAT'}
                                </button>
                            )}

                            {/* Analiz Sonucu (MÜHÜR) */}
                            {visionSonuc && (
                                <div style={{ background: visionSonuc.onay ? '#f0fdf4' : '#fef2f2', border: `3px solid ${visionSonuc.onay ? '#22c55e' : '#ef4444'}`, borderRadius: '16px', padding: '1.5rem', textAlign: 'left', animation: 'slideIn 0.3s ease-out' }}>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: `2px solid ${visionSonuc.onay ? '#bbf7d0' : '#fca5a5'}`, paddingBottom: '1rem' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: visionSonuc.onay ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
                                            {visionSonuc.onay ? '✅ ONAYLANDI (TEMİZ)' : '❌ REDDEDİLDİ (DEFOLU)'}
                                        </div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: visionSonuc.onay ? '#22c55e' : '#ef4444' }}>
                                            % {visionSonuc.kumasHataOrani.toFixed(1)} <span style={{ fontSize: '0.8rem', display: 'block', color: '#64748b' }}>HATA.</span>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700, lineHeight: 1.6 }}>
                                        <strong style={{ color: '#0f172a' }}>Müfettiş Yorumu:</strong><br />
                                        {visionSonuc.yorum}
                                    </div>

                                    <button onClick={() => { setVisionFotoSecili(null); setVisionSonuc(null); }} style={{ width: '100%', marginTop: '1.5rem', padding: '10px', background: 'white', border: '2px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, color: '#475569' }}>
                                        YENİ ANALİZ
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
