'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Lock, Trash2, Edit2, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import Link from 'next/link';

export default function MuhasebeMainContainer() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang } = useLang();  // Context'ten al — anlık güncelleme
    const [raporlar, setRaporlar] = useState([]);
    const [secilenRapor, setSecilenRapor] = useState(null);
    const [ilgiliMaliyetler, setIlgiliMaliyetler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [raporsizemOrders, setRaporsizemOrders] = useState([]);
    const [aramaMetni, setAramaMetni] = useState('');
    const [duzenleModal, setDuzenleModal] = useState(null); // { id, zayiat_adet, hedeflenen_maliyet_tl, notlar }
    const [duzenleForm, setDuzenleForm] = useState({ zayiat_adet: '', hedeflenen_maliyet_tl: '', notlar: '' });
    const [islemdeId, setIslemdeId] = useState(null); // [SPAM ZIRHI]

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {
            // [AI ZIRHI]: WebSocket dinleyicisi sadece b1_muhasebe_raporlari na daraltıldı.
            const kanal = supabase.channel('muhasebe-gercek-zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_muhasebe_raporlari' }, () => { yukle(); })
                .subscribe();
            yukle();
            return () => { supabase.removeChannel(kanal); };
        }
    }, [kullanici]);

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı)

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
        if (islemdeId === id) return;
        setIslemdeId(id);
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'UPDATE', { id, rapor_durumu: yeniDurum, ...(yeniDurum === 'onaylandi' ? { onay_tarihi: new Date().toISOString() } : {}) });
            if (secilenRapor?.id === id) setSecilenRapor(prev => ({ ...prev, rapor_durumu: yeniDurum }));
            setIslemdeId(null);
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
        finally { setIslemdeId(null); }
    };

    const devirKapat = async (rapor) => {
        if (islemdeId === 'devir_' + rapor.id) return;
        setIslemdeId('devir_' + rapor.id);
        const { yetkili: dYetkili, mesaj: dYetkiMesaj } = await silmeYetkiDogrula(
            kullanici,
            'Devir işlemi Koordinatör yetkisi gerektirir. PIN giriniz:'
        );
        if (!dYetkili) { setIslemdeId(null); return goster(dYetkiMesaj || 'Yetkisiz işlem.', 'error'); }
        if (!confirm('Bu raporu onaylıyor ve 2. Birime devir için kilitleniyor musunuz?')) { setIslemdeId(null); return; }

        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'UPDATE', { id: rapor.id, rapor_durumu: 'kilitlendi', devir_durumu: true, onay_tarihi: new Date().toISOString() });
            setSecilenRapor(null);
            setIslemdeId(null);
            return goster('⚡ Çevrimdışı: Devir kilitlenme komutu kuyruğa yazıldı!');
        }

        try {
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
        finally { setIslemdeId(null); }
    };

    const uretimdenRaporOlustur = async (model) => {
        setLoading(true);
        try {
            const { data: mevcut } = await supabase.from('b1_muhasebe_raporlari').select('id').eq('order_id', model.id);
            if (mevcut && mevcut.length > 0) {
                setLoading(false);
                return goster('Bu üretim emri için zaten bir Muhasebe Raporu mevcut!', 'error');
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

    // ─── YENİ: DÜZENLE ───────────────────────────────────────────────────────────
    const duzenleAc = (rapor) => {
        if (rapor.rapor_durumu === 'kilitlendi') return goster('Kilitli raporlar düzenlenemez!', 'error');
        setDuzenleForm({
            zayiat_adet: String(rapor.zayiat_adet || 0),
            hedeflenen_maliyet_tl: String(rapor.hedeflenen_maliyet_tl || ''),
            notlar: rapor.notlar || ''
        });
        setDuzenleModal(rapor);
    };

    const duzenleKaydet = async () => {
        if (!duzenleModal) return;
        setLoading(true);
        try {
            const payload = {
                zayiat_adet: parseInt(duzenleForm.zayiat_adet) || 0,
                hedeflenen_maliyet_tl: parseFloat(duzenleForm.hedeflenen_maliyet_tl) || 0,
                notlar: duzenleForm.notlar.trim() || null,
            };
            const { error } = await supabase.from('b1_muhasebe_raporlari').update(payload).eq('id', duzenleModal.id);
            if (error) throw error;
            goster('✅ Rapor güncellendi!');
            yukle();
            if (secilenRapor?.id === duzenleModal.id) setSecilenRapor(p => ({ ...p, ...payload }));
            setDuzenleModal(null);
        } catch (error) { goster('Düzenleme hatası: ' + error.message, 'error'); }
        setLoading(false);
    };

    // ─── YENİ: SİL ───────────────────────────────────────────────────────────────
    const raporSil = async (rapor) => {
        if (islemdeId === 'sil_' + rapor.id) return;
        setIslemdeId('sil_' + rapor.id);
        if (rapor.rapor_durumu === 'kilitlendi') { setIslemdeId(null); return goster('Kilitli raporlar silinemez! Devir tamamlanmış.', 'error'); }
        const { yetkili: sYetkili, mesaj: sYetkiMesaj } = await silmeYetkiDogrula(
            kullanici,
            'Raporu silmek için Yönetici PIN girin:'
        );
        if (!sYetkili) { setIslemdeId(null); return goster(sYetkiMesaj || 'Yetkisiz işlem.', 'error'); }
        if (!confirm(`"${rapor.model_kodu || rapor.id.slice(0, 8)}" raporunu siliyorsunuz. Emin misiniz?`)) { setIslemdeId(null); return; }
        try {
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b1_muhasebe_raporlari', islem_tipi: 'SILME',
                    kullanici_adi: kullanici?.label || 'Muhasebe Yetkilisi',
                    eski_veri: { rapor_durumu: rapor.rapor_durumu, model_kodu: rapor.model_kodu }
                }]).catch(() => { });
            } catch (e) { }
            const { error } = await supabase.from('b1_muhasebe_raporlari').delete().eq('id', rapor.id);
            if (error) throw error;
            goster('Rapor silindi.');
            if (secilenRapor?.id === rapor.id) setSecilenRapor(null);
            yukle();
            telegramBildirim(`🗑️ MUHASEBE RAPORU SİLİNDİ\nModel: ${rapor.model_kodu || '-'}`);
        } catch (error) { goster('Silme hatası: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const isAR = lang === 'ar';


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

    // Arama filtresi
    const filtreliRaporlar = raporlar.filter(r =>
        !aramaMetni ||
        r.model_kodu?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        r.model_adi?.toLowerCase().includes(aramaMetni.toLowerCase())
    );

    const istatistik = {
        toplam: raporlar.length,
        bekleyen: raporlar.filter(r => r.rapor_durumu === 'sef_onay_bekliyor').length,
        onaylandi: raporlar.filter(r => r.rapor_durumu === 'onaylandi').length,
        kilitli: raporlar.filter(r => r.rapor_durumu === 'kilitlendi').length,
    };

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };

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
            {/* BAŞLIK */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <div style={{ marginLeft: 'auto' }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                            Ana Sayfaya Dön
                        </button>
                    </Link>
                </div>
            </div>

            {/* İSTATİSTİK KARTLARI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam Rapor', val: istatistik.toplam, color: '#047857', bg: '#ecfdf5' },
                    { label: '⏳ Onay Bekl.', val: istatistik.bekleyen, color: '#d97706', bg: '#fffbeb' },
                    { label: '✅ Onaylı', val: istatistik.onaylandi, color: '#10b981', bg: '#f0fdf4' },
                    { label: '🔒 Kilitli', val: istatistik.kilitli, color: '#0f172a', bg: '#f8fafc' },
                ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 12, padding: '0.875rem 1rem' }}>
                        <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* ARAMA */}
            <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 420 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                    placeholder="Model kodu veya adına göre ara..."
                    style={{ ...inp, paddingLeft: 36, maxWidth: '100%' }} />
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


            {/* [KRİTİK EKSİK] M8  BÜTÇE vs GERÇEK DASHBOARD */}
            {raporlar.length > 0 && (() => {
                const toplamHedef = raporlar.reduce((s, r) => s + parseFloat(r.hedeflenen_maliyet_tl || 0), 0);
                const toplamGercek = raporlar.reduce((s, r) => s + parseFloat(r.gerceklesen_maliyet_tl || 0), 0);
                const fark = toplamGercek - toplamHedef;
                const pct = toplamHedef > 0 ? ((fark / toplamHedef) * 100).toFixed(1) : 0;
                return (
                    <div style={{ background: fark > 0 ? 'linear-gradient(135deg,#fef2f2,#fee2e2)' : 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '2px solid ' + (fark > 0 ? '#fca5a5' : '#6ee7b7'), borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>{fark > 0 ? '⚠️' : ''}</span>
                            <span style={{ fontWeight: 900, color: fark > 0 ? '#991b1b' : '#065f46', fontSize: '0.92rem' }}>
                                BÜTÇE vs GERÇEK ANALİZİ — {raporlar.length} Rapor
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
                            <div style={{ background: 'white', borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Toplam Hedef</div>
                                <div style={{ fontWeight: 900, color: '#374151', fontSize: '1.1rem', marginTop: 4 }}>₺{toplamHedef.toFixed(0)}</div>
                            </div>
                            <div style={{ background: 'white', borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Toplam Gerçek</div>
                                <div style={{ fontWeight: 900, color: fark > 0 ? '#dc2626' : '#059669', fontSize: '1.1rem', marginTop: 4 }}>₺{toplamGercek.toFixed(0)}</div>
                            </div>
                            <div style={{ background: 'white', borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Sapma</div>
                                <div style={{ fontWeight: 900, color: fark > 0 ? '#dc2626' : '#059669', fontSize: '1.1rem', marginTop: 4 }}>{fark > 0 ? '+' : ''}{fark.toFixed(0)} ₺ ({pct > 0 ? '+' : ''}{pct}%)</div>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* [M8] BÜTÇE vs GERÇEK ANALİZİ */}
            {raporlar.length > 0 && (() => {
                const tH = raporlar.reduce((s, r) => s + parseFloat(r.hedeflenen_maliyet_tl || 0), 0);
                const tG = raporlar.reduce((s, r) => s + parseFloat(r.gerceklesen_maliyet_tl || 0), 0);
                const fark = tG - tH;
                const pct = tH > 0 ? ((fark / tH) * 100).toFixed(1) : 0;
                return (
                    <div style={{ background: fark > 0 ? '#fef2f2' : '#ecfdf5', border: `2px solid ${fark > 0 ? '#fca5a5' : '#6ee7b7'}`, borderRadius: 16, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                        <div style={{ fontWeight: 900, color: fark > 0 ? '#991b1b' : '#065f46', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                            {fark > 0 ? '⚠️' : '✅'} BÜTÇE vs GERÇEK — {raporlar.length} Rapor Analizi
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.625rem' }}>
                            {[
                                { label: 'Toplam Hedef', val: `₺${tH.toFixed(0)}`, color: '#374151' },
                                { label: 'Toplam Gerçek', val: `₺${tG.toFixed(0)}`, color: fark > 0 ? '#dc2626' : '#059669' },
                                { label: 'Sapma', val: `${fark > 0 ? '+' : ''}${fark.toFixed(0)}₺ (${pct}%)`, color: fark > 0 ? '#dc2626' : '#059669' },
                            ].map((m, i) => (
                                <div key={i} style={{ background: 'white', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</div>
                                    <div style={{ fontWeight: 900, color: m.color, fontSize: '1rem' }}>{m.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* DEVİR GEÇİŞ KAPISI */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>🚪</div>
                <div>
                    <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>2. Birime Geçiş Kapısı</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Sadece KİLİTLİ raporlar 2. Birime geçer. Yönetici onayı gereklidir.</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>KİLİTLİ RAPOR</div>
                    <div style={{ fontWeight: 900, color: '#34d399', fontSize: '1.4rem' }}>{istatistik.kilitli}</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
                {/* RAPOR LİSTESİ */}
                <div style={{ flex: '1 1 350px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {!loading && filtreliRaporlar.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                                <FileCheck size={40} style={{ color: '#e5e7eb', marginBottom: '0.5rem' }} />
                                <p style={{ color: '#94a3b8', fontWeight: 700 }}>
                                    {aramaMetni ? 'Arama sonucu bulunamadı.' : 'Final rapor yok. M6 Üretim Bandından devir başlatın.'}
                                </p>
                            </div>
                        )}
                        {filtreliRaporlar.map(r => {
                            const pct = parseFloat(asimPct(r));
                            const kilitli = r.rapor_durumu === 'kilitlendi';
                            return (
                                <div key={r.id}
                                    onClick={() => raporSec(r)}
                                    style={{ background: secilenRapor?.id === r.id ? '#ecfdf5' : 'white', border: '2px solid', borderColor: secilenRapor?.id === r.id ? '#047857' : kilitli ? '#0f172a' : '#f1f5f9', borderRadius: 12, padding: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: secilenRapor?.id === r.id ? '0 4px 16px rgba(4,120,87,0.15)' : 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', gap: 6, marginBottom: '0.375rem' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 4 }}>
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                            <div style={{ fontWeight: 900, color: pct > 0 ? '#ef4444' : '#10b981', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} %{Math.abs(pct)}
                                            </div>
                                            {/* Eylem butonları */}
                                            {!kilitli && (
                                                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => duzenleAc(r)}
                                                        style={{ background: '#eff6ff', border: 'none', color: '#2563eb', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>
                                                        <Edit2 size={11} style={{ display: 'inline', marginRight: 2 }} />Düzenle
                                                    </button>
                                                    <button disabled={islemdeId === 'sil_' + r.id} onClick={() => raporSil(r)}
                                                        style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: 6, cursor: islemdeId === 'sil_' + r.id ? 'wait' : 'pointer', fontSize: '0.7rem', opacity: islemdeId === 'sil_' + r.id ? 0.5 : 1 }}>
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginTop: '0.625rem' }}>
                                        <div style={{ background: '#f8fafc', borderRadius: 6, padding: '5px 10px' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>HEDEF</div>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>₺{parseFloat(r.hedeflenen_maliyet_tl || 0).toFixed(2)}</div>
                                        </div>
                                        <div style={{ background: pct > 10 ? '#fef2f2' : '#f0fdf4', borderRadius: 6, padding: '5px 10px' }}>
                                            <div style={{ fontSize: '0.6rem', color: pct > 10 ? '#dc2626' : '#059669', fontWeight: 700 }}>GERÇEK TOPLAM</div>
                                            <div style={{ fontWeight: 800, color: pct > 10 ? '#dc2626' : '#059669', fontSize: '0.88rem' }}>₺{parseFloat(r.gerceklesen_maliyet_tl || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SEÇİLEN RAPOR DETAY */}
                {secilenRapor && (
                    <div style={{ flex: '1.5 1 400px', background: 'white', border: '2px solid #047857', borderRadius: 16, padding: '1.25rem', alignSelf: 'flex-start', position: 'sticky', top: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontWeight: 900, color: '#0f172a', margin: 0, fontSize: '1rem' }}>📊 Rapor Detayı</h2>
                            <button onClick={() => setSecilenRapor(null)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1rem' }}>
                            {[
                                { label: 'Hedeflenen Maliyet', val: `₺${parseFloat(secilenRapor.hedeflenen_maliyet_tl || 0).toFixed(2)}`, color: '#374151' },
                                { label: 'Gerçekleşen Maliyet', val: `₺${parseFloat(secilenRapor.gerceklesen_maliyet_tl || 0).toFixed(2)}`, color: parseFloat(secilenRapor.fark_tl) > 0 ? '#dc2626' : '#059669' },
                                { label: 'Fark (Üretilen-Hedef)', val: `₺${parseFloat(secilenRapor.fark_tl || 0).toFixed(2)}`, color: parseFloat(secilenRapor.fark_tl || 0) > 0 ? '#dc2626' : '#059669' },
                                { label: 'Birim Maliyet/Adet', val: `₺${birimMaliyet(secilenRapor)}`, color: '#D4AF37' },
                                { label: 'Üretilen Adet', val: secilenRapor.net_uretilen_adet, color: '#059669' },
                                { label: 'Zayiat', val: `${secilenRapor.zayiat_adet} adet`, color: '#ef4444' },
                            ].map((m, i) => (
                                <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{m.label}</div>
                                    <div style={{ fontWeight: 900, color: m.color, fontSize: '0.95rem', marginTop: 2 }}>{m.val}</div>
                                </div>
                            ))}
                        </div>

                        {secilenRapor.notlar && (
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: '1rem', fontSize: '0.82rem', color: '#92400e' }}>
                                📝 {secilenRapor.notlar}
                            </div>
                        )}

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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {secilenRapor.rapor_durumu === 'taslak' && (
                                <button disabled={islemdeId === secilenRapor.id} onClick={() => durumGuncelle(secilenRapor.id, 'sef_onay_bekliyor')}
                                    style={{ padding: '10px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: islemdeId === secilenRapor.id ? 'wait' : 'pointer', opacity: islemdeId === secilenRapor.id ? 0.5 : 1 }}>
                                    {islemdeId === secilenRapor.id ? '...' : '📤 Şef Onayına Gönder'}
                                </button>
                            )}
                            {secilenRapor.rapor_durumu === 'sef_onay_bekliyor' && (
                                <button disabled={islemdeId === secilenRapor.id} onClick={() => durumGuncelle(secilenRapor.id, 'onaylandi')}
                                    style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: islemdeId === secilenRapor.id ? 'wait' : 'pointer', opacity: islemdeId === secilenRapor.id ? 0.5 : 1 }}>
                                    {islemdeId === secilenRapor.id ? '...' : '✅ Şef Onayı Ver'}
                                </button>
                            )}
                            {secilenRapor.rapor_durumu === 'onaylandi' && (
                                <button disabled={islemdeId === 'devir_' + secilenRapor.id} onClick={() => devirKapat(secilenRapor)}
                                    style={{ padding: '10px', background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: islemdeId === 'devir_' + secilenRapor.id ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: islemdeId === 'devir_' + secilenRapor.id ? 0.5 : 1 }}>
                                    <Lock size={16} /> {islemdeId === 'devir_' + secilenRapor.id ? 'Kilitleniyor...' : 'Kilitle & 2. Birime Devret'}
                                </button>
                            )}
                            {secilenRapor.rapor_durumu === 'kilitlendi' && (
                                <div style={{ padding: '10px', background: '#0f172a', color: '#34d399', borderRadius: 10, fontWeight: 800, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Lock size={16} /> KİLİTLİ — 2. BİRİMDE
                                </div>
                            )}
                            {secilenRapor.rapor_durumu !== 'kilitlendi' && (
                                <button onClick={() => duzenleAc(secilenRapor)}
                                    style={{ padding: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <Edit2 size={13} /> Zayiat / Hedef / Not Düzenle
                                </button>
                            )}
                            {/* [A-04] Yazdır / PDF */}
                            <button
                                onClick={() => window.print()}
                                style={{ padding: '8px', background: '#f8fafc', border: '2px solid #e2e8f0', color: '#374151', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                🖨️ Raporu Yazdır / PDF
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DÜZENLE MODAL */}
            {duzenleModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontWeight: 900, color: '#0f172a', margin: 0 }}>✏️ Rapor Düzenle</h3>
                            <button onClick={() => setDuzenleModal(null)} style={{ background: '#f1f5f9', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', color: '#64748b', fontWeight: 700 }}>✕</button>
                        </div>
                        <div style={{ background: '#ecfdf5', borderRadius: 8, padding: '8px 14px', marginBottom: '1rem', fontSize: '0.82rem', fontWeight: 700, color: '#065f46' }}>
                            📁 {duzenleModal.model_kodu || duzenleModal.id?.slice(0, 8)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>Zayiat Adet</label>
                                <input type="number" min="0" value={duzenleForm.zayiat_adet}
                                    onChange={e => setDuzenleForm({ ...duzenleForm, zayiat_adet: e.target.value })}
                                    style={inp} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>Hedeflenen Maliyet (₺)</label>
                                <input type="number" step="0.01" min="0" value={duzenleForm.hedeflenen_maliyet_tl}
                                    onChange={e => setDuzenleForm({ ...duzenleForm, hedeflenen_maliyet_tl: e.target.value })}
                                    placeholder="0.00" style={inp} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>Notlar</label>
                                <textarea rows={3} maxLength={300} value={duzenleForm.notlar}
                                    onChange={e => setDuzenleForm({ ...duzenleForm, notlar: e.target.value })}
                                    placeholder="İç not, açıklama..." style={{ ...inp, resize: 'vertical' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                            <button onClick={() => setDuzenleModal(null)} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                            <button onClick={duzenleKaydet} disabled={loading}
                                style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#d97706', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                                {loading ? '...' : '✅ Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
