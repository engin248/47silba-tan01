export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ============================================================
// YIRTICI FIRSAT BOTU â€” THE ORDER / NIZAM
// /api/rapor/yirtici-firsat
//
// GET  â†’ Trendyol'da tÃ¼kenip sizde olan Ã¼rÃ¼nlerin listesi
// POST â†’ Fiyat artÄ±ÅŸ alarmÄ± tetikle (Telegram)
// KullanÄ±m: Herhangi bir kÄ±sÄ±tlama olmaksÄ±zÄ±n her Ã§aÄŸrÄ±da Ã§alÄ±ÅŸÄ±r.
// ============================================================

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const artisTavsiyeYuzde = parseFloat(url.searchParams.get('artis') || '15');

        // â”€ Sizin stoÄŸunuzdaki Ã¼rÃ¼nler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const { data: stokUrunler } = await sb
            .from('b2_urun_katalogu')
            .select('id, urun_kodu, urun_adi, stok_adedi, satis_fiyati, kategori')
            .gt('stok_adedi', 0)
            .limit(200);

        // â”€ Scraper'dan gelen Trendyol verileri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // (b1_arge_products tablosundaki scraper verisi)
        const { data: trendyolVerisi } = await sb
            .from('b1_arge_products')
            .select('id, ham_veri, created_at, islenen_durum')
            .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
            .limit(500);

        // â”€ EÅŸleÅŸtirme: Trendyol'da bitmiÅŸ, bizde var â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const firsatlar = [];

        for (const stokItem of (stokUrunler || [])) {
            for (const trendItem of (trendyolVerisi || [])) {
                let hamVeri = {};
                try { hamVeri = typeof trendItem.ham_veri === 'string' ? JSON.parse(trendItem.ham_veri) : trendItem.ham_veri || {}; } catch { }

                // Stok durumu: 0 veya Ã§ok az = Arz aÃ§Ä±ÄŸÄ± sinyali
                const trendStok = Number(hamVeri.stokAdedi || hamVeri.stok || 99);
                const isimEslesme = hamVeri.isim && stokItem.urun_adi &&
                    (hamVeri.isim.toLowerCase().includes(stokItem.urun_adi.toLowerCase().substring(0, 6)) ||
                        stokItem.urun_adi.toLowerCase().includes((hamVeri.isim || '').toLowerCase().substring(0, 6)));

                if (isimEslesme && trendStok <= 3 && stokItem.stok_adedi > 0) {
                    const trendFiyat = Number(hamVeri.fiyatSayi || 0);
                    const onerilen_fiyat = stokItem.satis_fiyati
                        ? parseFloat((stokItem.satis_fiyati * (1 + artisTavsiyeYuzde / 100)).toFixed(2))
                        : null;

                    firsatlar.push({
                        bizim_urun_id: stokItem.id,
                        urun_adi: stokItem.urun_adi,
                        bizim_stok: stokItem.stok_adedi,
                        mevcut_fiyat: stokItem.satis_fiyati,
                        onerilen_fiyat,
                        artis_yuzde: artisTavsiyeYuzde,
                        trendyol_stok: trendStok,
                        trendyol_fiyat: trendFiyat,
                        firsat_skoru: Math.max(0, (10 - trendStok) * 10 + (stokItem.stok_adedi > 5 ? 20 : 0)),
                        alarm_mesaji: `ğŸ¦… ARZ AÃ‡IÄI: "${stokItem.urun_adi}" â€” Trendyol'da ${trendStok} adet kaldÄ±. Sizde ${stokItem.stok_adedi} adet var. FiyatÄ± %${artisTavsiyeYuzde} artÄ±rÄ±n: ${onerilen_fiyat} TL`,
                    });
                }
            }
        }

        // FÄ±rsat skoruna gÃ¶re sÄ±rala
        firsatlar.sort((a, b) => b.firsat_skoru - a.firsat_skoru);

        // â”€ Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (firsatlar.length > 0) {
            await sb.from('b1_agent_loglari').insert([{
                ajan_adi: 'YÄ±rtÄ±cÄ± FÄ±rsat Botu',
                islem_tipi: 'firsat_tarama',
                kaynak_tablo: 'b2_urun_katalogu + b1_arge_products',
                sonuc: 'uyari',
                mesaj: `${(stokUrunler || []).length} stok Ã¼rÃ¼nÃ¼ Ã— ${(trendyolVerisi || []).length} Trendyol kaydÄ± tarandÄ±. ${firsatlar.length} fÄ±rsat bulundu.`,
            }]);
        }

        return NextResponse.json({
            basarili: true,
            ozet: {
                taranan_stok: (stokUrunler || []).length,
                taranan_trendyol: (trendyolVerisi || []).length,
                firsat_sayisi: firsatlar.length,
            },
            firsatlar: firsatlar.slice(0, 20),
            tarih: new Date().toISOString(),
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// â”€â”€â”€ POST: Fiyat artÄ±ÅŸÄ± Telegram alarmÄ± gÃ¶nder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(req) {
    try {
        const body = await req.json();
        const { urun_adi, onerilen_fiyat, mevcut_fiyat, trendyol_stok, bizim_stok } = body;

        const mesaj = `ğŸ¦… *YIRTICI FIRSAT BOTU*\n\n` +
            `ÃœrÃ¼n: *${urun_adi}*\n` +
            `Trendyol Stok: ${trendyol_stok} adet (kritik dÃ¼ÅŸÃ¼k!)\n` +
            `Bizim Stok: ${bizim_stok} adet\n` +
            `Mevcut Fiyat: ${mevcut_fiyat} TL\n` +
            `*Ã–nerilen Yeni Fiyat: ${onerilen_fiyat} TL*\n\n` +
            `â° ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`;

        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        let telegramGonderildi = false;
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: mesaj, parse_mode: 'Markdown' }),
            });
            telegramGonderildi = true;
        }

        await sb.from('b1_sistem_uyarilari').insert([{
            uyari_tipi: 'firsat_alami',
            seviye: 'bilgi',
            baslik: `ğŸ¦… FÄ±rsat AlarmÄ±: ${urun_adi}`,
            mesaj: `Ã–nerilen fiyat: ${onerilen_fiyat} TL (Mevcut: ${mevcut_fiyat} TL)`,
            kaynak_tablo: 'b2_urun_katalogu',
            durum: 'aktif',
        }]);

        return NextResponse.json({ basarili: true, telegram_gonderildi: telegramGonderildi });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
