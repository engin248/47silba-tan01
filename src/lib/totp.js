/**
 * src/lib/totp.js
 * RFC 6238 TOTP — Dış paket yok, Web Crypto API kullanır
 * Google Authenticator / Authy uyumlu
 */

// ── Base32 çözümleme ────────────────────────────────────────────
const BASE32_ALFABE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Coz(base32) {
    const temizle = base32.toUpperCase().replace(/=+$/, '');
    let bitler = 0;
    let deger = 0;
    const cikti = [];
    for (const karakter of temizle) {
        const idx = BASE32_ALFABE.indexOf(karakter);
        if (idx < 0) continue;
        deger = (deger << 5) | idx;
        bitler += 5;
        if (bitler >= 8) {
            cikti.push((deger >> (bitler - 8)) & 0xff);
            bitler -= 8;
        }
    }
    return new Uint8Array(cikti);
}

// ── HMAC-SHA1 (SubtleCrypto) ────────────────────────────────────
async function hmacSha1(anahtar, veri) {
    const k = await crypto.subtle.importKey(
        'raw', anahtar,
        { name: 'HMAC', hash: 'SHA-1' },
        false, ['sign']
    );
    const imza = await crypto.subtle.sign('HMAC', k, veri);
    return new Uint8Array(imza);
}

// ── TOTP Hesaplama ──────────────────────────────────────────────
async function totpHesapla(secret, zaman = Date.now(), adim = 30, basamak = 6) {
    const sayac = Math.floor(zaman / 1000 / adim);

    // 64-bit big-endian sayaç
    const sayacBuf = new ArrayBuffer(8);
    const view = new DataView(sayacBuf);
    view.setUint32(4, sayac & 0xffffffff, false);

    const anahtarBytes = base32Coz(secret);
    const hash = await hmacSha1(anahtarBytes, new Uint8Array(sayacBuf));

    const offset = hash[hash.length - 1] & 0x0f;
    const kod =
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

    return String(kod % Math.pow(10, basamak)).padStart(basamak, '0');
}

// ── Secret Oluştur ──────────────────────────────────────────────
export function secretOlustur() {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    let secret = '';
    for (const byte of bytes) {
        secret += BASE32_ALFABE[byte & 31];
    }
    return secret;
}

// ── TOTP Kod Üret ───────────────────────────────────────────────
export async function totpKodUret(secret) {
    return await totpHesapla(secret);
}

// ── TOTP Doğrula (±1 adım tolerans) ────────────────────────────
export async function totpDogrula(secret, girilen) {
    if (!girilen || girilen.length !== 6) return false;
    const simdi = Date.now();
    for (const fark of [-1, 0, 1]) {
        const beklenen = await totpHesapla(secret, simdi + fark * 30000);
        if (beklenen === String(girilen).trim()) return true;
    }
    return false;
}

// ── QR kod URL'i oluştur (otpauth:// protokolü) ─────────────────
export function qrUrlOlustur(secret, label = '47 Sistem', issuer = 'Antigravity ERP') {
    const encoded = encodeURIComponent(label);
    return `otpauth://totp/${encoded}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
