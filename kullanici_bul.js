// Supabase'deki kullanıcıları bul
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function kullanicilariListele() {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40));

    // public.users tablosu
    const { data: u1, error: e1 } = await sb.from('users').select('id,username,role,aktif').limit(20);
    console.log('\n[public.users]:', e1 ? 'HATA: ' + e1.message : JSON.stringify(u1, null, 2));

    // auth.users - anon key ile göremeyiz ama deneyelim
    const { data: u2, error: e2 } = await sb.rpc('get_users_list').limit ? await sb.rpc('get_users_list') : { data: null, error: { message: 'rpc yok' } };
    console.log('\n[auth.users RPC]:', e2 ? e2.message : JSON.stringify(u2));

    // personel tablosunda da olabilir
    const { data: u3, error: e3 } = await sb.from('personel').select('id,ad_soyad,rol,kullanici_adi').limit(10);
    console.log('\n[public.personel]:', e3 ? 'HATA: ' + e3.message : JSON.stringify(u3, null, 2));

    // login page kodu bul
    const fs = require('fs');
    const path = require('path');

    // .next içinde login sayfasını ara
    const nextLogin = path.join(__dirname, '.next', 'server', 'app', 'login');
    if (fs.existsSync(nextLogin)) {
        console.log('\n[.next/login] VAR:', fs.readdirSync(nextLogin));
    }

    // pages/login.js
    const pagesLogin = path.join(__dirname, 'pages', 'login.js');
    if (fs.existsSync(pagesLogin)) {
        console.log('\n[pages/login.js] İÇERİK:\n', fs.readFileSync(pagesLogin, 'utf8').slice(0, 500));
    }

    // next.config.js
    const nextConf = path.join(__dirname, 'next.config.js');
    if (fs.existsSync(nextConf)) {
        console.log('\n[next.config.js]:\n', fs.readFileSync(nextConf, 'utf8'));
    }

    const nextMjs = path.join(__dirname, 'next.config.mjs');
    if (fs.existsSync(nextMjs)) {
        console.log('\n[next.config.mjs]:\n', fs.readFileSync(nextMjs, 'utf8'));
    }
}

kullanicilariListele().catch(console.error);
