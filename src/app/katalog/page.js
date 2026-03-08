'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { BookOpen, ShoppingBag, Plus, RefreshCw, AlertTriangle, CheckCircle2, QrCode, Trash2, Tag, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import SilBastanModal from '@/components/ui/SilBastanModal';
import FizikselQRBarkod from '@/components/barkod/FizikselQRBarkod';

const BOSH_URUN = { urun_kodu: '', urun_adi: '', urun_adi_ar: '', satis_fiyati_tl: '', birim_maliyet_tl: '', bedenler: '', renkler: '', stok_adeti: '', min_stok: '50', durum: 'aktif' };
const DURUMLAR = ['aktif', 'pasif', 'tukenmek_uzere'];

export default function KatalogSayfasi() {
    const { kullanici, sayfaErisim } = useAuth();
    const erisim = sayfaErisim('/katalog');

    // UI - State
    const [mounted, setMounted] = useState(false);
    const [lang, setLang] = useState('tr');
    const [finansGizli, setFinansGizli] = useState(true);

    const [urunler, setUrunler] = useState([]);
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOSH_URUN);
    const [duzenleId, setDuzenleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    const [barkodAcik, setBarkodAcik] = useState(false);
    const [seciliUrun, setSeciliUrun] = useState(null);

    useEffect(() => {
        setMounted(true);
        const el = document.querySelector('[data-lang]');
        if (el) setLang(el.getAttribute('data-lang') || 'tr');

        let isMounted = true;
        const kanal = supabase.channel('m9-gercek-zamanli')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_urun_katalogu' }, () => {
                if (isMounted) yukle();
            })
            .subscribe();

        yukle();

        return () => { isMounted = false; supabase.removeChannel(kanal); };
    }, []);

    const telegramBildirim = (msj) => {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 10000);
        fetch('/api/telegram-bildirim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj: msj }),
            signal: controller.signal
        }).finally(() => clearTimeout(tId)).catch(() => null);
    };

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 6000); };

    const yukle = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('b2_urun_katalogu').select('*').order('created_at', { ascending: false }).limit(300);
            if (error) throw error;
            if (data) setUrunler(data);
        } catch (error) {
            goster('Liste yüklenemedi: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const kaydet = async () => {
        if (!form.urun_kodu.trim()) return goster('Ürün Kodu zorunludur.', 'error');
        if (!form.urun_adi.trim()) return goster('Ürün Adı zorunludur.', 'error');
        if (!form.satis_fiyati_tl || form.satis_fiyati_tl <= 0) return goster('Geçerli bir Satış Fiyatı girin.', 'error');

        setLoading(true);
        const payload = {
            urun_kodu: form.urun_kodu.toUpperCase().trim(),
            urun_adi: form.urun_adi.trim(),
            urun_adi_ar: form.urun_adi_ar.trim() || null,
            satis_fiyati_tl: parseFloat(form.satis_fiyati_tl) || 0,
            birim_maliyet_tl: parseFloat(form.birim_maliyet_tl) || 0,
            bedenler: form.bedenler.trim() || null,
            renkler: form.renkler.trim() || null,
            stok_adeti: parseInt(form.stok_adeti) || 0,
            min_stok: parseInt(form.min_stok) || 0,
            durum: form.durum
        };

        if (payload.satis_fiyati_tl > 0 && payload.birim_maliyet_tl > 0) {
            payload.kar_marji_yuzde = ((payload.satis_fiyati_tl - payload.birim_maliyet_tl) / payload.birim_maliyet_tl) * 100;
        } else { payload.kar_marji_yuzde = 0; }

        if (!navigator.onLine) {
            cevrimeKuyrugaAl('b2_urun_katalogu', payload);
            goster('⚡ Çevrimdışı: Ürün kuyruğa eklendi. Bağlantı gelince yollanacak.', 'success');
            setForm(BOSH_URUN); setFormAcik(false); setDuzenleId(null);
            setLoading(false);
            return;
        }

        try {
            // Çifte kayıt engeli (yeni kayıt ise)
            if (!duzenleId) {
                const { data: mevcut } = await supabase.from('b2_urun_katalogu').select('id').eq('urun_kodu', payload.urun_kodu);
                if (mevcut && mevcut.length > 0) {
                    setLoading(false);
                    return goster('⚠️ Bu Ürün Kodu zaten katalogda mevcut!', 'error');
                }
            }

            if (duzenleId) {
                const { error } = await supabase.from('b2_urun_katalogu').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Ürün güncellendi!');
            } else {
                const { error } = await supabase.from('b2_urun_katalogu').insert([payload]);
                if (error) throw error;
                goster('✅ Yeni Ürün Kataloğa Eklendi!');
                telegramBildirim(`🛒 YENİ ÜRÜN (M9)\nKodu: ${payload.urun_kodu}\nFiyat: ${payload.satis_fiyati_tl} TL\nStok: ${payload.stok_adeti}`);
            }
            setForm(BOSH_URUN); setFormAcik(false); setDuzenleId(null);
            yukle();
        } catch (error) {
            goster('Hata oluştu: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const sil = async (id, m_kodu) => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const adminPin = prompt('Bu ürünü kalıcı olarak silmek için Yönetici PİN girin:');
            if (adminPin === null) return;
            const dogruPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (adminPin !== dogruPin) return goster('Yetkisiz PİN (Siber Güvenlik İhlali)', 'error');
        }

        if (!confirm('Ürünü kataloğdan SİLERSENİZ, bağlantılı siparişlerde hata olabilir. Emin misiniz?')) return;

        try {
            // Kara Kutu Zırhı
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b2_urun_katalogu', islem_tipi: 'SILME', kullanici_adi: kullanici?.label || 'M9 Yetkilisi',
                    eski_veri: { durum: 'M9 Urun kalici silindi.', urun_kodu: m_kodu }
                }]).catch(() => { });
            } catch (e) { }

            await supabase.from('b2_urun_katalogu').delete().eq('id', id);
            yukle(); goster('Silindi');
            telegramBildirim(`🗑️ ÜRÜN SİLİNDİ\n${m_kodu} stoklardan ve katalogdan kaldırıldı.`);
        } catch (error) {
            if (error.code === '23503') goster('HATA: Bu ürün Siparişlerde (M10) kullanıldığı için silinemez. Durumunu Pasif yapın.', 'error');
            else goster('Silme hatası: ' + error.message, 'error');
        }
    };

    const isAR = mounted && lang === 'ar';
    const inp = { width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

    if (!mounted) return null;

    if (erisim === 'yok') {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <ShieldCheck size={56} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase' }}>{isAR ? 'تم حظر الدخول غير المصرح به' : 'YETKİSİZ GİRİŞ ENGELLENDİ (M9)'}</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 12 }}>Katalog verileri yöneticilere özeldir.</p>
            </div>
        );
    }

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>

            {/* BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#db2777,#be185d)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingBag size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            {isAR ? 'كتالوج المنتجات والمخزن' : 'Mağaza & Ürün Kataloğu'}
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                            {isAR ? 'وحدة المبيعات (M9)' : 'Toptan / Perakende Satışa Hazır Ürünler (M9)'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setFinansGizli(!finansGizli)} style={{ background: finansGizli ? '#0f172a' : '#f87171', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                        {finansGizli ? '🤫 Fiyatları Göster' : '👀 Fiyatları Gizle'}
                    </button>
                    {erisim === 'full' && (
                        <button onClick={() => { setFormAcik(!formAcik); setDuzenleId(null); setForm(BOSH_URUN); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#db2777', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(219,39,119,0.3)' }}>
                            <Plus size={18} /> Yeni Ürün
                        </button>
                    )}
                    <a href="/siparisler" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
                            📦 Siparişler (M10)
                        </button>
                    </a>
                </div>
            </div>

            {/* BİLDİRİM BÖLGESİ */}
            {mesaj.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', marginBottom: '1.5rem', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />} {mesaj.text}
                </div>
            )}

            {/* HIZLI FORM (M9) */}
            {formAcik && erisim === 'full' && (
                <div style={{ background: 'white', border: '2px solid #fecdd3', borderRadius: 18, padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 40px rgba(219,39,119,0.08)' }}>
                    <h3 style={{ fontWeight: 900, color: '#be185d', marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag size={18} /> {duzenleId ? 'Ürün Düzenle' : 'Yeni Ürün Kartı'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={lbl}>Ürün Kodu / SK *</label>
                            <input type="text" value={form.urun_kodu} onChange={e => setForm({ ...form, urun_kodu: e.target.value })} placeholder="TSH-001" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Ürün Adı (TR) *</label>
                            <input type="text" value={form.urun_adi} onChange={e => setForm({ ...form, urun_adi: e.target.value })} placeholder="Basic Erkek Tshirt" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Ürün Adı (Arapça)</label>
                            <input type="text" dir="rtl" value={form.urun_adi_ar} onChange={e => setForm({ ...form, urun_adi_ar: e.target.value })} placeholder="تي شيرت..." style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Birim Maliyeti (TL)</label>
                            <input type="number" dir="ltr" value={form.birim_maliyet_tl} onChange={e => setForm({ ...form, birim_maliyet_tl: e.target.value })} placeholder="120" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Satış Fiyatı (TL) *</label>
                            <input type="number" dir="ltr" value={form.satis_fiyati_tl} onChange={e => setForm({ ...form, satis_fiyati_tl: e.target.value })} placeholder="299.90" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Mevcut Stok Adeti</label>
                            <input type="number" dir="ltr" value={form.stok_adeti} onChange={e => setForm({ ...form, stok_adeti: e.target.value })} placeholder="500" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Kritik Stok Sınırı</label>
                            <input type="number" dir="ltr" value={form.min_stok} onChange={e => setForm({ ...form, min_stok: e.target.value })} placeholder="50" style={inp} />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={lbl}>Beden Dağılımı</label>
                                <input type="text" value={form.bedenler} onChange={e => setForm({ ...form, bedenler: e.target.value })} placeholder="S, M, L, XL" style={inp} />
                            </div>
                            <div>
                                <label style={lbl}>Renkler</label>
                                <input type="text" value={form.renkler} onChange={e => setForm({ ...form, renkler: e.target.value })} placeholder="Siyah, Beyaz" style={inp} />
                            </div>
                            <div>
                                <label style={lbl}>Katalog Durumu</label>
                                <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                    {DURUMLAR.map(d => <option key={d} value={d}>{d.toUpperCase().replace('_', ' ')}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH_URUN); setFormAcik(false); setDuzenleId(null); }} style={{ padding: '10px 20px', border: '2px solid #e2e8f0', borderRadius: 10, background: 'white', fontWeight: 800, cursor: 'pointer', color: '#475569' }}>İptal</button>
                        <button onClick={kaydet} disabled={loading}
                            style={{ padding: '10px 28px', background: loading ? '#cbd5e1' : '#be185d', color: 'white', border: 'none', borderRadius: 10, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}>
                            {loading ? 'Yükleniyor...' : (duzenleId ? 'Değişiklikleri Kaydet' : 'Ürünü Ekle')}
                        </button>
                    </div>
                </div>
            )}

            {/* ÜRÜN LİSTESİ */}
            {loading && !urunler.length && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem', fontWeight: 800 }}>Yükleniyor...</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
                {urunler.map(u => {
                    const kritik = u.stok_adeti <= u.min_stok;

                    return (
                        <div key={u.id} style={{ background: 'white', border: '2px solid', borderColor: kritik ? '#fecaca' : '#f1f5f9', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s' }}>
                            <div style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, background: kritik ? '#fef2f2' : '#fdf2f8', color: kritik ? '#dc2626' : '#be185d', padding: '3px 10px', borderRadius: 6 }}>{u.urun_kodu}</span>
                                        <h3 style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', margin: '6px 0 0' }}>{u.urun_adi}</h3>
                                        {u.urun_adi_ar && <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginTop: 2 }} dir="rtl">{u.urun_adi_ar}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => { setSeciliUrun(u); setBarkodAcik(true); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'flex' }}><QrCode size={16} /></button>
                                        {erisim === 'full' && (
                                            <>
                                                <button onClick={() => { setForm({ urun_kodu: u.urun_kodu, urun_adi: u.urun_adi, urun_adi_ar: u.urun_adi_ar || '', satis_fiyati_tl: u.satis_fiyati_tl, birim_maliyet_tl: u.birim_maliyet_tl || '', bedenler: u.bedenler || '', renkler: u.renkler || '', stok_adeti: u.stok_adeti, min_stok: u.min_stok, durum: u.durum }); setDuzenleId(u.id); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: '#eff6ff', border: 'none', color: '#2563eb', padding: '6px 8px', borderRadius: 8, cursor: 'pointer' }}>✏️</button>
                                                <button onClick={() => sil(u.id, u.urun_kodu)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '6px 8px', borderRadius: 8, cursor: 'pointer' }}><Trash2 size={15} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>SATIŞ FİYATI</div>
                                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>{finansGizli ? '₺ ***' : `₺${u.satis_fiyati_tl}`}</div>
                                    </div>
                                    <div style={{ background: kritik ? '#fef2f2' : '#ecfdf5', borderRadius: 8, padding: '8px 12px' }}>
                                        <div style={{ fontSize: '0.6rem', color: kritik ? '#dc2626' : '#059669', fontWeight: 800, letterSpacing: '0.05em' }}>GÜNCEL STOK</div>
                                        <div style={{ fontWeight: 900, color: kritik ? '#b91c1c' : '#065f46', fontSize: '1rem' }}>{u.stok_adeti} ADET</div>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {u.bedenler && <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>📏 {u.bedenler}</span>}
                                    {u.renkler && <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>🎨 {u.renkler}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BARKOD MODALI */}
            <SilBastanModal acik={barkodAcik} onClose={() => setBarkodAcik(false)} title="Ürün Etiketi / Barkodu">
                {seciliUrun && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'white', padding: '2rem', borderRadius: '12px' }}>
                        <FizikselQRBarkod
                            veriKodu={seciliUrun.urun_kodu}
                            baslik={seciliUrun.urun_adi}
                            aciklama={`${finansGizli ? '' : `Satış: ₺${seciliUrun.satis_fiyati_tl}`} | Stok: ${seciliUrun.stok_adeti}`}
                        />
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
                            Bu etiket ürün paketlerine yapıştırılarak M10 modülünde hızlı sipariş oluşturmak için kullanılabilir.
                        </p>
                    </div>
                )}
            </SilBastanModal>
        </div>
    );
}
