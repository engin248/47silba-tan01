'use client';
/**
 * features/musteriler/components/MusterilerMainContainer.js
 * Kaynak: app/musteriler/page.js → features mimarisine taşındı
 * UI logic burada, state/data → hooks/useMusteriler.js
 */
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { UserCheck, Plus, Phone, Mail, MapPin, Trash2, Lock, Search, Edit3, AlertTriangle, RefreshCw, ShieldOff, ShieldCheck, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import SilBastanModal from '@/components/ui/SilBastanModal';
import Link from 'next/link';

const MUSTERI_TIPLERI = ['bireysel', 'toptan', 'magaza'];
const TIP_LABEL = { bireysel: '👤 Bireysel', toptan: '🏭 Toptan', magaza: '🏪 Mağaza' };
const TIP_RENK = { bireysel: '#3b82f6', toptan: '#8b5cf6', magaza: '#f59e0b' };
const BOSH_FORM = {
    musteri_kodu: '', ad_soyad: '', ad_soyad_ar: '', musteri_tipi: 'bireysel',
    telefon: '', email: '', adres: '', vergi_no: '', kara_liste: false, risk_limiti: '', aktif: true, segment: 'B', notlar: ''
};

export default function MusterilerSayfasi() {
    const { kullanici: rawKullanici } = useAuth();
    const kullanici = /** @type {any} */ (rawKullanici);
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang, setLang } = useLang();  // Context'ten al — anlık güncelleme
    const [musteriler, setMusteriler] = useState(/** @type {any[]} */([]));
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [duzenleId, setDuzenleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [aramaMetni, setAramaMetni] = useState('');
    const [filtreTip, setFiltreTip] = useState('hepsi');
    const [filtreKara, setFiltreKara] = useState(false);

    // B-05: Müşteri İletişim Geçmişi (Timeline)
    const [timelineAcik, setTimelineAcik] = useState(false);
    const [seciliMusteri, setSeciliMusteri] = useState(/** @type {any} */(null));
    const [timelineLoglari, setTimelineLoglari] = useState(/** @type {any[]} */([]));
    const [yeniNot, setYeniNot] = useState('');
    const [notEkleniyor, setNotEkleniyor] = useState(false);
    const [islemdeId, setIslemdeId] = useState(/** @type {any} */(null));

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = /** @type {any} */ (kullanici)?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {
            const kanal = supabase.channel('musteriler-gercek-zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_musteriler' }, () => yukle())
                .subscribe();
            yukle();
            return () => { supabase.removeChannel(kanal); };
        }
    }, [kullanici]);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Bağlantı zaman aşımı (10sn)')), 10000));
            const { data, error } = await Promise.race([
                supabase.from('b2_musteriler').select('*').order('created_at', { ascending: false }).limit(500),
                timeout
            ]);
            if (error) throw error;
            setMusteriler(data || []);
        } catch (e) { goster('Müşteri verileri alınamadı: ' + e.message, 'error'); }
        setLoading(false);
    };

    const kaydet = async () => {
        if (islemdeId === 'kayit') return;
        setIslemdeId('kayit');
        if (!form.musteri_kodu.trim()) { setIslemdeId(null); return goster('Müşteri kodu zorunludur!', 'error'); }
        if (form.musteri_kodu.length > 30) { setIslemdeId(null); return goster('Müşteri kodu en fazla 30 karakter!', 'error'); }
        if (!form.ad_soyad.trim()) { setIslemdeId(null); return goster('Ad Soyad zorunludur!', 'error'); }
        if (form.ad_soyad.length > 200) { setIslemdeId(null); return goster('Ad Soyad çok uzun!', 'error'); }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setIslemdeId(null); return goster('Geçersiz e-posta formatı!', 'error'); }
        if (form.telefon && form.telefon.length > 20) { setIslemdeId(null); return goster('Telefon numarası çok uzun!', 'error'); }
        if (form.vergi_no && form.vergi_no.length > 50) { setIslemdeId(null); return goster('Vergi no çok uzun!', 'error'); }
        if (form.risk_limiti && isNaN(parseFloat(form.risk_limiti))) { setIslemdeId(null); return goster('Risk limiti sayısal olmalı!', 'error'); }

        const payload = {
            musteri_kodu: form.musteri_kodu.trim().toUpperCase(),
            ad_soyad: form.ad_soyad.trim(),
            ad_soyad_ar: form.ad_soyad_ar?.trim() || null,
            musteri_tipi: form.musteri_tipi,
            telefon: form.telefon?.trim() || null,
            email: form.email?.trim() || null,
            adres: form.adres?.trim() || null,
            vergi_no: form.vergi_no?.trim() || null,
            kara_liste: form.kara_liste || false,
            risk_limiti: form.risk_limiti ? parseFloat(form.risk_limiti) : null,
            aktif: form.aktif !== false,
        };

        // SİSTEM OPTİMİZASYONU: Offline Modu (Kriter J)
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b2_musteriler', duzenleId ? 'UPDATE' : 'INSERT', duzenleId ? { id: duzenleId, ...payload } : payload);
            goster('⚡ Çevrimdışı: Müşteri kaydı kuyruğa alındı.');
            setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null);
            setIslemdeId(null);
            return;
        }

        setLoading(true);
        try {
            if (duzenleId) {
                const { data: cakisan } = await supabase.from('b2_musteriler').select('id').eq('musteri_kodu', payload.musteri_kodu).neq('id', duzenleId);
                if (cakisan && cakisan.length > 0) {
                    setLoading(false);
                    return goster('⚠️ Bu müşteri kodu başka bir kayıtta kullanılıyor!', 'error');
                }
                const { error } = await supabase.from('b2_musteriler').update(payload).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Müşteri güncellendi!');
            } else {
                const { data: mevcut } = await supabase.from('b2_musteriler').select('id').eq('musteri_kodu', payload.musteri_kodu);
                if (mevcut && mevcut.length > 0) {
                    setLoading(false);
                    return goster('⚠️ Bu müşteri kodu zaten kayıtlı! Sistem mükerrer kaydı engelledi.', 'error');
                }
                const { error } = await supabase.from('b2_musteriler').insert([payload]);
                if (error) throw error;
                goster('✅ Yeni müşteri eklendi!');
                telegramBildirim(`👤 YENİ MÜŞTERİ KAYDI\nKod: ${payload.musteri_kodu}\nAd: ${payload.ad_soyad}\nTip: ${payload.musteri_tipi}`);
            }
            setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); yukle();
        } catch (e) { goster('Kayıt hatası: ' + e.message, 'error'); }
        finally { setLoading(false); setIslemdeId(null); }
    };

    // B-05: Geçmiş (Timeline) Fonksiyonları
    const timelineAc = async (m) => {
        setSeciliMusteri(m);
        setTimelineAcik(true);
        setTimelineLoglari([]);
        try {
            const { data } = await supabase.from('b0_sistem_loglari')
                .select('*')
                .eq('tablo_adi', 'b2_musteriler')
                .contains('eski_veri', { musteri_kodu: m.musteri_kodu })
                .order('created_at', { ascending: false });
            setTimelineLoglari(data || []);
        } catch (e) { goster('Geçmiş yüklenemedi.', 'error'); }
    };

    const notEkle = async () => {
        if (!yeniNot.trim() || !seciliMusteri) return;
        if (islemdeId === 'notEkle') return;
        setIslemdeId('notEkle');
        setNotEkleniyor(true);
        try {
            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b2_musteriler',
                islem_tipi: 'NOT',
                kullanici_adi: /** @type {any} */ (kullanici)?.label || 'Saha Yetkilisi',
                eski_veri: { musteri_kodu: seciliMusteri.musteri_kodu, mesaj: yeniNot }
            }]);
            setYeniNot('');
            timelineAc(seciliMusteri); // Listeyi yenile
            goster('Not eklendi.', 'success');
        } catch (e) { goster('Not eklenemedi.', 'error'); }
        finally { setNotEkleniyor(false); setIslemdeId(null); }
    };

    const duzenle = (m) => {
        setForm({
            musteri_kodu: m.musteri_kodu || '',
            ad_soyad: m.ad_soyad || '',
            ad_soyad_ar: m.ad_soyad_ar || '',
            musteri_tipi: m.musteri_tipi || 'bireysel',
            telefon: m.telefon || '',
            email: m.email || '',
            adres: m.adres || '',
            vergi_no: m.vergi_no || '',
            kara_liste: m.kara_liste || false,
            risk_limiti: m.risk_limiti || '',
            aktif: m.aktif !== false,
            segment: m.segment || 'B',
            notlar: m.notlar || '',
        });
        setDuzenleId(m.id);
        setFormAcik(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const karaListeDegistir = async (id, yeniDurum) => {
        if (islemdeId === 'kliste_' + id) return;
        setIslemdeId('kliste_' + id);
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b2_musteriler', 'UPDATE', { id, kara_liste: yeniDurum });
            return goster('⚡ Çevrimdışı: Kara liste değişikliği kuyruğa alındı.');
        }
        try {
            const { error } = await supabase.from('b2_musteriler').update({ kara_liste: yeniDurum }).eq('id', id);
            if (error) throw error;
            goster(yeniDurum ? '🚫 Müşteri kara listeye alındı!' : '✅ Kara listeden çıkarıldı.');
            if (yeniDurum) telegramBildirim(`🚫 KARA LİSTE UYARISI\nBir müşteri kara listeye alındı. ID: ${id}`);
            yukle();
        } catch (e) { goster('İşlem hatası: ' + e.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const sil = async (id, kod) => {
        if (islemdeId === 'sil_' + id) return;
        setIslemdeId('sil_' + id);
        if (/** @type {any} */ (kullanici)?.grup !== 'tam') {
            setIslemdeId(null); return goster('Müşteri silme yetkisi yalnızca Sistem Yöneticisine aittir.', 'error');
        }
        if (!confirm(`"${kod}" müşterisi silinsin mi? İlişkili siparişler etkilenebilir!`)) { setIslemdeId(null); return; }

        try {
            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b2_musteriler', islem_tipi: 'SILME',
                kullanici_adi: /** @type {any} */ (kullanici)?.label || 'Saha Yetkilisi',
                eski_veri: { musteri_kodu: kod, mesaj: 'Müşteri kaydı kalıcı olarak silindi.' }
            }]);
        } catch (e) { console.error('[SILME LOG HATASI]:', e?.message || e); }

        try {
            const { error } = await supabase.from('b2_musteriler').delete().eq('id', id);
            if (error) throw error;
            goster(`"${kod}" silindi.`); yukle();
        } catch (e) { goster('Silinemedi: ' + e.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    // Filtreleme
    const filtreli = musteriler.filter(m => {
        const tipOk = filtreTip === 'hepsi' || m.musteri_tipi === filtreTip;
        const karaOk = !filtreKara || m.kara_liste === true;
        const aramaOk = !aramaMetni || [m.musteri_kodu, m.ad_soyad, m.telefon, m.email].some(v => v?.toLowerCase()?.includes(aramaMetni.toLowerCase()));
        return tipOk && karaOk && aramaOk;
    });

    const istatistik = {
        toplam: musteriler.length,
        aktif: musteriler.filter(m => m.aktif !== false).length,
        karaListe: musteriler.filter(m => m.kara_liste === true).length,
        toptan: musteriler.filter(m => m.musteri_tipi === 'toptan').length,
        vip: musteriler.filter(m => (m.risk_limiti > 50000 || m.musteri_tipi === 'toptan' || ['VIP', 'A'].includes(m.segment))).length,
        potansiyel: musteriler.filter(m => m.segment === 'C' || !m.vergi_no).length
    };

    const isAR = lang === 'ar';
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #1e4a43', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: /** @type {any} */ ('border-box'), outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 5, textTransform: 'uppercase' };

    if (!yetkiliMi) return (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: 16, margin: '2rem' }}>
            <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#b91c1c', fontWeight: 900 }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
            <p style={{ color: '#7f1d1d', fontWeight: 600 }}>Müşteri verileri gizlidir. Yetkili giriş zorunludur.</p>
        </div>
    );

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            {/* BAŞLIK */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCheck size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', margin: 0 }}>
                            {isAR ? 'إدارة العملاء CRM' : 'Müşteriler CRM'}
                        </h1>
                        <p style={{ fontSize: '0.78rem', color: '#a7f3d0', margin: '2px 0 0', fontWeight: 600 }}>
                            {isAR ? 'تسجيل → تتبع → قائمة سوداء → حد المخاطر' : 'Kayıt → Takip → Kara Liste → Risk Limiti'}
                        </p>
                    </div>
                </div >
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => setLang(/** @type {any} */(lang === 'tr' ? 'ar' : 'tr'))}
                        style={{ padding: '6px 14px', background: '#173a34', border: '2px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                        {lang === 'tr' ? '🇸🇦 AR' : '🇹🇷 TR'}
                    </button>
                    <button onClick={yukle} disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#173a34', color: '#e2e8f0', border: '2px solid #e2e8f0', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                        <RefreshCw size={15} /> Yenile
                    </button>
                    <button onClick={() => { setForm(BOSH_FORM); setDuzenleId(null); setFormAcik(!formAcik); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                        <Plus size={18} /> {isAR ? 'إضافة عميل' : 'Yeni Müşteri'}
                    </button>
                </div>
            </div >

            {/* İSTATİSTİKLER */}
            < div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }
            }>
                <div className="premium-card hover-elevate glass-panel">
                    <div style={{ fontSize: '0.65rem', color: '#065f46', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>👥 Toplam Müşteri</div>
                    <div style={{ fontWeight: 900, color: '#047857', fontSize: '1.5rem' }}>{istatistik.toplam}</div>
                </div>
                <div className="premium-card hover-elevate glass-panel">
                    <div style={{ fontSize: '0.65rem', color: '#065f46', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>✅ Aktif Olanlar</div>
                    <div style={{ fontWeight: 900, color: '#059669', fontSize: '1.5rem' }}>{istatistik.aktif}</div>
                </div>
                <div className="premium-card hover-elevate glass-panel" style={{ borderLeft: istatistik.karaListe > 0 ? '4px solid #ef4444' : '' }}>
                    <div style={{ fontSize: '0.65rem', color: istatistik.karaListe > 0 ? '#991b1b' : '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>🚫 Kara Liste</div>
                    <div style={{ fontWeight: 900, color: istatistik.karaListe > 0 ? '#ef4444' : '#0f172a', fontSize: '1.5rem' }}>{istatistik.karaListe}</div>
                </div>
                <div className="premium-card hover-elevate glass-panel">
                    <div style={{ fontSize: '0.65rem', color: '#92400e', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>🏭 Toptan Alıcılar</div>
                    <div style={{ fontWeight: 900, color: '#d97706', fontSize: '1.5rem' }}>{istatistik.toptan}</div>
                </div>
                {/* [MS-02] RFM: VIP Segmentasyon */}
                <div className="premium-card hover-elevate glass-panel" style={{ background: '#fdf4ff', border: '1px solid #fbcfe8' }}>
                    <div style={{ fontSize: '0.65rem', color: '#9d174d', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>⭐️ VIP Müşteriler</div>
                    <div style={{ fontWeight: 900, color: '#831843', fontSize: '1.5rem' }}>{istatistik.vip}</div>
                </div>
                {/* [MS-02] Potansiyel (C Segment) */}
                <div className="premium-card hover-elevate glass-panel" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>🎯 Potansiyel</div>
                    <div style={{ fontWeight: 900, color: '#78350f', fontSize: '1.5rem' }}>{istatistik.potansiyel}</div>
                </div>
            </div >

            {/* MESAJ */}
            {
                mesaj.text && (
                    <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                        {mesaj.text}
                    </div>
                )
            }

            {/* OFFCANVAS DRAWER FORM */}
            <div className={`drawer-overlay ${formAcik ? 'open' : ''}`} onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }}></div>
            <div className={`drawer-panel ${formAcik ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h3 style={{ fontWeight: 900, color: duzenleId ? '#92400e' : '#047857', margin: 0, fontSize: '1.1rem' }}>
                        {duzenleId ? '✏️ Müşteri Profili Düzenle' : '👤 Yeni Müşteri Ekle'}
                    </h3>
                    <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a7f3d0' }}>×</button>
                </div >
                <div className="drawer-content">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={lbl}>Müşteri Kodu *</label>
                            <input maxLength={30} value={form.musteri_kodu} onChange={e => setForm({ ...form, musteri_kodu: e.target.value.toUpperCase() })} placeholder="MST-001" style={{ ...inp, fontWeight: 800, textTransform: 'uppercase', border: '2px solid #e2e8f0', background: '#0b1d1a' }} />
                        </div >
                        <div>
                            <label style={lbl}>Ad Soyad (TR) *</label>
                            <input maxLength={200} value={form.ad_soyad} onChange={e => setForm({ ...form, ad_soyad: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>الاسم (AR)</label>
                            <input maxLength={200} value={form.ad_soyad_ar} onChange={e => setForm({ ...form, ad_soyad_ar: e.target.value })} placeholder="الاسم الكامل" style={{ ...inp, direction: 'rtl' }} />
                        </div>
                        <div>
                            <label style={lbl}>Müşteri Tipi</label>
                            <select value={form.musteri_tipi} onChange={e => setForm({ ...form, musteri_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: '#122b27', fontWeight: 700, color: TIP_RENK[form.musteri_tipi] }}>
                                {MUSTERI_TIPLERI.map(t => <option key={t} value={t}>{TIP_LABEL[t]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Telefon</label>
                            <input maxLength={20} value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} placeholder="+90 555 000 0000" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>E-posta</label>
                            <input type="email" maxLength={100} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="musteri@firma.com" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Vergi No</label>
                            <input maxLength={50} value={form.vergi_no} onChange={e => setForm({ ...form, vergi_no: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Risk Limiti (₺)</label>
                            <input type="number" min="0" step="0.01" value={form.risk_limiti} onChange={e => setForm({ ...form, risk_limiti: e.target.value })} placeholder="0.00" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Adres</label>
                            <textarea maxLength={500} rows={3} value={form.adres} onChange={e => setForm({ ...form, adres: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: form.kara_liste ? '#dc2626' : '#374151', padding: '12px 16px', background: form.kara_liste ? '#fef2f2' : '#f8fafc', border: `2px solid ${form.kara_liste ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 12, width: '100%' }}>
                                <input type="checkbox" checked={form.kara_liste} onChange={e => setForm({ ...form, kara_liste: e.target.checked })} style={{ width: 18, height: 18, accentColor: '#ef4444' }} />
                                🚫 Kara Listeye Al
                            </label>
                        </div>
                    </div >
                </div >
                <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', background: '#0b1d1a', display: 'flex', gap: 12 }}>
                    <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }} style={{ flex: 1, padding: '12px', border: '2px solid #e2e8f0', borderRadius: 10, background: '#122b27', fontWeight: 800, cursor: 'pointer', color: '#a7f3d0' }}>İptal</button>
                    <button onClick={kaydet} disabled={loading} style={{ flex: 2, padding: '12px', background: loading ? '#94a3b8' : (duzenleId ? '#d97706' : '#047857'), color: 'white', border: 'none', borderRadius: 10, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(4,120,87,0.2)' }}>
                        {loading ? '...' : (duzenleId ? '✏️ Değişiklikleri Kaydet' : '✅ Müşteriyi Oluştur')}
                    </button>
                </div>
            </div>

            {/* ARAMA + FİLTRE */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 220px' }}>
                    <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                        placeholder={isAR ? 'البحث عن عميل...' : 'Müşteri Ara (kod, ad, telefon...)'}
                        style={{ ...inp, paddingLeft: 32 }} />
                </div>
                {['hepsi', ...MUSTERI_TIPLERI].map(t => (
                    <button key={t} onClick={() => setFiltreTip(t)}
                        style={{
                            padding: '6px 14px', borderRadius: 8, border: '2px solid', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem',
                            borderColor: filtreTip === t ? (TIP_RENK[t] || '#374151') : '#e5e7eb',
                            background: filtreTip === t ? (TIP_RENK[t] || '#374151') : 'white',
                            color: filtreTip === t ? 'white' : '#374151'
                        }}>
                        {t === 'hepsi' ? 'Tümü' : TIP_LABEL[t]}
                    </button>
                ))}
                <button onClick={() => setFiltreKara(!filtreKara)}
                    style={{
                        padding: '6px 14px', borderRadius: 8, border: '2px solid', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem',
                        borderColor: filtreKara ? '#ef4444' : '#e5e7eb', background: filtreKara ? '#ef4444' : 'white', color: filtreKara ? 'white' : '#374151'
                    }}>
                    🚫 Kara Liste
                </button>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>{filtreli.length} kayıt</span>
            </div>

            {/* LİSTE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {loading && filtreli.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: 700 }}>⏳ Yükleniyor...</div>
                )}
                {!loading && filtreli.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', background: '#0b1d1a', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                        <UserCheck size={40} style={{ color: '#e5e7eb', margin: '0 auto 0.5rem' }} />
                        <p style={{ color: '#94a3b8', fontWeight: 700 }}>
                            {aramaMetni ? `"${aramaMetni}" için sonuç bulunamadı.` : 'Henüz müşteri yok. "Yeni Müşteri" ile başlayın.'}
                        </p>
                    </div>
                )}
                {filtreli.map(m => (
                    <div key={m.id} className="premium-card hover-elevate" style={{ borderLeft: m.kara_liste ? '5px solid #ef4444' : (m.aktif === false ? '5px solid #e2e8f0' : `5px solid ${TIP_RENK[m.musteri_tipi] || '#cbd5e1'}`), padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: (TIP_RENK[m.musteri_tipi] || '#64748b') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                                {m.musteri_tipi === 'toptan' ? '🏭' : m.musteri_tipi === 'magaza' ? '🏪' : '👤'}
                            </div>
                            <div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#173a34', color: '#a7f3d0', padding: '2px 8px', borderRadius: 4 }}>{m.musteri_kodu}</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: 4, background: (TIP_RENK[m.musteri_tipi] || '#64748b') + '20', color: TIP_RENK[m.musteri_tipi] || '#64748b' }}>{TIP_LABEL[m.musteri_tipi]}</span>
                                    {m.kara_liste && <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: 4, border: '1px solid #fca5a5' }}>🚫 KARA LİSTE</span>}
                                    {m.aktif === false && <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#173a34', color: '#94a3b8', padding: '2px 8px', borderRadius: 4 }}> Pasif</span>}
                                    {
                                        m.segment && <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: 4, background: m.segment === 'A' ? '#fef3c7' : m.segment === 'B' ? '#eff6ff' : '#f1f5f9', color: m.segment === 'A' ? '#92400e' : m.segment === 'B' ? '#1d4ed8' : '#64748b', border: m.segment === 'A' ? '1px solid #fde68a' : '1px solid #bfdbfe' }}>
                                            {m.segment === 'A' ? ' VIP' : m.segment === 'B' ? ' Aktif' : ' Standart'}
                                        </span>
                                    }
                                </div >
                                <div style={{ fontWeight: 900, color: 'white', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>{m.ad_soyad}</div>
                                {m.ad_soyad_ar && <div style={{ fontSize: '0.85rem', color: '#a7f3d0', direction: 'rtl', fontWeight: 700 }}>{m.ad_soyad_ar}</div>}
                                <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                    {m.telefon && <span style={{ fontSize: '0.75rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {m.telefon}</span>}
                                    {m.email && <span style={{ fontSize: '0.75rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} /> {m.email}</span>}
                                    {m.risk_limiti && <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 800, padding: '2px 6px', background: '#fffbeb', borderRadius: 4 }}>💳 Risk: ₺{parseFloat(m.risk_limiti).toFixed(0)}</span>}
                                    {/* MS-03 Cari Bakiye Mockup */}
                                    <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 800, padding: '2px 6px', background: '#ecfdf5', borderRadius: 4, border: '1px solid #10b981' }}>
                                        💵 MS-03 Bakiye: Hesaplanıyor...
                                    </span>
                                </div>
                            </div>
                        </div >
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                            <Link href={`/siparisler?musteri_kodu=${m.musteri_kodu}`} style={{ textDecoration: 'none' }}>
                                <button title='Sipariş Geçmişi (MUS-01)' style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                                    📋 Siparişler
                                </button>
                            </Link>
                            <button onClick={() => timelineAc(m)} title='İletişim Geçmişi (B-05)' style={{ background: '#0b1d1a', border: '1px solid #1e4a43', color: '#a7f3d0', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                                <History size={14} /> Geçmiş
                            </button>
                            <button onClick={() => karaListeDegistir(m.id, !m.kara_liste)} title={m.kara_liste ? 'Kara listeden çıkar' : 'Kara listeye al'}
                                style={{ background: m.kara_liste ? '#ecfdf5' : '#fef2f2', border: `1px solid ${m.kara_liste ? '#10b981' : '#fca5a5'}`, color: m.kara_liste ? '#059669' : '#ef4444', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                                {m.kara_liste ? <><ShieldCheck size={14} /> Aktifleştir</> : <><ShieldOff size={14} /> Kara Liste</>}
                            </button>
                            <button onClick={() => duzenle(m)} style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#d97706', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                                <Edit3 size={14} /> Düzenle
                            </button>
                            <button disabled={islemdeId === 'sil_' + m.id} onClick={() => sil(m.id, m.musteri_kodu)} style={{ background: '#173a34', border: 'none', color: '#ef4444', padding: '8px', borderRadius: 8, cursor: islemdeId === 'sil_' + m.id ? 'wait' : 'pointer', transition: 'all 0.2s', opacity: islemdeId === 'sil_' + m.id ? 0.5 : 1 }} onMouseEnter={e => { if (islemdeId !== 'sil_' + m.id) e.currentTarget.style.background = '#fee2e2' }} onMouseLeave={e => { if (islemdeId !== 'sil_' + m.id) e.currentTarget.style.background = '#f1f5f9' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div >
                ))}
            </div >

            {/* B-05: İLETİŞİM GEÇMİŞİ (TIMELINE) MODALI */}
            < SilBastanModal acik={timelineAcik} onClose={() => setTimelineAcik(false)} title={`İletişim Geçmişi / Zaman Tüneli — ${seciliMusteri?.ad_soyad}`}>
                <div style={{ background: '#122b27', padding: '1.5rem', borderRadius: 14 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input value={yeniNot} onChange={e => setYeniNot(e.target.value)} placeholder="Yeni görüşme notu, toplantı özeti veya hatırlatma..." style={{ ...inp, flex: 1 }} onKeyDown={e => e.key === 'Enter' && notEkle()} />
                        <button onClick={notEkle} disabled={notEkleniyor} style={{ padding: '0 20px', background: notEkleniyor ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Ekle</button>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {timelineLoglari.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontWeight: 600 }}>Henüz bir iletişim geçmişi kaydı bulunmuyor.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 15, top: 10, bottom: 10, width: 2, background: '#e2e8f0', zIndex: 0 }}></div>
                                {timelineLoglari.map(log => (
                                    <div key={log.id} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 16, background: log.islem_tipi === 'NOT' ? '#ecfdf5' : '#f8fafc', border: `2px solid ${log.islem_tipi === 'NOT' ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                                            {log.islem_tipi === 'NOT' ? '📝' : '⚙️'}
                                        </div>
                                        <div style={{ flex: 1, background: log.islem_tipi === 'NOT' ? '#f0fdf4' : 'white', border: `1px solid ${log.islem_tipi === 'NOT' ? '#bbf7d0' : '#e2e8f0'}`, padding: '12px 16px', borderRadius: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857' }}>{log.kullanici_adi}</span>
                                                <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, lineHeight: 1.5 }}>
                                                {log.islem_tipi === 'NOT' ? log.eski_veri?.mesaj : `${log.islem_tipi} işlemi gerçekleştirildi. ${log.eski_veri?.mesaj || ''}`}
                                            </div>
                                        </div>
                                    </div >
                                ))}
                            </div >
                        )}
                    </div >
                </div >
            </SilBastanModal >

            {/* GLOBAL FAB (FLOATING ACTION BUTTON) */}
            < button className="fab-button" onClick={() => { setForm(BOSH_FORM); setDuzenleId(null); setFormAcik(true); }} title={isAR ? 'إضافة عميل' : 'Yeni Müşteri Ekle'} >
                <Plus size={28} />
            </button >
        </div >
    );
}
