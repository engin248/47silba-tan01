/**
 * features/muhasebe/services/muhasebeApi.js
 * M14 Muhasebe & Final Rapor — Supabase Servis Katmanı
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { telegramBildirim } from '@/lib/utils';

export async function fetchMuhasebeVerileri() {
    const [rRes, mRes] = await Promise.allSettled([
        supabase.from('b1_muhasebe_raporlari').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi,hedef_adet').eq('durum', 'tamamlandi').order('created_at', { ascending: false }).limit(200),
    ]);
    const raporlar = rRes.status === 'fulfilled' ? (rRes.value.data || []) : [];
    const tumModeller = mRes.status === 'fulfilled' ? (mRes.value.data || []) : [];
    const raporOrderIds = new Set(raporlar.map(r => r.order_id));
    const raporsizemOrders = tumModeller.filter(o => !raporOrderIds.has(o.id));
    return { raporlar, raporsizemOrders };
}

export async function fetchIlgiliMaliyetler(orderId) {
    const { data, error } = await supabase
        .from('b1_maliyet_kayitlari').select('*').eq('order_id', orderId).order('created_at').limit(500);
    if (error) throw error;
    return data || [];
}

export async function durumGuncelle(id, yeniDurum, kullaniciLabel = '') {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'UPDATE', {
            id, rapor_durumu: yeniDurum,
            ...(yeniDurum === 'onaylandi' ? { onay_tarihi: new Date().toISOString() } : {}),
        });
        return { offline: true };
    }
    const { error } = await supabase.from('b1_muhasebe_raporlari').update({
        rapor_durumu: yeniDurum,
        ...(yeniDurum === 'onaylandi' ? { onay_tarihi: new Date().toISOString() } : {}),
    }).eq('id', id);
    if (error) throw error;
    telegramBildirim(`📋 MUHASEBE GÜNCELLEMESİ:\nDurum: ${yeniDurum.toUpperCase()}`);
    return { offline: false };
}

export async function devirKapat(rapor, kullaniciLabel = '') {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'UPDATE', {
            id: rapor.id, rapor_durumu: 'kilitlendi', devir_durumu: true, onay_tarihi: new Date().toISOString()
        });
        return { offline: true };
    }
    // Audit log
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b1_muhasebe_raporlari', islem_tipi: 'UPDATE',
        kullanici_adi: kullaniciLabel || 'Muhasebe Yetkilisi',
        eski_veri: { mesaj: (rapor.model_kodu || rapor.id) + ' kilitlendi ve 2. birime devredildi.' },
    }]);

    const { error } = await supabase.from('b1_muhasebe_raporlari').update({
        rapor_durumu: 'kilitlendi', devir_durumu: true, onay_tarihi: new Date().toISOString()
    }).eq('id', rapor.id);
    if (error) throw error;

    // ─── STOK OTONOMU (GAMMA AJANI) ───
    try {
        // İlgili ürünün kodunu/adını taslaklardan bul (rapor içerisinde model_kodu olmayabilir diye garantiye al)
        const { data: model } = await supabase.from('b1_model_taslaklari').select('model_kodu, model_adi').eq('id', rapor.order_id).single();
        if (model?.model_kodu) {
            let { data: urun } = await supabase.from('b2_urun_katalogu').select('id, stok_adeti').eq('urun_kodu', model.model_kodu).single();
            let urunId = urun?.id;

            // Katalogda o ürün henüz yoksa otonom olarak (taslak değerlerle) yarat
            if (!urun) {
                const birimFiyat = rapor.net_uretilen_adet > 0 ? (rapor.gerceklesen_maliyet_tl / rapor.net_uretilen_adet) : 0;
                const { data: yeniUrun } = await supabase.from('b2_urun_katalogu').insert([{
                    urun_kodu: model.model_kodu,
                    urun_adi: model.model_adi,
                    durum: 'aktif',
                    satis_fiyati_tl: birimFiyat * 2, // Örnek olarak x2 net marj algoritması
                    stok_adeti: 0
                }]).select().single();

                if (yeniUrun) {
                    urunId = yeniUrun.id;
                    urun = { id: yeniUrun.id, stok_adeti: 0 };
                }
            }

            // Katalog ID si varsa Depoya Otonom Giriş (Hareket) yap
            if (urunId && rapor.net_uretilen_adet > 0) {
                await supabase.from('b2_stok_hareketleri').insert([{
                    urun_id: urunId,
                    hareket_tipi: 'giris',
                    adet: rapor.net_uretilen_adet,
                    aciklama: `İmalat Devir (Üretim Raporu ID: ${rapor.id?.slice(0, 8) || 'Bilinmiyor'})`
                }]);

                await supabase.from('b2_urun_katalogu').update({ stok_adeti: (urun?.stok_adeti || 0) + rapor.net_uretilen_adet }).eq('id', urunId);

                // Sisteme gamma ajan logu düş
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b2_stok_hareketleri',
                    islem_tipi: 'OTOMATIK_STOK_GUNCELLEME',
                    kullanici_adi: 'SİSTEM (GAMMA AJAN)',
                    eski_veri: { durum: 'devir_onaylandi', rapor_id: rapor.id, adet: rapor.net_uretilen_adet }
                }]);
            }
        }
    } catch (e) {
        console.error('Stok otonomu hatası (Kritik değil ama loglandı):', e);
    }

    telegramBildirim(`🔒 2. BİRİME DEVİR ONAYLANDI & STOK GÜNCELLENDİ!\nBir üretim raporu KİLİTLENDİ.`);
    return { offline: false };
}

export async function uretimdenRaporOlustur(model) {
    const { data: mevcut } = await supabase.from('b1_muhasebe_raporlari').select('id').eq('order_id', model.id);
    if (mevcut && mevcut.length > 0) throw new Error('Bu üretim emri için zaten rapor mevcut!');
    const { data: maliyetler, error: mErr } = await supabase.from('b1_maliyet_kayitlari').select('tutar_tl').eq('order_id', model.id);
    if (mErr) throw mErr;
    const toplamMaliyet = (maliyetler || []).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
    const payload = {
        order_id: model.id,
        gerceklesen_maliyet_tl: toplamMaliyet,
        net_uretilen_adet: model.hedef_adet || 0,
        zayiat_adet: 0, rapor_durumu: 'sef_onay_bekliyor', devir_durumu: false,
    };
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'INSERT', payload);
        return { offline: true, toplam: toplamMaliyet };
    }
    const { error } = await supabase.from('b1_muhasebe_raporlari').insert([payload]);
    if (error) throw error;
    return { offline: false, toplam: toplamMaliyet };
}

export async function maliyetiSenkronize(rapor) {
    if (!rapor.order_id) throw new Error('Raporda bağlı iş emri yok!');
    const { data: maliyetler, error } = await supabase.from('b1_maliyet_kayitlari').select('tutar_tl').eq('order_id', rapor.order_id);
    if (error) throw error;
    const toplam = (maliyetler || []).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
    const { error: uErr } = await supabase.from('b1_muhasebe_raporlari').update({ gerceklesen_maliyet_tl: toplam }).eq('id', rapor.id);
    if (uErr) throw uErr;
    return toplam;
}

export async function duzenleKaydet(id, form) {
    const payload = {
        zayiat_adet: parseInt(form.zayiat_adet) || 0,
        hedeflenen_maliyet_tl: parseFloat(form.hedeflenen_maliyet_tl) || 0,
        notlar: form.notlar.trim() || null,
    };
    const { error } = await supabase.from('b1_muhasebe_raporlari').update(payload).eq('id', id);
    if (error) throw error;
    return payload;
}

export async function raporSil(rapor, kullaniciLabel = '') {
    if (rapor.rapor_durumu === 'kilitlendi') throw new Error('Kilitli raporlar silinemez!');
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b1_muhasebe_raporlari', islem_tipi: 'SILME',
        kullanici_adi: kullaniciLabel || 'Muhasebe Yetkilisi',
        eski_veri: { rapor_durumu: rapor.rapor_durumu, model_kodu: rapor.model_kodu },
    }]);
    const { error } = await supabase.from('b1_muhasebe_raporlari').delete().eq('id', rapor.id);
    if (error) throw error;
    telegramBildirim(`🗑️ MUHASEBE RAPORU SİLİNDİ\nModel: ${rapor.model_kodu || '-'}`);
}

// ── Sabitler & Yardımcılar ────────────────────────────────────────────────────
export const DURUM_RENK = { taslak: '#94a3b8', sef_onay_bekliyor: '#f59e0b', onaylandi: '#10b981', kilitlendi: '#0f172a' };
export const DURUM_LABEL = { taslak: '📄 Taslak', sef_onay_bekliyor: '⏳ Şef Onayı', onaylandi: '✅ Onaylı', kilitlendi: '🔒 Kilitli' };

export function birimMaliyet(r) {
    const net = parseInt(r.net_uretilen_adet) || 0;
    if (net === 0) return '—';
    return (parseFloat(r.gerceklesen_maliyet_tl) / net).toFixed(4);
}

export function asimPct(r) {
    const h = parseFloat(r.hedeflenen_maliyet_tl);
    if (!h) return 0;
    return (((parseFloat(r.gerceklesen_maliyet_tl) - h) / h) * 100).toFixed(1);
}
