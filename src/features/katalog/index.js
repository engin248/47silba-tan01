/**
 * 📦 Katalog — Barrel File | Route: /katalog
 *
 * ✅ Ana bileşen (Tailwind + useKatalog hook):
 *   import { KatalogMainContainer } from '@/features/katalog';
 *
 * ✅ Hook (direkt state erişimi için):
 *   import { useKatalog } from '@/features/katalog';
 *
 * ✅ Servis (test veya server-side için):
 *   import { tumUrunleriGetir } from '@/features/katalog/services/katalogApi';
 */

// Birincil bileşen
export { default as KatalogMainContainer } from './components/KatalogMainContainer';

// Hook + sabitler
export { useKatalog, ANA_KATEGORILER, ALT_KATEGORILER, DURUMLAR, BOS_URUN } from './hooks/useKatalog';

// USD_KUR servis katmanından geliyor
export { USD_KUR, tumUrunleriGetir, urunKaydet, urunSil, siparisOtofillUrl, skuKombinasyonlariUret } from './services/katalogApi';

