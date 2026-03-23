'use client';
// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export function useUretimRecetesi(kullanici, modeller, aktifSekme) {
    const [makineler, setMakineler] = useState([]);
    const [operasyonlar, setOperasyonlar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    // CRUD Form States
    const [frmMakine, setFrmMakine] = useState({ makine_kodu: '', makine_adi: '', durum: 'aktif' });
    const [frmOperasyon, setFrmOperasyon] = useState({ model_id: '', operasyon_adi: '', makine_id: '', sira_no: 1, zorluk_derecesi: 5, hazirlik_suresi_sn: 0, parca_basi_deger_tl: 0 });
    const [makineFormAcik, setMakineFormAcik] = useState(false);
    const [opFormAcik, setOpFormAcik] = useState(false);
    const [islemdeId, setIslemdeId] = useState(null);

    const goster = createGoster(setMesaj);

    const yukle = useCallback(async () => {
        if (aktifSekme !== 'receteler') return; // Sadece o sekmedeyken datayı çek
        setLoading(true);
        try {
            const [mRes, oRes] = await Promise.all([
                supabase.from('b1_makineler').select('*').order('created_at', { ascending: true }),
                supabase.from('b1_uretim_operasyonlari').select('*, b1_model_taslaklari(model_kodu, model_adi), b1_makineler(makine_kodu, makine_adi)').order('model_id').order('sira_no', { ascending: true })
            ]);
            if (mRes.data) setMakineler(mRes.data);
            if (oRes.data) setOperasyonlar(oRes.data);
        } catch (e) {
            goster('Reçete/Makine yükleme hatası: ' + e.message, 'error');
        }
        setLoading(false);
    }, [aktifSekme]);

    useEffect(() => {
        yukle();
    }, [yukle]);

    // MAKİNE CRUD
    const makineKaydet = async () => {
        if (!frmMakine.makine_kodu || !frmMakine.makine_adi) return goster('Kod ve Ad zorunludur.', 'error');
        setLoading(true);
        try {
            const islem = { makine_kodu: frmMakine.makine_kodu.toUpperCase(), makine_adi: frmMakine.makine_adi, durum: frmMakine.durum };
            if (frmMakine.id) {
                const { error } = await supabase.from('b1_makineler').update(islem).eq('id', frmMakine.id);
                if (error) throw error;
                goster('Makine güncellendi.');
            } else {
                const { error } = await supabase.from('b1_makineler').insert([islem]);
                if (error) throw error;
                goster('Yeni makine eklendi.');
            }
            setFrmMakine({ makine_kodu: '', makine_adi: '', durum: 'aktif' });
            setMakineFormAcik(false);
            yukle();
        } catch (e) {
            goster('Kayıt başarısız: ' + e.message, 'error');
        }
        setLoading(false);
    };

    const makineDuzenle = (m) => { setFrmMakine(m); setMakineFormAcik(true); };

    const makineSil = async (id) => {
        if (!confirm('Makine kalıcı olarak silinsin mi?')) return;
        setIslemdeId('mak_sil_' + id);
        try {
            const { error } = await supabase.from('b1_makineler').delete().eq('id', id);
            if (error) throw error;
            goster('Makine silindi.');
            yukle();
        } catch (e) { goster('Silme hatası: ' + e.message, 'error'); }
        setIslemdeId(null);
    };

    // OPERASYON (REÇETE) CRUD
    const operasyonKaydet = async () => {
        if (!frmOperasyon.model_id || !frmOperasyon.operasyon_adi) return goster('Model ve Operasyon Adı zorunlu!', 'error');
        setLoading(true);
        try {
            const kayit = {
                model_id: frmOperasyon.model_id,
                operasyon_adi: frmOperasyon.operasyon_adi,
                makine_id: frmOperasyon.makine_id || null, // null kabul etsin
                sira_no: parseInt(frmOperasyon.sira_no) || 1,
                zorluk_derecesi: parseInt(frmOperasyon.zorluk_derecesi) || 5,
                hazirlik_suresi_sn: parseInt(frmOperasyon.hazirlik_suresi_sn) || 0,
                parca_basi_deger_tl: parseFloat(frmOperasyon.parca_basi_deger_tl) || 0
            };

            if (frmOperasyon.id) {
                const { error } = await supabase.from('b1_uretim_operasyonlari').update(kayit).eq('id', frmOperasyon.id);
                if (error) throw error;
                goster('Operasyon güncellendi.');
            } else {
                const { error } = await supabase.from('b1_uretim_operasyonlari').insert([kayit]);
                if (error) throw error;
                goster('Yeni operasyon eklendi.');
            }
            setFrmOperasyon({ model_id: frmOperasyon.model_id, operasyon_adi: '', makine_id: '', sira_no: kayit.sira_no + 1, zorluk_derecesi: 5, hazirlik_suresi_sn: 0, parca_basi_deger_tl: 0 }); // Sırayı 1 arttır
            setOpFormAcik(false);
            yukle();
        } catch (e) { goster('Operasyon kayıt hatası: ' + e.message, 'error'); }
        setLoading(false);
    };

    const operasyonDuzenle = (o) => { setFrmOperasyon(o); setOpFormAcik(true); };

    const operasyonSil = async (id) => {
        if (!confirm('Bu operasyon adımı reçeteden silinsin mi?')) return;
        setIslemdeId('op_sil_' + id);
        try {
            const { error } = await supabase.from('b1_uretim_operasyonlari').delete().eq('id', id);
            if (error) throw error;
            goster('Operasyon silindi.');
            yukle();
        } catch (e) { goster('Silme hatası: ' + e.message, 'error'); }
        setIslemdeId(null);
    };

    return {
        makineler, operasyonlar,
        receteMesaj: mesaj,
        receteLoading: loading,
        islemdeId,
        frmMakine, setFrmMakine, makineFormAcik, setMakineFormAcik,
        makineKaydet, makineDuzenle, makineSil,
        frmOperasyon, setFrmOperasyon, opFormAcik, setOpFormAcik,
        operasyonKaydet, operasyonDuzenle, operasyonSil,
        receteYukle: yukle
    };
}
