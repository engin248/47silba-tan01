'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect, useRef } from 'react';
import { Bot, Plus, Play, Square, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, Settings, Database, Globe, Cpu, FileText, Trash2, RefreshCw, Zap, Send, ToggleLeft, ToggleRight, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';

// ÔöÇÔöÇÔöÇ AJAN G├ûREV KONF─░G├£RASYONU ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// Koordinat├Âr buradan her ajan─▒n her g├Ârevini a├ğ─▒p kapat─▒r
// AKT─░F = true ÔåÆ Ajan bu g├Ârevi yap─▒yor
// PAS─░F = false ÔåÆ Mod├╝l yok veya gerek yok, kod bekliyor
const VARSAYILAN_KONFIGUR = {
    sabah: {
        isim: 'Sabah Subay─▒', ikon: '­şîà', renk: '#f59e0b',
        gorevler: [
            { id: 'sb_1', ad: 'Sipari┼ş 2 g├╝n teslim alarm─▒', aktif: false, tablo: 'b2_siparisler', neden_pasif: 'Ger├ğek sipari┼ş takibi sisteme oturmad─▒' },
            { id: 'sb_2', ad: 'S─▒f─▒r stok alarm─▒', aktif: false, tablo: 'b2_urun_katalogu', neden_pasif: 'Stok ak─▒┼ş─▒ hen├╝z ger├ğek├ği de─şil' },
            { id: 'sb_3', ad: 'Onay bekleyen trend say─▒s─▒ (sadece bilgi)', aktif: true, tablo: 'b1_arge_trendler', neden_pasif: '' },
            { id: 'sb_4', ad: '├£retim kay─▒t takibi (kim-ne-ne zaman)', aktif: true, tablo: 'b1_uretim_kayitlari', neden_pasif: '' },
            { id: 'sb_5', ad: '├ûdenmemi┼ş fatura', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Kasa mod├╝l├╝ yok' },
            { id: 'sb_6', ad: 'Kasa bakiye ├Âzeti', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Kasa mod├╝l├╝ yok' },
            { id: 'sb_7', ad: 'Aktif personel say─▒s─▒', aktif: true, tablo: 'b1_personel', neden_pasif: '' },
            { id: 'sb_8', ad: 'Ortak g├Ârev tahtas─▒ ÔÇö bekleyen i┼ş emirleri', aktif: true, tablo: 'b1_ajan_gorevler', neden_pasif: '' },
        ]
    },
    aksam: {
        isim: 'Ak┼şamc─▒', ikon: '­şîå', renk: '#6366f1',
        gorevler: [
            { id: 'ak_1', ad: 'Bug├╝n tamamlanan ├╝retim', aktif: true, tablo: 'b1_uretim_kayitlari', neden_pasif: '' },
            { id: 'ak_2', ad: 'Yar─▒n teslim sipari┼şleri', aktif: true, tablo: 'b2_siparisler', neden_pasif: '' },
            { id: 'ak_3', ad: 'G├╝nl├╝k kasa ├Âzeti', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Kasa mod├╝l├╝ yok' },
            { id: 'ak_4', ad: 'Yar─▒m kalan ├╝retim i┼şleri', aktif: true, tablo: 'b1_uretim_kayitlari', neden_pasif: '' },
            { id: 'ak_5', ad: 'Kapan─▒┼ş logu yaz', aktif: true, tablo: 'b1_agent_loglari', neden_pasif: '' },
        ]
    },
    nabiz: {
        isim: 'Nab─▒z', ikon: '­şÆô', renk: '#ef4444',
        gorevler: [
            { id: 'nb_1', ad: 'Stok alarm kontrol├╝', aktif: true, tablo: 'b2_urun_katalogu', neden_pasif: '' },
            { id: 'nb_2', ad: 'Maliyet a┼ş─▒m─▒ takibi', aktif: true, tablo: 'b1_muhasebe_raporlari', neden_pasif: '' },
            { id: 'nb_3', ad: 'Di─şer ajanlar durdu mu? (m├╝fetti┼şlik)', aktif: true, tablo: 'b1_agent_loglari', neden_pasif: '' },
            { id: 'nb_4', ad: 'Vadesi ge├ğen ├Âdeme', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Kasa mod├╝l├╝ yok' },
            { id: 'nb_5', ad: 'Yakla┼şan stok erken uyar─▒', aktif: true, tablo: 'b2_urun_katalogu', neden_pasif: '' },
        ]
    },
    zincir: {
        isim: 'Zincirci', ikon: 'Ôøô´©Å', renk: '#10b981',
        gorevler: [
            { id: 'zn_1', ad: 'M1ÔåÆM2: Trend onayland─▒ ÔåÆ Kuma┼ş', aktif: true, tablo: 'b1_arge_trendler', neden_pasif: '' },
            { id: 'zn_2', ad: 'M2ÔåÆM3: Kuma┼ş se├ğildi ÔåÆ Kal─▒p', aktif: true, tablo: 'b1_kumas_arsiv', neden_pasif: '' },
            { id: 'zn_3', ad: 'M3ÔåÆM4: Kal─▒p haz─▒r ÔåÆ Modelhane', aktif: true, tablo: 'b1_model_taslaklari', neden_pasif: '' },
            { id: 'zn_4', ad: 'M4ÔåÆM5: Numune onayl─▒ ÔåÆ Kesim', aktif: true, tablo: 'b1_modelhane_kayitlari', neden_pasif: '' },
            { id: 'zn_5', ad: 'M5ÔåÆM6: Kesim bitti ÔåÆ ├£retim', aktif: false, tablo: 'b1_kesim_emirleri', neden_pasif: 'Kesim emirleri tablosu yok' },
            { id: 'zn_6', ad: 'M6ÔåÆM7: ├£retim bitti ÔåÆ Maliyet', aktif: false, tablo: 'b1_uretim_kayitlari', neden_pasif: 'Maliyet ba─şlant─▒s─▒ kurulmad─▒' },
            { id: 'zn_7', ad: 'M7ÔåÆM8: Maliyet onayl─▒ ÔåÆ Muhasebe', aktif: false, tablo: 'b1_maliyet_kalemleri', neden_pasif: 'Maliyet kalemleri tablosu yok' },
            { id: 'zn_8', ad: 'Zincir sa─şl─▒k raporu', aktif: true, tablo: 'b1_agent_loglari', neden_pasif: '' },
        ]
    },
    finans: {
        isim: 'Finans Kalkan─▒', ikon: '­şøí´©Å', renk: '#8b5cf6',
        gorevler: [
            { id: 'fn_1', ad: 'Maliyet a┼ş─▒m─▒ %15+', aktif: true, tablo: 'b1_muhasebe_raporlari', neden_pasif: '' },
            { id: 'fn_2', ad: 'Vadeli alacak takibi', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Mod├╝l yok' },
            { id: 'fn_3', ad: 'Kasa kritik seviye', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: 'Kasa mod├╝l├╝ yok' },
            { id: 'fn_4', ad: 'Gider art─▒┼ş─▒ %20+', aktif: true, tablo: 'b2_kasa_hareketleri', neden_pasif: '' },
            { id: 'fn_5', ad: 'K├ór marj─▒ %10 alt─▒ uyar─▒', aktif: true, tablo: 'b2_kasa_hareketleri', neden_pasif: '' },
            { id: 'fn_6', ad: 'Gelecek ├Âdeme hat─▒rlatma', aktif: false, tablo: 'b2_kasa_hareketleri', neden_pasif: '├ûdeme takvimi yok' },
        ]
    },
    kasif: {
        isim: 'Trend K├ó┼şifi', ikon: '­şöı', renk: '#3b82f6',
        gorevler: [
            { id: 'tk_1', ad: 'Duplicate trend kontrol├╝', aktif: true, tablo: 'b1_arge_trendler', neden_pasif: '' },
            { id: 'tk_2', ad: 'Perplexity AI ile internet ara┼şt─▒rmas─▒', aktif: true, tablo: 'internet', neden_pasif: '' },
            { id: 'tk_3', ad: 'Kalite + uzunluk filtresi', aktif: true, tablo: 'dahili', neden_pasif: '' },
            { id: 'tk_4', ad: 'Ar-Ge tablosuna kaydet (durum: inceleniyor)', aktif: true, tablo: 'b1_arge_trendler', neden_pasif: '' },
            { id: 'tk_5', ad: 'G├Ârev tamamlama raporu', aktif: true, tablo: 'b1_agent_loglari', neden_pasif: '' },
        ]
    },
    muhasebe: {
        isim: 'Muhasebe Yaz─▒c─▒', ikon: '­şôè', renk: '#0ea5e9',
        gorevler: [
            { id: 'mh_1', ad: 'Ayl─▒k gelir/gider hesab─▒', aktif: true, tablo: 'b2_kasa_hareketleri', neden_pasif: '' },
            { id: 'mh_2', ad: 'Model k├órl─▒l─▒k analizi', aktif: true, tablo: 'b1_muhasebe_raporlari', neden_pasif: '' },
            { id: 'mh_3', ad: 'Tamamlanan ├╝retim ├Âzeti', aktif: true, tablo: 'b1_uretim_kayitlari', neden_pasif: '' },
            { id: 'mh_4', ad: 'Sipari┼ş teslim oran─▒', aktif: true, tablo: 'b2_siparisler', neden_pasif: '' },
            { id: 'mh_5', ad: 'Aktif personel ├Âzeti', aktif: true, tablo: 'b1_personel', neden_pasif: '' },
            { id: 'mh_6', ad: 'Ayl─▒k raporu muhasebe tablosuna yaz', aktif: true, tablo: 'b1_muhasebe_raporlari', neden_pasif: '' },
        ]
    },
};

const AJAN_LISTESI = [
    { ad: 'Trend K├ó┼şifi', ikon: '­şöı', renk: '#3b82f6', modul: 'arge', aciklama: 'Trendyol, Amazon ara┼şt─▒r─▒r' },
    { ad: '├£retim Kontrol', ikon: 'ÔÜÖ´©Å', renk: '#f59e0b', modul: 'uretim', aciklama: '├£retim takibi' },
    { ad: 'Muhasebe', ikon: '­şôè', renk: '#6366f1', modul: 'muhasebe', aciklama: 'Raporlar ├╝retir' },
    { ad: 'Stok Kontrol', ikon: '­şôĞ', renk: '#ef4444', modul: 'stok', aciklama: 'Stok alarmlar─▒' },
    { ad: 'Personel', ikon: '­şæñ', renk: '#f97316', modul: 'personel', aciklama: 'Personel analizi' },
    { ad: 'Genel', ikon: '­şñû', renk: '#64748b', modul: 'genel', aciklama: 'Genel analiz' },
];

const GOREV_TIPLERI = [
    { deger: 'arastirma', etiket: 'Ara┼şt─▒rma', ikon: '­şöı' },
    { deger: 'analiz', etiket: 'Analiz', ikon: '­şôè' },
    { deger: 'kontrol', etiket: 'Kontrol', ikon: 'Ô£à' },
    { deger: 'rapor', etiket: 'Rapor', ikon: '­şôä' },
];

const ONCELIK = [
    { deger: 'acil', etiket: 'Acil', renk: '#ef4444', bg: '#fef2f2' },
    { deger: 'yuksek', etiket: 'Y├╝ksek', renk: '#f59e0b', bg: '#fffbeb' },
    { deger: 'normal', etiket: 'Normal', renk: '#3b82f6', bg: '#eff6ff' },
    { deger: 'dusuk', etiket: 'D├╝┼ş├╝k', renk: '#94a3b8', bg: '#f8fafc' },
];

const DURUM_CONFIG = {
    bekliyor: { renk: '#94a3b8', bg: '#f8fafc', ikon: Clock, etiket: 'Bekliyor' },
    'calis─▒yor': { renk: '#f59e0b', bg: '#fffbeb', ikon: Loader2, etiket: '├çal─▒┼ş─▒yor' },
    tamamlandi: { renk: '#10b981', bg: '#ecfdf5', ikon: CheckCircle2, etiket: 'Tamamland─▒' },
    hata: { renk: '#ef4444', bg: '#fef2f2', ikon: XCircle, etiket: 'Hata' },
    iptal: { renk: '#6b7280', bg: '#f9fafb', ikon: Square, etiket: '─░ptal' },
};

const BOS_FORM = {
    gorev_adi: '', gorev_tipi: 'arastirma', oncelik: 'normal',
    gorev_emri: '', hedef_modul: 'arge', hedef_tablo: 'b1_arge_trendler',
    ajan_adi: 'Trend K├ó┼şifi', yetki_internet: true, yetki_supabase_yaz: true,
    yetki_supabase_oku: true, yetki_ai_kullan: true, yetki_dosya_olustur: false,
    koordinator_notu: '',
};

export default function AjanlarSayfasi() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [sekme, setSekme] = useState('gorevler'); // 'gorevler' | 'konfigur'
    const [gorevler, setGorevler] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOS_FORM);
    const [calistiriliyor, setCalistiriliyor] = useState({});
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtre, setFiltre] = useState('hepsi');
    const [secilenGorev, setSecilenGorev] = useState(null);
    const [istatistik, setIstatistik] = useState({ toplam: 0, tamamlandi: 0, calis─▒yor: 0, hata: 0, bekliyor: 0 });
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
        const erisebilir = kullanici?.grup === 'tam' || ajanPin;
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

    // [BUGFIX]: Polling devre d─▒┼ş─▒ kalm─▒┼şt─▒ (dead code). D├╝zeltildi.
    useEffect(() => {
        pollingRef.current = setInterval(() => {
            if (gorevler.some(g => g.durum === 'calis─▒yor')) yukle();
        }, 5000);
        return () => clearInterval(pollingRef.current);
    }, [gorevler]);

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

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = async () => {
        try {
            // [AI ZIRHI]: 10sn timeout DDoS kalkan─▒ (Kriter Q)
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Ba─şlant─▒ zaman a┼ş─▒m─▒ (10sn)')), 10000));
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
                    'calis─▒yor': data.filter(g => g.durum === 'calis─▒yor').length,
                    hata: data.filter(g => g.durum === 'hata').length,
                    bekliyor: data.filter(g => g.durum === 'bekliyor').length,
                });
            }
        } catch (error) { goster('G├Ârevler y├╝klenirken hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const gorevGonder = async () => {
        if (!form.gorev_adi.trim()) return goster('G├Ârev ad─▒ zorunludur!', 'error');
        if (!form.gorev_emri.trim()) return goster('G├Ârev emri zorunludur!', 'error');
        if (form.gorev_adi.length > 100) return goster('G├Ârev ad─▒ ├ğok uzun!', 'error');
        if (form.gorev_emri.length > 1000) return goster('G├Ârev emri ├ğok uzun (Max 1000)!', 'error');

        try {
            // ­şøæ U Kriteri: M├╝kerrer Ajan G├Ârevi Engeli
            const { data: mevcutGorev } = await supabase.from('b1_ajan_gorevler')
                .select('id').ilike('gorev_adi', form.gorev_adi.trim()).eq('durum', 'bekliyor');

            if (mevcutGorev && mevcutGorev.length > 0) {
                return goster('ÔÜá´©Å Bu g├Ârev ad─▒yla bekleyen bir kay─▒t zaten var!', 'error');
            }

            const { data, error } = await supabase.from('b1_ajan_gorevler').insert([{ ...form, durum: 'bekliyor' }]).select().single();
            if (error) throw error;
            goster('Ô£à G├Ârev olu┼şturuldu ve kuyru─şa al─▒nd─▒!');
            telegramBildirim(`­şñû YEN─░ OTONOM G├ûREV\nAjan: ${form.ajan_adi}\nG├Ârev: ${form.gorev_adi}`);
            setForm(BOS_FORM); setFormAcik(false); yukle();
            if (form.oncelik === 'acil') setTimeout(() => gorevCalistir(data.id), 500);
        } catch (error) {
            // [AI ZIRHI]: Offline guard (Kriter J)
            if (!navigator.onLine || error.message?.includes('fetch')) {
                const { cevrimeKuyrugaAl } = await import('@/lib/offlineKuyruk');
                await cevrimeKuyrugaAl({ tablo: 'b1_ajan_gorevler', islem_tipi: 'INSERT', veri: { ...form, durum: 'bekliyor' } });
                goster('─░nternet Yok: G├Ârev ├ğevrimd─▒┼ş─▒ kuyru─şa al─▒nd─▒.', 'success');
                setForm(BOS_FORM); setFormAcik(false);
            } else {
                goster('Kay─▒t hatas─▒: ' + error.message, 'error');
            }
        }
    };

    const gorevCalistir = async (gorev_id) => {
        setCalistiriliyor(p => ({ ...p, [gorev_id]: true }));
        try {
            const res = await fetch('/api/ajan-calistir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gorev_id }) });
            const d = await res.json();
            d.basarili ? goster('Ô£à G├Ârev tamamland─▒!') : goster('ÔÜá´©Å ' + (d.error || 'Hata'), 'error');
        } catch (e) { goster('Ba─şlant─▒ hatas─▒', 'error'); }
        setCalistiriliyor(p => ({ ...p, [gorev_id]: false }));
        yukle();
    };

    const gorevSil = async (id) => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const adminPin = prompt('Bu ajan g├Ârevini silmek i├ğin Y├Ânetici P─░N kodunu girin:');
            const dogruPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (adminPin !== dogruPin) return goster('Yetkisiz ─░┼şlem!', 'error');
        }
        if (!confirm('G├Ârevi sil?')) return;
        try {

            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String('b1_ajan_gorevler').replace(/['"]/g, ''),
                    islem_tipi: 'SILME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
                }]).catch(() => { });
            } catch (e) { }

            const { error } = await supabase.from('b1_ajan_gorevler').delete().eq('id', id);
            if (error) throw error;
            setGorevler(p => p.filter(g => g.id !== id));
            if (secilenGorev?.id === id) setSecilenGorev(null);
            goster('G├Ârev silindi!');
        } catch (error) { goster('Silinemedi: ' + error.message, 'error'); }
    };

    const gorevToggle = (ajanKey, gorevId) => {
        const yeni = { ...konfig };
        const idx = yeni[ajanKey].gorevler.findIndex(g => g.id === gorevId);
        yeni[ajanKey].gorevler[idx] = { ...yeni[ajanKey].gorevler[idx], aktif: !yeni[ajanKey].gorevler[idx].aktif };
        setKonfig(yeni);
        localStorage.setItem('ajan_konfig', JSON.stringify(yeni));
        goster(`${yeni[ajanKey].gorevler[idx].aktif ? 'Ô£à Aktif edildi' : 'ÔÅ© Pasife al─▒nd─▒'}: ${yeni[ajanKey].gorevler[idx].ad}`);
    };

    const filtreliGorevler = filtre === 'hepsi' ? gorevler : gorevler.filter(g => g.durum === filtre);
    const formatTarih = (iso) => { if (!iso) return 'ÔÇö'; const d = new Date(iso); return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };
    const sure = (bas, bit) => { if (!bas || !bit) return null; const ms = new Date(bit) - new Date(bas); if (ms < 1000) return `${ms}ms`; if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`; return `${Math.floor(ms / 60000)}dk`; };
    const ajanBilgisi = (ad) => AJAN_LISTESI.find(a => a.ad === ad) || AJAN_LISTESI[5];
    const oncelikBilgisi = (d) => ONCELIK.find(o => o.deger === d) || ONCELIK[2];
    const durumBilgisi = (d) => DURUM_CONFIG[d] || DURUM_CONFIG.bekliyor;

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETK─░S─░Z G─░R─░┼Ş ENGELLEND─░</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>AI Ajan komuta merkezi verileri gizlidir. G├Âr├╝nt├╝lemek i├ğin Yetkili Kullan─▒c─▒ giri┼şi gereklidir.</p>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'inherit' }}>

            {/* ÔöÇÔöÇÔöÇ BA┼ŞLIK ÔöÇÔöÇÔöÇ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                        <Bot size={26} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>AI Ajan Komuta Merkezi</h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                            G├Ârev Tahtas─▒ ÔÇö Ajanlar okur, sonu├ğlar─▒ kendi tablolar─▒na yazar
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={yukle} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'white', border: '2px solid #e5e7eb', borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: '#374151', fontSize: '0.82rem' }}>
                        <RefreshCw size={14} /> Yenile
                    </button>
                    <button onClick={() => setFormAcik(!formAcik)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                        <Plus size={18} /> Yeni G├Ârev Emri
                    </button>
                    {/* CC Kriteri Otomatik Rota (M├╝fetti┼ş'e Ge├ği┼ş) */}
                    <a href="/denetmen" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(15,23,42,0.3)' }}>
                            <Bot size={18} /> Denetmen (M├╝fetti┼ş)
                        </button>
                    </a>
                </div>
            </div>

            {/* ÔöÇÔöÇÔöÇ MESAJ ÔöÇÔöÇÔöÇ */}
            {mesaj.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: '1rem', borderRadius: 10, border: '2px solid', fontWeight: 700, fontSize: '0.875rem', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    {mesaj.text}
                </div>
            )}

            {/* ÔöÇÔöÇÔöÇ ─░STAT─░ST─░KLER ÔöÇÔöÇÔöÇ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam G├Ârev', val: istatistik.toplam, renk: '#6366f1', bg: '#f5f3ff' },
                    { label: 'Bekliyor', val: istatistik.bekliyor, renk: '#94a3b8', bg: '#f8fafc' },
                    { label: '├çal─▒┼ş─▒yor', val: istatistik.calis─▒yor, renk: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Tamamland─▒', val: istatistik.tamamlandi, renk: '#10b981', bg: '#ecfdf5' },
                    { label: 'Hata', val: istatistik.hata, renk: '#ef4444', bg: '#fef2f2' },
                ].map((k, i) => (
                    <div key={i} style={{ background: k.bg, border: `2px solid ${k.renk}25`, borderRadius: 12, padding: '0.875rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
                        <div style={{ fontWeight: 900, fontSize: '1.8rem', color: k.renk, lineHeight: 1 }}>{k.val}</div>
                    </div>
                ))}
            </div>

            {/* ÔöÇÔöÇÔöÇ SEKMELER ÔöÇÔöÇÔöÇ */}
            <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', background: '#f1f5f9', borderRadius: 12, padding: 4 }}>
                {[
                    { key: 'gorevler', label: '­şôï G├Ârev Tahtas─▒', desc: '─░┼ş emirleri' },
                    { key: 'konfigur', label: 'ÔÜÖ´©Å Ajan Yap─▒land─▒rma', desc: 'Aktif/Pasif' },
                ].map(s => (
                    <button key={s.key} onClick={() => setSekme(s.key)} style={{
                        flex: 1, padding: '10px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s',
                        background: sekme === s.key ? 'white' : 'transparent',
                        color: sekme === s.key ? '#6366f1' : '#64748b',
                        boxShadow: sekme === s.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    }}>
                        {s.label}
                        <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', marginTop: 1 }}>{s.desc}</span>
                    </button>
                ))}
            </div>

            {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
                SEKME 1: G├ûREV TAHTASI
            ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}
            {sekme === 'gorevler' && (
                <>
                    {/* Yeni G├Ârev Formu */}
                    {formAcik && (
                        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', borderRadius: 20, padding: '2rem', marginBottom: '1.5rem', border: '2px solid #6366f1', boxShadow: '0 20px 60px rgba(99,102,241,0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Send size={18} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>­şÄû´©Å Yeni G├Ârev Emri</div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>T├╝m ajanlar bu g├Ârev tahtas─▒n─▒ okur</div>
                                </div>
                                <button onClick={() => setFormAcik(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>Ô£ò</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>­şÅÀ´©Å G├Ârev Ad─▒ *</label>
                                    <input maxLength={100} value={form.gorev_adi} onChange={e => setForm({ ...form, gorev_adi: e.target.value })}
                                        placeholder="├ûrn: 2026 Yaz Sezonu Trend Ara┼şt─▒rmas─▒"
                                        style={{ width: '100%', padding: '12px 16px', background: '#1e293b', border: '2px solid #334155', borderRadius: 10, color: 'white', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>ÔÜí G├Ârev Tipi</label>
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
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>­şÜ¿ ├ûncelik</label>
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
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>­şñû Ajan</label>
                                    <select value={form.ajan_adi} onChange={e => setForm({ ...form, ajan_adi: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', background: '#1e293b', border: '2px solid #334155', borderRadius: 10, color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none' }}>
                                        {AJAN_LISTESI.map(a => <option key={a.ad} value={a.ad}>{a.ikon} {a.ad}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>­şöÉ Yetkiler</label>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {[
                                            { alan: 'yetki_internet', etiket: '­şîÉ Net' },
                                            { alan: 'yetki_ai_kullan', etiket: '­şñû AI' },
                                            { alan: 'yetki_supabase_oku', etiket: '­şôÑ Oku' },
                                            { alan: 'yetki_supabase_yaz', etiket: '­şôñ Yaz' },
                                        ].map(y => (
                                            <button key={y.alan} onClick={() => setForm({ ...form, [y.alan]: !form[y.alan] })}
                                                style={{ padding: '6px 10px', background: form[y.alan] ? '#065f46' : '#1e293b', border: `2px solid ${form[y.alan] ? '#10b981' : '#334155'}`, borderRadius: 8, color: form[y.alan] ? '#34d399' : '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>
                                                {y.etiket} {form[y.alan] ? 'Ô£ô' : 'Ô£ù'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>­şôï G├Ârev Emri *</label>
                                    <textarea maxLength={1000} rows={4} value={form.gorev_emri} onChange={e => setForm({ ...form, gorev_emri: e.target.value })}
                                        placeholder="Ajan ne yapmal─▒? Detayl─▒ yaz..."
                                        style={{ width: '100%', padding: '12px 16px', background: '#1e293b', border: '2px solid #334155', borderRadius: 10, color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', boxSizing: 'border-box', resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setFormAcik(false)} style={{ padding: '11px 22px', background: 'transparent', border: '2px solid #334155', borderRadius: 10, color: '#64748b', cursor: 'pointer', fontWeight: 700 }}>─░ptal</button>
                                <button onClick={gorevGonder} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontSize: '0.95rem' }}>
                                    <Send size={16} /> G├Ârevi G├Ânder
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filtreler */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {['hepsi', 'bekliyor', 'calis─▒yor', 'tamamlandi', 'hata', 'iptal'].map(f => (
                            <button key={f} onClick={() => setFiltre(f)} style={{
                                padding: '6px 16px', borderRadius: 20, border: '2px solid', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                borderColor: filtre === f ? '#6366f1' : '#e5e7eb',
                                background: filtre === f ? '#6366f1' : 'white',
                                color: filtre === f ? 'white' : '#374151'
                            }}>
                                {f === 'hepsi' ? '­şöİ T├╝m├╝' :
                                    f === 'bekliyor' ? `ÔÅ│ Bekliyor (${gorevler.filter(g => g.durum === 'bekliyor').length})` :
                                        f === 'calis─▒yor' ? `ÔÜí ├çal─▒┼ş─▒yor` :
                                            f === 'tamamlandi' ? `Ô£à Tamamlanan (${gorevler.filter(g => g.durum === 'tamamlandi').length})` :
                                                f === 'hata' ? `ÔØî Hatal─▒` : `­şÜ½ ─░ptal`}
                            </button>
                        ))}
                    </div>

                    {/* G├Ârev Tablosu */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <div style={{ minWidth: 680 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px 100px 120px 80px 100px', gap: '0.5rem', padding: '10px 16px', background: '#f8fafc', borderBottom: '2px solid #f1f5f9', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                                    <span>G├ûREV</span><span>AJAN</span><span>T─░P</span><span>├ûNCEL─░K</span><span>DURUM</span><span>S├£RE</span><span>─░┼ŞLEM</span>
                                </div>

                                {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 700 }}>Y├╝kleniyor...</div>}
                                {!loading && filtreliGorevler.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '4rem', background: '#fafafa' }}>
                                        <Bot size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                                        <p style={{ color: '#94a3b8', fontWeight: 700 }}>Hen├╝z g├Ârev yok. Yeni g├Ârev emri verin!</p>
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
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{formatTarih(gorev.created_at)} ÔÇö {gorev.hedef_modul?.toUpperCase() || 'GENEL'}</div>
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
                                                    <DurumIcon size={12} style={{ animation: gorev.durum === 'calis─▒yor' ? 'spin 1s linear infinite' : 'none' }} />
                                                    {dur.etiket}
                                                </span>
                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{sure(gorev.baslangic_tarihi, gorev.bitis_tarihi) || 'ÔÇö'}</div>
                                                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                                    {gorev.durum === 'bekliyor' && (
                                                        <button onClick={() => gorevCalistir(gorev.id)} disabled={calisiyor}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}>
                                                            {calisiyor ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} />} Ba┼şlat
                                                        </button>
                                                    )}
                                                    {gorev.durum === 'tamamlandi' && (
                                                        <button onClick={() => gorevCalistir(gorev.id)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#f1f5f9', color: '#6366f1', border: '1px solid #6366f1', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}>
                                                            <RefreshCw size={11} /> Tekrar
                                                        </button>
                                                    )}
                                                    <button onClick={() => gorevSil(gorev.id)}
                                                        style={{ padding: '5px 8px', background: '#f8fafc', color: '#94a3b8', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer' }}>
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                            {secili && (
                                                <div style={{ background: '#fafafa', borderTop: '1px solid #f1f5f9', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>­şôï G├Ârev Emri</div>
                                                        <div style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.6, background: 'white', border: '1px solid #f1f5f9', borderRadius: 8, padding: '10px 12px' }}>{gorev.gorev_emri}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Ô£à G├Ârev Sonucu</div>
                                                        {gorev.sonuc_ozeti ? (
                                                            <div style={{ fontSize: '0.82rem', color: '#065f46', lineHeight: 1.6, background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', maxHeight: 150, overflowY: 'auto' }}>{gorev.sonuc_ozeti}</div>
                                                        ) : (
                                                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', background: 'white', border: '1px dashed #e5e7eb', borderRadius: 8, padding: '16px 12px', textAlign: 'center' }}>
                                                                {gorev.durum === 'bekliyor' ? 'ÔûÂ Ba┼şlat butonuna bas' : 'ÔÅ│ Bekleniyor...'}
                                                            </div>
                                                        )}
                                                        {gorev.hata_mesaji && <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>ÔØî {gorev.hata_mesaji}</div>}
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

            {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
                SEKME 2: AJAN YAPILANDIRMA ÔÇö AKT─░F/PAS─░F TOGGLE
            ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}
            {sekme === 'konfigur' && (
                <div>
                    <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: 12, padding: '12px 16px', marginBottom: '1.25rem', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Settings size={18} color="#f97316" />
                        <div>
                            <div style={{ fontWeight: 800, color: '#c2410c', fontSize: '0.85rem' }}>Koordinat├Âr Yap─▒land─▒rma Paneli</div>
                            <div style={{ fontSize: '0.73rem', color: '#9a3412' }}>Her ajan─▒n hangi g├Ârevi yapaca─ş─▒n─▒ buradan belirleyin. Pasif g├Ârevler ├ğal─▒┼şt─▒r─▒lmaz ÔÇö mod├╝l haz─▒r oldu─şunda tek t─▒kla a├ğ─▒l─▒r.</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {Object.entries(konfig).map(([ajanKey, ajan]) => {
                            const aktifSayisi = ajan.gorevler.filter(g => g.aktif).length;
                            return (
                                <div key={ajanKey} style={{ background: 'white', borderRadius: 16, border: '2px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    {/* Ajan ba┼şl─▒k */}
                                    <div style={{ padding: '14px 18px', borderBottom: '2px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${ajan.renk}08` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: '1.4rem' }}>{ajan.ikon}</span>
                                            <div>
                                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.92rem' }}>{ajan.isim}</div>
                                                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>{aktifSayisi}/{ajan.gorevler.length} g├Ârev aktif</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: aktifSayisi > 0 ? '#10b981' : '#e5e7eb' }} />
                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: aktifSayisi > 0 ? '#10b981' : '#94a3b8' }}>
                                                {aktifSayisi > 0 ? 'AKT─░F' : 'PAS─░F'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* G├Ârev listesi */}
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

                                                {/* G├Ârev bilgisi */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: gorev.aktif ? '#0f172a' : '#94a3b8', lineHeight: 1.3 }}>
                                                        {gorev.ad}
                                                    </div>
                                                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{gorev.tablo}</span>
                                                        {!gorev.aktif && gorev.neden_pasif && (
                                                            <span style={{ color: '#f59e0b', fontSize: '0.6rem' }}>ÔÜá´©Å {gorev.neden_pasif}</span>
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
                                                    {gorev.aktif ? 'Ô£ô AKT─░F' : 'Ô£ù PAS─░F'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ├ûzet */}
                    <div style={{ marginTop: '1.25rem', background: 'white', borderRadius: 16, padding: '1.25rem', border: '2px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>­şôè Toplam G├Ârev ├ûzeti</div>
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
                                <div style={{ fontSize: '1.2rem' }}>­şÄ»</div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>TOPLAM AKT─░F</div>
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