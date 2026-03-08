'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Package, Plus, Search, ArrowUpRight, ArrowDownRight, AlertTriangle, ShieldAlert, Boxes, Database, Trash2, ArrowRightLeft } from 'lucide-react';

const BOSH_HAREKET = { urun_id: '', hareket_tipi: 'giris', adet: '', aciklama: '' };

export default function StokDepoKarargahi() {
    const { kullanici, sayfaErisim } = useAuth();
    const erisim = sayfaErisim('/stok');
    const [mounted, setMounted] = useState(false);
    const [lang, setLang] = useState('tr');

    // Tablolar
    const [stokEnvanteri, setStokEnvanteri] = useState([]);
    const [hareketler, setHareketler] = useState([]);

    // Formlar ve Durumlar
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [yeniHareket, setYeniHareket] = useState(BOSH_HAREKET);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [arama, setArama] = useState('');

    const timeoutPromise = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 sn)')), 10000));

    useEffect(() => {
        setMounted(true);
        const el = document.querySelector('[data-lang]');
        if (el) setLang(el.getAttribute('data-lang') || 'tr');

        let isMounted = true;
        let kanal;
        if (erisim !== 'yok') {
            kanal = supabase.channel('stok-gercek-zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_stok_hareketleri' }, () => {
                    if (isMounted) yukle();
                })
                .subscribe();
            yukle();
        }

        return () => { isMounted = false; if (kanal) supabase.removeChannel(kanal); };
    }, [erisim]);

    const showMessage = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 6000);
    };

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
            // Promise.race + allSettled kombosu: DDoS ve Timeout Zırhı
            const p1 = supabase.from('b2_urun_katalogu').select('id, urun_kodu, urun_adi, urun_adi_ar, satis_fiyati_tl, stok_adeti, min_stok, b2_stok_hareketleri(adet, hareket_tipi)');
            const p2 = supabase.from('b2_stok_hareketleri').select('id, urun_id, hareket_tipi, adet, aciklama, created_at, b2_urun_katalogu(urun_kodu, urun_adi)').order('created_at', { ascending: false }).limit(200);

            const res = await Promise.race([Promise.allSettled([p1, p2]), timeoutPromise()]);
            const [urunRes, hareketRes] = res;

            if (urunRes.status === 'fulfilled' && urunRes.value.data) {
                // Kritik Stok Hesabı
                const envanterData = urunRes.value.data.map(u => {
                    let totalGiris = 0; let totalCikis = 0;
                    if (u.b2_stok_hareketleri) {
                        u.b2_stok_hareketleri.forEach(h => {
                            if (h.hareket_tipi === 'giris' || h.hareket_tipi === 'iade') totalGiris += h.adet;
                            if (h.hareket_tipi === 'cikis' || h.hareket_tipi === 'fire') totalCikis += h.adet;
                        });
                    }
                    // Sisteme ilk kayıt edilirken girilen stok_adeti de bir GİRİŞ gibidir.
                    // Ya da stok hareketleri üzerinden mutabakat yapılabilir.
                    const baslangicStok = u.stok_adeti || 0;
                    return { ...u, net_stok: baslangicStok + totalGiris - totalCikis };
                });
                setStokEnvanteri(envanterData);
            }
            if (hareketRes.status === 'fulfilled' && hareketRes.value.data) {
                setHareketler(hareketRes.value.data);
            }
        } catch (error) {
            showMessage('Ağ veya Zaman Aşımı: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const stokHareketiKaydet = async () => {
        if (!yeniHareket.urun_id) return showMessage('Lütfen bir depo ürünü seçin!', 'error');
        if (!yeniHareket.adet || yeniHareket.adet <= 0) return showMessage('Adet bilgisi sıfırdan büyük olmalı!', 'error');

        setLoading(true);
        const payload = {
            urun_id: yeniHareket.urun_id,
            hareket_tipi: yeniHareket.hareket_tipi,
            adet: parseInt(yeniHareket.adet, 10),
            aciklama: yeniHareket.aciklama.trim() || 'Belirtilmedi'
        };

        // Offline PWA Zırhı
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b2_stok_hareketleri', payload);
            showMessage('⚠️ İnternet Yok: Stok hareketi çevrimdışı kuyruğa alındı. Sistem bağlantı bulunca senkronize edecek.', 'success');
            setYeniHareket(BOSH_HAREKET);
            setFormAcik(false);
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.from('b2_stok_hareketleri').insert([payload]);
            if (!error) {
                const urun = stokEnvanteri.find(u => u.id === payload.urun_id);
                showMessage('✅ Depo işlemi mühürlendi!');
                telegramBildirim(`📦 STOK HAREKETİ!\nÜrün: ${urun?.urun_kodu}\nİşlem: ${payload.hareket_tipi}\nMiktar: ${payload.adet} Adet\nDetay: ${payload.aciklama}`);

                // Ayrıca b2_urun_katalogu'ndeki stok_adeti alanini da guncelleyebiliriz, ancak hareketlerden net stogu hesaplıyoruz.

                setYeniHareket(BOSH_HAREKET);
                setFormAcik(false);
                yukle();
            } else throw error;
        } catch (error) {
            showMessage('Sunucu hatası: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const hareketSilB0Log = async (id, urun_kodu) => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const adminPin = prompt('Bu hareketi iptal etmek için Admin PIN lazım:');
            if (adminPin === null) return;
            const dogruPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (adminPin !== dogruPin) return showMessage('Yetkisiz İptal İhlali', 'error');
        }

        if (!confirm('DİKKAT! Bu hareket fiziksel olarak silinecektir. Emin misiniz?')) return;

        try {
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b2_stok_hareketleri', islem_tipi: 'SILME', kullanici_adi: kullanici?.label || 'M11 Sorumlusu',
                    eski_veri: { durum: `Silinen ürün kodu: ${urun_kodu}, Stok hareketi ID: ${id}` }
                }]).catch(() => { });
            } catch (e) { }

            const { error } = await supabase.from('b2_stok_hareketleri').delete().eq('id', id);
            if (error) throw error;

            showMessage('Kayıt silindi ve Kara Kutuya (B0) raporlandı.');
            telegramBildirim(`🚨 KRİTİK İŞLEM!\nDepodan bir stok hareketi kaydı tamamen silindi! Kodu: ${urun_kodu}`);
            yukle();
        } catch (error) {
            showMessage('Hata: ' + error.message, 'error');
        }
    };

    if (!mounted) return null;
    const isAR = mounted && lang === 'ar';

    if (erisim === 'yok') {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase' }}>{isAR ? 'تم حظر الدخول إلى المستودع (M11)' : 'M11 DEPO GİRİŞİ YASAK'}</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 12 }}>Stok verileri en üst düzey izne tabidir. PİN girmeniz gerekir.</p>
            </div>
        );
    }

    const filtrelenmisStok = stokEnvanteri.filter(s => s.urun_kodu?.toLowerCase().includes(arama.toLowerCase()) || s.urun_adi?.toLowerCase().includes(arama.toLowerCase()));

    const inp = { width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ padding: '2rem', fontFamily: 'inherit' }} dir={isAR ? 'rtl' : 'ltr'}>

            {/* BAŞLIK VE KÖPRÜ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#4f46e5,#6366f1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Boxes size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            {isAR ? 'المستودع ومراقبة المخزون (M11)' : 'M11 DEPO VE STOK KARARGÂH'}
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                            {isAR ? 'إدارة المخزون المحمية ضد الانقطاع' : 'DDoS korumalı ve Çevrimdışı zırhlı tam denetimli depo yönetim ekranı.'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {erisim === 'full' && (
                        <button onClick={() => { setFormAcik(!formAcik); setYeniHareket(BOSH_HAREKET); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#4f46e5', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
                            <Plus size={18} /> {isAR ? 'إضافة حركة جديدة' : 'Yeni Hareket (Giriş/Çıkış)'}
                        </button>
                    )}
                    <a href="/siparisler" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                            {isAR ? 'الطلبات (M10)' : 'Siparişler (M10)'}
                        </button>
                    </a>
                </div>
            </div>

            {mesaj.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', marginBottom: '1.5rem', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <Database size={18} />} {mesaj.text}
                </div>
            )}

            {/* ARAMA VE FİLTRE */}
            <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 450 }}>
                <Search size={18} style={{ position: 'absolute', right: isAR ? 14 : 'auto', left: isAR ? 'auto' : 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" value={arama} onChange={e => setArama(e.target.value)}
                    placeholder={isAR ? 'ابحث عن المنتج برمز المنتج...' : 'Ürün Kodu ile Stokta Ara...'}
                    style={{ ...inp, paddingLeft: isAR ? 14 : 42, paddingRight: isAR ? 42 : 14 }} />
            </div>

            {formAcik && erisim === 'full' && (
                <div style={{ background: 'white', border: '2px solid #818cf8', borderRadius: 18, padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 40px rgba(79,70,229,0.08)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, right: isAR ? 'auto' : 0, left: isAR ? 0 : 'auto', background: '#fbbf24', color: 'black', padding: '4px 12px', fontSize: '0.65rem', fontWeight: 900, borderBottomLeftRadius: isAR ? 0 : 18, borderBottomRightRadius: isAR ? 18 : 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {isAR ? 'المنطقة المحمية أوفلاين' : 'Offline Zırhlı Bölge'}
                    </div>
                    <h3 style={{ fontWeight: 900, color: '#3730a3', marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ArrowUpRight size={18} /> {isAR ? 'تسجيل إدخال / إخراج مستودع' : 'Yeni Merkez Girişi / Çıkışı Ekle'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={lbl}>{isAR ? 'اختر المنتج *' : 'Ürün Kimliği Seç *'}</label>
                            <select value={yeniHareket.urun_id} onChange={e => setYeniHareket({ ...yeniHareket, urun_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">--- {isAR ? 'اختر' : 'Ürün Seç'} ---</option>
                                {stokEnvanteri.map(s => <option key={s.id} value={s.id}>{s.urun_kodu} ({s.net_stok} {isAR ? 'متوفر' : 'Mevcut'})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>{isAR ? 'نوع الحركة *' : 'Hareket Tipi *'}</label>
                            <select value={yeniHareket.hareket_tipi} onChange={e => setYeniHareket({ ...yeniHareket, hareket_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="giris">🟢 {isAR ? 'إدخال (+)' : 'GİRİŞ (+)'}</option>
                                <option value="cikis">🔴 {isAR ? 'إخراج (-)' : 'ÇIKIŞ (-)'}</option>
                                <option value="iade">🟣 {isAR ? 'إرجاع (+)' : 'İADE (+)'}</option>
                                <option value="fire">🟠 {isAR ? 'تالف (-)' : 'FİRE/ÇÖP (-)'}</option>
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>{isAR ? 'الكمية *' : 'Adet *'}</label>
                            <input type="number" dir="ltr" value={yeniHareket.adet} placeholder="Örn: 50" onChange={e => setYeniHareket({ ...yeniHareket, adet: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>{isAR ? 'المسؤول / الملاحظات' : 'Sorumlu / Açıklama'}</label>
                            <input type="text" value={yeniHareket.aciklama} placeholder={isAR ? 'السائق، فاتورة العودة...' : 'Şoför Ali, İade vs.'} onChange={e => setYeniHareket({ ...yeniHareket, aciklama: e.target.value })} style={inp} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button onClick={() => setFormAcik(false)} style={{ padding: '10px 20px', border: '2px solid #e2e8f0', borderRadius: 10, background: 'white', fontWeight: 800, cursor: 'pointer', color: '#475569' }}>
                            {isAR ? 'إلغاء' : 'İPTAL ET'}
                        </button>
                        <button onClick={stokHareketiKaydet} disabled={loading} style={{ padding: '10px 28px', background: loading ? '#cbd5e1' : '#4f46e5', color: 'white', border: 'none', borderRadius: 10, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}>
                            {loading ? '...' : (isAR ? 'حفظ في المستودع' : 'DEPOYA MÜHÜRLE')}
                        </button>
                    </div>
                </div>
            )}

            {loading && !stokEnvanteri.length && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem', fontWeight: 800 }}>Kritik Veriler Çekiliyor...</p>}

            {/* STOK ENVANTER LİSTESİ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                {filtrelenmisStok.map(stok => {
                    const kritikLimiti = stok.min_stok || 10;
                    const kritikMi = stok.net_stok <= kritikLimiti;

                    return (
                        <div key={stok.id} style={{ background: 'white', border: '2px solid', borderColor: kritikMi ? '#fca5a5' : '#f1f5f9', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#f8fafc', color: '#475569', padding: '3px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>KOD: {stok.urun_kodu}</span>
                                        <h3 style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', margin: '8px 0 0' }}>{stok.urun_adi}</h3>
                                        {isAR && stok.urun_adi_ar && <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>{stok.urun_adi_ar}</p>}
                                    </div>
                                    {kritikMi && <AlertTriangle color="#ef4444" size={24} />}
                                </div>
                            </div>
                            <div style={{ marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 4 }}>
                                        {isAR ? 'المخزون الفعلي' : 'GERÇEK ZAMANLI STOK'}
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: '2rem', color: kritikMi ? '#dc2626' : '#059669', lineHeight: 1 }}>
                                        {stok.net_stok} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{isAR ? 'قطعة' : 'Adet'}</span>
                                    </div>
                                    {kritikMi && <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800, marginTop: 4 }}>
                                        {isAR ? 'المخزون حرج!' : 'Kritik Stok Uyarısı!'}
                                    </div>}
                                </div>
                                <div style={{ textAlign: isAR ? 'left' : 'right' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, marginBottom: 4 }}>{isAR ? 'السعر' : 'Maliyet/Fiyat'}</div>
                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>{stok.satis_fiyati_tl || 0} ₺</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* SON HAREKETLER (LOG BÖLÜMÜ) */}
            <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderBottom: '2px solid #f1f5f9' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        <ArrowRightLeft color="#6366f1" size={20} /> {isAR ? 'الحركات الأخيرة في المستودع' : 'SON HAREKETLER (KARA KUTU)'}
                    </h2>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, margin: '4px 0 0', color: '#64748b' }}>
                        {isAR ? 'بيانات المستودع مقفلة ضد التلاعب' : 'Sistemdeki lojistik veriler manipülasyona karşı kilitlidir.'}
                    </p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: isAR ? 'right' : 'left' }}>{isAR ? 'الكود' : 'Ürün Kodu'}</th>
                                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: isAR ? 'right' : 'left' }}>{isAR ? 'نوع العملية' : 'İşlem Yönü'}</th>
                                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: isAR ? 'left' : 'right' }}>{isAR ? 'الكمية' : 'Miktar'}</th>
                                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: isAR ? 'right' : 'left' }}>{isAR ? 'الملاحظات' : 'Açıklama / Fiş'}</th>
                                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: isAR ? 'right' : 'left' }}>{isAR ? 'الوقت' : 'Zaman'}</th>
                                {erisim === 'full' && <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>{isAR ? 'حذف' : 'Sil'}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {hareketler.map(h => {
                                const isGiris = h.hareket_tipi === 'giris' || h.hareket_tipi === 'iade';
                                return (
                                    <tr key={h.id}>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 900, fontSize: '0.85rem' }}>{h.b2_urun_katalogu?.urun_kodu || '?'}</td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: isGiris ? '#ecfdf5' : '#fef2f2', color: isGiris ? '#059669' : '#dc2626', border: `1px solid ${isGiris ? '#a7f3d0' : '#fecaca'}`, padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 900 }}>
                                                {isGiris ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {h.hareket_tipi}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 900, textAlign: isAR ? 'left' : 'right', fontSize: '1rem', color: isGiris ? '#059669' : '#dc2626' }} dir="ltr">
                                            {isGiris ? '+' : '-'}{h.adet}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>{h.aciklama}</td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>{new Date(h.created_at).toLocaleString('tr-TR')}</td>
                                        {erisim === 'full' && (
                                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                <button onClick={() => hareketSilB0Log(h.id, h.b2_urun_katalogu?.urun_kodu)} style={{ background: '#fef2f2', border: 'none', color: '#ef4444', padding: '6px', borderRadius: 6, cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
