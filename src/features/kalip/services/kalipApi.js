import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function modellerVeTrendleriGetir() {
    const [modellerRes, trendlerRes] = await Promise.all([
        supabase.from('b1_model_taslaklari').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('b1_arge_products').select('id,product_name').in('ai_satis_karari', ['ÇOK_SATAR', 'BİNGO']).limit(100)
    ]);
    if (modellerRes.error) throw modellerRes.error;
    if (trendlerRes.error) throw trendlerRes.error;

    return {
        modeller: modellerRes.data || [],
        trendler: trendlerRes.data || []
    };
}

export async function kaliplarVeModelleriGetir() {
    const [kaliplarRes, modellerRes] = await Promise.all([
        supabase.from('b1_model_kaliplari').select('*, b1_model_taslaklari(model_adi,model_kodu)').order('created_at', { ascending: false }).limit(200),
        supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500)
    ]);
    if (kaliplarRes.error) throw kaliplarRes.error;
    if (modellerRes.error) throw modellerRes.error;

    return {
        kaliplar: kaliplarRes.data || [],
        modeller: modellerRes.data || []
    };
}

export async function modelTaslakKaydet(formModel) {
    if (formModel.id) {
        const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('id').eq('model_kodu', formModel.model_kodu.toUpperCase().trim()).neq('id', formModel.id);
        if (mevcut && mevcut.length > 0) throw new Error('⚠️ Bu Model Kodu başka model tarafından kullanılıyor!');

        const payload = {
            model_kodu: formModel.model_kodu.toUpperCase().trim(),
            model_adi: formModel.model_adi.trim(),
            model_adi_ar: formModel.model_adi_ar?.trim() || null,
            trend_id: formModel.trend_id || null,
            hedef_kitle: formModel.hedef_kitle,
            sezon: formModel.sezon,
            aciklama: formModel.aciklama?.trim() || null,
        };
        const { error } = await supabase.from('b1_model_taslaklari').update(payload).eq('id', formModel.id);
        if (error) throw error;
        return { isUpdate: true, payload };
    } else {
        const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('id').eq('model_kodu', formModel.model_kodu.toUpperCase().trim());
        if (mevcut && mevcut.length > 0) throw new Error('⚠️ Bu Model Kodu zaten kullanımda!');

        const payload = {
            model_kodu: formModel.model_kodu.toUpperCase().trim(),
            model_adi: formModel.model_adi.trim(),
            model_adi_ar: formModel.model_adi_ar?.trim() || null,
            trend_id: formModel.trend_id || null,
            hedef_kitle: formModel.hedef_kitle,
            sezon: formModel.sezon,
            aciklama: formModel.aciklama?.trim() || null,
            durum: 'taslak',
        };
        const { error } = await supabase.from('b1_model_taslaklari').insert([payload]);
        if (error) throw error;
        return { isUpdate: false, payload };
    }
}

export async function kalipPastalKaydet(formKalip) {
    if (formKalip.id) {
        const { data: mevcut } = await supabase.from('b1_model_kaliplari').select('id')
            .eq('model_id', formKalip.model_id).eq('kalip_adi', formKalip.kalip_adi.trim()).neq('id', formKalip.id);
        if (mevcut && mevcut.length > 0) throw new Error('⚠️ Bu Kalıp Adı ilgili Modele zaten eklenmiş!');

        const payload = {
            model_id: formKalip.model_id, kalip_adi: formKalip.kalip_adi.trim(), bedenler: formKalip.bedenler,
            pastal_boyu_cm: parseFloat(formKalip.pastal_boyu_cm), pastal_eni_cm: parseFloat(formKalip.pastal_eni_cm),
            fire_orani_yuzde: parseFloat(formKalip.fire_orani_yuzde) || 5, versiyon: formKalip.versiyon.trim() || 'v1.0',
            kalip_dosya_url: formKalip.kalip_dosya_url?.trim() || null,
        };
        const { error } = await supabase.from('b1_model_kaliplari').update(payload).eq('id', formKalip.id);
        if (error) throw error;
        return { isUpdate: true, payload };
    } else {
        const { data: mevcut } = await supabase.from('b1_model_kaliplari').select('id')
            .eq('model_id', formKalip.model_id).eq('kalip_adi', formKalip.kalip_adi.trim());
        if (mevcut && mevcut.length > 0) throw new Error('⚠️ Bu Kalıp Adı ilgili Modele zaten eklenmiş!');

        const payload = {
            model_id: formKalip.model_id, kalip_adi: formKalip.kalip_adi.trim(), bedenler: formKalip.bedenler,
            pastal_boyu_cm: parseFloat(formKalip.pastal_boyu_cm), pastal_eni_cm: parseFloat(formKalip.pastal_eni_cm),
            fire_orani_yuzde: parseFloat(formKalip.fire_orani_yuzde) || 5, versiyon: formKalip.versiyon.trim() || 'v1.0',
            kalip_dosya_url: formKalip.kalip_dosya_url?.trim() || null,
        };
        const { error } = await supabase.from('b1_model_kaliplari').insert([payload]);
        if (error) throw error;
        return { isUpdate: false, payload };
    }
}

export async function kalipTabloElemaniSil(tablo, id, kullaniciAdi) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: String(tablo), islem_tipi: 'SILME',
        kullanici_adi: kullaniciAdi || 'M3 Yetkilisi', eski_veri: { durum: 'SILINDI', id }
    }]);
    const { error } = await supabase.from(tablo).delete().eq('id', id);
    if (error) throw error;
}

export function kalipKanaliKur(onChange) {
    return supabase.channel('islem-gercek-zamanli-ai-kalip-optimize')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_taslaklari' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_kaliplari' }, onChange)
        .subscribe();
}
