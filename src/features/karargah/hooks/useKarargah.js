'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { komutSchema } from '../schemas/komutSchema';
import { karargahVerileriniGetir, karargahAjanGonder } from '../services/karargahApi';

const ALARM_AKTIF = process.env.NEXT_PUBLIC_ALARM_AKTIF === 'true';
const MESAJ_AKTIF = process.env.NEXT_PUBLIC_MESAJ_AKTIF === 'true';
const BOT_AKTIF = process.env.NEXT_PUBLIC_BOT_AKTIF !== 'false';

export function useKarargah() {
    const [stats, setStats] = useState({ ciro: 0, ciroArtis: 0, maliyet: 0, personel: 0, fire: 0, bekleyenSiparis: 0, aktifUretim: 0, stokAlarm: 0, yukleniyor: true });
    const [alarms, setAlarms] = useState([]);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [ping, setPing] = useState(null);
    const [commandText, setCommandText] = useState('');
    const [aiSorgu, setAiSorgu] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [simulasyon, setSimulasyon] = useState(0);
    const [aiOutputs, setAiOutputs] = useState([]);

    // Haberlesme State
    const [mesajSayisi, setMesajSayisi] = useState(0);
    const [sonMesajlar, setSonMesajlar] = useState([]);
    const [gizlenIzleri, setGizlenIzleri] = useState([]);
    const [botLoglar, setBotLoglar] = useState([]);

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text, type: '' }), 5000);
    };

    const hizliGorevAtama = async () => {
        if (!commandText.trim()) return goster('Komut boş olamaz.', 'error');
        try {
            komutSchema.parse({ komut: commandText });
            const r = await karargahAjanGonder({
                gorev_adi: commandText.trim(), gorev_tipi: 'kontrol', oncelik: 'normal',
                gorev_emri: `Karargah CMD: ${commandText.trim()}`, ajan_adi: 'Trend Kâşifi',
                hedef_modul: 'genel', hedef_tablo: 'b1_ajan_gorevler', durum: 'bekliyor',
                yetki_internet: false, yetki_supabase_oku: true, yetki_supabase_yaz: false,
                yetki_ai_kullan: false, yetki_dosya_olustur: false,
            });
            if (r.offline) goster('⚡ Çevrimdışı: Görev kuyruğa alındı.', 'success');
            else goster(`✅ Görev sisteme iletildi: ${commandText}`);
            setCommandText('');
        } catch (error) {
            if (error?.errors) goster(error.errors[0].message, 'error');
            else goster('Görev hata: ' + (error?.message || 'Bilinmeyen hata'), 'error');
        }
    };

    const [aiSonuc, setAiSonuc] = useState('');
    const aiAnalizBaslat = async () => {
        if (!aiSorgu.trim()) return goster('Sorgu boş olamaz.', 'error');
        setIsAiLoading(true); setAiSonuc('');
        try {
            const res = await fetch('/api/ajan-calistir', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sorgu_metni: aiSorgu.trim() }),
            });
            const data = await res.json();
            if (data?.basarili && data?.sonuc?.ozet) { setAiSonuc(data.sonuc.ozet); goster('AI analiz tamam.'); }
            else goster('AI hata: ' + (data?.error || 'Sunucu hatası'), 'error');
        } catch (err) { goster('AI bağlantı hatası.', 'error'); }
        finally { setIsAiLoading(false); setAiSorgu(''); }
    };

    // YENİ OTONOM FETCHING MİMARİSİ (ZIRHLI API + IndexedDB)
    const veriCek = useCallback(async () => {
        setStats(prev => ({ ...prev, yukleniyor: true }));
        try {
            // 10sn Timeout kalkanı
            const t0 = performance.now();
            const timeoutPromise = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000));

            const r = await karargahVerileriniGetir(timeoutPromise, ALARM_AKTIF, MESAJ_AKTIF, BOT_AKTIF);
            if (!r || !r.data) throw new Error('CevapsizKalkan');

            const { stats: s, aiOutputs: ao, alarms: a, mesajSayisi: ms, sonMesajlar: sm, gizlenIzleri: gi, botLoglar: bl } = r.data;

            setStats(s || { ciro: 0, ciroArtis: 0, maliyet: 0, personel: 0, fire: 0, bekleyenSiparis: 0, aktifUretim: 0, stokAlarm: 0, yukleniyor: false });
            setAiOutputs(ao || []);
            setAlarms(a || []);
            setMesajSayisi(ms || 0);
            setSonMesajlar(sm || []);
            setGizlenIzleri(gi || []);
            setBotLoglar(bl || []);
            setPing(r.gecikme || Math.round(performance.now() - t0));

            // Eğer isCached true ise bu 0ms'de geldi demektir, UI blocklanmaz, arkada zaten Sync ediliyor
        } catch (err) {
            console.error('[KÖR NOKTA ZIRHI] Karargah veri hatası:', err);
            setStats(prev => ({ ...prev, yukleniyor: false }));
        }
    }, []);

    useEffect(() => {
        veriCek();
        const kanal = supabase.channel('karargah-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_kasa_hareketleri' }, () => { if (!document.hidden) veriCek(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_sistem_uyarilari' }, () => { if (!document.hidden) veriCek(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_agent_loglari' }, () => { if (!document.hidden) veriCek(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_arge_trendler' }, () => { if (!document.hidden) veriCek(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_ic_mesajlar' }, () => { if (!document.hidden) veriCek(); })
            .subscribe();
        return () => { supabase.removeChannel(kanal); };
    }, [veriCek]);

    return {
        stats, alarms, ping,
        commandText, setCommandText, hizliGorevAtama,
        aiSorgu, setAiSorgu, isAiLoading, aiAnalizBaslat, aiSonuc,
        aiOutputs, simulasyon, setSimulasyon,
        mesaj, mesajSayisi, sonMesajlar, gizlenIzleri, botLoglar
    };
}
