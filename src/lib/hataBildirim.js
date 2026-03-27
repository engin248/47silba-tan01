/**
 * =======================================================
 * HATA BÝLDÝRÝM SÝSTEMÝ — Telegram'a Otomatik Alarm
 * Sentry yerine kendi altyapýmýzla hata izleme
 * =======================================================
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Son gönderilen hatanýn zamaný — ayný hatayý 5 dakika içinde tekrar gönderme
const _hataKontrol = new Map();

/**
 * Telegram'a hata bildirimi gönder
 * @param {string} modul - Hangi modülde hata? Örn: '/api/kumas-ekle'
 * @param {Error|string} hata - Hata objesi veya mesaj
 * @param {string} [ekBilgi] - Opsiyonel ek bilgi (IP, kullanýcý vs)
 */
export async function hataBildir(modul, hata, ekBilgi = '') {
    try {
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return; // Env yoksa sessizce geç

        const hataMesaji = hata instanceof Error ? hata.message : String(hata);

        // Ayný hata 5 dakika içinde tekrar gelirse gönderme (spam önleme)
        const anahtar = `${modul}:${hataMesaji.slice(0, 50)}`;
        const sonGonderim = _hataKontrol.get(anahtar);
        if (sonGonderim && (Date.now() - sonGonderim) < 5 * 60 * 1000) return;
        _hataKontrol.set(anahtar, Date.now());

        const saat = new Date().toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit'
        });

        const mesaj = [
            `?? <b>SÝSTEM HATASI!</b>`,
            ``,
            `?? <b>Modül:</b> <code>${modul}</code>`,
            `? <b>Hata:</b> <code>${hataMesaji.slice(0, 200)}</code>`,
            ekBilgi ? `?? <b>Bilgi:</b> ${ekBilgi}` : '',
            `?? <b>Saat:</b> ${saat}`,
            ``,
            `<i>mizanet.com</i>`, // [DOMAIN FIX] eski vercel adresi güncellendi
        ].filter(Boolean).join('\n');

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mesaj,
                parse_mode: 'HTML'
            }),
            signal: AbortSignal.timeout(5000) // 5sn'den uzun bekleme
        });

    } catch (bildirimHata) {
        // H3 FIX: Bildirim gönderilemese bile sistemi engelleme — ama hata logla
        console.error('[H3 HATA BÝLDÝRÝM HATASI] Telegram\'a gönderilemedi:', bildirimHata?.message);
    }
}

/**
 * Kritik olmayan ama dikkat gerektiren durumlar için uyarý
 * @param {string} modul
 * @param {string} mesaj
 */
export async function uyariBildir(modul, mesaj) {
    try {
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

        const saat = new Date().toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul',
            hour: '2-digit', minute: '2-digit'
        });

        const metin = [
            `?? <b>SÝSTEM UYARISI</b>`,
            `?? <b>Modül:</b> <code>${modul}</code>`,
            `?? <b>Mesaj:</b> ${mesaj}`,
            `?? ${saat}`,
        ].join('\n');

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: metin, parse_mode: 'HTML' }),
            signal: AbortSignal.timeout(5000)
        });
    } catch (_) { console.error('[KÖR NOKTA ZIRHI - YUTULAN HATA] Dosya: hataBildirim.js'); }
}
