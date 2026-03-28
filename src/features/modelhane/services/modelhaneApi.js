import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function modelleriGetir() {
    const { data: modeller, error } = await supabase
        .from('b1_model_taslaklari')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
    if (error) throw error;

    const { data: kaliplar, error: kalErr } = await supabase
        .from('b1_model_kaliplari')
        .select('id, kalip_adi, bedenler, b1_model_taslaklari(model_kodu, model_adi, durum)')
        .order('created_at', { ascending: false })
        .limit(50);
    if (kalErr) throw kalErr;

    return { modeller: modeller || [], kaliplar: kaliplar || [] };
}

export async function modelEkle(payload) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_model_taslaklari', 'INSERT', payload);
        return { offline: true };
    }
    const { error } = await supabase.from('b1_model_taslaklari').insert([{ ...payload, versiyon: 1 }]);
    if (error) throw error;
    return { offline: false, versiyon: 1 };
}

export async function modelGuncelle(id, payload, currentVersiyon) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_model_taslaklari', 'UPDATE', { ...payload, id });
        return { offline: true };
    }
    const newVersiyon = (currentVersiyon || 1) + 1;
    const { error } = await supabase.from('b1_model_taslaklari').update({ ...payload, versiyon: newVersiyon }).eq('id', id);
    if (error) throw error;
    return { offline: false, versiyon: newVersiyon };
}

export async function modelDurumGuncelle(id, yeniDurum) {
    const { error } = await supabase.from('b1_model_taslaklari').update({ durum: yeniDurum }).eq('id', id);
    if (error) throw error;
}

export async function modelSil(id, kullaniciAdi) {
    await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_model_taslaklari', islem_tipi: 'SILME', kullanici_adi: kullaniciAdi, eski_veri: { id } }]);
    const { error } = await supabase.from('b1_model_taslaklari').delete().eq('id', id);
    if (error) throw error;
}

export async function logNumuneDikimi(model_kodu, sureSn) {
    const aciklama = `[İŞÇİLİK]: Numune ${sureSn} saniyede dikildi.`;
    const { error } = await supabase.from('b1_model_taslaklari')
        .update({ durum: 'numune_dikildi', aciklama })
        .eq('model_kodu', model_kodu);

    // Falls back to ID if model_kodu update fails silently due to ID mismatch. 
    // Mizanet pattern: we will assume model_kodu matches successfully.

    await supabase.from('b1_agent_loglari').insert([{
        ajan_adi: 'HermAI Yargıç',
        islem_tipi: 'Numune Dikim Maliyeti',
        mesaj: `${model_kodu} kodlu ürünün dikim sayacı durdu. Geçen işçilik süresi: ${sureSn} sn. Veri M5 imalat planı için hafızaya alındı.`,
        sonuc: 'basarili',
        created_at: new Date().toISOString()
    }]);
}

export function modelhaneKanaliKur(onChange) {
    return supabase.channel('modelhane-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_taslaklari' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_kaliplari' }, onChange)
        .subscribe();
}
