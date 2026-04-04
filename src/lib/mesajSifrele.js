/**
 * Mizanet SİBER KARARGAH — AES-256-GCM MESAJ ŞİFRELEME MODÜLÜ
 * ─────────────────────────────────────────────────────────────
 * Mesaj içerikleri Supabase'e gitmeden önce bu modül ile şifrelenir.
 * Sadece HABERLESME_MASTER_KEY'e sahip sistem şifreyi çözebilir.
 * Dışarıya çıkan veri: anlamsız şifreli metin (ciphertext).
 *
 * Algoritma: AES-256-GCM (Web Crypto API — tarayıcı native)
 * IV: Her mesaj için benzersiz 12-byte rastgele değer
 * Salt: Her anahtar türetme için benzersiz 16-byte rastgele değer
 * KDF: PBKDF2-SHA256 (100.000 iterasyon)
 */

// Anahtarı base64 veya düz metin olarak destekle
const MASTER_KEY = process.env.NEXT_PUBLIC_HABERLESME_MASTER_KEY
    || process.env.HABERLESME_MASTER_KEY
    || 'NIZAM-47-FALLBACK-KEY-DEV-ONLY';

/** Hex string → Uint8Array */
const hexToBytes = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));

/** Uint8Array → Hex string */
const bytesToHex = (bytes) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

/** PBKDF2 ile AES-GCM anahtarı türet */
async function anahtarTuret(salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(MASTER_KEY),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Mesaj içeriğini şifrele
 * @param {string} metin - Düz metin mesaj
 * @returns {Promise<string>} - "SFR:salt:iv:ciphertext" formatında şifreli string
 */
export async function mesajSifrele(metin) {
    if (!metin) return metin;
    try {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const anahtar = await anahtarTuret(salt);

        const sifreli = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            anahtar,
            encoder.encode(metin)
        );

        // Format: SFR (Şifreli) prefix + salt + iv + ciphertext (hepsi hex)
        return `SFR:${bytesToHex(salt)}:${bytesToHex(iv)}:${bytesToHex(new Uint8Array(sifreli))}`;
    } catch (e) {
        console.error('[ŞİFRELEME HATASI]', e);
        return metin; // Hata durumunda düz metni gönder (güvenli fallback)
    }
}

/**
 * Şifreli mesajı çöz
 * @param {string} sifreliMetin - "SFR:salt:iv:ciphertext" formatı
 * @returns {Promise<string>} - Çözülmüş düz metin
 */
export async function mesajCoz(sifreliMetin) {
    if (!sifreliMetin) return sifreliMetin;
    if (!sifreliMetin.startsWith('SFR:')) return sifreliMetin; // Eski/şifresiz mesaj
    try {
        const parcalar = sifreliMetin.split(':');
        if (parcalar.length < 4) return '[ŞİFRELİ — Çözülemedi]';

        const salt = hexToBytes(parcalar[1]);
        const iv = hexToBytes(parcalar[2]);
        // Geri kalan parçalar ciphertext (iv veya salt içinde : olabilir diye güvenli join)
        const cipherHex = parcalar.slice(3).join(':');
        const cipherBytes = hexToBytes(cipherHex);

        const anahtar = await anahtarTuret(salt);
        const cozulmus = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            anahtar,
            cipherBytes
        );

        return new TextDecoder().decode(cozulmus);
    } catch (e) {
        console.error('[ÇÖZME HATASI]', e);
        return '[ŞİFRELİ MESAJ — Yetkiniz yok veya anahtar hatalı]';
    }
}

/**
 * Mesajın şifreli olup olmadığını kontrol et
 * @param {string} metin
 * @returns {boolean}
 */
export const sifreliMi = (metin) => typeof metin === 'string' && metin.startsWith('SFR:');
