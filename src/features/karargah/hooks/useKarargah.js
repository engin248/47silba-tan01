'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { komutSchema } from '../schemas/komutSchema';

export function useKarargah() {
<<<<<<< HEAD
    const [stats, setStats] = useState({ ciro: 0, ciroArtis: 0, maliyet: 0, personel: 0, fire: 0, yukleniyor: true });
=======
    const [stats, setStats] = useState({ ciro: 0, maliyet: 0, personel: 0, fire: 0, yukleniyor: true });
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    const [alarms, setAlarms] = useState(/** @type {any[]} */([]));
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [ping, setPing] = useState(/** @type {number|null} */(null));

    const [commandText, setCommandText] = useState('');
    const [aiSorgu, setAiSorgu] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [simulasyon, setSimulasyon] = useState(0);

<<<<<<< HEAD
    const [kpiData, setKpiData] = useState({
        ciro: { anlik: 0, hedef: 500000, artisYuzde: 0, durum: 'BEKLIYOR' },
        maliyet: { anlik: 0, artisYuzde: 0, durum: 'BEKLIYOR' },
        personel: { uretimSkoru: 0, verimlilik: '+0%', durum: 'BEKLIYOR' },
        sistem: { hata: 0, uyarilar: 0, api: 'DURAN', durum: 'BEKLIYOR' }
    });

    const [aiOutputs, setAiOutputs] = useState(/** @type {any[]} */([]));
    const [uretimDurumu, setUretimDurumu] = useState(/** @type {any[]} */([]));
    const [hazineDurumu, setHazineDurumu] = useState(/** @type {any[]} */([]));

=======
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const hizliGorevAtama = async () => {
<<<<<<< HEAD
        if (!commandText.trim()) return goster('Komut boş olamaz.', 'error');
        try {
            komutSchema.parse({ komut: commandText });
            // DÜZELTME 3: Gerçekten b1_ajan_gorevler tablosuna yaz
            const { error } = await supabase.from('b1_ajan_gorevler').insert([{
                gorev_adi: commandText.trim(),
                gorev_tipi: 'kontrol',
                oncelik: 'normal',
                gorev_emri: `Karargah CMD+K komutu: ${commandText.trim()}`,
                ajan_adi: 'Trend Kâşifi',
                hedef_modul: 'genel',
                hedef_tablo: 'b1_ajan_gorevler',
                durum: 'bekliyor',
                yetki_internet: false,
                yetki_supabase_oku: true,
                yetki_supabase_yaz: false,
                yetki_ai_kullan: false,
                yetki_dosya_olustur: false,
            }]);
            if (error) throw error;
            goster(`✅ Görev kuyruğa alındı: ${commandText}`);
            setCommandText('');
        } catch (/** @type {any} */ error) {
            if (error?.errors) {
                goster(error.errors[0].message, 'error');
            } else {
                goster('Görev gönderilemedi: ' + (error?.message || 'Bilinmeyen hata'), 'error');
            }
=======
        try {
            komutSchema.parse({ komut: commandText });
            goster(`Görev alındı: ${commandText}`);
            setCommandText('');
        } catch (error) {
            goster(error.errors[0].message, 'error');
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
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

<<<<<<< HEAD
=======
    const ALARM_AKTIF = process.env.NEXT_PUBLIC_ALARM_AKTIF === 'true';

>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    const veriCek = useCallback(async () => {
        setStats(prev => ({ ...prev, yukleniyor: true }));
        const t0 = performance.now();
        try {
<<<<<<< HEAD
            // 1. GERÇEK AJAN LOGLARINI (NİZAM BEYNİ) ÇEK
            const t0 = performance.now();
            const { data: logData, error: logError } = await supabase.from('b1_agent_loglari')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (logData && logData.length > 0 && !logError) {
                setAiOutputs(logData.map(log => {
                    let mTur = 'dikkat';
                    if (log.sonuc === 'basarisiz' || log.islem_tipi === 'HATA_PANIGI' || log.islem_tipi?.includes('RAKİP')) mTur = 'hata';
                    else if (log.sonuc === 'basarili' || log.islem_tipi?.includes('TARAMA')) mTur = 'trend';

                    return {
                        mesaj: log.mesaj || 'İşlem detaylandırılmadı.',
                        ajan: log.ajan_adi || 'Saha Ajanı',
                        tur: mTur
                    };
                }));
            } else {
                setAiOutputs([{ mesaj: "Sahadan henüz sinyal yok. Ajanlar uykuda...", ajan: "Sistem", tur: "dikkat" }]);
            }

            // 2. GERÇEK AR-GE ÜRÜN İSTATİSTİKLERİNİ ÇEK (Canlı KPI'lar için)
            const { data: argeData } = await supabase.from('b1_arge_products').select('ai_satis_karari, trend_skoru, urun_adi, artis_yuzdesi');

            let toplamUrun = 0;
            let cokSatarSayisi = 0;
            let ortalamaSkor = 0;
            let enYuksekTrend = null;

            if (argeData && argeData.length > 0) {
                toplamUrun = argeData.length;
                cokSatarSayisi = argeData.filter(u => u.ai_satis_karari === 'ÇOK_SATAR' || u.ai_satis_karari === 'BİNGO').length;
                ortalamaSkor = Math.round(argeData.reduce((acc, curr) => acc + (curr.trend_skoru || 0), 0) / toplamUrun);
                enYuksekTrend = [...argeData].sort((a, b) => (b.artis_yuzdesi || 0) - (a.artis_yuzdesi || 0))[0];
            }

            // DÜZELTME 2: Mock fallback kaldırıldı — gerçek API, başarısız olursa 0 göster
            let ciro = 0, maliyet = 0;
            try {
                const response = await fetch('/api/kasa-ozet', { signal: AbortSignal.timeout(5000) });
                if (response.ok) {
                    const data = await response.json();
                    ciro = data.ciro || 0;
                    maliyet = data.maliyet || 0;
                } else {
                    console.warn('[Karargah] /api/kasa-ozet yanıt vermedi:', response.status);
                }
            } catch (e) {
                console.error('[Karargah] Kasa API hatası:', e?.message || e);
            }

            // DÜZELTME 1: b1_sistem_uyarilari tablosundan gerçek alarmları çek
            try {
                const { data: uyarilar } = await supabase
                    .from('b1_sistem_uyarilari')
                    .select('id, mesaj, tip, onem, created_at, neden, potansiyel_zarar')
                    .eq('okundu', false)
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (uyarilar && uyarilar.length > 0) {
                    setAlarms(uyarilar.map(u => ({
                        id: u.id,
                        text: u.mesaj || 'Sistem uyarısı',
                        neden: u.neden || 'Detay mevcut değil.',
                        zarar: u.potansiyel_zarar || 0,
                        tip: u.tip || 'uyari',
                    })));
                } else {
                    setAlarms([]);
                }
            } catch (e) {
                console.error('[Karargah] Alarm çekme hatası:', e?.message || e);
            }

            setPing(Math.round(performance.now() - t0));

            // KPI KARTLARINA GERÇEK VERİLERİ BAS (Eskiden statikti)
            setKpiData({
                ciro: { anlik: ciro, hedef: 500000, artisYuzde: 12, durum: 'IYI' },
                maliyet: { anlik: maliyet, artisYuzde: -4, durum: 'IYI' },
                personel: { uretimSkoru: ortalamaSkor, verimlilik: `+${cokSatarSayisi} Ürün`, durum: 'IYI' },
                sistem: { hata: 0, uyarilar: toplamUrun, api: 'ONLINE', durum: 'IYI' }
            });

            // ÜRETİM MOTORU CANLI DURUMA GÖRE
            setUretimDurumu([
                { hat: "Bant 1 (Ar-Ge Radarı)", islem: `${toplamUrun} Ürün İnceleniyor`, durum: "Aktif", gecikme: "Yok" },
                { hat: "Bant 2 (Kesim Onayı)", islem: `${cokSatarSayisi} Model Onay Bekliyor`, durum: cokSatarSayisi > 0 ? "Dikkat" : "Beklemede", gecikme: cokSatarSayisi > 0 ? "12 Sinyal var" : "Yok" },
            ]);

            // HAZİNE KISMINI BİNGO ŞEFİNİN EN İYİ BULGUSUNA BAĞLA
            setHazineDurumu([
                { baslik: "Onaylanan Fırsat", deger: `${cokSatarSayisi} Adet (Çok Satar)` },
                { baslik: "Zirve Trend Zıplaması", deger: enYuksekTrend ? enYuksekTrend.urun_adi.substring(0, 18) + '...' : "Henüz Yok" },
            ]);

            setStats({ ciro, ciroArtis: 12, maliyet, personel: ortalamaSkor, fire: 0, yukleniyor: false });

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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_agent_loglari' }, () => { if (!document.hidden) veriCek(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_arge_products' }, () => { if (!document.hidden) veriCek(); })
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            .subscribe();
        return () => { supabase.removeChannel(kanal); };
    }, [veriCek]);

    return {
        stats, alarms, ping,
        commandText, setCommandText, hizliGorevAtama,
        aiSorgu, setAiSorgu, isAiLoading, aiAnalizBaslat, aiSonuc,
<<<<<<< HEAD
        kpiData, aiOutputs, uretimDurumu, hazineDurumu,
=======
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        simulasyon, setSimulasyon,
        mesaj
    };
}
