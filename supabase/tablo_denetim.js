const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLOLAR = [
    ['b0_sistem_loglari', 'Sistem olaylari'],
    ['b0_arsiv', 'Arsivlenen veriler'],
    ['b0_herm_ai_kararlar', 'Hermania AI kararlar'],
    ['b0_yetki_ayarlari', 'Kullanici yetki tanimlari'],
    ['b0_bildirim_loglari', 'Bildirim gecmisi'],
    ['b1_arge_products', 'Ham urun verileri'],
    ['b1_arge_strategy', 'Yargic karar ciktilari'],
    ['b1_arge_trend_data', 'Trend analiz verileri'],
    ['b1_arge_cost_analysis', 'Maliyet analizi'],
    ['b1_arge_risk_analysis', 'Risk analizi'],
    ['b1_arge_trendler', 'Trend listesi'],
    ['b1_agent_loglari', 'Ajan islem loglari'],
    ['b1_ajan_gorevler', 'Ajan gorev kuyruklari'],
    ['b1_sistem_uyarilari', 'Sistem uyari mesajlari'],
    ['b1_uretim_kayitlari', 'Uretim islemleri'],
    ['b1_muhasebe_raporlari', 'Muhasebe raporlari'],
    ['b1_personel', 'Personel bilgileri'],
    ['b1_ai_is_kuyrugu', 'AI islem kuyrugu'],
    ['b2_siparisler', 'Musteri siparisleri'],
    ['b2_urun_katalogu', 'Urun katalogu ve stok'],
    ['b2_kasa_hareketleri', 'Kasa hareketleri'],
    ['b3_uretilen_tasarimlar', 'AI tasarim ciktilari'],
    ['m2_finans_veto', 'M2 Kar kilidi veto'],
    ['m2_finansal_kilit', 'M2 finansal kilit'],
    ['m4_finansal_kasa_arsivi', 'M4 Muhasebe ciktisi'],
    ['m4_fiziksel_satin_almalar', 'M4 Satin alma ciktisi'],
    ['m4_yayindaki_vitrin_urunleri', 'Canli vitrin urunleri'],
    ['bot_tracking_logs', 'Sentinel izleme loglari'],
    ['notifications', 'Bildirim zili'],
    ['camera_events', 'Kamera olay loglari'],
    ['sistem_parametreleri', 'Dinamik sistem ayarlari'],
];

async function main() {
    process.stdout.write('\nNiZAM TABLO DENETiM RAPORU\n');
    process.stdout.write('='.repeat(65) + '\n');
    process.stdout.write('Tablo Adi                        Durum          Satir Sayisi\n');
    process.stdout.write('-'.repeat(65) + '\n');

    let mevcut = 0, eksik = 0, hata = 0;
    const sorunlar = [];

    for (const [ad, aciklama] of TABLOLAR) {
        const { data, error } = await supabase.from(ad).select('id').limit(1);
        let durum, satirSayi = '';

        if (!error) {
            const { count } = await supabase.from(ad).select('*', { count: 'exact', head: true });
            durum = 'MEVCUT';
            satirSayi = (count || 0) + ' satir';
            mevcut++;
        } else if (error.code === '42P01') {
            durum = 'EKSIK';
            eksik++;
            sorunlar.push('EKSIK  | ' + ad + ' | ' + aciklama);
        } else {
            durum = 'HATA(' + error.code + ')';
            hata++;
            sorunlar.push('HATA   | ' + ad + ' | ' + error.message.substring(0, 60));
        }

        process.stdout.write(
            (ad + ' ').padEnd(33) +
            durum.padEnd(16) +
            satirSayi + '\n'
        );
    }

    process.stdout.write('-'.repeat(65) + '\n');
    process.stdout.write('TOPLAM: ' + mevcut + ' MEVCUT | ' + eksik + ' EKSIK | ' + hata + ' HATA\n');

    if (sorunlar.length > 0) {
        process.stdout.write('\nSORONLAR:\n');
        sorunlar.forEach(s => process.stdout.write('  ' + s + '\n'));
    }
}

main().catch(e => { process.stderr.write('Hata: ' + e.message + '\n'); process.exit(1); });
