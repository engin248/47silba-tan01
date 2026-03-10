// /karargah → Ana Karargah Sayfasına Yönlendirme
// Asıl Karargah dashboard'u src/app/page.js (/) içinde tanımlıdır.
import { redirect } from 'next/navigation';

export default function KarargahYonlendirme() {
    redirect('/');
}
