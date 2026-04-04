/**
 * features/uretim/services/uretimApi.js
 * ═══════════════════════════════════════════════════════════════════
 * PRODUCTION ORDERS — MERKEZİ REPOSITORY KATMANI
 * ═══════════════════════════════════════════════════════════════════
 * KURAL: Tüm `production_orders` erişimi SADECE bu dosyadan geçer.
 * Hiçbir component, hook veya API route direkt supabase.from('production_orders')
 * çağrısı yapamaz. Hata yakalamak için TEK NOKTA burası.
 *
 * Dünya standardı: Repository Pattern (Martin Fowler - Patterns of Enterprise Architecture)
 * @ts-nocheck
 */
import { supabase } from '@/lib/supabase';

// ─── SABİTLER ──────────────────────────────────────────────────────────────
const TABLO = 'production_orders';
const TIMEOUT_MS = 10000;
const timeout = (ms) => new Promise((_, r) => setTimeout(() => r(new Error(`[uretimApi] ${ms}ms zaman aşımı`)), ms));

// ─── 1. OKUMA (READ) ───────────────────────────────────────────────────────

/**
 * Ana sayfa için tüm iş emirleri + modeller + personel
 */
export async function fetchUretimVerileri() {
    const [mRes, oRes, pRes] = await Promise.all([
        Promise.race([supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500), timeout(TIMEOUT_MS)]),
        Promise.race([supabase.from(TABLO).select('*').order('created_at', { ascending: false }).limit(200), timeout(TIMEOUT_MS)]),
        Promise.race([supabase.from('b1_personel').select('id,personel_kodu,ad_soyad,rol,durum,saatlik_ucret_tl').eq('durum', 'aktif').order('ad_soyad').limit(100), timeout(TIMEOUT_MS)]),
    ]);
    const modellerData = mRes.data || [];
    const ordersData = (oRes.data || []).map(o => ({
        ...o,
        b1_model_taslaklari: modellerData.find(m => m.id === o.model_id) || { model_kodu: '?', model_adi: 'Model bulunamadı' }
    }));
    return { modeller: modellerData, orders: ordersData, personel: pRes.data || [] };
}

/**
 * Maliyet ve muhasebe raporları
 */
export async function fetchMaliyetVerileri() {
    const [malRes, rRes] = await Promise.all([
        Promise.race([supabase.from('b1_maliyet_kayitlari').select('*').order('created_at', { ascending: false }).limit(200), timeout(TIMEOUT_MS)]),
        Promise.race([supabase.from('b1_muhasebe_raporlari').select('*').order('created_at', { ascending: false }).limit(100), timeout(TIMEOUT_MS)]),
    ]);
    return { maliyetler: malRes.data || [], raporlar: rRes.data || [] };
}

/**
 * Tek bir iş emrini ID ile getir
 */
export async function fetchIsEmriById(id) {
    const { data, error } = await supabase.from(TABLO).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
}

/**
 * Muhasebe sayfası için iş emirleri
 */
export async function fetchIsEmriForMuhasebe() {
    const { data, error } = await supabase
        .from(TABLO)
        .select('id, order_code, quantity, status, model_id, b1_model_taslaklari(model_kodu, model_adi, numune_maliyeti)')
        .in('status', ['completed', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(200);
    if (error) throw error;
    return data || [];
}

/**
 * Maliyet sayfası için iş emirleri
 */
export async function fetchIsEmriForMaliyet() {
    const { data, error } = await supabase
        .from(TABLO)
        .select('id, order_code, quantity, status, model_id, b1_model_taslaklari(model_kodu, model_adi)')
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(200);
    if (error) throw error;
    return data || [];
}

/**
 * İmalat sayfası için iş emirleri
 */
export async function fetchIsEmriForImalat() {
    const { data, error } = await supabase
        .from(TABLO)
        .select('*, b1_model_taslaklari(model_kodu, model_adi, numune_maliyeti)')
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(200);
    if (error) throw error;
    return data || [];
}

/**
 * Ajan izleme — gecikmiş iş emirleri
 */
export async function fetchGecikmiIsEmirleri() {
    const bugun = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from(TABLO)
        .select('id, quantity, planned_end_date, status, b1_model_taslaklari:model_id(model_adi, model_kodu)')
        .in('status', ['pending', 'in_progress'])
        .not('planned_end_date', 'is', null)
        .lt('planned_end_date', bugun);
    if (error) throw error;
    return data || [];
}

/**
 * Muhasebe raporu için tek sipariş (model detayıyla)
 */
export async function fetchIsEmriForRapor(orderId) {
    const { data, error } = await supabase
        .from(TABLO)
        .select('*, b1_model_taslaklari(model_kodu, model_adi, numune_maliyeti)')
        .eq('id', orderId)
        .single();
    if (error) throw error;
    return data;
}

/**
 * Çakışma kontrolü — aynı modelde aktif iş emri var mı?
 */
export async function checkAktifIsEmriVar(modelId) {
    const { data } = await supabase
        .from(TABLO)
        .select('id')
        .eq('model_id', modelId)
        .in('status', ['pending', 'in_progress']);
    return (data?.length || 0) > 0;
}

// ─── 2. YAZMA (WRITE) ──────────────────────────────────────────────────────

/**
 * Yeni iş emri oluştur (çakışma kontrolü dahil)
 */
export async function createIsEmri({ model_id, quantity, planned_start_date = null, planned_end_date = null, order_code = null }) {
    const aktifVar = await checkAktifIsEmriVar(model_id);
    if (aktifVar) throw new Error('Bu model için bekleyen/üretimdeki iş emri mevcut!');
    const payload = {
        model_id,
        quantity: parseInt(quantity),
        status: 'pending',
        planned_start_date: planned_start_date || null,
        planned_end_date: planned_end_date || null,
    };
    if (order_code) payload.order_code = order_code;
    const { data, error } = await supabase.from(TABLO).insert([payload]).select().single();
    if (error) throw error;
    return data;
}

/**
 * İş emri güncelle (tamamlanmış ise engelle)
 */
export async function updateIsEmri(id, { model_id, quantity, planned_start_date, planned_end_date }) {
    const kayit = await fetchIsEmriById(id);
    if (kayit?.status === 'completed') throw new Error('🔒 DİJİTAL ADALET: Tamamlanmış iş emri güncellenemez.');
    const { error } = await supabase.from(TABLO).update({
        model_id,
        quantity: parseInt(quantity),
        planned_start_date: planned_start_date || null,
        planned_end_date: planned_end_date || null,
    }).eq('id', id);
    if (error) throw error;
}

/**
 * Tek iş emri durum güncelle
 */
export async function updateIsEmriDurum(id, status) {
    const { error } = await supabase.from(TABLO).update({ status }).eq('id', id);
    if (error) throw error;
}

/**
 * Toplu durum güncelle
 */
export async function batchUpdateDurum(ids, status) {
    const { error } = await supabase.from(TABLO).update({ status }).in('id', ids);
    if (error) throw error;
}

/**
 * İş emri arşivle — soft delete (status: cancelled)
 */
export async function archiveIsEmri(id, kullaniciAd) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: TABLO,
        islem_tipi: 'ARŞİVLEME',
        kullanici_adi: kullaniciAd || 'Saha Yetkilisi',
        eski_veri: { is_emri_id: id }
    }]);
    const { error } = await supabase.from(TABLO).update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;
}

// ─── 3. MALIYET / DEVİR ────────────────────────────────────────────────────

/**
 * Manuel maliyet kalemi kaydet
 */
export async function saveMaliyet({ order_id, maliyet_tipi, tutar_tl, kalem_aciklama }) {
    const { error } = await supabase.from('b1_maliyet_kayitlari').insert([{
        order_id, maliyet_tipi,
        tutar_tl: parseFloat(tutar_tl),
        kalem_aciklama: kalem_aciklama.trim(),
        onay_durumu: 'hesaplandi'
    }]);
    if (error) throw error;
}

/**
 * Kronometre bazlı maliyet kaydet
 */
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

/**
 * Muhasebe devir raporu oluştur
 */
export async function devirYap(orderId, maliyetler) {
    const { data: mevcut } = await supabase.from('b1_muhasebe_raporlari').select('id').eq('order_id', orderId);
    if (mevcut && mevcut.length > 0) throw new Error('⚠️ Bu iş emri için devir raporu zaten mevcut!');
    const siparis = await fetchIsEmriById(orderId);
    const netAdet = siparis?.quantity ? parseInt(siparis.quantity) : 1;
    const pt = (maliyetler || []).filter(m => m.order_id === orderId).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
    const { error } = await supabase.from('b1_muhasebe_raporlari').insert([{
        order_id: orderId, gerceklesen_maliyet_tl: pt,
        net_uretilen_adet: netAdet, zayiat_adet: 0, rapor_durumu: 'taslak', devir_durumu: false
    }]);
    if (error) throw error;
}

// ─── 4. REALTIME ABONELİĞİ ─────────────────────────────────────────────────

/**
 * production_orders + tüm public tablolar için realtime abonelik
 * @param {string} kanalAdi - Benzersiz kanal adı (component başına farklı olmalı)
 * @param {Function} onDegisim - Değişiklikte çağrılacak callback
 * @returns {Function} Aboneliği iptal eden unsubscribe fonksiyonu
 */
export function subscribeIsEmirleri(kanalAdi, onDegisim) {
    const kanal = supabase.channel(kanalAdi)
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLO }, onDegisim)
        .subscribe();
    return () => supabase.removeChannel(kanal);
}
