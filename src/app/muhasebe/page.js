'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Lock, Unlock, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function MuhasebeSayfasi() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [lang, setLang] = useState('tr');
    const [raporlar, setRaporlar] = useState([]);
    const [secilenRapor, setSecilenRapor] = useState(null);
    const [ilgiliMaliyetler, setIlgiliMaliyetler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [raporsizemOrders, setRaporsizemOrders] = useState([]); // raporu olmayan tamamlanan emirler

    useEffect(() => {
        const el = document.querySelector('[data-lang]');
        if (el) setLang(el.getAttribute('data-lang') || 'tr');
    }, []);

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {

            // [AI ZIRHI]: Realtime Websocket (Kriter 20 & 34)
            const kanal = supabase.channel('islem-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })
                .subscribe();

            yukle();

            return () => { supabase.removeChannel(kanal); };
        }
    }, [kullanici]);

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

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            const req1 = supabase.from('b1_muhasebe_raporlari').select('*').order('created_at', { ascending: false }).limit(200);
            const req2 = supabase.from('b1_model_taslaklari').select('id, model_kodu, model_adi, hedef_adet').eq('durum', 'tamamlandi').order('created_at', { ascending: false }).limit(200);
            const timeoutPromise = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 sn)')), 10000));
            const [rRes, mRes] = await Promise.race([
                Promise.allSettled([req1, req2]),
                timeoutPromise()
            ]);

            let currentRaporlar = [];
            if (rRes.status === 'fulfilled' && rRes.value.data) {
                currentRaporlar = rRes.value.data;
                setRaporlar(currentRaporlar);
            }
            if (mRes.status === 'fulfilled' && mRes.value.data) {
                const raporOrderIds = new Set(currentRaporlar.map(r => r.order_id));
                setRaporsizemOrders(mRes.value.data.filter(o => !raporOrderIds.has(o.id)));
            }
        } catch (error) { goster('Ağ bağlantısı koptu! ' + error.message, 'error'); }
        setLoading(false);
    };

    const raporSec = async (rapor) => {
        setSecilenRapor(rapor);
        try {
            const { data, error } = await supabase.from('b1_maliyet_kayitlari').select('*').eq('order_id', rapor.order_id).order('created_at').limit(500);
            if (error) throw error;
            setIlgiliMaliyetler(data || []);
        } catch (error) { goster('Detay yüklenemedi: ' + error.message, 'error'); }
    };

    const durumGuncelle = async (id, yeniDurum) => {
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'UPDATE', { id, rapor_durumu: yeniDurum, ...(yeniDurum === 'onaylandi' ? { onay_tarihi: new Date().toISOString() } : {}) });
            if (secilenRapor?.id === id) setSecilenRapor(prev => ({ ...prev, rapor_durumu: yeniDurum }));
            return goster('⚡ Çevrimdışı: Durum değişikliği kuyruğa alındı.');
        }
        try {
            const { error } = await supabase.from('b1_muhasebe_raporlari').update({
                rapor_durumu: yeniDurum,
                ...(yeniDurum === 'onaylandi' ? { onay_tarihi: new Date().toISOString() } : {}),
            }).eq('id', id);
            if (error) throw error;
            goster(`✅ Rapor durumu: ${yeniDurum}`); yukle();
            if (secilenRapor?.id === id) setSecilenRapor(prev => ({ ...prev, rapor_durumu: yeniDurum }));
            telegramBildirim(`📋 MUHASEBE GÜNCELLEMESİ:\nBir raporun durumu değiştirildi: ${yeniDurum.toUpperCase()}`);
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
    };

    const devirKapat = async (rapor) => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const pin = prompt('Devir işlemi Koordinatör yetkisi gerektirir. PİN giriniz:');
            const kilitPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (pin !== kilitPin) return goster('Hatalı yetki! İşlem engellendi.', 'error');
        }
        if (!confirm('Bu raporu onaylıyor ve 2. Birime devir için kilitleniyor musunuz?')) return;

        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'UPDATE', { id: rapor.id, rapor_durumu: 'kilitlendi', devir_durumu: true, onay_tarihi: new Date().toISOString() });
            setSecilenRapor(null);
            return goster('⚡ Çevrimdışı: Devir kilitlenme komutu kuyruğa yazıldı!');
        }

        try {
            // [AI ZIRHI]: B0 Kilit/Devir kritik işlemi günlüğe raporla
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b1_muhasebe_raporlari', islem_tipi: 'UPDATE', kullanici_adi: kullanici?.label || 'Muhasebe Yetkilisi',
                    eski_veri: { mesaj: rapor.model_kodu + ' numarali emrin muhasebesi kilitlendi ve devre verildi.' }
                }]).catch(() => { });
            } catch (e) { }

            const { error } = await supabase.from('b1_muhasebe_raporlari').update({
                rapor_durumu: 'kilitlendi', devir_durumu: true, onay_tarihi: new Date().toISOString()
            }).eq('id', rapor.id);
            if (error) throw error;
            goster('✅ Rapor kilitlendi. 2. Birime devir tamamlandı!'); yukle(); setSecilenRapor(null);
            telegramBildirim(`🔒 2. BİRİME DEVİR ONAYLANDI!\nBir üretim raporu KİLİTLENDİ ve tamamen muhasebeleştirildi.`);
        } catch (error) { goster('Devir hatası: ' + error.message, 'error'); }
    };

    // Tamamlanan modelden otomatik rapor oluştur
    const uretimdenRaporOlustur = async (model) => {
        setLoading(true);
        try {
            // 🛑 U Kriteri: Mükerrer (Çift) Rapor Engelleme
            const { data: mevcut } = await supabase.from('b1_muhasebe_raporlari').select('id').eq('order_id', model.id);
            if (mevcut && mevcut.length > 0) {
                setLoading(false);
                return goster('⚠️ Bu üretim emri için zaten bir Muhasebe Raporu oluşturulmuş! Karargâh kalkanı mükerrer işlemi reddetti.', 'error');
            }

            const { data: maliyetler, error: mErr } = await supabase.from('b1_maliyet_kayitlari').select('tutar_tl').eq('order_id', model.id);
            if (mErr) throw mErr;
            const toplamMaliyet = (maliyetler || []).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);

            const insertData = {
                order_id: model.id,
                gerceklesen_maliyet_tl: toplamMaliyet,
                net_uretilen_adet: model.hedef_adet || 0,
                zayiat_adet: 0,
                rapor_durumu: 'sef_onay_bekliyor',
                devir_durumu: false,
            };
            if (!navigator.onLine) {
                await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'INSERT', insertData);
                goster('⚡ Çevrimdışı: Rapor işlemi tablete kaydedildi.');
            } else {
                const { error } = await supabase.from('b1_muhasebe_raporlari').insert([insertData]);
                if (error) throw error;
                goster(`✅ ${model.model_adi} için rapor oluşturuldu. Toplam: ₺${toplamMaliyet.toFixed(2)}`); yukle();
            }
        } catch (error) { goster('Rapor oluşturma hatası: ' + error.message, 'error'); }
        setLoading(false);
    };

    // Rapordaki maliyeti üretimden güncelle
    const maliyetiSenkronize = async (rapor) => {
        if (!rapor.order_id) return goster('Raporda bağlı iş emri yok!', 'error');
        try {
            const { data: maliyetler, error: mErr } = await supabase.from('b1_maliyet_kayitlari').select('tutar_tl').eq('order_id', rapor.order_id);
            if (mErr) throw mErr;
            const toplam = (maliyetler || []).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
            const { error } = await supabase.from('b1_muhasebe_raporlari').update({ gerceklesen_maliyet_tl: toplam }).eq('id', rapor.id);
            if (error) throw error;
            goster(`✅ Maliyet güncellendi: ₺${toplam.toFixed(2)}`); yukle();
            if (secilenRapor?.id === rapor.id) setSecilenRapor(p => ({ ...p, gerceklesen_maliyet_tl: toplam }));
        } catch (error) { goster('Senkronizasyon hatası: ' + error.message, 'error'); }
    };

    const isAR = lang === 'ar';
    const formatTarih = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };
    const DURUM_RENK = { taslak: '#94a3b8', sef_onay_bekliyor: '#f59e0b', onaylandi: '#10b981', kilitlendi: '#0f172a' };
    const DURUM_LABEL = { taslak: '📄 Taslak', sef_onay_bekliyor: '⏳ Şef Onayı', onaylandi: '✅ Onaylı', kilitlendi: '🔒 Kilitli' };
    const MALIYET_LABEL = { personel_iscilik: '👷 Personel', isletme_gideri: '🏭 İşletme', sarf_malzeme: '🧵 Sarf', fire_kaybi: '🔥 Fire' };

    const birimMaliyet = (r) => {
        const net = parseInt(r.net_uretilen_adet) || 0;
        if (net === 0) return '—';
        return (parseFloat(r.gerceklesen_maliyet_tl) / net).toFixed(4);
    };
    const asimPct = (r) => {
        const h = parseFloat(r.hedeflenen_maliyet_tl);
        if (!h) return 0;
        return (((parseFloat(r.gerceklesen_maliyet_tl) - h) / h) * 100).toFixed(1);
    };

    if (!yetkiliMi) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Muhasebe Raporu gizlidir. Görüntülemek için Üretim PİN girişi zorunludur.</p>
            </div>
        );
    }

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCheck size={24} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                        {isAR ? 'المحاسبة والتقارير النهائية' : 'Muhasebe & Final Rapor'}
                    </h1>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                        {isAR ? 'مراجعة → موافقة الشيف → قفل → تحويل إلى الوحدة الثانية' : 'İncele → Şef onayı → Kilitle → 2. Birime devir'}
                    </p>
                </div>
            </div>

            {mesaj.text && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.text}
                </div>
            )}

            {/* ÜRETİMDEN OTOMATIK RAPOR OLUŞTUR */}
            {raporsizemOrders.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fffbeb)', border: '2px solid #f59e0b', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>⚡</span>
                        <span style={{ fontWeight: 800, color: '#92400e', fontSize: '0.9rem' }}>
                            {raporsizemOrders.length} Tamamlanmış Üretim — Muhasebe Raporu Bekliyor!
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {raporsizemOrders.map(o => (
                            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: 10, padding: '0.625rem 0.875rem', border: '1px solid #fde68a' }}>
                                <div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#fde68a', color: '#92400e', padding: '2px 7px', borderRadius: 4, marginRight: 8 }}>{o.model_kodu}</span>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{o.model_adi || 'Model'}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 8 }}>{o.hedef_adet} adet</span>
                                </div>
                                <button onClick={() => uretimdenRaporOlustur(o)} disabled={loading}
                                    style={{ padding: '6px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' }}>
                                    📋 Rapor Oluştur
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DEVIR GEÇİŞ KAPISI */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>🚪</div>
                <div>
                    <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>
                        {isAR ? 'بوابة التحويل إلى الوحدة الثانية' : '2. Birime Geçiş Kapısı'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                        {isAR ? 'فقط التقارير "المقفلة" تنتقل إلى الوحدة الثانية. قرار المنسق فقط.' : 'Sadece KİLİTLİ raporlar 2. Birime geçer. Koordinatör kararı.'}
                    </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>KİLİTLİ RAPOR</div>
                        <div style={{ fontWeight: 900, color: '#34d399', fontSize: '1.4rem' }}>{raporlar.filter(r => r.rapor_durumu === 'kilitlendi').length}</div>
                    </div>
                    {/* CC Kriteri Otomatik Rota (Karargah/Ana Merkeze Dönüş) */}
                    <a href="/" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#7c3aed', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
                            🎖️ Karargâha (Merkeze) Dön
                        </button>
                    </a>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
                {/* RAPOR LİSTESİ */}
                <div style={{ flex: '1 1 350px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {!loading && raporlar.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                                <FileCheck size={40} style={{ color: '#e5e7eb', marginBottom: '0.5rem' }} /><p style={{ color: '#94a3b8', fontWeight: 700 }}>Final rapor yok. M6 Üretim Bandından devir başlatın.</p>
                            </div>
                        )}
                        {raporlar.map(r => {
                            const pct = parseFloat(asimPct(r));
                            const kilitli = r.rapor_durumu === 'kilitlendi';
                            return (
                                <div key={r.id}
                                    onClick={() => raporSec(r)}
                                    style={{ background: 'white', border: '2px solid', borderColor: secilenRapor?.id === r.id ? '#7c3aed' : kilitli ? '#0f172a' : '#f1f5f9', borderRadius: 12, padding: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: secilenRapor?.id === r.id ? '0 4px 16px rgba(124,58,237,0.15)' : 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', gap: 6, marginBottom: '0.375rem' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 4 }}>
                                                    {r.model_kodu || r.id?.slice(0, 8) || 'Rapor'}
                                                </span>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: `${DURUM_RENK[r.rapor_durumu]}20`, color: DURUM_RENK[r.rapor_durumu] }}>
                                                    {DURUM_LABEL[r.rapor_durumu]}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                                                {r.model_adi || r.model_kodu || 'Model'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 900, color: pct > 0 ? '#ef4444' : '#10b981', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} %{Math.abs(pct)}
                                            </div>
                                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>{pct > 0 ? 'Aşım' : 'Tasarruf'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.375rem', marginTop: '0.625rem' }}>
                                        <div style={{ background: '#f8fafc', borderRadius: 6, padding: '5px 10px' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>HEDEF</div>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>\u20ba{parseFloat(r.hedeflenen_maliyet_tl || 0).toFixed(2)}</div>
                                        </div>
                                        <div style={{ background: pct > 10 ? '#fef2f2' : '#f0fdf4', borderRadius: 6, padding: '5px 10px' }}>
                                            <div style={{ fontSize: '0.6rem', color: pct > 10 ? '#dc2626' : '#059669', fontWeight: 700 }}>GERCEK TOPLAM</div>
                                            <div style={{ fontWeight: 800, color: pct > 10 ? '#dc2626' : '#059669', fontSize: '0.88rem' }}>\u20ba{parseFloat(r.gerceklesen_maliyet_tl || 0).toFixed(2)}</div>
                                        </div>
                                        <div style={{ background: 'linear-gradient(135deg,#059669,#047857)', borderRadius: 6, padding: '5px 10px' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#a7f3d0', fontWeight: 700 }}>B\u0130R\u0130M MAL\u0130YET</div>
                                            <div style={{ fontWeight: 900, color: 'white', fontSize: '0.95rem' }}>\u20ba{birimMaliyet(r)}<span style={{ fontSize: '0.6rem', color: '#a7f3d0' }}>/adet</span></div>
                                            <div style={{ fontSize: '0.58rem', color: '#a7f3d0' }}>{r.net_uretilen_adet || 0} adet</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SEÇİLEN RAPOR DETAY */}
                {secilenRapor && (
                    <div style={{ flex: '1.5 1 400px', background: 'white', border: '2px solid #7c3aed', borderRadius: 16, padding: '1.25rem', alignSelf: 'flex-start', position: 'sticky', top: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontWeight: 900, color: '#0f172a', margin: 0, fontSize: '1rem' }}>📊 Rapor Detayı</h2>
                            <button onClick={() => setSecilenRapor(null)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                        </div>

                        {/* Temel Metrikler */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1rem' }}>
                            {[
                                { label: 'Hedeflenen Maliyet', val: `₺${parseFloat(secilenRapor.hedeflenen_maliyet_tl).toFixed(2)}`, color: '#374151' },
                                { label: 'Gerçekleşen Maliyet', val: `₺${parseFloat(secilenRapor.gerceklesen_maliyet_tl).toFixed(2)}`, color: parseFloat(secilenRapor.fark_tl) > 0 ? '#dc2626' : '#059669' },
                                { label: 'Fark (Üretilen-Hedef)', val: `₺${parseFloat(secilenRapor.fark_tl || 0).toFixed(2)}`, color: parseFloat(secilenRapor.fark_tl || 0) > 0 ? '#dc2626' : '#059669' },
                                { label: 'Birim Maliyet/Adet', val: `₺${birimMaliyet(secilenRapor)}`, color: '#7c3aed' },
                                { label: 'Üretilen Adet', val: secilenRapor.net_uretilen_adet, color: '#059669' },
                                { label: 'Zayiat', val: `${secilenRapor.zayiat_adet} adet (%${secilenRapor.net_uretilen_adet + secilenRapor.zayiat_adet > 0 ? ((secilenRapor.zayiat_adet / (secilenRapor.net_uretilen_adet + secilenRapor.zayiat_adet)) * 100).toFixed(1) : 0})`, color: '#ef4444' },
                            ].map((m, i) => (
                                <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{m.label}</div>
                                    <div style={{ fontWeight: 900, color: m.color, fontSize: '0.95rem', marginTop: 2 }}>{m.val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Maliyet Dağılımı */}
                        {ilgiliMaliyetler.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontWeight: 800, color: '#374151', fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Maliyet Kalemleri</div>
                                {ilgiliMaliyetler.map(m => (
                                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, background: '#f8fafc', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>{m.kalem_aciklama}</span>
                                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>₺{parseFloat(m.tutar_tl).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* DURUM AKSIYONLARI */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {secilenRapor.rapor_durumu === 'taslak' && (
                                <button onClick={() => durumGuncelle(secilenRapor.id, 'sef_onay_bekliyor')}
                                    style={{ padding: '10px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                                    📤 Şef Onayına Gönder
                                </button>
                            )}
                            {secilenRapor.rapor_durumu === 'sef_onay_bekliyor' && (
                                <button onClick={() => durumGuncelle(secilenRapor.id, 'onaylandi')}
                                    style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                                    ✅ Şef Onayı Ver
                                </button>
                            )}
                            {secilenRapor.rapor_durumu === 'onaylandi' && (
                                <button onClick={() => devirKapat(secilenRapor)}
                                    style={{ padding: '10px', background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Lock size={16} /> Kilitle & 2. Birime Devret
                                </button>
                            )}
                            {secilenRapor.rapor_durumu === 'kilitlendi' && (
                                <div style={{ padding: '10px', background: '#0f172a', color: '#34d399', borderRadius: 10, fontWeight: 800, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Lock size={16} /> KİLİTLİ — 2. BİRİMDE
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
