'use client';
/**
 * features/modelhane/components/ModelhaneMainContainer.js
 * Kaynak: app/modelhane/page.js → features mimarisine taşındı
 * UI logic burada, state/data → hooks/useModelhane.js
 */
'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect, useRef } from 'react';
import { Video, Plus, Lock, Unlock, CheckCircle2, AlertTriangle, Trash2, Play, FileText, Clock, ChevronRight, Camera } from 'lucide-react';
import NextLink from 'next/link';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

const BOSH_NUMUNE = { model_id: '', kalip_id: '', numune_beden: 'M', dikim_tarihi: '', notlar: '' };
const BOSH_TALIMAT = { numune_id: '', talimat_video_url: '', sesli_aciklama_url: '', yazili_adimlari: [] };
const BEDENLER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export default function ModelhaneSayfasi() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang } = useLang();  // Context'ten al — anlık güncelleme
    const [sekme, setSekme] = useState('numuneler');
    const [numuneler, setNumuneler] = useState([]);
    const [talimatlar, setTalimatlar] = useState([]);
    const [modeller, setModeller] = useState([]);
    const [kaliplar, setKaliplar] = useState([]);
    const [formN, setFormN] = useState(BOSH_NUMUNE);
    const [formT, setFormT] = useState(BOSH_TALIMAT);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [fotYukleniyor, setFotYukleniyor] = useState(false);
    const [fotGaleri, setFotGaleri] = useState(null);
    const [galeriNumuneler, setGaleriNumuneler] = useState([]);
    const [galeridFiltre, setGaleridFiltre] = useState('hepsi');
    const [islemdeId, setIslemdeId] = useState(null); // [SPAM ZIRHI] Telegram / DB Çift tıklama boğulmasını önleme kilidi

    const sekmeRef = useRef(sekme);
    useEffect(() => { sekmeRef.current = sekme; }, [sekme]);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');

        setYetkiliMi(kullanici?.grup === 'tam' || uretimPin);
        if (kullanici?.grup === 'tam' || uretimPin) {
            // [AI ZIRHI]: Global('*') kirliliği filtrelenerek yalnızca Modelhane tablolarına atandı. 
            // Başka modüldeki kayıtlar burayı istila edemeyecek.
            const kanal = supabase.channel('m2-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_numune_uretimleri' }, () => { yukle(sekmeRef.current); })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_dikim_talimatlari' }, () => { yukle(sekmeRef.current); })
                .subscribe();

            return () => { supabase.removeChannel(kanal); };
        }
        // [RENDER ZIRHI]: Auth Refetch Döngüsü bozuldu, Obje yerine ID ve Grup primiti bağlandı.
    }, [kullanici?.id, kullanici?.grup]);

    useEffect(() => {
        if (yetkiliMi) yukle(sekme);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sekme, yetkiliMi]);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 6000); };

    const yukle = async (aktifSekme = sekme) => {
        setLoading(true);
        try {
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 saniye)')), 10000));
            if (aktifSekme === 'numuneler') {
                const [nRes, mRes] = await Promise.race([
                    Promise.allSettled([
                        supabase.from('b1_numune_uretimleri').select('*, b1_model_taslaklari(model_adi,model_kodu), b1_model_kaliplari(kalip_adi,versiyon)').neq('onay_durumu', 'iptal').order('created_at', { ascending: false }).limit(200),
                        supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500)
                    ]),
                    timeout
                ]);
                if (nRes.status === 'fulfilled' && nRes.value.data) setNumuneler(nRes.value.data);
                if (mRes.status === 'fulfilled' && mRes.value.data) setModeller(mRes.value.data);
            } else if (aktifSekme === 'talimatlar') {
                const [tRes, nRes] = await Promise.race([
                    Promise.allSettled([
                        supabase.from('b1_dikim_talimatlari').select('*, b1_numune_uretimleri(numune_beden, b1_model_taslaklari(model_adi,model_kodu))').eq('aktif', true).order('created_at', { ascending: false }).limit(200),
                        supabase.from('b1_numune_uretimleri').select('id,numune_beden, b1_model_taslaklari(model_kodu,model_adi)').eq('onay_durumu', 'onaylandi').limit(200)
                    ]),
                    timeout
                ]);
                if (tRes.status === 'fulfilled' && tRes.value.data) setTalimatlar(tRes.value.data);
                if (nRes.status === 'fulfilled' && nRes.value.data) setNumuneler(nRes.value.data);
            } else if (aktifSekme === 'galeri') {
                const [gRes, tumNRes, mRes] = await Promise.race([
                    Promise.allSettled([
                        supabase.from('b1_numune_uretimleri').select('id, numune_beden, onay_durumu, fotograflar, b1_model_taslaklari(model_kodu, model_adi)').neq('onay_durumu', 'iptal').order('created_at', { ascending: false }).limit(200),
                        supabase.from('b1_numune_uretimleri').select('id, numune_beden, fotograflar, b1_model_taslaklari(model_kodu, model_adi)').limit(200),
                        supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500)
                    ]),
                    timeout
                ]);
                if (gRes.status === 'fulfilled' && gRes.value.data) setGaleriNumuneler(gRes.value.data.filter(n => n.fotograflar && n.fotograflar.length > 0));
                if (tumNRes.status === 'fulfilled' && tumNRes.value.data) setNumuneler(tumNRes.value.data);
                if (mRes.status === 'fulfilled' && mRes.value.data) setModeller(mRes.value.data);
            }
        } catch (error) {
            goster('Ağ veya sunucu hatası oluştu: yükleme başarısız.', 'error');
        }
        setLoading(false);
    };

    const kaliplariYukle = async (modelId) => {
        const { data } = await supabase.from('b1_model_kaliplari').select('id,kalip_adi,versiyon').eq('model_id', modelId).limit(50);
        setKaliplar(data || []);
        setFormN(prev => ({ ...prev, kalip_id: '' }));
    };

    const kaydetNumune = async () => {
        if (!formN.model_id) return goster('Model seçilmesi zorunlu!', 'error');
        if (!formN.numune_beden) return goster('Numune bedeni zorunlu!', 'error');
        if (formN.notlar && formN.notlar.length > 500) return goster('Notlar 500 karakteri geçemez!', 'error'); // X Kriteri (Limit)

        setLoading(true);
        try {
            // 🛑 U Kriteri: Mükerrer Numune Engeli
            const { data: mevcutNumune } = await supabase.from('b1_numune_uretimleri').select('id').eq('model_id', formN.model_id).eq('numune_beden', formN.numune_beden);
            if (mevcutNumune && mevcutNumune.length > 0) {
                setLoading(false);
                return goster('⚠️ Bu model ve beden için kayıtlı numune var! Mükerrer kayıt oluşturulamaz.', 'error');
            }

            const { error } = await supabase.from('b1_numune_uretimleri').insert([{
                model_id: formN.model_id,
                kalip_id: formN.kalip_id || null,
                numune_beden: formN.numune_beden,
                dikim_tarihi: formN.dikim_tarihi ? new Date(formN.dikim_tarihi).toISOString() : null,
                onay_durumu: 'bekliyor',
                notlar: formN.notlar.trim() || null,
            }]);
            if (!error) { goster('Numune kaydedildi.'); setFormN(BOSH_NUMUNE); setFormAcik(false); yukle(); }
            else throw error;
        } catch (error) {
            if (!navigator.onLine || error.message?.includes('fetch')) {
                await cevrimeKuyrugaAl({
                    tablo: 'b1_numune_uretimleri',
                    islem_tipi: 'INSERT',
                    veri: {
                        model_id: formN.model_id,
                        kalip_id: formN.kalip_id || null,
                        numune_beden: formN.numune_beden,
                        dikim_tarihi: formN.dikim_tarihi ? new Date(formN.dikim_tarihi).toISOString() : null,
                        onay_durumu: 'bekliyor',
                        notlar: formN.notlar.trim() || null,
                    }
                });
                goster('İnternet Yok: Numune çevrimdışı kuyruğa alındı (Bağlantı gelince arka planda eklenecek).', 'success');
                setFormN(BOSH_NUMUNE); setFormAcik(false);
            } else {
                goster('Hata: ' + error.message, 'error');
            }
        }
        setLoading(false);
    };

    const onayVer = async (id, durum) => {
        if (islemdeId === id) return; // 🟢 SPAM ENGELİ
        setIslemdeId(id);

        try {
            const { error } = await supabase.from('b1_numune_uretimleri').update({ onay_durumu: durum }).eq('id', id);
            if (!error) {
                goster(durum === 'onaylandi' ? 'Numune onaylandı.' : 'Revizyon istendi.');
                yukle();

                // DD Kriteri: Telegram Bildirimi (Otomasyon)
                if (durum === 'onaylandi') {
                    const onaylayanAd = kullanici?.ad || 'Atölye Lideri (PIN)';
                    try {
                        const controller = new AbortController();
                        const tId = setTimeout(() => controller.abort(), 10000);
                        await fetch('/api/telegram-bildirim', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                mesaj: `✅ <b>NUMUNE ONAYLANDI! (M4 - MODELHANE)</b>\n\n👤 <b>Onaylayan:</b> ${onaylayanAd}\n👉 <i>Üretim için Dikim Talimatı ve Fason Videolarını sisteme yükleyebilirsiniz.</i>`
                            }),
                            signal: controller.signal
                        });
                        clearTimeout(tId);
                    } catch (err) { /* Telegram Hatasi yutuldu */ }
                }
            } else {
                throw error;
            }
        } catch (error) {
            goster('Durum güncellenemedi, ağ hatası: ' + error.message, 'error');
        } finally {
            setIslemdeId(null);
        }
    };

    const adimEkle = () => {
        const yeniNo = (formT.yazili_adimlari.length + 1);
        setFormT(prev => ({ ...prev, yazili_adimlari: [...prev.yazili_adimlari, { adim_no: yeniNo, aciklama: '', makine: 'Düz.M', zorluk: 'Kolay', sure_dk: 5 }] }));
    };
    const adimGuncelle = (i, alan, val) => {
        const adimlar = [...formT.yazili_adimlari];
        adimlar[i] = { ...adimlar[i], [alan]: alan === 'sure_dk' ? parseInt(val) || 0 : val };
        setFormT(prev => ({ ...prev, yazili_adimlari: adimlar }));
    };
    const adimSil = (i) => { setFormT(prev => ({ ...prev, yazili_adimlari: prev.yazili_adimlari.filter((_, idx) => idx !== i) })); };
    const toplamSure = formT.yazili_adimlari.reduce((s, a) => s + (parseInt(a.sure_dk) || 0), 0);

    const kaydetTalimat = async () => {
        if (!formT.numune_id) return goster('Numune seçilmesi zorunlu!', 'error');
        if (formT.yazili_adimlari.length === 0) return goster('En az 1 adım zorunlu!', 'error');
        if (formT.yazili_adimlari.some(a => !a.aciklama.trim())) return goster('Tüm adımlar dolu olmalı!', 'error');
        if (formT.yazili_adimlari.some(a => a.aciklama.length > 200)) return goster('Adım açıklaması 200 karakteri geçemez!', 'error'); // X Kriteri (Limit)

        setLoading(true);
        try {
            // 🛑 U Kriteri: Mükerrer Talimat Engeli
            const { data: mevcutTalimat } = await supabase.from('b1_dikim_talimatlari').select('id').eq('numune_id', formT.numune_id);
            if (mevcutTalimat && mevcutTalimat.length > 0) {
                setLoading(false);
                return goster('⚠️ Bu numuneye ait dikim talimatı zaten mevcut! Mükerrer kayıt red edildi.', 'error');
            }

            const { error } = await supabase.from('b1_dikim_talimatlari').insert([{
                numune_id: formT.numune_id,
                talimat_video_url: formT.talimat_video_url.trim() || null,
                sesli_aciklama_url: formT.sesli_aciklama_url.trim() || null,
                yazili_adimlari: formT.yazili_adimlari,
                toplam_sure_dk: toplamSure,
                aktif: true,
            }]);
            if (!error) {
                goster(formT.talimat_video_url.trim() ? 'Talimat kaydedildi. Fason kilidi AÇIK.' : 'Talimat kaydedildi. Video yok — Fason KİLİTLİ.', formT.talimat_video_url.trim() ? 'success' : 'error');
                setFormT(BOSH_TALIMAT); setFormAcik(false); yukle();
            } else throw error;
        } catch (error) {
            if (!navigator.onLine || error.message?.includes('fetch')) {
                await cevrimeKuyrugaAl({
                    tablo: 'b1_dikim_talimatlari',
                    islem_tipi: 'INSERT',
                    veri: {
                        numune_id: formT.numune_id,
                        talimat_video_url: formT.talimat_video_url.trim() || null,
                        sesli_aciklama_url: formT.sesli_aciklama_url.trim() || null,
                        yazili_adimlari: formT.yazili_adimlari,
                        toplam_sure_dk: toplamSure,
                        aktif: true,
                    }
                });
                goster('İnternet Yok: Talimat çevrimdışı kuyruğa alındı.', 'success');
                setFormT(BOSH_TALIMAT); setFormAcik(false);
            } else {
                goster('Kayıt başarısız, ağ veya veritabanı bağlantısı koptu!', 'error');
            }
        }
        setLoading(false);
    };

    const sil = async (tablo, id) => {
        // GÜVENLİK: Sunucu taraflı PIN doğrulama
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            kullanici,
            'Sadece TAM YETKİLİ personeller silebilir.\nLütfen PIN kodunuzu girin:'
        );
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error');

        if (!confirm(isAR ? 'هل أنت متأكد من الحذف؟' : 'Veri kalıcı silinmek yerine arşive kaldırılsın mı?')) return;
        try {

            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String(tablo).replace(/['"]/g, ''),
                    islem_tipi: 'ARŞİVLEME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Soft Delete / Arşive alındı.', ver_id: id }
                }]).catch(() => { });
            } catch (e) { }

            let error = null;
            if (tablo === 'b1_dikim_talimatlari') {
                const res = await supabase.from(tablo).update({ aktif: false }).eq('id', id);
                error = res.error;
            } else if (tablo === 'b1_numune_uretimleri') {
                const res = await supabase.from(tablo).update({ onay_durumu: 'iptal' }).eq('id', id);
                error = res.error;
            } else {
                const res = await supabase.from(tablo).delete().eq('id', id);
                error = res.error;
            }

            if (!error) { yukle(); goster('Kayıt güvenle arşive kaldırıldı.'); }
            else throw error;
        } catch (error) { goster('Silme/Arşivleme başarısız: ' + error.message, 'error'); }
    };

    const fotografYukle = async (numuneId, dosyalar) => {
        if (!dosyalar?.length) return;
        setFotYukleniyor(true);
        const yuklenenUrller = [];
        for (const dosya of Array.from(dosyalar)) {
            const uzanti = dosya.name.split('.').pop().toLowerCase();
            if (!['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(uzanti)) {
                goster('Sadece JPG, PNG, WEBP, HEIC formatları desteklenir.', 'error');
                continue;
            }
            if (dosya.size > 5 * 1024 * 1024) {
                goster('Dosya çok büyük! Veritabanı (Storage) sağlığı için Maksimum 5MB resim yükleyebilirsiniz.', 'error');
                continue;
            }
            const yol = `numune-${numuneId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${uzanti}`;
            const { data, error } = await supabase.storage.from('teknik-foyler').upload(yol, dosya, { upsert: false });
            if (error) {
                if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
                    goster('⚠️ Supabase Storage\'da "teknik-foyler" bucket\'ı bulunamadı. Supabase Dashboard → Storage → New Bucket → teknik-foyler (Public) oluşturun.', 'error');
                    break;
                }
                goster('Yükleme hatası: ' + error.message, 'error');
                continue;
            }
            const { data: url } = supabase.storage.from('teknik-foyler').getPublicUrl(data.path);
            yuklenenUrller.push(url.publicUrl);
        }
        if (yuklenenUrller.length > 0) {
            const { data: mevcut } = await supabase.from('b1_numune_uretimleri').select('fotograflar').eq('id', numuneId).single();
            const eskiler = mevcut?.fotograflar || [];
            await supabase.from('b1_numune_uretimleri').update({ fotograflar: [...eskiler, ...yuklenenUrller] }).eq('id', numuneId);
            goster(`${yuklenenUrller.length} fotoğraf yüklendi.`);
            yukle();
            setFotGaleri(prev => prev ? { ...prev, fotograflar: [...(prev.fotograflar || []), ...yuklenenUrller] } : null);
        }
        setFotYukleniyor(false);
    };


    const fotografSil = async (numuneId, silUrl) => {
        const { data: mevcut } = await supabase.from('b1_numune_uretimleri').select('fotograflar').eq('id', numuneId).single();
        const yeni = (mevcut?.fotograflar || []).filter(u => u !== silUrl);
        await supabase.from('b1_numune_uretimleri').update({ fotograflar: yeni }).eq('id', numuneId);
        const yol = silUrl.split('/teknik-foyler/')[1];
        if (yol) await supabase.storage.from('teknik-foyler').remove([yol]);
        goster('Fotoğraf silindi.');
        yukle();
        setFotGaleri(prev => prev ? { ...prev, fotograflar: yeni } : null);
    };

    const isAR = lang === 'ar';


    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };
    const ONAY_RENK = { bekliyor: '#f59e0b', onaylandi: '#10b981', revizyon_gerekli: '#ef4444' };
    const ONAY_ETIKET = { bekliyor: 'Onay Bekliyor', onaylandi: 'Onaylandı', revizyon_gerekli: 'Revizyon' };

    // R Kriteri (Yetkisiz Giriş Kapatma)
    if (!yetkiliMi) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>M2 Modelhane verileri gizlidir. Görüntülemek için Üretim PİN veya Yetkili Kullanıcı girişi gereklidir. Lütfen Karargâh anasayfasına dönerek yetki ataması yapın.</p>
            </div>
        );
    }

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            {/* BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Modelhane & Video Kilidi</h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>Numune → Fotoğraf → Talimat → Fason kilidi</p>
                    </div>
                </div>
                <button onClick={() => setFormAcik(!formAcik)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                    <Plus size={18} /> {sekme === 'numuneler' ? 'Yeni Numune' : 'Yeni Talimat'}
                </button>
            </div>

            {/* KİLİT BANNER */}
            <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Lock size={20} color="#fbbf24" />
                <div>
                    <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>FASON KİLİT KURALI</div>
                    <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.75rem' }}>Video kanıtı olmadan fason üretim başlatılamaz.</div>
                </div>
            </div>

            {/* MESAJ */}
            {mesaj.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />} {mesaj.text}
                </div>
            )}

            {/* SEKMELER */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                {[{ id: 'numuneler', tr: 'Numune Kayıtları' }, { id: 'talimatlar', tr: 'Dikim Talimatları' }, { id: 'teknik', tr: 'Teknik Föyler' }, { id: 'galeri', tr: 'Fotoğraf Galerisi' }].map(s => (
                    <button key={s.id} onClick={() => { setSekme(s.id); setFormAcik(false); }}
                        style={{ padding: '8px 20px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', borderColor: sekme === s.id ? '#047857' : '#e5e7eb', background: sekme === s.id ? '#047857' : 'white', color: sekme === s.id ? 'white' : '#374151' }}>
                        {s.tr}
                    </button>
                ))}
            </div>

            {sekme === 'teknik' && (
                <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        📋 Teknik Föyler & Üretim Detayları
                    </h3>
                    <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 12, border: '2px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}></div>
                        <h4 style={{ fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Modeller İçin Teknik Föy Veritabanı</h4>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, maxWidth: 500, margin: '0 auto' }}>
                            Kumaş sarfiyatları, çekme payları, yıkama talimatları ve kalite kontrol yönergeleri yakında bu panele entegre edilecektir. (Kritik geliştirmeler tamamlandığında açılacak).
                        </p>
                    </div>
                </div>
            )}

            {/* NUMUNE FORMU */}
            {formAcik && sekme === 'numuneler' && (
                <div style={{ background: 'white', border: '2px solid #047857', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.10)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem', fontSize: '1rem' }}>Yeni Numune Kaydı</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
                        <div>
                            <label style={lbl}>Model *</label>
                            <select value={formN.model_id} onChange={e => { setFormN({ ...formN, model_id: e.target.value }); kaliplariYukle(e.target.value); }} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— Model Seçiniz —</option>
                                {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} — {m.model_adi}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Kalıp</label>
                            <select value={formN.kalip_id} onChange={e => setFormN({ ...formN, kalip_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— Kalıp Seçiniz —</option>
                                {kaliplar.map(k => <option key={k.id} value={k.id}>{k.kalip_adi} ({k.versiyon})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Beden *</label>
                            <select value={formN.numune_beden} onChange={e => setFormN({ ...formN, numune_beden: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {BEDENLER.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Dikim Tarihi</label>
                            <input type="datetime-local" value={formN.dikim_tarihi} onChange={e => setFormN({ ...formN, dikim_tarihi: e.target.value })} style={inp} />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Not</label>
                            <textarea rows={2} value={formN.notlar} onChange={e => setFormN({ ...formN, notlar: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setFormN(BOSH_NUMUNE); setFormAcik(false); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydetNumune} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? '...' : 'Kaydet'}</button>
                    </div>
                </div>
            )}

            {/* TALİMAT FORMU */}
            {formAcik && sekme === 'talimatlar' && (
                <div style={{ background: 'white', border: '2px solid #047857', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.10)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem', fontSize: '1rem' }}>Yeni Dikim Talimatı</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.875rem' }}>
                        <div>
                            <label style={lbl}>Onaylı Numune *</label>
                            <select value={formT.numune_id} onChange={e => setFormT({ ...formT, numune_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— Onaylı Numune Seçiniz —</option>
                                {numuneler.map(n => <option key={n.id} value={n.id}>{n.b1_model_taslaklari?.model_kodu} | Beden: {n.numune_beden}</option>)}
                            </select>
                        </div>
                        <div style={{ background: formT.talimat_video_url.trim() ? '#ecfdf5' : '#fef2f2', border: '2px solid', borderColor: formT.talimat_video_url.trim() ? '#10b981' : '#ef4444', borderRadius: 12, padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                                {formT.talimat_video_url.trim() ? <Unlock size={18} color="#10b981" /> : <Lock size={18} color="#ef4444" />}
                                <label style={{ ...lbl, margin: 0 }}>Video URL {!formT.talimat_video_url.trim() && '— FASON KİLİTLİ'}</label>
                            </div>
                            <input value={formT.talimat_video_url} onChange={e => setFormT({ ...formT, talimat_video_url: e.target.value })} placeholder="https://drive.google.com/..." style={{ ...inp, borderColor: formT.talimat_video_url.trim() ? '#10b981' : '#ef4444' }} />
                        </div>
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '1rem' }}>🎙️</span>
                                <label style={{ ...lbl, margin: 0, color: '#0369a1' }}>Sesli Açıklama URL (İsteğe Bağlı)</label>
                            </div>
                            <input
                                value={formT.sesli_aciklama_url}
                                onChange={e => setFormT({ ...formT, sesli_aciklama_url: e.target.value })}
                                placeholder="https://drive.google.com/sesli-aciklama.mp3"
                                style={{ ...inp, borderColor: '#bae6fd' }}
                            />
                            <p style={{ fontSize: '0.68rem', color: '#0369a1', marginTop: 4, fontWeight: 600 }}>
                                Usta sesi kayıt linki — Işçiye WhatsApp/Drive üzerinden gönderilebilir
                            </p>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={lbl}>İşlem Adımları *</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>Toplam: {toplamSure} dk</span>
                                    <button type="button" onClick={adimEkle} style={{ padding: '4px 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>+ Adım</button>
                                </div>
                            </div>
                            {formT.yazili_adimlari.length === 0 && <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: 8, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Adım yok. + Adım ekleyin.</div>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {formT.yazili_adimlari.map((adim, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(30px, 40px) 1fr minmax(70px, 100px) minmax(70px, 90px) minmax(60px, 70px) 32px', gap: '0.375rem', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: 8 }}>
                                        <div style={{ textAlign: 'center', fontWeight: 900, color: '#f59e0b', fontSize: '1rem' }}>{i + 1}</div>
                                        <input value={adim.aciklama} onChange={e => adimGuncelle(i, 'aciklama', e.target.value)} placeholder={`Adım ${i + 1}...`} style={{ ...inp, padding: '6px 10px' }} />

                                        <select value={adim.makine || 'Düz.M'} onChange={e => adimGuncelle(i, 'makine', e.target.value)} style={{ ...inp, padding: '6px', fontSize: '0.75rem' }}>
                                            <option value="Düz.M">Düz.M</option>
                                            <option value="Overlok">Overlok</option>
                                            <option value="Reçme">Reçme</option>
                                            <option value="İlik">İlik</option>
                                            <option value="Ütü">Ütü</option>
                                            <option value="El İşi">El İşi</option>
                                        </select>

                                        <select value={adim.zorluk || 'Kolay'} onChange={e => adimGuncelle(i, 'zorluk', e.target.value)} style={{ ...inp, padding: '6px', fontSize: '0.75rem' }}>
                                            <option value="Kolay">Kolay</option>
                                            <option value="Orta">Orta</option>
                                            <option value="Zor">Zor</option>
                                        </select>

                                        <input type="number" value={adim.sure_dk} onChange={e => adimGuncelle(i, 'sure_dk', e.target.value)} placeholder="dk" style={{ ...inp, padding: '6px', textAlign: 'center' }} min={1} />
                                        <button type="button" onClick={() => adimSil(i)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: 6, borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setFormT(BOSH_TALIMAT); setFormAcik(false); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydetTalimat} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? '...' : 'Kaydet'}</button>
                    </div>
                </div>
            )}

            {/* NUMUNE LİSTESİ */}
            {sekme === 'numuneler' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {!loading && numuneler.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <Camera size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>Numune yok.</p>
                        </div>
                    )}
                    {numuneler.map(n => (
                        <div key={n.id} style={{ background: 'white', border: '2px solid', borderColor: n.onay_durumu === 'onaylandi' ? '#10b981' : n.onay_durumu === 'revizyon_gerekli' ? '#ef4444' : '#f1f5f9', borderRadius: 14, padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.375rem' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: 4 }}>{n.b1_model_taslaklari?.model_kodu}</span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#0f172a', color: 'white', padding: '2px 8px', borderRadius: 4 }}>Beden: {n.numune_beden}</span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: `${ONAY_RENK[n.onay_durumu]}20`, color: ONAY_RENK[n.onay_durumu] }}>{ONAY_ETIKET[n.onay_durumu]}</span>
                                    </div>
                                    <h3 style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '0.95rem' }}>{n.b1_model_taslaklari?.model_adi}</h3>
                                    {n.notlar && <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0' }}>{n.notlar}</p>}
                                </div>
                                <div style={{ display: 'flex', gap: '0.375rem' }}>
                                    <button onClick={() => {
                                        setFormN({ model_id: n.model_id || '', kalip_id: n.kalip_id || '', numune_beden: n.numune_beden, dikim_tarihi: '', notlar: n.notlar || '' });
                                        kaliplariYukle(n.model_id);
                                        setSekme('numuneler');
                                        setFormAcik(true);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        📑 Kopyala
                                    </button>
                                    {n.onay_durumu === 'bekliyor' && (<>
                                        <button disabled={islemdeId === n.id} onClick={() => onayVer(n.id, 'onaylandi')} style={{ background: '#ecfdf5', border: '2px solid #10b981', color: '#065f46', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: islemdeId === n.id ? 'wait' : 'pointer', fontSize: '0.75rem' }}>✅{islemdeId === n.id ? '...' : ' Onayla'}</button>
                                        <button disabled={islemdeId === n.id} onClick={() => onayVer(n.id, 'revizyon_gerekli')} style={{ background: '#fef2f2', border: '2px solid #ef4444', color: '#991b1b', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: islemdeId === n.id ? 'wait' : 'pointer', fontSize: '0.75rem' }}>🔄{islemdeId === n.id ? '...' : ' Revizyon'}</button>
                                    </>)}
                                    <button disabled={islemdeId === n.id} onClick={() => { setIslemdeId(n.id); sil('b1_numune_uretimleri', n.id).finally(() => setIslemdeId(null)); }} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '6px 10px', borderRadius: 8, cursor: islemdeId === n.id ? 'wait' : 'pointer' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>🕐 {formatTarih(n.created_at)}</div>
                            {/* FOTOĞRAF SATIRI */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>📷 {n.fotograflar?.length || 0} sayfa</span>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#ecfdf5', color: '#047857', border: '2px solid #047857', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>
                                    {fotYukleniyor ? 'Yükleniyor...' : '+ Fotoğraf Ekle'}
                                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                                        onChange={e => fotografYukle(n.id, e.target.files)}
                                        disabled={fotYukleniyor} />
                                </label>
                                {n.fotograflar?.length > 0 && (
                                    <button onClick={() => setFotGaleri({ numune_id: n.id, model: n.b1_model_taslaklari?.model_adi, fotograflar: n.fotograflar })}
                                        style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>
                                        Göster ({n.fotograflar.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TALİMAT LİSTESİ */}
            {sekme === 'talimatlar' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {!loading && talimatlar.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <FileText size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>Talimat yok.</p>
                        </div>
                    )}
                    {talimatlar.map(t => {
                        const videoVar = t.talimat_video_url && t.talimat_video_url.trim() !== '';
                        return (
                            <div key={t.id} style={{ background: 'white', border: '2px solid', borderColor: videoVar ? '#10b981' : '#ef4444', borderRadius: 14, padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.375rem' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: videoVar ? '#ecfdf5' : '#fef2f2', color: videoVar ? '#065f46' : '#991b1b', padding: '2px 8px', borderRadius: 4 }}>
                                                {videoVar ? 'FASON AÇIK' : 'FASON KİLİTLİ'}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>{t.toplam_sure_dk} dk</span>
                                        </div>
                                        <h3 style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '0.95rem' }}>{t.b1_numune_uretimleri?.b1_model_taslaklari?.model_adi}</h3>
                                    </div>
                                    <button disabled={islemdeId === t.id} onClick={() => { setIslemdeId(t.id); sil('b1_dikim_talimatlari', t.id).finally(() => setIslemdeId(null)); }} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '6px 10px', borderRadius: 8, cursor: islemdeId === t.id ? 'wait' : 'pointer' }}><Trash2 size={14} /></button>
                                </div>
                                {videoVar && (
                                    <a href={t.talimat_video_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f172a', color: 'white', padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', marginBottom: '0.75rem' }}>
                                        <Play size={12} /> Videoyu İzle
                                    </a>
                                )}
                                {t.yazili_adimlari && t.yazili_adimlari.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#374151', marginBottom: '0.375rem', textTransform: 'uppercase' }}>İşlem Adımları</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {t.yazili_adimlari.map((a, i) => (
                                                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', padding: '4px 10px', borderRadius: 6 }}>
                                                    <span style={{ fontWeight: 900, color: '#f59e0b', fontSize: '0.85rem', minWidth: 20 }}>{a.adim_no}.</span>
                                                    <span style={{ flex: 1, fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{a.aciklama}</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>{a.sure_dk} dk</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, marginTop: 6 }}>🕐 {formatTarih(t.created_at)}</div>

                                {/* CC Kriteri Onarımı (İş Akış Zinciri) */}
                                {videoVar && (
                                    <NextLink href="/imalat" style={{ textDecoration: 'none', display: 'block', marginTop: '1rem' }}>
                                        <button style={{ width: '100%', padding: '10px 14px', background: '#047857', color: 'white', border: '1px solid #065f46', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            🚀 Üretime / İmalata Geç (M3)
                                        </button>
                                    </NextLink>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FOTOĞRAF GALERİSİ SEKMESİ */}
            {sekme === 'galeri' && (
                <div>
                    <div style={{ background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Camera size={22} color="white" />
                        <div>
                            <div style={{ fontWeight: 900, color: 'white', fontSize: '1rem' }}>TEKNİK FÖY FOTOĞRAF ARŞİVİ</div>
                            <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>Numune başına fotoğraflar — Telegram veya direkt yükle</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.62rem', color: '#fca5a5', fontWeight: 700 }}>TOPLAM FOTO</div>
                            <div style={{ fontWeight: 900, color: 'white', fontSize: '1.4rem' }}>{galeriNumuneler.reduce((s, n) => s + (n.fotograflar?.length || 0), 0)}</div>
                        </div>
                    </div>

                    {/* Model Filtresi */}
                    {modeller.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            <button onClick={() => setGaleridFiltre('hepsi')} style={{ padding: '5px 14px', border: '2px solid', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', borderColor: galeridFiltre === 'hepsi' ? '#047857' : '#e5e7eb', background: galeridFiltre === 'hepsi' ? '#047857' : 'white', color: galeridFiltre === 'hepsi' ? 'white' : '#374151' }}>Tümü</button>
                            {modeller.map(m => (
                                <button key={m.id} onClick={() => setGaleridFiltre(m.id)} style={{ padding: '5px 14px', border: '2px solid', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', borderColor: galeridFiltre === m.id ? '#047857' : '#e5e7eb', background: galeridFiltre === m.id ? '#047857' : 'white', color: galeridFiltre === m.id ? 'white' : '#374151' }}>{m.model_kodu}</button>
                            ))}
                        </div>
                    )}

                    {galeriNumuneler.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <Camera size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>Henüz fotoğraf yüklenmemiş.<br />Numune kartlarındaki 📷 butonu ile fotoğraf ekleyebilirsiniz.</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {galeriNumuneler
                            .filter(n => galeridFiltre === 'hepsi' || n.b1_model_taslaklari?.id === galeridFiltre || n.b1_model_taslaklari === null)
                            .map(n => (
                                <div key={n.id} style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 16, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: 4 }}>{n.b1_model_taslaklari?.model_kodu || '?'}</span>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Beden: {n.numune_beden}</span>
                                            <span style={{ fontSize: '0.62rem', fontWeight: 700, background: n.onay_durumu === 'onaylandi' ? '#d1fae5' : '#fef3c7', color: n.onay_durumu === 'onaylandi' ? '#065f46' : '#92400e', padding: '2px 8px', borderRadius: 4 }}>{n.onay_durumu === 'onaylandi' ? '✅ Onaylı' : '⏳ Bekliyor'}</span>
                                            <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>{n.fotograflar?.length || 0} fotoğraf</span>
                                        </div>
                                        <label style={{ background: '#047857', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Camera size={13} /> Fotoğraf Ekle
                                            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => fotografYukle(n.id, e.target.files)} />
                                        </label>
                                    </div>
                                    {fotYukleniyor && <div style={{ textAlign: 'center', padding: '1rem', color: '#ef4444', fontWeight: 700 }}>⏳ Yükleniyor...</div>}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '0.75rem' }}>
                                        {(n.fotograflar || []).map((url, i) => (
                                            <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                                                <img src={url} alt={`Foto ${i + 1}`} loading="lazy" style={{ width: '100%', height: 200, objectFit: 'cover', cursor: 'zoom-in', display: 'block' }} onClick={() => window.open(url, '_blank')} />
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 700 }}>📷 {i + 1}</span>
                                                    <button onClick={() => fotografSil(n.id, url)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontSize: '0.62rem', fontWeight: 700 }}>Sil</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {fotGaleri && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setFotGaleri(null)}>
                    <div style={{ background: 'white', borderRadius: 20, padding: '1.5rem', maxWidth: 900, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>Teknik Föy Fotoğrafları</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{fotGaleri.model} — {fotGaleri.fotograflar.length} sayfa</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <label style={{ background: '#047857', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                                    + Sayfa Ekle
                                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                                        onChange={e => fotografYukle(fotGaleri.numune_id, e.target.files)} />
                                </label>
                                <button onClick={() => setFotGaleri(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 700 }}>Kapat</button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {fotGaleri.fotograflar.map((url, i) => (
                                <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                                    <img src={url} alt={`Sayfa ${i + 1}`} loading="lazy"
                                        style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                                        onClick={() => window.open(url, '_blank')} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>Sayfa {i + 1}</span>
                                        <button onClick={() => fotografSil(fotGaleri.numune_id, url)}
                                            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}>Sil</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
