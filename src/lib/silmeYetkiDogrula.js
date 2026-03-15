/**
 * silmeYetkiDogrula — Tüm Modüllerde Güvenli Silme Doğrulaması
 *
 * Kullanım:
 *   import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
 *   const { yetkili, mesaj } = await silmeYetkiDogrula(kullanici);
 *   if (!yetkili) return goster(mesaj, 'error');
 *
 * Davranış:
 *  - kullanici.grup === 'tam' ise direkt yetkili sayılır (prompt yok)
 *  - Değilse PIN prompt açılır ve /api/pin-dogrula'ya sunucu doğrulaması gider
 *  - NEXT_PUBLIC_ADMIN_PIN client'a hiç sızdırılmaz
 *
 * @param {any} kullanici
 * @param {string | null | undefined} [mesajMetni]
 * @returns {Promise<{yetkili: boolean, mesaj: string}>}
 */

export async function silmeYetkiDogrula(kullanici, mesajMetni = null) {
    // TAM YETKİLİ kullanıcı → doğrudan geçer
    if (kullanici?.grup === 'tam') {
        return { yetkili: true, mesaj: '' };
    }

    // Diğerleri → PIN sorulur
    const promptMetni = mesajMetni || 'Bu kaydı silmek için Yönetici PIN kodunu girin:';
    const girilen = window.prompt(promptMetni);

    // Kullanıcı iptal ettiyse
    if (girilen === null || girilen === '') {
        return { yetkili: false, mesaj: 'İptal edildi.' };
    }

    try {
        const res = await fetch('/api/pin-dogrula', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: girilen.trim(), tip: 'tam' }),
        });

        if (!res.ok && res.status === 429) {
            const veri = await res.json();
            return { yetkili: false, mesaj: veri.hata || 'Çok fazla hatalı deneme. Lütfen bekleyin.' };
        }

        const veri = await res.json();

        if (veri.basarili && veri.grup === 'tam') {
            return { yetkili: true, mesaj: '' };
        } else {
            return { yetkili: false, mesaj: 'Hatalı PIN. Yetkisiz işlem engellendi.' };
        }
    } catch {
        return { yetkili: false, mesaj: 'Sunucuya ulaşılamadı. Silme işlemi iptal edildi.' };
    }
}
