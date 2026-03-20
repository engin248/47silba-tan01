// ████████████████████████████████████████████████████████████████
// MERKEZİ BİLDİRİM KATMANI — THE ORDER / NIZAM
// Kural: Tüm Telegram bildirimleri buradan geçer.
// Modüller doğrudan telegramBildirim() ÇAĞIRMAZ — bu dosyayı kullanır.
// Supabase log: b0_bildirim_loglari tablosuna yazılır.
// ████████████████████████████████████████████████████████████████

import { supabase } from '@/lib/supabase';

// ─── BİLDİRİM ÖNCELİK SEVİYELERİ ────────────────────────────
export const BILDIRIM_ONCELIK = {
    NORMAL: 'normal',   // Supabase log — Telegram YOK
    ACIL: 'acil',       // Supabase log — Telegram SADECE PRODUCTION'DA
    KRITIK: 'kritik',   // Supabase log + Telegram HER ZAMAN
};

/** @typedef {'normal'|'acil'|'kritik'} OncelikTipi */

// ─── İZİNLİ MODÜLLER (Sadece bunlar bildirim gönderebilir) ───
const IZINLI_MODULLER = [
    'karargah', 'denetmen', 'guvenlik', 'kameralar',
    'ajanlar', 'haberlesme', 'siparisler', 'kasa',
    'personel', 'stok', 'muhasebe', 'uretim',
    'kesim', 'maliyet', 'katalog', 'gorevler',
    'imalat', 'kumas', 'kalip', 'modelhane',
    'arge', 'raporlar', 'musteriler', 'ayarlar',
    'sistem', 'api',
];

// ─── GÜNLÜK LİMİT (Spam koruması) ───────────────────────────
const GUNLUK_LIMIT = {
    kritik: 10,
    acil: 20,
    normal: 0, // Normal için Telegram yok
};

/**
 * Merkezi bildirim fonksiyonu
 * @param {object} params
 * @param {string} params.mesaj        - Bildirim mesajı
 * @param {OncelikTipi} params.oncelik - Öncelik seviyesi
 * @param {string} params.modul        - Hangi modülden geliyor
 * @param {string} [params.kullanici]  - Kim tetikledi
 * @param {object} [params.ekBilgi]    - Ek veri (JSON)
 */
export async function bildirimGonder({
    mesaj,
    oncelik = /** @type {OncelikTipi} */ ('normal'),
    modul = 'sistem',
    kullanici = 'Sistem',
    ekBilgi = null,
}) {
    // ─── 1. MODUL YETKİ KONTROLÜ ─────────────────────────────
    if (!IZINLI_MODULLER.includes(modul)) {
        console.warn(`[BİLDİRİM] Yetkisiz modül: ${modul}`);
        return { basarili: false, neden: 'yetkisiz_modul' };
    }

    // ─── 2. SUPABASE LOG (HER DURUMDA) ───────────────────────
    try {
        await supabase.from('b0_bildirim_loglari').insert([{
            mesaj,
            oncelik,
            modul,
            kullanici,
            ek_bilgi: ekBilgi ? JSON.stringify(ekBilgi) : null,
            ortam: process.env.NODE_ENV || 'unknown',
            created_at: new Date().toISOString(),
        }]);
    } catch (logHatasi) {
        console.error('[BİLDİRİM LOG HATASI]', logHatasi.message);
        // Log başarısız olsa da Telegram'a gitmeye devam et
    }

    // ─── 3. NORMAL → Telegram YOK ────────────────────────────
    if (oncelik === BILDIRIM_ONCELIK.NORMAL) {
        return { basarili: true, telegram: false };
    }

    // ─── 4. ACİL → Sadece Production'da Telegram ─────────────
    if (oncelik === BILDIRIM_ONCELIK.ACIL) {
        if (process.env.NODE_ENV !== 'production') {
            return { basarili: true, telegram: false, neden: 'dev_ortami' };
        }
    }

    // ─── 5. KRİTİK/ACİL → Telegram Gönder ───────────────────
    try {
        const oncelikEmoji = oncelik === 'kritik' ? '🔴 KRİTİK' : '🟡 ACİL';
        const telegramMesaj =
            `${oncelikEmoji} | ${modul.toUpperCase()}\n` +
            `👤 ${kullanici}\n` +
            `📝 ${mesaj}\n` +
            `🕐 ${new Date().toLocaleTimeString('tr-TR')}`;

        const res = await fetch('/api/telegram-bildirim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj: telegramMesaj }),
        });

        if (!res.ok) {
            console.error('[BİLDİRİM] Telegram API hatası:', res.status);
            return { basarili: false, neden: 'telegram_api_hatasi' };
        }

        return { basarili: true, telegram: true };
    } catch (err) {
        console.error('[BİLDİRİM] Telegram gönderilemedi:', err.message);
        return { basarili: false, neden: err.message };
    }
}

// ─── KISAYOL FONKSİYONLARI ───────────────────────────────────
/** @param {string} mesaj @param {string} modul @param {string} [kullanici] @param {object} [ekBilgi] */
export const kritikBildirim = (mesaj, modul, kullanici, ekBilgi) =>
    bildirimGonder({ mesaj, oncelik: /** @type {OncelikTipi} */ ('kritik'), modul, kullanici, ekBilgi });

/** @param {string} mesaj @param {string} modul @param {string} [kullanici] @param {object} [ekBilgi] */
export const acilBildirim = (mesaj, modul, kullanici, ekBilgi) =>
    bildirimGonder({ mesaj, oncelik: /** @type {OncelikTipi} */ ('acil'), modul, kullanici, ekBilgi });

/** @param {string} mesaj @param {string} modul @param {string} [kullanici] @param {object} [ekBilgi] */
export const normalLog = (mesaj, modul, kullanici, ekBilgi) =>
    bildirimGonder({ mesaj, oncelik: /** @type {OncelikTipi} */ ('normal'), modul, kullanici, ekBilgi });
