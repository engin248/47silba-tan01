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
    fire_orani: '5', durum: 'kesimde',
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
    const [kumaslar, setKumaslar] = useState(/** @type {any[]} */([]));

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
            const p2 = supabase.from('b1_model_taslaklari').select('id, model_kodu, model_adi').eq('durum', 'uretime_hazir').limit(500);
            const p3 = supabase.from('b1_kumas_arsivi').select('id, kumas_kodu, renk_tanimi').limit(200);
            const res = await Promise.race([Promise.allSettled([p1, p2, p3]), timeoutPromise()]);
            const [kesimRes, modelRes, kumasRes] = res;
            if (kesimRes.status === 'fulfilled' && kesimRes.value.data) setKesimler(kesimRes.value.data);
            if (modelRes.status === 'fulfilled' && modelRes.value.data) setModeller(modelRes.value.data);
            if (kumasRes && kumasRes.status === 'fulfilled' && kumasRes.value.data) setKumaslar(kumasRes.value.data);
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

    // ─── M5 → M6 VERİ KÖPRÜSÜ ───────────────────────────────────────────────────
    const isEmriOlustur = async (k) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        if (k.durum !== 'tamamlandi') return goster('Sadece tamamlanan kesimler Üretim Bandına (M6) aktarılabilir!', 'error');
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

            // OTOMATİK İŞ EMRİ OLUŞTURMA: V1 Tablosu V2'ye Yönlendirildi
            const { data: yeniEmir, error } = await supabase.from('production_orders').insert([{
                order_code: 'KSM-ORD-' + Date.now(),
                model_id: k.model_taslak_id,
                quantity: k.kesilen_net_adet || 0,
                status: 'pending'
            }]).select().single();
            if (error) throw error;

            // FİRE MALİYETİ AKTARIMI: Kesim Firesi Otomatik Maliyete Yansıtılıyor (Maliyet Sapması Algoritması)
            const fireYuzde = parseFloat(k.fire_orani) || 0;
            if (fireYuzde > 0) {
                const toplamKumasMt = parseFloat(k.kullanilan_kumas_mt) || 0;
                let kayipKumasMt = 0;
                // Kumaş harcaması girildiyse yüzdesini al, girilmediyse pastal başı 1.2mt ortalamasından yola çık
                if (toplamKumasMt > 0) kayipKumasMt = (toplamKumasMt * fireYuzde) / 100;
                else kayipKumasMt = (k.kesilen_net_adet * 1.2 * fireYuzde) / 100;

                let kumasMtFiyat = 250; // Varsayılan yedek fiyat tahmini
                try {
                    if (k.kumas_topu_no) {
                        const { data: kmData } = await supabase.from('b1_kumas_arsivi')
                            .select('birim_maliyet_tl')
                            .eq('kumas_kodu', k.kumas_topu_no.trim())
                            .single();
                        if (kmData && parseFloat(kmData.birim_maliyet_tl) > 0) kumasMtFiyat = parseFloat(kmData.birim_maliyet_tl);
                    }
                } catch (e) { console.warn("Dinamik kumaş fiyatı çekilemedi, varsayılana dönüldü."); }

                const gercekZararTl = kayipKumasMt * kumasMtFiyat;

                await supabase.from('b1_maliyet_kayitlari').insert([{
                    order_id: yeniEmir.id,
                    maliyet_tipi: 'fire_kaybi',
                    kalem_aciklama: `KSM-${k.id} Kesim Firesi (%${fireYuzde.toFixed(1)}) — ${kayipKumasMt.toFixed(1)} MT Kumaş Kaybı`,
                    tutar_tl: gercekZararTl > 0 ? gercekZararTl : fireYuzde,
                    onay_durumu: 'hesaplandi'
                }]);

                // 🔴 AKILLI ALARM: Fire %5'i geçerse Sistem Uyarılarına "Kök Neden" tebligatı fırlat
                if (fireYuzde > 5) {
                    await supabase.from('b1_sistem_uyarilari').insert([{
                        baslik: `🚨 Kritik Kesim Firesi (%${fireYuzde.toFixed(1)}) - Model: ${k.b1_model_taslaklari?.model_kodu || 'Bilinmiyor'}`,
                        mesaj: `${k.kesilen_net_adet} adetlik kesimde ${kayipKumasMt.toFixed(1)} metre kumaş israf oldu. Beklenmeyen Zarar Tutarı: ₺${gercekZararTl.toFixed(0)}.\n\nKÖK NEDEN TAHMİNLERİ:\n1. Pastal yerleşim optimizasyonu verimsiz yapıldı.\n2. Kumaş eni modele uygun gelmediği için boşluklar metrajı artırdı.\n3. Defolu kumaş kısımları freze edildiği için eksilmeler yükseldi.`,
                        onem_derecesi: 'yuksek',
                        durum: 'aktif'
                    }]);
                }
            }

            goster(`✅ M6 Üretim İş Emri oluşturuldu! ${k.b1_model_taslaklari?.model_kodu} — ${k.kesilen_net_adet} adet`);
            telegramBildirim(`🔗 M5→M6 KÖPRÜ\nKesimden Üretime: ${k.b1_model_taslaklari?.model_kodu}\nAdet: ${k.kesilen_net_adet}\nİş emri "Bekliyor" olarak açıldı.`);
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
                telegramBildirim(`✂️ KESİM TAMAMLANDI\nModel: ${model_kodu} için kesim işlemi tamamlandı. Üretim Bandına (M6) sevke hazır.`);

                // OTOMATİK STOK DÜŞÜMÜ: Kumaş M2 Stoktan Otomatik Düşülecek! (M5->M2 Entegrasyonu)
                try {
                    const { data: kData } = await supabase.from('b1_kesim_operasyonlari').select('kumas_topu_no, kullanilan_kumas_mt').eq('id', id).single();
                    if (kData && kData.kumas_topu_no && parseFloat(kData.kullanilan_kumas_mt) > 0) {
                        const kumasKodu = kData.kumas_topu_no.trim();
                        const dusulecek = parseFloat(kData.kullanilan_kumas_mt);

                        const { data: kumas } = await supabase.from('b1_kumas_arsivi').select('id, stok_mt').eq('kumas_kodu', kumasKodu).single();
                        if (kumas) {
                            const yeniStok = Math.max(0, parseFloat(kumas.stok_mt || 0) - dusulecek);
                            await supabase.from('b1_kumas_arsivi').update({ stok_mt: yeniStok }).eq('id', kumas.id);
                            telegramBildirim(`📉 M5 KESİM STOK DÜŞÜMÜ\nKumaş Kodu: ${kumasKodu}\nDüşülen: ${dusulecek} mt\nKalan Stok: ${yeniStok} mt`);
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
                    tablo_adi: 'b1_kesim_operasyonlari', islem_tipi: 'ARŞİVLEME', kullanici_adi: 'Saha Yetkilisi M5',
                    eski_veri: { durum: 'Soft Delete / Arşive alındı.', model_kodu: m_kodu, id: id }
                }]);
            } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: KesimMainContainer.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }
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
    const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

    if (!mounted) return null;

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
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }} dir={isAR ? 'rtl' : 'ltr'}>

                {/* BAŞLIK VE KÖPRÜ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #21262d', paddingBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                            <Scissors size={24} color="white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight m-0 uppercase flex items-center gap-3">
                                {isAR ? 'غرفة القص والعمليات الوسيطة' : 'M5 Kesimhane'}
                            </h1>
                            <p className="text-xs font-bold text-emerald-300 mt-1 uppercase tracking-wider">
                                {isAR ? 'وحدة العمليات M5' : 'Hassas kesim, pastal işlemleri ve üretim bandı hazırlığı (M5)'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setFormAcik(!formAcik)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2">
                            <Plus size={18} /> {isAR ? 'قص جديد' : 'Yeni Kesim'}
                        </button>
                        <Link href="/uretim" style={{ textDecoration: 'none' }}>
                            <button className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2">
                                ⚙️ Üretim Bandı (M6)
                            </button>
                        </Link>
                    </div>
                </div>

                {/* İSTATİSTİK KARTLARI */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Toplam Kayıt', val: istatistik.toplam, color: 'text-emerald-400' },
                        { label: '✂️ Kesimde', val: istatistik.kesimde, color: 'text-amber-400' },
                        { label: '✅ Tamamlandı', val: istatistik.tamamlandi, color: 'text-blue-400' },
                        { label: 'Toplam Adet', val: istatistik.toplamAdet, color: 'text-gray-300' },
                    ].map((s, i) => (
                        <div key={i} className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${s.color} mb-2`}>{s.label}</div>
                            <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                        </div>
                    ))}
                </div>

                {/* BİLDİRİM */}
                {mesaj.text && (
                    <div className={`flex items-center gap-2 p-3 mb-6 rounded-lg font-bold text-sm border-2 ${mesaj.type === 'error' ? 'border-rose-500/50 bg-rose-500/10 text-rose-400' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'}`}>
                        {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />} {mesaj.text}
                    </div>
                )}

                {/* ARAMA + DURUM FİLTRE */}
                <div className="flex gap-3 mb-6 flex-wrap items-center bg-[#161b22] border border-[#21262d] p-3 rounded-xl">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
                        <input type="text" value={arama} onChange={e => setArama(e.target.value)}
                            placeholder="Model, kesimci adına göre ara..."
                            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:border-emerald-500 outline-none transition-colors" />
                    </div>
                    {[['hepsi', 'Tümü'], ['kesimde', '✂️ Kesimde'], ['tamamlandi', '✅ Tamamlandı'], ['iptal', '❌ İptal']].map(([v, l]) => (
                        <button key={v} onClick={() => setFiltreDurum(v)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filtreDurum === v ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50' : 'bg-[#0d1117] text-[#8b949e] border border-[#30363d] hover:text-white'}`}>
                            {l}
                        </button>
                    ))}
                    <span className="text-xs text-[#8b949e] font-bold ml-auto">{filtrelenmis.length} kayıt</span>
                </div>

                {/* FORM */}
                {formAcik && (
                    <div className="bg-[#161b22] border border-emerald-500/30 rounded-xl p-6 mb-8 shadow-lg shadow-emerald-500/5">
                        <h3 className="font-black text-emerald-400 mb-5 text-lg flex items-center gap-2 uppercase tracking-wide">
                            <Scissors size={20} /> {duzenleId ? 'Kesim Düzenle' : (isAR ? 'تسجيل عملية قص جديدة' : 'Yeni Kesim Kaydı')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                            {/* ZORUNLU ALANLAR */}
                            <div className="xl:col-span-3">
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">{isAR ? 'النموذج المراد قصه *' : 'Kesilecek Model *'}</label>
                                <select value={form.model_taslak_id} onChange={e => setForm({ ...form, model_taslak_id: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none">
                                    <option value="">— {isAR ? 'اختر النموذج' : 'Model Seçiniz'} —</option>
                                    {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} | {m.model_adi}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">{isAR ? 'عدد طبقات الباستال *' : 'Pastal Kat Sayısı *'}</label>
                                <input type="number" dir="ltr" value={form.pastal_kat_sayisi} placeholder="Örn: 200"
                                    onChange={e => setForm({ ...form, pastal_kat_sayisi: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">{isAR ? 'الكمية الصافية المقطوعة' : 'Net Çıkan Adet'}</label>
                                <input type="number" dir="ltr" value={form.kesilen_net_adet} placeholder="Örn: 195"
                                    onChange={e => setForm({ ...form, kesilen_net_adet: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">Toplam Harcanan Kumaş (MT)</label>
                                <input type="number" dir="ltr" value={form.kullanilan_kumas_mt || ''} placeholder="Örn: 150 mt"
                                    onChange={e => setForm({ ...form, kullanilan_kumas_mt: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">Fire Oranı (%) ⚙️</label>
                                <input type="number" dir="ltr" value={form.fire_orani} disabled={false}
                                    onChange={e => setForm({ ...form, fire_orani: e.target.value })}
                                    className={`w-full bg-[#0d1117] border rounded-lg px-3 py-2 text-xs text-white outline-none ${parseFloat(form.fire_orani) > 5 ? 'border-rose-500 focus:border-rose-400' : 'border-[#30363d] focus:border-emerald-500'}`} />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">{isAR ? 'الحالة' : 'Durum'}</label>
                                <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none">
                                    {DURUMLAR.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">Kesimci Personel</label>
                                <input type="text" value={form.kesimci_adi} onChange={e => setForm({ ...form, kesimci_adi: e.target.value })}
                                    placeholder="Kesimci adı soyadı..." className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none" maxLength={100} />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">Kesim Tarihi</label>
                                <input type="date" value={form.kesim_tarihi} onChange={e => setForm({ ...form, kesim_tarihi: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#8b949e] focus:border-emerald-500 outline-none style-date-picker" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">Kumaş Topu / Renk Kodu</label>
                                <select value={form.kumas_topu_no} onChange={e => setForm({ ...form, kumas_topu_no: e.target.value })}
                                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none">
                                    <option value="">— Opsiyonel: Stoktan Kumaş Seçin —</option>
                                    {kumaslar.map(k => (
                                        <option key={k.id} value={k.kumas_kodu}>{k.kumas_kodu} {k.renk_tanimi ? `- ${k.renk_tanimi}` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="xl:col-span-3">
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-2">Beden Dağılımı (Adet)</label>
                                <div className="grid grid-cols-7 gap-2">
                                    {BEDENLER.map(b => {
                                        let bData = {};
                                        try { bData = JSON.parse(form.beden_dagilimi || '{}'); } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: KesimMainContainer.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }
                                        return (
                                            <div key={b} className="flex flex-col gap-1 bg-[#0b121a] p-2 rounded-lg border border-[#21262d]">
                                                <span className="font-bold text-[10px] text-emerald-400 text-center">{b}</span>
                                                <input type="number" placeholder="0" min="0" value={bData[b] || ''}
                                                    onChange={e => {
                                                        try { bData = JSON.parse(form.beden_dagilimi || '{}'); } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: KesimMainContainer.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }
                                                        if (e.target.value) bData[b] = parseInt(e.target.value);
                                                        else delete bData[b];
                                                        setForm({ ...form, beden_dagilimi: JSON.stringify(bData) });
                                                    }}
                                                    className="w-full bg-transparent border-b border-[#30363d] text-center text-xs text-white focus:border-emerald-500 outline-none py-1" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="xl:col-span-3">
                                <label className="block text-[10px] font-black text-[#8b949e] tracking-widest uppercase mb-1">Notlar / Özel Talimat</label>
                                <textarea rows={2} maxLength={400} value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })}
                                    placeholder="Kesimci notu, özel talimat, sorun kaydı..." className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none resize-y" />
                            </div>

                        </div>
                        <div className="flex gap-4 mt-6 justify-end border-t border-[#21262d] pt-4">
                            <button onClick={() => { setForm(BOSH_KESIM); setFormAcik(false); setDuzenleId(null); }} className="px-5 py-2 border border-[#30363d] bg-[#0d1117] rounded-lg font-bold text-[#8b949e] hover:text-white transition-colors text-xs">{isAR ? 'إلغاء' : 'İptal'}</button>
                            <button onClick={kaydetKesim} disabled={loading}
                                className={`px-6 py-2 rounded-lg font-bold text-white transition-colors shadow-lg text-xs ${loading ? 'bg-[#30363d] cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}>
                                {loading ? 'İşleniyor...' : (duzenleId ? 'Kesimi Güncelle' : (isAR ? 'بدء القص' : 'Kesimi Başlat ve Kaydet'))}
                            </button>
                        </div>
                    </div>
                )}

                {/* KESİM LİSTESİ */}
                {loading && <p className="text-center py-10 text-[#8b949e] font-bold">Veriler Yükleniyor...</p>}
                {!loading && filtrelenmis.length === 0 && (
                    <div className="text-center py-16 bg-[#161b22] border border-dashed border-[#30363d] rounded-xl flex flex-col items-center">
                        <Scissors size={48} className="text-[#30363d] mb-4" />
                        <p className="text-[#8b949e] font-bold text-sm">Kesim kaydı bulunamadı. "Yeni Kesim" butonu ile başlayın.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtrelenmis.map(k => {
                        const tmm = k.durum === 'tamamlandi';
                        return (
                            <div key={k.id} className={`bg-[#161b22] rounded-xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-lg ${tmm ? 'border-emerald-500/30' : k.durum === 'iptal' ? 'border-rose-500/30' : 'border-[#30363d]'}`}>
                                <div className="p-5 flex flex-col h-full">
                                    <div className="flex justify-between items-start border-b border-[#21262d] pb-3 mb-3">
                                        <div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${tmm ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#21262d] text-white border-[#30363d]'}`}>{k.b1_model_taslaklari?.model_kodu || 'BİLİNMİYOR'}</span>
                                            <h3 className="font-bold text-white text-sm mt-2">{k.b1_model_taslaklari?.model_adi || 'TANIMSIZ MODEL'}</h3>
                                            {/* Tagler */}
                                            <div className="flex gap-2 flex-wrap mt-2">
                                                {k.kesimci_adi && <span className="text-[9px] bg-[#0d1117] text-[#8b949e] border border-[#30363d] px-2 py-0.5 rounded font-bold">✂️ {k.kesimci_adi}</span>}
                                                {k.kesim_tarihi && <span className="text-[9px] bg-[#0d1117] text-[#8b949e] border border-[#30363d] px-2 py-0.5 rounded font-bold">📅 {new Date(k.kesim_tarihi).toLocaleDateString('tr-TR')}</span>}
                                                {k.kumas_topu_no && <span className="text-[9px] bg-[#0d1117] text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-bold">🧵 {k.kumas_topu_no}</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => { setSeciliKesim(k); setBarkodAcik(true); }} className="bg-[#0b121a] hover:bg-[#0d1117] border border-[#30363d] text-white p-1.5 rounded-lg transition-colors"><QrCode size={14} /></button>
                                            <button onClick={() => duzenleKesim(k)} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 p-1.5 rounded-lg transition-colors"><Plus size={14} style={{ transform: 'rotate(45deg)' }} /></button>
                                            <button onClick={() => sil(k.id, k.b1_model_taslaklari?.model_kodu)} disabled={islemdeId === 'sil_' + k.id} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-1.5 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={14} /></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
                                            <div className="text-[9px] text-[#8b949e] font-bold tracking-widest uppercase mb-1">Pastal Katı</div>
                                            <div className="font-bold text-white text-lg font-mono">{k.pastal_kat_sayisi || 0}</div>
                                        </div>
                                        <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
                                            <div className="text-[9px] text-[#8b949e] font-bold tracking-widest uppercase mb-1">Net Çıkan Adet</div>
                                            <div className="font-bold text-emerald-400 text-lg font-mono">{k.kesilen_net_adet || '?'}</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${k.fire_orani > 3 ? 'text-rose-400' : 'text-[#8b949e]'}`}>
                                            FİRE: %{k.fire_orani} {k.fire_orani > 3 && '⚠️ (RİSK BÖLGESİ)'}
                                        </div>
                                        {k.beden_dagilimi && (
                                            <div className="text-[10px] text-white font-mono bg-[#21262d] border border-[#30363d] px-2 py-0.5 rounded">
                                                📐 BEDENLER
                                            </div>
                                        )}
                                    </div>

                                    {k.notlar && (
                                        <div className="text-[10px] text-[#8b949e] italic mb-4 border-l-2 border-[#30363d] pl-2 py-1">
                                            "{k.notlar}"
                                        </div>
                                    )}

                                    {/* İŞ AKIŞI: DURUM GEÇİŞLERİ */}
                                    <div className="mt-auto pt-4 border-t border-[#21262d]">
                                        {k.durum === 'kesimde' && (
                                            <button onClick={() => durumGuncelle(k.id, 'tamamlandi', k.b1_model_taslaklari?.model_kodu)} disabled={islemdeId === 'durum_' + k.id}
                                                className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                                                <CheckCircle2 size={16} /> KESİMİ TAMAMLA VE KAYDET
                                            </button>
                                        )}
                                        {k.durum === 'tamamlandi' && (
                                            <div className="flex flex-col gap-2">
                                                <div className="w-full py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black text-center uppercase tracking-widest">
                                                    ✅ KESİM ONAYLANDI VE KUMAŞ STOKTAN DÜŞÜLDÜ
                                                </div>
                                                <button onClick={() => isEmriOlustur(k)} disabled={islemdeId === 'emr_' + k.id}
                                                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:bg-[#30363d]">
                                                    🔗 M6 ÜRETİM BANTI İŞ EMRİ YARAT
                                                </button>
                                            </div>
                                        )}
                                        {k.durum === 'iptal' && (
                                            <div className="w-full py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-black text-center uppercase tracking-widest">
                                                ❌ ARŞİVLENDİ / İPTAL EDİLDİ
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* BARKOD MODALI */}
                <SilBastanModal acik={barkodAcik} onClose={() => setBarkodAcik(false)} title="🖨️ Kesim Topu Etiketi Çıkart">
                    {seciliKesim && (
                        <div className="flex flex-col items-center gap-6 bg-[#0d1117] p-8 rounded-xl border border-[#21262d]">
                            <FizikselQRBarkod
                                veriKodu={`KSM-${seciliKesim.id}`}
                                baslik={`Kesim: ${seciliKesim.b1_model_taslaklari?.model_kodu}`}
                                aciklama={`${seciliKesim.kesilen_net_adet} Adet • Pastal: ${seciliKesim.pastal_kat_sayisi}${seciliKesim.kesimci_adi ? ' • ' + seciliKesim.kesimci_adi : ''}`}
                            />
                            <p className="m-0 text-xs text-[#8b949e] text-center font-bold">
                                Bu barkod, kesim paketlerinin (meto) üzerine yapıştırılıp Üretim Bandına (M6) yollanır.<br />
                                Bant şefi kameraya okuttuğunda otomatik olarak üretime başlar.
                            </p>
                        </div>
                    )}
                </SilBastanModal>

            </div>
        </div>
    );
}
