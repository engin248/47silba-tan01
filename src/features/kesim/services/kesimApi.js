/**
 * features/kesim/services/kesimApi.js
 * Tablolar: b1_kesim_operasyonlari, b1_model_taslaklari
 * (MainContainer'dan doğrulanan gerçek tablo adları)
 */
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function kesimVeriGetir() {
    const [kesRes, modRes] = await Promise.allSettled([
        supabase.from('b1_kesim_operasyonlari')
            .select('*, b1_model_taslaklari(model_kodu,model_adi)')
            .order('created_at', { ascending: false }).limit(200),
        supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500),
    ]);
    return {
        kesimler: kesRes.status === 'fulfilled' ? (kesRes.value.data || []) : [],
        kumaslar: modRes.status === 'fulfilled' ? (modRes.value.data || []) : [],
    };
}

export async function kesimEmriKaydet(payload) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_kesim_operasyonlari', 'INSERT', payload);
        return { offline: true };
    }
    const { error } = await supabase.from('b1_kesim_operasyonlari').insert([payload]);
    if (error) throw error;
    return { offline: false };
}

export async function kesimDurumGuncelle(id, durum) {
    const { error } = await supabase.from('b1_kesim_operasyonlari').update({ durum }).eq('id', id);
    if (error) throw error;
}

export async function kesimSil(id, kullaniciLabel) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b1_kesim_operasyonlari', islem_tipi: 'SILME',
        kullanici_adi: kullaniciLabel || 'Kesim Sorumlusu', eski_veri: { id }
    }]).catch(() => { });
    const { error } = await supabase.from('b1_kesim_operasyonlari').update({ durum: 'iptal' }).eq('id', id);
    if (error) throw error;
}

export function kesimKanaliKur(onChange) {
    return supabase.channel('kesim-kanal')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_kesim_operasyonlari' }, onChange)
        .subscribe();
}

export const BOSH_FORM = { model_id: '', kumas_kodu: '', miktar_mt: '', model_kodu: '', durum: 'bekliyor', notlar: '' };
