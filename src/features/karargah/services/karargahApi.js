/**
 * features/karargah/services/karargahApi.js
 * MİZANET SİBER KARARGAH — VERİ ZIRHI VE OTONOM SENKRONİZASYON
 */
import { supabase } from '@/lib/supabase';
import { idb } from '@/lib/idbKalkan';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export const karargahVerileriniGetir = async (timeoutPromise, alarmAktif, mesajAktif, botAktif) => {
    // 1. Önce IDB (Local DB) üzerinden anında (0ms) verileri çekiyoruz
    const localZirh = await idb.getAllWithLimit('m0_karargah', 1, 0);

    // 2. Arka planda otonom çalışan senkronizasyon (Supabase Async)
    const otonomSync = async () => {
        const simdi = Date.now();
        const bas_ay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const gun45Once = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();

        // DEVASA ASENKRON SİMETRİ! 13 Paralel İstek.
        let results = [];
        try {
            results = await Promise.race([Promise.allSettled([
                fetch('/api/kasa-ozet', { cache: 'no-store' }).then(r => r.json()), // 0
                supabase.from('b1_personel').select('saatlik_ucret_tl').eq('durum', 'aktif'), // 1
                supabase.from('b1_maliyet_kayitlari').select('tutar_tl').eq('maliyet_tipi', 'fire_kaybi').gte('created_at', bas_ay), // 2
                supabase.from('b1_maliyet_kayitlari').select('tutar_tl').gte('created_at', bas_ay), // 3
                supabase.from('b2_siparisler').select('id', { count: 'exact', head: true }).eq('durum', 'beklemede'), // 4
                supabase.from('production_orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress', 'in_production']), // 5
                supabase.from('b2_urun_katalogu').select('id', { count: 'exact', head: true }).lte('stok_adeti', 10).eq('durum', 'aktif'), // 6
                supabase.from('b1_agent_loglari').select('*').order('created_at', { ascending: false }).limit(5), // 7
                supabase.from('b1_arge_trendler').select('durum, talep_skoru, baslik, artis_yuzdesi').limit(100), // 8
                alarmAktif ? supabase.from('b1_sistem_uyarilari').select('id, mesaj, uyari_tipi, olusturma, neden, potansiyel_zarar').order('olusturma', { ascending: false }).limit(10) : Promise.resolve({ data: [] }), // 9
                mesajAktif ? supabase.from('b1_ic_mesajlar').select('id', { count: 'exact', head: true }).is('okundu_at', null) : Promise.resolve({ count: 0 }), // 10
                mesajAktif ? supabase.from('b1_ic_mesajlar').select('id, konu, oncelik, gonderen_adi, created_at, urun_id').order('created_at', { ascending: false }).limit(3) : Promise.resolve({ data: [] }), // 11
                botAktif ? supabase.from('b1_agent_loglari').select('ajan_adi, islem_tipi, mesaj, sonuc, created_at').eq('ajan_adi', 'NİZAMBOT').order('created_at', { ascending: false }).limit(8) : Promise.resolve({ data: [] }), // 12
                mesajAktif ? supabase.from('b1_mesaj_gizli').select('mesaj_id, kullanici_adi, gizlendi_at, b1_ic_mesajlar(konu, oncelik, urun_id, urun_kodu, gonderen_adi, gonderen_modul)').gte('gizlendi_at', gun45Once).order('gizlendi_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }) // 13
            ]), timeoutPromise]);
        } catch (error) {
            console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ]', error);
            // Zaman aşımına uğrarsa IDB'den gelen veya boş döner
            return { data: null };
        }

        const [
            ciroMaliyetRes, personelRes, fireRes, toplamMaliyetRes, siparisRes, uretimRes,
            stokRes, agentLogRes, argeTrendRes, alarmRes, mesajCountRes, sonMesajRes, botLogRes, gizliMesajRes
        ] = results;

        const ext = (res) => res?.status === 'fulfilled' ? res.value : null;
        const extData = (res) => res?.status === 'fulfilled' ? res.value.data : [];
        const extCount = (res) => res?.status === 'fulfilled' ? res.value.count || 0 : 0;

        // ── Kasa ve Maliyet Hesapları ──
        const apiCiroData = ext(ciroMaliyetRes) || {};
        const ciro = apiCiroData.ciro || 0;
        const maliyet = apiCiroData.maliyet || 0;

        const pData = extData(personelRes);
        const personelGiderTahmini = pData ? pData.reduce((sum, p) => sum + ((parseFloat(p.saatlik_ucret_tl) || 0) * 240), 0) : 0;

        const fT = extData(fireRes)?.reduce((s, m) => s + (parseFloat(m.tutar_tl) || 0), 0) || 0;
        const topM = extData(toplamMaliyetRes)?.reduce((s, m) => s + (parseFloat(m.tutar_tl) || 0), 0) || 0;
        const fireYuzde = topM > 0 ? parseFloat((fT / topM * 100).toFixed(1)) : 0;

        const bekleyenSipSayisi = extCount(siparisRes);
        const aktifUretimSayisi = extCount(uretimRes);
        const stokAlarmSayisi = extCount(stokRes);

        const statsFinal = { ciro, ciroArtis: 12, maliyet, personel: personelGiderTahmini, fire: fireYuzde, bekleyenSiparis: bekleyenSipSayisi, aktifUretim: aktifUretimSayisi, stokAlarm: stokAlarmSayisi, yukleniyor: false };

        // ── Ajan ve Trend ──
        const logData = extData(agentLogRes) || [];
        const aiOutputsFinal = (logData.length > 0) ? logData.map(l => {
            let mTur = 'dikkat';
            if (l.sonuc === 'basarisiz' || l.islem_tipi === 'HATA_PANIGI' || l.islem_tipi?.includes('RAKİP')) mTur = 'hata';
            else if (l.sonuc === 'basarili' || l.islem_tipi?.includes('TARAMA')) mTur = 'trend';
            return { mesaj: l.mesaj || 'İşlem detaylandırılmadı.', ajan: l.ajan_adi || 'Saha Ajanı', tur: mTur };
        }) : [{ mesaj: 'Sahadan henüz sinyal yok. Ajanlar uykuda...', ajan: 'Sistem', tur: 'dikkat' }];

        // ── Haberleşme ──
        const mesajSayisiFinal = extCount(mesajCountRes);
        const sonMesajlarFinal = extData(sonMesajRes) || [];
        const izlerRAW = extData(gizliMesajRes) || [];
        const gizlenIzleriFinal = izlerRAW.filter(g => { const b1 = Array.isArray(g.b1_ic_mesajlar) ? g.b1_ic_mesajlar[0] : g.b1_ic_mesajlar; return !(b1?.urun_id); });

        // ── Alarmlar ──
        const uyarilar = extData(alarmRes) || [];
        const alarmsFinal = uyarilar.map(u => ({ id: u.id, text: u.mesaj || 'Sistem uyarısı', neden: u.neden || 'Detay mevcut değil.', zarar: u.potansiyel_zarar || 0, tip: u.uyari_tipi || 'uyari' }));

        // ── NizamBot ──
        const botLoglarFinal = extData(botLogRes) || [];

        const paket = {
            id: 'ana_veriler',
            stats: statsFinal,
            aiOutputs: aiOutputsFinal,
            mesajSayisi: mesajSayisiFinal,
            sonMesajlar: sonMesajlarFinal,
            gizlenIzleri: gizlenIzleriFinal,
            alarms: alarmsFinal,
            botLoglar: botLoglarFinal,
            guncellenme_ts: simdi
        };

        await idb.bulkUpsert('m0_karargah', [paket]);
        return { data: paket, gecikme: Math.round(Date.now() - simdi) };
    };

    if (!localZirh || localZirh.length === 0) {
        return await otonomSync();
    } else {
        otonomSync(); // Arkada asenkron bırak
        return { data: localZirh[0], isCached: true };
    }
};



export const karargahAjanGonder = async (veri) => {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_ajan_gorevler', 'INSERT', veri);
        return { offline: true };
    }
    const { error } = await supabase.from('b1_ajan_gorevler').insert([veri]);
    if (error) throw error;
    return { offline: false };
};
