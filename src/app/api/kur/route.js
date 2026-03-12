/**
 * /api/kur — Günlük Döviz Kuru
 * [A-02] TCMB (Merkez Bankası) Canlı Kuru
 * Supabase'e günlük cache yazılır — aynı gün ikincil istek yapılmaz
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
    try {
        const bugun = new Date().toISOString().slice(0, 10); // "2026-03-10"

        // 1. Önce Supabase cache'e bak (aynı gün varsa direkt dön)
        const { data: cached } = await supabaseAdmin
            .from('b0_sistem_loglari')
            .select('eski_veri')
            .eq('tablo_adi', 'kur_cache')
            .eq('islem_tipi', bugun)
            .maybeSingle();

        if (cached?.eski_veri?.usd_tl) {
            return NextResponse.json({
                usd_tl: cached.eski_veri.usd_tl,
                eur_tl: cached.eski_veri.eur_tl || null,
                tarih: bugun,
                kaynak: 'cache',
            });
        }

        // 2. TCMB Güncel Döviz Kuru XML (Primary)
        let usd_tl = null;
        let eur_tl = null;
        let aktif_kaynak = 'tcmb';

        try {
            const tcmbRes = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
                next: { revalidate: 3600 },
                signal: AbortSignal.timeout(8000),
            });

            if (tcmbRes.ok) {
                const xmlText = await tcmbRes.text();
                // Regex ile XML'den kurları parse et
                const usdMatch = xmlText.match(/<Currency[^>]+CurrencyCode="USD"[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/i);
                const eurMatch = xmlText.match(/<Currency[^>]+CurrencyCode="EUR"[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/i);

                if (usdMatch && usdMatch[1]) usd_tl = parseFloat(usdMatch[1]);
                if (eurMatch && eurMatch[1]) eur_tl = parseFloat(eurMatch[1]);
            } else {
                throw new Error("TCMB response is not ok");
            }
        } catch (tcmbErr) {
            // 3. Fallback: ExchangeRate-API (TCMB Çökerse)
            aktif_kaynak = 'api (fallback)';
            try {
                const res = await fetch('https://open.er-api.com/v6/latest/USD', {
                    next: { revalidate: 3600 },
                    signal: AbortSignal.timeout(8000),
                });
                if (res.ok) {
                    const json = await res.json();
                    usd_tl = json?.rates?.TRY ?? null;
                    eur_tl = json?.rates?.TRY && json?.rates?.EUR ? (json.rates.TRY / json.rates.EUR) : null;
                }
            } catch {
                usd_tl = 32.5; // Kötü gün senaryosu
                aktif_kaynak = 'sabit_yedek';
            }
        }

        // 4. Supabase'e günlük cache yaz
        if (usd_tl) {
            await supabaseAdmin.from('b0_sistem_loglari').upsert([{
                tablo_adi: 'kur_cache',
                islem_tipi: bugun,
                kullanici_adi: 'sistem',
                eski_veri: { usd_tl, eur_tl, tarih: bugun },
            }], { onConflict: 'tablo_adi,islem_tipi' });
        }

        return NextResponse.json({
            usd_tl: usd_tl ?? 32.5,
            eur_tl: eur_tl ?? null,
            tarih: bugun,
            kaynak: aktif_kaynak,
        });
    } catch (err) {
        return NextResponse.json({ usd_tl: 32.5, eur_tl: null, tarih: null, kaynak: 'hata', hata: err.message }, { status: 200 });
    }
}
