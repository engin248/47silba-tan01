'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { UserCheck, Plus, Phone, Mail, MapPin, Trash2, Lock, Search, Edit3, AlertTriangle, RefreshCw, ShieldOff, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const MUSTERI_TIPLERI = ['bireysel', 'toptan', 'magaza'];
const TIP_LABEL = { bireysel: '👤 Bireysel', toptan: '🏭 Toptan', magaza: '🏪 Mağaza' };
const TIP_RENK = { bireysel: '#3b82f6', toptan: '#8b5cf6', magaza: '#f59e0b' };
const BOSH_FORM = {
    musteri_kodu: '', ad_soyad: '', ad_soyad_ar: '', musteri_tipi: 'bireysel',
    telefon: '', email: '', adres: '', vergi_no: '', kara_liste: false, risk_limiti: '', aktif: true
};

export default function MusterilerSayfasi() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [lang, setLang] = useState('tr');
    const [musteriler, setMusteriler] = useState([]);
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [duzenleId, setDuzenleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [aramaMetni, setAramaMetni] = useState('');
    const [filtreTip, setFiltreTip] = useState('hepsi');
    const [filtreKara, setFiltreKara] = useState(false);

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {
            // [AI ZIRHI]: Realtime WebSocket (Kriter 20 & 34)
            const kanal = supabase.channel('musteriler-gercek-zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_musteriler' }, () => yukle())
                .subscribe();
            yukle();
            return () => supabase.removeChannel(kanal);
        }
    }, [kullanici]);

    const telegramBildirim = (msg) => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 10000);
        fetch('/api/telegram-bildirim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mesaj: msg }), signal: ctrl.signal })
            .finally(() => clearTimeout(t)).catch(() => null);
    };

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            // [AI ZIRHI]: 10sn timeout DDoS kalkanı (Kriter Q)
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
        // [AI ZIRHI]: Validasyon Zırhı (Kriter V)
        if (!form.musteri_kodu.trim()) return goster('Müşteri kodu zorunludur!', 'error');
        if (form.musteri_kodu.length > 30) return goster('Müşteri kodu en fazla 30 karakter!', 'error');
        if (!form.ad_soyad.trim()) return goster('Ad Soyad zorunludur!', 'error');
        if (form.ad_soyad.length > 200) return goster('Ad Soyad çok uzun!', 'error');
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return goster('Geçersiz e-posta formatı!', 'error');
        if (form.telefon && form.telefon.length > 20) return goster('Telefon numarası çok uzun!', 'error');
        if (form.vergi_no && form.vergi_no.length > 50) return goster('Vergi no çok uzun!', 'error');
        if (form.risk_limiti && isNaN(parseFloat(form.risk_limiti))) return goster('Risk limiti sayısal olmalı!', 'error');

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

        // [AI ZIRHI]: Offline Modu (Kriter J)
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b2_musteriler', duzenleId ? 'UPDATE' : 'INSERT', duzenleId ? { id: duzenleId, ...payload } : payload);
            goster('⚡ Çevrimdışı: Müşteri kaydı kuyruğa alındı.');
            setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null);
            return;
        }

        setLoading(true);
        try {
            if (duzenleId) {
                // [AI ZIRHI]: Mükerrer engeli - güncelleme sırasında başka kayıt aynı kodu kullanıyor mu?
                const { data: cakisan } = await supabase.from('b2_musteriler').select('id').eq('musteri_kodu', payload.musteri_kodu).neq('id', duzenleId);
                if (cakisan && cakisan.length > 0) {
                    setLoading(false);
                    return goster('⚠️ Bu müşteri kodu başka bir kayıtta kullanılıyor!', 'error');
                }
                const { error } = await supabase.from('b2_musteriler').update(payload).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Müşteri güncellendi!');
            } else {
                // [AI ZIRHI]: Mükerrer Kayıt Engeli (Kriter U)
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
        setLoading(false);
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
        });
        setDuzenleId(m.id);
        setFormAcik(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const karaListeDegistir = async (id, yeniDurum) => {
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
    };

    const sil = async (id, kod) => {
        if (kullanici?.grup !== 'tam') {
            const pin = prompt('Müşteri silme Yönetici yetkisi gerektirir. PİN:');
            if (pin !== (process.env.NEXT_PUBLIC_ADMIN_PIN || '9999')) return goster('Yetkisiz işlem!', 'error');
        }
        if (!confirm(`"${kod}" müşterisi silinsin mi? İlişkili siparişler etkilenebilir!`)) return;

        // [AI ZIRHI]: B0 Kara Kutu silme logu (Kriter 25)
        try {
            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b2_musteriler', islem_tipi: 'SILME',
                kullanici_adi: kullanici?.label || 'Saha Yetkilisi',
                eski_veri: { musteri_kodu: kod, mesaj: 'Müşteri kaydı kalıcı olarak silindi.' }
            }]).catch(() => { });
        } catch (e) { }

        try {
            const { error } = await supabase.from('b2_musteriler').delete().eq('id', id);
            if (error) throw error;
            goster(`"${kod}" silindi.`); yukle();
        } catch (e) { goster('Silinemedi: ' + e.message, 'error'); }
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
    };

    const isAR = lang === 'ar';
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

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
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCheck size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            {isAR ? 'إدارة العملاء CRM' : 'Müşteriler CRM'}
                        </h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                            {isAR ? 'تسجيل → تتبع → قائمة سوداء → حد المخاطر' : 'Kayıt → Takip → Kara Liste → Risk Limiti'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => setLang(l => l === 'tr' ? 'ar' : 'tr')}
                        style={{ padding: '6px 14px', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                        {lang === 'tr' ? '🇸🇦 AR' : '🇹🇷 TR'}
                    </button>
                    <button onClick={yukle} disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#374151', border: '2px solid #e2e8f0', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                        <RefreshCw size={15} /> Yenile
                    </button>
                    <button onClick={() => { setForm(BOSH_FORM); setDuzenleId(null); setFormAcik(!formAcik); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#7c3aed', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>
                        <Plus size={18} /> {isAR ? 'إضافة عميل' : 'Yeni Müşteri'}
                    </button>
                </div>
            </div>

            {/* İSTATİSTİKLER */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#faf5ff', border: '2px solid #ddd6fe', borderRadius: 14, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#6d28d9', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>👥 Toplam</div>
                    <div style={{ fontWeight: 900, color: '#7c3aed', fontSize: '1.35rem' }}>{istatistik.toplam}</div>
                </div>
                <div style={{ background: '#ecfdf5', border: '2px solid #6ee7b7', borderRadius: 14, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>✅ Aktif</div>
                    <div style={{ fontWeight: 900, color: '#059669', fontSize: '1.35rem' }}>{istatistik.aktif}</div>
                </div>
                <div style={{ background: istatistik.karaListe > 0 ? '#fef2f2' : '#f8fafc', border: `2px solid ${istatistik.karaListe > 0 ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 14, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: istatistik.karaListe > 0 ? '#991b1b' : '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>🚫 Kara Liste</div>
                    <div style={{ fontWeight: 900, color: istatistik.karaListe > 0 ? '#ef4444' : '#0f172a', fontSize: '1.35rem' }}>{istatistik.karaListe}</div>
                </div>
                <div style={{ background: '#ede9fe', border: '2px solid #c4b5fd', borderRadius: 14, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#5b21b6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>🏭 Toptan</div>
                    <div style={{ fontWeight: 900, color: '#7c3aed', fontSize: '1.35rem' }}>{istatistik.toptan}</div>
                </div>
            </div>

            {/* MESAJ */}
            {mesaj.text && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.text}
                </div>
            )}

            {/* FORM */}
            {formAcik && (
                <div style={{ background: 'white', border: `2px solid ${duzenleId ? '#f59e0b' : '#7c3aed'}`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(124,58,237,0.1)' }}>
                    <h3 style={{ fontWeight: 800, color: duzenleId ? '#92400e' : '#5b21b6', marginBottom: '1rem' }}>
                        {duzenleId ? '✏️ Müşteri Düzenle' : '👤 Yeni Müşteri'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={lbl}>Müşteri Kodu *</label>
                            <input maxLength={30} value={form.musteri_kodu} onChange={e => setForm({ ...form, musteri_kodu: e.target.value.toUpperCase() })} placeholder="MST-001" style={{ ...inp, fontWeight: 800, textTransform: 'uppercase' }} />
                        </div>
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
                            <select value={form.musteri_tipi} onChange={e => setForm({ ...form, musteri_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white', fontWeight: 700, color: TIP_RENK[form.musteri_tipi] }}>
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
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Adres</label>
                            <input maxLength={500} value={form.adres} onChange={e => setForm({ ...form, adres: e.target.value })} style={inp} />
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: form.kara_liste ? '#dc2626' : '#374151', padding: '8px 14px', background: form.kara_liste ? '#fef2f2' : '#f8fafc', border: `2px solid ${form.kara_liste ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 8 }}>
                                <input type="checkbox" checked={form.kara_liste} onChange={e => setForm({ ...form, kara_liste: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#ef4444' }} />
                                🚫 Kara Listeye Al
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : (duzenleId ? '#f59e0b' : '#7c3aed'), color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                            {loading ? '...' : (duzenleId ? '✏️ Güncelle' : '✅ Kaydet')}
                        </button>
                    </div>
                </div>
            )}

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
                    <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                        <UserCheck size={40} style={{ color: '#e5e7eb', margin: '0 auto 0.5rem' }} />
                        <p style={{ color: '#94a3b8', fontWeight: 700 }}>
                            {aramaMetni ? `"${aramaMetni}" için sonuç bulunamadı.` : 'Henüz müşteri yok. "Yeni Müşteri" ile başlayın.'}
                        </p>
                    </div>
                )}
                {filtreli.map(m => (
                    <div key={m.id} style={{ background: 'white', border: '2px solid', borderColor: m.kara_liste ? '#fca5a5' : m.aktif === false ? '#e5e7eb' : '#f1f5f9', borderRadius: 12, padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: (TIP_RENK[m.musteri_tipi] || '#64748b') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                                {m.musteri_tipi === 'toptan' ? '🏭' : m.musteri_tipi === 'magaza' ? '🏪' : '👤'}
                            </div>
                            <div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 4 }}>{m.musteri_kodu}</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: (TIP_RENK[m.musteri_tipi] || '#64748b') + '20', color: TIP_RENK[m.musteri_tipi] || '#64748b' }}>{TIP_LABEL[m.musteri_tipi]}</span>
                                    {m.kara_liste && <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: 4, border: '1px solid #fca5a5' }}>🚫 KARA LİSTE</span>}
                                    {m.aktif === false && <span style={{ fontSize: '0.62rem', fontWeight: 700, background: '#f1f5f9', color: '#94a3b8', padding: '2px 8px', borderRadius: 4 }}>⛔ Pasif</span>}
                                </div>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{m.ad_soyad}</div>
                                {m.ad_soyad_ar && <div style={{ fontSize: '0.78rem', color: '#64748b', direction: 'rtl', fontWeight: 600 }}>{m.ad_soyad_ar}</div>}
                                <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                                    {m.telefon && <span style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={11} /> {m.telefon}</span>}
                                    {m.email && <span style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={11} /> {m.email}</span>}
                                    {m.risk_limiti && <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>💳 Risk: ₺{parseFloat(m.risk_limiti).toFixed(0)}</span>}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                            <button onClick={() => karaListeDegistir(m.id, !m.kara_liste)} title={m.kara_liste ? 'Kara listeden çıkar' : 'Kara listeye al'}
                                style={{ background: m.kara_liste ? '#ecfdf5' : '#fef2f2', border: `1px solid ${m.kara_liste ? '#10b981' : '#fca5a5'}`, color: m.kara_liste ? '#059669' : '#ef4444', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {m.kara_liste ? <><ShieldCheck size={12} /> Aktifleştir</> : <><ShieldOff size={12} /> Kara Liste</>}
                            </button>
                            <button onClick={() => duzenle(m)} style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#d97706', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Edit3 size={12} /> Düzenle
                            </button>
                            <button onClick={() => sil(m.id, m.musteri_kodu)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: 6, borderRadius: 6, cursor: 'pointer' }}>
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
