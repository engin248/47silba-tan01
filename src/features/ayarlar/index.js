/**
 * 📦 M17 Sistem Ayarları — Barrel File | Route: /ayarlar
 *
 * Kullanım:
 *   import { AyarlarMainContainer } from '@/features/ayarlar';
 *   import { useAyarlar }           from '@/features/ayarlar';
 *   import { ayarlariGetir }        from '@/features/ayarlar';
 */

// Ana bileşen (Tailwind yeniden yazılmış — logo upload + firma profili + bildirimler)
export { default as AyarlarMainContainer } from './components/AyarlarRefactored';

// Hook (state + Supabase + offline queue)
export { useAyarlar, VARSAYILAN_AYARLAR } from './hooks/useAyarlar';

// Servisler (test ve server-side kullanım)
export { ayarlariGetir, ayarlariKaydet, logoYukle, ayarlarKanaliKur } from './services/ayarlarApi';
