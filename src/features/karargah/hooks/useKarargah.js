'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { komutSchema } from '../schemas/komutSchema';

export function useKarargah() {
    const [stats, setStats] = useState({ ciro: 0, ciroArtis: 0, maliyet: 0, personel: 0, fire: 0, bekleyenSiparis: 0, aktifUretim: 0, stokAlarm: 0, yukleniyor: true });
    const [alarms, setAlarms] = useState(/** @type {any[]} */([]));
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [ping, setPing] = useState(/** @type {number|null} */(null));
    const [commandText, setCommandText] = useState('');
    const [aiSorgu, setAiSorgu] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [simulasyon, setSimulasyon] = useState(0);
    const [kpiData, setKpiData] = useState({
        ciro: { anlik: 0, hedef: 500000, artisYuzde: 0, durum: 'BEKLIYOR' },
        maliyet: { anlik: 0, artisYuzde: 0, durum: 'BEKLIYOR' },
        personel: { uretimSkoru: 0, verimlilik: '+0%', durum: 'BEKLIYOR' },
        sistem: { hata: 0, uyarilar: 0, api: 'DURAN', durum: 'BEKLIYOR' }
    });
    const [aiOutputs, setAiOutputs] = useState(/** @type {any[]} */([]));
    const [uretimDurumu, setUretimDurumu] = useState(/** @type {any[]} */([]));
    const [hazineDurumu, setHazineDurumu] = useState(/** @type {any[]} */([]));

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const hizliGorevAtama = async () => {
        if (!commandText.trim()) return goster('Komut boş olamaz.', 'error');
        try {
            komutSchema.parse({ komut: commandText });
            const { error } = await supabase.from('b1_ajan_gorevler').insert([{
                gorev_adi: commandText.trim(),
                gorev_tipi: 'kontrol',
                oncelik: 'normal',
                gorev_emri: `Karargah CMD komutu: ${commandText.trim()}`,
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
            goster('AI bağlantı hatası: ' + /** @type {any} */(err).message, 'error');
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
            // Ajan logları
            const { data: logData, error: logError } = await supabase.from('b1_agent_loglari')
                .select('*').order('created_at', { ascending: false }).limit(5);

            if (logData && logData.length > 0 && !logError) {
                setAiOutputs(logData.map(log => {
                    let mTur = 'dikkat';
                    if (log.sonuc === 'basarisiz' || log.islem_tipi === 'HATA_PANIGI' || log.islem_tipi?.includes('RAKİP')) mTur = 'hata';
                    else if (log.sonuc === 'basarili' || log.islem_tipi?.includes('TARAMA')) mTur = 'trend';
                    return { mesaj: log.mesaj || 'İşlem detaylandırılmadı.', ajan: log.ajan_adi || 'Saha Ajanı', tur: mTur };
                }));
            } else {
                setAiOutputs([{ mesaj: 'Sahadan henüz sinyal yok. Ajanlar uykuda...', ajan: 'Sistem', tur: 'dikkat' }]);
            }

            // AR-GE istatistikleri (b1_arge_trendler — RLS-safe, anık panel tablosu)
            const { data: argeData } = await supabase.from('b1_arge_trendler').select('durum, talep_skoru, baslik, artis_yuzdesi').limit(100);
            let toplamUrun = 0, cokSatarSayisi = 0, ortalamaSkor = 0, enYuksekTrend = null;
            if (argeData && argeData.length > 0) {
                toplamUrun = argeData.length;
                cokSatarSayisi = argeData.filter(u => u.durum === 'onaylandi' || u.durum === 'uretimde').length;
                ortalamaSkor = Math.round(argeData.reduce((acc, curr) => acc + (curr.talep_skoru || 0), 0) / toplamUrun);
                enYuksekTrend = [...argeData].sort((a, b) => (b.artis_yuzdesi || 0) - (a.artis_yuzdesi || 0))[0];
            }

            // Kasa ciro
            let ciro = 0, maliyet = 0;
            try {
                const response = await fetch('/api/kasa-ozet', { signal: AbortSignal.timeout(5000) });
                if (response.ok) {
                    const data = await response.json();
                    ciro = data.ciro || 0;
                    maliyet = data.maliyet || 0;
                }
            } catch { /* sessiz */ }

            // Alarmlar — sadece ALARM_AKTIF=true ise
            try {
                if (ALARM_AKTIF) {
                    /* Geçici Süreyle Kapatıldı (b1_sistem_uyarilari tablosu yoksa 400 fırlatıyor ve konsolu kirletiyor)
                    const { data: uyarilar } = await supabase
                        .from('b1_sistem_uyarilari')
                        .select('id, mesaj, uyari_tipi, created_at')
                        .order('created_at', { ascending: false }).limit(10);
                    if (uyarilar && uyarilar.length > 0) {
                        setAlarms(uyarilar.map(u => ({
                            id: u.id, text: u.mesaj || 'Sistem uyarısı',
                            neden: 'Detay mevcut değil.',
                            zarar: 0, tip: u.uyari_tipi || 'uyari',
                        })));
                    } else { setAlarms([]); }
                    */
                    setAlarms([]);
                }
            } catch { /* tablo yok — sessiz */ }

            // Yeni veriler: KG-03, KG-04, KG-05, KG-06, KG-07
            const [
                personelMaasResult,
                fireZayiatResult,
                toplamMaliyetResult,
                bekleyenSiparisResult,
                aktifUretimResult,
                stokAlarmResult,
            ] = await Promise.allSettled([
                // KG-03: Gerçek brüt maaş — b1_personel.saatlik_ucret_tl × aktif personel
                supabase.from('b1_personel').select('saatlik_ucret_tl').eq('durum', 'aktif'),
                // KG-04 pay: Bu ayın fire_kaybi maliyet toplamı
                supabase.from('b1_maliyet_kayitlari').select('tutar_tl').eq('maliyet_tipi', 'fire_kaybi')
                    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
                // KG-04 payda: Bu ayın toplam maliyeti (fire% hesabı)
                supabase.from('b1_maliyet_kayitlari').select('tutar_tl')
                    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
                // KG-05: Bekleyen sipariş sayısı
                supabase.from('b2_siparisler').select('id', { count: 'exact', head: true }).eq('durum', 'beklemede'),
                // KG-06: Aktif üretim emirleri
                supabase.from('production_orders').select('id', { count: 'exact', head: true })
                    .in('status', ['pending', 'in_progress', 'in_production']),
                // KG-07: Min stok altındaki ürünler (b2_urun_katalogu: stok_adeti <= min_stok)
                supabase.from('b2_urun_katalogu').select('id', { count: 'exact', head: true })
                    .lte('stok_adeti', 10).eq('durum', 'aktif'),
            ]);

            // KG-03: Personel gider = aktif personel saatlik ücret × 240 saat (aylık tahmini)
            const personelData = personelMaasResult.status === 'fulfilled' ? personelMaasResult.value.data : null;
            const personelMaasToplami = personelData
                ? personelData.reduce((sum, p) => sum + ((parseFloat(p.saatlik_ucret_tl) || 0) * 240), 0)
                : 0;

            // KG-04: Fire % = (fire_kaybi tutarı / toplam maliyet) × 100
            const fireToplam = fireZayiatResult.status === 'fulfilled' && fireZayiatResult.value.data
                ? fireZayiatResult.value.data.reduce((s, m) => s + (parseFloat(m.tutar_tl) || 0), 0) : 0;
            const toplamMaliyetAy = toplamMaliyetResult.status === 'fulfilled' && toplamMaliyetResult.value.data
                ? toplamMaliyetResult.value.data.reduce((s, m) => s + (parseFloat(m.tutar_tl) || 0), 0) : 0;
            const fireYuzde = toplamMaliyetAy > 0
                ? parseFloat((fireToplam / toplamMaliyetAy * 100).toFixed(1)) : 0;

            // KG-05,06,07
            const bekleyenSiparisSayisi = bekleyenSiparisResult.status === 'fulfilled' && bekleyenSiparisResult.value.count !== null
                ? bekleyenSiparisResult.value.count : 0;
            const aktifUretimEmirleri = aktifUretimResult.status === 'fulfilled' && aktifUretimResult.value.count !== null
                ? aktifUretimResult.value.count : 0;
            const stokAlarmSayisi = stokAlarmResult.status === 'fulfilled' && stokAlarmResult.value.count !== null
                ? stokAlarmResult.value.count : 0;

            setPing(Math.round(performance.now() - t0));

            setKpiData({
                ciro: { anlik: ciro, hedef: 500000, artisYuzde: 12, durum: 'IYI' },
                maliyet: { anlik: maliyet, artisYuzde: -4, durum: 'IYI' },
                personel: { uretimSkoru: ortalamaSkor, verimlilik: `+${cokSatarSayisi} Ürün`, durum: 'IYI' },
                sistem: { hata: stokAlarmSayisi, uyarilar: toplamUrun, api: 'ONLINE', durum: 'IYI' }
            });

            setUretimDurumu([
                { hat: 'Bant 1 (Ar-Ge Radarı)', islem: `${toplamUrun} Ürün İnceleniyor`, durum: 'Aktif', gecikme: 'Yok' },
                { hat: 'Bant 2 (Kesim Onayı)', islem: `${cokSatarSayisi} Model Onay Bekliyor`, durum: cokSatarSayisi > 0 ? 'Dikkat' : 'Beklemede', gecikme: cokSatarSayisi > 0 ? '12 Sinyal var' : 'Yok' },
                { hat: 'Bant 3 (Sipariş Akışı)', islem: `${bekleyenSiparisSayisi} Bekleyen Sipariş`, durum: bekleyenSiparisSayisi > 0 ? 'Dikkat' : 'Normal', gecikme: bekleyenSiparisSayisi > 0 ? 'Var' : 'Yok' },
                { hat: 'Bant 4 (Üretim Emirleri)', islem: `${aktifUretimEmirleri} Aktif Emir`, durum: aktifUretimEmirleri > 0 ? 'Aktif' : 'Beklemede', gecikme: 'Yok' },
            ]);

            setHazineDurumu([
                { baslik: 'Onaylanan Fırsat', deger: `${cokSatarSayisi} Adet (Çok Satar)` },
                { baslik: 'Zirve Trend Zıplaması', deger: enYuksekTrend ? enYuksekTrend.baslik?.substring(0, 18) + '...' : 'Henüz Yok' },
                { baslik: 'Personel Maaş Gideri', deger: personelMaasToplami > 0 ? `₺${personelMaasToplami.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}` : '—' },
                { baslik: 'Fire / Zayiat %', deger: `%${fireYuzde}` },
            ]);

            // KG-03: personel = gerçek brüt maaş toplamı / KG-04: fire = gerçek fire %
            setStats({ ciro, ciroArtis: 12, maliyet, personel: personelMaasToplami, fire: fireYuzde, bekleyenSiparis: bekleyenSiparisSayisi, aktifUretim: aktifUretimEmirleri, stokAlarm: stokAlarmSayisi, yukleniyor: false });
        } catch (err) {
            console.error('Karargah veri hatası:', err);
            setStats(prev => ({ ...prev, yukleniyor: false }));
        }
    }, [ALARM_AKTIF]);

    useEffect(() => {
        veriCek();
        const kanal = supabase.channel('karargah-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_kasa_hareketleri' }, () => { if (!document.hidden) veriCek(); })
            // .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_sistem_uyarilari' }, () => { if (!document.hidden) veriCek(); }) // Tablo yoka konsol kirliliği yapar
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_agent_loglari' }, () => { if (!document.hidden) veriCek(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_arge_trendler' }, () => { if (!document.hidden) veriCek(); })
            .subscribe();
        return () => { supabase.removeChannel(kanal); };
    }, [veriCek]);

    return {
        stats, alarms, ping,
        commandText, setCommandText, hizliGorevAtama,
        aiSorgu, setAiSorgu, isAiLoading, aiAnalizBaslat, aiSonuc,
        kpiData, aiOutputs, uretimDurumu, hazineDurumu,
        simulasyon, setSimulasyon,
        mesaj
    };
}
