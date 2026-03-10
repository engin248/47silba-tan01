'use client';
/**
 * features/katalog/hooks/useKatalog.js
 * M9 Ürün Kataloğu — Tüm State & İş Mantığı
 *
 * Çalışma prensibi:
 *   import { useKatalog } from '@/features/katalog';
 *   const { urunler, kaydet, sil, form, setForm ... } = useKatalog(kullanici);
 */
import { useState, useEffect, useCallback } from 'react';
import { telegramBildirim } from '@/lib/utils';
import {
    tumUrunleriGetir,
    urunKaydet,
    urunSil,
    fiyatGecmisiniGetir,
    katalogKanaliKur,
    siparisOtofillUrl,
    USD_KUR as _USD_KUR,
} from '../services/katalogApi';

// ── Sabitler ──────────────────────────────────────────────────────────────────
export const USD_KUR = _USD_KUR;  // KatalogRefactored için re-export
export const ANA_KATEGORILER = ['Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'İç Giyim', 'Spor', 'Aksesuar'];
export const ALT_KATEGORILER = {
    'Üst Giyim': ['Gömlek', 'Tişört', 'Kazak', 'Hırka', 'Bluz'],
    'Alt Giyim': ['Pantolon', 'Etek', 'Tayt', 'Şort'],
    'Dış Giyim': ['Mont', 'Kaban', 'Ceket', 'Yağmurluk'],
    'İç Giyim': ['İç Çamaşırı', 'Pijama', 'Çorap'],
    'Spor': ['Eşofman', 'Spor Tişört', 'Spor Tayt'],
    'Aksesuar': ['Kemer', 'Çanta', 'Şapka', 'Fular'],
};
export const DURUMLAR = ['aktif', 'pasif', 'tukenmek_uzere'];
export const BOSH_URUN = {
    urun_kodu: '', urun_adi: '', urun_adi_ar: '',
    satis_fiyati_tl: '', satis_fiyati_usd: '', birim_maliyet_tl: '',
    bedenler: '', renkler: '', stok_adeti: '', min_stok: '50',
    durum: 'aktif',
    kategori_ust: '', kategori_alt: '',
    fotograf_url: '', fotograf_url2: '', fotograf_url3: '',
};
// Alias — KatalogRefactored.jsx BOS_URUN isimli import bekliyor
export const BOS_URUN = BOSH_URUN;

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useKatalog(kullanici) {
    const [urunler, setUrunler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [form, setForm] = useState(BOSH_URUN);
    const [duzenleId, setDuzenleId] = useState(null);
    const [formAcik, setFormAcik] = useState(false);
    const [arama, setArama] = useState('');
    const [finansGizli, setFinansGizli] = useState(true);
    const [barkodAcik, setBarkodAcik] = useState(false);
    const [seciliUrun, setSeciliUrun] = useState(null);

    // KAT-04: SKU
    const [skuAcik, setSkuAcik] = useState(false);
    const [skuBedenler, setSkuBedenler] = useState(['S', 'M', 'L', 'XL']);
    const [skuRenkler, setSkuRenkler] = useState(['Siyah', 'Beyaz']);

    // KAT-05: Fiyat geçmişi
    const [fiyatGecmisiAcik, setFiyatGecmisiAcik] = useState(false);
    const [fiyatGecmisi, setFiyatGecmisi] = useState([]);

    // KAT-06: Stok sync
    const [sonSenkron, setSonSenkron] = useState(null);

    // ── Veri Yükle ──────────────────────────────────────────────────────────
    const yukle = useCallback(async () => {
        setLoading(true);
        const { data, error } = await tumUrunleriGetir();
        if (error) goster('Liste yüklenemedi: ' + error.message, 'error');
        else {
            setUrunler(data);
            setSonSenkron(new Date());
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const kanal = katalogKanaliKur(() => { if (isMounted) yukle(); });
        yukle();
        return () => { isMounted = false; };
    }, [yukle]);

    // ── Mesaj göster ─────────────────────────────────────────────────────────
    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 6000);
    };

    // ── Kaydet ───────────────────────────────────────────────────────────────
    const kaydet = async () => {
        if (!form.urun_kodu.trim()) return goster('Ürün Kodu zorunludur.', 'error');
        if (!form.urun_adi.trim()) return goster('Ürün Adı zorunludur.', 'error');
        if (!form.satis_fiyati_tl || form.satis_fiyati_tl <= 0) return goster('Geçerli bir Satış Fiyatı girin.', 'error');

        setLoading(true);
        const { ok, mesaj: m } = await urunKaydet(form, duzenleId);
        goster(m, ok ? 'success' : 'error');
        if (ok) {
            if (!duzenleId) {
                telegramBildirim(`🛍️ YENİ ÜRÜN (M9)\nKodu: ${form.urun_kodu.toUpperCase()}\nFiyat: ${form.satis_fiyati_tl} TL\nStok: ${form.stok_adeti}`);
            }
            formSifirla();
            yukle();
        }
        setLoading(false);
    };

    // ── Sil ──────────────────────────────────────────────────────────────────
    const sil = async (id, urunKodu) => {
        if (!confirm('Ürünü katalogdan SİLERSENİZ, bağlantılı siparişlerde hata olabilir. Emin misiniz?')) return;
        const { ok, mesaj: m } = await urunSil(id, urunKodu, kullanici?.label);
        goster(m, ok ? 'success' : 'error');
        if (ok) {
            telegramBildirim(`🗑️ ÜRÜN SİLİNDİ\n${urunKodu} stoklardan ve katalogdan kaldırıldı.`);
            yukle();
        }
    };

    // ── Düzenle ──────────────────────────────────────────────────────────────
    const duzenleBaslat = (u) => {
        setForm({
            urun_kodu: u.urun_kodu, urun_adi: u.urun_adi, urun_adi_ar: u.urun_adi_ar || '',
            satis_fiyati_tl: u.satis_fiyati_tl, birim_maliyet_tl: u.birim_maliyet_tl || '',
            bedenler: u.bedenler || '', renkler: u.renkler || '',
            stok_adeti: u.stok_adeti, min_stok: u.min_stok, durum: u.durum,
            kategori_ust: u.kategori_ust || '', kategori_alt: u.kategori_alt || '',
            fotograf_url: u.fotograf_url || '', fotograf_url2: u.fotograf_url2 || '',
            fotograf_url3: u.fotograf_url3 || '', satis_fiyati_usd: u.satis_fiyati_usd || '',
        });
        setDuzenleId(u.id);
        setFormAcik(true);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formSifirla = () => { setForm(BOSH_URUN); setFormAcik(false); setDuzenleId(null); };

    // ── KAT-04: SKU Matrisi ──────────────────────────────────────────────────
    const skuMatrisiAc = (u) => {
        setSeciliUrun(u);
        if (u.bedenler) setSkuBedenler(u.bedenler.split(',').map(s => s.trim()).filter(Boolean));
        if (u.renkler) setSkuRenkler(u.renkler.split(',').map(s => s.trim()).filter(Boolean));
        setSkuAcik(true);
    };

    // ── KAT-05: Fiyat Geçmişi ────────────────────────────────────────────────
    const fiyatGecmisiniAc = async (u) => {
        setSeciliUrun(u);
        setFiyatGecmisi([]);
        setFiyatGecmisiAcik(true);
        const gecmis = await fiyatGecmisiniGetir(u.urun_kodu);
        if (gecmis.length === 0) {
            gecmis.push({ satis_fiyati_tl: u.satis_fiyati_tl, birim_maliyet_tl: u.birim_maliyet_tl, updated_at: u.updated_at || u.created_at, not: 'Mevcut fiyat' });
        }
        setFiyatGecmisi(gecmis);
    };

    // ── KAT-01: Siparişe Otofill ─────────────────────────────────────────────
    const otofillSiparise = (u) => {
        if (typeof window !== 'undefined') window.location.href = siparisOtofillUrl(u);
    };

    // ── Filtreli liste ───────────────────────────────────────────────────────
    const filtreliUrunler = urunler.filter(u =>
        !arama ||
        u.urun_kodu?.toLowerCase().includes(arama.toLowerCase()) ||
        u.urun_adi?.toLowerCase().includes(arama.toLowerCase()) ||
        u.urun_adi_ar?.toLowerCase().includes(arama.toLowerCase())
    );

    const istatistik = {
        toplam: urunler.length,
        aktif: urunler.filter(u => u.durum === 'aktif').length,
        kritik: urunler.filter(u => u.stok_adeti <= u.min_stok).length,
        ortFiyat: urunler.length
            ? (urunler.reduce((s, u) => s + parseFloat(u.satis_fiyati_tl || 0), 0) / urunler.length).toFixed(0)
            : 0,
    };

    return {
        // Veriler
        urunler, filtreliUrunler, istatistik, loading, mesaj, sonSenkron,
        // Form
        form, setForm, duzenleId, formAcik, setFormAcik, formSifirla,
        // Arama & Filtre
        arama, setArama, finansGizli, setFinansGizli,
        // Modallar
        barkodAcik, setBarkodAcik, seciliUrun, setSeciliUrun,
        skuAcik, setSkuAcik, skuBedenler, skuRenkler,
        fiyatGecmisiAcik, setFiyatGecmisiAcik, fiyatGecmisi,
        // Fonksiyonlar
        // duzenleAc = KatalogRefactored'ın beklediği isim
        duzenleAc: duzenleBaslat,
        kaydet, sil, duzenleBaslat, yukle,
        skuMatrisiAc, fiyatGecmisiniAc, otofillSiparise,
        USD_KUR,
    };
}
