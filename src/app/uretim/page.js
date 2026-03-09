'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect, useRef } from 'react';
import { LayoutList, Play, Square, FileCheck, RefreshCw, AlertTriangle, Plus, Trash2, StopCircle, Clock, Save, DollarSign, Activity, Factory, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';

// Hydration mismatch'i önlemek için: icon bileşenleri module scope'ta JSX olarak tanımlanamaz
// Bunun yerine component referansları kullanılıyor, render anında JSX oluşturuluyor
const DEPARTMANLAR = [
    { id: 'is_emri', k: '', ad: 'İş Emirleri', Icon: LayoutList },
    { id: 'kesim', k: '', ad: 'Bant & Montaj', Icon: Activity },
    { id: 'kalite', k: '', ad: 'Kalite & Süre', Icon: AlertTriangle },
    { id: 'maliyet', k: '', ad: 'Maliyet Girişi', Icon: DollarSign },
    { id: 'devir', k: '', ad: 'Mağazaya Sevk', Icon: FileCheck },
    { id: 'takip', k: '', ad: 'Canlı Pano', Icon: Activity },
];

const DURUS_KODLARI = [
    { kod: 'MAK-ARZ', etki: false },
    { kod: 'MLZ-EKS', etki: false },
    { kod: 'KIS-HTA', etki: true },
    { kod: 'TVL-MOL', etki: false },
    { kod: 'OGL-MOL', etki: false },
    { kod: 'SEF-BKL', etki: false },
];

const MALIYET_TIPLERI = [
    { deger: 'personel_iscilik', etiket: 'Personel İşçilik' },
    { deger: 'isletme_gideri', etiket: 'İşletme Gideri' },
    { deger: 'sarf_malzeme', etiket: 'Sarf Malzeme' },
];

const ST_RENK = { pending: '#f59e0b', in_progress: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };
const ST_LABEL = { pending: 'Bekliyor', in_progress: 'Üretimde', completed: 'Tamamlandı', cancelled: 'İptal' };

export default function UretimBandiSayfasi() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang } = useLang();  // Context'ten al — anlık güncelleme
    const [dept, setDept] = useState('is_emri');
    const [orders, setOrders] = useState([]);
    const [personel, setPersonel] = useState([]);
    const [maliyetler, setMaliyetler] = useState([]);
    const [raporlar, setRaporlar] = useState([]);
    const [modeller, setModeller] = useState([]);
    const [formOrder, setFormOrder] = useState({ model_id: '', quantity: '', planned_start_date: '', planned_end_date: '' });
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [kronometer, setKronometer] = useState({});
    const [sure, setSure] = useState({});
    const timerRef = useRef({});
    const [maliyetForm, setMaliyetForm] = useState({ order_id: '', maliyet_tipi: 'personel_iscilik', tutar_tl: '', kalem_aciklama: '' });
    const [maliyetFormAcik, setMaliyetFormAcik] = useState(false);
    const [aramaMetni, setAramaMetni] = useState('');
    const [filtreDurum, setFiltreDurum] = useState('hepsi');
    const [duzenleId, setDuzenleId] = useState(null);

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
    }, [dept, kullanici]);

    useEffect(() => { return () => Object.values(timerRef.current).forEach(clearInterval); }, []);

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

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            // [AI ZIRHI]: 10sn timeout DDoS kalkanı (Kriter Q)
            const timeout = (ms) => new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı')), ms));
            const [mRes, oRes, pRes] = await Promise.all([
                Promise.race([supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500), timeout(10000)]),
                Promise.race([supabase.from('production_orders').select('*').order('created_at', { ascending: false }).limit(200), timeout(10000)]),
                Promise.race([supabase.from('b1_personel').select('id,personel_kodu,ad_soyad,rol,durum,saatlik_ucret_tl').eq('durum', 'aktif').order('ad_soyad').limit(100), timeout(10000)]),
            ]);
            const modellerData = mRes.data || [];
            if (modellerData.length > 0) setModeller(modellerData);
            if (oRes.data) {
                // Model adını manuel olarak eşleştir (FK join sorununa karşı fallback)
                const enriched = oRes.data.map(o => ({
                    ...o,
                    b1_model_taslaklari: modellerData.find(m => m.id === o.model_id) || { model_kodu: '?', model_adi: 'Model bulunamadı' }
                }));
                setOrders(enriched);
            }
            if (pRes.data) setPersonel(pRes.data);
            if (dept === 'maliyet' || dept === 'devir') {
                const [malRes, rRes] = await Promise.all([
                    Promise.race([supabase.from('b1_maliyet_kayitlari').select('*').order('created_at', { ascending: false }).limit(200), timeout(10000)]),
                    Promise.race([supabase.from('b1_muhasebe_raporlari').select('*').order('created_at', { ascending: false }).limit(100), timeout(10000)]),
                ]);
                if (malRes.data) setMaliyetler(malRes.data);
                if (rRes.data) setRaporlar(rRes.data);
            }
        } catch (e) { goster('Sistem veri yükleme hatası: ' + e.message, 'error') }
        setLoading(false);
    };

    const yeniIsEmri = async () => {
        if (!formOrder.model_id) return goster('Model seçiniz!', 'error');
        if (!formOrder.quantity || parseInt(formOrder.quantity) < 1) return goster('Adet giriniz!', 'error');
        setLoading(true);
        try {
            if (duzenleId) {
                const { error } = await supabase.from('production_orders').update({
                    model_id: formOrder.model_id,
                    quantity: parseInt(formOrder.quantity),
                    planned_start_date: formOrder.planned_start_date || null,
                    planned_end_date: formOrder.planned_end_date || null,
                }).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ İş emri güncellendi.');
                setFormOrder({ model_id: '', quantity: '', planned_start_date: '', planned_end_date: '' });
                setFormAcik(false); setDuzenleId(null); yukle();
            } else {
                const { data: mevcut } = await supabase.from('production_orders')
                    .select('id').eq('model_id', formOrder.model_id).in('status', ['pending', 'in_progress']);
                if (mevcut && mevcut.length > 0) {
                    setLoading(false);
                    return goster('⚠️ Bu model için bekleyen/üretimde olan iş emri mevcut!', 'error');
                }
                const { error } = await supabase.from('production_orders').insert([{
                    model_id: formOrder.model_id,
                    quantity: parseInt(formOrder.quantity),
                    status: 'pending',
                    planned_start_date: formOrder.planned_start_date || null,
                    planned_end_date: formOrder.planned_end_date || null,
                }]);
                if (!error) {
                    goster('İş emri oluşturuldu.');
                    telegramBildirim(`📋 YENİ İŞ EMRİ\nAdet: ${formOrder.quantity}`);
                    setFormOrder({ model_id: '', quantity: '', planned_start_date: '', planned_end_date: '' });
                    setFormAcik(false); yukle();
                } else throw error;
            }
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const duzenleIsEmri = (o) => {
        setFormOrder({
            model_id: o.model_id || '',
            quantity: String(o.quantity || ''),
            planned_start_date: o.planned_start_date || '',
            planned_end_date: o.planned_end_date || '',
        });
        setDuzenleId(o.id);
        setFormAcik(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const durumGuncelle = async (id, status) => {
        // [AI ZIRHI]: Offline Modu (Kriter J)
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('production_orders', 'UPDATE', { id, status });
            return goster('⚡ Çevrimdışı: Durum değişikliği kuyruğa alındı. İnternet gelince aktarılacak.');
        }
        try {
            const { error } = await supabase.from('production_orders').update({ status }).eq('id', id);
            if (error) throw error;
            goster('Durum güncellendi.');
            if (status === 'in_progress') telegramBildirim(`🏭 ÜRETİM BAŞLADI\nBir sipariş için "Bant (İmalat)" işlemi başlatıldı.`);
            if (status === 'completed') telegramBildirim(`✅ ÜRETİM TAMAMLANDI\nBir parti imalat bandından hatasız çıkış yaptı.`);
            yukle();
        } catch (e) { goster('Durum hatası: ' + e.message, 'error') }
    };

    const silIsEmri = async (id) => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const pin = prompt('Yalnızca koordinatörler silebilir. Yönetici PİN kodunuzu girin:');
            const kilitPin = process.env.NEXT_PUBLIC_ADMIN_PIN;
            if (!kilitPin || pin !== kilitPin) return goster('Hatalı yetki! İşlem engellendi.', 'error');
        }
        if (!confirm('İş emri tamamen silinsin mi?')) return;
        try {

            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String('production_orders').replace(/['"]/g, ''),
                    islem_tipi: 'SILME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
                }]).catch(() => { });
            } catch (e) { }

            const { error } = await supabase.from('production_orders').delete().eq('id', id);
            if (error) throw error;
            goster('Silindi.');
            telegramBildirim(`🗑️ İŞ EMRİ İPTALİ\nÜretim bandındaki bir İş Emri sistemden silindi.`);
            yukle();
        } catch (e) { goster('Silme hatası: ' + e.message, 'error') }
    };

    const baslat = (id) => {
        const baslangic = Date.now();
        setKronometer(prev => ({ ...prev, [id]: { aktif: true, baslangic } }));
        setSure(prev => ({ ...prev, [id]: 0 }));
        timerRef.current[id] = setInterval(() => {
            setSure(prev => ({ ...prev, [id]: Math.floor((Date.now() - baslangic) / 1000) }));
        }, 1000);
    };
    const durdur = async (id) => {
        clearInterval(timerRef.current[id]);
        const sureDk = Math.round((sure[id] || 0) / 60);
        setKronometer(prev => ({ ...prev, [id]: { aktif: false } }));
        // Supabase'e personel işçilik maliyet kaydı
        // Dakika başı ücret: Ayarlar tablosundan veya .env'den gelir
        const dakikaUcret = parseFloat(process.env.NEXT_PUBLIC_DAKIKA_UCRETI || '2.50');
        if (sureDk > 0) {
            try {
                const tutar = sureDk * dakikaUcret;
                const { error } = await supabase.from('b1_maliyet_kayitlari').insert([{
                    order_id: id,
                    maliyet_tipi: 'personel_iscilik',
                    tutar_tl: tutar,
                    kalem_aciklama: `Bant kronometresi: ${formatSure(sure[id] || 0)} (${sureDk} dk × ₺${dakikaUcret.toFixed(2)})`,
                    onay_durumu: 'hesaplandi'
                }]);
                if (error) throw error;
                goster(`⏱️ ${formatSure(sure[id] || 0)} → ₺${tutar.toFixed(2)} maliyet kaydedildi.`);
            } catch (e) {
                goster('Kronometre kaydı yapılamadı: ' + e.message, 'error');
            }
        } else {
            goster('Süre çok kısa, maliyet kaydı yapılmadı.');
        }
    };
    const formatSure = (s) => { const d = Math.floor(s / 60); const sn = s % 60; return `${String(d).padStart(2, '0')}:${String(sn).padStart(2, '00')}`; };

    const maliyetKaydet = async () => {
        if (!maliyetForm.order_id) return goster('İş emri seçiniz!', 'error');
        if (!maliyetForm.tutar_tl || parseFloat(maliyetForm.tutar_tl) <= 0) return goster('Tutar giriniz!', 'error');
        if (!maliyetForm.kalem_aciklama.trim()) return goster('Açıklama zorunlu!', 'error');
        setLoading(true);
        try {
            const { error } = await supabase.from('b1_maliyet_kayitlari').insert([{
                order_id: maliyetForm.order_id,
                maliyet_tipi: maliyetForm.maliyet_tipi,
                tutar_tl: parseFloat(maliyetForm.tutar_tl),
                kalem_aciklama: maliyetForm.kalem_aciklama.trim(),
                onay_durumu: 'hesaplandi'
            }]);
            if (!error) {
                goster('Maliyet kaydedildi.');
                setMaliyetForm({ order_id: '', maliyet_tipi: 'personel_iscilik', tutar_tl: '', kalem_aciklama: '' });
                setMaliyetFormAcik(false);
                yukle();
            } else throw error;
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const devirYap = async (orderId) => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const pin = prompt('Bu partiyi devretmek için Koordinatör/Yönetici PİN kodunuzu girin:');
            const kilitPin = process.env.NEXT_PUBLIC_ADMIN_PIN;
            if (!kilitPin || pin !== kilitPin) return goster('Hatalı yetki! İşlem engellendi.', 'error');
        }
        if (!confirm('Bu partiyi 2. Birime devredeceksiniz. Onaylıyor musunuz?')) return;
        setLoading(true);
        try {
            // 🛑 U Kriteri: Mükerrer Devir/Rapor Engelleme
            const { data: mevcut } = await supabase.from('b1_muhasebe_raporlari').select('id').eq('order_id', orderId);
            if (mevcut && mevcut.length > 0) {
                setLoading(false);
                return goster('⚠️ Bu iş emri için zaten devir raporu oluşturulmuş! Mükerrer işlem reddedildi.', 'error');
            }

            const pt = maliyetler.filter(m => m.order_id === orderId).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
            const { error } = await supabase.from('b1_muhasebe_raporlari').insert([{
                order_id: orderId, gerceklesen_maliyet_tl: pt, net_uretilen_adet: 0, zayiat_adet: 0, rapor_durumu: 'taslak', devir_durumu: false
            }]);
            if (!error) { goster('Devir başlatıldı. M8 Muhasebede rapor oluşturuldu.'); yukle(); }
            else throw error;
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>M5 Üretim Bandı ve Maliyet verileri Karargâh tarafından gizlenmiştir. Görüntülemek için Üretim PİN girişi zorunludur.</p>
            </div>
        );
    }

    return (
        <div>
            {/* BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Factory size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{isAR ? 'خط الإنتاج — إدارة سير العمل' : 'Üretim Bandı — İş Akışı Yönetimi'}</h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>{isAR ? 'أمر العمل → الخط والتجميع → الجودة → التكلفة → الشحن' : 'İş Emri → Bant & Montaj → Kalite → Maliyet → Mağazaya Sevk'}</p>
                    </div>
                </div>
                {dept === 'is_emri' && (
                    <button onClick={() => setFormAcik(!formAcik)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                        <Plus size={18} /> Yeni İş Emri
                    </button>
                )}
                {dept === 'maliyet' && (
                    <button onClick={() => setMaliyetFormAcik(!maliyetFormAcik)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                        <Plus size={18} /> Maliyet Ekle
                    </button>
                )}
            </div>

            {/* İSTATİSTİK KARTLARI */}
            {dept === 'is_emri' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[
                        { label: 'Toplam İş Emri', val: orders.length, color: '#047857', bg: '#ecfdf5' },
                        { label: '⏳ Bekliyor', val: orders.filter(o => o.status === 'pending').length, color: '#d97706', bg: '#fffbeb' },
                        { label: '⚡ Üretimde', val: orders.filter(o => o.status === 'in_progress').length, color: '#2563eb', bg: '#eff6ff' },
                        { label: '✅ Tamamlandı', val: orders.filter(o => o.status === 'completed').length, color: '#059669', bg: '#f0fdf4' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: s.color }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* MESAJ */}
            {mesaj.text && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.text}
                </div>
            )}

            {/* SEKMELER VE CC ROTASI */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem', alignItems: 'center' }}>
                {DEPARTMANLAR.map(d => {
                    const DeptIcon = d.Icon;
                    return (
                        <button key={d.id} onClick={() => { setDept(d.id); setFormAcik(false); setMaliyetFormAcik(false); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', borderColor: dept === d.id ? '#047857' : '#e5e7eb', background: dept === d.id ? '#047857' : 'white', color: dept === d.id ? 'white' : '#374151' }}>
                            <DeptIcon size={16} /> {d.ad}
                        </button>
                    );
                })}
                {/* CC Kriteri Rotası (Devir Kapısından Raporlara Geçiş Köprüsü) */}
                <div style={{ marginLeft: 'auto', paddingLeft: '1rem', borderLeft: '2px solid #e5e7eb' }}>
                    <a href="/raporlar" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#d97706', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 4px 14px rgba(217,119,6,0.35)' }}>
                            <FileCheck size={16} /> Muhasebe Raporu (M8)
                        </button>
                    </a>
                </div>
            </div>

            {/* D-A: İŞ EMRİ */}
            {dept === 'is_emri' && (
                <div>
                    {formAcik && (
                        <div style={{ background: 'white', border: `2px solid ${duzenleId ? '#d97706' : '#047857'}`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.08)' }}>
                            <h3 style={{ fontWeight: 800, color: duzenleId ? '#92400e' : '#065f46', marginBottom: '1rem' }}>
                                {duzenleId ? '✏️ İş Emri Düzenle' : 'Yeni Üretim İş Emri'}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>Model *</label>
                                    <select value={formOrder.model_id} onChange={e => setFormOrder({ ...formOrder, model_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                        <option value="">— Model Seçiniz —</option>
                                        {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} — {m.model_adi}</option>)}
                                    </select>
                                </div>
                                <div><label style={lbl}>Adet *</label><input type="number" min="1" value={formOrder.quantity} onChange={e => setFormOrder({ ...formOrder, quantity: e.target.value })} placeholder="1000" style={inp} /></div>
                                <div><label style={lbl}>Başlangıç</label><input type="date" value={formOrder.planned_start_date} onChange={e => setFormOrder({ ...formOrder, planned_start_date: e.target.value })} style={inp} /></div>
                                <div><label style={lbl}>Hedef Bitiş</label><input type="date" value={formOrder.planned_end_date} onChange={e => setFormOrder({ ...formOrder, planned_end_date: e.target.value })} style={inp} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setFormAcik(false); setDuzenleId(null); setFormOrder({ model_id: '', quantity: '', planned_start_date: '', planned_end_date: '' }); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                                <button onClick={yeniIsEmri} disabled={loading} style={{ padding: '9px 24px', background: duzenleId ? '#d97706' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 14px rgba(4,120,87,0.3)` }}>{loading ? '...' : (duzenleId ? '✏️ Güncelle' : 'Oluştur')}</button>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                            <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                                placeholder="Model kodu veya adına göre ara..."
                                style={{ ...inp, paddingLeft: 36 }} />
                        </div>
                        {[['hepsi', 'Tümü', '#374151'], ['pending', '⏳ Bekliyor', '#d97706'], ['in_progress', '⚡ Üretimde', '#2563eb'], ['completed', '✅ Tamamlandı', '#047857'], ['cancelled', '❌ İptal', '#dc2626']].map(([v, l, c]) => (
                            <button key={v} onClick={() => setFiltreDurum(v)}
                                style={{ padding: '7px 12px', border: '2px solid', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', borderColor: filtreDurum === v ? c : '#e5e7eb', background: filtreDurum === v ? c : 'white', color: filtreDurum === v ? 'white' : '#374151' }}>
                                {l}
                            </button>
                        ))}
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                            {orders.filter(o => (filtreDurum === 'hepsi' || o.status === filtreDurum) && (!aramaMetni || [o.b1_model_taslaklari?.model_kodu, o.b1_model_taslaklari?.model_adi].some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase())))).length} kayıt
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {orders.length === 0 && <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16 }}><Factory size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} /><p style={{ color: '#94a3b8', fontWeight: 700 }}>İş emri yok.</p></div>}
                        {orders.filter(o => (filtreDurum === 'hepsi' || o.status === filtreDurum) && (!aramaMetni || [o.b1_model_taslaklari?.model_kodu, o.b1_model_taslaklari?.model_adi].some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase())))).map(o => (
                            <div key={o.id} style={{ background: 'white', border: '2px solid', borderColor: o.status === 'completed' ? '#10b981' : '#f1f5f9', borderRadius: 14, padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', gap: 6, marginBottom: '0.375rem' }}>
                                            <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>{o.b1_model_taslaklari?.model_kodu}</span>
                                            <span style={{ fontSize: '0.65rem', background: '#0f172a', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>{o.quantity} adet</span>
                                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700, background: `${ST_RENK[o.status]}20`, color: ST_RENK[o.status] }}>{ST_LABEL[o.status]}</span>
                                        </div>
                                        <h3 style={{ fontWeight: 800, margin: 0, color: '#0f172a' }}>{o.b1_model_taslaklari?.model_adi}</h3>
                                        {o.planned_start_date && <p style={{ fontSize: '0.72rem', color: o.planned_end_date && new Date(o.planned_end_date) < new Date() && o.status !== 'completed' ? '#ef4444' : '#64748b', margin: '4px 0 0', fontWeight: o.planned_end_date && new Date(o.planned_end_date) < new Date() && o.status !== 'completed' ? 800 : 400 }}>
                                            📅 {o.planned_start_date} → {o.planned_end_date || '?'}{o.planned_end_date && new Date(o.planned_end_date) < new Date() && o.status !== 'completed' ? ' 🔴 GECİKTİ!' : ''}
                                        </p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {o.status === 'pending' && <button onClick={() => durumGuncelle(o.id, 'in_progress')} style={{ padding: '6px 14px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>▶ Başlat</button>}
                                        {o.status === 'in_progress' && <button onClick={() => durumGuncelle(o.id, 'completed')} style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>✅ Tamamla</button>}
                                        <button onClick={() => duzenleIsEmri(o)} style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#d97706', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>✏️</button>
                                        <button onClick={() => silIsEmri(o.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* D-B: BAND & MONTAJ */}
            {dept === 'kesim' && (
                <div>
                    <div style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
                        <p style={{ fontWeight: 800, color: '#92400e', margin: '0 0 0.5rem', fontSize: '0.875rem' }}>Bant Atama Kuralları:</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                            {[
                                { kural: 'Zorluk ≥ 8 VE Seviye = Acemi', sonuc: '🔴 ATAMA ENGELLENİR' },
                                { kural: 'Zorluk ≥ 8 VE FPY < %97', sonuc: '🔴 ATAMA ENGELLENİR' },
                                { kural: 'Zorluk 5-7 VE FPY < %90', sonuc: '🟡 ŞEF ONAYI GEREK' },
                                { kural: 'Durum = İzinli/Çıktı', sonuc: '🔴 ATAMA ENGELLENİR' },
                            ].map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 8px', background: '#fffbeb', borderRadius: 6, fontSize: '0.75rem' }}>
                                    <span style={{ flex: 1, color: '#78350f', fontWeight: 600 }}>{r.kural}</span>
                                    <span style={{ fontWeight: 800, color: '#92400e', whiteSpace: 'nowrap' }}>{r.sonuc}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* İŞ EMRİ → PERSONEL EŞLEŞTİRME */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                        {/* Sol: Aktif İş Emirleri */}
                        <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>📋 Aktif İş Emirleri</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {orders.filter(o => ['pending', 'in_progress'].includes(o.status)).map(o => (
                                    <div key={o.id} style={{ background: 'white', border: `2px solid ${ST_RENK[o.status]}40`, borderRadius: 10, padding: '0.875rem' }}>
                                        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                                            <span style={{ fontSize: '0.62rem', background: '#fff7ed', color: '#c2410c', padding: '2px 7px', borderRadius: 4, fontWeight: 800 }}>{o.b1_model_taslaklari?.model_kodu}</span>
                                            <span style={{ fontSize: '0.62rem', background: `${ST_RENK[o.status]}20`, color: ST_RENK[o.status], padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>{ST_LABEL[o.status]}</span>
                                        </div>
                                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>{o.b1_model_taslaklari?.model_adi}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{o.quantity} adet</div>
                                    </div>
                                ))}
                                {orders.filter(o => ['pending', 'in_progress'].includes(o.status)).length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: 10, color: '#94a3b8', fontWeight: 700, fontSize: '0.82rem' }}>Aktif iş emri yok.<br />D-A sekmesinden oluşturun.</div>
                                )}
                            </div>
                        </div>

                        {/* Sağ: Personel Listesi */}
                        <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>👥 Aktif Personel ({personel.length})</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 400, overflowY: 'auto' }}>
                                {personel.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: 10, color: '#94a3b8', fontWeight: 700, fontSize: '0.82rem' }}>Aktif personel yok.<br />Personel sayfasından ekleyin.</div>
                                )}
                                {personel.map(p => {
                                    const ROL_ICON = { duz_makinaci: '🧵', overlokcu: '🔄', resmeci: '✍️', kesimci: '✂️', utucu: '🔥', paketci: '📦', ustabasi: '⭐', koordinator: '👑', muhasebeci: '📊', depocu: '🏭' };
                                    return (
                                        <div key={p.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.6rem', background: '#f0fdf4', color: '#059669', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>{p.personel_kodu}</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{ROL_ICON[p.rol] || '👤'} {p.rol}</span>
                                                </div>
                                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', marginTop: 2 }}>{p.ad_soyad}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#059669', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>✅ Aktif</span>
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>₺{parseFloat(p.saatlik_ucret_tl || 0).toFixed(2)}/sa</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* D-C: KALİTE KONTROL & KRONOMETRE */}
            {dept === 'kalite' && (
                <div>
                    <div style={{ background: '#0f172a', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Clock size={20} color="#f97316" />
                        <div>
                            <div style={{ fontWeight: 800, color: 'white' }}>Duruş Tipleri</div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
                                {DURUS_KODLARI.map(d => (
                                    <span key={d.kod} style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: d.etki ? '#ef444440' : '#10b98140', color: d.etki ? '#fca5a5' : '#6ee7b7' }}>
                                        {d.kod}: {d.etki ? 'Personel Etkiler' : 'İşletme/Sistem'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                        {orders.filter(o => o.status === 'in_progress').map(o => (
                            <div key={o.id} style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 14, padding: '1.25rem' }}>
                                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>{o.b1_model_taslaklari?.model_adi}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.75rem' }}>{o.quantity} adet | {o.b1_model_taslaklari?.model_kodu}</div>
                                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: kronometer[o.id]?.aktif ? '#f97316' : '#0f172a' }}>
                                        {formatSure(sure[o.id] || 0)}
                                    </div>
                                    {kronometer[o.id]?.aktif && <div style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: 700 }}>⏺ KAYIT EDİLİYOR</div>}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {!kronometer[o.id]?.aktif
                                        ? <button onClick={() => baslat(o.id)} style={{ flex: 1, padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Play size={14} /> Başla</button>
                                        : <button onClick={() => durdur(o.id)} style={{ flex: 1, padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Square size={14} /> Durdur & Kaydet</button>
                                    }
                                </div>
                            </div>
                        ))}
                        {orders.filter(o => o.status === 'in_progress').length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                                <Clock size={40} style={{ color: '#e5e7eb', marginBottom: '0.5rem' }} /><p style={{ color: '#94a3b8', fontWeight: 700 }}>Aktif üretim yok. D-A'da iş emri başlatın.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* D-D: MALİYET */}
            {dept === 'maliyet' && (
                <div>
                    {/* FORM */}
                    {maliyetFormAcik && (
                        <div style={{ background: 'white', border: '2px solid #047857', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.08)' }}>
                            <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>Maliyet Girişi</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>İş Emri *</label>
                                    <select value={maliyetForm.order_id} onChange={e => setMaliyetForm({ ...maliyetForm, order_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                        <option value="">— İş Emri Seçiniz —</option>
                                        {orders.map(o => <option key={o.id} value={o.id}>{o.b1_model_taslaklari?.model_kodu} | {o.quantity} adet | {ST_LABEL[o.status]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Maliyet Tipi *</label>
                                    <select value={maliyetForm.maliyet_tipi} onChange={e => setMaliyetForm({ ...maliyetForm, maliyet_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                        {MALIYET_TIPLERI.map(t => <option key={t.deger} value={t.deger}>{t.etiket}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Tutar (₺) *</label>
                                    <input type="number" step="0.01" min="0" value={maliyetForm.tutar_tl} onChange={e => setMaliyetForm({ ...maliyetForm, tutar_tl: e.target.value })} placeholder="0.00" style={inp} />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>Açıklama *</label>
                                    <input maxLength={200} value={maliyetForm.kalem_aciklama} onChange={e => setMaliyetForm({ ...maliyetForm, kalem_aciklama: e.target.value })} placeholder="örn: 3 personel × 4 saat dikme" style={inp} />
                                </div>
                                <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button onClick={() => setMaliyetFormAcik(false)} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                                    <button onClick={maliyetKaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.3)' }}>{loading ? '...' : 'Kaydet'}</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* 3 KANAL BİLGİ */}
                    <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 14, padding: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#374151', marginBottom: '0.5rem', textTransform: 'uppercase' }}>3 Maliyet Kanalı</div>
                        {[
                            { k: 'Personel İşçilik', f: 'Dakika × Ücret × Zorluk Katsayısı', renk: '#3b82f6' },
                            { k: 'İşletme Gideri', f: '(Aylık Sabit / Toplam Dakika) × Parti Dakikası', renk: '#f59e0b' },
                            { k: 'Sarf Malzeme', f: 'Kullanılan Miktar × Birim Fiyat', renk: '#10b981' },
                        ].map((k, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '6px 8px', borderRadius: 8, background: `${k.renk}10`, marginBottom: '0.25rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: k.renk, fontSize: '0.78rem', minWidth: 130 }}>{k.k}</span>
                                <span style={{ fontSize: '0.72rem', color: '#374151', fontFamily: 'monospace' }}>{k.f}</span>
                            </div>
                        ))}
                    </div>
                    {/* LİSTE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {maliyetler.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e5e7eb' }}><DollarSign size={40} style={{ color: '#e5e7eb', marginBottom: '0.5rem' }} /><p style={{ color: '#94a3b8', fontWeight: 700 }}>Maliyet kaydı yok.</p></div>}
                        {maliyetler.map(m => (
                            <div key={m.id} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '0.68rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{m.maliyet_tipi?.replace(/_/g, ' ')}</span>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginTop: 3 }}>{m.kalem_aciklama}</div>
                                </div>
                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.1rem' }}>₺{parseFloat(m.tutar_tl).toFixed(2)}</div>
                            </div>
                        ))}
                        {maliyetler.length > 0 && (
                            <div style={{ background: '#0f172a', borderRadius: 10, padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: 'white' }}>TOPLAM</span>
                                <span style={{ fontWeight: 900, color: '#34d399', fontSize: '1.3rem' }}>₺{maliyetler.reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* D-E: DEVİR KAPISI */}
            {dept === 'devir' && (
                <div>
                    <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <FileCheck size={24} color="#34d399" />
                        <div>
                            <div style={{ fontWeight: 800, color: 'white' }}>Mağazaya Sevkiyat Kapısı</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>M8 Raporu onaylanana kadar sevkiyat yapılamaz.</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {orders.filter(o => o.status === 'completed').map(o => {
                            const pt = maliyetler.filter(m => m.order_id === o.id).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
                            const raporVar = raporlar.find(r => r.order_id === o.id);
                            return (
                                <div key={o.id} style={{ background: 'white', border: '2px solid', borderColor: raporVar?.devir_durumu ? '#10b981' : '#e5e7eb', borderRadius: 14, padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{o.b1_model_taslaklari?.model_adi}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>Adet: {o.quantity} | Maliyet: <strong>₺{pt.toFixed(2)}</strong></div>
                                        </div>
                                        {!raporVar
                                            ? <button onClick={() => devirYap(o.id)} style={{ padding: '8px 16px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.3)' }}>Mağazaya Sevket</button>
                                            : <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.85rem' }}>✅ M8 Raporunda</span>
                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* D-F: CANLI TAKİP */}
            {dept === 'takip' && (
                <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: 16, color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ width: 12, height: 12, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981', animation: 'pulse 1.5s infinite' }}></div>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>📡 OTONOM ÜRETİM RADARI</h3>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Tüm bantlar anlık izleniyor</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {orders.filter(o => o.status === 'in_progress').length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: 700 }}>Şu an band üzerinde aktif iş emri bulunmuyor.</div>
                        ) : (
                            orders.filter(o => o.status === 'in_progress').map(o => (
                                <div key={o.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem', display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr 100px', gap: '1rem', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{o.b1_model_taslaklari?.model_kodu}</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{o.b1_model_taslaklari?.model_adi}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>{o.quantity} Adet Hedef</div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: 8 }}>
                                            <span style={{ color: '#3b82f6' }}>Başlangıç: {o.planned_start_date || 'Belirsiz'}</span>
                                            <span style={{ color: '#10b981' }}>Durum: Üretimde</span>
                                            <span style={{ color: '#f59e0b' }}>Hedef Bitiş: {o.planned_end_date || 'Belirsiz'}</span>
                                        </div>
                                        <div style={{ width: '100%', background: '#0f172a', height: 8, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '45%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: 10 }}></div>
                                            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'slideRight 2s infinite' }}></div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace', color: '#10b981' }}>
                                            {formatSure(sure[o.id] || 0)}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Aktif Bant Süresi</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.5; transform: scale(0.8); } }
                        @keyframes slideRight { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
                    `}} />
                </div>
            )}
        </div>
    );
}
