/**
 * AJAN 2 — YARGIÇ (Skor Hesaplayıcı ve Karar Verici)
 * Görev: b1_arge_trendler tablosundaki 'inceleniyor' trendleri değerlendirip
 *        talep_skoru ve açıklama günceller, karar üretir.
 * Çalıştır: node arge_ajanlari/Ajan2_Yargic.js
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

const HEDEF_TABLO = 'b1_arge_trendler';
const AJAN_ADI = 'Trend Kâşifi';

/**
 * THE ORDER Formülü: (Satış %35) + (Sosyal %30) + (Rakip %20) + (Sezon %15)
 * Gerçek piyasa verileri entegre edilene kadar platform bazlı ağırlıklandırma kullanılır.
 */
function skorHesapla(trend) {
    // Platform ağırlıkları (gerçek platform popülaritesine göre)
    const platformKatsayisi = {
        trendyol: 1.0,
        amazon: 0.9,
        instagram: 0.85,
        pinterest: 0.7,
        diger: 0.6,
    };

    // Kategori sezon uyumu (Mart 2026 - İlkbahar)
    const sezonUyumu = {
        gomlek: 10,      // Keten, yazlık — tam sezon
        dis_giyim: 5,    // Kaban bitti, ceket başlıyor
        pantolon: 8,
        elbise: 9,
        spor: 8,
        ic_giyim: 7,
        aksesuar: 7,
        diger: 6,
    };

    const platform = trend.platform || 'diger';
    const kategori = trend.kategori || 'diger';
    const mevcutSkor = parseInt(trend.talep_skoru) || 5;

    // Bileşenler (10 üzerinden normalize)
    const satisBilesen = Math.min(10, mevcutSkor * (platformKatsayisi[platform] || 0.6));
    const sosyalBilesen = Math.min(10, mevcutSkor * 0.9 + (platform === 'instagram' ? 1.5 : 0));
    const rakipBilesen = Math.min(10, 5 + Math.random() * 3); // Rakip verisi henüz otomatik yok
    const sezonBilesen = sezonUyumu[kategori] || 6;

    // THE ORDER Formülü
    const nihaiFirsat = (satisBilesen * 0.35) + (sosyalBilesen * 0.30) + (rakipBilesen * 0.20) + (sezonBilesen * 0.15);

    // 1-10 aralığına normalize
    return Math.min(10, Math.max(1, Math.round(nihaiFirsat)));
}

function kararUret(skor) {
    if (skor >= 9) return { karar: 'ÜRETİM', emoji: '🚀' };
    if (skor >= 7) return { karar: 'TEST ÜRETİMİ (Numune)', emoji: '🧪' };
    if (skor >= 5) return { karar: 'İZLEME', emoji: '👁️' };
    return { karar: 'REDDET', emoji: '❌' };
}

async function ajanYargic() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('⚖️  AJAN 2 (YARGIÇ) UYANDI — Analiz ve Karar Sistemi Devrede');
    console.log('════════════════════════════════════════════════════════════\n');

    // Sadece 'inceleniyor' durumundaki ve ajan tarafından eklenen trendleri al
    const { data: trendler, error } = await supabase
        .from(HEDEF_TABLO)
        .select('*')
        .eq('durum', 'inceleniyor')
        .like('baslik', '[AJAN]%'); // Sadece Ajan1'in eklediği kayıtlar

    if (error) {
        console.error('[-] Veri çekme hatası:', error.message);
        return;
    }

    if (!trendler || trendler.length === 0) {
        console.log('ℹ️  Yargılanacak yeni ajan trendi bulunamadı.');
        return;
    }

    console.log(`📋 ${trendler.length} trend yargılanacak...\n`);

    let guncellenen = 0;
    let reddedilen = 0;

    for (const trend of trendler) {
        console.log(`[+] Yargıya Çıkan: ${trend.baslik}`);

        const yeniSkor = skorHesapla(trend);
        const { karar, emoji } = kararUret(yeniSkor);

        const yargicNotu = `\n\n---\n⚖️ YARGIÇ KARARI (Ajan2 Otomatik): ${emoji} ${karar}\n📊 Nihai Skor: ${yeniSkor}/10\n🏷️ THE ORDER Formülü: (Satış %35 + Sosyal %30 + Rakip %20 + Sezon %15)`;
        const guncelAciklama = (trend.aciklama || '') + yargicNotu;

        // b1_arge_trendler tablosunu güncelle — doğru tablo!
        const { error: updateError } = await supabase
            .from(HEDEF_TABLO)
            .update({
                talep_skoru: yeniSkor,
                aciklama: guncelAciklama,
                // Yüksek skorlu trendler otomatik onaylanabilir (isteğe bağlı)
                // durum: yeniSkor >= 9 ? 'onaylandi' : 'inceleniyor',
            })
            .eq('id', trend.id);

        if (updateError) {
            console.error(`    [-] GÜNCELLEME HATASI: ${updateError.message}`);
        } else {
            console.log(`    -> Eski Skor: ${trend.talep_skoru} | Yeni Skor: ${yeniSkor}/10`);
            console.log(`    -> YARGI KARARI: ${emoji} ${karar}\n`);
            guncellenen++;

            if (karar === 'REDDET') reddedilen++;

            // Ajan log
            await supabase.from('b1_agent_loglari').insert([{
                ajan_adi: AJAN_ADI,
                islem_tipi: 'Trend Yargılandı (Ajan2)',
                mesaj: `${trend.baslik} → ${karar} | Skor: ${yeniSkor}/10`,
                sonuc: karar === 'REDDET' ? 'basarisiz' : 'basarili',
                created_at: new Date().toISOString(),
            }]);
        }
    }

    console.log('════════════════════════════════════════════════════════════');
    console.log(`✅ Yargıç tamamladı. Güncellenen: ${guncellenen} | Reddedilen: ${reddedilen}`);
    console.log('════════════════════════════════════════════════════════════');
}

ajanYargic().catch(e => {
    console.error('KRİTİK HATA:', e.message);
    process.exit(1);
});
