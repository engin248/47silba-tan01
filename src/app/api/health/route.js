// ═══════════════════════════════════════════════════════════
//  K-17: Sistem Sağlık Endpoint — /api/health
//  GET → Tüm kritik tabloları sorgular, durum döner
//  Cron job veya harici izleme servisi kullanabilir
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
    const basla = Date.now();
    const sonuclar = {};
    let tamam = true;

    // 1. Veritabanı bağlantısı
    try {
        const { count, error } = await supabaseAdmin
            .from('b1_ajan_gorevler')
            .select('id', { count: 'exact', head: true });
        sonuclar.db = error ? { durum: 'hata', hata: error.message } : { durum: 'ok', kayit: count };
        if (error) tamam = false;
    } catch (e) {
        sonuclar.db = { durum: 'hata', hata: 'Bağlantı kurulamadı' };
        tamam = false;
    }

    // 2. Kritik ajan tablosu (b1_ajan_gorevler)
    try {
        const { data, error } = await supabaseAdmin
            .from('b1_ajan_gorevler')
            .select('durum')
            .eq('durum', 'hata')
            .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Son 1 saat
        sonuclar.ajan_hatalar = error
            ? { durum: 'hata', hata: error.message }
            : { durum: 'ok', son_1s_hata_sayisi: data?.length || 0 };
    } catch { sonuclar.ajan_hatalar = { durum: 'atlandi' }; }

    // 3. Sipariş sistemi
    try {
        const { count, error } = await supabaseAdmin
            .from('b2_siparisler')
            .select('id', { count: 'exact', head: true });
        sonuclar.siparisler = error
            ? { durum: 'hata', hata: error.message }
            : { durum: 'ok', toplam: count };
        if (error) tamam = false;
    } catch (e) {
        sonuclar.siparisler = { durum: 'hata', hata: 'Bağlantı kurulamadı' };
        tamam = false;
    }

    // 4. Kasa hareketi
    try {
        const { count, error } = await supabaseAdmin
            .from('b2_kasa_hareketleri')
            .select('id', { count: 'exact', head: true });
        sonuclar.kasa = error
            ? { durum: 'hata', hata: error.message }
            : { durum: 'ok', toplam: count };
    } catch { sonuclar.kasa = { durum: 'atlandi' }; }

    // 5. Son sistem uyarıları
    try {
        const { data, error } = await supabaseAdmin
            .from('b1_sistem_uyarilari')
            .select('oncelik')
            .eq('oncelik', 'kritik')
            .gte('created_at', new Date(Date.now() - 3600000).toISOString());
        sonuclar.uyarilar = { durum: 'ok', kritik_uyari: data?.length || 0 };
    } catch { sonuclar.uyarilar = { durum: 'atlandi' }; }

    const sure = Date.now() - basla;

    return NextResponse.json({
        basarili: tamam,
        durum: tamam ? '✅ TÜM SİSTEMLER ÇALIŞIYOR' : '⚠️ BAZI SİSTEMLERDE SORUN VAR',
        yanit_sure_ms: sure,
        zaman: new Date().toISOString(),
        kontroller: sonuclar,
        versiyon: 'v3.7'
    }, {
        status: tamam ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store',
            'X-Health-Check': tamam ? 'pass' : 'fail',
        }
    });
}
