/**
 * features/kalip/services/kalipApi.js
 * Tablolar: b1_model_kaliplari (kalıplar), b1_model_taslaklari (modeller), b1_arge_trendler
 * (MainContainer'dan doğrulanan gerçek tablo adları)
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function kaliplariGetir() {
    const [kalRes, modRes, treRes] = await Promise.allSettled([
        supabase.from('b1_model_kaliplari')
            .select('*, b1_model_taslaklari(model_adi,model_kodu)')
            .order('created_at', { ascending: false }).limit(200),
        supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500),
        supabase.from('b1_arge_trendler').select('id,baslik,baslik_ar').eq('durum', 'onaylandi').limit(100),
    ]);
    return {
        kalipler: kalRes.status === 'fulfilled' ? (kalRes.value.data || []) : [],
        modeller: modRes.status === 'fulfilled' ? (modRes.value.data || []) : [],
        trendler: treRes.status === 'fulfilled' ? (treRes.value.data || []) : [],
    };
}

export async function kalipKaydet(payload) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_model_kaliplari', 'INSERT', payload);
        return { offline: true };
    }
    // Mükerrer kontrol
    const { data: mevcut } = await supabase.from('b1_model_kaliplari').select('id')
        .eq('model_id', payload.model_id).eq('kalip_adi', payload.kalip_adi?.trim()).maybeSingle();
    if (mevcut) throw new Error('Bu model için aynı adlı kalıp zaten var!');
    const { error } = await supabase.from('b1_model_kaliplari').insert([payload]);
    if (error) throw error;
    return { offline: false };
}

export async function kalipGuncelle(id, payload) {
    const { error } = await supabase.from('b1_model_kaliplari').update(payload).eq('id', id);
    if (error) throw error;
}

export async function kalipSil(id, kullaniciLabel) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b1_model_kaliplari', islem_tipi: 'SILME',
        kullanici_adi: kullaniciLabel || 'Kalıp Sorumlusu', eski_veri: { id }
    }]).catch(() => { });
    const { error } = await supabase.from('b1_model_kaliplari').delete().eq('id', id);
    if (error) throw error;
}

export function kalipKanaliKur(onChange) {
    return supabase.channel('kalip-kanal')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_kaliplari' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_taslaklari' }, onChange)
        .subscribe();
}

export const BOSH_FORM = { model_id: '', kalip_kodu: '', kalip_adi: '', bedenler: [], gorsel_url: '', notlar: '' };
export const BEDENLER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
