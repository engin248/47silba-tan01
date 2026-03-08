'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { Scissors, Lock, Plus, Search, CheckCircle2, AlertTriangle, Trash2, ShieldAlert, Cpu, QrCode, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import SilBastanModal from '@/components/ui/SilBastanModal';
import FizikselQRBarkod from '@/components/barkod/FizikselQRBarkod';

const BOSH_KESIM = { model_taslak_id: '', pastal_kat_sayisi: '', kesilen_net_adet: '', fire_orani: '0', durum: 'kesimde' };
const DURUMLAR = ['kesimde', 'tamamlandi', 'iptal'];

export default function KesimhaneSayfasi() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [lang, setLang] = useState('tr');

    const [kesimler, setKesimler] = useState([]);
    const [modeller, setModeller] = useState([]);

    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOSH_KESIM);
    const [arama, setArama] = useState('');
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    const [barkodAcik, setBarkodAcik] = useState(false);
    const [seciliKesim, setSeciliKesim] = useState(null);

    useEffect(() => {
        setMounted(true);
        const el = document.querySelector('[data-lang]');
        if (el) setLang(el.getAttribute('data-lang') || 'tr');
    }, []);

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        let kanal;
        if (erisebilir) {
            kanal = supabase.channel('islem-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })
                .subscribe();
        }

        yukle();

        return () => { if (kanal) supabase.removeChannel(kanal); };
    }, [kullanici]);

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
            durum: form.durum
        };

        // Offline PWA Güvenlik Zırhı
        if (!navigator.onLine) {
            cevrimeKuyrugaAl('b1_kesim_operasyonlari', payload);
            goster('⚠️ İnternet Yok: Kesimhane kayıtları kuyruğa alındı. Wifi gelince merkeze yollanacak.', 'success');
            setForm(BOSH_KESIM); setFormAcik(false);
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.from('b1_kesim_operasyonlari').insert([payload]);
            if (!error) {
                const seciliModel = modeller.find(m => m.id === form.model_taslak_id);
                goster('✅ Kesim operasyonu kaydedildi!');
                telegramBildirim(`✂️ YENİ KESİM OPERASYONU\nModel: ${seciliModel?.model_kodu}\nPastal Katı: ${form.pastal_kat_sayisi}\nNet Adet: ${form.kesilen_net_adet}\nDurum: ${form.durum.toUpperCase()}`);
                setForm(BOSH_KESIM); setFormAcik(false);
                yukle();
            } else throw error;
        } catch (error) {
            goster('Hata oluştu: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const durumGuncelle = async (id, yeniDurum, model_kodu) => {
        if (!navigator.onLine) return goster('İnternet Yok: Durum güncellemesi sadece online iken yapılabilir!', 'error');
        try {
            await supabase.from('b1_kesim_operasyonlari').update({ durum: yeniDurum }).eq('id', id);
            yukle();
            if (yeniDurum === 'tamamlandi') {
                telegramBildirim(`✂️ KESİM TAMAMLANDI\nModel: ${model_kodu} için kesim işlemi tamamlandı. Üretim Bandına (M6) sevke hazır.`);
            }
        } catch (error) {
            goster('Durum güncellenemedi!', 'error');
        }
    };

    const sil = async (id, m_kodu) => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const adminPin = prompt('Kesim kaydını iptal etmek/silmek için Yönetici PİN girin:');
            if (adminPin === null) return;
            const dogruPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (adminPin !== dogruPin) return goster('Yetkisiz PİN (Siber Güvenlik İhlali)', 'error');
        }

        if (!confirm('Bu kesim kaydını fiziksel olarak tamamen silmek istediğinize emin misiniz?')) return;

        try {
            // Kara Kutu Zırhı
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b1_kesim_operasyonlari', islem_tipi: 'SILME', kullanici_adi: 'Saha Yetkilisi M5',
                    eski_veri: { durum: 'Kesim kalici silinmeden once loglandi', model: m_kodu }
                }]).catch(() => { });
            } catch (e) { }

            await supabase.from('b1_kesim_operasyonlari').delete().eq('id', id);
            yukle(); goster('Silindi');
            telegramBildirim(`🗑️ KESİM SİLİNDİ\n${m_kodu} modeline ait kesim kaydı yönetici onayıyla çöpe atıldı.`);
        } catch (error) {
            goster('Silme hatası: ' + error.message, 'error');
        }
    };

    const isAR = mounted && lang === 'ar';
    const filtrelenmis = kesimler.filter(k => k.b1_model_taslaklari?.model_kodu?.toLowerCase().includes(arama.toLowerCase()) || k.b1_model_taslaklari?.model_adi?.toLowerCase().includes(arama.toLowerCase()));

    const inp = { width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

    if (!mounted) return null;

    // GÜVENLİK KALKANI
    if (!yetkiliMi) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase' }}>{isAR ? 'تم حظر الدخول غير المصرح به' : 'YETKİSİZ GİRİŞ ENGELLENDİ (M5)'}</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 12 }}>Kesimhane verileri gizlidir. Üretim PİN kodu girmeniz gerekmektedir.</p>
            </div>
        );
    }

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>

            {/* BAŞLIK VE KÖPRÜ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#c026d3,#9333ea)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Scissors size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            {isAR ? 'غرفة القص والعمليات الوسيطة' : 'Kesim & Ara İşçilik'}
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                            {isAR ? 'وحدة العمليات M5' : 'Hassas kesim, pastal işlemleri ve üretim bandı hazırlığı (M5)'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setFormAcik(!formAcik)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#c026d3', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(192,38,211,0.3)' }}>
                        <Plus size={18} /> {isAR ? 'قص جديد' : 'Yeni Kesim'}
                    </button>
                    <a href="/uretim" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
                            ⚙️ Üretim Bandı (M6) Geç
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

            {/* ARAMA VE FİLTRE */}
            <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 450 }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" value={arama} onChange={e => setArama(e.target.value)}
                    placeholder={isAR ? 'البحث عن رمز أو اسم النموذج...' : 'Model kodu veya ada göre ara...'}
                    style={{ ...inp, paddingLeft: 42 }} />
            </div>

            {/* HIZLI FORM (M5) */}
            {formAcik && (
                <div style={{ background: 'white', border: '2px solid #e879f9', borderRadius: 18, padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 40px rgba(192,38,211,0.08)' }}>
                    <h3 style={{ fontWeight: 900, color: '#a21caf', marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Scissors size={18} /> {isAR ? 'تسجيل عملية قص جديدة' : 'Yeni Kesim Kaydı'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={lbl}>{isAR ? 'النموذج المراد قصه *' : 'Kesilecek Model *'}</label>
                            <select value={form.model_taslak_id} onChange={e => setForm({ ...form, model_taslak_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— {isAR ? 'اختر النموذج' : 'Model Seçiniz'} —</option>
                                {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} | {m.model_adi}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>{isAR ? 'عدد طبقات الباستال *' : 'Pastal Kat Sayısı *'}</label>
                            <input type="number" dir="ltr" value={form.pastal_kat_sayisi} placeholder="Örn: 200"
                                onChange={e => setForm({ ...form, pastal_kat_sayisi: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>{isAR ? 'الكمية الصافية المقطوعة' : 'Net Çıkan Adet'}</label>
                            <input type="number" dir="ltr" value={form.kesilen_net_adet} placeholder="Örn: 195"
                                onChange={e => setForm({ ...form, kesilen_net_adet: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>{isAR ? 'نسبة الهدر (%)' : 'Fire Oranı (%)'}</label>
                            <input type="number" dir="ltr" value={form.fire_orani} placeholder="Örn: 2.5" step="0.1"
                                onChange={e => setForm({ ...form, fire_orani: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>{isAR ? 'الحالة' : 'Durum'}</label>
                            <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {DURUMLAR.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH_KESIM); setFormAcik(false); }} style={{ padding: '10px 20px', border: '2px solid #e2e8f0', borderRadius: 10, background: 'white', fontWeight: 800, cursor: 'pointer', color: '#475569' }}>{isAR ? 'إلغاء' : 'İptal'}</button>
                        <button onClick={kaydetKesim} disabled={loading}
                            style={{ padding: '10px 28px', background: loading ? '#cbd5e1' : '#c026d3', color: 'white', border: 'none', borderRadius: 10, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}>
                            {loading ? '...' : (isAR ? 'بدء القص' : 'Kesimi Başlat')}
                        </button>
                    </div>
                </div>
            )}

            {/* KESİM LİSTESİ */}
            {loading && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem', fontWeight: 800 }}>Yükleniyor...</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {filtrelenmis.map(k => {
                    const tmm = k.durum === 'tamamlandi';
                    return (
                        <div key={k.id} style={{ background: 'white', border: '2px solid', borderColor: tmm ? '#bbf7d0' : '#f1f5f9', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s' }}>
                            <div style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#fdf4ff', color: '#c026d3', padding: '3px 10px', borderRadius: 6 }}>{k.b1_model_taslaklari?.model_kodu || 'Model Bilinmiyor'}</span>
                                        <h3 style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', margin: '6px 0 0' }}>{k.b1_model_taslaklari?.model_adi || '---'}</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => { setSeciliKesim(k); setBarkodAcik(true); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'flex' }}><QrCode size={16} /></button>
                                        <button onClick={() => sil(k.id, k.b1_model_taslaklari?.model_kodu)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '6px 8px', borderRadius: 8, cursor: 'pointer' }}><Trash2 size={15} /></button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>PASTAL KATI</div>
                                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>{k.pastal_kat_sayisi || 0}</div>
                                    </div>
                                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>NET ADET</div>
                                        <div style={{ fontWeight: 900, color: '#059669', fontSize: '1rem' }}>{k.kesilen_net_adet || '?'}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: k.fire_orani > 3 ? '#ef4444' : '#64748b', marginBottom: '1rem' }}>
                                    Fire: %{k.fire_orani} {k.fire_orani > 3 && '(YÜKSEK FİRE ALERT)'}
                                </div>

                                {/* İŞ AKIŞI: DURUM GEÇİŞLERİ */}
                                {k.durum === 'kesimde' && (
                                    <button onClick={() => durumGuncelle(k.id, 'tamamlandi', k.b1_model_taslaklari?.model_kodu)}
                                        style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <CheckCircle2 size={16} /> Kesimi Tamamla (M6 İlet)
                                    </button>
                                )}
                                {k.durum === 'tamamlandi' && (
                                    <div style={{ width: '100%', padding: '10px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 10, fontWeight: 800, textAlign: 'center', fontSize: '0.85rem' }}>
                                        ✅ Kesim Bitti & M6'da
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BARKOD MODALI */}
            <SilBastanModal acik={barkodAcik} onClose={() => setBarkodAcik(false)} title="🖨️ Kesim (M5) Barkodu Çıkart">
                {seciliKesim && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'white', padding: '2rem', borderRadius: '12px' }}>
                        <FizikselQRBarkod
                            veriKodu={`KSM-${seciliKesim.id}`}
                            baslik={`Kesim: ${seciliKesim.b1_model_taslaklari?.model_kodu}`}
                            aciklama={`${seciliKesim.kesilen_net_adet} Adet • Pastal: ${seciliKesim.pastal_kat_sayisi}`}
                        />
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
                            Bu barkod, kesim paketlerinin (meto) üzerine yapıştırılıp Üretim Bandına (M6) yollanır.<br />
                            Bant şefi kameraya okuttuğunda otomatik olarak üretime başlar.
                        </p>
                    </div>
                )}
            </SilBastanModal>

        </div>
    );
}
