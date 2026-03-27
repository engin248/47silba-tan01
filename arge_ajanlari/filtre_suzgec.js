const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // [FIX] ANON_KEY fallback kaldırıldı
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

/**
 * BOT 10: ÇÖP ÖĞÜTÜCÜ / SÜZGEÇ (GARBAGE COLLECTOR)
 * Görev: Sunucu ve Supabase veritabanının fuzuli şişmesini (Darboğazları) önlemek için;
 * 'SATMAZ' kararı verilen eski ürünleri ve tarihi geçmiş telemetri loglarını
 * kalıcı olarak imha eder (Soft Delete yerine Hard Delete). Mizanet standartlarına uygundur.
 */
async function bot10CopOgutu(job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[ÇÖP ÖĞÜTÜCÜ %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(10, `[SİSTEM TEMİZLİĞİ BAŞLADI] Supabase veritabanı taraması (X-Ray) yapılıyor...`);

    try {
        // === 1. ESKİ LOGLARIN TEMİZLİĞİ (7 Günden Eski Logları Yok Et) ===
        const yediGunOnce = new Date();
        yediGunOnce.setDate(yediGunOnce.getDate() - 7);
        const yediGunOnceStr = yediGunOnce.toISOString();

        await telemetriAt(30, `[LOG İNFAZI] Karargahtaki 7 günden eski telemetri/sistem logları tespit ediliyor...`);
        const logSilmeSonucu = await supabase
            .from('b1_agent_loglari')
            .delete({ count: 'exact' })
            .lt('created_at', yediGunOnceStr);

        // Supabase-js delete query returns data, error, count depending on flags
        const logCount = logSilmeSonucu.count || 0;

        // === 2. ÇÖP ÜRÜNLERİN TEMİZLİĞİ (15 Günden Eski 'SATMAZ' Onaylı Ürünleri Yok Et) ===
        const onbesGunOnce = new Date();
        onbesGunOnce.setDate(onbesGunOnce.getDate() - 15);
        const onbesGunOnceStr = onbesGunOnce.toISOString();

        await telemetriAt(65, `[ÜRÜN İNFAZI] Yargıç tarafından 'SATMAZ' veya 'REDDEDİLDİ' damgası yemiş 15 günden eski ölü veriler yakılıyor...`);
        const urunSilmeSonucu = await supabase
            .from('b1_arge_products')
            .delete({ count: 'exact' })
            .in('ai_satis_karari', ['SATMAZ', 'REDDEDİLDİ', 'ZARAR_REDDEDİLDİ', 'ELENDI'])
            .lt('created_at', onbesGunOnceStr);

        const urunCount = urunSilmeSonucu.count || 0;

        const islemOzet = `Süzgeçten başarıyla geçirilenler: Sunucudan ${logCount} adet eski operasyon logu ve ${urunCount} adet ölü (Zararlı) ürün tamamen yok edildi. Veritabanı hafifletildi.`;

        await supabase.from('b1_agent_loglari').insert([{
            ajan_adi: 'BOT 10: ÇÖP ÖĞÜTÜCÜ (SÜZGEÇ)',
            islem_tipi: 'VERITABANI_TEMIZLIGI_GC',
            mesaj: islemOzet,
            sonuc: 'basarili'
        }]);

        await telemetriAt(100, `[TEMİZLİK BİTTİ] ${islemOzet}`, 'onaylandı');
        return { islemOzet, temizlenenLog: logCount, temizlenenUrun: urunCount };

    } catch (e) {
        console.error(`[ÖĞÜTÜCÜ ÇÖKÜŞÜ]: ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] Veritabanı temizleme sistemi arızalandı: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    }
}

module.exports = { bot10CopOgutu };
