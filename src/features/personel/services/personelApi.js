/**
 * features/personel/services/personelApi.js
 * Tablolar: b1_personel, b1_personel_devam, b1_sistem_ayarlari
 */
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

// ─── OKUMA ────────────────────────────────────────────────────────
export async function personelleriGetir() {
    const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı (10sn)')), 10000));
    const { data, error } = await Promise.race([
        supabase.from('b1_personel').select('*').order('created_at', { ascending: false }).limit(200),
        timeout,
    ]);
    if (error) throw error;
    return data || [];
}

export async function devamlarGetir() {
    const { data, error } = await supabase.from('b1_personel_devam')
        .select('*, b1_personel:personel_id(ad_soyad,personel_kodu,rol)')
        .order('tarih', { ascending: false }).limit(100);
    if (error) throw error;
    return data || [];
}

export async function sistemAyarlariGetir() {
    const { data } = await supabase.from('b1_sistem_ayarlari').select('deger').limit(1).maybeSingle();
    if (data?.deger) {
        try { return JSON.parse(data.deger); } catch { }
    }
    return { dakika_basi_ucret: 2.50, prim_orani: 0.15, yillik_izin_hakki: 15 };
}

// ─── YAZMA ────────────────────────────────────────────────────────
export async function personelKaydet(payload, duzenleId) {
    // Mükerrer kontrol
    if (!duzenleId) {
        const { data: mevcut } = await supabase.from('b1_personel').select('id').eq('personel_kodu', payload.personel_kodu);
        if (mevcut?.length > 0) throw new Error('⚠️ Bu personel kodu zaten kullanılıyor!');
    }
    if (duzenleId) {
        const { error } = await supabase.from('b1_personel').update(payload).eq('id', duzenleId);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('b1_personel').insert([payload]);
        if (error) throw error;
        telegramBildirim(`👥 KADRO EKLENDİ!\nYeni Personel: ${payload.ad_soyad}\nRol: ${payload.rol}`);
    }
}

export async function personelDurumGuncelle(id, adSoyad, yeniDurum) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_personel', 'UPDATE', { id, durum: yeniDurum });
        return { offline: true };
    }
    const { error } = await supabase.from('b1_personel').update({ durum: yeniDurum }).eq('id', id);
    if (error) throw error;
    telegramBildirim(`⚠️ PERSONEL DURUM DEĞİŞTİ!\n${adSoyad} → ${yeniDurum.toUpperCase()}`);
    return { offline: false };
}

export async function personelSil(id, kullaniciLabel) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b1_personel', islem_tipi: 'SILME',
        kullanici_adi: kullaniciLabel || 'İK Yetkilisi',
        eski_veri: { id }
    }]);
    const { error } = await supabase.from('b1_personel').delete().eq('id', id);
    if (error) throw error;
}

export async function devamKaydet(payload, duzenleId) {
    if (duzenleId) {
        const { error } = await supabase.from('b1_personel_devam')
            .update({ durum: payload.durum, notlar: payload.notlar }).eq('id', duzenleId);
        if (error) throw error;
        return;
    }
    // Aynı güne 2. devam engeli
    const { data: mevcut } = await supabase.from('b1_personel_devam').select('id')
        .eq('personel_id', payload.personel_id).eq('tarih', payload.tarih);
    if (mevcut?.length > 0) throw new Error('Bu personel için bu tarihe ait devam kaydı zaten var!');
    const { error } = await supabase.from('b1_personel_devam').insert([payload]);
    if (error) throw error;
    if (payload.durum === 'gelmedi') {
        telegramBildirim(`❌ DEVAMSIZLIK: Bir personel bugün gelmedi.\nTarih: ${payload.tarih}`);
    }
}

export async function devamSil(id, kullaniciLabel) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b1_personel_devam', islem_tipi: 'SILME',
        kullanici_adi: kullaniciLabel || 'İK Yetkilisi', eski_veri: { id }
    }]);
    const { error } = await supabase.from('b1_personel_devam').delete().eq('id', id);
    if (error) throw error;
}

// ─── REALTIME ─────────────────────────────────────────────────────
export function personelKanaliKur(onChange) {
    return supabase.channel('personel-realtime')
        .on('postgres_changes', { event: '*', schema: 'public' }, onChange)
        .subscribe();
}

export const ROLLER = ['duz_makinaci', 'overlokcu', 'resmeci', 'kesimci', 'utucu', 'paketci', 'ustabasi', 'koordinator', 'muhasebeci', 'depocu'];
export const ROL_LABEL = { duz_makinaci: '🧵 Düz Makinacı', overlokcu: '🔄 Overlokçu', resmeci: '✍️ Reşmeci', kesimci: '✂️ Kesimci', utucu: '🔥 Ütücü', paketci: '📦 Paketçi', ustabasi: '⭐ Ustabaşı', koordinator: '👑 Koordinatör', muhasebeci: '📊 Muhasebeci', depocu: '🏭 Depocu' };
export const BOSH_FORM = { personel_kodu: '', ad_soyad: '', ad_soyad_ar: '', rol: 'duz_makinaci', telefon: '', gunluk_calisma_dk: '480', saatlik_ucret_tl: '', ise_giris_tarihi: new Date().toISOString().split('T')[0], durum: 'aktif', notlar: '' };
