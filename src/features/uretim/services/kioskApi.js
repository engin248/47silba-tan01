import { supabase } from '@/lib/supabase';

export async function kioskPersonelSorgula(kod) {
    const { data: pData, error: pErr } = await supabase
        .from('b1_personel')
        .select('*')
        .or(`barkod_no.eq.${kod},personel_kodu.eq.${kod}`)
        .single();

    return { pData, pErr };
}

export async function kioskPersonelAylikPerformansGetir(personelId, ilkGun) {
    const { data: perfData } = await supabase
        .from('b1_personel_performans')
        .select('isletmeye_katilan_deger')
        .eq('personel_id', personelId)
        .gte('created_at', ilkGun);
    return perfData;
}

export async function kioskAktifIsGetir(personelId) {
    const { data: aktifIs } = await supabase
        .from('b1_personel_performans')
        .select('*, b1_uretim_operasyonlari(*), b1_operasyon_tanimlari(*)')
        .eq('personel_id', personelId)
        .is('bitis_saati', null)
        .single();
    return aktifIs;
}

export async function kioskSiparisIsYadaOperasyonSorgula(kod) {
    let { data: ordData, error: ordErr } = await supabase
        .from('production_orders')
        .select('id, quantity, model_id, order_code')
        .eq('id', kod)
        .single();

    if (ordErr || !ordData) {
        let { data: dirOp } = await supabase.from('b1_operasyon_tanimlari').select('id, operasyon_adi').eq('id', kod).single();
        return { type: 'operasyon', data: dirOp };
    }

    return { type: 'siparis', data: ordData };
}

// Bütün operasyon tanımlarını döner
export async function kioskModelOperasyonlariGetir() {
    let { data: ops } = await supabase.from('b1_operasyon_tanimlari').select('*').order('sira_no', { ascending: true });
    return ops;
}

export async function kioskIsBaslat(payload) {
    const { data, error } = await supabase
        .from('b1_personel_performans')
        .insert([payload])
        .select('*, b1_operasyon_tanimlari(*)')
        .single();
    return { data, error };
}

export async function kioskIsTamamla(id, payload) {
    const { error } = await supabase
        .from('b1_personel_performans')
        .update(payload)
        .eq('id', id);
    if (error) throw error;
}
