/**
 * NİZAM — Supabase Tablo Kontrol + Seed Scripti
 * Çalıştırma: node supabase/run_migration.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('HATA: NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY .env.local icinde tanimli degil!');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function tabloKontrol(tabloAdi) {
    const { error } = await supabase.from(tabloAdi).select('*').limit(1);
    if (error && error.code === '42P01') return 'YOK';
    if (error) return 'HATA: ' + error.message;
    return 'MEVCUT';
}

async function migrasyonCalistir() {
    console.log('NiZAM Migrasyon Kontrol Basladi...\n');

    const t1 = await tabloKontrol('m4_finansal_kasa_arsivi');
    const t2 = await tabloKontrol('m4_fiziksel_satin_almalar');
    const t3 = await tabloKontrol('sistem_parametreleri');

    console.log('[Tablo 1] m4_finansal_kasa_arsivi   :', t1);
    console.log('[Tablo 2] m4_fiziksel_satin_almalar :', t2);
    console.log('[Tablo 3] sistem_parametreleri       :', t3);

    if (t3 === 'MEVCUT') {
        console.log('\nSeed data ekleniyor...');
        const { error: seedErr } = await supabase.from('sistem_parametreleri').upsert([
            { anahtar: 'kumas_metre_fiyati', deger: '140', aciklama: 'Kumas metre fiyati (TL)' },
            { anahtar: 'hedef_satis_fiyati', deger: '900', aciklama: 'Hedef satis fiyati (TL)' }
        ], { onConflict: 'anahtar' });
        if (seedErr) console.log('Seed hatasi:', seedErr.message);
        else console.log('Seed data OK.');
    }

    console.log('\n--- SONUC ---');
    if (t1 !== 'MEVCUT' || t2 !== 'MEVCUT' || t3 !== 'MEVCUT') {
        console.log('EKSIK TABLOLAR VAR!');
        console.log('Supabase Dashboard -> SQL Editor acip asagidaki dosyayi calistirin:');
        console.log('  supabase/migrations/20260327_nizam_eksik_tablolar.sql');
    } else {
        console.log('TUM TABLOLAR MEVCUT. Sistem hazir.');
    }
}

migrasyonCalistir().catch(e => {
    console.error('Beklenmeyen hata:', e.message);
    process.exit(1);
});
