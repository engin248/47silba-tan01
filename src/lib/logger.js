/**
 * src/lib/logger.js — Sistem Logger
 *
 * Tüm AI kararlarını, API hatalarını ve kritik işlemleri loglar.
 * Supabase b0_sistem_loglari tablosuna yazar (Kriter 55, 80, VV3).
 *
 * Kullanım:
 *   import { logger } from '@/lib/logger';
 *   logger.aiDecision({ input, explanation });
 *   logger.error('API hatası', { url, status });
 */
import { supabase } from './supabase';

const IS_DEV = process.env.NODE_ENV === 'development';

// ─── MIMARI DÜZELTME: Kullanıcı bağlamı enjeksiyonu ────────────────
// ESKİ: kullanici_adi = 'SISTEM_LOGGER' (tüm loglar aynı isimle)
// YENİ: Gerçek kullanıcı grubu/zaaman log'a işleniyor
function supabaseLog(tip, veri, kullanici = null) {
    const kayit = {
        tablo_adi: veri?.tablo || 'sistem_geneli',
        islem_tipi: tip.toUpperCase(),
        kullanici_adi: kullanici?.grup || kullanici?.label || 'SISTEM',
        kullanici_zaman: new Date().toISOString(),
        eski_veri: veri,
    };
    // Fire-and-forget — log hatası sistemi durdurmamalı
    supabase.from('b0_sistem_loglari').insert([kayit]).then().catch(() => { });
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const logger = {
    /** AI kararı logu — HermAI tarafından kullanılır (Kriter VV3, 80) */
    async aiDecision(veri, kullanici = null) {
        if (IS_DEV) console.log('[HermAI Karar]', veri);
        supabaseLog('AI_KARAR', veri, kullanici);
        if (veri?.tip === 'HERM_LOOP' || veri?.tip === 'HERM_REJECTED') {
            try {
                await supabase.from('b0_herm_ai_kararlar').insert([{
                    birim: veri.birim || 'genel',
                    aciklama_tr: veri.yerelAciklama || null,
                    genel_ozet: veri.genelOzet || null,
                    durum: veri.tip === 'HERM_REJECTED' ? 'rejected'
                        : (veri.tutarli ? 'explained' : 'risk'),
                    ana_metrik: veri.anaMetrik || null,
                    gercekcilik: veri.gercekcilikDurumu || 'kontrol_edilmedi',
                    yapan_kullanici: kullanici?.grup || 'sistem',
                }]);
            } catch { }
        }
    },

    /** API hata logu */
    error(mesaj, veri = {}, kullanici = null) {
        if (IS_DEV) console.error('[HATA]', mesaj, veri);
        supabaseLog('HATA', { mesaj, ...veri }, kullanici);
    },

    /** Kritik işlem logu (silme, onay, kilit) — kullanıcı zorunlu */
    kritikIslem(mesaj, veri = {}, kullanici = null) {
        if (IS_DEV) console.warn('[KRİTİK]', mesaj, veri, '| Kullanıcı:', kullanici?.grup);
        supabaseLog('KRITIK_ISLEM', {
            mesaj,
            eski_deger: veri?.eski || null,
            yeni_deger: veri?.yeni || null,
            ...veri
        }, kullanici);
    },

    /** Kullanıcı işlem logu */
    kullanici(islem, veri = {}, kullaniciObj = null) {
        if (IS_DEV) console.info('[KULLANICI]', islem, veri);
        supabaseLog('KULLANICI_ISLEM', { islem, ...veri }, kullaniciObj);
    },

    /** Geliştirme ortaı debug logu (production'da sessiz) */
    debug(mesaj, veri = {}) {
        if (IS_DEV) console.debug('[DEBUG]', mesaj, veri);
    },
};


export default logger;
