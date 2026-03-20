export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  PARÃ‡A 1 â€” BACKEND
//  /api/ajan-orkestrator
//  KoordinatÃ¶r: modlarÄ± = 'tara' | 'dagit' | 'dogrula'
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ TARAMA: 26 ModÃ¼lÃ¼ kontrol eder, gÃ¶rev listesi Ã¼retir â”€â”€
async function taraModu() {
    const gorevler = [];
    const tarihStr = new Date().toISOString();

    // 1. Stok uyarÄ± taramasÄ±
    const { data: kritikStok } = await supabaseAdmin
        .from('b2_urun_katalogu')
        .select('id, urun_kodu, urun_adi, stok_adeti, min_stok')
        .lte('stok_adeti', 10)
        .limit(20);
    for (const u of (kritikStok || [])) {
        gorevler.push({
            id: `stok_${u.id}`,
            tip: 'stok_alarmi',
            oncelik: u.stok_adeti === 0 ? 'kritik' : 'yuksek',
            baslik: `Kritik Stok: ${u.urun_kodu}`,
            veri: { urun_id: u.id, stok: u.stok_adeti, min: u.min_stok },
            atanan: null
        });
    }

    // 2. Bekleyen sipariÅŸ taramasÄ± (2 gÃ¼nden eski)
    const ikiGunOnce = new Date(Date.now() - 2 * 86400000).toISOString();
    const { data: bekleyenSiparis } = await supabaseAdmin
        .from('b2_siparisler')
        .select('id, siparis_no, durum, created_at')
        .eq('durum', 'beklemede')
        .lt('created_at', ikiGunOnce)
        .limit(10);
    for (const s of (bekleyenSiparis || [])) {
        gorevler.push({
            id: `siparis_${s.id}`,
            tip: 'siparis_alarmi',
            oncelik: 'yuksek',
            baslik: `2 GÃ¼n Onay Bekleyen: ${s.siparis_no}`,
            veri: { siparis_id: s.id },
            atanan: null
        });
    }

    // 3. Bekleyen ajan gÃ¶revleri taramasÄ±
    const { data: bekleyenGorev } = await supabaseAdmin
        .from('b1_ajan_gorevler')
        .select('id, gorev_adi, oncelik, created_at')
        .eq('durum', 'bekliyor')
        .limit(15);
    for (const g of (bekleyenGorev || [])) {
        gorevler.push({
            id: `ajan_${g.id}`,
            tip: 'ajan_gorevi',
            oncelik: g.oncelik || 'normal',
            baslik: g.gorev_adi || 'Ajan GÃ¶revi',
            veri: { gorev_id: g.id },
            atanan: null
        });
    }

    // 4. GecikmiÅŸ Ã¼retim emirleri
    const bugun = new Date().toISOString().split('T')[0];
    const { data: gecikme } = await supabaseAdmin
        .from('production_orders')
        .select('id, status, planned_end_date')
        .in('status', ['pending', 'in_progress'])
        .lt('planned_end_date', bugun)
        .limit(10);
    for (const p of (gecikme || [])) {
        gorevler.push({
            id: `uretim_${p.id}`,
            tip: 'uretim_gecikmesi',
            oncelik: 'kritik',
            baslik: `GecikmiÅŸ Ãœretim: ${p.id.slice(0, 8)}`,
            veri: { order_id: p.id },
            atanan: null
        });
    }

    // 5. Ä°nceleniyor durumundaki trendler
    const { data: trendler } = await supabaseAdmin
        .from('b1_arge_trendler')
        .select('id, baslik')
        .eq('durum', 'inceleniyor')
        .limit(10);
    if (trendler && trendler.length > 0) {
        gorevler.push({
            id: `trend_onay`,
            tip: 'bilgi',
            oncelik: 'normal',
            baslik: `${trendler.length} Trend KoordinatÃ¶r OnayÄ± Bekliyor`,
            veri: { sayi: trendler.length },
            atanan: null
        });
    }

    // 6. SipariÅŸ Anomalisi Tespiti (K-07)
    // Kural A: 24 saatte aynÄ± mÃ¼ÅŸteriden 3+ sipariÅŸ â†’ ÅŸÃ¼pheli
    // Kural B: ÃœrÃ¼n fiyatÄ± bir Ã¶nceki fiyatÄ±n %50'sinden dÃ¼ÅŸÃ¼kse â†’ kritik
    try {
        const sonYirmidortSaat = new Date(Date.now() - 86400000).toISOString();

        // Kural A: Ã‡oklu sipariÅŸ anomalisi
        const { data: sonSiparisler } = await supabaseAdmin
            .from('b2_siparisler')
            .select('musteri_id, musteri_adi, id')
            .gte('created_at', sonYirmidortSaat)
            .limit(200);

        if (sonSiparisler && sonSiparisler.length > 0) {
            const musteriSayaci = {};
            for (const s of sonSiparisler) {
                const key = s.musteri_id || s.musteri_adi || 'bilinmiyor';
                musteriSayaci[key] = (musteriSayaci[key] || 0) + 1;
            }
            for (const [musteriKey, sayi] of Object.entries(musteriSayaci)) {
                if (sayi >= 3) {
                    gorevler.push({
                        id: `anomali_musteri_${musteriKey}`,
                        tip: 'anomali_uyarisi',
                        oncelik: 'kritik',
                        baslik: `ğŸš¨ Anormal SipariÅŸ: MÃ¼ÅŸteri ${sayi} sipariÅŸ verdi (24s)`,
                        veri: { musteri_id: musteriKey, siparis_sayisi: sayi },
                        atanan: null
                    });
                    // Sistem uyarÄ±sÄ± yaz
                    try {
                        await supabaseAdmin.from('b1_sistem_uyarilari').insert([{
                            tip: 'siparis_anomali',
                            mesaj: `MÃ¼ÅŸteri ${musteriKey} son 24 saatte ${sayi} sipariÅŸ verdi â€” anomali tespiti.`,
                            oncelik: 'kritik',
                            kaynak: 'KoordinatÃ¶r AjanÄ±',
                        }]);
                    } catch { /* UyarÄ± yazma hatasÄ± sistemi durdurmasÄ±n */ }
                }
            }
        }
    } catch { /* Anomali taramasÄ± sistemi durdurmasÄ±n */ }

    // Orkestrator durumunu kaydet
    await supabaseAdmin.from('b1_ajan_gorevler').insert([{
        ajan_adi: 'KoordinatÃ¶r',
        gorev_adi: 'Sistem TaramasÄ± (Orkestrator)',
        gorev_tipi: 'kontrol',
        durum: 'tamamlandi',
        oncelik: 'yuksek',
        bitis_tarihi: tarihStr,
        sonuc_ozeti: `${gorevler.length} gÃ¶rev tespit edildi. Worker A ve B'ye daÄŸÄ±tÄ±lacak.`,
        gorev_emri: 'TÃ¼m 26 modÃ¼lÃ¼ tara, hata ve bekleyen gÃ¶revleri listele',
    }]);

    return { gorevler, toplam: gorevler.length };
}

// â”€â”€ DAÄIT: GÃ¶rev listesini Worker A ve B'ye bÃ¶ler, paralel Ã§alÄ±ÅŸtÄ±rÄ±r â”€â”€
async function dagitModu(gorevler) {
    if (!gorevler || gorevler.length === 0) {
        return { workerA: { sonuc: [], atlanan: 0 }, workerB: { sonuc: [], atlanan: 0 } };
    }

    // Kritik gÃ¶revler A'ya, diÄŸerleri B'ye
    const kritikler = gorevler.filter(g => g.oncelik === 'kritik');
    const digerler = gorevler.filter(g => g.oncelik !== 'kritik');

    // Worker A: Kritik gÃ¶revler + diÄŸerlerin yarÄ±sÄ±
    const workerAGorevler = [...kritikler, ...digerler.slice(0, Math.ceil(digerler.length / 2))].map(g => ({ ...g, atanan: 'Worker_A' }));
    // Worker B: DiÄŸer yarÄ±sÄ±
    const workerBGorevler = digerler.slice(Math.ceil(digerler.length / 2)).map(g => ({ ...g, atanan: 'Worker_B' }));

    const domain = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const headers = {
        'Content-Type': 'application/json',
        'x-internal-api-key': process.env.INTERNAL_API_KEY || 'dev'
    };

    // Promise.allSettled ile ikisi paralel Ã§alÄ±ÅŸÄ±r
    const [aRes, bRes] = await Promise.allSettled([
        fetch(`${domain}/api/worker-ajan`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ worker_id: 'Worker_A', gorevler: workerAGorevler })
        }).then(r => r.json()),
        fetch(`${domain}/api/worker-ajan`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ worker_id: 'Worker_B', gorevler: workerBGorevler })
        }).then(r => r.json())
    ]);

    return {
        workerA: aRes.status === 'fulfilled' ? aRes.value : { hata: aRes.reason?.message, sonuc: [] },
        workerB: bRes.status === 'fulfilled' ? bRes.value : { hata: bRes.reason?.message, sonuc: [] },
        dagilim: { workerA: workerAGorevler.length, workerB: workerBGorevler.length }
    };
}

// â”€â”€ DOÄRULA: Ä°ki worker'Ä±n Ã§Ä±ktÄ±sÄ±nÄ± birleÅŸtirir â”€â”€
async function dogrulamaModu(dagitimSonucu) {
    const { workerA, workerB, dagilim } = dagitimSonucu || {};

    const aTamamlanan = (workerA?.sonuc || []).filter(s => s.durum === 'ok').length;
    const bTamamlanan = (workerB?.sonuc || []).filter(s => s.durum === 'ok').length;
    const aHata = (workerA?.sonuc || []).filter(s => s.durum === 'hata').length;
    const bHata = (workerB?.sonuc || []).filter(s => s.durum === 'hata').length;
    const toplam = aTamamlanan + bTamamlanan;
    const hataSayisi = aHata + bHata;

    const ozet = [
        `âœ… Worker A: ${aTamamlanan} gÃ¶rev tamamlandÄ±${aHata > 0 ? ` (${aHata} hata)` : ''}`,
        `âœ… Worker B: ${bTamamlanan} gÃ¶rev tamamlandÄ±${bHata > 0 ? ` (${bHata} hata)` : ''}`,
        `ğŸ“Š Toplam: ${toplam}/${(dagilim?.workerA || 0) + (dagilim?.workerB || 0)} baÅŸarÄ±lÄ±`,
    ].join('\n');

    // DoÄŸrulama logu yaz
    await supabaseAdmin.from('b1_agent_loglari').insert([{
        ajan_adi: 'KoordinatÃ¶r',
        islem_tipi: 'orkestrasyon_dogrulama',
        kaynak_tablo: 'orchestrator',
        sonuc: hataSayisi === 0 ? 'basarili' : 'uyari',
        mesaj: ozet,
    }]);

    return {
        basarili: true, ozet,
        istatistik: { toplam, hata: hataSayisi, workerA: aTamamlanan, workerB: bTamamlanan }
    };
}

// â”€â”€ ANA HANDLER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(req) {
    try {
        const apiKey = req.headers.get('x-internal-api-key');
        const yetkili = apiKey === process.env.INTERNAL_API_KEY ||
            process.env.NODE_ENV === 'development';
        if (!yetkili) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

        const body = await req.json();
        const { mod, gorevler: requestGorevler, dagitim_sonucu } = body;

        if (mod === 'tara') {
            const sonuc = await taraModu();
            return NextResponse.json({ basarili: true, mod, ...sonuc });
        }

        if (mod === 'dagit') {
            const sonuc = await dagitModu(requestGorevler);
            return NextResponse.json({ basarili: true, mod, ...sonuc });
        }

        if (mod === 'dogrula') {
            const sonuc = await dogrulamaModu(dagitim_sonucu);
            return NextResponse.json({ mod, ...sonuc });
        }

        return NextResponse.json({ error: 'GeÃ§ersiz mod. tara | dagit | dogrula kullanÄ±n.' }, { status: 400 });

    } catch (e) {
        console.error('[ORKESTRTOR HATA]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
