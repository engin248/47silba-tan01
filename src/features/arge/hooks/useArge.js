/**
 * features/arge/hooks/useArge.js
 * AR-GE Trend Araştırma Sayfası — Tüm Logic
 */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

export const PLATFORMLAR = ['trendyol', 'amazon', 'instagram', 'pinterest', 'diger'];
export const KATEGORILER = ['gomlek', 'pantolon', 'elbise', 'dis_giyim', 'spor', 'ic_giyim', 'aksesuar', 'diger'];
export const BOSH_FORM = {
    baslik: '', baslik_ar: '', platform: 'trendyol', kategori: 'gomlek',
    hedef_kitle: 'kadın', talep_skoru: 5, zorluk_derecesi: 5,
    referans_link: '', gorsel_url: '', aciklama: '', aciklama_ar: ''
};

export function useArge(kullanici, isAR = false) {
    const [trendler, setTrendler] = useState([]);
    const [agentLoglari, setAgentLoglari] = useState([]);
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtre, setFiltre] = useState('tumu');
    const [secilenTrend, setSecilenTrend] = useState(null);
    const [duzenleId, setDuzenleId] = useState(null);
    const [aiSorgu, setAiSorgu] = useState('');
    const [aiAraniyor, setAiAraniyor] = useState(false);
    const [aiSonuclar, setAiSonuclar] = useState(null);
    const [aiPanelAcik, setAiPanelAcik] = useState(false);

    const goster = createGoster(setMesaj);

    const verileriCek = useCallback(async () => {
        setLoading(true);
        try {
            const [trendlerRes, loglarRes] = await Promise.allSettled([
                supabase.from('b1_arge_trendler').select('*').order('created_at', { ascending: false }).limit(200),
                supabase.from('b1_agent_loglari').select('*').eq('ajan_adi', 'Trend Kâşifi').order('created_at', { ascending: false }).limit(5)
            ]);
            if (trendlerRes.status === 'fulfilled' && trendlerRes.value.data) setTrendler(trendlerRes.value.data);
            if (loglarRes.status === 'fulfilled' && loglarRes.value.data) setAgentLoglari(loglarRes.value.data);
            if (trendlerRes.status === 'rejected') throw trendlerRes.reason;
        } catch (error) {
            goster('Veri yüklenirken hata: ' + error.message, 'error');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        if (!(kullanici?.grup === 'tam' || uretimPin)) return;

        verileriCek();
        const kanal = supabase.channel('m1-arge-gercek-zamanli')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_arge_trendler' }, verileriCek)
            .subscribe();
        return () => supabase.removeChannel(kanal);
    }, [kullanici]);

    const trendAra = async () => {
        if (!aiSorgu.trim() || aiAraniyor) return;
        if (aiSorgu.trim().length > 150) return goster('Arama sorgusu 150 karakterden uzun olamaz!', 'error');
        setAiAraniyor(true); setAiSonuclar(null);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
            const res = await fetch('/api/trend-ara', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sorgu: aiSorgu }), signal: controller.signal
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (data.error && !data.demo) { goster('⚠️ ' + data.error, 'error'); }
            else { setAiSonuclar(data); setAiPanelAcik(true); }
        } catch (e) {
            clearTimeout(timeoutId);
            goster(e.name === 'AbortError' ? 'Zaman aşımı (15sn).' : 'Bağlantı hatası: ' + e.message, 'error');
        } finally { setAiAraniyor(false); }
    };

    const aiTrendKaydet = async (sonuc) => {
        try {
            const { data: mevcutlar } = await supabase.from('b1_arge_trendler').select('id').eq('baslik', sonuc.baslik);
            if (mevcutlar?.length > 0) return goster('⚠️ Bu trend zaten sisteme kaydedilmiş!', 'error');
            const { error } = await supabase.from('b1_arge_trendler').insert([{
                baslik: sonuc.baslik, platform: PLATFORMLAR.includes(sonuc.platform) ? sonuc.platform : 'diger',
                kategori: 'diger', hedef_kitle: 'kadın', talep_skoru: parseInt(sonuc.talep_skoru) || 5,
                zorluk_derecesi: 5, referans_linkler: sonuc.kaynak ? [sonuc.kaynak] : null,
                aciklama: sonuc.aciklama || null, durum: 'inceleniyor',
            }]);
            if (!error) goster('✅ Trend listeye eklendi!');
            else goster('Hata: ' + error.message, 'error');
        } catch (error) { goster('Bağlantı hatası!', 'error'); }
    };

    const kaydet = async () => {
        if (!form.baslik.trim() || form.baslik.length > 150) return goster('Trend başlığı zorunlu (max 150 karakter)!', 'error');
        if (!form.platform) return goster('Platform seçilmesi zorunludur!', 'error');
        if (!form.kategori) return goster('Ürün kategorisi zorunludur!', 'error');
        setLoading(true);
        try {
            if (!navigator.onLine) {
                await cevrimeKuyrugaAl('b1_arge_trendler', duzenleId ? 'UPDATE' : 'INSERT', duzenleId ? { ...form, id: duzenleId } : form);
                goster('⚠️ İnternet yok: Çevrimdışı kuyruğa alındı.'); setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); setLoading(false); return;
            }
            const payload = {
                baslik: form.baslik.trim(), baslik_ar: form.baslik_ar.trim() || null, platform: form.platform,
                kategori: form.kategori, hedef_kitle: form.hedef_kitle, talep_skoru: parseInt(form.talep_skoru),
                zorluk_derecesi: parseInt(form.zorluk_derecesi) || 5, referans_linkler: form.referans_link ? [form.referans_link.trim()] : null,
                gorsel_url: form.gorsel_url.trim() || null, aciklama: form.aciklama.trim() || null,
                aciklama_ar: form.aciklama_ar.trim() || null, durum: 'inceleniyor',
            };
            const { error } = duzenleId
                ? await supabase.from('b1_arge_trendler').update(payload).eq('id', duzenleId)
                : await supabase.from('b1_arge_trendler').insert([payload]);
            if (!error) { goster('✅ Trend kaydedildi!'); setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }
            else throw error;
        } catch (error) { goster('Hata: ' + (error?.message || 'Bilinmeyen hata'), 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, yeniDurum) => {
        const { error } = await supabase.from('b1_arge_trendler').update({ durum: yeniDurum }).eq('id', id);
        if (!error) {
            goster(yeniDurum === 'onaylandi' ? '✅ Trend onaylandı!' : '❌ Trend iptal edildi.', yeniDurum === 'onaylandi' ? 'success' : 'error');
            if (yeniDurum === 'onaylandi') {
                const onaylayanAd = kullanici?.ad || 'Atölye Lideri (PIN)';
                const ilgiliTrend = trendler.find(t => t.id === id);
                await supabase.from('b1_agent_loglari').insert([{ ajan_adi: 'Trend Kâşifi', islem_tipi: 'Trend Onaylandı', mesaj: `Onaylayan: ${onaylayanAd}`, durum: 'basarili', created_at: new Date().toISOString() }]).catch(() => { });
                fetch('/api/telegram-bildirim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mesaj: `🚀 YENİ TREND ONAYLANDI!\n📌 ${ilgiliTrend?.baslik || ''}\n👤 ${onaylayanAd}` }) }).catch(() => { });
            }
        }
    };

    const sil = async (id) => {
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici, 'Yönetici PIN kodunuzu girin:');
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz.', 'error');
        if (!confirm('Silmek istediğinize emin misiniz? (Geri alınamaz)')) return;
        if (!navigator.onLine) { await cevrimeKuyrugaAl('b1_arge_trendler', 'DELETE', { id }); return goster('Silme kuyruğa alındı.'); }
        try {
            const silinecek = trendler.find(t => t.id === id);
            if (silinecek) await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_arge_trendler', islem_tipi: 'SILME', eski_veri: silinecek, kullanici_adi: kullanici?.ad || 'Atölye Lideri' }]).catch(() => { });
            const { error } = await supabase.from('b1_arge_trendler').delete().eq('id', id);
            if (!error) goster('Silindi.');
            else throw error;
        } catch (error) { goster('Silme başarısız: ' + error.message, 'error'); }
    };

    const duzenle = (trend) => { setForm({ baslik: trend.baslik || '', baslik_ar: trend.baslik_ar || '', platform: trend.platform || 'trendyol', kategori: trend.kategori || 'gomlek', hedef_kitle: trend.hedef_kitle || 'kadın', talep_skoru: trend.talep_skoru || 5, zorluk_derecesi: trend.zorluk_derecesi || 5, referans_link: trend.referans_linkler?.[0] || '', gorsel_url: trend.gorsel_url || '', aciklama: trend.aciklama || '', aciklama_ar: trend.aciklama_ar || '' }); setDuzenleId(trend.id); setFormAcik(true); };
    const skorRenk = (skor) => skor >= 8 ? '#10b981' : skor >= 5 ? '#f59e0b' : '#ef4444';
    const filtreliTrendler = filtre === 'tumu' ? trendler : trendler.filter(t => t.durum === filtre);

    return {
        trendler, filtreliTrendler, agentLoglari, form, setForm, formAcik, setFormAcik,
        loading, mesaj, filtre, setFiltre, secilenTrend, setSecilenTrend, duzenleId,
        aiSorgu, setAiSorgu, aiAraniyor, aiSonuclar, aiPanelAcik, setAiPanelAcik,
        goster, verileriCek, trendAra, aiTrendKaydet, kaydet, durumGuncelle, sil, duzenle, skorRenk,
    };
}
