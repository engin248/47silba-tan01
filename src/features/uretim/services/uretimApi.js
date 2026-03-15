/**
 * features/uretim/services/uretimApi.js
 * Üretim Bandı — API / Veri Çekme Katmanı
 * Tüm Supabase çağrıları burada, hook veya component'te doğrudan Supabase çağrısı yapılmaz.
 */
import { supabase } from '@/lib/supabase';

const TIMEOUT_MS = 10000;
const timeout = (ms) => new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı')), ms));

/** Modeller, iş emirleri, personel — ana sayfa verileri */
export async function fetchUretimVerileri() {
    const [mRes, oRes, pRes] = await Promise.all([
        Promise.race([supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500), timeout(TIMEOUT_MS)]),
        Promise.race([supabase.from('production_orders').select('*').order('created_at', { ascending: false }).limit(200), timeout(TIMEOUT_MS)]),
        Promise.race([supabase.from('b1_personel').select('id,personel_kodu,ad_soyad,rol,durum,saatlik_ucret_tl').eq('durum', 'aktif').order('ad_soyad').limit(100), timeout(TIMEOUT_MS)]),
    ]);
    const modellerData = mRes.data || [];
    const ordersData = (oRes.data || []).map(o => ({
        ...o,
        b1_model_taslaklari: modellerData.find(m => m.id === o.model_id) || { model_kodu: '?', model_adi: 'Model bulunamadı' }
    }));
    return { modeller: modellerData, orders: ordersData, personel: pRes.data || [] };
}

/** Maliyet ve muhasebe raporları (maliyet/devir sekmesi için) */
export async function fetchMaliyetVerileri() {
    const [malRes, rRes] = await Promise.all([
        Promise.race([supabase.from('b1_maliyet_kayitlari').select('*').order('created_at', { ascending: false }).limit(200), timeout(TIMEOUT_MS)]),
        Promise.race([supabase.from('b1_muhasebe_raporlari').select('*').order('created_at', { ascending: false }).limit(100), timeout(TIMEOUT_MS)]),
    ]);
    return { maliyetler: malRes.data || [], raporlar: rRes.data || [] };
}

/** İş emri oluştur */
export async function createIsEmri({ model_id, quantity, planned_start_date, planned_end_date }) {
    // Mükerrer kontrol
    const { data: mevcut } = await supabase.from('production_orders')
        .select('id').eq('model_id', model_id).in('status', ['pending', 'in_progress']);
    if (mevcut?.length > 0) throw new Error('Bu model için bekleyen/üretimdeki iş emri mevcut!');
    const { error } = await supabase.from('production_orders').insert([{
        model_id, quantity: parseInt(quantity), status: 'pending',
        planned_start_date: planned_start_date || null,
        planned_end_date: planned_end_date || null,
    }]);
    if (error) throw error;
}

/** İş emri güncelle */
export async function updateIsEmri(id, { model_id, quantity, planned_start_date, planned_end_date }) {
    const { data: eskiKayit } = await supabase.from('production_orders').select('status').eq('id', id).single();
    if (eskiKayit?.status === 'completed') throw new Error('🔒 DİJİTAL ADALET: Tamamlanmış iş emri güncellenemez.');
    const { error } = await supabase.from('production_orders').update({
        model_id, quantity: parseInt(quantity),
        planned_start_date: planned_start_date || null,
        planned_end_date: planned_end_date || null,
    }).eq('id', id);
    if (error) throw error;
}

/** Durum güncelle */
export async function updateIsEmriDurum(id, status) {
    const { error } = await supabase.from('production_orders').update({ status }).eq('id', id);
    if (error) throw error;
}

/** Toplu durum güncelle */
export async function batchUpdateDurum(ids, status) {
    const { error } = await supabase.from('production_orders').update({ status }).in('id', ids);
    if (error) throw error;
}

/** İş emri arşivle (soft delete) */
export async function archiveIsEmri(id, kullaniciAd) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'production_orders', islem_tipi: 'ARŞİVLEME',
        kullanici_adi: kullaniciAd || 'Saha Yetkilisi',
        eski_veri: { is_emri_id: id }
    }]);
    const { error } = await supabase.from('production_orders').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;
}

/** Maliyet kaydet */
export async function saveMaliyet({ order_id, maliyet_tipi, tutar_tl, kalem_aciklama }) {
    const { error } = await supabase.from('b1_maliyet_kayitlari').insert([{
        order_id, maliyet_tipi, tutar_tl: parseFloat(tutar_tl),
        kalem_aciklama: kalem_aciklama.trim(), onay_durumu: 'hesaplandi'
    }]);
    if (error) throw error;
}

/** Kronometre maliyet kaydet */
export async function saveKronometerMaliyet({ order_id, sureDk, zorlukKatsayisi, liyakat, sureSaniye }) {
    const dakikaUcret = parseFloat(process.env.NEXT_PUBLIC_DAKIKA_UCRETI || '2.50');
    const tutar = sureDk * dakikaUcret * zorlukKatsayisi;
    if (sureDk <= 0) return;
    const { error } = await supabase.from('b1_maliyet_kayitlari').insert([{
        order_id, maliyet_tipi: 'personel_iscilik', tutar_tl: tutar,
        kalem_aciklama: `Kronometre: ${Math.floor(sureSaniye / 60)}:${String(sureSaniye % 60).padStart(2, '0')} (${sureDk} dk) | x${zorlukKatsayisi.toFixed(1)} - ${liyakat}`,
        onay_durumu: 'hesaplandi'
    }]);
    if (error) throw error;
}

/** Devir yap */
export async function devirYap(orderId, maliyetler) {
    const { data: mevcut } = await supabase.from('b1_muhasebe_raporlari').select('id').eq('order_id', orderId);
    if (mevcut?.length > 0) throw new Error('⚠️ Bu iş emri için devir raporu zaten mevcut!');
    const pt = maliyetler.filter(m => m.order_id === orderId).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
    const { error } = await supabase.from('b1_muhasebe_raporlari').insert([{
        order_id: orderId, gerceklesen_maliyet_tl: pt,
        net_uretilen_adet: 0, zayiat_adet: 0, rapor_durumu: 'taslak', devir_durumu: false
    }]);
    if (error) throw error;
}
