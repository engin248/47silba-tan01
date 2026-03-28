'use client';
// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import { createGoster } from '@/lib/utils';
import { receteVerileriniGetir, makineKaydetApi, makineSilApi, operasyonKaydetApi, operasyonSilApi } from '../services/receteApi';

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
            const data = await receteVerileriniGetir();
            setMakineler(data.makineler);
            setOperasyonlar(data.operasyonlar);
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
            const result = await makineKaydetApi(islem, frmMakine.id);
            if (result.isUpdate) goster('Makine güncellendi.');
            else goster('Yeni makine eklendi.');

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
            await makineSilApi(id);
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

            const result = await operasyonKaydetApi(kayit, frmOperasyon.id);
            if (result.isUpdate) goster('Operasyon güncellendi.');
            else goster('Yeni operasyon eklendi.');

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
            await operasyonSilApi(id);
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
