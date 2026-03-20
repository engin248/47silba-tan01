'use client';
<<<<<<< HEAD
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle2, AlertTriangle, Ruler, ChevronRight, Trash2, Lock, Tag, Box, Layers, Scissors, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
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
<<<<<<< HEAD
    const [sekme, setSekme] = useState('modeller');
=======
    const { lang } = useLang();  // Context'ten al — anlık güncelleme
    const [sekme, setSekme] = useState('modeller'); // modeller | kaliplar
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    const [modeller, setModeller] = useState([]);
    const [kaliplar, setKaliplar] = useState([]);
    const [trendler, setTrendler] = useState([]);
    const [formModel, setFormModel] = useState(BOSH_MODEL);
    const [formKalip, setFormKalip] = useState(BOSH_KALIP);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
<<<<<<< HEAD
=======
    const [secilenModel, setSecilenModel] = useState(null);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    const [islemdeId, setIslemdeId] = useState(null);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        let kanal;
        const baslatKanal = () => {
            if (erisebilir && !document.hidden) {
<<<<<<< HEAD
=======
                // [AI ZIRHI]: Realtime Websocket (Hedeflenmiş Tablolar - Visibility Optimizasyonu)
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                kanal = supabase.channel('islem-gercek-zamanli-ai-kalip-optimize')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_taslaklari' }, yukle)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_kaliplari' }, yukle)
                    .subscribe();
            }
        };

        const durdurKanal = () => { if (kanal) { supabase.removeChannel(kanal); kanal = null; } };
<<<<<<< HEAD
        const handleVisibility = () => { if (document.hidden) { durdurKanal(); } else { baslatKanal(); yukle(); } };
=======

        const handleVisibility = () => {
            if (document.hidden) { durdurKanal(); } else { baslatKanal(); yukle(); }
        };
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

        baslatKanal();
        yukle();

        document.addEventListener('visibilitychange', handleVisibility);
        return () => { durdurKanal(); document.removeEventListener('visibilitychange', handleVisibility); };
<<<<<<< HEAD
    }, [sekme, kullanici?.id, kullanici?.grup]);

=======

    }, [sekme, kullanici?.id, kullanici?.grup]);

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı — redeclaration fix)

>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 saniye)')), 10000));

            if (sekme === 'modeller') {
                const [modellerRes, trendlerRes] = await Promise.race([
                    Promise.all([
                        supabase.from('b1_model_taslaklari').select('*').order('created_at', { ascending: false }).limit(200),
<<<<<<< HEAD
                        supabase.from('b1_arge_products').select('id,urun_adi').in('ai_satis_karari', ['ÇOK_SATAR', 'BİNGO']).limit(100)
=======
                        supabase.from('b1_arge_trendler').select('id,baslik,baslik_ar').eq('durum', 'onaylandi').limit(100)
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
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
<<<<<<< HEAD
                const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('id').eq('model_kodu', formModel.model_kodu.toUpperCase().trim()).neq('id', formModel.id);
                if (mevcut && mevcut.length > 0) { setLoading(false); return goster('⚠️ Bu Model Kodu başka model tarafından kullanılıyor!', 'error'); }
=======
                // UPDATE KONTROLÜ
                const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('id').eq('model_kodu', formModel.model_kodu.toUpperCase().trim()).neq('id', formModel.id);
                if (mevcut && mevcut.length > 0) {
                    setLoading(false); return goster('⚠️ Bu Model Kodu başka model tarafından kullanılıyor!', 'error');
                }
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
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
<<<<<<< HEAD
                const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('id').eq('model_kodu', formModel.model_kodu.toUpperCase().trim());
                if (mevcut && mevcut.length > 0) { setLoading(false); return goster('⚠️ Bu Model Kodu zaten kullanımda!', 'error'); }
=======
                // INSERT KONTROLÜ
                const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('id').eq('model_kodu', formModel.model_kodu.toUpperCase().trim());
                if (mevcut && mevcut.length > 0) {
                    setLoading(false); return goster('⚠️ Bu Model Kodu zaten kullanımda!', 'error');
                }
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
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
<<<<<<< HEAD
                    tablo: 'b1_model_taslaklari', islem_tipi: 'INSERT', veri: { ...formModel, model_kodu: formModel.model_kodu.toUpperCase().trim(), durum: 'taslak' }
                });
                goster('İnternet Yok: Sistem modeli çevrimdışı kuyruğa aldı.', 'success');
                setFormModel(BOSH_MODEL); setFormAcik(false);
            } else goster('Hata: ' + error.message, 'error');
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
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
<<<<<<< HEAD
                const { data: mevcut } = await supabase.from('b1_model_kaliplari').select('id').eq('model_id', formKalip.model_id).eq('kalip_adi', formKalip.kalip_adi.trim()).neq('id', formKalip.id);
                if (mevcut && mevcut.length > 0) { setLoading(false); return goster('⚠️ Bu Kalıp Adı ilgili Modele zaten eklenmiş!', 'error'); }
                const { error } = await supabase.from('b1_model_kaliplari').update({
                    model_id: formKalip.model_id, kalip_adi: formKalip.kalip_adi.trim(), bedenler: formKalip.bedenler,
                    pastal_boyu_cm: parseFloat(formKalip.pastal_boyu_cm), pastal_eni_cm: parseFloat(formKalip.pastal_eni_cm),
                    fire_orani_yuzde: parseFloat(formKalip.fire_orani_yuzde) || 5, versiyon: formKalip.versiyon.trim() || 'v1.0',
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                    kalip_dosya_url: formKalip.kalip_dosya_url.trim() || null,
                }).eq('id', formKalip.id);
                if (!error) { goster('✅ Kalıp güncellendi!'); setFormKalip(BOSH_KALIP); setFormAcik(false); yukle(); } else throw error;
            } else {
<<<<<<< HEAD
                const { data: mevcut } = await supabase.from('b1_model_kaliplari').select('id').eq('model_id', formKalip.model_id).eq('kalip_adi', formKalip.kalip_adi.trim());
                if (mevcut && mevcut.length > 0) { setLoading(false); return goster('⚠️ Bu Kalıp Adı ilgili Modele zaten eklenmiş!', 'error'); }
                const { error } = await supabase.from('b1_model_kaliplari').insert([{
                    model_id: formKalip.model_id, kalip_adi: formKalip.kalip_adi.trim(), bedenler: formKalip.bedenler,
                    pastal_boyu_cm: parseFloat(formKalip.pastal_boyu_cm), pastal_eni_cm: parseFloat(formKalip.pastal_eni_cm),
                    fire_orani_yuzde: parseFloat(formKalip.fire_orani_yuzde) || 5, versiyon: formKalip.versiyon.trim() || 'v1.0',
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                    kalip_dosya_url: formKalip.kalip_dosya_url.trim() || null,
                }]);
                if (!error) {
                    goster('✅ Kalıp kaydedildi!');
<<<<<<< HEAD
                    telegramBildirim(`📏 YENİ KALIP\nKalıp: ${formKalip.kalip_adi}\nBoyut: ${formKalip.pastal_boyu_cm}x${formKalip.pastal_eni_cm}cm\nKalıp kaydı eklendi.`);
=======
                    telegramBildirim(`📏 YENİ KALIP\nKalıp: ${formKalip.kalip_adi}\nBoyut: ${formKalip.pastal_boyu_cm}x${formKalip.pastal_eni_cm}cm\nFire: %${parseFloat(formKalip.fire_orani_yuzde) || 5}\nKalıp/Pastal kaydı eklendi.`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                    setFormKalip(BOSH_KALIP); setFormAcik(false); yukle();
                } else throw error;
            }
        } catch (error) {
            if (!navigator.onLine || error.message.includes('fetch')) {
<<<<<<< HEAD
                await cevrimeKuyrugaAl({ tablo: 'b1_model_kaliplari', islem_tipi: 'INSERT', veri: { ...formKalip } });
                goster('İnternet Yok: Sistem kalıbı çevrimdışı kuyruğa aldı.', 'success');
                setFormKalip(BOSH_KALIP); setFormAcik(false);
            } else goster('Hata: ' + error.message, 'error');
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        }
        setLoading(false);
    };

    const sil = async (tablo, id) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        setIslemdeId('sil_' + id);
<<<<<<< HEAD
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici, 'Silmek için Yönetici PIN kodu girin:');
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz İşlem!', 'error'); }
        if (!confirm('KESİN OLARAK SİLMEK İSTİYOR MUSUNUZ?')) { setIslemdeId(null); return; }

        try {
            await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: String(tablo), islem_tipi: 'SILME', kullanici_adi: 'M3 Yetkilisi', eski_veri: { durum: 'SILINDI' } }]);
            const { error } = await supabase.from(tablo).delete().eq('id', id);
            if (error) throw error;
            yukle(); goster('Başarıyla Silindi!');
        } catch (error) { goster('Silme hatası: ' + error.message, 'error'); } finally { setIslemdeId(null); }
    };

=======

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
            } catch (e) { console.error('[B0 LOG HATASI] Kalıphane:', e); }

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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    const metrajHesap = () => {
        const boy = parseFloat(formKalip.pastal_boyu_cm) / 100;
        const en = parseFloat(formKalip.pastal_eni_cm) / 100;
        const fire = parseFloat(formKalip.fire_orani_yuzde) / 100;
        if (boy && en) return ((boy * en) * (1 + fire)).toFixed(3);
        return '—';
    };

<<<<<<< HEAD
    const toggleBeden = (b) => setFormKalip(p => ({ ...p, bedenler: p.bedenler.includes(b) ? p.bedenler.filter(x => x !== b) : [...p.bedenler, b] }));

    const DURUM_RENK = { taslak: 'text-gray-400 bg-[#21262d]', kumas_secildi: 'text-emerald-400 bg-emerald-500/20', kalip_hazir: 'text-amber-400 bg-amber-500/20', numune_onay_bekliyor: 'text-blue-400 bg-blue-500/20', uretim_hazir: 'text-emerald-400 bg-emerald-500/20', iptal: 'text-rose-400 bg-rose-500/20' };

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 shadow-2xl rounded-2xl m-8 border-2 border-rose-900/50">
                <Lock size={48} className="mx-auto mb-4 text-rose-500" />
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">YETKİSİZ GİRİŞ (M3)</h2>
                <p className="text-rose-300 font-bold mt-2">Bu alan sadece tasarım mühendisleri ve kalıphaneye açıktır.</p>
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            </div>
        );
    }

    return (
<<<<<<< HEAD
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>

                {/* BAŞLIK */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#21262d] pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-900 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-500/30">
                            <BookOpen size={24} className="text-amber-50" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight m-0 uppercase">M3: Kalıp & Üretim Planlama</h1>
                            <p className="text-xs font-bold text-amber-300/80 mt-1 uppercase tracking-wider flex items-center gap-2">
                                <Ruler size={14} /> Kritik Aşama: Metraj hesaplamasını titizlikle yapın.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setFormAcik(!formAcik)} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg text-xs font-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center gap-2 uppercase tracking-widest">
                            <Plus size={16} /> {sekme === 'modeller' ? 'YENİ MODEL TASLAĞI' : 'YENİ KALIP & PASTAL'}
                        </button>
                        <Link href="/modelhane">
                            <button className="bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-white px-5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 uppercase tracking-widest">
                                M4 MODELHANE (DİKİM) <ChevronRight size={16} />
                            </button>
                        </Link>
                    </div>
                </div>

                {/* MESAJ */}
                {mesaj.text && (
                    <div className={`flex items-center gap-3 px-4 py-3 mb-6 rounded-lg font-bold text-xs uppercase tracking-widest border border-l-4 ${mesaj.type === 'error' ? 'border-rose-500/50 border-l-rose-500 bg-rose-500/10 text-rose-400' : 'border-emerald-500/50 border-l-emerald-500 bg-emerald-500/10 text-emerald-400'}`}>
                        {mesaj.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />} {mesaj.text}
                    </div>
                )}

                {/* KPI */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">Model Taslağı</span>
                        <div className="text-2xl font-black text-white mt-1">{modeller.length}</div>
                    </div>
                    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Onaylı Kalıp / Pastal</span>
                        <div className="text-2xl font-black text-white mt-1">{kaliplar.length}</div>
                    </div>
                    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Ortalama Beden Seti</span>
                        <div className="text-2xl font-black text-white mt-1">4.5 <span className="text-xs text-[#8b949e]">Beden/Model</span></div>
                    </div>
                    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Üretime Geçiş (M4)</span>
                        <div className="text-2xl font-black text-white mt-1">100%</div>
                    </div>
                </div>

                {/* SEKMELER */}
                <div className="flex gap-2 mb-6 border-b border-[#21262d] pb-2">
                    <button onClick={() => { setSekme('modeller'); setFormAcik(false); }} className={`px-5 py-2.5 rounded-t-lg text-xs font-black uppercase tracking-widest transition-colors ${sekme === 'modeller' ? 'bg-[#161b22] text-amber-500 border-t border-x border-[#30363d]' : 'text-[#8b949e] hover:text-white'}`}>
                        📐 MODEL TASLAKLARI
                    </button>
                    <button onClick={() => { setSekme('kaliplar'); setFormAcik(false); }} className={`px-5 py-2.5 rounded-t-lg text-xs font-black uppercase tracking-widest transition-colors ${sekme === 'kaliplar' ? 'bg-[#161b22] text-amber-500 border-t border-x border-[#30363d]' : 'text-[#8b949e] hover:text-white'}`}>
                        📏 KALIPLAR & BEDENLER
                    </button>
                </div>

                <div className="bg-[#1aa3]"></div>

                {/* MODEL FORMU */}
                {formAcik && sekme === 'modeller' && (
                    <div className="bg-[#121c1a] lg:bg-[#161b22] border border-amber-500/50 rounded-xl p-6 mb-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BookOpen size={120} /></div>
                        <h3 className="font-black text-amber-500 mb-4 text-xs uppercase tracking-widest">📐 {formModel.id ? 'Model Düzenle (Değişiklik M4\'ü Etkileyebilir!)' : 'Yeni Model Taslağı'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                            <div><label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">Model Kodu *</label><input className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={formModel.model_kodu} onChange={e => setFormModel({ ...formModel, model_kodu: e.target.value })} placeholder="MDL-001" /></div>
                            <div><label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">Model Adı *</label><input className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={formModel.model_adi} onChange={e => setFormModel({ ...formModel, model_adi: e.target.value })} placeholder="Yazlık Keten Gömlek" /></div>
                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">İlgili Trend (M1 İstihbaratı)</label>
                                <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={formModel.trend_id} onChange={e => setFormModel({ ...formModel, trend_id: e.target.value })}>
                                    <option value="">— M1 Trendlerinden Seç —</option>
                                    {trendler.map(t => <option key={t.id} value={t.id}>{t.urun_adi?.substring(0, 50)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">Hedef Kitle</label>
                                <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none uppercase" value={formModel.hedef_kitle} onChange={e => setFormModel({ ...formModel, hedef_kitle: e.target.value })}>
                                    {HEDEF_KITLE.map(h => <option key={h} value={h} className="uppercase">{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">Sezon</label>
                                <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none uppercase" value={formModel.sezon} onChange={e => setFormModel({ ...formModel, sezon: e.target.value })}>
                                    {SEZON.map(s => <option key={s} value={s} className="uppercase">{s}</option>)}
                                </select>
                            </div>
                            <div className="lg:col-span-3"><label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">Açıklama / Reçete Notları</label><textarea className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none min-h-[60px]" value={formModel.aciklama} onChange={e => setFormModel({ ...formModel, aciklama: e.target.value })} /></div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6 border-t border-[#30363d] pt-4 relative z-10">
                            <button onClick={() => { setFormModel(BOSH_MODEL); setFormAcik(false); }} className="px-5 py-2 rounded-lg font-bold text-xs bg-[#21262d] text-white hover:bg-[#30363d] transition-colors uppercase tracking-widest">İptal</button>
                            <button onClick={kaydetModel} disabled={loading} className="px-6 py-2 rounded-lg font-black text-xs bg-amber-600 hover:bg-amber-500 text-white uppercase tracking-widest shadow-lg shadow-amber-500/20">{loading ? '...' : 'MODELİ MÜHÜRLE'}</button>
                        </div>
                    </div>
                )}

                {/* KALIP FORMU */}
                {formAcik && sekme === 'kaliplar' && (
                    <div className="bg-[#121c1a] lg:bg-[#161b22] border border-amber-500/50 rounded-xl p-6 mb-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Ruler size={120} /></div>
                        <h3 className="font-black text-amber-500 mb-4 text-xs uppercase tracking-widest">📏 {formKalip.id ? 'Kalıp Düzenle' : 'Yeni Kalıp & Pastal Ekle'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">Bağımlı Model Seç *</label>
                                <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={formKalip.model_id} onChange={e => setFormKalip({ ...formKalip, model_id: e.target.value })}>
                                    <option value="">— M3 Taslaklarından Seç —</option>
                                    {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} — {m.model_adi}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2"><label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">Kalıp Parça Adı *</label><input className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={formKalip.kalip_adi} onChange={e => setFormKalip({ ...formKalip, kalip_adi: e.target.value })} placeholder="Kaban Ön Beden Tam Kalıp" /></div>
                            <div><label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">Pastal Boyu (cm) *</label><input type="number" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none font-mono" value={formKalip.pastal_boyu_cm} onChange={e => setFormKalip({ ...formKalip, pastal_boyu_cm: e.target.value })} placeholder="280" /></div>
                            <div><label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">Pastal Eni (cm) *</label><input type="number" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none font-mono" value={formKalip.pastal_eni_cm} onChange={e => setFormKalip({ ...formKalip, pastal_eni_cm: e.target.value })} placeholder="150" /></div>
                            <div><label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">Fire Oranı (%)</label><input type="number" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none font-mono" value={formKalip.fire_orani_yuzde} onChange={e => setFormKalip({ ...formKalip, fire_orani_yuzde: e.target.value })} placeholder="5" /></div>

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex flex-col justify-center text-center">
                                <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest mb-1">M7 Çarpanı (Tahmini m²)</span>
                                <span className="text-2xl font-black font-mono text-amber-400">{metrajHesap()}</span>
                            </div>

                            <div className="lg:col-span-4">
                                <label className="block text-[10px] font-black text-[#8b949e] mb-2 uppercase tracking-widest">Beden Serilemesi (Seçiniz)</label>
                                <div className="flex flex-wrap gap-2">
                                    {BEDENLER.map(b => (
                                        <button key={b} type="button" onClick={() => toggleBeden(b)} className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors border ${formKalip.bedenler.includes(b) ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-amber-500/50'}`}>
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-4">
                                <label className="block text-[10px] font-black text-[#8b949e] mb-1 uppercase tracking-widest">DXF/PDF Dijital Kalıp (İsteğe Bağlı)</label>
                                <input className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-blue-400 font-mono focus:border-amber-500 outline-none" value={formKalip.kalip_dosya_url} onChange={e => setFormKalip({ ...formKalip, kalip_dosya_url: e.target.value })} placeholder="URL veya Dosya Yolu..." />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6 border-t border-[#30363d] pt-4 relative z-10">
                            <button onClick={() => { setFormKalip(BOSH_KALIP); setFormAcik(false); }} className="px-5 py-2 rounded-lg font-bold text-xs bg-[#21262d] text-white hover:bg-[#30363d] transition-colors uppercase tracking-widest">İptal</button>
                            <button onClick={kaydetKalip} disabled={loading} className="px-6 py-2 rounded-lg font-black text-xs bg-amber-600 hover:bg-amber-500 text-white uppercase tracking-widest shadow-lg shadow-amber-500/20">{loading ? '...' : 'KALIBI MÜHÜRLE'}</button>
                        </div>
                    </div>
                )}

                {/* MODELLER LISTESI */}
                {sekme === 'modeller' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {modeller.length === 0 && !loading && (
                            <div className="lg:col-span-3 text-center py-20 border border-dashed border-[#30363d] rounded-xl text-[#8b949e]">Model bulunamadı. Lütfen yeni bir taslak oluşturun.</div>
                        )}
                        {modeller.map(m => (
                            <div key={m.id} className="bg-[#161b22] border border-[#21262d] hover:border-[#30363d] rounded-xl p-5 shadow-lg flex flex-col justify-between transition-colors">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black bg-[#21262d] text-emerald-400 border border-[#30363d] px-2 py-0.5 rounded tracking-widest">{m.model_kodu}</span>
                                            {m.trend_id && <Tag size={12} className="text-amber-500" />}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setFormModel({ id: m.id, model_kodu: m.model_kodu, model_adi: m.model_adi, model_adi_ar: m.model_adi_ar || '', trend_id: m.trend_id || '', hedef_kitle: m.hedef_kitle, sezon: m.sezon, aciklama: m.aciklama || '' }); setSekme('modeller'); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[#8b949e] hover:text-white transition-colors"><Settings size={14} /></button>
                                            <button onClick={() => sil('b1_model_taslaklari', m.id)} disabled={islemdeId === 'sil_' + m.id} className="text-rose-500 hover:text-rose-400 transition-colors disabled:opacity-50"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-white text-sm mb-2">{m.model_adi}</h3>
                                    <p className="text-[10px] text-[#8b949e] mb-3 line-clamp-2">{m.aciklama || 'Reçete detayı girilmedi.'}</p>
                                </div>
                                <div className="border-t border-[#21262d] pt-3 flex flex-wrap gap-2 items-center">
                                    <span className="text-[9px] font-bold uppercase text-white bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">{m.sezon}</span>
                                    <span className="text-[9px] font-bold uppercase text-white bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">{m.hedef_kitle}</span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border border-[#30363d] ml-auto ${DURUM_RENK[m.durum] || 'text-gray-400'}`}>{m.durum?.replace('_', ' ')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* KALIPLAR LISTESI */}
                {sekme === 'kaliplar' && (
                    <div className="flex flex-col gap-4">
                        {kaliplar.length === 0 && !loading && (
                            <div className="text-center py-20 border border-dashed border-[#30363d] rounded-xl text-[#8b949e]">Kayıtlı kalıp/pastal bulunamadı. Lütfen ekleyin.</div>
                        )}
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                        {kaliplar.map(k => {
                            const boy = parseFloat(k.pastal_boyu_cm) / 100;
                            const en = parseFloat(k.pastal_eni_cm) / 100;
                            const fire = parseFloat(k.fire_orani_yuzde) / 100;
                            const metraj = (boy * en * (1 + fire)).toFixed(3);
<<<<<<< HEAD

                            return (
                                <div key={k.id} className="bg-[#161b22] border border-[#21262d] hover:border-[#30363d] rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 shadow-lg transition-colors">
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-black bg-[#21262d] text-emerald-400 border border-[#30363d] px-2 py-0.5 rounded tracking-widest">{k.b1_model_taslaklari?.model_kodu}</span>
                                            <ChevronRight size={14} className="text-[#8b949e]" />
                                            <h3 className="font-bold text-white text-sm m-0">{k.kalip_adi}</h3>
                                            <span className="text-[9px] font-black text-amber-500 border border-amber-500/20 bg-amber-500/10 px-2 rounded-full">{k.versiyon}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {(k.bedenler || []).map(b => (
                                                <span key={b} className="text-[9px] font-black bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-widest">{b}</span>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-[#8b949e] uppercase tracking-widest items-center">
                                            <span className="flex items-center gap-1"><Ruler size={12} className="text-amber-500" /> {k.pastal_boyu_cm}cm × {k.pastal_eni_cm}cm</span>
                                            <span className="flex items-center gap-1"><Scissors size={12} className="text-rose-400" /> Fire: %{k.fire_orani_yuzde}</span>
                                            {k.kalip_dosya_url && <a href={k.kalip_dosya_url} target="_blank" className="text-blue-400 font-mono lowercase hover:underline ml-2">dosya_indir ↗</a>}
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex gap-4 w-full md:w-auto mt-4 md:mt-0 items-center justify-between md:justify-end">
                                        <div className="bg-[#0d1117] border border-amber-500/30 rounded-lg p-3 text-center min-w-[120px]">
                                            <div className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest mb-1">Hesap (m²)</div>
                                            <div className="text-xl font-black font-mono text-amber-500 leading-none">{metraj}</div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => { setFormKalip({ id: k.id, model_id: k.model_id || '', kalip_adi: k.kalip_adi, bedenler: k.bedenler || [], pastal_boyu_cm: String(k.pastal_boyu_cm || ''), pastal_eni_cm: String(k.pastal_eni_cm || ''), fire_orani_yuzde: String(k.fire_orani_yuzde || '5'), versiyon: k.versiyon || 'v1.0', kalip_dosya_url: k.kalip_dosya_url || '' }); setSekme('kaliplar'); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-[#21262d] hover:bg-[#30363d] text-white p-2 rounded-lg transition-colors"><Settings size={14} /></button>
                                            <button onClick={() => sil('b1_model_kaliplari', k.id)} disabled={islemdeId === 'sil_' + k.id} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 p-2 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={14} /></button>
                                        </div>
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                    </div>
                                </div>
                            );
                        })}
                    </div>
<<<<<<< HEAD
                )}
            </div>
=======
                </div>
            )}
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        </div>
    );
}
