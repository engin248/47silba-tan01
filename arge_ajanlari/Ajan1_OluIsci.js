const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''; // [FIX] hardcoded URL kaldırıldı
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // [FIX] fake-key kaldırıldı — ENV'den al

const supabase = createClient(supabaseUrl, supabaseKey);

async function veriTopla() {
    console.log("════════════════════════════════════════════════════════════");
    console.log("🕷️ AJAN 1 (ÖLÜ İŞÇİ) UYANDI: Piyasa Taraması Başlatılıyor...");
    console.log("════════════════════════════════════════════════════════════\n");

    // Canlı kazıma verileri simülasyonu
    const mockData = [
        {
            product_name: 'Zara Siyah Oversize Suni Deri Biker Ceket',
            category: 'Dış Giyim',
            style: 'Streetwear',
            fabric: 'Suni Deri',
            color: 'Siyah',
            price_range: '1200 - 1500',
            image_url: 'https://static.zara.net/photos///2024/V/0/1/p/3046/028/800/2/w/400/3046028800_6_1_1.jpg',
            source_url: 'https://zara.com/tr/tr/suni-deri-ceket'
        },
        {
            product_name: 'Trendyol Man Antrasit Regular Fit Kaşe Kaban',
            category: 'Dış Giyim',
            style: 'Classic',
            fabric: 'Kaşe',
            color: 'Antrasit',
            price_range: '899 - 1100',
            image_url: 'https://cdn.dsmcdn.com/ty1019/product/media/images/prod/PIM/20231016/16/22fa6e7f-b844-46d5-a7b3-2ea6eeab5f6c/1_org_zoom.jpg',
            source_url: 'https://trendyol.com/kaban'
        },
        {
            product_name: 'Shein Haki Yeşil Paraşüt Kargo Pantolon',
            category: 'Alt Giyim',
            style: 'Streetwear',
            fabric: 'Paraşüt Kumaş',
            color: 'Haki',
            price_range: '400 - 650',
            image_url: 'https://img.ltwebstatic.com/images3_pi/2023/11/02/b0/1698910085cd31d3f971510b6ce7970d4b1a45_thumbnail_405x552.webp',
            source_url: 'https://shein.com/kargo'
        }
    ];

    for (let item of mockData) {
        console.log(`[+] Hedef Saptandı: ${item.product_name}`);

        const { data, error } = await supabase
            .from('b1_arge_products')
            .insert([item])
            .select();

        if (error) {
            console.error("[-] VERİTABANI HATASI:", error.message);
        } else {
            console.log(`[+] B1 Veritabanına Mühürlendi. ID: ${data[0].id}\n`);
        }
    }

    console.log("════════════════════════════════════════════════════════════");
    console.log("🛑 AJAN 1 GÖREVİ TAMAMLADI. Standby moduna geçiliyor...");
    console.log("════════════════════════════════════════════════════════════");
}

veriTopla();
