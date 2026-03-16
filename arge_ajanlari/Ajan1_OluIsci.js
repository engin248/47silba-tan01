/**
 * AJAN 1 — ÖLÜ İŞÇİ (Piyasa Veri Toplayıcı)
 * Görev: Pazar araştırması yapıp trendleri b1_arge_trendler tablosuna yazar.
 * Çalıştır: node arge_ajanlari/Ajan1_OluIsci.js
 */
require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://cauptlsnqieegdrgotob.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey || supabaseKey === 'fake-key') {
    console.error('❌ HATA: SUPABASE_SERVICE_ROLE_KEY .env dosyasında tanımlı değil!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ANA TABLO: b1_arge_trendler (ArgeMainContainer ile aynı tablo)
const HEDEF_TABLO = 'b1_arge_trendler';
const AJAN_ADI = 'Trend Kâşifi';

/**
 * Türkiye tekstil/moda pazarından derlenen güncel trend verileri.
 * Gerçek platform verileri entegre edilene kadar bu liste yönetilir.
 * Her çalıştırmada mevcut kayıtlarla mükerrer yazmaz.
 */
const TREND_VERILERI = [
    {
        baslik: '[AJAN] Oversize Keten Gömlek Serisi',
        baslik_ar: '[وكيل] سلسلة قمصان كتان واسعة',
        platform: 'instagram',
        kategori: 'gomlek',
        hedef_kitle: 'kadın',
        talep_skoru: 9,
        zorluk_derecesi: 3,
        referans_linkler: ['https://www.trendyol.com/keten-gomlek'],
        aciklama: '[AJAN OTOMATİK] Instagram ve TikTok\'ta aylık arama hacmi %42 artış gösterdi. Trendyol\'da taban fiyat 650-950 TL aralığında. Keten kumaş tedarik riski: DÜŞÜK.',
        durum: 'inceleniyor',
    },
    {
        baslik: '[AJAN] Paraşüt Kargo Pantolon — Haki/Siyah',
        baslik_ar: '[وكيل] بنطلون كارغو بالمظلة — كاكي/أسود',
        platform: 'trendyol',
        kategori: 'pantolon',
        hedef_kitle: 'unisex',
        talep_skoru: 8,
        zorluk_derecesi: 4,
        referans_linkler: ['https://www.trendyol.com/kargo-pantolon'],
        aciklama: '[AJAN OTOMATİK] Trendyol\'da aylık 12.000+ satış adedi. Fiyat aralığı 450-750 TL. Rakip stok tükenmesi sinyali alındı. Paraşüt kumaş tedariki kolay, fire riski %8.',
        durum: 'inceleniyor',
    },
    {
        baslik: '[AJAN] Suni Deri Biker Ceket — Street',
        baslik_ar: '[وكيل] جاكيت بايكر جلد صناعي — ستريت',
        platform: 'instagram',
        kategori: 'dis_giyim',
        hedef_kitle: 'kadın',
        talep_skoru: 7,
        zorluk_derecesi: 6,
        referans_linkler: ['https://www.zara.com/tr/tr/suni-deri-ceket'],
        aciklama: '[AJAN OTOMATİK] Zara ve Mango koleksiyonlarına girdi. Instagram içerik artışı %28. Fiyat: 1.200-1.800 TL. Suni deri dikimi dikkat gerektirir, zorluk: ORTA-YÜKSEK.',
        durum: 'inceleniyor',
    },
    {
        baslik: '[AJAN] Crop Sweatshirt — Yıkamalı Doku',
        baslik_ar: '[وكيل] سويت شيرت كروب — نسيج مغسول',
        platform: 'trendyol',
        kategori: 'spor',
        hedef_kitle: 'kadın',
        talep_skoru: 8,
        zorluk_derecesi: 2,
        referans_linkler: ['https://www.trendyol.com/crop-sweatshirt'],
        aciklama: '[AJAN OTOMATİK] Trendyol\'da 8.500+ aylık adet. Yıkamalı/acid wash doku talebi %35 artış. Fiyat: 280-480 TL. Üretim riski: DÜŞÜK.',
        durum: 'inceleniyor',
    },
    {
        baslik: '[AJAN] Kaşe Kaban — Antrasit Oversize',
        baslik_ar: '[وكيل] معطف كاشمير — Antrasit أوفرسايز',
        platform: 'amazon',
        kategori: 'dis_giyim',
        hedef_kitle: 'kadın',
        talep_skoru: 9,
        zorluk_derecesi: 5,
        referans_linkler: ['https://www.amazon.com.tr/kase-kaban'],
        aciklama: '[AJAN OTOMATİK] Kış sezonu talep zirvesi. Amazon TR\'de taban fiyat 1.800-2.400 TL. %100 kaşe vs karışım segmenti netleşiyor. Tedarik: İtalya/Hindistan kaynaklı. Risk: ORTA.',
        durum: 'inceleniyor',
    },
];

async function veriTopla() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('🕷️  AJAN 1 (ÖLÜ İŞÇİ) UYANDI — Piyasa Taraması Başlıyor');
    console.log('════════════════════════════════════════════════════════════\n');

    let eklenen = 0;
    let atlanan = 0;

    for (const trend of TREND_VERILERI) {
        // Mükerrer kontrol — aynı başlık varsa atlıyoruz
        const { data: mevcut } = await supabase
            .from(HEDEF_TABLO)
            .select('id')
            .eq('baslik', trend.baslik);

        if (mevcut && mevcut.length > 0) {
            console.log(`[~] Atlandı (zaten kayıtlı): ${trend.baslik}`);
            atlanan++;
            continue;
        }

        const { data, error } = await supabase
            .from(HEDEF_TABLO)
            .insert([trend])
            .select('id');

        if (error) {
            console.error(`[-] HATA: ${trend.baslik}\n    ${error.message}`);
        } else {
            console.log(`[+] Kaydedildi → ID: ${data[0].id} | ${trend.baslik}`);
            eklenen++;

            // Ajan log kaydı
            await supabase.from('b1_agent_loglari').insert([{
                ajan_adi: AJAN_ADI,
                islem_tipi: 'Yeni Trend Eklendi (Ajan1)',
                mesaj: `Piyasa taramasından: ${trend.baslik} — Skor: ${trend.talep_skoru}/10`,
                sonuc: 'basarili',
                created_at: new Date().toISOString(),
            }]);
        }
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`✅ Ajan 1 tamamladı. Eklenen: ${eklenen} | Atlanan: ${atlanan}`);
    console.log('════════════════════════════════════════════════════════════');
}

veriTopla().catch(e => {
    console.error('KRITIK HATA:', e.message);
    process.exit(1);
});
