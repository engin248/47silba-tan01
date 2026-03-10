/**
 * 📦 M2 Kumaş & Materyal Arşivi — Barrel File | Route: /kumas
 * Public API:
 *   import { KumasMainContainer } from '@/features/kumas';
 *   import { useKumas }           from '@/features/kumas';
 *   import { kumasService }       from '@/features/kumas';
 */
export { default as KumasMainContainer } from './components/KumasMainContainer';
export { useKumas } from './hooks/useKumas';
export * as kumasService from './services/kumasApi';
export { KUMAS_TIPLERI, AKSESUAR_TIPLERI, BIRIMLER, BOSH_KUMAS, BOSH_AKS } from './services/kumasApi';
