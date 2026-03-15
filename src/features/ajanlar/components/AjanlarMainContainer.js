'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect, useRef } from 'react';
import { Bot, Plus, Play, Square, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, Settings, Database, Globe, Cpu, FileText, Trash2, RefreshCw, Zap, Send, ToggleLeft, ToggleRight, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

// ─── AJAN GÖREV KONFİGÜRASYONU ──────────────────────────────
// Koordinatör buradan her ajanın her görevini açıp kapatır
// AKTİF = true → Ajan bu görevi yapıyor
// PASİF = false → Modül yok veya gerek yok, kod bekliyor
const VARSAYILAN_KONFIGUR = {
    sabah: {
        isim: 'Sabah Subayı', ikon: '🌅', renk: '#f59e0b',
        gorevler: [
            { id: 'sb_1', ad: 'Sipariş 2 gün teslim alarmı', aktif: false, tablo: 'b2_siparisler', neden_pasif: 'Gerçek sipariş takibi sisteme oturmadı' },
            { id: 'sb_2', ad: 'Sıfır stok alarmı', aktif: false, tablo: 'b2_urun_katalogu', neden_pasif: 'Stok akışı henüz gerçekçi değil' },
            { id: 'sb_3', ad: 'Onay bekleyen trend sayısı (sadece bilgi)', aktif: true, tablo: 'b1_arge_trendler', neden_pasif: '' },
            { id: 'sb_4', ad: 'Üretim kayıt takibi (kim-ne-ne zaman)', aktif: true, tablo: 'b1_uretim_kayitlari', neden_pasif: '' },
            { id: 'sb_5', ad: 'Ödenmemiş fatura', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Kasa modülü yok' },
            { id: 'sb_6', ad: 'Kasa bakiye özeti', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Kasa modülü yok' },
            { id: 'sb_7', ad: 'Aktif personel sayısı', aktif: true, tablo: 'b1_personel', neden_pasif: '' },
            { id: 'sb_8', ad: 'Ortak görev tahtası — bekleyen iş emirleri', aktif: true, tablo: 'b1_ajan_gorevler', neden_pasif: '' },
        ]
    },
    aksam: {
        isim: 'Akşamcı', ikon: '🌆', renk: '#6366f1',
        gorevler: [
            { id: 'ak_1', ad: 'Bugün tamamlanan üretim', aktif: true, tablo: 'b1_uretim_kayitlari', neden_pasif: '' },
            { id: 'ak_2', ad: 'Yarın teslim siparişleri', aktif: true, tablo: 'b2_siparisler', neden_pasif: '' },
            { id: 'ak_3', ad: 'Günlük kasa özeti', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Kasa modülü yok' },
            { id: 'ak_4', ad: 'Yarım kalan üretim işleri', aktif: true, tablo: 'b1_uretim_kayitlari', neden_pasif: '' },
            { id: 'ak_5', ad: 'Kapanış logu yaz', aktif: true, tablo: 'b1_agent_loglari', neden_pasif: '' },
        ]
    },
    nabiz: {
        isim: 'Nabız', ikon: '💓', renk: '#ef4444',
        gorevler: [
            { id: 'nb_1', ad: 'Stok alarm kontrolü', aktif: true, tablo: 'b2_urun_katalogu', neden_pasif: '' },
            { id: 'nb_2', ad: 'Maliyet aşımı takibi', aktif: true, tablo: 'b1_muhasebe_raporlari', neden_pasif: '' },
            { id: 'nb_3', ad: 'Diğer ajanlar durdu mu? (müfettişlik)', aktif: true, tablo: 'b1_agent_loglari', neden_pasif: '' },
            { id: 'nb_4', ad: 'Vadesi geçen ödeme', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Kasa modülü yok' },
            { id: 'nb_5', ad: 'Yaklaşan stok erken uyarı', aktif: true, tablo: 'b2_urun_katalogu', neden_pasif: '' },
        ]
    },
    zincir: {
        isim: 'Zincirci', ikon: '⛓️', renk: '#10b981',
        gorevler: [
            { id: 'zn_1', ad: 'M1→M2: Trend onaylandı → Kumaş', aktif: true, tablo: 'b1_arge_trendler', neden_pasif: '' },
            { id: 'zn_2', ad: 'M2→M3: Kumaş seçildi → Kalıp', aktif: true, tablo: 'b1_kumas_arsiv', neden_pasif: '' },
            { id: 'zn_3', ad: 'M3→M4: Kalıp hazır → Modelhane', aktif: true, tablo: 'b1_model_taslaklari', neden_pasif: '' },
            { id: 'zn_4', ad: 'M4→M5: Numune onaylı → Kesim', aktif: true, tablo: 'b1_modelhane_kayitlari', neden_pasif: '' },
            { id: 'zn_5', ad: 'M5→M6: Kesim bitti → Üretim', aktif: false, tablo: 'b1_kesim_emirleri', neden_pasif: 'Kesim emirleri tablosu yok' },
            { id: 'zn_6', ad: 'M6→M7: Üretim bitti → Maliyet', aktif: false, tablo: 'b1_uretim_kayitlari', neden_pasif: 'Maliyet bağlantısı kurulmadı' },
            { id: 'zn_7', ad: 'M7→M8: Maliyet onaylı → Muhasebe', aktif: false, tablo: 'b1_maliyet_kalemleri', neden_pasif: 'Maliyet kalemleri tablosu yok' },
            { id: 'zn_8', ad: 'Zincir sağlık raporu', aktif: true, tablo: 'b1_agent_loglari', neden_pasif: '' },
        ]
    },
    finans: {
        isim: 'Finans Kalkanı', ikon: '🛡️', renk: '#8b5cf6',
        gorevler: [
            { id: 'fn_1', ad: 'Maliyet aşımı %15+', aktif: true, tablo: 'b1_muhasebe_raporlari', neden_pasif: '' },
            { id: 'fn_2', ad: 'Vadeli alacak takibi', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Modül yok' },
            { id: 'fn_3', ad: 'Kasa kritik seviye', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Kasa modülü yok' },
            { id: 'fn_4', ad: 'Gider artışı %20+', aktif: true, tablo: 'b2_kasa_hareketleri', neden_pasif: '' },
            { id: 'fn_5', ad: 'Kâr marjı %10 altı uyarı', aktif: true, tablo: 'b2_kasa_hareketleri', neden_pasif: '' },
            { id: 'fn_6', ad: 'Gelecek ödeme hatırlatma', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Ödeme takvimi yok' },
        ]
    },
    kasif: {
        isim: 'Trend Kâşifi', ikon: '🔍', renk: '#3b82f6',
        gorevler: [
            { id: 'tk_1', ad: 'Duplicate trend kontrolü', aktif: true, tablo: 'b1_arge_trendler', neden_pasif: '' },
            { id: 'tk_2', ad: 'Perplexity AI ile internet araştırması', aktif: true, tablo: 'internet', neden_pasif: '' },
            { id: 'tk_3', ad: 'Kalite + uzunluk filtresi', aktif: true, tablo: 'dahili', neden_pasif: '' },
            { id: 'tk_4', ad: 'Ar-Ge tablosuna kaydet (durum: inceleniyor)', aktif: true, tablo: 'b1_arge_trendler', neden_pasif: '' },
            { id: 'tk_5', ad: 'Görev tamamlama raporu', aktif: true, tablo: 'b1_agent_loglari', neden_pasif: '' },
        ]
    },
    muhasebe: {
        isim: 'Muhasebe Yazıcı', ikon: '📊', renk: '#0ea5e9',
        gorevler: [
            { id: 'mh_1', ad: 'Aylık gelir/gider hesabı', aktif: true, tablo: 'b2_kasa_hareketleri', neden_pasif: '' },
            { id: 'mh_2', ad: 'Model kârlılık analizi', aktif: true, tablo: 'b1_muhasebe_raporlari', neden_pasif: '' },
            { id: 'mh_3', ad: 'Tamamlanan üretim özeti', aktif: true, tablo: 'b1_uretim_kayitlari', neden_pasif: '' },
            { id: 'mh_4', ad: 'Sipariş teslim oranı', aktif: true, tablo: 'b2_siparisler', neden_pasif: '' },
            { id: 'mh_5', ad: 'Aktif personel özeti', aktif: true, tablo: 'b1_personel', neden_pasif: '' },
            { id: 'mh_6', ad: 'Aylık raporu muhasebe tablosuna yaz', aktif: true, tablo: 'b1_muhasebe_raporlari', neden_pasif: '' },
        ]
    },
};

const AJAN_LISTESI = [
    { ad: 'Trend Kâşifi', ikon: '🔍', renk: '#3b82f6', modul: 'arge', aciklama: 'Trendyol, Amazon araştırır' },
    { ad: 'Üretim Kontrol', ikon: '⚙️', renk: '#f59e0b', modul: 'uretim', aciklama: 'Üretim takibi' },
    { ad: 'Muhasebe', ikon: '📊', renk: '#6366f1', modul: 'muhasebe', aciklama: 'Raporlar üretir' },
    { ad: 'Stok Kontrol', ikon: '📦', renk: '#ef4444', modul: 'stok', aciklama: 'Stok alarmları' },
    { ad: 'Personel', ikon: '👤', renk: '#f97316', modul: 'personel', aciklama: 'Personel analizi' },
    { ad: 'Genel', ikon: '🤖', renk: '#64748b', modul: 'genel', aciklama: 'Genel analiz' },
];

const GOREV_TIPLERI = [
    { deger: 'arastirma', etiket: 'Araştırma', ikon: '🔍' },
    { deger: 'analiz', etiket: 'Analiz', ikon: '📊' },
    { deger: 'kontrol', etiket: 'Kontrol', ikon: '✅' },
    { deger: 'rapor', etiket: 'Rapor', ikon: '📄' },
];

const ONCELIK = [
    { deger: 'acil', etiket: 'Acil', renk: '#ef4444', bg: '#fef2f2' },
    { deger: 'yuksek', etiket: 'Yüksek', renk: '#f59e0b', bg: '#fffbeb' },
    { deger: 'normal', etiket: 'Normal', renk: '#3b82f6', bg: '#eff6ff' },
    { deger: 'dusuk', etiket: 'Düşük', renk: '#94a3b8', bg: '#f8fafc' },
];

const DURUM_CONFIG = {
    bekliyor: { renk: '#94a3b8', bg: '#f8fafc', ikon: Clock, etiket: 'Bekliyor' },
    'calisıyor': { renk: '#f59e0b', bg: '#fffbeb', ikon: Loader2, etiket: 'Çalışıyor' },
    tamamlandi: { renk: '#10b981', bg: '#ecfdf5', ikon: CheckCircle2, etiket: 'Tamamlandı' },
    hata: { renk: '#ef4444', bg: '#fef2f2', ikon: XCircle, etiket: 'Hata' },
    iptal: { renk: '#6b7280', bg: '#f9fafb', ikon: Square, etiket: 'İptal' },
};

const BOS_FORM = {
    gorev_adi: '', gorev_tipi: 'arastirma', oncelik: 'normal',
    gorev_emri: '', hedef_modul: 'arge', hedef_tablo: 'b1_arge_trendler',
    ajan_adi: 'Trend Kâşifi', yetki_internet: true, yetki_supabase_yaz: true,
    yetki_supabase_oku: true, yetki_ai_kullan: true, yetki_dosya_olustur: false,
    koordinator_notu: '',
};

export default function AjanlarMainContainer() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [sekme, setSekme] = useState('gorevler'); // 'gorevler' | 'konfigur'
    const [gorevler, setGorevler] = useState(/** @type {any[]} */([]));
    const [loading, setLoading] = useState(true);
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOS_FORM);
    const [calistiriliyor, setCalistiriliyor] = useState({});
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtre, setFiltre] = useState('hepsi');
    const [secilenGorev, setSecilenGorev] = useState(null);
    const [istatistik, setIstatistik] = useState({ toplam: 0, tamamlandi: 0, calisıyor: 0, hata: 0, bekliyor: 0 });
    const [islemdeId, setIslemdeId] = useState(/** @type {any} */(null)); // [SPAM ZIRHI]
    const [konfig, setKonfig] = useState(() => {
        if (typeof window !== 'undefined') {
            const k = localStorage.getItem('ajan_konfig');
            return k ? JSON.parse(k) : VARSAYILAN_KONFIGUR;
        }
        return VARSAYILAN_KONFIGUR;
    });
    const pollingRef = useRef(null);

    useEffect(() => {
        let ajanPin = false;
        try { ajanPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { ajanPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = /** @type {any} */ (kullanici)?.grup === 'tam' || ajanPin;
        setYetkiliMi(erisebilir);

        let kanal;
        if (erisebilir) {
            // [AI ZIRHI]: Realtime Websocket (Kriter 20 & 34)
            kanal = supabase.channel('islem-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })
                .subscribe();
        }

        yukle();

        return () => { if (kanal) supabase.removeChannel(kanal); };
    }, [kullanici]);

    // [BUGFIX]: Polling devre dışı kalmıştı (dead code). Düzeltildi.
    useEffect(() => {
        pollingRef.current = /** @type {any} */ (setInterval(() => {
            if (gorevler.some(g => g.durum === 'calisıyor')) yukle();
        }, 5000));
        return () => clearInterval(/** @type {any} */(pollingRef.current));
    }, [gorevler]);

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı)

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = async () => {
        try {
            // [AI ZIRHI]: 10sn timeout DDoS kalkanı (Kriter Q)
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Bağlantı zaman aşımı (10sn)')), 10000));
            const { data, error } = await Promise.race([
                supabase.from('b1_ajan_gorevler').select('*').order('created_at', { ascending: false }).limit(50),
                timeout
            ]);
            if (error) throw error;
            if (data) {
                setGorevler(data);
                setIstatistik({
                    toplam: data.length,
                    tamamlandi: data.filter(g => g.durum === 'tamamlandi').length,
                    'calisıyor': data.filter(g => g.durum === 'calisıyor').length,
                    hata: data.filter(g => g.durum === 'hata').length,
                    bekliyor: data.filter(g => g.durum === 'bekliyor').length,
                });
            }
        } catch (error) { goster('Görevler yüklenirken hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const gorevGonder = async () => {
        if (!form.gorev_adi.trim()) return goster('Görev adı zorunludur!', 'error');
        if (!form.gorev_emri.trim()) return goster('Görev emri zorunludur!', 'error');
        if (form.gorev_adi.length > 100) return goster('Görev adı çok uzun!', 'error');
        if (form.gorev_emri.length > 1000) return goster('Görev emri çok uzun (Max 1000)!', 'error');

        if (islemdeId === 'yeniGorev') return;
        setIslemdeId('yeniGorev');

        try {
            // 🛑 U Kriteri: Mükerrer Ajan Görevi Engeli
            const { data: mevcutGorev } = await supabase.from('b1_ajan_gorevler')
                .select('id').ilike('gorev_adi', form.gorev_adi.trim()).eq('durum', 'bekliyor');

            if (mevcutGorev && mevcutGorev.length > 0) {
                return goster('⚠️ Bu görev adıyla bekleyen bir kayıt zaten var!', 'error');
            }

            const { data, error } = await supabase.from('b1_ajan_gorevler').insert([{ ...form, durum: 'bekliyor' }]).select().single();
            if (error) throw error;
            goster('✅ Görev oluşturuldu ve kuyruğa alındı!');
            telegramBildirim(`🤖 YENİ OTONOM GÖREV\nAjan: ${form.ajan_adi}\nGörev: ${form.gorev_adi}`);
            setForm(BOS_FORM); setFormAcik(false); yukle();
            if (form.oncelik === 'acil') setTimeout(() => gorevCalistir(data.id), 500);
        } catch (error) {
            // [AI ZIRHI]: Offline guard (Kriter J)
            if (!navigator.onLine || error.message?.includes('fetch')) {
                const { cevrimeKuyrugaAl } = await import('@/lib/offlineKuyruk');
                await cevrimeKuyrugaAl({ tablo: 'b1_ajan_gorevler', islem_tipi: 'INSERT', veri: { ...form, durum: 'bekliyor' } });
                goster('İnternet Yok: Görev çevrimdışı kuyruğa alındı.', 'success');
                setForm(BOS_FORM); setFormAcik(false);
            } else {
                goster('Kayıt hatası: ' + error.message, 'error');
            }
        }
        setIslemdeId(null);
    };

    const gorevCalistir = async (gorev_id) => {
        const uyariMetni = isAR ? "⚠️ تنبيه: بدء الوكيل المستقل (استخدام واجهة برمجة التطبيقات) سيترتب عليه تكاليف مالية على الشركة.\n\nإذا كانت هذه المهمة غير ضرورية أو هامة، يرجى الإلغاء لتوفير التكاليف.\n\nهل تريد بدأ المهمة والموافقة على التكلفة؟" : "⚠️ DİKKAT: Otonom Ajan başlatılması (API kullanımı) işletmeye FİNANSAL YÜK oluşturacaktır.\n\nEğer bu görev gereksiz veya önemli değilse lütfen İPTAL ederek maliyetten tasarruf sağlayın.\n\nGörevi başlatmak ve maliyeti onaylamak istiyor musunuz?";
        if (!window.confirm(uyariMetni)) return;
        setCalistiriliyor(p => ({ ...p, [gorev_id]: true }));
        try {
            const res = await fetch('/api/ajan-calistir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gorev_id }) });
            const d = await res.json();
            d.basarili ? goster('✅ Görev tamamlandı!') : goster('⚠️ ' + (d.error || 'Hata'), 'error');
        } catch (e) { goster('Bağlantı hatası', 'error'); }
        setCalistiriliyor(p => ({ ...p, [gorev_id]: false }));
        yukle();
    };

    const gorevSil = async (id) => {
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error');
        if (!confirm('Görevi sil?')) return;

        if (islemdeId === 'sil_' + id) return;
        setIslemdeId('sil_' + id);

        try {

            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String('b1_ajan_gorevler').replace(/['"]/g, ''),
                    islem_tipi: 'SILME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
                }]);
            } catch (e) { }

            const { error } = await supabase.from('b1_ajan_gorevler').delete().eq('id', id);
            if (error) throw error;
            setGorevler(p => p.filter(g => /** @type {any} */(g).id !== id));
            if (secilenGorev?.id === id) setSecilenGorev(null);
            goster('Görev silindi!');
        } catch (error) { goster('Silinemedi: ' + error.message, 'error'); }
        setIslemdeId(null);
    };

    const gorevToggle = (ajanKey, gorevId) => {
        const yeni = { ...konfig };
        const idx = yeni[ajanKey].gorevler.findIndex(g => g.id === gorevId);
        yeni[ajanKey].gorevler[idx] = { ...yeni[ajanKey].gorevler[idx], aktif: !yeni[ajanKey].gorevler[idx].aktif };
        setKonfig(yeni);
        localStorage.setItem('ajan_konfig', JSON.stringify(yeni));
        goster(`${yeni[ajanKey].gorevler[idx].aktif ? '✅ Aktif edildi' : '⏸ Pasife alındı'}: ${yeni[ajanKey].gorevler[idx].ad}`);
    };

    const filtreliGorevler = filtre === 'hepsi' ? gorevler : gorevler.filter(g => g.durum === filtre);


    const sure = (bas, bit) => { if (!bas || !bit) return null; const ms = /** @type {any} */ (new Date(bit)) - /** @type {any} */ (new Date(bas)); if (ms < 1000) return `${ms}ms`; if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`; return `${Math.floor(ms / 60000)}dk`; };
    const ajanBilgisi = (ad) => AJAN_LISTESI.find(a => a.ad === ad) || AJAN_LISTESI[5];
    const oncelikBilgisi = (d) => ONCELIK.find(o => o.deger === d) || ONCELIK[2];
    const durumBilgisi = (d) => DURUM_CONFIG[d] || DURUM_CONFIG.bekliyor;

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} className="p-12 text-center bg-red-50 border-2 border-red-200 rounded-2xl m-8">
                <Lock size={48} className="text-red-500 mx-auto mb-4" />
                <h2 className="text-red-700 text-xl font-black uppercase">YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p className="text-red-900 font-semibold mt-2">AI Ajan komuta merkezi verileri gizlidir. Görüntülemek için Yetkili Kullanıcı girişi gereklidir.</p>
            </div>
        );
    }

    return (
        <div className="font-sans">

            {/* ─── BAŞLIK ─── */}
            <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-[0_4px_14px_rgba(99,102,241,0.4)]">
                        <Bot size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 m-0">AI Ajan Komuta Merkezi</h1>
                        <p className="text-xs text-slate-500 mt-1 font-semibold">
                            Görev Tahtası — Ajanlar okur, sonuçları kendi tablolarına yazar
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={yukle} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold cursor-pointer text-slate-700 text-sm hover:bg-slate-50 transition-colors">
                        <RefreshCw size={14} /> Yenile
                    </button>
                    <button onClick={() => setFormAcik(!formAcik)} className="flex items-center gap-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white border-none px-5 py-2.5 rounded-xl font-black cursor-pointer text-sm shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.6)] transition-all transform hover:-translate-y-0.5">
                        <Plus size={18} /> Yeni Görev Emri
                    </button>
                    {/* CC Kriteri Otomatik Rota (Müfettiş'e Geçiş) */}
                    <a href="/denetmen" className="no-underline">
                        <button className="flex items-center gap-2 bg-slate-900 text-white border-none px-5 py-2.5 rounded-xl font-black cursor-pointer text-sm shadow-[0_4px_14px_rgba(15,23,42,0.3)] hover:bg-slate-800 transition-colors">
                            <Bot size={18} /> Denetmen (Müfettiş)
                        </button>
                    </a>
                </div>
            </div>

            {/* ─── MESAJ ─── */}
            {mesaj.text && (
                <div className={`flex items-center gap-2.5 px-4 py-3 mb-4 rounded-xl border-2 font-bold text-sm ${mesaj.type === 'error' ? 'border-red-500 bg-red-50 text-red-700' : 'border-emerald-500 bg-emerald-50 text-emerald-800'}`}>
                    {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    {mesaj.text}
                </div>
            )}

            {/* ─── İSTATİSTİKLER ─── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                {[
                    { label: 'Toplam Görev', val: istatistik.toplam, renk: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                    { label: 'Bekliyor', val: istatistik.bekliyor, renk: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
                    { label: 'Çalışıyor', val: istatistik.calisıyor, renk: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
                    { label: 'Tamamlandı', val: istatistik.tamamlandi, renk: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                    { label: 'Hata', val: istatistik.hata, renk: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
                ].map((k, i) => (
                    <div key={i} className={`${k.bg} border-2 ${k.border} rounded-xl p-3.5 text-center`}>
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase mb-1 tracking-wider">{k.label}</div>
                        <div className={`font-black text-2xl md:text-3xl leading-none ${k.renk}`}>{k.val}</div>
                    </div>
                ))}
            </div>

            {/* ─── SEKMELER ─── */}
            <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1">
                {[
                    { key: 'gorevler', label: '📋 Görev Tahtası', desc: 'İş emirleri' },
                    { key: 'konfigur', label: '⚙️ Ajan Yapılandırma', desc: 'Aktif/Pasif' },
                ].map(s => (
                    <button key={s.key} onClick={() => setSekme(s.key)} className={`
                        flex-1 px-4 py-2.5 rounded-lg border-none cursor-pointer font-bold text-sm transition-all text-center
                        ${sekme === s.key ? 'bg-white text-indigo-600 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                    `}>
                        {s.label}
                        <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">{s.desc}</span>
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════
                SEKME 1: GÖREV TAHTASI
            ══════════════════════════════════════════════════════ */}
            {sekme === 'gorevler' && (
                <>
                    {/* Yeni Görev Formu */}
                    {formAcik && (
                        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', borderRadius: 20, padding: '2rem', marginBottom: '1.5rem', border: '2px solid #6366f1', boxShadow: '0 20px 60px rgba(99,102,241,0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Send size={18} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>🎖️ Yeni Görev Emri</div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Tüm ajanlar bu görev tahtasını okur</div>
                                </div>
                                <button onClick={() => setFormAcik(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>🏷️ Görev Adı *</label>
                                    <input maxLength={100} value={form.gorev_adi} onChange={e => setForm({ ...form, gorev_adi: e.target.value })}
                                        placeholder="Örn: 2026 Yaz Sezonu Trend Araştırması"
                                        style={{ width: '100%', padding: '12px 16px', background: '#1e293b', border: '2px solid #334155', borderRadius: 10, color: 'white', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>⚡ Görev Tipi</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                                        {GOREV_TIPLERI.map(tip => (
                                            <button key={tip.deger} onClick={() => setForm({ ...form, gorev_tipi: tip.deger })}
                                                style={{ padding: '8px 4px', background: form.gorev_tipi === tip.deger ? '#6366f1' : '#1e293b', border: `2px solid ${form.gorev_tipi === tip.deger ? '#6366f1' : '#334155'}`, borderRadius: 8, color: form.gorev_tipi === tip.deger ? 'white' : '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', textAlign: 'center' }}>
                                                {tip.ikon} {tip.etiket}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>🚨 Öncelik</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                                        {ONCELIK.map(o => (
                                            <button key={o.deger} onClick={() => setForm({ ...form, oncelik: o.deger })}
                                                style={{ padding: '8px 4px', background: form.oncelik === o.deger ? o.renk : '#1e293b', border: `2px solid ${form.oncelik === o.deger ? o.renk : '#334155'}`, borderRadius: 8, color: form.oncelik === o.deger ? 'white' : '#94a3b8', cursor: 'pointer', fontWeight: 800, fontSize: '0.7rem' }}>
                                                {o.etiket}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>🤖 Ajan</label>
                                    <select value={form.ajan_adi} onChange={e => setForm({ ...form, ajan_adi: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', background: '#1e293b', border: '2px solid #334155', borderRadius: 10, color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none' }}>
                                        {AJAN_LISTESI.map(a => <option key={a.ad} value={a.ad}>{a.ikon} {a.ad}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>🔐 Yetkiler</label>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {[
                                            { alan: 'yetki_internet', etiket: '🌐 Net' },
                                            { alan: 'yetki_ai_kullan', etiket: '🤖 AI' },
                                            { alan: 'yetki_supabase_oku', etiket: '📥 Oku' },
                                            { alan: 'yetki_supabase_yaz', etiket: '📤 Yaz' },
                                        ].map(y => (
                                            <button key={y.alan} onClick={() => setForm({ ...form, [y.alan]: !form[y.alan] })}
                                                style={{ padding: '6px 10px', background: form[y.alan] ? '#065f46' : '#1e293b', border: `2px solid ${form[y.alan] ? '#10b981' : '#334155'}`, borderRadius: 8, color: form[y.alan] ? '#34d399' : '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>
                                                {y.etiket} {form[y.alan] ? '✓' : '✗'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>📋 Görev Emri *</label>
                                    <textarea maxLength={1000} rows={4} value={form.gorev_emri} onChange={e => setForm({ ...form, gorev_emri: e.target.value })}
                                        placeholder="Ajan ne yapmalı? Detaylı yaz..."
                                        style={{ width: '100%', padding: '12px 16px', background: '#1e293b', border: '2px solid #334155', borderRadius: 10, color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', boxSizing: 'border-box', resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setFormAcik(false)} style={{ padding: '11px 22px', background: 'transparent', border: '2px solid #334155', borderRadius: 10, color: '#64748b', cursor: 'pointer', fontWeight: 700 }}>İptal</button>
                                <button disabled={islemdeId === 'yeniGorev'} onClick={gorevGonder} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 900, cursor: islemdeId === 'yeniGorev' ? 'wait' : 'pointer', fontSize: '0.95rem', opacity: islemdeId === 'yeniGorev' ? 0.5 : 1 }}>
                                    <Send size={16} /> {islemdeId === 'yeniGorev' ? 'Gönderiliyor...' : 'Görevi Gönder'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filtreler */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {['hepsi', 'bekliyor', 'calisıyor', 'tamamlandi', 'hata', 'iptal'].map(f => (
                            <button key={f} onClick={() => setFiltre(f)} style={{
                                padding: '6px 16px', borderRadius: 20, border: '2px solid', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                borderColor: filtre === f ? '#6366f1' : '#e5e7eb',
                                background: filtre === f ? '#6366f1' : 'white',
                                color: filtre === f ? 'white' : '#374151'
                            }}>
                                {f === 'hepsi' ? '🔘 Tümü' :
                                    f === 'bekliyor' ? `⏳ Bekliyor (${gorevler.filter(g => g.durum === 'bekliyor').length})` :
                                        f === 'calisıyor' ? `⚡ Çalışıyor` :
                                            f === 'tamamlandi' ? `✅ Tamamlanan (${gorevler.filter(g => g.durum === 'tamamlandi').length})` :
                                                f === 'hata' ? `❌ Hatalı` : `🚫 İptal`}
                            </button>
                        ))}
                    </div>

                    {/* Görev Tablosu */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <div style={{ minWidth: 680 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px 100px 120px 80px 100px', gap: '0.5rem', padding: '10px 16px', background: '#f8fafc', borderBottom: '2px solid #f1f5f9', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                                    <span>GÖREV</span><span>AJAN</span><span>TİP</span><span>ÖNCELİK</span><span>DURUM</span><span>SÜRE</span><span>İŞLEM</span>
                                </div>

                                {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 700 }}>Yükleniyor...</div>}
                                {!loading && filtreliGorevler.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '4rem', background: '#fafafa' }}>
                                        <Bot size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                                        <p style={{ color: '#94a3b8', fontWeight: 700 }}>Henüz görev yok. Yeni görev emri verin!</p>
                                    </div>
                                )}

                                {filtreliGorevler.map(gorev => {
                                    const dur = durumBilgisi(gorev.durum);
                                    const DurumIcon = dur.ikon;
                                    const ajan = ajanBilgisi(gorev.ajan_adi);
                                    const onc = oncelikBilgisi(gorev.oncelik);
                                    const calisiyor = calistiriliyor[gorev.id];
                                    const secili = secilenGorev?.id === gorev.id;
                                    return (
                                        <div key={gorev.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px 100px 120px 80px 100px', gap: '0.5rem', padding: '12px 16px', alignItems: 'center', background: secili ? '#f5f3ff' : 'white', cursor: 'pointer' }}
                                                onClick={() => setSecilenGorev(secili ? null : gorev)}>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: 2 }}>{gorev.gorev_adi}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{formatTarih(gorev.created_at)} — {gorev.hedef_modul?.toUpperCase() || 'GENEL'}</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <span style={{ fontSize: '1rem' }}>{ajan.ikon}</span>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ajan.renk }}>{gorev.ajan_adi}</span>
                                                </div>
                                                <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: 6 }}>
                                                    {GOREV_TIPLERI.find(t => t.deger === gorev.gorev_tipi)?.ikon} {gorev.gorev_tipi}
                                                </span>
                                                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: onc.bg, color: onc.renk, padding: '3px 10px', borderRadius: 10, border: `1px solid ${onc.renk}` }}>{onc.etiket}</span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 800, background: dur.bg, color: dur.renk, padding: '4px 10px', borderRadius: 10 }}>
                                                    <DurumIcon size={12} style={{ animation: gorev.durum === 'calisıyor' ? 'spin 1s linear infinite' : 'none' }} />
                                                    {dur.etiket}
                                                </span>
                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{sure(gorev.baslangic_tarihi, gorev.bitis_tarihi) || '—'}</div>
                                                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                                    {gorev.durum === 'bekliyor' && (
                                                        <button onClick={() => gorevCalistir(gorev.id)} disabled={calisiyor}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}>
                                                            {calisiyor ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} />} Başlat
                                                        </button>
                                                    )}
                                                    {gorev.durum === 'tamamlandi' && (
                                                        <button onClick={() => gorevCalistir(gorev.id)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#f1f5f9', color: '#6366f1', border: '1px solid #6366f1', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}>
                                                            <RefreshCw size={11} /> Tekrar
                                                        </button>
                                                    )}
                                                    <button disabled={islemdeId === 'sil_' + gorev.id} onClick={() => gorevSil(gorev.id)}
                                                        style={{ padding: '5px 8px', background: '#f8fafc', color: '#94a3b8', border: '1px solid #e5e7eb', borderRadius: 7, cursor: islemdeId === 'sil_' + gorev.id ? 'wait' : 'pointer', opacity: islemdeId === 'sil_' + gorev.id ? 0.3 : 1 }}>
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                            {secili && (
                                                <div style={{ background: '#fafafa', borderTop: '1px solid #f1f5f9', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>📋 Görev Emri</div>
                                                        <div style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.6, background: 'white', border: '1px solid #f1f5f9', borderRadius: 8, padding: '10px 12px' }}>{gorev.gorev_emri}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>✅ Görev Sonucu</div>
                                                        {gorev.sonuc_ozeti ? (
                                                            <div style={{ fontSize: '0.82rem', color: '#065f46', lineHeight: 1.6, background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', maxHeight: 150, overflowY: 'auto' }}>{gorev.sonuc_ozeti}</div>
                                                        ) : (
                                                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', background: 'white', border: '1px dashed #e5e7eb', borderRadius: 8, padding: '16px 12px', textAlign: 'center' }}>
                                                                {gorev.durum === 'bekliyor' ? '▶ Başlat butonuna bas' : '⏳ Bekleniyor...'}
                                                            </div>
                                                        )}
                                                        {gorev.hata_mesaji && <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>❌ {gorev.hata_mesaji}</div>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>{/* minWidth */}
                        </div>{/* overflowX */}
                    </div>
                </>
            )}

            {/* ══════════════════════════════════════════════════════
                SEKME 2: AJAN YAPILANDIRMA — AKTİF/PASİF TOGGLE
            ══════════════════════════════════════════════════════ */}
            {sekme === 'konfigur' && (
                <div>
                    <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: 12, padding: '12px 16px', marginBottom: '1.25rem', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Settings size={18} color="#f97316" />
                        <div>
                            <div style={{ fontWeight: 800, color: '#c2410c', fontSize: '0.85rem' }}>Koordinatör Yapılandırma Paneli</div>
                            <div style={{ fontSize: '0.73rem', color: '#9a3412' }}>Her ajanın hangi görevi yapacağını buradan belirleyin. Pasif görevler çalıştırılmaz — modül hazır olduğunda tek tıkla açılır.</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {Object.entries(konfig).map(([ajanKey, ajan]) => {
                            const aktifSayisi = ajan.gorevler.filter(g => g.aktif).length;
                            return (
                                <div key={ajanKey} style={{ background: 'white', borderRadius: 16, border: '2px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    {/* Ajan başlık */}
                                    <div style={{ padding: '14px 18px', borderBottom: '2px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${ajan.renk}08` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: '1.4rem' }}>{ajan.ikon}</span>
                                            <div>
                                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.92rem' }}>{ajan.isim}</div>
                                                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>{aktifSayisi}/{ajan.gorevler.length} görev aktif</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: aktifSayisi > 0 ? '#10b981' : '#e5e7eb' }} />
                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: aktifSayisi > 0 ? '#10b981' : '#94a3b8' }}>
                                                {aktifSayisi > 0 ? 'AKTİF' : 'PASİF'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Görev listesi */}
                                    <div style={{ padding: '8px 0' }}>
                                        {ajan.gorevler.map(gorev => (
                                            <div key={gorev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderBottom: '1px solid #fafafa', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                                                {/* Toggle butonu */}
                                                <button onClick={() => gorevToggle(ajanKey, gorev.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                                    {gorev.aktif
                                                        ? <ToggleRight size={28} color="#10b981" />
                                                        : <ToggleLeft size={28} color="#cbd5e1" />
                                                    }
                                                </button>

                                                {/* Görev bilgisi */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: gorev.aktif ? '#0f172a' : '#94a3b8', lineHeight: 1.3 }}>
                                                        {gorev.ad}
                                                    </div>
                                                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{gorev.tablo}</span>
                                                        {!gorev.aktif && gorev.neden_pasif && (
                                                            <span style={{ color: '#f59e0b', fontSize: '0.6rem' }}>⚠️ {gorev.neden_pasif}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Durum badge */}
                                                <span style={{
                                                    fontSize: '0.62rem', fontWeight: 800, padding: '3px 8px', borderRadius: 8, flexShrink: 0,
                                                    background: gorev.aktif ? '#ecfdf5' : '#fef2f2',
                                                    color: gorev.aktif ? '#10b981' : '#ef4444',
                                                    border: `1px solid ${gorev.aktif ? '#bbf7d0' : '#fecaca'}`
                                                }}>
                                                    {gorev.aktif ? '✓ AKTİF' : '✗ PASİF'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Vercel Cron API Arayüzü */}
                    <div style={{ marginTop: '1.25rem', background: '#f8fafc', borderRadius: 16, padding: '1.25rem', border: '2px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                            <Clock size={20} color="#3b82f6" />
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Zamanlanmış Ajan Görevleri (Cron Jobs)</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Ajanların belirli saatlerde otomatik uyanıp görev almasını sağlayan sistem uç noktaları (Vercel Cron uyumlu).</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                            {/* Sabah Cron */}
                            <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 10, padding: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.8rem' }}>🌅 Sabah Operasyonu (08:00)</div>
                                    <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>0 8 * * *</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 12 }}>Tüm gece üretimini toparlar, dünkü verilerle güne başlama özeti oluşturur. (Endpoint: <code style={{ color: '#3b82f6' }}>/api/cron-ajanlar?gorev=sabah_ozeti</code>)</div>
                                <button onClick={() => { telegramBildirim('⏰ Manuel tetikleme: Sabah Cron Job çalıştırıldı.'); goster('Sabah cronu manuel tetiklendi.', 'success'); fetch('/api/cron-ajanlar?gorev=sabah_ozeti', { headers: { 'Authorization': 'Bearer ' + (process.env.NEXT_PUBLIC_CRON_SECRET || 'dev_secret') } }).then(() => yukle()); }} style={{ width: '100%', padding: '6px', background: '#fffbeb', border: '1px solid #fcd34d', color: '#d97706', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Dürt & Manuel Tetikle</button>
                            </div>
                            {/* Gece Cron */}
                            <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 10, padding: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ fontWeight: 800, color: '#6366f1', fontSize: '0.8rem' }}>🌌 Gece Yedekleme (03:00)</div>
                                    <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>0 3 * * *</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 12 }}>Günlük tabloları sıkıştırır, eski logları (7+ gün) arşive kaldırır ve bakım yapar. (Endpoint: <code style={{ color: '#3b82f6' }}>/api/cron-ajanlar?gorev=gece_yedekleme_ve_temizlik</code>)</div>
                                <button onClick={() => { telegramBildirim('⏰ Manuel tetikleme: Gece Cron Job çalıştırıldı.'); goster('Gece cronu manuel tetiklendi.', 'success'); fetch('/api/cron-ajanlar?gorev=gece_yedekleme_ve_temizlik', { headers: { 'Authorization': 'Bearer ' + (process.env.NEXT_PUBLIC_CRON_SECRET || 'dev_secret') } }).then(() => yukle()); }} style={{ width: '100%', padding: '6px', background: '#e0e7ff', border: '1px solid #a5b4fc', color: '#4f46e5', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Dürt & Manuel Tetikle</button>
                            </div>
                        </div>
                    </div>

                    {/* Özet */}
                    <div style={{ marginTop: '1.25rem', background: 'white', borderRadius: 16, padding: '1.25rem', border: '2px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>📊 Toplam Görev Özeti</div>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            {Object.values(konfig).map(ajan => {
                                const aktif = ajan.gorevler.filter(g => g.aktif).length;
                                const toplam = ajan.gorevler.length;
                                return (
                                    <div key={ajan.isim} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.2rem' }}>{ajan.ikon}</div>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>{ajan.isim}</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: aktif > 0 ? '#10b981' : '#94a3b8' }}>{aktif}/{toplam}</div>
                                    </div>
                                );
                            })}
                            <div style={{ textAlign: 'center', marginLeft: 'auto' }}>
                                <div style={{ fontSize: '1.2rem' }}>🎯</div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>TOPLAM AKTİF</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#6366f1' }}>
                                    {Object.values(konfig).reduce((s, a) => s + a.gorevler.filter(g => g.aktif).length, 0)}/
                                    {Object.values(konfig).reduce((s, a) => s + a.gorevler.length, 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
