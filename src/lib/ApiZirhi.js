import 'server-only';
// 🛡️ BAŞ MÜFETTİŞ API ZIRHI (SPAM VE DDOS KALKANI)
// Amaç: Dışarıdan gelen API isteklerini sınırlandırmak ve Supabase faturasını korumak.

const islemHafizasi = new Map();

// Parametreler: 10 saniye içinde maksimum 5 istek atılabilir.
const LIMIT_SANIYE = 10;
const MAX_ISTEK = 5;

export function spamKontrol(ipVeyaId = 'anon_ip') {
    const simdi = Date.now();
    const kayit = islemHafizasi.get(ipVeyaId);

    if (!kayit) {
        islemHafizasi.set(ipVeyaId, { sayac: 1, baslangic: simdi });
        return { izinVerildi: true };
    }

    if (simdi - kayit.baslangic > LIMIT_SANIYE * 1000) {
        // Süre dolmuş, sayacı sıfırla
        islemHafizasi.set(ipVeyaId, { sayac: 1, baslangic: simdi });
        return { izinVerildi: true };
    }

    if (kayit.sayac >= MAX_ISTEK) {
        return { izinVerildi: false, kalanSure: LIMIT_SANIYE - Math.floor((simdi - kayit.baslangic) / 1000) };
    }

    kayit.sayac++;
    return { izinVerildi: true };
}

// 6 Saatte bir hafızayı temizle (Aşırı RAM tüketimini önlemek için Garaj Toplayıcısı)
setInterval(() => {
    islemHafizasi.clear();
    console.log('[API ZIRHI] Spam hafızası temizlendi.');
}, 6 * 60 * 60 * 1000);
