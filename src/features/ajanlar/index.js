/**
 * 📦 M19 AI Ajanlar — Barrel File | Route: /ajanlar
 * Public API:
 *   import { AjanlarMainContainer }   from '@/features/ajanlar';
 *   import { useAjanlar }             from '@/features/ajanlar';
 *   import { ajanlarService }         from '@/features/ajanlar';
 */
export { default as AjanlarMainContainer } from './components/AjanlarMainContainer';
export { useAjanlar, VARSAYILAN_KONFIGUR } from './hooks/useAjanlar';
export * as ajanlarService from './services/ajanlarApi';
export { AJAN_LISTESI, GOREV_TIPLERI, ONCELIK, BOS_FORM } from './services/ajanlarApi';
