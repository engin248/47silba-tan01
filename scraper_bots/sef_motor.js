/**
 * ŞEF BOT M1 (KARARGAH ORKESTRATÖRÜ) - BEYİN
 * Görev: 3 Ana Sütun Botunu (Trend, Satış, Talep) aynı anda sahaya sürmek.
 * Amaç: 3'ü aynı anda POZİTİF ise -> BİNGO (Yarın Satar) kararını vurmak.
 */

const { tiktokTrendAnalizi } = require('./tiktok');
const { trendyolSatisAnalizi } = require('./trendyol');
const { aramaVeTalepAnalizi } = require('./arama_motoru');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

// Supabase (Kaba kuvvet yazma yetkisi - Service Role)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

async function sefKarargahMotorunuCalistir(hedefUrunVeyaKelime) {
    console.log(`\n======================================================`);
    console.log(`[ŞEF BOT M1] KÜRESEL İSTİHBARAT BAŞLATILDI`);
    console.log(`[HEDEF]: ${hedefUrunVeyaKelime}`);
    console.log(`======================================================\n`);

    console.log(`[ŞEF BOT M1] Aşama 1: 3 Ana Ajan aynı anda sahaya sürülüyor...\n`);

    // 3 Ajanı paralel olarak (Asenkron) saniyeler içinde çalıştır
    const [trendRaporu, satisRaporu, talepRaporu] = await Promise.all([
        tiktokTrendAnalizi(hedefUrunVeyaKelime),     // BOT 1 = TREND
        trendyolSatisAnalizi(hedefUrunVeyaKelime),   // BOT 2 = SATIŞ
        aramaVeTalepAnalizi(hedefUrunVeyaKelime)     // BOT 3 = TALEP
    ]);

    console.log(`\n======================================================`);
    console.log(`[ŞEF BOT M1] Aşama 2: VERİLER TOPLANDI. MASA KURULDU.`);
    console.log(`======================================================\n`);

    // GÜVENLİK FİLTRESİ
    if (!trendRaporu || !satisRaporu || !talepRaporu) {
        console.error(`[ŞEF BOT M1] HATA: Ajanlardan biri öldü veya veri getiremedi. Karar masası iptal.`);
        return;
    }

    // ÇIKTILARI DEĞERLENDİRME
    const trendDurumu = trendRaporu.Cikti.TREND_DURUMU; // VAR / POTANSİYEL / YOK
    const satisDurumu = satisRaporu.Cikti.SATIS_VAR_MI; // VAR / ZAYIF_BAŞLANGIÇ / YOK
    const talepDurumu = talepRaporu.Cikti.TALEP_VAR_MI; // VAR / POTANSİYEL VAR / YOK

    console.log(`[KARAR MASASI ÖZETİ]:`);
    console.log(` > BOT 1 (TREND) : ${trendDurumu}`);
    console.log(` > BOT 2 (SATIŞ) : ${satisDurumu}`);
    console.log(` > BOT 3 (TALEP) : ${talepDurumu}`);

    console.log(`\n======================================================`);
    console.log(`[ŞEF BOT M1] Aşama 3: KESİN HÜKÜM (YARGI)`);
    console.log(`======================================================\n`);

    let nihaiKarar = "KIRMIZI_BÖLGE_RED";
    let kararAciklamasi = "Şartlar oluşmadı.";
    let supabaseStatus = 'red';

    // ÜÇÜ BİRDEN POZİTİF KONTROLÜ
    const trendPozitifMi = (trendDurumu === 'VAR' || trendDurumu === 'POTANSİYEL');
    const satisPozitifMi = (satisDurumu === 'VAR');
    const talepPozitifMi = (talepDurumu === 'VAR' || talepDurumu === 'POTANSİYEL VAR');

    if (trendPozitifMi && satisPozitifMi && talepPozitifMi) {
        nihaiKarar = "🟢 BİNGO (YARIN SATAR)";
        // M1'den M2'ye geçiş onayı
        kararAciklamasi = "Üç sütun da (Trend, Satış, Talep) kusursuz eşleşti. Kesin Üretime Gir.";
        supabaseStatus = 'uretim_onay';
    } else if ((trendPozitifMi && satisPozitifMi) || (trendPozitifMi && talepPozitifMi)) {
        nihaiKarar = "🟡 RADARDA BEKLET (İZLEME)";
        kararAciklamasi = "1 Sütun eksik. Erken girmek riskli, geç kalmak tehlikeli. 2 gün izle.";
        supabaseStatus = 'inceleniyor';
    } else {
        nihaiKarar = "🔴 ÇÖPE AT (İPTAL)";
        kararAciklamasi = "Sosyal yayılım, gerçek satış ile desteklenmiyor. Yalancı Bahar.";
        supabaseStatus = 'iptal';
    }

    console.log(`>>> M1 Kararı: ${nihaiKarar}`);
    console.log(`>>> Gerekçe: ${kararAciklamasi}\n`);

    // SUPABASE VERİTABANINA ASİMİLE ET (KARARGHA GÖNDER)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.log(`[ŞEF BOT M1] Karargaha (Supabase'e) Rapor İletiliyor...`);
        const payLoad = {
            title: hedefUrunVeyaKelime,
            product_url: 'AUTO_GENERATED_BY_SHADOW_AGENTS',
            status: supabaseStatus,
            sepet_deltasi: satisRaporu.DetayliMetrikler.favoriler,
            yorum_deltasi: satisRaporu.DetayliMetrikler.yorumAdedi,
            satar_satmaz_skoru: parseInt(satisRaporu.Cikti.Genel_Pazar_Skoru.split('/')[0]),
            iade_risk_sinyali: satisRaporu.DetayliMetrikler.iadeTehlikesi,
            satici_sayisi: satisRaporu.DetayliMetrikler.aramaUrunSayisi
        };

        const { error } = await supabase.from('b1_arge_products').insert([payLoad]);

        if (error) {
            console.error(`[ŞEF BOT M1] API BAĞLANTI HATASI: ${error.message}`);
        } else {
            console.log(`[ŞEF BOT M1] Rapor Karargaha Düştü. (UI Ekranında Görüntülenecek)`);
        }
    } else {
        console.log(`[ŞEF BOT M1] (Çevrimdışı Mod - DB'ye yazılmadı)`);
    }
}

// Terminalden direkt test için (Örn: node sef_motor.js)
if (require.main === module) {
    // Örnek Bir Operasyon Başlat
    sefKarargahMotorunuCalistir("Leopar Desenli Siyah Kazak");
}

module.exports = { sefKarargahMotorunuCalistir };
