import crypto from 'crypto';

/**
 * 🛡️ MİZANET ASKERİ KRİPTOGRAFİ MOTORU (AES-256-GCM)
 * 
 * Amaç: Karargah, Albay, Başmimar ve Müfettiş arasındaki haberleşmenin (mesajların) 
 * Supabase sunucularına "DÜZ METİN" olarak gitmesini engellemek. 
 * EĞER SUPABASE HACKLENİR VEYA İZLENİRSE, SALDIRGAN SADECE ANLAMSIZ HARFLER GÖRÜR.
 *
 * Sadece .env dosyasındaki KARARGAH_HABERLESME_SECRET anahtarına sahip olan sunucu mesajı çözebilir.
 */

// Sunucudaki 32 Baytlık (256 bit) Sabit Şifreleme Anahtarı
// Gerçek ortamda process.env.KARARGAH_HABERLESME_SECRET'ten gelir
const getSistemAnahtari = () => {
    const rawKey = process.env.KARARGAH_HABERLESME_SECRET || 'MİZANET_ÇOK_GİZLİ_KARARGAH_KEY_32'; // 32 karaktere tamamlamalı

    // Güvenlik için anahtarı 32 bayta SHA-256 ile fixliyoruz
    return crypto.createHash('sha256').update(String(rawKey)).digest('base64').substr(0, 32);
};

/**
 * Metni şifreler.
 * @param {string} mesaj Düz metin (Örn: "Taarruza başlayın")
 * @returns {Object} Şifreli paket { sifreliMetin, iv, authTag }
 */
export function mesajSifrele(mesaj) {
    if (!mesaj) return null;

    // IV (Initialization Vector) - Her mesaj için benzersiz rastgele bir tuz
    const iv = crypto.randomBytes(16);
    const anahtar = getSistemAnahtari();

    // AES-256-GCM algoritması (Askeri/Bankacılık standardı)
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(anahtar), iv);

    let sifreliMetin = cipher.update(mesaj, 'utf8', 'hex');
    sifreliMetin += cipher.final('hex');

    // Authentication Tag - Şifrenin yolda değiştirilip değiştirilmediğini doğrular
    const authTag = cipher.getAuthTag();

    return {
        sifreliMetin: sifreliMetin,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

/**
 * Şifreli paketi çözer.
 */
export function mesajCoz(sifreliMetin, ivHex, authTagHex) {
    if (!sifreliMetin || !ivHex || !authTagHex) return "🛡️ [ŞİFRE ÇÖZÜLEMEDİ - VERİ BOZUK]";

    try {
        const anahtar = getSistemAnahtari();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(anahtar), iv);
        decipher.setAuthTag(authTag);

        let orijinalMesaj = decipher.update(sifreliMetin, 'hex', 'utf8');
        orijinalMesaj += decipher.final('utf8');

        return orijinalMesaj;
    } catch (error) {
        console.error("Şifre Çözme İhlali (Tamper Attempt):", error.message);
        return "🛡️ [İHLAL: MESAJ DEĞİŞTİRİLMİŞ VEYA ANAHTAR YANLIŞ]";
    }
}
