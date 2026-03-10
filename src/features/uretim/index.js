/**
 * 📦 Üretim Bandı — Barrel File | Route: /uretim
 *
 * Public API — dışarıdan sadece bunlar görünür:
 *   import { UretimMainContainer }  from '@/features/uretim';
 *   import { useIsEmri }            from '@/features/uretim';
 *   import { uretimService }        from '@/features/uretim';
 */

// ── Bileşenler ───────────────────────────────────────────────────────────────
export { default as UretimMainContainer } from './components/UretimSayfasi';

// ── Hook ────────────────────────────────────────────────────────────────────
export { useIsEmri, DEPARTMANLAR, ST_RENK, ST_LABEL, MALIYET_TIPLERI } from './hooks/useIsEmri';

// ── Servis (namespace olarak yeniden export) ─────────────────────────────────
// Kullanım: uretimService.fetchUretimVerileri()
//           uretimService.createIsEmri({ model_id, quantity })
export * as uretimService from './services/uretimApi';

// Ayrıca direkt import da desteklenir:
// import { fetchUretimVerileri, createIsEmri } from '@/features/uretim/services/uretimApi'

