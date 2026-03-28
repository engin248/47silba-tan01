'use client';
/**
 * features/kumas/hooks/useKumas.js
 * M2 Kumaş & Materyal Arşivi — Tüm State & İş Mantığı
 *
 *   import { useKumas } from '@/features/kumas';
 */
import { useState, useEffect, useCallback } from 'react';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import {
    fetchKumas, fetchAksesuar, fetchGorselArsiv,
    kumasKaydet, kumasGuncelle, aksesuarKaydet, kaydiSil,
    m3KaliphaneyeAktar, kumasKanaliKur,
    BOSH_KUMAS, BOSH_AKS,
} from '../services/kumasApi';

export function useKumas(kullanici) {
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [sekme, setSekme] = useState('kumas');
    const [kumaslar, setKumaslar] = useState(/** @type {any[]} */([]));
    const [aksesuarlar, setAksesuarlar] = useState(/** @type {any[]} */([]));
    const [firsatlar, setFirsatlar] = useState(/** @type {any[]} */([]));
    const [m1Talepleri, setM1Talepleri] = useState(/** @type {any[]} */([]));
    const [tedarikciler, setTedarikciler] = useState(/** @type {any[]} */([]));
    const [gorselArsiv, setGorselArsiv] = useState(/** @type {any[]} */([]));
    const [form, setForm] = useState(BOSH_KUMAS);
    const [aksForm, setAksForm] = useState(BOSH_AKS);
    const [formAcik, setFormAcik] = useState(false);
    const [duzenleId, setDuzenleId] = useState(null);
    const [duzenleTip, setDuzenleTip] = useState(/** @type {string | null} */(null));
    const [arama, setArama] = useState('');
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [barkodModal, setBarkodModal] = useState(null);

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            if (sekme === 'kumas') {
                const { kumaslar: k, tedarikciler: t } = await fetchKumas();
                setKumaslar(k); setTedarikciler(t);
            } else if (sekme === 'aksesuar') {
                setAksesuarlar(await fetchAksesuar());
            } else if (sekme === 'gorsel') {
                setGorselArsiv(await fetchGorselArsiv());
            } else if (sekme === 'm1') {
                const { fetchM1Talepleri } = await import('../services/kumasApi');
                setM1Talepleri(await fetchM1Talepleri());
            } else if (sekme === 'firsat') {
                const { fetchFirsatlar } = await import('../services/kumasApi');
                setFirsatlar(await fetchFirsatlar());
            }
        } catch (e) { goster('Bağlantı Hatası: ' + e.message, 'error'); }
        setLoading(false);
    }, [sekme]);

    useEffect(() => {
        let pin = false;
        try { pin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { pin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const ok = kullanici?.grup === 'tam' || pin;
        setYetkiliMi(ok);
        if (!ok) return;

        const kanal = kumasKanaliKur(yukle);
        yukle();
        return () => { kanal.unsubscribe(); };
    }, [kullanici, sekme, yukle]);

    const kumasKaydetAction = async () => {
        if (!form.kumas_kodu.trim() || form.kumas_kodu.length > 50) return goster('Kumaş kodu zorunlu, max 50 karakter!', 'error');
        if (!form.kumas_adi.trim() || form.kumas_adi.length > 200) return goster('Kumaş adı zorunlu, max 200 karakter!', 'error');
        if (!form.birim_maliyet_tl || parseFloat(form.birim_maliyet_tl) < 0) return goster('Birim maliyet zorunlu (negatif olamaz)!', 'error');
        if (!form.stok_mt || parseFloat(form.stok_mt) < 0) return goster('Stok zorunlu (negatif olamaz)!', 'error');
        setLoading(true);
        try {
            const res = await kumasKaydet(form);
            goster(res.offline ? '⚠️ İnternet yok: Kuyruğa alındı.' : '✅ Kumaş kaydedildi!');
            setForm(BOSH_KUMAS); setFormAcik(false); yukle();
        } catch (e) { goster('Hata: ' + e.message, 'error'); }
        setLoading(false);
    };

    const kumasGuncelleAction = async () => {
        if (!form.kumas_kodu.trim()) return goster('Kumaş kodu zorunlu!', 'error');
        setLoading(true);
        try {
            await kumasGuncelle(duzenleId, form);
            goster('✅ Kumaş güncellendi!');
            setForm(BOSH_KUMAS); setFormAcik(false); setDuzenleId(null); setDuzenleTip(null); yukle();
        } catch (e) { goster('Güncelleme hatası: ' + e.message, 'error'); }
        setLoading(false);
    };

    const aksesuarKaydetAction = async () => {
        if (!aksForm.aksesuar_kodu.trim() || aksForm.aksesuar_kodu.length > 50) return goster('Aksesuar kodu zorunlu, max 50 karakter!', 'error');
        if (!aksForm.aksesuar_adi.trim() || aksForm.aksesuar_adi.length > 200) return goster('Aksesuar adı zorunlu!', 'error');
        if (parseFloat(aksForm.birim_maliyet_tl) < 0) return goster('Maliyet negatif olamaz!', 'error');
        setLoading(true);
        try {
            const res = await aksesuarKaydet(aksForm, duzenleId && duzenleTip === 'aksesuar' ? duzenleId : null);
            goster(res.offline ? '⚠️ İnternet yok: Kuyruğa alındı.' : res.guncellendi ? '✅ Aksesuar güncellendi!' : '✅ Aksesuar kaydedildi!');
            setAksForm(BOSH_AKS); setFormAcik(false); setDuzenleId(null); setDuzenleTip(null); yukle();
        } catch (e) { goster('Hata: ' + e.message, 'error'); }
        setLoading(false);
    };

    const silAction = async (tablo, id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Bu veriyi silmek için Yönetici PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Pasif arşive kaldırılsın mı? (Soft delete)')) return;
        try {
            await kaydiSil(tablo, id, kullanici?.label);
            goster('Pasif arşive kaldırıldı.');
            yukle();
        } catch (e) { goster('Silme hatası: ' + e.message, 'error'); }
    };

    const duzenleKumasAc = (k) => {
        setForm({
            kumas_kodu: k.kumas_kodu, kumas_adi: k.kumas_adi, kumas_adi_ar: k.kumas_adi_ar || '',
            kumas_tipi: k.kumas_tipi, kompozisyon: k.kompozisyon || '',
            birim_maliyet_tl: String(k.birim_maliyet_tl || ''), genislik_cm: String(k.genislik_cm || ''),
            gramaj_gsm: String(k.gramaj_gsm || ''), esneme_payi_yuzde: String(k.esneme_payi_yuzde || '0'),
            fotograf_url: k.fotograf_url || '', tedarikci_adi: k.tedarikci_adi || '',
            tedarikci_id: k.tedarikci_id || '', stok_mt: String(k.stok_mt || ''),
            min_stok_mt: String(k.min_stok_mt || '10'),
        });
        setDuzenleId(k.id); setDuzenleTip('kumas'); setFormAcik(true); setSekme('kumas');
    };

    const filtreli = {
        kumaslar: kumaslar.filter(k => k.kumas_adi?.toLowerCase().includes(arama.toLowerCase()) || k.kumas_kodu?.toLowerCase().includes(arama.toLowerCase())),
        aksesuarlar: aksesuarlar.filter(a => a.aksesuar_adi?.toLowerCase().includes(arama.toLowerCase()) || a.aksesuar_kodu?.toLowerCase().includes(arama.toLowerCase())),
    };

    const m3eAktar = async (talep) => {
        if (!confirm('Bu karara ait Model Taslağı oluşturulup M3 Kalıphane sırasına gönderilsin mi?')) return;
        setLoading(true);
        try {
            await m3KaliphaneyeAktar(talep);
            goster('✅ Model Kalıphaneye (M3) aktarıldı!');
            await yukle();
        } catch (e) {
            goster('Kalıphaneye Aktarım Hatası: ' + e.message, 'error');
        }
        setLoading(false);
    };

    return {
        yetkiliMi, sekme, setSekme, kumaslar, aksesuarlar, tedarikciler, gorselArsiv, firsatlar,
        m1Talepleri, loading, mesaj, arama, setArama, filtreli,
        form, setForm, aksForm, setAksForm, formAcik, setFormAcik,
        duzenleId, duzenleTip, setDuzenleId, setDuzenleTip,
        barkodModal, setBarkodModal,
        kumasKaydet: kumasKaydetAction,
        kumasGuncelle: kumasGuncelleAction,
        aksesuarKaydet: aksesuarKaydetAction,
        sil: silAction,
        duzenleKumasAc,
        m3eAktar,
    };
}
