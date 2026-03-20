export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GUI'DE TRACE GÃ–STERÄ°MÄ° Ä°Ã‡Ä°N
async function ajanAkliniGoster(gorevId, mesaj) {
    if (!gorevId) return;
    await supabaseAdmin.from('b1_ajan_gorevler').update({
        hedef_modul: mesaj.substring(0, 100)
    }).eq('id', gorevId);
}

// â”€â”€â”€ TELEGRAM BÄ°LDÄ°RÄ°M â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function telegramBildirimGonder(urunAdi, firsatSkoru, karar, agentNote, botToken, chatId) {
    if (!botToken || !chatId) return false;

    const emoji = karar === 'ÃœRETÄ°M' ? 'ğŸ­' : 'ğŸ§ª';
    const mesaj = `${emoji} *THE ORDER â€” YENÄ° KARAR*

ğŸ“¦ *ÃœrÃ¼n:* ${urunAdi}
ğŸ“Š *FÄ±rsat Skoru:* ${firsatSkoru.toFixed(1)}/100
âš¡ *Karar:* ${karar}

ğŸ“ _${agentNote || 'Detay yok.'}_

_Karargah panelinden onaylayÄ±n._`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: mesaj, parse_mode: 'Markdown' })
        });
        return res.ok;
    } catch (err) {
        return false;
    }
}

// â”€â”€â”€ YENÄ° KARARLARI TARA VE BÄ°LDÄ°R â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function yeniKararlariTara(gorevId, botToken, chatId) {
    if (gorevId) await ajanAkliniGoster(gorevId, 'ğŸ” Telegram gÃ¶nderilecek yeni kararlar taranÄ±yor...');

    const birSaatOnce = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: yeniKararlar, error } = await supabaseAdmin
        .from('b1_arge_strategy')
        .select('*')
        .in('nizam_decision', ['ÃœRETÄ°M', 'TEST ÃœRETÄ°MÄ° (Numune)'])
        // Sadece 'boss_approved' = false olanlarÄ± yani onaylanmamÄ±ÅŸlarÄ± alabiliriz ama orijinal script son 1 saate gÃ¶reydi.
        .gte('created_at', birSaatOnce)
        .order('opportunity_score', { ascending: false });

    if (error || !yeniKararlar || yeniKararlar.length === 0) {
        if (gorevId) await ajanAkliniGoster(gorevId, 'ğŸ“­ Telegram iÃ§in yeni bildirim bulunamadÄ±.');
        return 0;
    }

    if (gorevId) await ajanAkliniGoster(gorevId, `ğŸ“¤ ${yeniKararlar.length} adet yeni karar bulundu. GÃ¶nderiliyor...`);

    let gonderilen = 0;
    for (let i = 0; i < yeniKararlar.length; i++) {
        const karar = yeniKararlar[i];
        if (gorevId) await ajanAkliniGoster(gorevId, `ğŸ“± Telegram Ä°letiÅŸiyor: [${i + 1}/${yeniKararlar.length}] ${karar.product_name?.substring(0, 15)}...`);

        const basarili = await telegramBildirimGonder(karar.product_name || 'Bilinmeyen ÃœrÃ¼n', karar.opportunity_score || 0, karar.nizam_decision, karar.agent_note, botToken, chatId);
        if (basarili) gonderilen++;

        // Telegram rate limit korumasÄ± â€” mesajlar arasÄ± 1sn bekle (Sadece dÄ±ÅŸ baÄŸlantÄ±larda)
        await new Promise(r => setTimeout(r, 1000));
    }

    return gonderilen;
}

// â”€â”€â”€ Ã‡Ã–P SÃœPÃœRGESÄ° (7 GÃœNLÃœK TEMÄ°ZLÄ°K) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function copSupurgesi(gorevId) {
    if (gorevId) await ajanAkliniGoster(gorevId, 'ğŸ§¹ 7 gÃ¼nden eski iÅŸlenmiÅŸ kayÄ±tlar temizleniyor...');

    const yediGunOnce = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
        .from('b1_arge_products')
        .delete()
        .eq('islenen_durum', 'islendi')
        .lt('created_at', yediGunOnce)
        .select('id');

    const silinen = data?.length || 0;
    if (gorevId) await ajanAkliniGoster(gorevId, `ğŸ§¹ ${silinen} eski yedek temizlendi.`);
    return silinen;
}

// â”€â”€â”€ API ENDPOINT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(req) {
    try {
        const body = await req.json();
        const { gorev_id } = body;

        const auth = req.headers.get('authorization');
        const isCron = auth === `Bearer ${process.env.CRON_SECRET || 'dev_secret'}`; // GÃœVENLIK: NEXT_PUBLIC_ prefix'i kaldÄ±rÄ±ldÄ±

        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (gorev_id) {
            await supabaseAdmin.from('b1_ajan_gorevler').update({ durum: 'calisÄ±yor', baslangic_tarihi: new Date().toISOString() }).eq('id', gorev_id);
            await ajanAkliniGoster(gorev_id, 'ğŸŒ‰ KÃ¶prÃ¼ AjanÄ± BaÅŸlatÄ±ldÄ±...');
        }

        const gonderilen = await yeniKararlariTara(gorev_id, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        const silinen = await copSupurgesi(gorev_id);

        const sonucMesaji = `KÃ¶prÃ¼ Raporu: ${gonderilen} karar yÃ¶neticilere (Telegram'a) iletildi, ${silinen} Ã§Ã¶p veri temizlendi.`;

        if (gorev_id) {
            await ajanAkliniGoster(gorev_id, 'âœ… KÃ¶prÃ¼ ProtokolÃ¼ TamamlandÄ±.');
            await supabaseAdmin.from('b1_ajan_gorevler').update({
                durum: 'tamamlandi', bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: sonucMesaji
            }).eq('id', gorev_id);

            await supabaseAdmin.from('b1_agent_loglari').insert([{
                ajan_adi: 'KÃ¶prÃ¼ AjanÄ± (Haberci)', islem_tipi: 'iletiÅŸim_ve_temizlik', kaynak_tablo: 'b1_arge_strategy', sonuc: 'basarili', mesaj: sonucMesaji
            }]);
        }

        return NextResponse.json({ basarili: true, sonuc: sonucMesaji });

    } catch (e) {
        if (req.body?.gorev_id) {
            await supabaseAdmin.from('b1_ajan_gorevler').update({
                durum: 'hata', hata_mesaji: e.message
            }).eq('id', req.body.gorev_id);
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
