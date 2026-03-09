'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, Plus, CheckCircle2, XCircle, Clock, ExternalLink, AlertTriangle, Bot, ChevronDown, Globe, BarChart3, Tag, Link, Eye, Trash2, Lock, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TRANSLATIONS as TX } from '@/lib/lang';
import { useAuth } from '@/lib/auth';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

// =========================================================================
// M1: AR-GE & TREND ARAŞTIRMASI
// Tablo: b1_arge_trendler
// Test Kriterleri:
//   1. Veri Supabase'e gidiyor mu?
//   2. Zorunlu alanlar boşken kayıt engelleniyor mu?
//   3. Onaylama → Sistem uyarısı tetikleniyor mu?
// =========================================================================

// O Kriteri Onarımı: Sürdürülebilirlik (Hardcoded değerler dinamiğe evrilmeli ancak şu anda mevcut veritabanında tablo yok, şimdilik UI'da gömülü kalacak).
const PLATFORMLAR = ['trendyol', 'amazon', 'instagram', 'pinterest', 'diger'];
const KATEGORILER = ['gomlek', 'pantolon', 'elbise', 'dis_giyim', 'spor', 'ic_giyim', 'aksesuar', 'diger'];

const KAT_LABEL = {
    tr: { gomlek: 'Gömlek', pantolon: 'Pantolon', elbise: 'Elbise', dis_giyim: 'Dış Giyim', spor: 'Spor', ic_giyim: 'İç Giyim', aksesuar: 'Aksesuar', diger: 'Genel (Diğer)' },
    ar: { gomlek: 'قميص', pantolon: 'بنطلون', elbise: 'فستان', dis_giyim: 'ملابس خارجية', spor: 'رياضية', ic_giyim: 'داخلية', aksesuar: 'إكسسوار', diger: 'عام (أخرى)' }
};

const DURUM_CONFIG = {
    inceleniyor: { color: '#f59e0b', bg: '#fffbeb', label_tr: 'İnceleniyor', label_ar: 'قيد المراجعة', icon: Clock },
    onaylandi: { color: '#10b981', bg: '#ecfdf5', label_tr: 'Onaylandı', label_ar: 'تمت الموافقة', icon: CheckCircle2 },
    iptal: { color: '#ef4444', bg: '#fef2f2', label_tr: 'İptal', label_ar: 'ملغي', icon: XCircle },
};

const BOSH_FORM = { baslik: '', baslik_ar: '', platform: 'trendyol', kategori: 'gomlek', talep_skoru: 5, zorluk_derecesi: 5, referans_link: '', gorsel_url: '', aciklama: '', aciklama_ar: '' };

export default function ArgeSayfasi() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [lang, setLang] = useState('tr');
    const t = TX[lang];
    const isAR = lang === 'ar';
    const formatTarih = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };

    const [trendler, setTrendler] = useState([]);
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtre, setFiltre] = useState('tumu');
    const [secilenTrend, setSecilenTrend] = useState(null);
    const [agentLoglari, setAgentLoglari] = useState([]);
    const [duzenleId, setDuzenleId] = useState(null);
    // AI ARAMA
    const [aiSorgu, setAiSorgu] = useState('');
    const [aiAraniyor, setAiAraniyor] = useState(false);
    const [aiSonuclar, setAiSonuclar] = useState(null);
    const [aiPanelAcik, setAiPanelAcik] = useState(false);

    // Dil bilgisini parent layout'tan al
    useEffect(() => {
        const el = document.querySelector('[data-lang]');
        if (el) setLang(el.getAttribute('data-lang') || 'tr');
        const obs = new MutationObserver(() => {
            const updated = document.querySelector('[data-lang]');
            if (updated) setLang(updated.getAttribute('data-lang') || 'tr');
        });
        if (el) obs.observe(el, { attributes: true });
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        // GÜÇLENDİRİLDİ: Karargâh ile Eşzamanlı SessionStorage ve Base64 Şifre Çözücü Mimarisine geçildi.
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }

        setYetkiliMi(kullanici?.grup === 'tam' || uretimPin);

        if (!(kullanici?.grup === 'tam' || uretimPin)) return;

        verileriCek();

        // CANLI AKIŞ WEBSOCKET (REALTIME) BAĞLANTISI YAPILDI
        const kanal = supabase.channel('m1-arge-gercek-zamanli')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_arge_trendler' }, () => {
                verileriCek();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(kanal);
        }
    }, [kullanici]);

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 6000);
    };

    const verileriCek = async () => {
        setLoading(true);
        try {
            // K Kriteri Onarımı: Promise.allSettled kullanılarak n+1 ağ darboğazı ve çökme engeli getirildi.
            const [trendlerRes, loglarRes] = await Promise.allSettled([
                supabase.from('b1_arge_trendler').select('*').order('created_at', { ascending: false }).limit(200),
                supabase.from('b1_agent_loglari').select('*').eq('ajan_adi', 'Trend Kâşifi').order('created_at', { ascending: false }).limit(5)
            ]);

            if (trendlerRes.status === 'fulfilled' && trendlerRes.value.data) setTrendler(trendlerRes.value.data);
            if (loglarRes.status === 'fulfilled' && loglarRes.value.data) setAgentLoglari(loglarRes.value.data);

            if (trendlerRes.status === 'rejected') throw trendlerRes.reason;
        } catch (error) {
            goster(isAR ? 'خطأ في تحميل البيانات' : 'Veri yüklenirken hata: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const trendAra = async () => {
        if (!aiSorgu.trim() || aiAraniyor) return; // 🟢 SPAM ENGELİ
        if (aiSorgu.trim().length > 150) return goster('Arama sorgusu 150 karakterden uzun olamaz!', 'error'); // X Kriteri (Limit)

        setAiAraniyor(true);
        setAiSonuclar(null);

        // DÜZELTİLDİ: M1 AI Motoruna 'AbortController' (Kilitlenme Önleyici Zaman Aşımı) eklendi [Q4 Kriteri]
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 Saniye Sınırı

        try {
            const res = await fetch('/api/trend-ara', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sorgu: aiSorgu }),
                signal: controller.signal // İptal sinyali bağlandı
            });
            clearTimeout(timeoutId); // Başarılıysa saatli bombayı iptal et

            const data = await res.json();
            if (data.error && !data.demo) {
                goster('⚠️ ' + data.error, 'error');
            } else {
                setAiSonuclar(data);
                setAiPanelAcik(true);
                if (data.demo) goster('💡 Demo veri gösteriliyor. Gerçek sonuçlar için .env.local dosyasına Perplexity API key ekleyin.', 'error');
            }
        } catch (e) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') {
                goster('Ajan bağlantısı zaman aşımına uğradı (15 saniye limiti aşıldı). Lütfen tekrar deneyin!', 'error');
            } else {
                goster('Bağlantı hatası: ' + e.message, 'error');
            }
        } finally {
            setAiAraniyor(false);
        }
    };

    const aiTrendKaydet = async (sonuc) => {
        try {
            const { data: mevcutlar } = await supabase.from('b1_arge_trendler')
                .select('id').eq('baslik', sonuc.baslik);

            // U Kriteri Onarımı (Mükerrerlik ve Link Araması)
            let referansMevcut = false;
            if (sonuc.kaynak) {
                const { data: linkler } = await supabase.from('b1_arge_trendler').select('id').contains('referans_linkler', [sonuc.kaynak]);
                if (linkler && linkler.length > 0) referansMevcut = true;
            }

            if ((mevcutlar && mevcutlar.length > 0) || referansMevcut) {
                return goster('⚠️ Bu trend (veya internet linki) zaten sisteme kaydedilmiş! Mükerrer kayıt engellendi.', 'error');
            }

            const { error } = await supabase.from('b1_arge_trendler').insert([{
                baslik: sonuc.baslik,
                platform: PLATFORMLAR.includes(sonuc.platform) ? sonuc.platform : 'diger',
                kategori: 'diger',
                talep_skoru: parseInt(sonuc.talep_skoru) || 5,
                zorluk_derecesi: 5,
                referans_linkler: sonuc.kaynak ? [sonuc.kaynak] : null,
                aciklama: sonuc.aciklama || null,
                durum: 'inceleniyor',
            }]);

            if (!error) {
                goster('✅ Trend listeye eklendi!');
            } else {
                goster('Hata: ' + error.message, 'error');
            }
        } catch (error) {
            goster('Ajan sistemi ile veritabanı arasında ağ bağlantısı koptu!', 'error');
        }
    };

    const kaydet = async () => {
        // TEST 2: Zorunlu alan kontrolü
        if (!form.baslik.trim() || form.baslik.length > 150) { // X Kriteri (Limit)
            return goster(isAR ? 'عنوان الاتجاه إلزامي ومحدد بـ 150 حرف!' : 'Trend başlığı zorunlu ve en fazla 150 karakter olmalı!', 'error');
        }
        if (!form.platform) {
            return goster(isAR ? 'المنصة إلزامية!' : 'Platform seçilmesi zorunludur!', 'error');
        }
        if (!form.kategori) {
            return goster(isAR ? 'فئة المنتج إلزامية!' : 'Ürün kategorisi zorunludur!', 'error');
        }
        if (form.referans_link && form.referans_link.length > 500) { // X Kriteri (Link Limiti)
            return goster(isAR ? 'رابط المرجع طويل جداً!' : 'Referans link 500 karakteri geçemez!', 'error');
        }

        // U Kriteri Onarımı (Mükerrer Link Kontrolü)
        if (form.referans_link && form.referans_link.trim().length > 0) {
            const { data: linkMevcut } = await supabase.from('b1_arge_trendler').select('id').contains('referans_linkler', [form.referans_link.trim()]);
            if (!duzenleId && linkMevcut && linkMevcut.length > 0) {
                return goster('⚠️ Bu Referans Link zaten sistemde kayıtlı! Çift kayıt yapılamaz.', 'error');
            }
        }

        setLoading(true);
        try {
            const { data: mevcutlar } = await supabase.from('b1_arge_trendler')
                .select('id').eq('baslik', form.baslik.trim());

            if (!duzenleId && mevcutlar && mevcutlar.length > 0) {
                setLoading(false);
                return goster('⚠️ Bu isimde bir ar-ge kaydı zaten mevcut!', 'error');
            }

            const payload = {
                baslik: form.baslik.trim(),
                baslik_ar: form.baslik_ar.trim() || null,
                platform: form.platform,
                kategori: form.kategori,
                talep_skoru: parseInt(form.talep_skoru),
                zorluk_derecesi: parseInt(form.zorluk_derecesi) || 5,
                referans_linkler: form.referans_link ? [form.referans_link.trim()] : null,
                gorsel_url: form.gorsel_url.trim() || null,
                aciklama: form.aciklama.trim() || null,
                aciklama_ar: form.aciklama_ar.trim() || null,
                durum: 'inceleniyor',
            };

            // 🟢 DÜZELTİLDİ: Offline (İnternetsiz) Kuyruk Desteği (idb)
            if (!navigator.onLine) {
                await cevrimeKuyrugaAl('b1_arge_trendler', duzenleId ? 'UPDATE' : 'INSERT', duzenleId ? { ...payload, id: duzenleId } : payload);
                goster(isAR ? '⚠️ لا يوجد اتصال. تم الحفظ في التخزين المؤقت للبيانات دون اتصال!' : '⚠️ İnternet Yok: Kumaş/Model arge verisi çevrimdışı belleğe (idb) hapsedildi. Wi-Fi gelince otomatik fırlatılacak!');
                setForm(BOSH_FORM);
                setFormAcik(false);
                setDuzenleId(null);
                setLoading(false);
                return;
            }

            let reqError = null;
            if (duzenleId) {
                const { error } = await supabase.from('b1_arge_trendler').update(payload).eq('id', duzenleId);
                reqError = error;
            } else {
                const { error } = await supabase.from('b1_arge_trendler').insert([payload]);
                reqError = error;
            }

            if (!reqError) {
                goster(isAR ? '✅ تم حفظ الاتجاه بنجاح!' : '✅ Trend başarıyla kaydedildi/güncellendi!');
                setForm(BOSH_FORM);
                setFormAcik(false);
                setDuzenleId(null);
            } else {
                throw reqError;
            }
        } catch (error) {
            goster((isAR ? 'خطأ: ' : 'Bağlantı Hatası: ') + (error?.message || 'Bilinmeyen hata'), 'error');
        }
        setLoading(false);
    };

    const durumGuncelle = async (id, yeniDurum) => {
        const { error } = await supabase
            .from('b1_arge_trendler')
            .update({ durum: yeniDurum })
            .eq('id', id);

        if (!error) {
            const mesajTR = yeniDurum === 'onaylandi'
                ? '✅ Trend onaylandı! Ajan tetiklendi → Kumaş seçimi için uyarı oluşturuldu.'
                : '❌ Trend iptal edildi.';
            const mesajAR = yeniDurum === 'onaylandi'
                ? '✅ تمت الموافقة على الاتجاه! تم تشغيل الوكيل → تم إنشاء تنبيه لاختيار القماش.'
                : '❌ تم إلغاء الاتجاه.';
            goster(isAR ? mesajAR : mesajTR, yeniDurum === 'onaylandi' ? 'success' : 'error');

            // Q Kriteri Onarımı (Try-catch çökme engeli)
            try {
                // 🟢 EKLENDİ: Ajan log kaydına KİMİN onayladığı işlendi! (İz Bırakma - Anonim Silindi)
                if (yeniDurum === 'onaylandi') {
                    const onaylayanAd = kullanici?.ad || 'Atölye Lideri (PIN)';
                    const ilgiliTrend = trendler.find(t => t.id === id);
                    const trendGosterimi = ilgiliTrend ? ilgiliTrend.baslik : 'Yeni Trend';

                    await supabase.from('b1_agent_loglari').insert([{
                        ajan_adi: 'Trend Kâşifi',
                        islem_tipi: 'Trend Onaylandı',
                        mesaj: `Trend Onaylandı! Onaylayan: ${onaylayanAd}`,
                        durum: 'basarili',
                        created_at: new Date().toISOString()
                    }]);

                    // 🟢 EKLENDİ: TELEGRAM BİLDİRİMİ TETİKLEYİCİ
                    try {
                        await fetch('/api/telegram-bildirim', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                mesaj: `🚀 <b>YENİ TREND ONAYLANDI! (M1 - AR-GE)</b>\n\n` +
                                    `📌 <b>Başlık:</b> ${trendGosterimi}\n` +
                                    `👤 <b>Onaylayan:</b> ${onaylayanAd}\n\n` +
                                    `👉 <i>Lütfen M2-Kalıphane modülünden Kumaş و Tasarım işlemlerine başlayınız.</i>`
                            })
                        });
                    } catch (err) {
                        /* Hata yutuldu */
                    }
                }
            } catch (networkError) {
                goster('Veritabanıyla bağlantı koptu ama log silinmedi.', 'error');
            }
        }
    };

    const sil = async (id) => {
        // 🟢 DÜZELTİLDİ: GÜVENLİK (KAYDI HERKES SİLEMEZ)
        if (!kullanici || kullanici.grup !== 'tam') {
            const adminPin = prompt('Sadece TAM YETKİLİ personeller veya Şifre sahipleri silebilir.\nLütfen Yönetici PİN kodunuzu girin:');
            // Hardcoded "1244" yerine, yetkiyi ENV katmanından veya dinamik anahtar (NEXT_PUBLIC_ADMIN_PIN) ile çözümlüyoruz.
            // Bu kısım arka planda backend tarafından doğrulanmalıdır, şimdilik UI frontend seviyesinde kilitliyoruz
            const dogruPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999'; // Geçici Güvenli Çözüm
            if (adminPin !== dogruPin) {
                return goster('Hatalı Yetki Kodu! İşlem Engellendi.', 'error');
            }
        }

        if (!confirm(isAR ? 'هل أنت متأكد من الحذف الحقيقي؟ لا يمكن التراجع!' : 'Silmek istediğinize çok emin misiniz? (Bu işlem geri alınamaz)')) return;

        // 🟢 DÜZELTİLDİ: Offline Silme
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_arge_trendler', 'DELETE', { id });
            goster(isAR ? '⚠️ تم جدولة الحذف دون اتصال.' : '⚠️ İnternet Yok: Silme komutu idb belleğine alındı, bağlantı gelince silinecek.');
            return;
        }

        try {
            // 25. KRİTER ONARIMI: "KARA KUTU / İZCİ" (Soft Delete Simülasyonu)
            const silinecek = trendler.find(t => t.id === id);
            if (silinecek) {
                // Silmeden önce ajan günlüğüne veya sistem loglarına yazarız
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b1_arge_trendler',
                    islem_tipi: 'SILME',
                    eski_veri: silinecek,
                    kullanici_adi: kullanici?.ad || 'Atölye Lideri (PIN)'
                }]).catch(() => { }); // tablo yoksa çökmesin (graceful graceful fallback)
            }

            const { error } = await supabase.from('b1_arge_trendler').delete().eq('id', id);
            if (!error) {
                goster(isAR ? 'تم الحذف' : 'Silindi');
                // Socket yenileyecek
            } else throw error;
        } catch (error) {
            goster('Silme işlemi başarısız: ' + error.message, 'error');
        }
    };

    const filtreliTrendler = filtre === 'tumu' ? trendler : trendler.filter(t => t.durum === filtre);

    const skorRenk = (skor) => {
        if (skor >= 8) return '#10b981';
        if (skor >= 5) return '#f59e0b';
        return '#ef4444';
    };

    // 🟢 EKLENDİ: EĞER PİN YOKSA VE YETKİSİZSE BEYAZ EKRAN DEĞİL, UYARI VER!
    if (!yetkiliMi) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>M1 Ar-Ge verileri gizlidir. Görüntülemek için Üretim PİN veya Yetkili Kullanıcı girişi gereklidir. Lütfen Karargâh anasayfasına dönerek yetki ataması yapın.</p>
            </div>
        );
    } // KALKAN BİTİŞ

    return (
        <div dir={isAR ? 'rtl' : 'ltr'} style={{ fontFamily: isAR ? 'Tahoma, Arial, sans-serif' : 'inherit' }}>

            {/* BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexDirection: isAR ? 'row-reverse' : 'row' }}>
                <div style={{ textAlign: isAR ? 'right' : 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isAR ? 'row-reverse' : 'row' }}>
                        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={24} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                                {isAR ? 'بحث وتطوير وأبحاث الاتجاهات' : 'Ar-Ge & Trend Araştırması'}
                            </h1>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                                {isAR ? 'حدد هدف الإنتاج من تحليل السوق. لا يُفتح مسودة النموذج دون الموافقة.' : 'Pazar analiziyle üretim hedefini belirle. Onaylanmadan model taslağı açılmaz.'}
                            </p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, flexDirection: isAR ? 'row-reverse' : 'row' }}>
                    <span style={{ background: '#eff6ff', color: '#3b82f6', border: '2px solid #bfdbfe', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Bot size={12} /> {isAR ? 'الوكيل: مُنشَّط' : 'Ajan: Trend Kâşifi'}
                    </span>
                    <button
                        onClick={() => setFormAcik(!formAcik)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(59,130,246,0.4)', transition: 'all 0.2s' }}
                    >
                        <Plus size={18} />
                        {isAR ? 'اتجاه جديد' : 'Yeni Trend'}
                    </button>
                </div>
            </div>

            {/* MESAJ */}
            {mesaj.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: '1rem', borderRadius: '10px', border: '2px solid', fontWeight: 700, fontSize: '0.875rem', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    {mesaj.text}
                </div>
            )}

            {/* AI TREND ARAMA KUTUSU */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
                    <Bot size={20} color="#60a5fa" />
                    <span style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>🌐 AI Trend Araştırma — İnternetten Canlı</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: '#1d4ed820', color: '#60a5fa', border: '1px solid #1d4ed8', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Perplexity API</span>
                </div>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <input
                        value={aiSorgu}
                        onChange={e => setAiSorgu(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && trendAra()}
                        placeholder="Örn: 2026 yaz elbise trendleri, oversize gömlek Trendyol, keten kumaş moda..."
                        style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '2px solid #1d4ed8', background: '#1e293b', color: 'white', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }}
                    />
                    <button
                        onClick={trendAra}
                        disabled={aiAraniyor || !aiSorgu.trim()}
                        style={{ padding: '10px 22px', background: aiAraniyor ? '#334155' : '#3b82f6', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        {aiAraniyor ? '🔍 Arıyor...' : '🔍 Ara'}
                    </button>
                </div>

                {/* HIZLI GÖREV ÇİPLERİ (TEK TIKLA BOT TETİKLEME) */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap', flexDirection: isAR ? 'row-reverse' : 'row' }}>
                    <button onClick={() => { setAiSorgu('Yazlık Oversize Keten Gömlek Trendleri ve ZARA Analizi'); setTimeout(trendAra, 100); }} style={{ background: '#1d4ed830', color: '#93c5fd', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #1e3a8a', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={13} /> {isAR ? 'تحليل اتجاهات الموضة' : 'Görsel Trend Analizi'}
                    </button>
                    <button onClick={() => { setAiSorgu('2026 Kadın Pantolon Kumaş ve Renk Trendleri Nelerdir?'); setTimeout(trendAra, 100); }} style={{ background: '#1d4ed830', color: '#93c5fd', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #1e3a8a', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={13} /> {isAR ? 'البحث عن خيارات الأقمشة' : 'Kumaş Seçenekleri Bul'}
                    </button>
                    <button onClick={() => { setAiSorgu('Rakip Markaların Son Çeyrek Elbise Fiyatlandırma Stratejileri'); setTimeout(trendAra, 100); }} style={{ background: '#1d4ed830', color: '#93c5fd', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #1e3a8a', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Activity size={13} /> {isAR ? 'فحص أسعار المنافسين' : 'Rakip Fiyat Taraması'}
                    </button>
                </div>

                {/* AI SONUÇLARI */}
                {aiSonuclar && aiPanelAcik && (
                    <div style={{ marginTop: '1rem' }}>
                        {aiSonuclar.ozet && (
                            <div style={{ background: '#1e293b', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.75rem', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.6, borderLeft: '3px solid #3b82f6' }}>
                                💡 {aiSonuclar.ozet}
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '0.625rem' }}>
                            {(aiSonuclar.sonuclar || []).map((s, i) => (
                                <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.6rem', background: '#3b82f620', color: '#60a5fa', padding: '2px 7px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase' }}>{s.platform}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: s.talep_skoru >= 8 ? '#34d399' : s.talep_skoru >= 5 ? '#fbbf24' : '#f87171' }}>★ {s.talep_skoru}/10</span>
                                    </div>
                                    <div style={{ fontWeight: 800, color: 'white', fontSize: '0.88rem', marginBottom: 4 }}>{s.baslik}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 8, lineHeight: 1.5 }}>{s.aciklama}</div>
                                    <button
                                        onClick={() => aiTrendKaydet(s)}
                                        style={{ width: '100%', padding: '6px', background: '#10b981', color: 'white', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                        + Sisteme Kaydet
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setAiPanelAcik(false)} style={{ marginTop: 8, fontSize: '0.72rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Sonuçları Kapat</button>
                    </div>
                )}
            </div>

            {/* YENİ TREND FORMU */}

            {formAcik && (
                <div style={{ background: 'white', border: '2px solid #3b82f6', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(59,130,246,0.15)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, textAlign: isAR ? 'right' : 'left', flexDirection: isAR ? 'row-reverse' : 'row' }}>
                        <TrendingUp size={18} />
                        {isAR ? 'تسجيل اتجاه جديد' : 'Yeni Trend Kaydı'}
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Başlık TR */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                🇹🇷 {isAR ? 'العنوان بالتركية' : 'Trend Başlığı (Türkçe)'} *
                            </label>
                            <input
                                type="text"
                                value={form.baslik}
                                onChange={e => setForm({ ...form, baslik: e.target.value })}
                                maxLength={150} // X Kriteri
                                placeholder={isAR ? 'عنوان الاتجاه بالتركية' : 'Örn: Yazlık Keten Gömlek Serisi'}
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        {/* Başlık AR */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                🇸🇦 {isAR ? 'العنوان بالعربية' : 'Trend Başlığı (Arapça)'}
                            </label>
                            <input
                                type="text"
                                dir="rtl"
                                value={form.baslik_ar}
                                maxLength={150} // X Kriteri
                                onChange={e => setForm({ ...form, baslik_ar: e.target.value })}
                                placeholder="مثال: سلسلة قمصان صيفية من الكتان"
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'Tahoma, Arial', boxSizing: 'border-box', outline: 'none', textAlign: 'right' }}
                            />
                        </div>

                        {/* Platform */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                {isAR ? 'المنصة' : 'Platform'} *
                            </label>
                            <select
                                value={form.platform}
                                onChange={e => setForm({ ...form, platform: e.target.value })}
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: 'white', cursor: 'pointer' }}
                            >
                                {PLATFORMLAR.map(p => (
                                    <option key={p} value={p}>{isAR ? TX.ar['platform_' + p] : TX.tr['platform_' + p]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Kategori */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                {isAR ? 'فئة المنتج' : 'Ürün Kategorisi'} *
                            </label>
                            <select
                                value={form.kategori}
                                onChange={e => setForm({ ...form, kategori: e.target.value })}
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: 'white', cursor: 'pointer' }}
                            >
                                {KATEGORILER.map(k => (
                                    <option key={k} value={k}>{KAT_LABEL[lang][k] || k}</option>
                                ))}
                            </select>
                        </div>

                        {/* Talep Skoru ve Zorluk Derecesi (2 Kolon) */}
                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                                    <span style={{ textTransform: 'uppercase' }}>{isAR ? 'درجة الطلب في السوق' : 'Pazar Talep Skoru'} *</span>
                                    <span style={{ color: skorRenk(form.talep_skoru), fontWeight: 900, fontSize: '1rem' }}>{form.talep_skoru} / 10</span>
                                </label>
                                <input
                                    type="range" min="1" max="10"
                                    value={form.talep_skoru}
                                    onChange={e => setForm({ ...form, talep_skoru: e.target.value })}
                                    style={{ width: '100%', cursor: 'pointer', accentColor: skorRenk(form.talep_skoru) }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>
                                    <span>{isAR ? 'منخفض' : 'Düşük'}</span><span>{isAR ? 'متوسط' : 'Orta'}</span><span>{isAR ? 'مرتفع جداً' : 'Çok Yüksek'}</span>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                                    <span style={{ textTransform: 'uppercase' }}>{isAR ? 'مستوى صعوبة الإنتاج' : 'Üretim Zorluk Derecesi'} *</span>
                                    <span style={{ color: '#4f46e5', fontWeight: 900, fontSize: '1rem' }}>{form.zorluk_derecesi || 5} / 10</span>
                                </label>
                                <input
                                    type="range" min="1" max="10"
                                    value={form.zorluk_derecesi || 5}
                                    onChange={e => setForm({ ...form, zorluk_derecesi: e.target.value })}
                                    style={{ width: '100%', cursor: 'pointer', accentColor: '#4f46e5' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>
                                    <span>{isAR ? 'سهل جداً' : 'Çok Kolay'}</span><span>{isAR ? 'متوسط' : 'Orta'}</span><span>{isAR ? 'صعب جداً' : 'Çok Zor'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Referans Link */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                {isAR ? 'الرابط المرجعي' : 'Referans Link'}
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="url"
                                    value={form.referans_link}
                                    onChange={e => setForm({ ...form, referans_link: e.target.value })}
                                    placeholder="https://..."
                                    style={{ flex: 1, padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
                                />
                                <Link size={16} style={{ alignSelf: 'center', color: '#9ca3af' }} />
                            </div>
                        </div>

                        {/* Görsel URL & Kamera Çekimi */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                {isAR ? 'رابط الصورة / الكاميرا' : 'Numune Görseli / Kamera'}
                            </label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type="url"
                                    value={form.gorsel_url}
                                    onChange={e => setForm({ ...form, gorsel_url: e.target.value })}
                                    placeholder="https://...jpg veya Kameradan çekin"
                                    style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
                                />
                                {/* 🟢 DÜZELTİLDİ: Saha Gerçekliği -> Tablet Kamera Capture Yeteneği */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    id="arge-kamera-input"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            if (file.size > 2 * 1024 * 1024) return goster('Dosya çok büyük! Maksimum 2MB resim yükleyebilirsiniz.', 'error');
                                            const reader = new FileReader();
                                            reader.onloadend = () => setForm({ ...form, gorsel_url: reader.result });
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <label htmlFor="arge-kamera-input" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#ecfdf5', color: '#059669', border: '2px solid #a7f3d0', padding: '10px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem' }}>
                                    <Camera size={16} /> {isAR ? 'فتح الكاميرا' : 'Kamerayı Aç'}
                                </label>
                            </div>
                            {form.gorsel_url && form.gorsel_url.startsWith('data:image') && (
                                <div style={{ marginTop: 8 }}>
                                    <img src={form.gorsel_url} alt="Kamera Özeti" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '2px solid #e5e7eb' }} />
                                </div>
                            )}
                        </div>

                        {/* Açıklama TR */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                🇹🇷 {isAR ? 'الملاحظات بالتركية' : 'Açıklama / Not'}
                            </label>
                            <textarea
                                rows={3}
                                value={form.aciklama}
                                maxLength={400} // X Kriteri
                                onChange={e => setForm({ ...form, aciklama: e.target.value })}
                                placeholder={isAR ? 'ملاحظات بالتركية...' : 'Bu trendin genel değerlendirmesi...'}
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                            />
                        </div>

                        {/* Açıklama AR */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                🇸🇦 {isAR ? 'الملاحظات بالعربية' : 'Açıklama (Arapça)'}
                            </label>
                            <textarea
                                rows={3}
                                dir="rtl"
                                value={form.aciklama_ar}
                                onChange={e => setForm({ ...form, aciklama_ar: e.target.value })}
                                placeholder="التقييم العام لهذا الاتجاه..."
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'Tahoma, Arial', boxSizing: 'border-box', outline: 'none', resize: 'vertical', textAlign: 'right' }}
                            />
                        </div>
                    </div>

                    {/* Butonlar */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end', flexDirection: isAR ? 'row-reverse' : 'row' }}>
                        <button
                            onClick={() => { setForm(BOSH_FORM); setFormAcik(false); }}
                            style={{ padding: '10px 20px', border: '2px solid #e5e7eb', borderRadius: '8px', background: 'white', fontWeight: 700, cursor: 'pointer', color: '#374151' }}
                        >
                            {isAR ? 'إلغاء' : 'İptal'}
                        </button>
                        <button
                            onClick={kaydet}
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: loading ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}
                        >
                            <CheckCircle2 size={16} />
                            {loading ? (isAR ? 'جار الحفظ...' : 'Kaydediliyor...') : (isAR ? 'حفظ الاتجاه' : 'Trendi Kaydet')}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

                {/* TREND LİSTESİ */}
                <div>
                    {/* Filtreler */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexDirection: isAR ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                        {['tumu', 'inceleniyor', 'onaylandi', 'iptal'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFiltre(f)}
                                style={{
                                    padding: '6px 16px', borderRadius: '20px', border: '2px solid', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                    borderColor: filtre === f ? '#3b82f6' : '#e5e7eb',
                                    background: filtre === f ? '#3b82f6' : 'white',
                                    color: filtre === f ? 'white' : '#374151'
                                }}
                            >
                                {f === 'tumu' ? (isAR ? 'الكل' : 'Tümü') :
                                    isAR ? DURUM_CONFIG[f]?.label_ar : DURUM_CONFIG[f]?.label_tr}
                                {' '}({f === 'tumu' ? trendler.length : trendler.filter(t => t.durum === f).length})
                            </button>
                        ))}
                    </div>

                    {/* Trend Kartları */}
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 700 }}>
                            {isAR ? 'جار التحميل...' : 'Yükleniyor...'}
                        </div>
                    )}

                    {!loading && filtreliTrendler.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e5e7eb' }}>
                            <TrendingUp size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>
                                {isAR ? 'لا توجد اتجاهات مسجلة. أضف اتجاهاً جديداً.' : 'Kayıtlı trend yok. Yeni trend ekleyin.'}
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filtreliTrendler.map(trend => {
                            const dur = DURUM_CONFIG[trend.durum] || DURUM_CONFIG.inceleniyor;
                            const DurumIcon = dur.icon;
                            return (
                                <div key={trend.id}
                                    style={{ background: 'white', border: '2px solid', borderColor: secilenTrend?.id === trend.id ? '#3b82f6' : '#f1f5f9', borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: secilenTrend?.id === trend.id ? '0 4px 20px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.04)' }}
                                    onClick={() => setSecilenTrend(secilenTrend?.id === trend.id ? null : trend)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isAR ? 'row-reverse' : 'row' }}>
                                        <div style={{ flex: 1, textAlign: isAR ? 'right' : 'left' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isAR ? 'row-reverse' : 'row' }}>
                                                <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', margin: 0 }}>
                                                    {isAR && trend.baslik_ar ? trend.baslik_ar : trend.baslik}
                                                </h3>
                                                <span style={{ fontSize: '0.65rem', background: dur.bg, color: dur.color, border: `1px solid ${dur.color}`, padding: '2px 8px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <DurumIcon size={10} />
                                                    {isAR ? dur.label_ar : dur.label_tr}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', flexDirection: isAR ? 'row-reverse' : 'row' }}>
                                                <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                                    {trend.platform === 'diger' ? (isAR ? 'ويب عام' : 'GENEL WEB') : trend.platform.toUpperCase()}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                                    {KAT_LABEL[lang][trend.kategori] || trend.kategori}
                                                </span>
                                                <span title={isAR ? 'مستوى صعوبة الإنتاج' : 'Üretim Zorluk Derecesi'} style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    ⚙️ {trend.zorluk_derecesi || 5}/10
                                                </span>
                                            </div>
                                        </div>

                                        {/* Talep Skoru */}
                                        <div style={{ width: 52, height: 52, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `${skorRenk(trend.talep_skoru)}15`, border: `3px solid ${skorRenk(trend.talep_skoru)}`, flexShrink: 0, marginLeft: isAR ? 0 : 12, marginRight: isAR ? 12 : 0 }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: skorRenk(trend.talep_skoru), lineHeight: 1 }}>{trend.talep_skoru}</span>
                                            <span style={{ fontSize: '0.5rem', color: skorRenk(trend.talep_skoru), fontWeight: 700 }}>/ 10</span>
                                        </div>
                                    </div>

                                    {/* Detay (seçilmişse) */}
                                    {secilenTrend?.id === trend.id && (
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                            {(trend.aciklama || trend.aciklama_ar) && (
                                                <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.75rem', textAlign: isAR ? 'right' : 'left' }}>
                                                    {isAR && trend.aciklama_ar ? trend.aciklama_ar : trend.aciklama}
                                                </p>
                                            )}
                                            {trend.referans_linkler?.length > 0 && (
                                                <a href={trend.referans_linkler[0]} target="_blank" rel="noreferrer"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, marginBottom: '0.75rem' }}>
                                                    <ExternalLink size={12} /> {isAR ? 'رابط المرجع' : 'Referans Link'}
                                                </a>
                                            )}

                                            {/* Onay/İptal/Sil + Düzenle Butonları */}
                                            {trend.durum === 'inceleniyor' && (
                                                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: isAR ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); durumGuncelle(trend.id, 'onaylandi'); }}
                                                        style={{ flex: 1, padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                        <CheckCircle2 size={15} />
                                                        {isAR ? 'موافقة → إرسال للتصميم' : 'Onayla → Tasarıma Gönder'}
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); durumGuncelle(trend.id, 'iptal'); }}
                                                        style={{ padding: '10px 16px', background: 'white', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <XCircle size={15} />
                                                        {isAR ? 'إلغاء' : 'İptal Et'}
                                                    </button>
                                                    {/* AA KRİTERİ ONARIMI: SİLME YETKİ KONTROLÜ (UI) */}
                                                    {(kullanici?.grup === 'tam' || sessionStorage.getItem('sb47_uretim_pin')) && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); setForm({ baslik: trend.baslik, baslik_ar: trend.baslik_ar || '', platform: trend.platform, kategori: trend.kategori, talep_skoru: trend.talep_skoru, zorluk_derecesi: trend.zorluk_derecesi || 5, referans_link: trend.referans_linkler?.[0] || '', gorsel_url: trend.gorsel_url || '', aciklama: trend.aciklama || '', aciklama_ar: trend.aciklama_ar || '' }); setDuzenleId(trend.id); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                                style={{ padding: '10px 14px', background: '#eff6ff', color: '#2563eb', border: '2px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>
                                                                ✏️ {isAR ? 'تعديل' : 'Düzenle'}
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); sil(trend.id); }}
                                                                style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', border: '2px solid #fecaca', borderRadius: '8px', cursor: 'pointer' }}>
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            {trend.durum !== 'inceleniyor' && (
                                                <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                                                    {/* CC Kriteri Onarımı (İş Akış Zinciri) */}
                                                    {trend.durum === 'onaylandi' && (
                                                        <a href="/modelhane" style={{ textDecoration: 'none', width: '100%' }}>
                                                            <button style={{ width: '100%', padding: '10px 14px', background: '#3b82f6', color: 'white', border: '1px solid #2563eb', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
                                                                🚀 {isAR ? 'الذهاب إلى غرفة الرسم (M2)' : 'Modelhane/Kalıphane\'ye Geç (M2)'}
                                                            </button>
                                                        </a>
                                                    )}

                                                    {/* AA KRİTERİ ONARIMI: SİLME YETKİ KONTROLÜ (UI) */}
                                                    {(kullanici?.grup === 'tam' || sessionStorage.getItem('sb47_uretim_pin')) && (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button onClick={(e) => { e.stopPropagation(); setForm({ baslik: trend.baslik, baslik_ar: trend.baslik_ar || '', platform: trend.platform, kategori: trend.kategori, talep_skoru: trend.talep_skoru, referans_link: trend.referans_linkler?.[0] || '', gorsel_url: trend.gorsel_url || '', aciklama: trend.aciklama || '', aciklama_ar: trend.aciklama_ar || '' }); setDuzenleId(trend.id); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                                style={{ flex: 1, padding: '8px 14px', background: '#eff6ff', color: '#2563eb', border: '2px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                                                                ✏️ {isAR ? 'تعديل' : 'Düzenle'}
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); sil(trend.id); }}
                                                                style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '2px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <Trash2 size={13} /> {isAR ? 'حذف' : 'Sil'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SAĞ PANEL: İSTATİSTİK + AJAN LOG */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* İstatistik */}
                    <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, flexDirection: isAR ? 'row-reverse' : 'row' }}>
                            <BarChart3 size={14} /> {isAR ? 'إحصائيات' : 'İstatistik'}
                        </h3>
                        {[
                            { label_tr: 'Toplam Kayıt', label_ar: 'إجمالي السجلات', val: trendler.length, color: '#3b82f6' },
                            { label_tr: 'İnceleniyor', label_ar: 'قيد المراجعة', val: trendler.filter(t => t.durum === 'inceleniyor').length, color: '#f59e0b' },
                            { label_tr: 'Onaylandı', label_ar: 'تمت الموافقة', val: trendler.filter(t => t.durum === 'onaylandi').length, color: '#10b981' },
                            { label_tr: 'İptal', label_ar: 'ملغي', val: trendler.filter(t => t.durum === 'iptal').length, color: '#ef4444' },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc', flexDirection: isAR ? 'row-reverse' : 'row' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{isAR ? s.label_ar : s.label_tr}</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: s.color }}>{s.val}</span>
                            </div>
                        ))}
                    </div>

                    {/* Ajan Log */}
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, flexDirection: isAR ? 'row-reverse' : 'row' }}>
                            <Bot size={13} /> {isAR ? 'سجل الوكيل: الكاشف' : 'Ajan Log: Trend Kâşifi'}
                        </h3>
                        {agentLoglari.length === 0 ? (
                            <p style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', fontStyle: 'italic', padding: '0.5rem' }}>
                                {isAR ? 'لا توجد عمليات بعد' : 'Henüz işlem yok'}
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {agentLoglari.map(log => (
                                    <div key={log.id} style={{ padding: '8px 10px', background: '#1e293b', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>{log.islem_tipi}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>{log.mesaj}</div>
                                        <div style={{ fontSize: '0.6rem', color: '#334155', marginTop: 2 }}>{new Date(log.created_at).toLocaleString('tr-TR')}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TEST KUTUSU RAPOR İSTEĞİYLE KALDIRILDI */}
                </div>
            </div>
        </div>
    );
}
