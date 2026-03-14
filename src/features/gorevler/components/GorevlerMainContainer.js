'use client';
/**
 * features/gorevler/components/GorevlerMainContainer.js
 * B-06: Sürükle-bırak Kanban Board eklendi (HTML5 Drag-and-Drop tabanlı)
 */
import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Plus, CheckCircle2, AlertTriangle, Trash2, LayoutGrid, List } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatTarih, telegramBildirim } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

const ONCELIK = ['dusuk', 'normal', 'yuksek', 'kritik'];
const ONCELIK_RENK = { dusuk: '#64748b', normal: '#3b82f6', yuksek: '#f59e0b', kritik: '#ef4444' };
const ONCELIK_LABEL = { dusuk: '⬇️ Düşük', normal: '➡️ Normal', yuksek: '⬆️ Yüksek', kritik: '🔥 Kritik' };
const DURUM_LABEL = { bekliyor: '⏳ Bekliyor', devam: '⚙️ Devam', tamamlandi: '✅ Tamam', iptal: '❌ İptal' };
const DURUM_RENK = { bekliyor: '#f59e0b', devam: '#3b82f6', tamamlandi: '#10b981', iptal: '#ef4444' };
const KANBAN_SUTUNLAR = [
    { key: 'bekliyor', label: '⏳ Bekliyor', renk: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    { key: 'devam', label: '⚙️ Devam Ediyor', renk: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    { key: 'tamamlandi', label: '✅ Tamamlandı', renk: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
    { key: 'iptal', label: '❌ İptal', renk: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
];
const BOSH = { baslik: '', aciklama: '', atanan_kisi: '', son_tarih: '', oncelik: 'normal', modul: 'genel' };

export default function GorevlerMainContainer() {
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
    const [duzenleId, setDuzenleId] = useState(null);
    const [aramaMetni, setAramaMetni] = useState('');
    const [gorunumModu, setGorunumModu] = useState('kanban');
    const [dragOverKey, setDragOverKey] = useState(null);
    const dragGorevId = useRef(null);

    useEffect(() => {
        const kanal = supabase.channel('gorevler-rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_gorevler' }, () => yukle())
            .subscribe();
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, []);

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı)

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 4000);
    };

    const yukle = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('b1_gorevler').select('*').order('created_at', { ascending: false }).limit(200);
            if (error && error.code === '42P01') { goster('⚠️ b1_gorevler tablosu Supabase\'de yok.', 'error'); }
            else if (error) { throw error; }
            else if (data) { setGorevler(data); }
        } catch (err) { goster('Görevler Yüklenemedi: ' + err.message, 'error'); }
        setLoading(false);
    };

    const kaydet = async () => {
        if (!form.baslik.trim()) return goster('Başlık zorunlu!', 'error');
        if (form.baslik.length > 100) return goster('Başlık çok uzun!', 'error');
        if (form.aciklama && form.aciklama.length > 500) return goster('Açıklama çok uzun!', 'error');
        setLoading(true);
        try {
            if (!navigator.onLine) {
                await cevrimeKuyrugaAl('b1_gorevler', duzenleId ? 'UPDATE' : 'INSERT', { ...form, id: duzenleId, durum: 'bekliyor' });
                goster('⚡ Çevrimdışı: Görev hafızaya alındı!');
                setForm(BOSH); setFormAcik(false); setDuzenleId(null); setLoading(false); return;
            }
            if (duzenleId) {
                const { error } = await supabase.from('b1_gorevler').update({
                    baslik: form.baslik.trim(), aciklama: form.aciklama.trim() || null,
                    atanan_kisi: form.atanan_kisi.trim() || null, bitis_tarihi: form.son_tarih || null,
                    oncelik: form.oncelik, updated_at: new Date().toISOString()
                }).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Güncellendi!');
            } else {
                const { data: mevcut } = await supabase.from('b1_gorevler').select('id').ilike('baslik', form.baslik.trim()).eq('durum', 'bekliyor');
                if (mevcut && mevcut.length > 0) { setLoading(false); return goster('⚠️ Bu başlıkta bekleyen görev zaten var!', 'error'); }
                const { error } = await supabase.from('b1_gorevler').insert([{
                    baslik: form.baslik.trim(), aciklama: form.aciklama.trim() || null,
                    atanan_kisi: form.atanan_kisi.trim() || null, bitis_tarihi: form.son_tarih || null,
                    oncelik: form.oncelik, durum: 'bekliyor'
                }]);
                if (error) throw error;
                goster('✅ Görev oluşturuldu!');
                if (form.oncelik === 'kritik') telegramBildirim(`🔥 KRİTİK GÖREV!\nBaşlık: ${form.baslik}\nAtanan: ${form.atanan_kisi || 'Herkes'}`);
            }
            setForm(BOSH); setFormAcik(false); setDuzenleId(null); yukle();
        } catch (err) { goster('Hata: ' + err.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, durum, baslik) => {
        if (!navigator.onLine) { await cevrimeKuyrugaAl('b1_gorevler', 'UPDATE', { id, durum }); return goster('⚡ Çevrimdışı: Durum kuyruğa alındı.'); }
        try {
            const { error } = await supabase.from('b1_gorevler').update({ durum }).eq('id', id);
            if (error) throw error;
            if (durum === 'tamamlandi') telegramBildirim(`✅ GÖREV TAMAMLANDI!\n${baslik}`);
            yukle();
        } catch (err) { goster('Durum Hatası: ' + err.message, 'error'); }
    };

    const sil = async (id) => {
        if (!navigator.onLine) { await cevrimeKuyrugaAl('b1_gorevler', 'DELETE', { id }); return goster('⚡ Çevrimdışı: Silme kuyruğa alındı.'); }
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici, 'Bu görevi silmek için Yönetici PIN kodunu girin:');
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error');
        if (!confirm('Görev silinsin mi?')) return;
        try {
            await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_gorevler', islem_tipi: 'SILME', kullanici_adi: 'Saha Yetkilisi', eski_veri: {} }]).catch(() => { });
            const { error } = await supabase.from('b1_gorevler').delete().eq('id', id);
            if (error) throw error;
            yukle(); goster('Silindi');
        } catch (err) { goster('Silinemedi: ' + err.message, 'error'); }
    };

    // ── Drag-and-drop handlers ──────────────────────────────────────
    const onDragStart = (e, gorevId) => {
        dragGorevId.current = gorevId;
        e.dataTransfer.effectAllowed = 'move';
    };
    const onDragOver = (e, sutunKey) => {
        e.preventDefault();
        setDragOverKey(sutunKey);
    };
    const onDrop = async (e, sutunKey) => {
        e.preventDefault();
        setDragOverKey(null);
        const id = dragGorevId.current;
        dragGorevId.current = null;
        if (!id) return;
        const gorev = gorevler.find(g => g.id === id);
        if (!gorev || gorev.durum === sutunKey) return;
        // Optimistic update
        setGorevler(prev => prev.map(g => g.id === id ? { ...g, durum: sutunKey } : g));
        await durumGuncelle(id, sutunKey, gorev.baslik);
    };

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    const filtreli = gorevler.filter(g => {
        const oncelikOk = filtreOncelik === 'hepsi' || g.oncelik === filtreOncelik;
        const aramaOk = !aramaMetni || [g.baslik, g.aciklama, g.atanan_kisi].some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase()));
        return oncelikOk && aramaOk;
    });

    const istatistik = {
        toplam: gorevler.length,
        bekliyor: gorevler.filter(g => g.durum === 'bekliyor').length,
        devam: gorevler.filter(g => g.durum === 'devam').length,
        kritik: gorevler.filter(g => g.oncelik === 'kritik' && g.durum !== 'tamamlandi').length,
    };

    // ── Tekrar kullanılabilir Görev Kartı ──────────────────────────
    const GorevKarti = ({ g, draggable: isDraggable = false }) => (
        <div
            draggable={isDraggable && erisim === 'full'}
            onDragStart={isDraggable ? (e) => onDragStart(e, g.id) : undefined}
            style={{
                background: 'white', border: '2px solid',
                borderColor: g.oncelik === 'kritik' ? '#fee2e2' : '#f1f5f9',
                borderRadius: 12, padding: '0.875rem 1rem',
                cursor: isDraggable && erisim === 'full' ? 'grab' : 'default',
                transition: 'box-shadow 0.15s, transform 0.15s',
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                userSelect: 'none',
            }}
            onMouseEnter={e => { if (isDraggable) { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
        >
            <div style={{ display: 'flex', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: `${ONCELIK_RENK[g.oncelik]}20`, color: ONCELIK_RENK[g.oncelik] }}>{ONCELIK_LABEL[g.oncelik]}</span>
                {!isDraggable && <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: `${DURUM_RENK[g.durum]}20`, color: DURUM_RENK[g.durum] }}>{DURUM_LABEL[g.durum]}</span>}
            </div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginBottom: 4 }}>{g.baslik}</div>
            {g.aciklama && <p style={{ fontSize: '0.73rem', color: '#64748b', margin: '0 0 6px', lineHeight: 1.5 }}>{g.aciklama}</p>}
            <div style={{ display: 'flex', gap: 10, fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8, flexWrap: 'wrap' }}>
                {g.atanan_kisi && <span>👤 {g.atanan_kisi}</span>}
                {g.bitis_tarihi && <span>📅 {formatTarih(g.bitis_tarihi)}</span>}
                <span>🕐 {formatTarih(g.created_at)}</span>
            </div>
            {erisim === 'full' && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <button onClick={(e) => { e.stopPropagation(); setForm({ baslik: g.baslik, aciklama: g.aciklama || '', atanan_kisi: g.atanan_kisi || '', son_tarih: g.bitis_tarihi ? g.bitis_tarihi.slice(0, 16) : '', oncelik: g.oncelik, modul: g.modul || 'genel' }); setDuzenleId(g.id); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        style={{ background: '#eff6ff', border: '1px solid #3b82f6', color: '#2563eb', padding: '4px 8px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}>✏️</button>
                    {g.durum === 'bekliyor' && <button onClick={(e) => { e.stopPropagation(); durumGuncelle(g.id, 'devam', g.baslik); }} style={{ background: '#eff6ff', border: '1px solid #3b82f6', color: '#2563eb', padding: '4px 8px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}>⚙️</button>}
                    {g.durum === 'devam' && <button onClick={(e) => { e.stopPropagation(); durumGuncelle(g.id, 'tamamlandi', g.baslik); }} style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#059669', padding: '4px 8px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}>✅</button>}
                    <button onClick={(e) => { e.stopPropagation(); sil(g.id); }} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.68rem' }}>🗑️</button>
                </div>
            )}
        </div>
    );

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            {/* BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{isAR ? 'تتبع المهام' : 'Görev Takibi'}</h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>Sürükle-bırak Kanban Board · Görev ata · Takip et</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Görünüm Toggle */}
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
                        <button onClick={() => setGorunumModu('kanban')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', background: gorunumModu === 'kanban' ? 'white' : 'transparent', color: gorunumModu === 'kanban' ? '#047857' : '#64748b', boxShadow: gorunumModu === 'kanban' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                            <LayoutGrid size={14} /> Kanban
                        </button>
                        <button onClick={() => setGorunumModu('liste')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', background: gorunumModu === 'liste' ? 'white' : 'transparent', color: gorunumModu === 'liste' ? '#047857' : '#64748b', boxShadow: gorunumModu === 'liste' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                            <List size={14} /> Liste
                        </button>
                    </div>
                    {erisim === 'full' && (
                        <>
                            <button onClick={() => { setForm(BOSH); setDuzenleId(null); setFormAcik(!formAcik); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#047857', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.35)', fontSize: '0.85rem' }}>
                                <Plus size={16} /> Yeni Görev
                            </button>
                            <a href="/raporlar" style={{ textDecoration: 'none' }}>
                                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#d97706', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                                    📊 Raporlar
                                </button>
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* İstatistik */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(145px,1fr))', gap: '0.625rem', marginBottom: '1rem' }}>
                {[
                    { label: 'Toplam', val: istatistik.toplam, color: '#047857', bg: '#ecfdf5' },
                    { label: '⏳ Bekliyor', val: istatistik.bekliyor, color: '#d97706', bg: '#fffbeb' },
                    { label: '⚙️ Devam', val: istatistik.devam, color: '#2563eb', bg: '#eff6ff' },
                    { label: '🔥 Kritik', val: istatistik.kritik, color: '#dc2626', bg: '#fef2f2' },
                ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
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
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem', fontSize: '1rem' }}>📋 {duzenleId ? 'Görevi Düzenle' : 'Yeni Görev'}</h3>
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
                            <input maxLength={100} value={form.atanan_kisi} onChange={e => setForm({ ...form, atanan_kisi: e.target.value })} placeholder="Ad Soyad..." style={inp} />
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
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH); setFormAcik(false); setDuzenleId(null); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{loading ? '...' : duzenleId ? 'Güncelle' : 'Görev Oluştur'}</button>
                    </div>
                </div>
            )}

            {/* Arama + filtreler */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} placeholder="🔍 Başlık veya kişi ara..." style={{ ...inp, maxWidth: 300, marginBottom: 0 }} />
                {['hepsi', ...ONCELIK].map(o => (
                    <button key={o} onClick={() => setFiltreOncelik(o)} style={{ padding: '5px 12px', border: '2px solid', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem', borderColor: filtreOncelik === o ? (ONCELIK_RENK[o] || '#047857') : '#e5e7eb', background: filtreOncelik === o ? (ONCELIK_RENK[o] || '#047857') : 'white', color: filtreOncelik === o ? 'white' : '#374151' }}>
                        {o === 'hepsi' ? 'Tümü' : ONCELIK_LABEL[o]}
                    </button>
                ))}
            </div>

            {/* ══════════ KANBAN BOARD ══════════ */}
            {gorunumModu === 'kanban' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.875rem', alignItems: 'start' }}>
                    {KANBAN_SUTUNLAR.map(sutun => {
                        const sutunGorevler = filtreli.filter(g => g.durum === sutun.key);
                        const isDragOver = dragOverKey === sutun.key;
                        return (
                            <div
                                key={sutun.key}
                                onDragOver={e => onDragOver(e, sutun.key)}
                                onDragLeave={() => setDragOverKey(null)}
                                onDrop={e => onDrop(e, sutun.key)}
                                style={{
                                    background: isDragOver ? sutun.bg : '#f8fafc',
                                    border: `2px ${isDragOver ? 'dashed' : 'solid'} ${isDragOver ? sutun.renk : sutun.border}`,
                                    borderRadius: 16, padding: '0.875rem', minHeight: 220,
                                    transition: 'border 0.2s, background 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 800, color: sutun.renk, fontSize: '0.82rem' }}>{sutun.label}</span>
                                    <span style={{ background: sutun.renk, color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 900 }}>{sutunGorevler.length}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {sutunGorevler.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, border: '2px dashed', borderColor: sutun.border, borderRadius: 10 }}>
                                            Buraya sürükle & bırak
                                        </div>
                                    )}
                                    {sutunGorevler.map(g => <GorevKarti key={g.id} g={g} draggable={true} />)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══════════ LİSTE GÖRÜNÜMÜ ══════════ */}
            {gorunumModu === 'liste' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {filtreli.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <ClipboardList size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>Görev bulunamadı.</p>
                        </div>
                    )}
                    {filtreli.map(g => <GorevKarti key={g.id} g={g} draggable={false} />)}
                </div>
            )}
        </div>
    );
}
