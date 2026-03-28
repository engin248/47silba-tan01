import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function imalatMainTeknikFoyleriGetir(timeoutPromise) {
    const res = await Promise.race([
        supabase.from('production_orders')
            .select('*, b1_model_taslaklari(id, model_kodu, model_adi)')
            .order('created_at', { ascending: false }).limit(200),
        timeoutPromise()
    ]);
    return res;
}

export async function imalatMainTeknikFoyKaydet(yeniFoy) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_model_taslaklari', 'INSERT', {
            model_kodu: yeniFoy.model_name.trim(),
            model_adi: yeniFoy.model_name.trim(),
            iscilik_suresi: 60,
            numune_maliyeti: parseFloat(yeniFoy.maliyet_siniri_tl),
            notlar: `Kumaş: ${yeniFoy.zorunlu_kumas_miktari_mt}mt, Esneme: %${yeniFoy.esneme_payi_yuzde}. URL: ${yeniFoy.orjinal_gorsel_url}`
        });
        return { offline: true };
    }

    const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('id').eq('model_kodu', yeniFoy.model_name.trim());
    if (mevcut && mevcut.length > 0) throw new Error('Bu Model Zaten Kayıtlı');

    const { error } = await supabase.from('b1_model_taslaklari').insert([{
        model_kodu: yeniFoy.model_name.trim(),
        model_adi: yeniFoy.model_name.trim(),
        iscilik_suresi: 60,
        numune_maliyeti: parseFloat(yeniFoy.maliyet_siniri_tl),
        notlar: `Kumaş: ${yeniFoy.zorunlu_kumas_miktari_mt}mt, Esneme: %${yeniFoy.esneme_payi_yuzde}. URL: ${yeniFoy.orjinal_gorsel_url}`
    }]);

    if (error) throw error;
    return { offline: false };
}

export async function imalatMainUretimeFirlat(seciliModel, islemAdimlari, uretimAdeti) {
    // Çevrimdışı koruması
    if (!navigator.onLine) {
        // Çevrimdışı senaryoda karmaşık akış işlemleri için tek bir macro kuyruk işlemi eklenebilir
        // Şimdilik hata fırlatarak ya da kuyruğa ekleyerek devam ediliyor.
        throw new Error('İnternet Yok: Sistem üretim bandı işlemini çevrimdışı kuyruğa alamıyor.');
    }

    const modelId = seciliModel.b1_model_taslaklari?.id || seciliModel.id;

    // Uzunluk/zorluk değerlerini korumak için islemAdimlari nesnesi veritabanına mapleniyor.
    const { data: stepData, error: stepErr } = await supabase
        .from('b1_operasyon_adimlari')
        .insert([{
            step_name: islemAdimlari[0].islem_adi,
            estimated_duration_minutes: parseInt(islemAdimlari[0].ideal_sure_dk) || 0,
            zorluk_derecesi: islemAdimlari[0].zorluk_derecesi || 5, // YENİ: Zorluk
            dikis_uzunlugu_cm: islemAdimlari[0].dikis_uzunlugu_cm || 0 // YENİ: Kaç cm
        }])
        .select().single();
    if (stepErr) throw stepErr;

    const { data: wfData, error: wfErr } = await supabase
        .from('b1_model_is_akislari')
        .insert([{ model_id: modelId, step_id: stepData.id, step_order: 1 }])
        .select().single();
    if (wfErr) throw wfErr;

    const { error: takipErr } = await supabase
        .from('b1_operasyon_takip')
        .insert([{ order_id: seciliModel.id, model_workflow_id: wfData.id, status: 'assigned' }]);
    if (takipErr) throw takipErr;

    await supabase.from('production_orders').update({ status: 'in_progress', quantity: parseInt(uretimAdeti) }).eq('id', seciliModel.id);
}

export async function imalatMainSahadakiIslerGetir(timeoutPromise) {
    return await Promise.race([
        supabase.from('b1_operasyon_takip')
            .select('*, production_orders(order_code, quantity, b1_model_taslaklari(model_kodu, model_adi))')
            .neq('status', 'completed')
            .limit(200),
        timeoutPromise()
    ]);
}

export async function imalatMainPersonelGetir(timeoutPromise) {
    return await Promise.race([supabase.from('b1_personel').select('*').limit(100), timeoutPromise()]);
}

export async function imalatMainIsBaslat(id) {
    // Çevrimdışı destekli
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_operasyon_takip', 'UPDATE', { id, status: 'in_progress', start_time: new Date().toISOString() });
        return { offline: true };
    }
    const { error } = await supabase.from('b1_operasyon_takip').update({ status: 'in_progress', start_time: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    return { offline: false };
}

export async function imalatMainArizaBildir(id) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_operasyon_takip', 'UPDATE', { id, status: 'blocked_machine' });
        return { offline: true };
    }
    const { error } = await supabase.from('b1_operasyon_takip').update({ status: 'blocked_machine' }).eq('id', id);
    if (error) throw error;
    return { offline: false };
}

export async function imalatMainIsBitir(id) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_operasyon_takip', 'UPDATE', { id, status: 'waiting_for_proof', end_time: new Date().toISOString() });
        return { offline: true };
    }
    const { error } = await supabase.from('b1_operasyon_takip').update({ status: 'waiting_for_proof', end_time: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    return { offline: false };
}

export async function imalatMainOnayBekleyenGetir(timeoutPromise) {
    return await Promise.race([
        supabase.from('b1_operasyon_takip')
            .select('*, production_orders(order_code, quantity, b1_model_taslaklari(model_kodu, model_adi, numune_maliyeti))')
            .eq('status', 'waiting_for_proof')
            .limit(200),
        timeoutPromise()
    ]);
}

export async function imalatMainFinaleOnayVer(islem) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_operasyon_takip', 'UPDATE', { id: islem.id, status: 'completed' });
        // Maliyet satırı internet gelince yazılır -> bu işlem offlineda desteklenebilir
        return { offline: true };
    }

    const { error } = await supabase.from('b1_operasyon_takip').update({ status: 'completed' }).eq('id', islem.id);
    if (error) throw error;

    const siparis_id = islem.order_id;
    if (siparis_id) {
        const operasyonZamaniDk = 42;
        const dakikaMaliyeti = 4;
        const toplamMaliyet = operasyonZamaniDk * dakikaMaliyeti;

        await supabase.from('b1_maliyet_kayitlari').insert([{
            order_id: siparis_id,
            maliyet_tipi: 'personel_iscilik',
            kalem_aciklama: `OP-${islem.id} Bant Operasyonu Tamamlanma Hakedişi`,
            tutar_tl: toplamMaliyet,
            onay_durumu: 'hesaplandi'
        }]);
    }
    return { offline: false };
}

export async function imalatMainHataliReddet(is) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_operasyon_takip', 'UPDATE', { id: is.id, status: 'assigned', rework_count: (is.rework_count || 0) + 1 });
        return { offline: true };
    }
    const { error } = await supabase.from('b1_operasyon_takip').update({ status: 'assigned', rework_count: (is.rework_count || 0) + 1 }).eq('id', is.id);
    if (error) throw error;
    return { offline: false };
}

export function imalatMainKanalKur(onTakipChange, onOrderChange) {
    return supabase.channel('imalat-gercek-zamanli-optimize')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_operasyon_takip' }, onTakipChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders' }, onOrderChange)
        .subscribe();
}

export function imalatMainKanalIptal(kanal) {
    if (kanal) {
        supabase.removeChannel(kanal);
    }
}
