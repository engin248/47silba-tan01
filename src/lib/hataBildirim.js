import 'server-only';

/**
 * Hata Bildirim Modülü — Sunucu tarafı hata formatlama
 * Geriye dönük uyumlu çift imza:
 * - Eski: hataBildir('/api/...', error)  → console.error logar, void döner
 * - Yeni: hataBildir('mesaj', 500, {})  → Response.json döner
 */

export async function hataBildir(modulVeyaMesaj, hataVeyaStatus = 500, ekBilgi = {}) {
    // Eski kullanım: hataBildir('/api/kumas-ekle', error)
    if (hataVeyaStatus && typeof hataVeyaStatus === 'object' && 'message' in hataVeyaStatus) {
        // @ts-ignore — JS dosyası, type narrowing kasıtlı
        console.error(`[HATA BİLDİRİM] Modül: ${modulVeyaMesaj} | Hata: ${hataVeyaStatus.message}`, ekBilgi);
        return; // Route kendi NextResponse'unu oluşturur
    }
    // Yeni kullanım: hataBildir('mesaj', 500) → Response üretir
    const status = typeof hataVeyaStatus === 'number' ? hataVeyaStatus : 500;
    console.error(`[HATA BİLDİRİM] ${modulVeyaMesaj}`, ekBilgi);
    return Response.json(
        { hata: modulVeyaMesaj, basarili: false, ...ekBilgi },
        { status }
    );
}

export function yetkiHatasi(mesaj = 'Bu işlem için yetkiniz yok.') {
    return hataBildir(mesaj, 403);
}

export function dogrulamaHatasi(mesaj = 'Geçersiz veri.', hatalar = []) {
    return hataBildir(mesaj, 400, { hatalar });
}
