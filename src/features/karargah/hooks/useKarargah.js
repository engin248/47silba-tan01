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

    const veriCek = useCallback(async () => {
        setStats(prev => ({ ...prev, yukleniyor: true }));
        const t0 = performance.now();
        try {
            const bugun = new Date();
            bugun.setHours(0, 0, 0, 0);
            const bugunISO = bugun.toISOString();

            // Bugünkü kasa: ciro = gelir toplamı
            const { data: kasaData } = await supabase
                .from('b2_kasa_hareketleri')
                .select('tutar_tl, hareket_tipi')
                .gte('created_at', bugunISO);

            const ciro = (kasaData || [])
                .filter(h => h.hareket_tipi === 'gelir')
                .reduce((t, h) => t + parseFloat(h.tutar_tl || 0), 0);

            // Bugünkü maliyetler
            const { data: maliyetData } = await supabase
                .from('b1_maliyet_kayitlari')
                .select('tutar_tl, maliyet_tipi')
                .gte('created_at', bugunISO);

            const maliyet = (maliyetData || [])
                .reduce((t, m) => t + parseFloat(m.tutar_tl || 0), 0);

            const personel = (maliyetData || [])
                .filter(m => m.maliyet_tipi === 'personel_iscilik')
                .reduce((t, m) => t + parseFloat(m.tutar_tl || 0), 0);

            // Aktif sistem uyarıları
            const { data: alarmData } = await supabase
                .from('b1_sistem_uyarilari')
                .select('id, uyari_tipi, seviye, baslik, mesaj, created_at')
                .eq('durum', 'aktif')
                .order('created_at', { ascending: false })
                .limit(10);

            const alarmlar = (alarmData || []).map(a => ({
                id: a.id,
                text: a.baslik || a.uyari_tipi || 'Sistem Uyarısı', // baslik eklendi daha iyi görünüm için
                tip: a.seviye === 'krt' ? 'kirmizi' : 'sari', // seviye krt, yk, or vs.
                zarar: 0,
                neden: a.mesaj || 'Analiz bekleniyor.'
            }));

            setPing(Math.round(performance.now() - t0));
            setStats({ ciro, maliyet, personel, fire: 0, yukleniyor: false });
            setAlarms(alarmlar);
        } catch (err) {
            console.error('Karargah veri hatası:', err);
            setStats(prev => ({ ...prev, yukleniyor: false }));
        }
    }, []);

    useEffect(() => {
        veriCek();
        // Sadece ilgili tablolarda değişiklik olunca yenile (tüm DB değil)
        const kanal = supabase.channel('karargah-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_kasa_hareketleri' }, () => { if (!document.hidden) veriCek(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_sistem_uyarilari' }, () => { if (!document.hidden) veriCek(); })
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
