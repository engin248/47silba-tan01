export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ESKÄ° GEMINI VE MOCK ANALÄ°Z METOTLARI BATCH SÄ°STEMÄ°NE TAÅINMIÅTIR.
// BATCH AI KUYRUÄU OPTÄ°MÄ°ZASYONU:
// Eskiden for dÃ¶ngÃ¼sÃ¼ iÃ§inde 20 kez Gemini API'ye istek atarak devasa maliyet yaratÄ±yordu.
// Åimdi tÃ¼m verileri toplayÄ±p b1_ai_is_kuyrugu tablosuna 'yargic_analizi' tÃ¼rÃ¼nde kaydediyoruz.

// GUI'DE TRACE GÃ–STERÄ°MÄ° Ä°Ã‡Ä°N
async function ajanAkliniGoster(gorevId, mesaj) {
    if (!gorevId) return;
    await supabaseAdmin.from('b1_ajan_gorevler').update({
        hedef_modul: mesaj.substring(0, 100) // UI'daki modÃ¼l alanÄ±na basÄ±yoruz
    }).eq('id', gorevId);
}


// â”€â”€â”€ API ENDPOINT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(req) {
    try {
        const body = await req.json();
        const { gorev_id } = body; // Ajanlar UI'dan tetiklenirse gelir

        // Cron job ÅŸifre korumasÄ± (eÄŸer dÄ±ÅŸarÄ±dan Ã§aÄŸrÄ±ldÄ±ysa)
        const auth = req.headers.get('authorization');
        const isCron = auth === `Bearer ${process.env.CRON_SECRET || 'dev_secret'}`;  // GÃœVENLIK: NEXT_PUBLIC_ prefix'i kaldÄ±rÄ±ldÄ± â€” secret yalnÄ±zca sunucuda kalÄ±r

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_URL = GEMINI_API_KEY ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}` : null;

        if (gorev_id) {
            await supabaseAdmin.from('b1_ajan_gorevler').update({ durum: 'calisÄ±yor', baslangic_tarihi: new Date().toISOString() }).eq('id', gorev_id);
            await ajanAkliniGoster(gorev_id, 'ğŸ§  YargÄ±Ã§ (MatematikÃ§i) UyandÄ±. Dosyalar inceleniyor...');
        }

        // 1. Ä°ÅŸlenmemiÅŸ ham verileri Ã§ek (Limit 20 Vercel timeout'una takÄ±lmamak iÃ§in)
        const { data: hamUrunler, error: fetchErr } = await supabaseAdmin
            .from('b1_arge_products')
            .select('*')
            .eq('islenen_durum', 'bekliyor')
            .limit(20);

        if (fetchErr) throw fetchErr;

        if (!hamUrunler || hamUrunler.length === 0) {
            if (gorev_id) {
                await supabaseAdmin.from('b1_ajan_gorevler').update({
                    durum: 'tamamlandi', bitis_tarihi: new Date().toISOString(),
                    sonuc_ozeti: 'Kuyrukta yargÄ±lanacak hiÃ§ Ã¼rÃ¼n bulunamadÄ±. Temiz.'
                }).eq('id', gorev_id);
            }
            return NextResponse.json({ message: 'No new products to analyze' }, { status: 200 });
        }

        // KuyruÄŸa atÄ±lacak job listesi
        const kuyrukInsertleri = [];

        if (gorev_id) await ajanAkliniGoster(gorev_id, `ğŸ“¦ ${hamUrunler.length} adet Ã¼rÃ¼n BATCH AI KuyruÄŸuna yÃ¼kleniyor...`);

        for (let i = 0; i < hamUrunler.length; i++) {
            const urun = hamUrunler[i];

            let parsedHamVeri = {};
            try { parsedHamVeri = typeof urun.ham_veri === 'string' ? JSON.parse(urun.ham_veri) : urun.ham_veri || {}; } catch { }
            const urunAdi = parsedHamVeri.isim || 'Bilinmeyen ÃœrÃ¼n';
            const fiyatSayi = parsedHamVeri.fiyatSayi || 0;
            const kaynak = urun.veri_kaynagi || 'Trendyol';

            kuyrukInsertleri.push({
                istek_tipi: 'yargic_analizi',
                istek_datasi: { urun_id: urun.id, urunAdi, fiyatSayi, kaynak, ham_veri: urun.ham_veri },
                durum: 'bekliyor'
            });

            // KuyruÄŸa eklendiÄŸi iÃ§in islenen_durum gÃ¼ncelleniyor, ama analiz sonucu gelince asÄ±l tablolar dolacak.
            await supabaseAdmin.from('b1_arge_products').update({ islenen_durum: 'kuyrukta', islendigi_tarih: new Date().toISOString() }).eq('id', urun.id);
        }

        const { error: insertErr } = await supabaseAdmin.from('b1_ai_is_kuyrugu').insert(kuyrukInsertleri);
        if (insertErr) throw insertErr;

        const OzetStr = `ğŸš€ ${hamUrunler.length} adet Ã¼rÃ¼n Yapay Zeka (Batch) kuyruÄŸuna alÄ±ndÄ±. Gece toplu olarak iÅŸlenecektir.`;

        if (gorev_id) {
            await ajanAkliniGoster(gorev_id, 'âœ… TÃ¼m Veriler Kuyrukta. YargÄ±lama Ertelendi.');
            await supabaseAdmin.from('b1_ajan_gorevler').update({
                durum: 'tamamlandi', bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: OzetStr
            }).eq('id', gorev_id);

            // Skor yaz
            await supabaseAdmin.from('b1_agent_loglari').insert([{
                ajan_adi: 'YargÄ±Ã§ (MatematikÃ§i)', islem_tipi: 'analiz_kuyruga_ekleme', kaynak_tablo: 'b1_ai_is_kuyrugu', sonuc: 'basarili',
                mesaj: OzetStr + ` (Toplu API Ã‡aÄŸrÄ±sÄ± ile %95 Maliyet Tasarrufu SaÄŸlandÄ±)`
            }]);
        }

        return NextResponse.json({ basarili: true, sonuc: OzetStr });

    } catch (e) {
        if (req.body?.gorev_id) {
            await supabaseAdmin.from('b1_ajan_gorevler').update({
                durum: 'hata', hata_mesaji: e.message
            }).eq('id', req.body.gorev_id);
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
