/**
 * features/personel/hooks/usePersonelV2.js
 * Personel & Prim Sayfası — Tüm Logic
 * features/ yapısına taşındı, mevcut src/hooks/usePersonel.js ile çakışmaması için V2
 */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

export const ROLLER = ['duz_makinaci', 'overlokcu', 'resmeci', 'kesimci', 'utucu', 'paketci', 'ustabasi', 'koordinator', 'muhasebeci', 'depocu'];
export const ROL_LABEL = {
    duz_makinaci: '🧵 Düz Makinacı', overlokcu: '🔄 Overlokçu', resmeci: '✍️ Reşmeci',
    kesimci: '✂️ Kesimci', utucu: '🔥 Ütücü', paketci: '📦 Paketçi',
    ustabasi: '⭐ Ustabaşı', koordinator: '👑 Koordinatör',
    muhasebeci: '📊 Muhasebeci', depocu: '🏭 Depocu'
};
export const DURUM = ['aktif', 'izinli', 'cikti'];
export const DURUM_RENK = { aktif: '#10b981', izinli: '#f59e0b', cikti: '#ef4444' };
export const BOSH_PERSONEL = {
    personel_kodu: '', ad_soyad: '', ad_soyad_ar: '', rol: 'duz_makinaci',
    telefon: '', gunluk_calisma_dk: '480', saatlik_ucret_tl: '',
    ise_giris_tarihi: new Date().toISOString().split('T')[0], durum: 'aktif', notlar: ''
};

export function usePersonelV2(kullanici) {
    const [personeller, setPersoneller] = useState([]);
    const [form, setForm] = useState(BOSH_PERSONEL);
    const [formAcik, setFormAcik] = useState(false);
    const [duzenleId, setDuzenleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [aramaMetni, setAramaMetni] = useState('');
    const [filtreRol, setFiltreRol] = useState('hepsi');
    const [sekme, setSekme] = useState('liste');
    const [devamlar, setDevamlar] = useState([]);
    const [devamForm, setDevamForm] = useState({ personel_id: '', tarih: new Date().toISOString().split('T')[0], durum: 'calisti', notlar: '' });
    const [devamFormAcik, setDevamFormAcik] = useState(false);
    const [devamDuzenleId, setDevamDuzenleId] = useState(null);
    const [sistemAyarlari, setSistemAyarlari] = useState({ dakika_basi_ucret: 2.50, prim_orani: 0.15, yillik_izin_hakki: 15 });

    const goster = createGoster(setMesaj);

    const yukleAyarlar = useCallback(async () => {
        try {
            const { data } = await supabase.from('b1_sistem_ayarlari').select('deger').limit(1).maybeSingle();
            if (data?.deger) {
                const parsed = JSON.parse(data.deger);
                setSistemAyarlari({ dakika_basi_ucret: parsed.dakika_basi_ucret ?? 2.50, prim_orani: parsed.prim_orani ?? 0.15, yillik_izin_hakki: parsed.yillik_izin_hakki ?? 15 });
            }
        } catch (e) {
            console.error("[SİSTEM HATASI] Ayarlar yüklenemedi:", e);
        }
    }, []);

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı')), 10000));
            const { data, error } = await Promise.race([supabase.from('b1_personel').select('*').order('created_at', { ascending: false }).limit(200), timeout]);
            if (error) throw error;
            if (data) setPersoneller(data);
        } catch (error) { goster('Bağlantı Hatası: ' + error.message, 'error'); }
        setLoading(false);
    }, []);

    const yukleDevam = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('b1_personel_devam').select('*, b1_personel:personel_id(ad_soyad,personel_kodu,rol)').order('tarih', { ascending: false }).limit(100);
            if (error) throw error;
            if (data) setDevamlar(data);
        } catch (error) { goster('Bağlantı Hatası: ' + error.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        if (!(kullanici?.grup === 'tam' || uretimPin)) return;
        yukle(); yukleAyarlar();
        const kanal = supabase.channel('personel-gercek-zamanli').on('postgres_changes', { event: '*', schema: 'public' }, yukle).subscribe();
        return () => supabase.removeChannel(kanal);
    }, [kullanici]);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const yetkili = kullanici?.grup === 'tam' || uretimPin;
        if (sekme === 'devam' && yetkili) yukleDevam();
    }, [sekme, kullanici]);

    const kaydet = async () => {
        if (!form.personel_kodu.trim()) return goster('Personel kodu zorunlu!', 'error');
        if (!form.ad_soyad.trim()) return goster('Ad Soyad zorunlu!', 'error');
        if (form.ad_soyad.length > 100) return goster('Ad soyad max 100 karakter!', 'error');
        if (!form.saatlik_ucret_tl || parseFloat(form.saatlik_ucret_tl) <= 0) return goster('Saatlik ücret giriniz!', 'error');
        setLoading(true);
        try {
            const payload = {
                personel_kodu: form.personel_kodu.trim().toUpperCase(), ad_soyad: form.ad_soyad.trim(),
                ad_soyad_ar: form.ad_soyad_ar.trim() || null, rol: form.rol,
                telefon: form.telefon.trim() || null, gunluk_calisma_dk: parseInt(form.gunluk_calisma_dk) || 480,
                saatlik_ucret_tl: parseFloat(form.saatlik_ucret_tl),
                ise_giris_tarihi: form.ise_giris_tarihi || null, durum: form.durum, notlar: form.notlar.trim() || null,
            };
            if (duzenleId) {
                const { error } = await supabase.from('b1_personel').update(payload).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Personel güncellendi!');
            } else {
                const { data: mevcut } = await supabase.from('b1_personel').select('id').eq('personel_kodu', payload.personel_kodu);
                if (mevcut?.length > 0) { setLoading(false); return goster('⚠️ Bu personel kodu zaten kullanılıyor!', 'error'); }
                const { error } = await supabase.from('b1_personel').insert([payload]);
                if (error) throw error;
                goster('✅ Personel sisteme eklendi!');
                telegramBildirim(`👥 KADRO EKLENDİ!\nYeni Personel: ${payload.ad_soyad}\nRol: ${ROL_LABEL[payload.rol]}`);
            }
            setForm(BOSH_PERSONEL); setFormAcik(false); setDuzenleId(null); yukle();
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const duzenle = (p) => {
        setForm({ personel_kodu: p.personel_kodu, ad_soyad: p.ad_soyad, ad_soyad_ar: p.ad_soyad_ar || '', rol: p.rol, telefon: p.telefon || '', gunluk_calisma_dk: String(p.gunluk_calisma_dk || 480), saatlik_ucret_tl: String(p.saatlik_ucret_tl || ''), ise_giris_tarihi: p.ise_giris_tarihi || new Date().toISOString().split('T')[0], durum: p.durum, notlar: p.notlar || '' });
        setDuzenleId(p.id); setFormAcik(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const sil = async (id) => {
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici, 'Personel silmek için PIN girin:');
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz!', 'error');
        if (!confirm('Personel kalıcı olarak silinsin mi?')) return;
        try {
            await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_personel', islem_tipi: 'SILME', kullanici_adi: kullanici?.ad || 'Yönetici', eski_veri: { id } }]);
            const { error } = await supabase.from('b1_personel').delete().eq('id', id);
            if (error) throw error;
            goster('Silindi.'); yukle();
        } catch (error) { goster('Silinemedi: ' + error.message, 'error'); }
    };

    const durumGuncelle = async (id, adSoyad, yeniDurum) => {
        if (!navigator.onLine) { await cevrimeKuyrugaAl('b1_personel', 'UPDATE', { id, durum: yeniDurum }); return goster('⚡ Çevrimdışı: Kuyruğa alındı.'); }
        try {
            const { error } = await supabase.from('b1_personel').update({ durum: yeniDurum }).eq('id', id);
            if (error) throw error;
            yukle();
            telegramBildirim(`⚠️ PERSONEL DURUM DEĞİŞTİ!\nEleman: ${adSoyad}\nYeni Durum: ${yeniDurum.toUpperCase()}`);
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
    };

    const devamKaydet = async () => {
        if (!devamForm.personel_id) return goster('Personel seçiniz!', 'error');
        if (!devamForm.tarih) return goster('Tarih zorunlu!', 'error');
        setLoading(true);
        try {
            if (devamDuzenleId) {
                const { error } = await supabase.from('b1_personel_devam').update({ durum: devamForm.durum, notlar: devamForm.notlar.trim() || null }).eq('id', devamDuzenleId);
                if (error) throw error;
                goster('✅ Güncellendi!');
            } else {
                const { data: mevcutDevam } = await supabase.from('b1_personel_devam').select('id').eq('personel_id', devamForm.personel_id).eq('tarih', devamForm.tarih);
                if (mevcutDevam?.length > 0) { setLoading(false); return goster('⚠️ Bu tarihte devam kaydı zaten mevcut!', 'error'); }
                const { error } = await supabase.from('b1_personel_devam').insert([{ personel_id: devamForm.personel_id, tarih: devamForm.tarih, durum: devamForm.durum, notlar: devamForm.notlar.trim() || null }]);
                if (error) throw error;
                goster('✅ Devam kaydedildi!');
                if (devamForm.durum === 'gelmedi') telegramBildirim(`❌ DEVAMSIZLIK\nTarih: ${devamForm.tarih}`);
            }
            setDevamForm({ personel_id: '', tarih: new Date().toISOString().split('T')[0], durum: 'calisti', notlar: '' });
            setDevamFormAcik(false); setDevamDuzenleId(null); yukleDevam();
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const devamSil = async (id) => {
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici, 'Silmek için PIN:');
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz!', 'error');
        if (!confirm('Bu devam kaydı silinsin mi?')) return;
        try {
            await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_personel_devam', islem_tipi: 'SILME', kullanici_adi: kullanici?.ad || 'Yönetici', eski_veri: { id } }]);
            const { error } = await supabase.from('b1_personel_devam').delete().eq('id', id);
            if (error) throw error;
            goster('Silindi.'); yukleDevam();
        } catch (error) { goster('Silme hatası: ' + error.message, 'error'); }
    };

    // Hesaplamalar
    const gunlukUcret = (p) => (parseFloat(p.saatlik_ucret_tl || 0) * parseInt(p.gunluk_calisma_dk || 480) / 60).toFixed(2);
    const primHesap = (p) => {
        const gunluk = parseFloat(gunlukUcret(p));
        const aylikMaliyet = gunluk * 22;
        const toplamDk = parseInt(p.gunluk_calisma_dk || 480) * 22;
        const uretimDegeri = toplamDk * sistemAyarlari.dakika_basi_ucret;
        const asim = uretimDegeri - aylikMaliyet;
        return { aylikMaliyet, uretimDegeri, asim, primHakki: asim > 0 ? asim * sistemAyarlari.prim_orani : 0 };
    };
    const izinBakiyesi = (p) => Math.max(0, sistemAyarlari.yillik_izin_hakki - devamlar.filter(d => d.personel_id === p.id && d.durum === 'izinli').length);
    const bordroYazdir = (p, detaylar) => {
        const { aylikMaliyet, uretimDegeri, asim, primHakki } = detaylar;
        const w = window.open('', '', 'width=600,height=800');
        w.document.write(`<html><head><title>Bordro - ${p.ad_soyad}</title><style>body{font-family:sans-serif;padding:30px} table{width:100%;border-collapse:collapse;margin-top:20px} td{border-bottom:1px solid #eee;padding:12px}</style></head><body><h1>ANTIGRAVITY TEXTILE</h1><h3>Aylık Maaş Bordrosu</h3><p><b>Personel:</b> ${p.ad_soyad} (${p.personel_kodu})</p><table><tr><td>Aylık Sabit Maaş</td><td>₺${aylikMaliyet.toFixed(2)}</td></tr><tr><td>Üretim Katkı Değeri</td><td>₺${uretimDegeri.toFixed(2)}</td></tr><tr><td>Prim Hakkı (%${(sistemAyarlari.prim_orani * 100).toFixed(0)})</td><td><b>₺${primHakki.toFixed(2)}</b></td></tr></table><h2>TOPLAM: ₺${(aylikMaliyet + primHakki).toFixed(2)}</h2><script>window.onload=()=>{window.print();window.close()}</script></body></html>`);
        w.document.close();
    };

    const filtreli = personeller.filter(p => {
        const rolOk = filtreRol === 'hepsi' || p.rol === filtreRol;
        const araOk = !aramaMetni || p.ad_soyad.toLowerCase().includes(aramaMetni.toLowerCase()) || p.personel_kodu.toLowerCase().includes(aramaMetni.toLowerCase());
        return rolOk && araOk;
    });

    return {
        personeller, filtreli, form, setForm, formAcik, setFormAcik, duzenleId, loading, mesaj, sistemAyarlari,
        aramaMetni, setAramaMetni, filtreRol, setFiltreRol, sekme, setSekme,
        devamlar, devamForm, setDevamForm, devamFormAcik, setDevamFormAcik, devamDuzenleId, setDevamDuzenleId,
        yukle, yukleDevam, kaydet, duzenle, sil, durumGuncelle,
        devamKaydet, devamSil, gunlukUcret, primHesap, izinBakiyesi, bordroYazdir,
    };
}
