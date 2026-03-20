import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// 32 byte MASTER_KEY must be in .env.local
const getMasterKey = () => {
    const key = process.env.HABERLESME_MASTER_KEY;
    if (!key || key.length !== 32) {
        console.warn('[KRIPTO_UYARI] Gecerli 32 byte HABERLESME_MASTER_KEY bulunamadi. Varsayilan acil durum anahtari devrede (Lutfen DEGISINIM YAPIN!).');
        return 'MizanetGizliAnahtar2026_00000000'; // Fallback 32 byte askeri anahtar
    }
    return key;
};

/**
 * Mesajı AES-256-GCM ile şifreler.
 * @param {string} mesaj - Sifrelenecek acik metin
 * @returns { encrypted: string, iv: string, authTag: string }
 */
export function mesajSifrele(mesaj) {
    if (!mesaj) return { encrypted: '', iv: '', authTag: '' };

    const key = Buffer.from(getMasterKey(), 'utf8');
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(mesaj, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

/**
 * Hex formatındaki AES-256-GCM mesajını çözer.
 * @param {string} sifreliMesaj - Hex formatinda sifreli metin
 * @param {string} ivHex - Hex formatinda 12 byte Initialization Vector
 * @param {string} authTagHex - Hex formatinda 16 byte Authentication Tag
 * @returns {string} - Cozulmus acik metin (Orjinal mesaj)
 */
export function mesajCoz(sifreliMesaj, ivHex, authTagHex) {
    try {
        if (!sifreliMesaj || !ivHex || !authTagHex) return "Hata: Eksik kilit paketi.";

        const key = Buffer.from(getMasterKey(), 'utf8');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(sifreliMesaj, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('[KRIPTO_HATA] Paket Çözülemedi:', error);
        return "⚠️ Hata: GÜVENLİK İHLALİ (Mesaj çözülemedi)";
    }
}
