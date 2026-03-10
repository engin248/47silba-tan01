/**
 * 📦 M10 Siparişler — Barrel File | Route: /siparisler
 * Public API:
 *   import { SiparislerMainContainer }  from '@/features/siparisler';
 *   import { useSiparisler }            from '@/features/siparisler';
 *   import { siparislerService }        from '@/features/siparisler';
 */
export { default as SiparislerMainContainer } from './components/SiparislerMainContainer';
export { useSiparisler } from './hooks/useSiparisler';
export * as siparislerService from './services/siparislerApi';
export { KANALLAR, DURUMLAR, DURUM_RENK, DURUM_LABEL, PARA_BIRIMLERI, BOSH_FORM } from './services/siparislerApi';
