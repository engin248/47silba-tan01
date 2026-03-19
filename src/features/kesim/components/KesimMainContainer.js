'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { Scissors, Plus, Search, CheckCircle2, AlertTriangle, Trash2, ShieldAlert, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import SilBastanModal from '@/components/ui/SilBastanModal';
import FizikselQRBarkod from '@/lib/components/barkod/FizikselQRBarkod';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import Link from 'next/link';

const BOSH_KESIM = {
    model_taslak_id: '', pastal_kat_sayisi: '', kesilen_net_adet: '',
    fire_orani: '0', durum: 'kesimde',
    kesimci_adi: '', kesim_tarihi: '', beden_dagilimi: '{}', notlar: '', kumas_topu_no: '', kullanilan_kumas_mt: ''
};
const DURUMLAR = ['kesimde', 'tamamlandi', 'iptal'];
const BEDENLER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export default function KesimMainContainer() {
    const { kullanici: rawKullanici } = useAuth();
    const kullanici = /** @type {any} */(rawKullanici);
    const { lang } = useLang();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [kesimler, setKesimler] = useState(/** @type {any[]} */([]));
    const [modeller, setModeller] = useState(/** @type {any[]} */([]));
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(/** @type {any} */(BOSH_KESIM));
    const [arama, setArama] = useState('');
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtreDurum, setFiltreDurum] = useState('hepsi');
    const [barkodAcik, setBarkodAcik] = useState(false);
    const [seciliKesim, setSeciliKesim] = useState(/** @type {any} */(null));
    const [duzenleId, setDuzenleId] = useState(/** @type {any} */(null));
    const [islemdeId, setIslemdeId] = useState(/** @type {any} */(null));

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        let kanal;
        if (erisebilir) {
            kanal = supabase.channel('islem-gercek-zamanli-ai-kesim')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_kesim_operasyonlari' }, () => { yukle(); })
                .subscribe();
        }
        yukle();
        return () => { if (kanal) supabase.removeChannel(kanal); };
    }, [kullanici?.id, kullanici?.grup]);

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı)

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 6000); };

    const timeoutPromise = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 sn)')), 10000));

    const yukle = async () => {
        setLoading(true);
        try {
            const p1 = supabase.from('b1_kesim_operasyonlari').select('*, b1_model_taslaklari(model_kodu, model_adi)').order('created_at', { ascending: false }).limit(200);
            const p2 = supabase.from('b1_model_taslaklari').select('id, model_kodu, model_adi').limit(500);
            const res = await Promise.race([Promise.allSettled([p1, p2]), timeoutPromise()]);
            const [kesimRes, modelRes] = res;
            if (kesimRes.status === 'fulfilled' && kesimRes.value.data) setKesimler(kesimRes.value.data);
            if (modelRes.status === 'fulfilled' && modelRes.value.data) setModeller(modelRes.value.data);
        } catch (error) {
            goster('Bağlantı/Zaman aşımı hatası: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const kaydetKesim = async () => {
        if (!form.model_taslak_id) return goster('Model seçmek zorunludur!', 'error');
        if (!form.pastal_kat_sayisi || form.pastal_kat_sayisi <= 0) return goster('Pastal kat sayısı hatalı!', 'error');
        setLoading(true);

        const payload = {
            model_taslak_id: form.model_taslak_id,
            pastal_kat_sayisi: parseInt(form.pastal_kat_sayisi) || 0,
            kesilen_net_adet: parseInt(form.kesilen_net_adet) || 0,
            fire_orani: parseFloat(form.fire_orani) || 0,
            durum: form.durum,
            kesimci_adi: form.kesimci_adi.trim() || null,
            kesim_tarihi: form.kesim_tarihi || null,
            beden_dagilimi: typeof form.beden_dagilimi === 'object' ? JSON.stringify(form.beden_dagilimi) : form.beden_dagilimi,
            notlar: form.notlar.trim() || null,
            kumas_topu_no: form.kumas_topu_no.trim() || null,
        };

        if (!navigator.onLine) {
            cevrimeKuyrugaAl('b1_kesim_operasyonlari', duzenleId ? 'UPDATE' : 'INSERT', /** @type {any} */({ ...payload, id: duzenleId }));
            goster('⚠️ İnternet Yok: Kesimhane kayıtları kuyruğa alındı. Wifi gelince merkeze yollanacak.', 'success');
            setForm(BOSH_KESIM); setFormAcik(false); setDuzenleId(null);
            setLoading(false);
            return;
        }

        try {
            if (duzenleId) {
                const { error } = await supabase.from('b1_kesim_operasyonlari').update(payload).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Kesim güncellendi!');
            } else {
                const { error } = await supabase.from('b1_kesim_operasyonlari').insert([payload]);
                if (!error) {
                    const seciliModel = modeller.find(m => m.id === form.model_taslak_id);
                    goster('✅ Kesim operasyonu kaydedildi!');
                    telegramBildirim(`✂️ YENİ KESİM OPERASYONU\nModel: ${seciliModel?.model_kodu}\nKesimci: ${form.kesimci_adi || '—'}\nPastal: ${form.pastal_kat_sayisi} kat\nNet Adet: ${form.kesilen_net_adet}\nBeden: ${form.beden_dagilimi || '—'}`);
                } else throw error;
            }
            setForm(BOSH_KESIM); setFormAcik(false); setDuzenleId(null);
            yukle();
        } catch (error) {
            goster('Hata oluştu: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const duzenleKesim = (k) => {
        setForm({
            model_taslak_id: k.model_taslak_id || '',
            pastal_kat_sayisi: String(k.pastal_kat_sayisi || ''),
            kesilen_net_adet: String(k.kesilen_net_adet || ''),
            fire_orani: String(k.fire_orani || '0'),
            durum: k.durum || 'kesimde',
            kesimci_adi: k.kesimci_adi || '',
            kesim_tarihi: k.kesim_tarihi || '',
            beden_dagilimi: k.beden_dagilimi || '{}',
            notlar: k.notlar || '',
            kumas_topu_no: k.kumas_topu_no || '',
            kullanilan_kumas_mt: k.kullanilan_kumas_mt || ''
        });
        setDuzenleId(k.id);
        setFormAcik(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ─── M3 → M4 VERİ KÖPRÜSÜ ───────────────────────────────────────────────────
    const isEmriOlustur = async (k) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        if (k.durum !== 'tamamlandi') return goster('Sadece tamamlanan kesimler M4\'e aktarılabilir!', 'error');
        if (!confirm(`"${k.b1_model_taslaklari?.model_kodu}" için Üretim İş Emri oluşturulsun mu?\nAdet: ${k.kesilen_net_adet}`)) return;
        setLoading(true);
        setIslemdeId('emr_' + k.id);
        try {
            const { data: mevcut } = await supabase.from('production_orders')
                .select('id').eq('model_id', k.model_taslak_id).in('status', ['pending', 'in_progress']);
            if (mevcut && mevcut.length > 0) {
                setLoading(false);
                setIslemdeId(null);
                return goster('⚠️ Bu model için zaten aktif bir iş emri var!', 'error');
            }

            // 💥 KASAP OPERASYONU: V1 Tablosu V2'ye Yönlendirildi
            const { data: yeniEmir, error } = await supabase.from('production_orders').insert([{
                order_code: 'KSM-ORD-' + Date.now(),
                model_id: k.model_taslak_id,
                quantity: k.kesilen_net_adet || 0,
                status: 'pending'
            }]).select().single();
            if (error) throw error;

            // 💥 KASAP OPERASYONU: Kesim Firesi Otomatik Maliyete Yansıtılıyor
            if (parseFloat(k.fire_orani) > 0) {
                const fireZarari = parseFloat(k.fire_orani) * 15; // Kumaş MT birim fiyat tahmini
                await supabase.from('b1_maliyet_kayitlari').insert([{
                    order_id: yeniEmir.id,
                    maliyet_tipi: 'fire_kaybi',
                    kalem_aciklama: `KSM-${k.id} Kesim Firesi Otomatik Yansıma (%${k.fire_orani})`,
                    tutar_tl: fireZarari > 0 ? fireZarari : parseFloat(k.fire_orani),
                    onay_durumu: 'hesaplandi'
                }]);
            }

            goster(`✅ M4 Üretim İş Emri oluşturuldu! ${k.b1_model_taslaklari?.model_kodu} — ${k.kesilen_net_adet} adet`);
            telegramBildirim(`🔗 M3→M4 KÖPRÜ\nKesimden Üretime: ${k.b1_model_taslaklari?.model_kodu}\nAdet: ${k.kesilen_net_adet}\nİş emri "Bekliyor" olarak açıldı.`);
        } catch (error) { goster('İş emri hatası: ' + error.message, 'error'); }
        setLoading(false);
        setIslemdeId(null);
    };

    const durumGuncelle = async (id, yeniDurum, model_kodu) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        if (!navigator.onLine) return goster('İnternet Yok: Durum güncellemesi sadece online iken yapılabilir!', 'error');
        setIslemdeId('durum_' + id);
        try {
            await supabase.from('b1_kesim_operasyonlari').update({ durum: yeniDurum }).eq('id', id);
            yukle();
            if (yeniDurum === 'tamamlandi') {
                telegramBildirim(`✂️ KESİM TAMAMLANDI\nModel: ${model_kodu} için kesim işlemi tamamlandı. Üretim Bandına (M4) sevke hazır.`);

                // 💥 KASAP OPERASYONU: Kumaş M2 Stoktan Otomatik Düşülecek! (M3->M2 Veri Zırhı)
                try {
                    const { data: kData } = await supabase.from('b1_kesim_operasyonlari').select('kumas_topu_no, kullanilan_kumas_mt').eq('id', id).single();
                    if (kData && kData.kumas_topu_no && parseFloat(kData.kullanilan_kumas_mt) > 0) {
                        const kumasKodu = kData.kumas_topu_no.trim();
                        const dusulecek = parseFloat(kData.kullanilan_kumas_mt);

                        const { data: kumas } = await supabase.from('b1_kumas_arsivi').select('id, stok_mt').eq('kumas_kodu', kumasKodu).single();
                        if (kumas) {
                            const yeniStok = Math.max(0, parseFloat(kumas.stok_mt || 0) - dusulecek);
                            await supabase.from('b1_kumas_arsivi').update({ stok_mt: yeniStok }).eq('id', kumas.id);
                            telegramBildirim(`📉 M3 KESİM STOK DÜŞÜMÜ\nKumaş Kodu: ${kumasKodu}\nDüşülen: ${dusulecek} mt\nKalan Stok: ${yeniStok} mt`);
                        }
                    }
                } catch (stokHata) {
                    console.error("Stok düşme hatası (Kumaş kaydı olmayabilir):", stokHata);
                }
            }
        } catch (error) { goster('Durum güncellenemedi!', 'error'); }
        finally { setIslemdeId(null); }
    };

    const sil = async (id, m_kodu) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        setIslemdeId('sil_' + id);
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            /** @type {any} */(kullanici)
        );
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error'); }
        if (!confirm('Bu kesim kaydını fiziksel silmek yerine arşive (iptal) kaldırmak istediğinize emin misiniz?')) { setIslemdeId(null); return; }
        try {
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b1_kesim_operasyonlari', islem_tipi: 'ARŞİVLEME', kullanici_adi: 'Saha Yetkilisi M3',
                    eski_veri: { durum: 'Soft Delete / Arşive alındı.', model_kodu: m_kodu, id: id }
                }]);
            } catch (e) {
                console.error("[KARA KUTU HATASI] B0 Kesim Loglaması (Arşivleme) başarısız:", e);
            }
            await supabase.from('b1_kesim_operasyonlari').update({ durum: 'iptal' }).eq('id', id);
            yukle(); goster('Kayıt arşive (iptal durumuna) alındı.');
            telegramBildirim(`🗑️ KESİM İPTAL EDİLDİ\n${m_kodu} modeline ait kesim kaydı yönetici onayıyla arşive kaldırıldı.`);
        } catch (error) { goster('Silme/Arşivleme hatası: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const isAR = mounted && lang === 'ar';
    const filtrelenmis = kesimler
        .filter(k => k.durum !== 'iptal' || filtreDurum === 'iptal') // İptalleri sadece İptal sekmesinde gster
        .filter(k => filtreDurum === 'hepsi' ? k.durum !== 'iptal' : k.durum === filtreDurum)
        .filter(k => k.b1_model_taslaklari?.model_kodu?.toLowerCase().includes(arama.toLowerCase()) ||
            k.b1_model_taslaklari?.model_adi?.toLowerCase().includes(arama.toLowerCase()) ||
            k.kesimci_adi?.toLowerCase().includes(arama.toLowerCase()));

    const istatistik = {
        toplam: kesimler.length,
        kesimde: kesimler.filter(k => k.durum === 'kesimde').length,
        tamamlandi: kesimler.filter(k => k.durum === 'tamamlandi').length,
        toplamAdet: kesimler.reduce((s, k) => s + (parseInt(k.kesilen_net_adet) || 0), 0),
    };

    const inp = /** @type {any} */ ({ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' });
    const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

    if (!mounted) return null;

    if (!yetkiliMi) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase' }}>{isAR ? 'تم حظر الدخول غير المصرح به' : 'YETKİSİZ GİRİŞ ENGELLENDİ (M3)'}</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 12 }}>Kesimhane verileri gizlidir. Üretim PİN kodu girmeniz gerekmektedir.</p>
            </div>
        );
    }

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>

            {/* BAŞLIK VE KÖPRÜ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Scissors size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            {isAR ? 'غرفة القص والعمليات الوسيطة' : 'Kesim & Ara İşçilik'}
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                            {isAR ? 'وحدة العمليات M3' : 'Hassas kesim, pastal işlemleri ve üretim bandı hazırlığı (M3)'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setFormAcik(!formAcik)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                        <Plus size={18} /> {isAR ? 'قص جديد' : 'Yeni Kesim'}
                    </button>
                    <Link href="/uretim" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#d97706', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(217,119,6,0.35)' }}>
                            ⚙️ Üretim Bandı (M4)
                        </button>
                    </Link>
                </div>
            </div>

            {/* İSTATİSTİK KARTLARI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam Kayıt', val: istatistik.toplam, color: '#047857', bg: '#ecfdf5' },
                    { label: '✂️ Kesimde', val: istatistik.kesimde, color: '#d97706', bg: '#fffbeb' },
                    { label: '✅ Tamamlandı', val: istatistik.tamamlandi, color: '#059669', bg: '#f0fdf4' },
                    { label: 'Toplam Adet', val: istatistik.toplamAdet, color: '#374151', bg: '#f8fafc' },
                ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontWeight: 900, fontSize: '1.3rem', color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* BİLDİRİM */}
            {mesaj.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', marginBottom: '1.5rem', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />} {mesaj.text}
                </div>
            )}

            {/* ARAMA + DURUM FİLTRE */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="text" value={arama} onChange={e => setArama(e.target.value)}
                        placeholder="Model, kesimci adına göre ara..."
                        style={{ ...inp, paddingLeft: 42 }} />
                </div>
                {[['hepsi', 'Tümü', '#374151'], ['kesimde', '✂️ Kesimde', '#d97706'], ['tamamlandi', '✅ Tamamlandı', '#047857'], ['iptal', '❌ İptal', '#dc2626']].map(([v, l, c]) => (
                    <button key={v} onClick={() => setFiltreDurum(v)}
                        style={{ padding: '8px 14px', border: '2px solid', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', borderColor: filtreDurum === v ? c : '#e5e7eb', background: filtreDurum === v ? c : 'white', color: filtreDurum === v ? 'white' : '#374151' }}>
                        {l}
                    </button>
                ))}
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>{filtrelenmis.length} kayıt</span>
            </div>

            {/* FORM */}
            {formAcik && (
                <div style={{ background: 'white', border: '2px solid #047857', borderRadius: 18, padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 40px rgba(4,120,87,0.08)' }}>
                    <h3 style={{ fontWeight: 900, color: '#065f46', marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Scissors size={18} /> {duzenleId ? 'Kesim Düzenle' : (isAR ? 'تسجيل عملية قص جديدة' : 'Yeni Kesim Kaydı')}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>

                        {/* ZORUNLU ALANLAR */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={lbl}>{isAR ? 'النموذج المراد قصه *' : 'Kesilecek Model *'}</label>
                            <select value={form.model_taslak_id} onChange={e => setForm({ ...form, model_taslak_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— {isAR ? 'اختر النموذج' : 'Model Seçiniz'} —</option>
                                {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} | {m.model_adi}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={lbl}>{isAR ? 'عدد طبقات الباستال *' : 'Pastal Kat Sayısı *'}</label>
                            <input type="number" dir="ltr" value={form.pastal_kat_sayisi} placeholder="Örn: 200"
                                onChange={e => {
                                    const pastal = e.target.value;
                                    const netAdet = parseInt(form.kesilen_net_adet) || 0;
                                    const pastalInt = parseInt(pastal) || 0;
                                    const fire = pastalInt > 0 && netAdet > 0 ? (((pastalInt - netAdet) / pastalInt) * 100).toFixed(1) : form.fire_orani;
                                    setForm({ ...form, pastal_kat_sayisi: pastal, fire_orani: fire });
                                }} style={inp} />
                        </div>

                        <div>
                            <label style={lbl}>{isAR ? 'الكمية الصافية المقطوعة' : 'Net Çıkan Adet'}</label>
                            <input type="number" dir="ltr" value={form.kesilen_net_adet} placeholder="Örn: 195"
                                onChange={e => {
                                    const net = e.target.value;
                                    const pastal = parseInt(form.pastal_kat_sayisi) || 0;
                                    const netInt = parseInt(net) || 0;
                                    const fire = pastal > 0 && netInt > 0 ? (((pastal - netInt) / pastal) * 100).toFixed(1) : form.fire_orani;
                                    setForm({ ...form, kesilen_net_adet: net, fire_orani: fire });
                                }} style={inp} />
                        </div>

                        <div>
                            <label style={lbl}>Harcama (Metre) *</label>
                            <input type="number" dir="ltr" value={form.kullanilan_kumas_mt || ''} placeholder="Kullanılan Total Kumaş / Örn: 150"
                                onChange={e => {
                                    const mt = parseFloat(e.target.value) || 0;
                                    const adet = parseInt(form.kesilen_net_adet) || 1;
                                    const ortalamaHarcama = mt > 0 && adet > 0 ? (mt / adet).toFixed(2) : '0';
                                    setForm({ ...form, kullanilan_kumas_mt: e.target.value, fire_orani: ortalamaHarcama });
                                }} style={inp} />
                        </div>

                        <div>
                            <label style={lbl}>Birim Harcama (mt/adet) 🔒</label>
                            <input type="text" dir="ltr" value={form.fire_orani} disabled
                                style={{ ...inp, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed', borderColor: '#e2e8f0' }} />
                        </div>

                        <div>
                            <label style={lbl}>{isAR ? 'الحالة' : 'Durum'}</label>
                            <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {DURUMLAR.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                            </select>
                        </div>

                        {/* YENİ ALANLAR */}
                        <div>
                            <label style={lbl}>Kesimci Personel</label>
                            <input type="text" value={form.kesimci_adi} onChange={e => setForm({ ...form, kesimci_adi: e.target.value })}
                                placeholder="Kesimci adı soyadı..." style={inp} maxLength={100} />
                        </div>

                        <div>
                            <label style={lbl}>Kesim Tarihi</label>
                            <input type="date" value={form.kesim_tarihi} onChange={e => setForm({ ...form, kesim_tarihi: e.target.value })} style={inp} />
                        </div>

                        <div>
                            <label style={lbl}>Kumaş Topu / Renk Kodu</label>
                            <input type="text" value={form.kumas_topu_no} onChange={e => setForm({ ...form, kumas_topu_no: e.target.value })}
                                placeholder="TOP-0042 / Lacivert" style={inp} maxLength={100} />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={lbl}>Beden Dağılımı (Adet)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '0.4rem', marginBottom: 8 }}>
                                {BEDENLER.map(b => {
                                    let bData = {};
                                    try { bData = JSON.parse(form.beden_dagilimi || '{}'); } catch (e) { console.warn("JSON Parse Hatası (Beden):", e); }
                                    return (
                                        <div key={b} style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#f8fafc', padding: '6px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.75rem', color: '#047857', textAlign: 'center' }}>{b}</span>
                                            <input type="number" placeholder="0" min="0" value={bData[b] || ''}
                                                onChange={e => {
                                                    try { bData = JSON.parse(form.beden_dagilimi || '{}'); } catch (e) { console.warn("JSON Parse Hatası (Beden Input):", e); }
                                                    if (e.target.value) bData[b] = parseInt(e.target.value);
                                                    else delete bData[b];
                                                    setForm({ ...form, beden_dagilimi: JSON.stringify(bData) });
                                                }}
                                                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px', textAlign: 'center', fontSize: '0.8rem', outline: 'none' }} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={lbl}>Notlar / Özel Talimat</label>
                            <textarea rows={2} maxLength={400} value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })}
                                placeholder="Kesimci notu, özel talimat, sorun kaydı..." style={{ ...inp, resize: 'vertical' }} />
                        </div>

                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH_KESIM); setFormAcik(false); setDuzenleId(null); }} style={{ padding: '10px 20px', border: '2px solid #e2e8f0', borderRadius: 10, background: 'white', fontWeight: 800, cursor: 'pointer', color: '#475569' }}>{isAR ? 'إلغاء' : 'İptal'}</button>
                        <button onClick={kaydetKesim} disabled={loading}
                            style={{ padding: '10px 28px', background: loading ? '#cbd5e1' : '#047857', color: 'white', border: 'none', borderRadius: 10, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.3)' }}>
                            {loading ? '...' : (duzenleId ? 'Güncelle' : (isAR ? 'بدء القص' : 'Kesimi Başlat'))}
                        </button>
                    </div>
                </div>
            )}

            {/* KESİM LİSTESİ */}
            {loading && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem', fontWeight: 800 }}>Yükleniyor...</p>}
            {!loading && filtrelenmis.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                    <Scissors size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                    <p style={{ color: '#94a3b8', fontWeight: 700 }}>Kayıt bulunamadı. "Yeni Kesim" ile başlayın.</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {filtrelenmis.map(k => {
                    const tmm = k.durum === 'tamamlandi';
                    return (
                        <div key={k.id} style={{ background: 'white', border: '2px solid', borderColor: tmm ? '#bbf7d0' : k.durum === 'iptal' ? '#fecaca' : '#f1f5f9', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s' }}>
                            <div style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#ecfdf5', color: '#047857', padding: '3px 10px', borderRadius: 6 }}>{k.b1_model_taslaklari?.model_kodu || 'Model Bilinmiyor'}</span>
                                        <h3 style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', margin: '6px 0 3px' }}>{k.b1_model_taslaklari?.model_adi || '---'}</h3>
                                        {/* Kesimci + Tarih + Kumaş */}
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 3 }}>
                                            {k.kesimci_adi && <span style={{ fontSize: '0.62rem', background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>✂️ {k.kesimci_adi}</span>}
                                            {k.kesim_tarihi && <span style={{ fontSize: '0.62rem', background: '#fffbeb', color: '#92400e', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>📅 {new Date(k.kesim_tarihi).toLocaleDateString('tr-TR')}</span>}
                                            {k.kumas_topu_no && <span style={{ fontSize: '0.62rem', background: '#f0fdf4', color: '#065f46', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>🧵 {k.kumas_topu_no}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => { setSeciliKesim(k); setBarkodAcik(true); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'flex' }}><QrCode size={16} /></button>
                                        <button onClick={() => duzenleKesim(k)} style={{ background: '#ecfdf5', border: 'none', color: '#047857', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>✏️</button>
                                        <button onClick={() => sil(k.id, k.b1_model_taslaklari?.model_kodu)} disabled={islemdeId === 'sil_' + k.id} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '6px 8px', borderRadius: 8, cursor: islemdeId === 'sil_' + k.id ? 'not-allowed' : 'pointer', opacity: islemdeId === 'sil_' + k.id ? 0.5 : 1 }}><Trash2 size={15} /></button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>PASTAL KATI</div>
                                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>{k.pastal_kat_sayisi || 0}</div>
                                    </div>
                                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>NET ADET</div>
                                        <div style={{ fontWeight: 900, color: '#059669', fontSize: '1rem' }}>{k.kesilen_net_adet || '?'}</div>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: k.fire_orani > 3 ? '#ef4444' : '#64748b', marginBottom: '0.5rem' }}>
                                    Fire: %{k.fire_orani} {k.fire_orani > 3 && '⚠️ YÜKSEK FİRE ALERT'}
                                </div>

                                {k.beden_dagilimi && (
                                    <div style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 600, background: '#f8fafc', borderRadius: 6, padding: '4px 8px', marginBottom: '0.375rem' }}>
                                        📐 {k.beden_dagilimi}
                                    </div>
                                )}
                                {k.notlar && (
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.5rem', borderLeft: '3px solid #e5e7eb', paddingLeft: 8 }}>
                                        {k.notlar}
                                    </div>
                                )}

                                {/* İŞ AKIŞI: DURUM GEÇİŞLERİ */}
                                {k.durum === 'kesimde' && (
                                    <button onClick={() => durumGuncelle(k.id, 'tamamlandi', k.b1_model_taslaklari?.model_kodu)} disabled={islemdeId === 'durum_' + k.id}
                                        style={{ width: '100%', padding: '10px', background: islemdeId === 'durum_' + k.id ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: 10, fontWeight: 900, cursor: islemdeId === 'durum_' + k.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <CheckCircle2 size={16} /> Kesimi Tamamla (M4 İlet)
                                    </button>
                                )}
                                {k.durum === 'tamamlandi' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <div style={{ width: '100%', padding: '8px 10px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 8, fontWeight: 800, textAlign: 'center', fontSize: '0.82rem' }}>
                                            ✅ Kesim Tamamlandı
                                        </div>
                                        <button onClick={() => isEmriOlustur(k)} disabled={islemdeId === 'emr_' + k.id}
                                            style={{ width: '100%', padding: '9px', background: islemdeId === 'emr_' + k.id ? '#9ca3af' : 'linear-gradient(135deg,#d97706,#92400e)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 900, cursor: islemdeId === 'emr_' + k.id ? 'not-allowed' : 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(217,119,6,0.35)' }}>
                                            🔗 M4 Üretim İş Emri Oluştur
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BARKOD MODALI */}
            <SilBastanModal acik={barkodAcik} onClose={() => setBarkodAcik(false)} title="🖨️ Kesim (M3) Barkodu Çıkart">
                {seciliKesim && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'white', padding: '2rem', borderRadius: '12px' }}>
                        <FizikselQRBarkod
                            veriKodu={`KSM-${seciliKesim.id}`}
                            baslik={`Kesim: ${seciliKesim.b1_model_taslaklari?.model_kodu}`}
                            aciklama={`${seciliKesim.kesilen_net_adet} Adet • Pastal: ${seciliKesim.pastal_kat_sayisi}${seciliKesim.kesimci_adi ? ' • ' + seciliKesim.kesimci_adi : ''}`}
                        />
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
                            Bu barkod, kesim paketlerinin (meto) üzerine yapıştırılıp Üretim Bandına (M4) yollanır.<br />
                            Bant şefi kameraya okuttuğunda otomatik olarak üretime başlar.
                        </p>
                    </div>
                )}
            </SilBastanModal>

        </div>
    );
}
