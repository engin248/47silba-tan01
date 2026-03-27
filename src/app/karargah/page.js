// /karargah → Ana Karargah Sayfasına Ynlendirme
// Asıl Karargah dashboard'u src/app/page.js (/) iinde tanımlıdır.
import { redirect } from 'next/navigation';

export default function KarargahYonlendirme() {
    redirect('/');
}
