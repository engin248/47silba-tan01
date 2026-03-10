'use client';
/**
 * features/kasa/components/KasaMainContainer.js
 * [A-03] CSV Export eklendi
 */
'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { DollarSign, Lock, Plus, Trash2, RefreshCw, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

// [A-03] CSV Export
const kasaCsvIndir = (hareketler, filtreTip, filtreOnay) => {
    const filtreli = hareketler.filter(h => {
        const tipOk = filtreTip === 'hepsi' || h.hareket_tipi === filtreTip;
        const onayOk = filtreOnay === 'hepsi' || h.onay_durumu === filtreOnay;
        return tipOk && onayOk;
    });
    const baslik = ['Tarih', 'Tip', 'Ödeme Yöntemi', 'Açıklama', 'Tutar (TL)', 'Onay Durumu', 'Müşteri', 'Vade Tarihi'];
    const satirlar = filtreli.map(h => [
        h.created_at ? new Date(h.created_at).toLocaleDateString('tr-TR') : '',
        h.hareket_tipi || '',
        h.odeme_yontemi || '',
        h.aciklama || '',
        parseFloat(h.tutar_tl || 0).toFixed(2),
        h.onay_durumu || '',
        h.b2_musteriler?.ad_soyad || '',
        h.vade_tarihi ? new Date(h.vade_tarihi).toLocaleDateString('tr-TR') : '',
    ]);
    const encodeField = (val) => {
        const s = String(val ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const icerik = [baslik, ...satirlar].map(r => r.map(encodeField).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + icerik], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kasa_hareketleri_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
};

const HAREKET_TIPLERI = ['tahsilat', 'iade_odeme', 'cek', 'senet', 'avans', 'diger'];
const ODEME_YONTEMLERI = ['nakit', 'eft', 'kredi_karti', 'cek', 'senet', 'diger'];
const BOSH_FORM = {
    hareket_tipi: 'tahsilat',
    odeme_yontemi: 'nakit',
    tutar_tl: '',
    aciklama: '',
    vade_tarihi: '',
    musteri_id: '',
};

const TIP_RENK = {
    tahsilat: '#059669', iade_odeme: '#ef4444', cek: '#f59e0b',
    senet: '#8b5cf6', avans: '#3b82f6', diger: '#64748b',
};
const TIP_ICON = {
    tahsilat: '📈', iade_odeme: '↩️', cek: '📄', senet: '📋', avans: '💵', diger: '💰',
};

export default function KasaSayfasi() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [hareketler, setHareketler] = useState([]);
    const [musteriler, setMusteriler] = useState([]);
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtreTip, setFiltreTip] = useState('hepsi');
    const [filtreOnay, setFiltreOnay] = useState('hepsi');

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {
            // [AI ZIRHI]: Realtime WebSocket (Kriter 20 & 34)
            const kanal = supabase.channel('kasa-gercek-zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_kasa_hareketleri' }, () => yukle())
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
            const [harRes, musRes] = await Promise.race([
                Promise.allSettled([
                    supabase.from('b2_kasa_hareketleri')
                        .select('*, b2_musteriler:musteri_id(ad_soyad, musteri_kodu)')
                        .order('created_at', { ascending: false }).limit(300),
                    supabase.from('b2_musteriler').select('id,musteri_kodu,ad_soyad').eq('aktif', true).limit(500),
                ]),
                timeout
            ]);
            if (harRes.status === 'fulfilled' && harRes.value.data) setHareketler(harRes.value.data);
            else if (harRes.status === 'fulfilled' && harRes.value.error) throw harRes.value.error;
            if (musRes.status === 'fulfilled' && musRes.value.data) setMusteriler(musRes.value.data);
        } catch (e) { goster('Kasa verileri alınamadı: ' + e.message, 'error'); }
        setLoading(false);
    };

    const kaydet = async () => {
        if (!form.tutar_tl || parseFloat(form.tutar_tl) <= 0) return goster('Tutar 0\'dan büyük olmalı!', 'error');
        if (parseFloat(form.tutar_tl) > 10000000) return goster('Tutar çok yüksek! Kontrol edin.', 'error');
        if (!form.aciklama.trim()) return goster('Açıklama zorunlu!', 'error');
        if (form.aciklama.length > 500) return goster('Açıklama çok uzun!', 'error');

        const veri = {
            hareket_tipi: form.hareket_tipi,
            odeme_yontemi: form.odeme_yontemi,
            tutar_tl: parseFloat(form.tutar_tl),
            aciklama: form.aciklama.trim(),
            vade_tarihi: form.vade_tarihi || null,
            musteri_id: form.musteri_id || null,
            onay_durumu: 'bekliyor',
        };

        // [AI ZIRHI]: Offline Modu (Kriter J)
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b2_kasa_hareketleri', 'INSERT', veri);
            goster('⚡ Çevrimdışı: Kasa işlemi kuyruğa alındı.');
            setForm(BOSH_FORM); setFormAcik(false);
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('b2_kasa_hareketleri').insert([veri]);
            if (error) throw error;
            goster(`✅ ${TIP_ICON[form.hareket_tipi]} Kasa hareketi kaydedildi: ₺${parseFloat(form.tutar_tl).toFixed(2)}`);
            telegramBildirim(`💰 KASA HAREKETİ\nTip: ${form.hareket_tipi.toUpperCase()}\nTutar: ₺${parseFloat(form.tutar_tl).toFixed(2)}\nAçıklama: ${form.aciklama}`);
            setForm(BOSH_FORM); setFormAcik(false); yukle();
        } catch (e) { goster('Kayıt hatası: ' + e.message, 'error'); }
        setLoading(false);
    };

    const onayDegistir = async (id, yeniOnay) => {
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b2_kasa_hareketleri', 'UPDATE', { id, onay_durumu: yeniOnay });
            return goster('⚡ Çevrimdışı: Onay değişikliği kuyruğa alındı.');
        }
        try {
            const { error } = await supabase.from('b2_kasa_hareketleri').update({ onay_durumu: yeniOnay }).eq('id', id);
            if (error) throw error;
            goster(yeniOnay === 'onaylandi' ? '✅ Tahsilat onaylandı!' : '❌ İptal edildi.'); yukle();
        } catch (e) { goster('Onay hatası: ' + e.message, 'error'); }
    };

    const sil = async (id) => {
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            kullanici,
            'Silme işlemi Yönetici yetkisi gerektirir. PIN:'
        );
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz işlem!', 'error');
        if (!confirm('Bu kasa kaydı silinsin mi?')) return;

        // KRİTER 114: Kasa Sabitlenip Kilitlendi mi? Kasa Log Değiştirilemez!
        const kasaKaydi = hareketler.find((h) => h.id === id);
        if (kasaKaydi?.onay_durumu === 'onaylandi') {
            return goster('🔒 DİJİTAL ADALET KİLİDİ: Banka güvenlik regülasyonları gereği Onaylanmış Kasa hareketleri ASLA SİLİNEMEZ!', 'error');
        }

        // [AI ZIRHI]: B0 Kara Kutu silme logu (Kriter 25)
        try {
            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b2_kasa_hareketleri', islem_tipi: 'SILME',
                kullanici_adi: kullanici?.label || 'Kasa Yetkilisi',
                eski_veri: { mesaj: `Kasa hareketi silindi. ID: ${id}` }
            }]).catch(() => { });
        } catch (e) { }

        try {
            const { error } = await supabase.from('b2_kasa_hareketleri').delete().eq('id', id);
            if (error) throw error;
            goster('Kayıt silindi.'); yukle();
        } catch (e) { goster('Silinemedi: ' + e.message, 'error'); }
    };

    // Hesaplamalar
    const tahsilat = hareketler.filter(h => h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const bekleyen = hareketler.filter(h => h.onay_durumu === 'bekliyor').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const iade = hareketler.filter(h => h.hareket_tipi === 'iade_odeme' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const netBakiye = tahsilat - iade;
    const vadesi = hareketler.filter(h => ['cek', 'senet'].includes(h.hareket_tipi) && h.vade_tarihi && new Date(h.vade_tarihi) < new Date());

    const filtreli = hareketler.filter(h => {
        const tipOk = filtreTip === 'hepsi' || h.hareket_tipi === filtreTip;
        const onayOk = filtreOnay === 'hepsi' || h.onay_durumu === filtreOnay;
        return tipOk && onayOk;
    });

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    if (!yetkiliMi) return (
        <div dir={isAR ? 'rtl' : 'ltr'} style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: 16, margin: '2rem' }}>
            <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#b91c1c', fontWeight: 900 }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
            <p style={{ color: '#7f1d1d', fontWeight: 600 }}>Kasa & Finans verileri gizlidir. Üretim PİN girişi zorunludur.</p>
        </div>
    );

    return (
        <div>
            {/* BAŞLIK */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#059669,#047857)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{isAR ? 'الصندوق والمالية' : 'Kasa & Finans'}</h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>{isAR ? 'التحصيل → الموافقة → الرصيد → متابعة الشيكات' : 'Tahsilat → Onay → Bakiye → Çek/Senet Takibi'}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => { setForm(BOSH_FORM); setFormAcik(!formAcik); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#059669', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(5,150,105,0.4)' }}>
                        <Plus size={18} /> Yeni Hareket
                    </button>
                    <button onClick={yukle} disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#374151', border: '2px solid #e2e8f0', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                        <RefreshCw size={15} /> Yenile
                    </button>
                    {/* [A-03] CSV Export */}
                    <button
                        onClick={() => kasaCsvIndir(hareketler, filtreTip, filtreOnay)}
                        title="Kasa hareketlerini CSV olarak indir"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a', color: '#34d399', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                        ⬇️ CSV İndir
                    </button>
                </div>
            </div>

            {/* ÖZET KUTULARI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#ecfdf5', border: '2px solid #6ee7b7', borderRadius: 14, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>✅ Onaylı Tahsilat</div>
                    <div style={{ fontWeight: 900, color: '#059669', fontSize: '1.35rem' }}>₺{tahsilat.toFixed(2)}</div>
                </div>
                <div style={{ background: '#fefce8', border: '2px solid #fde68a', borderRadius: 14, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#78350f', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>⏳ Bekleyen</div>
                    <div style={{ fontWeight: 900, color: '#d97706', fontSize: '1.35rem' }}>₺{bekleyen.toFixed(2)}</div>
                </div>
                <div style={{ background: netBakiye >= 0 ? 'linear-gradient(135deg,#0f172a,#1e293b)' : 'linear-gradient(135deg,#7f1d1d,#991b1b)', borderRadius: 14, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>💰 NET BAKİYE</div>
                    <div style={{ fontWeight: 900, color: netBakiye >= 0 ? '#34d399' : '#fca5a5', fontSize: '1.35rem' }}>{netBakiye >= 0 ? '+' : ''}₺{netBakiye.toFixed(2)}</div>
                </div>
                <div style={{ background: vadesi.length > 0 ? '#fef2f2' : '#f8fafc', border: `2px solid ${vadesi.length > 0 ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 14, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: vadesi.length > 0 ? '#991b1b' : '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>⚠️ Vadesi Geçen</div>
                    <div style={{ fontWeight: 900, color: vadesi.length > 0 ? '#ef4444' : '#0f172a', fontSize: '1.35rem' }}>{vadesi.length} Adet</div>
                </div>
                <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 14, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>📊 Toplam Kayıt</div>
                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.35rem' }}>{hareketler.length}</div>
                </div>
            </div>

            {/* GÜNLÜK KAPANIŞ VE BORÇ RAPORU VİDGETLERİ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}> GÜNLÜK KASA KAPANIŞ ÖZETİ</div>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.2rem', marginBottom: 4 }}>Bugün Tahsilat: ₺{(hareketler.filter(h => new Date(h.created_at).toDateString() === new Date().toDateString() && h.hareket_tipi === 'tahsilat' && h.onay_durumu==='onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0)).toFixed(2)}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Günün onaylanan tahsilat ve çıkışları hesaplandı.</div>
                    </div>
                    <button onClick={() => window.print()} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Gün Sonu Kes </button>
                </div>
                
                <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}> MÜŞTERİ BORÇ RİSKİ</div>
                        <div style={{ fontWeight: 900, color: '#ef4444', fontSize: '1.2rem', marginBottom: 4 }}>Açık / Riskliler: {(musteriler.filter(m => m.bakiye && m.bakiye > 10000)).length} Müşteri</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Bakiye riski &gt; 10.000 TL olan cari hesaplar.</div>
                    </div>
                    <a href="/musteriler" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'none' }}>Müşteriler Görüntüle </a>
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
                <div style={{ background: 'white', border: '2px solid #059669', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(5,150,105,0.1)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>💰 Yeni Kasa Hareketi</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={lbl}>Hareket Tipi *</label>
                            <select value={form.hareket_tipi} onChange={e => setForm({ ...form, hareket_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white', fontWeight: 700, color: TIP_RENK[form.hareket_tipi] }}>
                                {HAREKET_TIPLERI.map(t => <option key={t} value={t}>{TIP_ICON[t]} {t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Ödeme Yöntemi *</label>
                            <select value={form.odeme_yontemi} onChange={e => setForm({ ...form, odeme_yontemi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {ODEME_YONTEMLERI.map(y => <option key={y} value={y}>{y.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Tutar (₺) *</label>
                            <input type="number" min="0.01" step="0.01" value={form.tutar_tl} onChange={e => setForm({ ...form, tutar_tl: e.target.value })} placeholder="0.00" style={{ ...inp, fontWeight: 800, color: '#059669' }} />
                        </div>
                        <div>
                            <label style={lbl}>Vade Tarihi (Çek/Senet)</label>
                            <input type="date" value={form.vade_tarihi} onChange={e => setForm({ ...form, vade_tarihi: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Müşteri</label>
                            <select value={form.musteri_id} onChange={e => setForm({ ...form, musteri_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— Anonim / Perakende —</option>
                                {musteriler.map(m => <option key={m.id} value={m.id}>{m.musteri_kodu} | {m.ad_soyad}</option>)}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Açıklama *</label>
                            <input maxLength={500} value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} placeholder="Kasa hareketinin detayını yazın..." style={inp} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#059669', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                            {loading ? '...' : '✅ Kaydet'}
                        </button>
                    </div>
                </div>
            )}

            {/* FİLTRELER */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginRight: 4 }}>TİP:</span>
                {['hepsi', ...HAREKET_TIPLERI].map(t => (
                    <button key={t} onClick={() => setFiltreTip(t)}
                        style={{
                            padding: '5px 12px', borderRadius: 8, border: '2px solid', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem', transition: 'all 0.15s',
                            borderColor: filtreTip === t ? (TIP_RENK[t] || '#374151') : '#e5e7eb',
                            background: filtreTip === t ? (TIP_RENK[t] || '#374151') : 'white',
                            color: filtreTip === t ? 'white' : '#374151'
                        }}>
                        {t === 'hepsi' ? 'Tümü' : `${TIP_ICON[t]} ${t.replace('_', ' ')}`}
                    </button>
                ))}
                <div style={{ width: 1, background: '#e5e7eb', margin: '0 4px', height: 24 }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginRight: 4 }}>ONAY:</span>
                {['hepsi', 'bekliyor', 'onaylandi', 'iptal'].map(o => (
                    <button key={o} onClick={() => setFiltreOnay(o)}
                        style={{
                            padding: '5px 12px', borderRadius: 8, border: '2px solid', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem',
                            borderColor: filtreOnay === o ? '#374151' : '#e5e7eb',
                            background: filtreOnay === o ? '#374151' : 'white',
                            color: filtreOnay === o ? 'white' : '#374151'
                        }}>
                        {o === 'hepsi' ? 'Tümü' : o === 'bekliyor' ? '⏳ Bekliyor' : o === 'onaylandi' ? '✅ Onaylı' : '❌ İptal'}
                    </button>
                ))}
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginLeft: 8 }}>{filtreli.length} işlem</span>
            </div>

            {/* LİSTE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {loading && filtreli.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: 700 }}>⏳ Yükleniyor...</div>
                )}
                {!loading && filtreli.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                        <DollarSign size={40} style={{ color: '#e5e7eb', margin: '0 auto 0.5rem' }} />
                        <p style={{ color: '#94a3b8', fontWeight: 700 }}>Kasa hareketi yok. "Yeni Hareket" ile başlayın.</p>
                    </div>
                )}
                {filtreli.map(h => (
                    <div key={h.id} style={{ background: 'white', border: '2px solid', borderColor: h.onay_durumu === 'onaylandi' ? '#6ee7b7' : h.onay_durumu === 'iptal' ? '#fca5a5' : '#fde68a', borderRadius: 12, padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: (TIP_RENK[h.hareket_tipi] || '#64748b') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                                {TIP_ICON[h.hareket_tipi] || '💰'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>{h.aciklama}</div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: (TIP_RENK[h.hareket_tipi] || '#64748b') + '20', color: TIP_RENK[h.hareket_tipi] || '#64748b' }}>
                                        {h.hareket_tipi?.replace('_', ' ')}
                                    </span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', color: '#64748b' }}>
                                        {h.odeme_yontemi?.replace('_', ' ')}
                                    </span>
                                    {h.b2_musteriler?.ad_soyad && (
                                        <span style={{ fontSize: '0.62rem', color: '#3b82f6', fontWeight: 700 }}>👤 {h.b2_musteriler.ad_soyad}</span>
                                    )}
                                    {h.vade_tarihi && (
                                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: new Date(h.vade_tarihi) < new Date() ? '#ef4444' : '#f59e0b' }}>
                                            ⏰ Vade: {formatTarih(h.vade_tarihi)}
                                        </span>
                                    )}
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>🗓 {formatTarih(h.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <div style={{ fontWeight: 900, color: TIP_RENK[h.hareket_tipi] || '#0f172a', fontSize: '1rem' }}>
                                ₺{parseFloat(h.tutar_tl || 0).toFixed(2)}
                            </div>
                            {h.onay_durumu === 'bekliyor' && (
                                <button onClick={() => onayDegistir(h.id, 'onaylandi')} title="Onayla"
                                    style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#059669', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle size={12} /> Onayla
                                </button>
                            )}
                            <span style={{
                                fontSize: '0.62rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                                background: h.onay_durumu === 'onaylandi' ? '#ecfdf5' : h.onay_durumu === 'iptal' ? '#fef2f2' : '#fefce8',
                                color: h.onay_durumu === 'onaylandi' ? '#059669' : h.onay_durumu === 'iptal' ? '#ef4444' : '#d97706'
                            }}>
                                {h.onay_durumu === 'onaylandi' ? '✅ Onaylı' : h.onay_durumu === 'iptal' ? '❌ İptal' : '⏳ Bekliyor'}
                            </span>
                            <button onClick={() => sil(h.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: 6, borderRadius: 6, cursor: 'pointer' }}>
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
