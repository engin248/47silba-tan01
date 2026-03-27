import 'server-only';

/**
 * Hata Bildirim Modülü — Sunucu tarafı hata formatlama
 * API route'lardan hata yanıtı üretmek için kullanılır.
 */

export function hataBildir(mesaj, status = 500, ekBilgi = {}) {
    console.error(`[HATA BİLDİRİM] ${mesaj}`, ekBilgi);
    return Response.json(
        { hata: mesaj, basarili: false, ...ekBilgi },
        { status }
    );
}

export function yetkiHatasi(mesaj = 'Bu işlem için yetkiniz yok.') {
    return hataBildir(mesaj, 403);
}

export function dogrulamaHatasi(mesaj = 'Geçersiz veri.', hatalar = []) {
    return hataBildir(mesaj, 400, { hatalar });
}
