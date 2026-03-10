/**
 * features/imalat — Barrel File
 */
export { default as ImalatMainContainer } from './components/ImalatMainContainer';
export { useImalat } from './hooks/useImalat'; // [B-13 FIX] büyük İ → küçük i
export { imalatEmirleriGetir, imalatEmriKaydet, imalatDurumGuncelle, imalatEmriSil, imalatKanaliKur, BOSH_FORM, DURUMLAR, DURUM_RENK } from './services/imalatApi';
