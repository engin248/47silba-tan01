// ═══════════════════════════════════════════════════════════
//  K-17: Sistem Sağlık Endpoint — /api/health
//  GET → Tüm kritik tabloları PARALEL sorgular, durum döner
//  Kök Neden Fix: Sıralı → Promise.all() (10s → ~2s)
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
    const basla = Date.now();

    // TÜM SORGULAR PARALEL — Promise.all() ile eş zamanlı çalışır
    const [dbSonuc, ajanSonuc, siparisSonuc, kasaSonuc, uyariSonuc] = await Promise.allSettled([

        // 1. Veritabanı bağlantısı + temel tablo
        supabaseAdmin
            .from('b1_ajan_gorevler')
            .select('id', { count: 'exact', head: true }),

        // 2. Kritik ajan tablosu — son 1 saatteki hatalar
        supabaseAdmin
            .from('b1_ajan_gorevler')
            .select('durum')
            .eq('durum', 'hata')
            .gte('created_at', new Date(Date.now() - 3600000).toISOString()),

        // 3. Sipariş sistemi
        supabaseAdmin
            .from('b2_siparisler')
            .select('id', { count: 'exact', head: true }),

        // 4. Kasa hareketi
        supabaseAdmin
            .from('b2_kasa_hareketleri')
            .select('id', { count: 'exact', head: true }),

        // 5. Son sistem uyarıları
        supabaseAdmin
            .from('b1_sistem_uyarilari')
            .select('seviye')
            .eq('seviye', 'kritik')
            .gte('created_at', new Date(Date.now() - 3600000).toISOString()),
    ]);

    // ── Sonuçları çözümle ───────────────────────────────────
    let tamam = true;
    const sonuclar = {};

    // 1. DB
    if (dbSonuc.status === 'fulfilled' && !dbSonuc.value.error) {
        sonuclar.db = { durum: 'ok', kayit: dbSonuc.value.count };
    } else {
        sonuclar.db = { durum: 'hata', hata: dbSonuc.value?.error?.message || 'Bağlantı kurulamadı' };
        tamam = false;
    }

    // 2. Ajan Hatalar
    if (ajanSonuc.status === 'fulfilled' && !ajanSonuc.value.error) {
        sonuclar.ajan_hatalar = { durum: 'ok', son_1s_hata_sayisi: ajanSonuc.value.data?.length || 0 };
    } else {
        sonuclar.ajan_hatalar = { durum: 'atlandi' };
    }

    // 3. Siparişler
    if (siparisSonuc.status === 'fulfilled' && !siparisSonuc.value.error) {
        sonuclar.siparisler = { durum: 'ok', toplam: siparisSonuc.value.count };
    } else {
        sonuclar.siparisler = { durum: 'hata', hata: siparisSonuc.value?.error?.message || 'Bağlantı kurulamadı' };
        tamam = false;
    }

    // 4. Kasa
    if (kasaSonuc.status === 'fulfilled' && !kasaSonuc.value.error) {
        sonuclar.kasa = { durum: 'ok', toplam: kasaSonuc.value.count };
    } else {
        sonuclar.kasa = { durum: 'atlandi' };
    }

    // 5. Uyarılar
    if (uyariSonuc.status === 'fulfilled' && !uyariSonuc.value.error) {
        sonuclar.uyarilar = { durum: 'ok', kritik_uyari: uyariSonuc.value.data?.length || 0 };
    } else {
        sonuclar.uyarilar = { durum: 'atlandi' };
    }

    const sure = Date.now() - basla;

    return NextResponse.json({
        basarili: tamam,
        durum: tamam ? '✅ TÜM SİSTEMLER ÇALIŞIYOR' : '⚠️ BAZI SİSTEMLERDE SORUN VAR',
        yanit_sure_ms: sure,
        zaman: new Date().toISOString(),
        kontroller: sonuclar,
        versiyon: 'v3.8',
    }, {
        status: tamam ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store',
            'X-Health-Check': tamam ? 'pass' : 'fail',
        }
    });
}
