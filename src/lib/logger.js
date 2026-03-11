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

// ─── Supabase'e log at (hata durumunda sessizce geç) ─────────────────────────
async function supabaseLog(tip, veri) {
    try {
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'sistem_geneli',
            islem_tipi: tip.toUpperCase(),
            kullanici_adi: 'SISTEM_LOGGER',
            eski_veri: veri,
        }]);
    } catch {
        // Log hatası sistemi durdurmamalı
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const logger = {
    /** AI kararı logu — HermAI tarafından kullanılır (Kriter VV3, 80) */
    async aiDecision(veri) {
        if (IS_DEV) console.log('[HermAI Karar]', veri);
        // 1. Genel log tablosu
        supabaseLog('AI_KARAR', veri);
        // 2. Özel HermAI karar tablosu (Karargah panelinden görüntülenebilir)
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
                }]);
            } catch { /* log hatası sistemi durdurmamalı */ }
        }
    },

    /** API hata logu */
    error(mesaj, veri = {}) {
        if (IS_DEV) console.error('[HATA]', mesaj, veri);
        supabaseLog('HATA', { mesaj, ...veri });
    },

    /** Kritik işlem logu (silme, onay, kilit) */
    kritikIslem(mesaj, veri = {}) {
        if (IS_DEV) console.warn('[KRİTİK]', mesaj, veri);
        supabaseLog('KRITIK_ISLEM', { mesaj, ...veri });
    },

    /** Kullanıcı işlem logu */
    kullanici(islem, veri = {}) {
        if (IS_DEV) console.info('[KULLANICI]', islem, veri);
        supabaseLog('KULLANICI_ISLEM', { islem, ...veri });
    },

    /** Geliştirme ortamı debug logu (production'da sessiz) */
    debug(mesaj, veri = {}) {
        if (IS_DEV) console.debug('[DEBUG]', mesaj, veri);
    },
};

export default logger;
