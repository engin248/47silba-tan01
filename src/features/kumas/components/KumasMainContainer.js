'use client';
/**
 * features/kumas/components/KumasMainContainer.js
 * Kaynak: app/kumas/page.js → features mimarisine taşındı
 * UI logic burada, state/data → hooks/useKumas.js
 */
'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { Layers, Plus, Search, AlertTriangle, CheckCircle2, Image, Package, Scissors, X, ChevronDown, Tag, Trash2, Eye, Lock, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import FizikselQRBarkod from '@/lib/components/barkod/FizikselQRBarkod';
import SilBastanModal from '@/lib/components/ui/SilBastanModal';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import Link from 'next/link';

const SEKMELER = [
    { id: 'kumas', label_tr: '🧵 Kumaşlar', label_ar: 'الأقمشة' },
    { id: 'aksesuar', label_tr: '🧷 Aksesuarlar', label_ar: 'الإكسسوارات' },
    { id: 'gorsel', label_tr: '📷 Görsel Arşiv', label_ar: 'أرشيف الصور' },
];

const KUMAS_TIPLERI = ['dokuma', 'orgu', 'denim', 'keten', 'ipek', 'sentetik', 'pamuk', 'polar', 'kase', 'viskon', 'diger'];
const AKSESUAR_TIPLERI = ['dugme', 'fermuar', 'iplik', 'etiket', 'yikama_talimati', 'uti_malzeme', 'baski', 'nakis', 'lastik', 'biye', 'diger'];
const AKSESUAR_TIP_LABEL = { dugme: '🔘 Düğme', fermuar: '🔗 Fermuar', iplik: '🧵 İplik', etiket: '🏷️ Etiket', yikama_talimati: '🧺 Yıkama Talimatı', uti_malzeme: '🔥 Ütü Malzemesi', baski: '🖨️ Baskı', nakis: '🪡 Nakış', lastik: '🟡 Lastik', biye: '🎗️ Biye', diger: '📦 Diğer' };
const BIRIMLER = ['adet', 'metre', 'kg', 'litre'];

const BOSH_KUMAS = { kumas_kodu: '', kumas_adi: '', kumas_adi_ar: '', kumas_tipi: 'pamuk', kompozisyon: '', birim_maliyet_tl: '', genislik_cm: '', gramaj_gsm: '', esneme_payi_yuzde: '0', fotograf_url: '', tedarikci_adi: '', tedarikci_id: '', stok_mt: '', min_stok_mt: '10' };
const BOSH_AKS = { aksesuar_kodu: '', aksesuar_adi: '', aksesuar_adi_ar: '', tip: 'dugme', birim: 'adet', birim_maliyet_tl: '', stok_adet: '', min_stok: '100', fotograf_url: '', tedarikci_adi: '' };

export default function KumasArsiviSayfasi() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [sekme, setSekme] = useState('kumas');
    const { lang } = useLang();  // Context'ten al — anlık güncelleme
    const [mounted, setMounted] = useState(false);
    const [kumaslar, setKumaslar] = useState([]);
    const [aksesuarlar, setAksesuarlar] = useState([]);
    const [tedarikciler, setTedarikciler] = useState([]);
    const [gorselArşiv, setGorselArsiv] = useState([]);
    const [form, setForm] = useState(BOSH_KUMAS);
    const [aksForm, setAksForm] = useState(BOSH_AKS);
    const [formAcik, setFormAcik] = useState(false);
    const [duzenleId, setDuzenleId] = useState(null);
    const [duzenleTip, setDuzenleTip] = useState(null); // 'kumas' | 'aksesuar'
    const [arama, setArama] = useState('');
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    // BARKOD MODAL STATE
    const [barkodModaliAcik, setBarkodModaliAcik] = useState(false);
    const [seciliKumas, setSeciliKumas] = useState(null);
    const [islemdeId, setIslemdeId] = useState(null);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        let kanal;
        if (erisebilir) {
            // [AI ZIRHI]: Realtime Websocket (Kriter 20 & 34) (Schema public Kısıtlaması Eklenmiştir)
            kanal = supabase.channel('islem-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_kumas_arsivi' }, () => { yukle(); })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_aksesuar_arsivi' }, () => { yukle(); })
                .subscribe();
        }

        yukle();

        return () => { if (kanal) supabase.removeChannel(kanal); };

    }, [sekme, kullanici?.id, kullanici?.grup]);

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
            if (sekme === 'kumas') {
                const [kumasRes, tedarikciRes] = await Promise.allSettled([
                    supabase.from('b1_kumas_arsivi').select('*, b2_tedarikciler(firma_adi)').order('created_at', { ascending: false }).limit(200),
                    supabase.from('b2_tedarikciler').select('id, firma_adi').eq('aktif_mi', true).order('firma_adi', { ascending: true })
                ]);
                if (kumasRes.status === 'fulfilled' && kumasRes.value.data) setKumaslar(kumasRes.value.data.filter(k => k.aktif !== false));
                if (tedarikciRes.status === 'fulfilled' && tedarikciRes.value.data) setTedarikciler(tedarikciRes.value.data);
            } else if (sekme === 'aksesuar') {
                const { data, error } = await supabase.from('b1_aksesuar_arsivi').select('*').order('created_at', { ascending: false }).limit(200);
                if (error) throw error;
                if (data) setAksesuarlar(data.filter(a => a.aktif !== false));
            } else if (sekme === 'gorsel') {
                const [kumasRes, aksesuarRes] = await Promise.allSettled([
                    supabase.from('b1_kumas_arsivi').select('id,kumas_adi,fotograf_url').not('fotograf_url', 'is', null).limit(100),
                    supabase.from('b1_aksesuar_arsivi').select('id,aksesuar_adi,fotograf_url').not('fotograf_url', 'is', null).limit(100)
                ]);

                const kData = (kumasRes.status === 'fulfilled' && kumasRes.value?.data) ? kumasRes.value.data.filter(k => k.aktif !== false) : [];
                const aData = (aksesuarRes.status === 'fulfilled' && aksesuarRes.value?.data) ? aksesuarRes.value.data.filter(a => a.aktif !== false) : [];
                setGorselArsiv([...kData.map(x => ({ ...x, tip: 'kumas', ad: x.kumas_adi })), ...aData.map(x => ({ ...x, tip: 'aksesuar', ad: x.aksesuar_adi }))]);
            }
        } catch (error) {
            goster('Bağlantı Hatası: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const kaydetKumas = async () => {
        if (!form.kumas_kodu.trim() || form.kumas_kodu.length > 50) return goster('Kumaş kodu zorunlu ve en fazla 50 karakter olmalı!', 'error');
        if (!form.kumas_adi.trim() || form.kumas_adi.length > 200) return goster('Kumaş adı zorunlu ve en fazla 200 karakter olmalı!', 'error');
        if (!form.birim_maliyet_tl || parseFloat(form.birim_maliyet_tl) < 0) return goster('Birim maliyet zorunlu (Negatif olamaz)!', 'error');
        if (!form.stok_mt || parseFloat(form.stok_mt) < 0) return goster('Stok miktarı zorunlu (Negatif olamaz)!', 'error');
        setLoading(true);

        const payload = {
            kumas_kodu: form.kumas_kodu.toUpperCase().trim(),
            kumas_adi: form.kumas_adi.trim(),
            kumas_adi_ar: form.kumas_adi_ar.trim() || null,
            kumas_tipi: form.kumas_tipi,
            kompozisyon: form.kompozisyon.trim() || null,
            birim_maliyet_tl: parseFloat(form.birim_maliyet_tl),
            genislik_cm: form.genislik_cm ? parseFloat(form.genislik_cm) : null,
            gramaj_gsm: form.gramaj_gsm ? parseFloat(form.gramaj_gsm) : null,
            esneme_payi_yuzde: parseFloat(form.esneme_payi_yuzde) || 0,
            fotograf_url: form.fotograf_url.trim() || null,
            tedarikci_adi: form.tedarikci_adi.trim() || null,
            tedarikci_id: form.tedarikci_id || null,
            stok_mt: parseFloat(form.stok_mt),
            min_stok_mt: parseFloat(form.min_stok_mt) || 10,
        };

        try {
            // [OFFLINE-ZIRHI] İnternet yoksa kuyruğa al
            if (!navigator.onLine) {
                cevrimeKuyrugaAl('b1_kumas_arsivi', payload);
                goster('⚠️ İnternet Yok: Wifi Gelince Fırlatılacak (Kumaş kuyruğa alındı).', 'success');
                setForm(BOSH_KUMAS); setFormAcik(false);
                setLoading(false);
                return;
            }

            // [FAZ3-GÜVENLİ] Server-side API Route üzerinden gönder
            const yanit = await fetch('/api/kumas-ekle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tip: 'kumas', veri: payload }),
            });
            const sonuc = await yanit.json();

            if (yanit.status === 409) return goster('⚠️ ' + sonuc.hata, 'error');
            if (yanit.status === 429) return goster('⏳ Çok fazla istek! Lütfen bekleyin.', 'error');
            if (!yanit.ok) throw new Error(sonuc.hata || 'Sunucu hatası');

            goster('✅ Kumaş kaydedildi!');
            telegramBildirim(`📦 YENİ ENVANTER\n${form.kumas_adi} (Kod: ${form.kumas_kodu}) depoya işlendi.\nMaliyet: ₺${form.birim_maliyet_tl}\nStok: ${form.stok_mt}mt`);
            setForm(BOSH_KUMAS); setFormAcik(false);
            yukle();
        } catch (error) {
            goster('Hata: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const kaydetAksesuar = async () => {
        if (!aksForm.aksesuar_kodu.trim() || aksForm.aksesuar_kodu.length > 50) return goster('Aksesuar kodu zorunlu ve en fazla 50 karakter olmalı!', 'error');
        if (!aksForm.aksesuar_adi.trim() || aksForm.aksesuar_adi.length > 200) return goster('Aksesuar adı zorunlu ve en fazla 200 karakter olmalı!', 'error');
        if (parseFloat(aksForm.birim_maliyet_tl) < 0) return goster('Maliyet negatif olamaz!', 'error');
        setLoading(true);

        const payload = {
            aksesuar_kodu: aksForm.aksesuar_kodu.toUpperCase().trim(),
            aksesuar_adi: aksForm.aksesuar_adi.trim(),
            aksesuar_adi_ar: aksForm.aksesuar_adi_ar.trim() || null,
            tip: aksForm.tip,
            birim: aksForm.birim,
            birim_maliyet_tl: parseFloat(aksForm.birim_maliyet_tl) || 0,
            stok_adet: parseFloat(aksForm.stok_adet) || 0,
            min_stok: parseFloat(aksForm.min_stok) || 100,
            fotograf_url: aksForm.fotograf_url.trim() || null,
            tedarikci_adi: aksForm.tedarikci_adi.trim() || null,
        };

        try {
            // [OFFLINE-ZIRHI] İnternet yoksa kuyruğa al (yalnızca yeni kayıt)
            if (!navigator.onLine && !duzenleId) {
                cevrimeKuyrugaAl('b1_aksesuar_arsivi', payload);
                goster('⚠️ İnternet Yok: Wifi Gelince Fırlatılacak (Aksesuar kuyruğa alındı).', 'success');
                setAksForm(BOSH_AKS); setFormAcik(false); setDuzenleId(null); setDuzenleTip(null);
                setLoading(false);
                return;
            }

            if (duzenleId && duzenleTip === 'aksesuar') {
                // Düzenleme → direkt Supabase UPDATE (server PUT route eklenene kadar)
                const { error } = await supabase.from('b1_aksesuar_arsivi').update(payload).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Aksesuar güncellendi!');
            } else {
                // [FAZ3-GÜVENLİ] Yeni ekleme → Server API Route
                const yanit = await fetch('/api/kumas-ekle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tip: 'aksesuar', veri: payload }),
                });
                const sonuc = await yanit.json();
                if (yanit.status === 409) return goster('⚠️ ' + sonuc.hata, 'error');
                if (yanit.status === 429) return goster('⏳ Çok fazla istek! Lütfen bekleyin.', 'error');
                if (!yanit.ok) throw new Error(sonuc.hata || 'Sunucu hatası');
                goster('✅ Aksesuar kaydedildi!');
                telegramBildirim(`📎 YENİ AKSESUAR\n${aksForm.aksesuar_adi}\nMaliyet: ₺${aksForm.birim_maliyet_tl}\nStok: ${aksForm.stok_adet}`);
            }
            setAksForm(BOSH_AKS); setFormAcik(false); setDuzenleId(null); setDuzenleTip(null); yukle();
        } catch (error) {
            goster('Hata: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const sil = async (tablo, id) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        setIslemdeId('sil_' + id);

        // GÜVENLİK: Sunucu taraflı PIN doğrulama
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            kullanici,
            'Bu veriyi silmek için Yönetici PIN kodunu girin:'
        );
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error'); }

        if (!confirm('Silmek istediğinize çok emin misiniz? (Bu işlem geri alınamaz)')) { setIslemdeId(null); return; }

        try {

            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String(tablo).replace(/['"]/g, ''),
                    islem_tipi: 'SILME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
                }]).catch(() => { });
            } catch (e) { }

            const { error } = await supabase.from(tablo).update({ aktif: false }).eq('id', id);
            if (error) throw error;
            yukle(); goster('Pasif arşive kaldırıldı. Veri veritabanından silinmedi.');
            if (tablo === 'b1_kumas_arsivi') telegramBildirim(`📂 KUMAŞ ARŞİVE KALDIRIDI\nBir kumaş pasif arşive çekildi (soft delete).`);
            if (tablo === 'b1_aksesuar_arsivi') telegramBildirim(`📂 AKSESUAR ARŞİVE KALDIRILDI\nBir aksesuar pasif arşive çekildi (soft delete).`);
        } catch (error) {
            goster('Silme hatası: ' + error.message, 'error');
        } finally {
            setIslemdeId(null);
        }
    };

    const duzenleKumas = (k) => {
        setForm({
            kumas_kodu: k.kumas_kodu, kumas_adi: k.kumas_adi, kumas_adi_ar: k.kumas_adi_ar || '',
            kumas_tipi: k.kumas_tipi, kompozisyon: k.kompozisyon || '',
            birim_maliyet_tl: String(k.birim_maliyet_tl || ''), genislik_cm: String(k.genislik_cm || ''),
            gramaj_gsm: String(k.gramaj_gsm || ''), esneme_payi_yuzde: String(k.esneme_payi_yuzde || '0'),
            fotograf_url: k.fotograf_url || '', tedarikci_adi: k.tedarikci_adi || '',
            tedarikci_id: k.tedarikci_id || '',
            stok_mt: String(k.stok_mt || ''), min_stok_mt: String(k.min_stok_mt || '10'),
        });
        setDuzenleId(k.id); setDuzenleTip('kumas'); setFormAcik(true);
        setSekme('kumas'); window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const kaydetKumasGuncelle = async () => {
        if (!form.kumas_kodu.trim()) return goster('Kumaş kodu zorunlu!', 'error');
        setLoading(true);
        try {
            const { error } = await supabase.from('b1_kumas_arsivi').update({
                kumas_kodu: form.kumas_kodu.toUpperCase().trim(),
                kumas_adi: form.kumas_adi.trim(),
                kumas_adi_ar: form.kumas_adi_ar.trim() || null,
                kumas_tipi: form.kumas_tipi,
                kompozisyon: form.kompozisyon.trim() || null,
                birim_maliyet_tl: parseFloat(form.birim_maliyet_tl) || 0,
                genislik_cm: form.genislik_cm ? parseFloat(form.genislik_cm) : null,
                gramaj_gsm: form.gramaj_gsm ? parseFloat(form.gramaj_gsm) : null,
                esneme_payi_yuzde: parseFloat(form.esneme_payi_yuzde) || 0,
                fotograf_url: form.fotograf_url.trim() || null,
                tedarikci_adi: form.tedarikci_adi.trim() || null,
                tedarikci_id: form.tedarikci_id || null,
                stok_mt: parseFloat(form.stok_mt) || 0,
                min_stok_mt: parseFloat(form.min_stok_mt) || 10,
            }).eq('id', duzenleId);
            if (!error) { goster('✅ Kumaş güncellendi!'); setForm(BOSH_KUMAS); setFormAcik(false); setDuzenleId(null); setDuzenleTip(null); yukle(); }
            else throw error;
        } catch (error) {
            goster('Hata veya sunucu çökmesi. Güncellenemedi. ' + error.message, 'error');
        }
        setLoading(false);
    };

    const isAR = mounted && lang === 'ar';


    const filtreli_kumaslar = kumaslar.filter(k => k.kumas_adi?.toLowerCase().includes(arama.toLowerCase()) || k.kumas_kodu?.toLowerCase().includes(arama.toLowerCase()));
    const filtreli_aksesuarlar = aksesuarlar.filter(a => a.aksesuar_adi?.toLowerCase().includes(arama.toLowerCase()) || a.aksesuar_kodu?.toLowerCase().includes(arama.toLowerCase()));

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' };

    // Hydration Mismatch Koruması
    if (!mounted) return null;

    // 🟢 GÜVENLİK KALKANI EKRANI
    if (!yetkiliMi) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Kumaş Arşivi verileri gizlidir. Görüntülemek için Üretim PİN veya Yetkili Kullanıcı girişi gereklidir.</p>
            </div>
        );
    }

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            {/* BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            {isAR ? 'أرشيف الأقمشة والمواد' : 'Kumaş & Materyal Arşivi'}
                        </h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                            {isAR ? 'كتالوج رقمي — يتم اختيار القماش المناسب لكل نموذج من هنا' : 'Dijital kartela — modele hangi kumaşın gideceği buradan seçilir'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setFormAcik(!formAcik)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                        <Plus size={18} /> {isAR ? 'إضافة جديد' : 'Yeni Ekle'}
                    </button>
                    {/* CC Kriteri (M3 - Kalıp'a geçiş için akış rotası) */}
                    <Link href="/kalip" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#d97706', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(217,119,6,0.35)' }}>
                            📐 Kalıp & Serileme (M3) Geç
                        </button>
                    </Link>
                </div>
            </div>

            {/* İSTATİSTİK KARTLARI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam Kumaş', val: kumaslar.length, color: '#047857', bg: '#ecfdf5' },
                    { label: '⚠️ Kritik Stok', val: kumaslar.filter(k => (k.stok_mt || 0) <= (k.min_stok_mt || 10)).length, color: '#dc2626', bg: '#fef2f2' },
                    { label: 'Aksesuar', val: aksesuarlar.length, color: '#d97706', bg: '#fffbeb' },
                    { label: 'Tedarikçi', val: tedarikciler.length, color: '#374151', bg: '#f8fafc' },
                ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontWeight: 900, fontSize: '1.3rem', color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* MESAJ */}
            {mesaj.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />} {mesaj.text}
                </div>
            )}

            {/* SEKMELER */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                {SEKMELER.map(s => (
                    <button key={s.id} onClick={() => { setSekme(s.id); setFormAcik(false); setArama(''); }}
                        style={{
                            padding: '8px 20px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                            borderColor: sekme === s.id ? '#047857' : '#e5e7eb',
                            background: sekme === s.id ? '#047857' : 'white',
                            color: sekme === s.id ? 'white' : '#374151'
                        }}>
                        {isAR ? s.label_ar : s.label_tr}
                    </button>
                ))}
            </div>

            {/* ARAMA */}
            {sekme !== 'gorsel' && (
                <div style={{ position: 'relative', marginBottom: '1rem', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input type="text" value={arama} onChange={e => setArama(e.target.value)}
                        placeholder={isAR ? 'بحث بالاسم أو الكود...' : 'Kod veya ada göre ara...'}
                        style={{ ...inp, paddingLeft: 36 }} />
                </div>
            )}

            {/* =========== KUMAŞ FORMU =========== */}
            {formAcik && sekme === 'kumas' && (
                <div style={{ background: 'white', border: '2px solid #10b981', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(16,185,129,0.12)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Scissors size={16} /> {isAR ? 'إضافة قماش جديد' : 'Yeni Kumaş Ekle'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                        {[
                            { key: 'kumas_kodu', label: 'Kumaş Kodu *', label_ar: 'رمز القماش *', ph: 'KMS-001' },
                            { key: 'kumas_adi', label: 'Kumaş Adı (TR) *', label_ar: 'اسم القماش (بالتركية) *', ph: 'Örn: Yazlık Keten' },
                            { key: 'kumas_adi_ar', label: 'Kumaş Adı (AR)', label_ar: 'اسم القماش (بالعربية)', ph: 'مثال: كتان صيفي', dir: 'rtl' },
                            { key: 'kompozisyon', label: 'Kompozisyon', label_ar: 'التركيب', ph: '%100 Pamuk' },
                            { key: 'birim_maliyet_tl', label: 'Birim Maliyet (TL/mt) *', label_ar: 'التكلفة (ليرة/متر) *', ph: '45.00', type: 'number' },
                            { key: 'genislik_cm', label: 'Genişlik (cm)', label_ar: 'العرض (سم)', ph: '150', type: 'number' },
                            { key: 'gramaj_gsm', label: 'Gramaj (gr/m²)', label_ar: 'الوزن (غ/م²)', ph: '200', type: 'number' },
                            { key: 'esneme_payi_yuzde', label: 'Esneme Payı (%)', label_ar: 'هامش المرونة (%)', ph: '0', type: 'number' },
                            { key: 'stok_mt', label: 'Mevcut Stok (mt) *', label_ar: 'المخزون الحالي (متر) *', ph: '500', type: 'number' },
                            { key: 'min_stok_mt', label: 'Min. Stok Eşiği (mt)', label_ar: 'الحد الأدنى للمخزون (متر)', ph: '10', type: 'number' },
                            { key: 'fotograf_url', label: 'Fotoğraf URL', label_ar: 'رابط الصورة', ph: 'https://...' },
                        ].map(f => (
                            <div key={f.key}>
                                <label style={lbl}>{isAR ? f.label_ar : f.label}</label>
                                <input type={f.type || 'text'} dir={f.dir || 'ltr'} value={form[f.key]} placeholder={f.ph}
                                    onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inp}
                                    onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                            </div>
                        ))}
                        <div>
                            <label style={lbl}>{isAR ? 'المورد (حساب)' : 'Sistem_Tedarikçi_Seç'}</label>
                            <select value={form.tedarikci_id} onChange={e => setForm({ ...form, tedarikci_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— Sistemden Tedarikçi Seç (Rehberden) —</option>
                                {tedarikciler.map(t => <option key={t.id} value={t.id}>{t.firma_adi}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>{isAR ? 'المورد (نص حر)' : 'Tedarikçi (Serbest Metin - Eski)'}</label>
                            <input type="text" value={form.tedarikci_adi} placeholder="Kayıtlı değilse tediyeceki adı yazın"
                                onChange={e => setForm({ ...form, tedarikci_adi: e.target.value })} style={inp}
                                onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                        </div>
                        <div>
                            <label style={lbl}>{isAR ? 'نوع القماش *' : 'Kumaş Tipi *'}</label>
                            <select value={form.kumas_tipi} onChange={e => setForm({ ...form, kumas_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {KUMAS_TIPLERI.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH_KUMAS); setFormAcik(false); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>{isAR ? 'إلغاء' : 'İptal'}</button>
                        <button onClick={duzenleId && duzenleTip === 'kumas' ? kaydetKumasGuncelle : kaydetKumas} disabled={loading}
                            style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
                            {loading ? '...' : (duzenleId ? 'Güncelle' : (isAR ? 'حفظ' : 'Kaydet'))}
                        </button>
                    </div>
                </div>
            )}

            {/* =========== AKSESUAR FORMU =========== */}
            {formAcik && sekme === 'aksesuar' && (
                <div style={{ background: 'white', border: '2px solid #047857', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.12)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem', fontSize: '1rem' }}>
                        {isAR ? '🧷 إضافة إكسسوار جديد' : '🧷 Yeni Aksesuar Ekle'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                        {[
                            { key: 'aksesuar_kodu', label: 'Aksesuar Kodu *', ph: 'AKS-001' },
                            { key: 'aksesuar_adi', label: 'Aksesuar Adı (TR) *', ph: 'Örn: Metal Düğme 18mm' },
                            { key: 'aksesuar_adi_ar', label: 'Aksesuar Adı (AR)', ph: '...', dir: 'rtl' },
                            { key: 'birim_maliyet_tl', label: 'Birim Maliyet (TL) *', ph: '2.50', type: 'number' },
                            { key: 'stok_adet', label: 'Mevcut Stok *', ph: '5000', type: 'number' },
                            { key: 'min_stok', label: 'Min. Stok', ph: '500', type: 'number' },
                            { key: 'tedarikci_adi', label: 'Tedarikçi', ph: 'Tedarikçi adı' },
                            { key: 'fotograf_url', label: 'Fotoğraf URL', ph: 'https://...' },
                        ].map(f => (
                            <div key={f.key}>
                                <label style={lbl}>{f.label}</label>
                                <input type={f.type || 'text'} dir={f.dir || 'ltr'} value={aksForm[f.key]} placeholder={f.ph}
                                    onChange={e => setAksForm({ ...aksForm, [f.key]: e.target.value })} style={inp}
                                    onFocus={e => e.target.style.borderColor = '#047857'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                            </div>
                        ))}
                        <div>
                            <label style={lbl}>{isAR ? 'النوع *' : 'Tip *'}</label>
                            <select value={aksForm.tip} onChange={e => setAksForm({ ...aksForm, tip: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {AKSESUAR_TIPLERI.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>{isAR ? 'الوحدة *' : 'Birim *'}</label>
                            <select value={aksForm.birim} onChange={e => setAksForm({ ...aksForm, birim: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {BIRIMLER.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setAksForm(BOSH_AKS); setFormAcik(false); setDuzenleId(null); setDuzenleTip(null); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>{isAR ? 'إلغاء' : 'İptal'}</button>
                        <button onClick={kaydetAksesuar} disabled={loading}
                            style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.3)' }}>
                            {loading ? '...' : (duzenleId ? 'Güncelle' : (isAR ? 'حفظ' : 'Kaydet'))}
                        </button>
                    </div>
                </div>
            )}

            {/* =========== KUMAŞ LİSTESİ =========== */}
            {sekme === 'kumas' && (
                <div>
                    {loading && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem', fontWeight: 700 }}>Yükleniyor...</p>}
                    {!loading && filtreli_kumaslar.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <Layers size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>{isAR ? 'لا توجد أقمشة. أضف قماشاً جديداً.' : 'Kayıtlı kumaş yok. Yeni kumaş ekleyin.'}</p>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '1rem' }}>
                        {filtreli_kumaslar.map(k => {
                            const dusukStok = k.stok_mt < k.min_stok_mt;
                            return (
                                <div key={k.id} style={{ background: 'white', border: '2px solid', borderColor: dusukStok ? '#ef4444' : '#f1f5f9', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>
                                    {/* Fotoğraf */}
                                    {k.fotograf_url ? (
                                        <div style={{ height: 140, overflow: 'hidden', background: '#f8fafc' }}>
                                            <img src={k.fotograf_url} alt={k.kumas_adi} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                                        </div>
                                    ) : (
                                        <div style={{ height: 80, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Scissors size={32} style={{ color: '#6ee7b7' }} />
                                        </div>
                                    )}
                                    <div style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 4 }}>{k.kumas_kodu}</span>
                                                <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: '4px 0 0' }}>{isAR && k.kumas_adi_ar ? k.kumas_adi_ar : k.kumas_adi}</h3>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button onClick={() => { setSeciliKumas(k); setBarkodModaliAcik(true); }} title="Barkod Çıkart" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><QrCode size={14} /></button>
                                                <button onClick={() => duzenleKumas(k)} style={{ background: '#ecfdf5', border: 'none', color: '#047857', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}>✏️</button>
                                                <button onClick={() => sil('b1_kumas_arsivi', k.id)} disabled={islemdeId === 'sil_' + k.id} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: 6, cursor: islemdeId === 'sil_' + k.id ? 'not-allowed' : 'pointer', opacity: islemdeId === 'sil_' + k.id ? 0.5 : 1 }}><Trash2 size={13} /></button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{k.kumas_tipi}</span>
                                            {k.kompozisyon && <span style={{ fontSize: '0.7rem', background: '#fefce8', color: '#ca8a04', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{k.kompozisyon}</span>}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                                            <div style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 10px' }}>
                                                <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{isAR ? 'التكلفة' : 'Maliyet'}</div>
                                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>₺{parseFloat(k.birim_maliyet_tl).toFixed(2)}<span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>/mt</span></div>
                                            </div>
                                            <div style={{ background: dusukStok ? '#fef2f2' : '#f0fdf4', borderRadius: 6, padding: '6px 10px', border: dusukStok ? '1px solid #fca5a5' : '1px solid #bbf7d0' }}>
                                                <div style={{ fontSize: '0.6rem', color: dusukStok ? '#ef4444' : '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
                                                    {dusukStok ? '⚠️ DÜŞÜK' : isAR ? 'المخزون' : 'Stok'}
                                                </div>
                                                <div style={{ fontWeight: 900, color: dusukStok ? '#ef4444' : '#059669', fontSize: '0.9rem' }}>{k.stok_mt} <span style={{ fontSize: '0.65rem' }}>mt</span></div>
                                            </div>
                                        </div>
                                        {(k.b2_tedarikciler?.firma_adi || k.tedarikci_adi) && <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0.5rem 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={11} /> {k.b2_tedarikciler?.firma_adi || k.tedarikci_adi} {k.b2_tedarikciler && <span style={{ fontSize: '0.55rem', background: '#e0e7ff', color: '#4f46e5', padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>REHBER ONAYLI</span>}</p>}
                                        <div style={{ marginTop: 6, fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>🕐 {formatTarih(k.created_at)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* İSTATİSTİK */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Toplam Kumaş', val: kumaslar.length, color: '#047857' },
                            { label: 'Düşük Stok', val: kumaslar.filter(k => k.stok_mt < k.min_stok_mt).length, color: '#ef4444' },
                            { label: 'Stokta Var', val: kumaslar.filter(k => parseFloat(k.stok_mt) > 0).length, color: '#10b981' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 10, padding: '0.75rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{s.label}</span>
                                <span style={{ fontWeight: 900, fontSize: '1.1rem', color: s.color }}>{s.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* =========== AKSESUAR LİSTESİ =========== */}
            {sekme === 'aksesuar' && (
                <div>
                    {!loading && filtreli_aksesuarlar.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <Package size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>{isAR ? 'لا توجد إكسسوارات.' : 'Kayıtlı aksesuar yok.'}</p>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '1rem' }}>
                        {filtreli_aksesuarlar.map(a => {
                            const dusuk = a.stok_adet < a.min_stok;
                            return (
                                <div key={a.id} style={{ background: 'white', border: '2px solid', borderColor: dusuk ? '#ef4444' : '#f1f5f9', borderRadius: 14, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 4 }}>{a.aksesuar_kodu}</span>
                                            <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', margin: '4px 0 0' }}>{isAR && a.aksesuar_adi_ar ? a.aksesuar_adi_ar : a.aksesuar_adi}</h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button onClick={() => { setAksForm({ aksesuar_kodu: a.aksesuar_kodu, aksesuar_adi: a.aksesuar_adi, aksesuar_adi_ar: a.aksesuar_adi_ar || '', tip: a.tip, birim: a.birim, birim_maliyet_tl: String(a.birim_maliyet_tl || ''), stok_adet: String(a.stok_adet || ''), min_stok: String(a.min_stok || '100'), fotograf_url: a.fotograf_url || '', tedarikci_adi: a.tedarikci_adi || '' }); setDuzenleId(a.id); setDuzenleTip('aksesuar'); setSekme('aksesuar'); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: '#fef3c7', border: 'none', color: '#b45309', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}>✏️</button>
                                            <button onClick={() => sil('b1_aksesuar_arsivi', a.id)} disabled={islemdeId === 'sil_' + a.id} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: 6, cursor: islemdeId === 'sil_' + a.id ? 'not-allowed' : 'pointer', opacity: islemdeId === 'sil_' + a.id ? 0.5 : 1 }}><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.375rem', margin: '0.5rem 0', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{a.tip}</span>
                                        <span style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{a.birim}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                                        <div style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 10px' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>MALİYET</div>
                                            <div style={{ fontWeight: 900, color: '#0f172a' }}>₺{parseFloat(a.birim_maliyet_tl).toFixed(2)}</div>
                                        </div>
                                        <div style={{ background: dusuk ? '#fef2f2' : '#f0fdf4', borderRadius: 6, padding: '6px 10px', border: dusuk ? '1px solid #fca5a5' : '1px solid #bbf7d0' }}>
                                            <div style={{ fontSize: '0.6rem', color: dusuk ? '#ef4444' : '#16a34a', fontWeight: 700 }}>{dusuk ? '⚠️ DÜŞÜK' : 'STOK'}</div>
                                            <div style={{ fontWeight: 900, color: dusuk ? '#ef4444' : '#059669' }}>{a.stok_adet} {a.birim}</div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>🕐 {formatTarih(a.created_at)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* =========== GÖRSEL ARŞİV =========== */}
            {sekme === 'gorsel' && (
                <div>
                    {!loading && gorselArşiv.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <Image size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>
                                {isAR ? 'لا توجد صور. أضف روابط صور عند إضافة الأقمشة والإكسسوارات.' : 'Görsel yok. Kumaş veya aksesuar eklerken fotoğraf URL girin.'}
                            </p>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1rem' }}>
                        {gorselArşiv.map(g => (
                            <div key={g.id} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                <div style={{ height: 160, background: '#f8fafc', overflow: 'hidden' }}>
                                    <img src={g.fotograf_url} alt={g.ad} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.parentElement.style.display = 'flex'; e.target.parentElement.style.alignItems = 'center'; e.target.parentElement.style.justifyContent = 'center'; e.target.style.display = 'none'; }} />
                                </div>
                                <div style={{ padding: '0.75rem' }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, background: g.tip === 'kumas' ? '#ecfdf5' : '#fef3c7', color: g.tip === 'kumas' ? '#047857' : '#b45309', padding: '2px 6px', borderRadius: 4 }}>{g.tip === 'kumas' ? 'KUMAŞ' : 'AKSESUAR'}</span>
                                    <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a', margin: '4px 0 0' }}>{g.ad}</p>
                                    <a href={g.fotograf_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                        <Eye size={11} /> {isAR ? 'عرض كامل الحجم' : 'Tam boyut gör'}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BARKOD MODALI: Fiziksel Dünya Bağlantısı */}
            <SilBastanModal acik={barkodModaliAcik} onClose={() => setBarkodModaliAcik(false)} title="🖨️ Kumaş Barkodu Yazdır">
                {seciliKumas && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'white', padding: '2rem', borderRadius: '12px' }}>
                        <FizikselQRBarkod
                            veriKodu={seciliKumas.kumas_kodu}
                            baslik={seciliKumas.kumas_adi}
                            aciklama={`${seciliKumas.stok_mt} mt • ${seciliKumas.kumas_tipi}`}
                        />
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                            Depocu bu barkodu top kumaşın üzerine yapıştırır.<br />Kesimhanede kumaş kameraya okutulduğu an dijital iş akışı başlar.
                        </p>
                    </div>
                )}
            </SilBastanModal>
        </div>
    );
}
