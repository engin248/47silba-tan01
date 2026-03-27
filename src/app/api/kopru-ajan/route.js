import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GUI'DE TRACE GÖSTERİMİ İÇİN
async function ajanAkliniGoster(gorevId, mesaj) {
    if (!gorevId) return;
    await supabaseAdmin.from('b1_ajan_gorevler').update({
        hedef_modul: mesaj.substring(0, 100)
    }).eq('id', gorevId);
}

// ─── TELEGRAM BİLDİRİM ────────────────────────────────────────
async function telegramBildirimGonder(urunAdi, firsatSkoru, karar, agentNote, botToken, chatId) {
    if (!botToken || !chatId) return false;

    const emoji = karar === 'ÜRETİM' ? '🏭' : '🧪';
    const mesaj = `${emoji} *THE ORDER — YENİ KARAR*

📦 *Ürün:* ${urunAdi}
📊 *Fırsat Skoru:* ${firsatSkoru.toFixed(1)}/100
⚡ *Karar:* ${karar}

📝 _${agentNote || 'Detay yok.'}_

_Karargah panelinden onaylayın._`;

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

// ─── YENİ KARARLARI TARA VE BİLDİR ───────────────────────────
async function yeniKararlariTara(gorevId, botToken, chatId) {
    if (gorevId) await ajanAkliniGoster(gorevId, '🔍 Telegram gönderilecek yeni kararlar taranıyor...');

    const birSaatOnce = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: yeniKararlar, error } = await supabaseAdmin
        .from('b1_arge_strategy')
        .select('*')
        .in('nizam_decision', ['ÜRETİM', 'TEST ÜRETİMİ (Numune)'])
        // Sadece 'boss_approved' = false olanları yani onaylanmamışları alabiliriz ama orijinal script son 1 saate göreydi.
        .gte('created_at', birSaatOnce)
        .order('opportunity_score', { ascending: false });

    if (error || !yeniKararlar || yeniKararlar.length === 0) {
        if (gorevId) await ajanAkliniGoster(gorevId, '📭 Telegram için yeni bildirim bulunamadı.');
        return 0;
    }

    if (gorevId) await ajanAkliniGoster(gorevId, `📤 ${yeniKararlar.length} adet yeni karar bulundu. Gönderiliyor...`);

    let gonderilen = 0;
    for (let i = 0; i < yeniKararlar.length; i++) {
        const karar = yeniKararlar[i];
        if (gorevId) await ajanAkliniGoster(gorevId, `📱 Telegram İletişiyor: [${i + 1}/${yeniKararlar.length}] ${karar.product_name?.substring(0, 15)}...`);

        const basarili = await telegramBildirimGonder(karar.product_name || 'Bilinmeyen Ürün', karar.opportunity_score || 0, karar.nizam_decision, karar.agent_note, botToken, chatId);
        if (basarili) gonderilen++;

        // Telegram rate limit koruması — mesajlar arası 1sn bekle (Sadece dış bağlantılarda)
        await new Promise(r => setTimeout(r, 1000));
    }

    return gonderilen;
}

// ─── ÇÖP SÜPÜRGESİ (7 GÜNLÜK TEMİZLİK) ─────────────────────
async function copSupurgesi(gorevId) {
    if (gorevId) await ajanAkliniGoster(gorevId, '🧹 7 günden eski işlenmiş kayıtlar temizleniyor...');

    const yediGunOnce = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
        .from('b1_arge_products')
        .delete()
        .eq('islenen_durum', 'islendi')
        .lt('created_at', yediGunOnce)
        .select('id');

    const silinen = data?.length || 0;
    if (gorevId) await ajanAkliniGoster(gorevId, `🧹 ${silinen} eski yedek temizlendi.`);
    return silinen;
}

// ─── API ENDPOINT ──────────────────────────────────────────────
export async function POST(req) {
    try {
        const body = await req.json();
        const { gorev_id } = body;

        const auth = req.headers.get('authorization');
        // ─── GÜVENLİK [A-4 FİX]: dev_secret fallback kaldırıldı ───────────
        if (!process.env.CRON_SECRET) return NextResponse.json({ hata: 'Yapılandırma hatası: CRON_SECRET eksik' }, { status: 500 });
        const isCron = auth === `Bearer ${process.env.CRON_SECRET}`;

        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (gorev_id) {
            await supabaseAdmin.from('b1_ajan_gorevler').update({ durum: 'calisıyor', baslangic_tarihi: new Date().toISOString() }).eq('id', gorev_id);
            await ajanAkliniGoster(gorev_id, '🌉 Köprü Ajanı Başlatıldı...');
        }

        const gonderilen = await yeniKararlariTara(gorev_id, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        const silinen = await copSupurgesi(gorev_id);

        const sonucMesaji = `Köprü Raporu: ${gonderilen} karar yöneticilere (Telegram'a) iletildi, ${silinen} çöp veri temizlendi.`;

        if (gorev_id) {
            await ajanAkliniGoster(gorev_id, '✅ Köprü Protokolü Tamamlandı.');
            await supabaseAdmin.from('b1_ajan_gorevler').update({
                durum: 'tamamlandi', bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: sonucMesaji
            }).eq('id', gorev_id);

            await supabaseAdmin.from('b1_agent_loglari').insert([{
                ajan_adi: 'Köprü Ajanı (Haberci)', islem_tipi: 'iletişim_ve_temizlik', kaynak_tablo: 'b1_arge_strategy', sonuc: 'basarili', mesaj: sonucMesaji
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
