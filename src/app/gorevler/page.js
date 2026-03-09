'use client';
import { useState, useEffect } from 'react';
import { ClipboardList, Plus, CheckCircle2, AlertTriangle, Trash2, User, Clock, Flag, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

const ONCELIK = ['dusuk', 'normal', 'yuksek', 'kritik'];
const ONCELIK_RENK = { dusuk: '#64748b', normal: '#3b82f6', yuksek: '#f59e0b', kritik: '#ef4444' };
const ONCELIK_LABEL = { dusuk: '⬇️ Düşük', normal: '➡️ Normal', yuksek: '⬆️ Yüksek', kritik: '🔥 Kritik' };
const DURUM_LABEL = { bekliyor: '⏳ Bekliyor', devam: '⚙️ Devam', tamamlandi: '✅ Tamam', iptal: '❌ İptal' };
const DURUM_RENK = { bekliyor: '#f59e0b', devam: '#3b82f6', tamamlandi: '#10b981', iptal: '#ef4444' };
const BOSH = { baslik: '', aciklama: '', atanan_kisi: '', son_tarih: '', oncelik: 'normal', modul: 'genel' };

const formatTarih = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };

export default function GorevlerSayfasi() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const { kullanici, sayfaErisim } = useAuth();
    const erisim = sayfaErisim('/gorevler');
    const [gorevler, setGorevler] = useState([]);
    const [form, setForm] = useState(BOSH);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtreOncelik, setFiltreOncelik] = useState('hepsi');
    const [filtreDurum, setFiltreDurum] = useState('hepsi');
    const [duzenleId, setDuzenleId] = useState(null);
    const [aramaMetni, setAramaMetni] = useState('');

    useEffect(() => {
        // [AI ZIRHI]: Realtime Websocket (Kriter 20 & 34)
        const kanal = supabase.channel('islem-gercek-zamanli-ai')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })
            .subscribe();

        yukle();

        return () => { supabase.removeChannel(kanal); };
    }, []);

    const telegramBildirim = (mesaj) => {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 10000);
        fetch('/api/telegram-bildirim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj }),
            signal: controller.signal
        }).finally(() => clearTimeout(tId)).catch(() => null);
    };

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 4000); };

    const timeoutPromise = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 sn)')), 10000));

    const yukle = async () => {
        setLoading(true);
        try {
            const req = supabase.from('b1_gorevler').select('*').order('created_at', { ascending: false }).limit(200);
            const res = await Promise.race([req, timeoutPromise()]);

            if (res.error && res.error.code === '42P01') {
                goster('⚠️ b1_gorevler tablosu Supabase\'de yok. SQL Editor\'dan oluşturun.', 'error');
            } else if (res.error) { throw res.error; }
            else if (res.data) { setGorevler(res.data); }
        } catch (error) { goster('Görevler Yüklenemedi: ' + error.message, 'error'); }
        setLoading(false);
    };

    const kaydet = async () => {
        if (!form.baslik.trim()) return goster('Başlık zorunlu!', 'error');
        if (form.baslik.length > 100) return goster('Başlık çok uzun!', 'error');
        if (form.aciklama && form.aciklama.length > 500) return goster('Açıklama çok uzun!', 'error');

        setLoading(true);
        try {
            // ─── KÖR NOKTA 5: ИNTERNET YOKKEN YAPILAN İŞLEMİ KURTAR ───
            if (!navigator.onLine) {
                const cevrimeVerisi = {
                    baslik: form.baslik.trim(),
                    aciklama: form.aciklama.trim() || null,
                    atanan_kisi: form.atanan_kisi.trim() || null,
                    bitis_tarihi: form.son_tarih || null,
                    oncelik: form.oncelik,
                    durum: 'bekliyor',
                    created_at: new Date().toISOString()
                };

                if (duzenleId) {
                    cevrimeVerisi.id = duzenleId;
                    await cevrimeKuyrugaAl('b1_gorevler', 'UPDATE', cevrimeVerisi);
                    goster('⚡ Çevrimdışı: Düzenleme tablet hafızasına alındı!');
                } else {
                    await cevrimeKuyrugaAl('b1_gorevler', 'INSERT', cevrimeVerisi);
                    goster('⚡ Çevrimdışı: Yeni görev tablet hafızasına alındı!');
                }

                setForm(BOSH); setFormAcik(false); setDuzenleId(null);
                setLoading(false);
                return;
            }

            if (duzenleId) {
                const { error } = await supabase.from('b1_gorevler').update({
                    baslik: form.baslik.trim(), aciklama: form.aciklama.trim() || null,
                    atanan_kisi: form.atanan_kisi.trim() || null, bitis_tarihi: form.son_tarih || null,
                    oncelik: form.oncelik, updated_at: new Date().toISOString(),
                }).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Görev güncellendi!');
                setForm(BOSH); setFormAcik(false); setDuzenleId(null); yukle();
            } else {
                // 🛑 U Kriteri: Mükerrer (Aynı başlıkla 2. kez) Görev Engeli
                const { data: mevcutGorev } = await supabase.from('b1_gorevler')
                    .select('id').ilike('baslik', form.baslik.trim()).eq('durum', 'bekliyor');

                if (mevcutGorev && mevcutGorev.length > 0) {
                    setLoading(false);
                    return goster('⚠️ Bu başlıkta bekleyen bir görev zaten var! Çift kayıt engellendi.', 'error');
                }

                const { error } = await supabase.from('b1_gorevler').insert([{
                    baslik: form.baslik.trim(), aciklama: form.aciklama.trim() || null,
                    atanan_kisi: form.atanan_kisi.trim() || null, bitis_tarihi: form.son_tarih || null,
                    oncelik: form.oncelik, durum: 'bekliyor'
                }]);
                if (error) throw error;
                goster('✅ Görev oluşturuldu!');

                if (form.oncelik === 'kritik') {
                    telegramBildirim(`🔥 KRİTİK GÖREV!\nBaşlık: ${form.baslik}\nAtanan: ${form.atanan_kisi || 'Herkes'}\nACİL MÜDAHALE BEKLENİYOR.`);
                }
                setForm(BOSH); setFormAcik(false); yukle();
            }
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, durum, baslik) => {
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_gorevler', 'UPDATE', { id, durum });
            return goster('⚡ Çevrimdışı: Durum değişikliği tablet hafızasına kilitlendi.');
        }

        try {
            const { error } = await supabase.from('b1_gorevler').update({ durum }).eq('id', id);
            if (error) throw error;
            yukle(); goster('Durum güncellendi');
            if (durum === 'tamamlandi') telegramBildirim(`✅ GÖREV TAMAMLANDI!\n${baslik}`);
        } catch (error) { goster('Durum Hatası: ' + error.message, 'error'); }
    };

    const sil = async (id) => {
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_gorevler', 'DELETE', { id });
            return goster('⚡ Çevrimdışı: Silme komutu internet gelince işlenecek.');
        }

        if (!kullanici || kullanici.grup !== 'tam') {
            const adminPin = prompt('Bu görevi silmek için Yönetici PİN kodunu girin:');
            const dogruPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (adminPin !== dogruPin) return goster('Yetkisiz İşlem!', 'error');
        }
        if (!confirm('Görev silinsin mi?')) return;
        try {

            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String('b1_gorevler').replace(/['"]/g, ''),
                    islem_tipi: 'SILME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
                }]).catch(() => { });
            } catch (e) { }

            const { error } = await supabase.from('b1_gorevler').delete().eq('id', id);
            if (error) throw error;
            yukle(); goster('Silindi');
        } catch (error) { goster('Silinemedi: ' + error.message, 'error'); }
    };

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    const filtreli = gorevler.filter(g => {
        const oncelikOk = filtreOncelik === 'hepsi' || g.oncelik === filtreOncelik;
        const durumOk = filtreDurum === 'hepsi' || g.durum === filtreDurum;
        const aramaOk = !aramaMetni || [
            g.baslik, g.aciklama, g.atanan_kisi
        ].some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase()));
        return oncelikOk && durumOk && aramaOk;
    });

    const istatistik = {
        toplam: gorevler.length,
        bekliyor: gorevler.filter(g => g.durum === 'bekliyor').length,
        devam: gorevler.filter(g => g.durum === 'devam').length,
        kritik: gorevler.filter(g => g.oncelik === 'kritik' && g.durum !== 'tamamlandi').length,
    };

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{isAR ? 'تتبع المهام' : 'Görev Takibi'}</h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>{isAR ? 'تعيين المهام · تحديد الأولوية · التتبع' : 'Görev ata · öncelik belirle · takip et'}</p>
                    </div>
                </div>
                {erisim === 'full' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setFormAcik(!formAcik)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                            <Plus size={18} /> Yeni Görev
                        </button>
                        {/* CC Kriteri Otomatik Rota (M16 Raporlara Geçiş) */}
                        <a href="/raporlar" style={{ textDecoration: 'none' }}>
                            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#d97706', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(217,119,6,0.35)' }}>
                                📊 Raporlar (M16)
                            </button>
                        </a>
                    </div>
                )}
            </div>

            {/* İstatistik */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam', val: istatistik.toplam, color: '#047857', bg: '#ecfdf5' },
                    { label: '⏳ Bekliyor', val: istatistik.bekliyor, color: '#d97706', bg: '#fffbeb' },
                    { label: '⚙️ Devam', val: istatistik.devam, color: '#2563eb', bg: '#eff6ff' },
                    { label: '🔥 Kritik', val: istatistik.kritik, color: '#dc2626', bg: '#fef2f2' },
                ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {mesaj.text && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />} {mesaj.text}
                </div>
            )}

            {/* Form */}
            {formAcik && erisim === 'full' && (
                <div style={{ background: 'white', border: '2px solid #047857', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.10)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem', fontSize: '1rem' }}>📋 Yeni Görev</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Görev Başlığı *</label>
                            <input maxLength={100} value={form.baslik} onChange={e => setForm({ ...form, baslik: e.target.value })} placeholder="Görev ne?" style={inp} />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Açıklama</label>
                            <textarea maxLength={500} rows={2} value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
                        </div>
                        <div>
                            <label style={lbl}>Atanan Kişi</label>
                            <input maxLength={50} value={form.atanan_kisi} onChange={e => setForm({ ...form, atanan_kisi: e.target.value })} placeholder="Ad Soyad" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Son Tarih</label>
                            <input type="datetime-local" value={form.son_tarih} onChange={e => setForm({ ...form, son_tarih: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Öncelik</label>
                            <select value={form.oncelik} onChange={e => setForm({ ...form, oncelik: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                {ONCELIK.map(o => <option key={o} value={o}>{ONCELIK_LABEL[o]}</option>)}
                            </select>
                        </div>
                        {/* <div style={{ display: 'none' }}>
                            <label style={lbl}>Modül</label>
                            <input maxLength={50} value={form.modul} onChange={e => setForm({ ...form, modul: e.target.value })} placeholder="genel / kesim / kumas..." style={inp} />
                        </div> */}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH); setFormAcik(false); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{loading ? '...' : 'Görev Oluştur'}</button>
                    </div>
                </div>
            )}

            {/* Arama + Filtreler */}
            <div style={{ position: 'relative', marginBottom: '0.75rem', maxWidth: 420 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                    placeholder="Başlık, kişi veya açıklama ara..."
                    style={inp} />
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['hepsi', ...ONCELIK].map(o => (
                    <button key={o} onClick={() => setFiltreOncelik(o)}
                        style={{ padding: '5px 12px', border: '2px solid', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', borderColor: filtreOncelik === o ? (ONCELIK_RENK[o] || '#8b5cf6') : '#e5e7eb', background: filtreOncelik === o ? (ONCELIK_RENK[o] || '#8b5cf6') : 'white', color: filtreOncelik === o ? 'white' : '#374151' }}>
                        {o === 'hepsi' ? 'Tümü' : ONCELIK_LABEL[o]}
                    </button>
                ))}
                <div style={{ width: 1, background: '#e5e7eb', margin: '0 4px' }} />
                {['hepsi', 'bekliyor', 'devam', 'tamamlandi'].map(d => (
                    <button key={d} onClick={() => setFiltreDurum(d)}
                        style={{ padding: '5px 12px', border: '2px solid', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', borderColor: filtreDurum === d ? (DURUM_RENK[d] || '#8b5cf6') : '#e5e7eb', background: filtreDurum === d ? (DURUM_RENK[d] || '#8b5cf6') : 'white', color: filtreDurum === d ? 'white' : '#374151' }}>
                        {d === 'hepsi' ? 'Tüm Durumlar' : DURUM_LABEL[d]}
                    </button>
                ))}
            </div>

            {/* Liste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {filtreli.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                        <ClipboardList size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                        <p style={{ color: '#94a3b8', fontWeight: 700 }}>Görev bulunamadı.</p>
                    </div>
                )}
                {filtreli.map(g => (
                    <div key={g.id} style={{ background: 'white', border: '2px solid', borderColor: g.durum === 'tamamlandi' ? '#d1fae5' : g.oncelik === 'kritik' ? '#fee2e2' : '#f1f5f9', borderRadius: 14, padding: '1rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <div style={{ display: 'flex', gap: 6, marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: `${ONCELIK_RENK[g.oncelik]}20`, color: ONCELIK_RENK[g.oncelik] }}>{ONCELIK_LABEL[g.oncelik]}</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: `${DURUM_RENK[g.durum]}20`, color: DURUM_RENK[g.durum] }}>{DURUM_LABEL[g.durum]}</span>
                                    {g.modul && g.modul !== 'genel' && <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', color: '#64748b' }}>📁 {g.modul}</span>}
                                </div>
                                <h3 style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '0.95rem' }}>{g.baslik}</h3>
                                {g.aciklama && <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0' }}>{g.aciklama}</p>}
                                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                                    {g.atanan_kisi && <span><User size={10} style={{ display: 'inline' }} /> {g.atanan_kisi}</span>}
                                    {g.bitis_tarihi && <span><Flag size={10} style={{ display: 'inline' }} /> {formatTarih(g.bitis_tarihi)}</span>}
                                    <span><Clock size={10} style={{ display: 'inline' }} /> {formatTarih(g.created_at)}</span>
                                </div>
                            </div>
                            {erisim === 'full' && (
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                                    <button onClick={() => { setForm({ baslik: g.baslik, aciklama: g.aciklama || '', atanan_kisi: g.atanan_kisi || '', son_tarih: g.bitis_tarihi ? g.bitis_tarihi.slice(0, 16) : '', oncelik: g.oncelik, modul: g.modul || 'genel' }); setDuzenleId(g.id); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: '#eff6ff', border: '1px solid #3b82f6', color: '#2563eb', padding: '5px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}>✏️ Düzenle</button>
                                    {g.durum === 'bekliyor' && <button onClick={() => durumGuncelle(g.id, 'devam', g.baslik)} style={{ background: '#eff6ff', border: '1px solid #3b82f6', color: '#2563eb', padding: '5px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}>⚙️ Başlat</button>}
                                    {g.durum === 'devam' && <button onClick={() => durumGuncelle(g.id, 'tamamlandi', g.baslik)} style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#059669', padding: '5px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}>✅ Tamam</button>}
                                    <button onClick={() => sil(g.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={13} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
