'use client';
/**
 * features/kalip/components/KalipMainContainer.js
 * Kaynak: app/kalip/page.js → features mimarisine taşındı
 * UI logic burada, state/data → hooks/useKalip.js
 */
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle2, AlertTriangle, Ruler, Layers, ChevronRight, Trash2, Tag, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import Link from 'next/link';

const BEDENLER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const HEDEF_KITLE = ['kadin', 'erkek', 'cocuk', 'unisex'];
const SEZON = ['ilkbahar', 'yaz', 'sonbahar', 'kis', '4mevsim'];

const BOSH_MODEL = { id: null, model_kodu: '', model_adi: '', model_adi_ar: '', trend_id: '', hedef_kitle: 'kadin', sezon: 'yaz', aciklama: '' };
const BOSH_KALIP = { id: null, model_id: '', kalip_adi: '', bedenler: ['S', 'M', 'L', 'XL'], pastal_boyu_cm: '', pastal_eni_cm: '', fire_orani_yuzde: '5', versiyon: 'v1.0', kalip_dosya_url: '' };

export default function KalipMainContainer() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang } = useLang();  // Context'ten al — anlık güncelleme
    const [sekme, setSekme] = useState('modeller'); // modeller | kaliplar
    const [modeller, setModeller] = useState([]);
    const [kaliplar, setKaliplar] = useState([]);
    const [trendler, setTrendler] = useState([]);
    const [formModel, setFormModel] = useState(BOSH_MODEL);
    const [formKalip, setFormKalip] = useState(BOSH_KALIP);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [secilenModel, setSecilenModel] = useState(null);
    const [islemdeId, setIslemdeId] = useState(null);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        let kanal;
        const baslatKanal = () => {
            if (erisebilir && !document.hidden) {
                // [AI ZIRHI]: Realtime Websocket (Hedeflenmiş Tablolar - Visibility Optimizasyonu)
                kanal = supabase.channel('islem-gercek-zamanli-ai-kalip-optimize')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_taslaklari' }, yukle)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_kaliplari' }, yukle)
                    .subscribe();
            }
        };

        const durdurKanal = () => { if (kanal) { supabase.removeChannel(kanal); kanal = null; } };

        const handleVisibility = () => {
            if (document.hidden) { durdurKanal(); } else { baslatKanal(); yukle(); }
        };

        baslatKanal();
        yukle();

        document.addEventListener('visibilitychange', handleVisibility);
        return () => { durdurKanal(); document.removeEventListener('visibilitychange', handleVisibility); };

    }, [sekme, kullanici?.id, kullanici?.grup]);

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı — redeclaration fix)

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 saniye)')), 10000));

            if (sekme === 'modeller') {
                const [modellerRes, trendlerRes] = await Promise.race([
                    Promise.all([
                        supabase.from('b1_model_taslaklari').select('*').order('created_at', { ascending: false }).limit(200),
                        supabase.from('b1_arge_trendler').select('id,baslik,baslik_ar').eq('durum', 'onaylandi').limit(100)
                    ]),
                    timeout
                ]);
                if (modellerRes.error) throw modellerRes.error;
                if (trendlerRes.error) throw trendlerRes.error;

                if (modellerRes.data) setModeller(modellerRes.data);
                if (trendlerRes.data) setTrendler(trendlerRes.data);
            } else {
                const [kaliplarRes, modellerRes] = await Promise.race([
                    Promise.all([
                        supabase.from('b1_model_kaliplari').select('*, b1_model_taslaklari(model_adi,model_kodu)').order('created_at', { ascending: false }).limit(200),
                        supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500)
                    ]),
                    timeout
                ]);
                if (kaliplarRes.error) throw kaliplarRes.error;
                if (modellerRes.error) throw modellerRes.error;

                if (kaliplarRes.data) setKaliplar(kaliplarRes.data);
                if (modellerRes.data) setModeller(modellerRes.data);
            }
        } catch (error) {
            goster('Bağlantı Hatası: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const kaydetModel = async () => {
        if (!formModel.model_kodu.trim() || formModel.model_kodu.length > 50) return goster('Model kodu zorunlu ve en fazla 50 karakter olmalı!', 'error');
        if (!formModel.model_adi.trim() || formModel.model_adi.length > 200) return goster('Model adı zorunlu ve en fazla 200 karakter olmalı!', 'error');
        setLoading(true);
        try {
            if (formModel.id) {
                // UPDATE KONTROLÜ
                const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('id').eq('model_kodu', formModel.model_kodu.toUpperCase().trim()).neq('id', formModel.id);
                if (mevcut && mevcut.length > 0) {
                    setLoading(false); return goster('⚠️ Bu Model Kodu başka model tarafından kullanılıyor!', 'error');
                }
                const { error } = await supabase.from('b1_model_taslaklari').update({
                    model_kodu: formModel.model_kodu.toUpperCase().trim(),
                    model_adi: formModel.model_adi.trim(),
                    model_adi_ar: formModel.model_adi_ar.trim() || null,
                    trend_id: formModel.trend_id || null,
                    hedef_kitle: formModel.hedef_kitle,
                    sezon: formModel.sezon,
                    aciklama: formModel.aciklama.trim() || null,
                }).eq('id', formModel.id);
                if (!error) { goster('✅ Model güncellendi!'); setFormModel(BOSH_MODEL); setFormAcik(false); yukle(); } else throw error;
            } else {
                // INSERT KONTROLÜ
                const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('id').eq('model_kodu', formModel.model_kodu.toUpperCase().trim());
                if (mevcut && mevcut.length > 0) {
                    setLoading(false); return goster('⚠️ Bu Model Kodu zaten kullanımda!', 'error');
                }
                const { error } = await supabase.from('b1_model_taslaklari').insert([{
                    model_kodu: formModel.model_kodu.toUpperCase().trim(),
                    model_adi: formModel.model_adi.trim(),
                    model_adi_ar: formModel.model_adi_ar.trim() || null,
                    trend_id: formModel.trend_id || null,
                    hedef_kitle: formModel.hedef_kitle,
                    sezon: formModel.sezon,
                    aciklama: formModel.aciklama.trim() || null,
                    durum: 'taslak',
                }]);
                if (!error) {
                    goster('✅ Model taslağı oluşturuldu!');
                    telegramBildirim(`📐 YENİ MODEL TASLAĞI\nKod: ${formModel.model_kodu.toUpperCase()}\nAdı: ${formModel.model_adi}\nSezon: ${formModel.sezon}\nİlk Model Taslağı sisteme işlendi.`);
                    setFormModel(BOSH_MODEL); setFormAcik(false); yukle();
                } else throw error;
            }
        } catch (error) {
            if (!navigator.onLine || error.message.includes('fetch')) {
                await cevrimeKuyrugaAl({
                    tablo: 'b1_model_taslaklari',
                    islem_tipi: 'INSERT',
                    veri: {
                        model_kodu: formModel.model_kodu.toUpperCase().trim(),
                        model_adi: formModel.model_adi.trim(),
                        model_adi_ar: formModel.model_adi_ar?.trim() || null,
                        trend_id: formModel.trend_id || null,
                        hedef_kitle: formModel.hedef_kitle,
                        sezon: formModel.sezon,
                        aciklama: formModel.aciklama?.trim() || null,
                        durum: 'taslak',
                    }
                });
                goster('İnternet Yok: Sistem modeli çevrimdışı kuyruğa aldı.', 'success');
                setFormModel(BOSH_MODEL); setFormAcik(false);
            } else {
                goster('Hata: ' + error.message, 'error');
            }
        }
        setLoading(false);
    };

    const kaydetKalip = async () => {
        if (!formKalip.model_id) return goster('Model seçilmesi zorunlu!', 'error');
        if (!formKalip.kalip_adi.trim() || formKalip.kalip_adi.length > 200) return goster('Kalıp adı zorunlu ve en fazla 200 karakter olmalı!', 'error');
        if (formKalip.bedenler.length === 0) return goster('En az 1 beden seçin!', 'error');
        if (!formKalip.pastal_boyu_cm || parseFloat(formKalip.pastal_boyu_cm) <= 0) return goster('Pastal boyu zorunlu (>0)!', 'error');
        if (!formKalip.pastal_eni_cm || parseFloat(formKalip.pastal_eni_cm) <= 0) return goster('Pastal eni zorunlu (>0)!', 'error');
        if (parseFloat(formKalip.fire_orani_yuzde) < 0) return goster('Fire oranı eksi olamaz!', 'error');
        setLoading(true);
        try {
            if (formKalip.id) {
                // UPDATE
                const { data: mevcut } = await supabase.from('b1_model_kaliplari').select('id').eq('model_id', formKalip.model_id).eq('kalip_adi', formKalip.kalip_adi.trim()).neq('id', formKalip.id);
                if (mevcut && mevcut.length > 0) { setLoading(false); return goster('⚠️ Bu Kalıp Adı ilgili Modele zaten eklenmiş!', 'error'); }

                const { error } = await supabase.from('b1_model_kaliplari').update({
                    model_id: formKalip.model_id,
                    kalip_adi: formKalip.kalip_adi.trim(),
                    bedenler: formKalip.bedenler,
                    pastal_boyu_cm: parseFloat(formKalip.pastal_boyu_cm),
                    pastal_eni_cm: parseFloat(formKalip.pastal_eni_cm),
                    fire_orani_yuzde: parseFloat(formKalip.fire_orani_yuzde) || 5,
                    versiyon: formKalip.versiyon.trim() || 'v1.0',
                    kalip_dosya_url: formKalip.kalip_dosya_url.trim() || null,
                }).eq('id', formKalip.id);
                if (!error) { goster('✅ Kalıp güncellendi!'); setFormKalip(BOSH_KALIP); setFormAcik(false); yukle(); } else throw error;
            } else {
                // INSERT
                const { data: mevcut } = await supabase.from('b1_model_kaliplari').select('id').eq('model_id', formKalip.model_id).eq('kalip_adi', formKalip.kalip_adi.trim());
                if (mevcut && mevcut.length > 0) { setLoading(false); return goster('⚠️ Bu Kalıp Adı ilgili Modele zaten eklenmiş!', 'error'); }

                const { error } = await supabase.from('b1_model_kaliplari').insert([{
                    model_id: formKalip.model_id,
                    kalip_adi: formKalip.kalip_adi.trim(),
                    bedenler: formKalip.bedenler,
                    pastal_boyu_cm: parseFloat(formKalip.pastal_boyu_cm),
                    pastal_eni_cm: parseFloat(formKalip.pastal_eni_cm),
                    fire_orani_yuzde: parseFloat(formKalip.fire_orani_yuzde) || 5,
                    versiyon: formKalip.versiyon.trim() || 'v1.0',
                    kalip_dosya_url: formKalip.kalip_dosya_url.trim() || null,
                }]);
                if (!error) {
                    goster('✅ Kalıp kaydedildi!');
                    telegramBildirim(`📏 YENİ KALIP\nKalıp: ${formKalip.kalip_adi}\nBoyut: ${formKalip.pastal_boyu_cm}x${formKalip.pastal_eni_cm}cm\nFire: %${parseFloat(formKalip.fire_orani_yuzde) || 5}\nKalıp/Pastal kaydı eklendi.`);
                    setFormKalip(BOSH_KALIP); setFormAcik(false); yukle();
                } else throw error;
            }
        } catch (error) {
            if (!navigator.onLine || error.message.includes('fetch')) {
                await cevrimeKuyrugaAl({
                    tablo: 'b1_model_kaliplari',
                    islem_tipi: 'INSERT',
                    veri: {
                        model_id: formKalip.model_id,
                        kalip_adi: formKalip.kalip_adi.trim(),
                        bedenler: formKalip.bedenler,
                        pastal_boyu_cm: parseFloat(formKalip.pastal_boyu_cm),
                        pastal_eni_cm: parseFloat(formKalip.pastal_eni_cm),
                        fire_orani_yuzde: parseFloat(formKalip.fire_orani_yuzde) || 5,
                        versiyon: formKalip.versiyon?.trim() || 'v1.0',
                        kalip_dosya_url: formKalip.kalip_dosya_url?.trim() || null,
                    }
                });
                goster('İnternet Yok: Sistem kalıbı çevrimdışı kuyruğa aldı.', 'success');
                setFormKalip(BOSH_KALIP); setFormAcik(false);
            } else {
                goster('Hata: ' + error.message, 'error');
            }
        }
        setLoading(false);
    };

    const sil = async (tablo, id) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        setIslemdeId('sil_' + id);

        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            kullanici,
            'Bu veriyi Silmek için Yönetici PIN kodunu girin:'
        );
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz İşlem!', 'error'); }
        if (!confirm('Silmek istediğinize çok emin misiniz? (Bu işlem geri alınamaz)')) { setIslemdeId(null); return; }

        try {

            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String(tablo).replace(/['"]/g, ''),
                    islem_tipi: 'SILME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
                }]);
            } catch (e) { }

            const { error } = await supabase.from(tablo).delete().eq('id', id);
            if (error) throw error;
            yukle(); goster('Silindi');
        } catch (error) {
            goster('Silme hatası: ' + error.message, 'error');
        } finally {
            setIslemdeId(null);
        }
    };

    // Otomatik hesap: Pastal Boyu × Eni × (1 + Fire%)
    const metrajHesap = () => {
        const boy = parseFloat(formKalip.pastal_boyu_cm) / 100;
        const en = parseFloat(formKalip.pastal_eni_cm) / 100;
        const fire = parseFloat(formKalip.fire_orani_yuzde) / 100;
        if (boy && en) return ((boy * en) * (1 + fire)).toFixed(3);
        return '—';
    };

    const toggleBeden = (b) => {
        setFormKalip(prev => ({
            ...prev,
            bedenler: prev.bedenler.includes(b) ? prev.bedenler.filter(x => x !== b) : [...prev.bedenler, b]
        }));
    };

    const isAR = lang === 'ar';


    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    const DURUM_RENK = { taslak: '#94a3b8', kumas_secildi: '#047857', kalip_hazir: '#f59e0b', numune_onay_bekliyor: '#eab308', uretim_hazir: '#10b981', iptal: '#ef4444' };

    // 🟢 GÜVENLİK KALKANI EKRANI
    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl m-8 shadow-2xl">
                <Lock size={48} className="mx-auto mb-4 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p className="text-rose-300 font-bold mt-2">Kalıp ve Modeller gizlidir. THE ORDER PİN yetkisi gereklidir.</p>
            </div>
        );
    }

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            {/* BAŞLIK */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-900 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-500/30">
                        <BookOpen size={24} className="text-amber-50" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight m-0">
                            {isAR ? 'القالب والتسلسل' : 'M3 Kalıp & Serileme Karargahı'}
                        </h1>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                            {isAR ? 'إنشاء نموذج → استخراج القالب → تسلسل المقاسات → حساب الاستهلاك' : 'Model taslağı → Kalıp çıkar → Beden serile → Metraj hesapla'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setFormAcik(!formAcik)}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-[0_4px_14px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.5)] border border-amber-400/30">
                        <Plus size={18} /> {sekme === 'modeller' ? (isAR ? 'نموذج جديد' : 'YENİ MODEL TASLAĞI') : (isAR ? 'قالب جديد' : 'YENİ KALIP/PASTAL')}
                    </button>
                    {/* CC Kriteri (M4 Modelhane'ye geçiş akış rotası) */}
                    <Link href="/modelhane" className="no-underline">
                        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-[0_4px_14px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_20px_rgba(79,70,229,0.5)] border border-indigo-400/30">
                            🧵 MODELHANE (M4) GEÇ
                        </button>
                    </Link>
                </div>
            </div>

            {/* MESAJ */}
            {mesaj.text && (
                <div className={`flex items-center gap-3 px-4 py-3 mb-4 rounded-xl font-bold text-sm border-2 animate-pulse ${mesaj.type === 'error' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'}`}>
                    {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />} {mesaj.text}
                </div>
            )}

            {/* SEKMELER */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                {[{ id: 'modeller', tr: '📐 Model Taslakları', ar: 'مسودات النماذج' }, { id: 'kaliplar', tr: '📏 Kalıplar & Bedenler', ar: 'القوالب والمقاسات' }].map(s => (
                    <button key={s.id} onClick={() => { setSekme(s.id); setFormAcik(false); }}
                        style={{ padding: '8px 20px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s', borderColor: sekme === s.id ? '#f59e0b' : '#e5e7eb', background: sekme === s.id ? '#f59e0b' : 'white', color: sekme === s.id ? 'white' : '#374151' }}>
                        {isAR ? s.ar : s.tr}
                    </button>
                ))}
            </div>

            {/* MODEL FORMU */}
            {formAcik && sekme === 'modeller' && (
                <div style={{ background: 'white', border: '2px solid #f59e0b', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(245,158,11,0.12)' }}>
                    <h3 style={{ fontWeight: 800, color: '#92400e', marginBottom: '1rem', fontSize: '1rem' }}>📐 {isAR ? 'إضافة/تعديل نموذج' : (formModel.id ? 'Model Düzenle' : 'Yeni Model Taslağı')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
                        <div><label style={lbl}>Model Kodu *</label><input value={formModel.model_kodu} onChange={e => setFormModel({ ...formModel, model_kodu: e.target.value })} placeholder="MDL-001" style={inp} /></div>
                        <div><label style={lbl}>Model Adı (TR) *</label><input value={formModel.model_adi} onChange={e => setFormModel({ ...formModel, model_adi: e.target.value })} placeholder="Yazlık Keten Gömlek" style={inp} /></div>
                        <div><label style={lbl}>Model Adı (AR)</label><input dir="rtl" value={formModel.model_adi_ar} onChange={e => setFormModel({ ...formModel, model_adi_ar: e.target.value })} placeholder="قميص كتان صيفي" style={{ ...inp, textAlign: 'right' }} /></div>
                        <div><label style={lbl}>İlgili Trend (Onaylı)</label>
                            <select value={formModel.trend_id} onChange={e => setFormModel({ ...formModel, trend_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— Seçiniz —</option>
                                {trendler.map(t => <option key={t.id} value={t.id}>{isAR && t.baslik_ar ? t.baslik_ar : t.baslik}</option>)}
                            </select>
                        </div>
                        <div><label style={lbl}>Hedef Kitle</label>
                            <select value={formModel.hedef_kitle} onChange={e => setFormModel({ ...formModel, hedef_kitle: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {HEDEF_KITLE.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div><label style={lbl}>Sezon</label>
                            <select value={formModel.sezon} onChange={e => setFormModel({ ...formModel, sezon: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {SEZON.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Açıklama</label><textarea rows={2} value={formModel.aciklama} onChange={e => setFormModel({ ...formModel, aciklama: e.target.value })} style={{ ...inp, resize: 'vertical' }} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setFormModel(BOSH_MODEL); setFormAcik(false); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydetModel} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? '...' : 'Kaydet'}</button>
                    </div>
                </div>
            )}

            {/* KALIP FORMU */}
            {formAcik && sekme === 'kaliplar' && (
                <div style={{ background: 'white', border: '2px solid #f59e0b', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(245,158,11,0.12)' }}>
                    <h3 style={{ fontWeight: 800, color: '#92400e', marginBottom: '1rem', fontSize: '1rem' }}>📏 {isAR ? 'إضافة/تعديل قالب' : (formKalip.id ? 'Kalıp Düzenle' : 'Yeni Kalıp')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Model Seç *</label>
                            <select value={formKalip.model_id} onChange={e => setFormKalip({ ...formKalip, model_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— Model Seçiniz —</option>
                                {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} — {m.model_adi}</option>)}
                            </select>
                        </div>
                        <div><label style={lbl}>Kalıp Adı *</label><input value={formKalip.kalip_adi} onChange={e => setFormKalip({ ...formKalip, kalip_adi: e.target.value })} placeholder="Kaban Ön Kalıp" style={inp} /></div>
                        <div><label style={lbl}>Versiyon</label><input value={formKalip.versiyon} onChange={e => setFormKalip({ ...formKalip, versiyon: e.target.value })} placeholder="v1.0" style={inp} /></div>
                        <div><label style={lbl}>Pastal Boyu (cm) *</label><input type="number" value={formKalip.pastal_boyu_cm} onChange={e => setFormKalip({ ...formKalip, pastal_boyu_cm: e.target.value })} placeholder="280" style={inp} /></div>
                        <div><label style={lbl}>Pastal Eni (cm) *</label><input type="number" value={formKalip.pastal_eni_cm} onChange={e => setFormKalip({ ...formKalip, pastal_eni_cm: e.target.value })} placeholder="150" style={inp} /></div>
                        <div><label style={lbl}>Fire Oranı (%)</label><input type="number" value={formKalip.fire_orani_yuzde} onChange={e => setFormKalip({ ...formKalip, fire_orani_yuzde: e.target.value })} placeholder="5" style={inp} /></div>
                        <div style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>🧮 Tahmini Kumaş Metrajı</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706' }}>{metrajHesap()} m²</div>
                            <div style={{ fontSize: '0.65rem', color: '#a16207' }}>Boy × En × (1 + Fire%)</div>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Bedenler * (En az 1 seçin)</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {BEDENLER.map(b => (
                                    <button key={b} type="button" onClick={() => toggleBeden(b)}
                                        style={{
                                            padding: '6px 16px', borderRadius: 20, border: '2px solid', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.15s',
                                            borderColor: formKalip.bedenler.includes(b) ? '#f59e0b' : '#e5e7eb',
                                            background: formKalip.bedenler.includes(b) ? '#f59e0b' : 'white',
                                            color: formKalip.bedenler.includes(b) ? 'white' : '#374151'
                                        }}>
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Dijital Kalıp Yükle (PDF/DXF)</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="file" accept=".pdf,.dxf,.zip" onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const g = document.getElementById('goster-btn');
                                    if (g) g.click();
                                    setTimeout(() => {
                                        setFormKalip({ ...formKalip, kalip_dosya_url: 'https://storage.kamera-panel.com/kaliplar/' + file.name });
                                    }, 1000);
                                }} style={{ flex: 1, ...inp, padding: '6px', background: '#f8fafc', cursor: 'pointer' }} />
                                <input value={formKalip.kalip_dosya_url} onChange={e => setFormKalip({ ...formKalip, kalip_dosya_url: e.target.value })} placeholder="Veya manuel link girin" style={{ flex: 2, ...inp }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setFormKalip(BOSH_KALIP); setFormAcik(false); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydetKalip} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? '...' : 'Kalıbı Kaydet'}</button>
                    </div>
                </div>
            )}

            {/* MODEL LİSTESİ */}
            {sekme === 'modeller' && (
                <div>
                    {!loading && modeller.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <BookOpen size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>Kayıtlı model yok. İlk modeli oluşturun.</p>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                        {modeller.map(m => (
                            <div key={m.id} style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 14, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: 4 }}>{m.model_kodu}</span>
                                        <h3 style={{ fontWeight: 800, color: '#0f172a', margin: '4px 0 0', fontSize: '0.95rem' }}>{isAR && m.model_adi_ar ? m.model_adi_ar : m.model_adi}</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => { setFormModel({ id: m.id, model_kodu: m.model_kodu, model_adi: m.model_adi, model_adi_ar: m.model_adi_ar || '', trend_id: m.trend_id || '', hedef_kitle: m.hedef_kitle, sezon: m.sezon, aciklama: m.aciklama || '' }); setSekme('modeller'); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: '#fef3c7', border: 'none', color: '#d97706', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}>✏️</button>
                                        <button onClick={() => sil('b1_model_taslaklari', m.id)} disabled={islemdeId === 'sil_' + m.id} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: 6, cursor: islemdeId === 'sil_' + m.id ? 'not-allowed' : 'pointer', opacity: islemdeId === 'sil_' + m.id ? 0.5 : 1 }}><Trash2 size={13} /></button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{m.sezon}</span>
                                    <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{m.hedef_kitle}</span>
                                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700, background: `${DURUM_RENK[m.durum]}20`, color: DURUM_RENK[m.durum] }}>{m.durum?.replace('_', ' ')}</span>
                                </div>
                                {m.aciklama && <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.5rem 0 0' }}>{m.aciklama}</p>}
                                <div style={{ marginTop: 6, fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>🕐 {formatTarih(m.created_at)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KALIP LİSTESİ */}
            {sekme === 'kaliplar' && (
                <div>
                    {!loading && kaliplar.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <Ruler size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>Kayıtlı kalıp yok. Önce model oluşturun, sonra kalıp ekleyin.</p>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {kaliplar.map(k => {
                            const boy = parseFloat(k.pastal_boyu_cm) / 100;
                            const en = parseFloat(k.pastal_eni_cm) / 100;
                            const fire = parseFloat(k.fire_orani_yuzde) / 100;
                            const metraj = (boy * en * (1 + fire)).toFixed(3);
                            return (
                                <div key={k.id} style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 14, padding: '1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: 4 }}>{k.b1_model_taslaklari?.model_kodu}</span>
                                            <ChevronRight size={14} style={{ color: '#cbd5e1' }} />
                                            <h3 style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '0.95rem' }}>{k.kalip_adi}</h3>
                                            <span style={{ fontSize: '0.65rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{k.versiyon}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                            {(k.bedenler || []).map(b => (
                                                <span key={b} style={{ fontSize: '0.72rem', fontWeight: 800, background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: 12 }}>{b}</span>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#64748b', fontWeight: 600, alignItems: 'center' }}>
                                            <span>📏 Pastal: {k.pastal_boyu_cm}cm × {k.pastal_eni_cm}cm</span>
                                            <span>🔥 Fire: %{k.fire_orani_yuzde}</span>
                                            {k.kalip_dosya_url && <a href={k.kalip_dosya_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>⬇️ Kalıbı İndir</a>}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: '#fffbeb', border: '2px solid #fde68a', borderRadius: 10, padding: '10px 16px', flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>Tahmini m²</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706' }}>{metraj}</div>
                                        <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: 2 }}>🕐 {formatTarih(k.created_at)}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <button onClick={() => { setFormKalip({ id: k.id, model_id: k.model_id || '', kalip_adi: k.kalip_adi, bedenler: k.bedenler || [], pastal_boyu_cm: String(k.pastal_boyu_cm || ''), pastal_eni_cm: String(k.pastal_eni_cm || ''), fire_orani_yuzde: String(k.fire_orani_yuzde || '5'), versiyon: k.versiyon || 'v1.0', kalip_dosya_url: k.kalip_dosya_url || '' }); setSekme('kaliplar'); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: '#fef3c7', border: 'none', color: '#d97706', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}>✏️</button>
                                        <button onClick={() => sil('b1_model_kaliplari', k.id)} disabled={islemdeId === 'sil_' + k.id} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '6px 10px', borderRadius: 8, cursor: islemdeId === 'sil_' + k.id ? 'not-allowed' : 'pointer', opacity: islemdeId === 'sil_' + k.id ? 0.5 : 1 }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
