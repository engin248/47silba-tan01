import { supabase } from '@/lib/supabase';

export async function receteVerileriniGetir() {
    const [mRes, oRes] = await Promise.allSettled([
        supabase.from('b1_makineler').select('*').order('created_at', { ascending: true }),
        supabase.from('b1_uretim_operasyonlari').select('*, b1_model_taslaklari(model_kodu, model_adi), b1_makineler(makine_kodu, makine_adi)').order('model_id').order('sira_no', { ascending: true })
    ]);

    return {
        makineler: mRes.status === 'fulfilled' ? (mRes.value.data || []) : [],
        operasyonlar: oRes.status === 'fulfilled' ? (oRes.value.data || []) : []
    };
}

export async function makineKaydetApi(islem, id = null) {
    if (id) {
        const { error } = await supabase.from('b1_makineler').update(islem).eq('id', id);
        if (error) throw error;
        return { isUpdate: true };
    } else {
        const { error } = await supabase.from('b1_makineler').insert([islem]);
        if (error) throw error;
        return { isUpdate: false };
    }
}

export async function makineSilApi(id) {
    const { error } = await supabase.from('b1_makineler').delete().eq('id', id);
    if (error) throw error;
}

export async function operasyonKaydetApi(kayit, id = null) {
    if (id) {
        const { error } = await supabase.from('b1_uretim_operasyonlari').update(kayit).eq('id', id);
        if (error) throw error;
        return { isUpdate: true };
    } else {
        const { error } = await supabase.from('b1_uretim_operasyonlari').insert([kayit]);
        if (error) throw error;
        return { isUpdate: false };
    }
}

export async function operasyonSilApi(id) {
    const { error } = await supabase.from('b1_uretim_operasyonlari').delete().eq('id', id);
    if (error) throw error;
}
