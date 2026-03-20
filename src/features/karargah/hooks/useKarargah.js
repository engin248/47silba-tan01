'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { komutSchema } from '../schemas/komutSchema';

export function useKarargah() {
    const [stats, setStats] = useState({ ciro: 0, maliyet: 0, personel: 0, fire: 0, yukleniyor: true });
    const [alarms, setAlarms] = useState(/** @type {any[]} */([]));
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [ping, setPing] = useState(/** @type {number|null} */(null));

    const [commandText, setCommandText] = useState('');
    const [aiSorgu, setAiSorgu] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [simulasyon, setSimulasyon] = useState(0);

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const hizliGorevAtama = async () => {
        try {
            komutSchema.parse({ komut: commandText });
            goster(`Görev alındı: ${commandText}`);
            setCommandText('');
        } catch (error) {
            goster(error.errors[0].message, 'error');
        }
    };

    const [aiSonuc, setAiSonuc] = useState('');

    const aiAnalizBaslat = async () => {
        if (!aiSorgu.trim()) return goster('Sorgu boş olamaz.', 'error');
        setIsAiLoading(true);
        setAiSonuc('');
        try {
            const res = await fetch('/api/ajan-calistir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sorgu_metni: aiSorgu.trim() }),
            });
            const data = await res.json();
            if (data?.basarili && data?.sonuc?.ozet) {
                setAiSonuc(data.sonuc.ozet);
                goster('AI analizi tamamlandı.', 'success');
            } else {
                goster('AI yanıt veremedi: ' + (data?.error || 'Sunucu hatası'), 'error');
            }
        } catch (err) {
            goster('AI bağlantı hatası: ' + err.message, 'error');
        } finally {
            setIsAiLoading(false);
            setAiSorgu('');
        }
    };

    const ALARM_AKTIF = process.env.NEXT_PUBLIC_ALARM_AKTIF === 'true';

    const veriCek = useCallback(async () => {
        setStats(prev => ({ ...prev, yukleniyor: true }));
        const t0 = performance.now();
        try {
            const bugun = new Date();
            bugun.setHours(0, 0, 0, 0);
            const bugunISO = bugun.toISOString();

            // Kasa: ciro
            const { data: kasaData } = await supabase
                .from('b2_kasa_hareketleri')
                .select('tutar_tl, hareket_tipi')
                .gte('created_at', bugunISO);

            const ciro = (kasaData || [])
                .filter(h => h.hareket_tipi === 'gelir')
                .reduce((t, h) => t + parseFloat(h.tutar_tl || 0), 0);

            // Maliyetler — gerçek kolon: maliyet_tipi
            const { data: maliyetData } = await supabase
                .from('b1_maliyet_kayitlari')
                .select('tutar_tl, maliyet_tipi')
                .gte('created_at', bugunISO);

            const maliyet = (maliyetData || []).reduce((t, m) => t + parseFloat(m.tutar_tl || 0), 0);
            const personel = (maliyetData || []).filter(m => m.maliyet_tipi === 'personel_iscilik').reduce((t, m) => t + parseFloat(m.tutar_tl || 0), 0);

            // Alarmlar — sadece ALARM_AKTIF=true ise sorgula (b1_sistem_uyarilari tablosu gerekir)
            let alarmlar = [];
            if (ALARM_AKTIF) {
                try {
                    const { data: alarmData } = await supabase
                        .from('b1_sistem_uyarilari')
                        .select('id, baslik, aciklama, oncelik, tahmini_zarar_tl, kok_neden')
                        .eq('durum', 'aktif')
                        .order('olusturma', { ascending: false })
                        .limit(10);
                    alarmlar = (alarmData || []).map(a => ({
                        id: a.id,
                        text: a.baslik || a.aciklama || 'Uyarı',
                        tip: a.oncelik === 'kritik' ? 'kirmizi' : 'sari',
                        zarar: parseFloat(a.tahmini_zarar_tl || 0),
                        neden: a.kok_neden || 'Analiz bekleniyor.'
                    }));
                } catch { /* tablo yok — sessiz */ }
            }

            setPing(Math.round(performance.now() - t0));
            setStats({ ciro, maliyet, personel, fire: 0, yukleniyor: false });
            setAlarms(alarmlar);
        } catch {
            setStats(prev => ({ ...prev, yukleniyor: false }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ALARM_AKTIF]);



    useEffect(() => {
        veriCek();
        const kanal = supabase.channel('karargah-realtime')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => veriCek())
            .subscribe();
        return () => { supabase.removeChannel(kanal); };
    }, [veriCek]);

    return {
        stats, alarms, ping,
        commandText, setCommandText, hizliGorevAtama,
        aiSorgu, setAiSorgu, isAiLoading, aiAnalizBaslat, aiSonuc,
        simulasyon, setSimulasyon,
        mesaj
    };
}
