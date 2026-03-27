import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ═══════════════════════════════════════════════════════════
//  PARÇA 1 — BACKEND
//  /api/ajan-orkestrator
//  Koordinatör: modları = 'tara' | 'dagit' | 'dogrula'
// ═══════════════════════════════════════════════════════════

// ── TARAMA: 26 Modülü kontrol eder, görev listesi üretir ──
async function taraModu() {
    const gorevler = [];
    const tarihStr = new Date().toISOString();

    // 1. Stok uyarı taraması
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

    // 2. Bekleyen sipariş taraması (2 günden eski)
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
            baslik: `2 Gün Onay Bekleyen: ${s.siparis_no}`,
            veri: { siparis_id: s.id },
            atanan: null
        });
    }

    // 3. Bekleyen ajan görevleri taraması
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
            baslik: g.gorev_adi || 'Ajan Görevi',
            veri: { gorev_id: g.id },
            atanan: null
        });
    }

    // 4. Gecikmiş üretim emirleri
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
            baslik: `Gecikmiş Üretim: ${p.id.slice(0, 8)}`,
            veri: { order_id: p.id },
            atanan: null
        });
    }

    // 5. İnceleniyor durumundaki trendler
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
            baslik: `${trendler.length} Trend Koordinatör Onayı Bekliyor`,
            veri: { sayi: trendler.length },
            atanan: null
        });
    }

    // 6. Sipariş Anomalisi Tespiti (K-07)
    // Kural A: 24 saatte aynı müşteriden 3+ sipariş → şüpheli
    // Kural B: Ürün fiyatı bir önceki fiyatIn %50'sinden düşükse → kritik
    try {
        const sonYirmidortSaat = new Date(Date.now() - 86400000).toISOString();

        // Kural A: Çoklu sipariş anomalisi
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
                        baslik: `🚨 Anormal Sipariş: Müşteri ${sayi} sipariş verdi (24s)`,
                        veri: { musteri_id: musteriKey, siparis_sayisi: sayi },
                        atanan: null
                    });
                    // Sistem uyarIsı yaz
                    try {
                        await supabaseAdmin.from('b1_sistem_uyarilari').insert([{
                            tip: 'siparis_anomali',
                            mesaj: `Müşteri ${musteriKey} son 24 saatte ${sayi} sipariş verdi — anomali tespiti.`,
                            oncelik: 'kritik',
                            kaynak: 'Koordinatör Ajanı',
                        }]);
                    } catch { /* Uyarı yazma hatası sistemi durdurmasIn */ }
                }
            }
        }
    } catch { /* Anomali taraması sistemi durdurmasIn */ }

    // Orkestrator durumunu kaydet
    await supabaseAdmin.from('b1_ajan_gorevler').insert([{
        ajan_adi: 'Koordinatör',
        gorev_adi: 'Sistem Taraması (Orkestrator)',
        gorev_tipi: 'kontrol',
        durum: 'tamamlandi',
        oncelik: 'yuksek',
        bitis_tarihi: tarihStr,
        sonuc_ozeti: `${gorevler.length} görev tespit edildi. Worker A ve B'ye dagItIlacak.`,
        gorev_emri: 'Tüm 26 modülü tara, hata ve bekleyen görevleri listele',
    }]);

    return { gorevler, toplam: gorevler.length };
}

// ── DAgIT: Görev listesini Worker A ve B'ye böler, paralel çalIstIrIr ──
async function dagitModu(gorevler) {
    if (!gorevler || gorevler.length === 0) {
        return { workerA: { sonuc: [], atlanan: 0 }, workerB: { sonuc: [], atlanan: 0 } };
    }

    // Kritik görevler A'ya, digerleri B'ye
    const kritikler = gorevler.filter(g => g.oncelik === 'kritik');
    const digerler = gorevler.filter(g => g.oncelik !== 'kritik');

    // Worker A: Kritik görevler + digerlerin yarIsı
    const workerAGorevler = [...kritikler, ...digerler.slice(0, Math.ceil(digerler.length / 2))].map(g => ({ ...g, atanan: 'Worker_A' }));
    // Worker B: Diger yarIsı
    const workerBGorevler = digerler.slice(Math.ceil(digerler.length / 2)).map(g => ({ ...g, atanan: 'Worker_B' }));

    const domain = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const headers = {
        'Content-Type': 'application/json',
        'x-internal-api-key': process.env.INTERNAL_API_KEY || '' // [FIX] 'dev' fallback kaldIrIldı
    };

    // Promise.allSettled ile ikisi paralel çalIsIr
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

// ── DOgRULA: İki worker'ın çıktIsInı birlestirir ──
async function dogrulamaModu(dagitimSonucu) {
    const { workerA, workerB, dagilim } = dagitimSonucu || {};

    const aTamamlanan = (workerA?.sonuc || []).filter(s => s.durum === 'ok').length;
    const bTamamlanan = (workerB?.sonuc || []).filter(s => s.durum === 'ok').length;
    const aHata = (workerA?.sonuc || []).filter(s => s.durum === 'hata').length;
    const bHata = (workerB?.sonuc || []).filter(s => s.durum === 'hata').length;
    const toplam = aTamamlanan + bTamamlanan;
    const hataSayisi = aHata + bHata;

    const ozet = [
        `✅ Worker A: ${aTamamlanan} görev tamamlandı${aHata > 0 ? ` (${aHata} hata)` : ''}`,
        `✅ Worker B: ${bTamamlanan} görev tamamlandı${bHata > 0 ? ` (${bHata} hata)` : ''}`,
        `📊 Toplam: ${toplam}/${(dagilim?.workerA || 0) + (dagilim?.workerB || 0)} basarIlı`,
    ].join('\n');

    // Dogrulama logu yaz
    await supabaseAdmin.from('b1_agent_loglari').insert([{
        ajan_adi: 'Koordinatör',
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

// ── ANA HANDLER ──────────────────────────────────────────────
export async function POST(req) {
    try {
        const apiKey = req.headers.get('x-internal-api-key');
        const yetkili = apiKey === process.env.INTERNAL_API_KEY && !!apiKey; // [FIX] NODE_ENV bypass kaldIrIldı
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

        return NextResponse.json({ error: 'Geçersiz mod. tara | dagit | dogrula kullanIn.' }, { status: 400 });

    } catch (e) {
        console.error('[ORKESTRTOR HATA]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
