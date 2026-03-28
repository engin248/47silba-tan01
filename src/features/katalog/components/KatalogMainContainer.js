'use client';
import { useState, useEffect } from 'react';
import { BookOpen, Plus, RefreshCw, QrCode, Grid3X3, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import * as XLSX from 'xlsx';

// API ve Servisler (Zırhlı)
import {
    fetchKatalogUrunleri, logWhatsappTeklif, fetchVaryantStok, upsertVaryantStok,
    syncMaliyetFromM8, applyTopluFiyat, saveUrun, insertBulkUrunler, deleteUrun,
    fiyatGecmisiniGetir, tumUrunleriGetir
} from '../services/katalogApi';

// Alt Bileşenler (Tabs)
import KatalogIstatistikleriTab from './tabs/KatalogIstatistikleriTab';
import KatalogGridTab from './tabs/KatalogGridTab';
import KatalogFormDrawer from './tabs/KatalogFormDrawer';
import { SkuMatrisiModal, FiyatGecmisiModal } from './tabs/KatalogModallar';
import SilBastanModal from '@/components/ui/SilBastanModal';
import FizikselQRBarkod from '@/lib/components/barkod/FizikselQRBarkod';

const ANA_KATEGORILER = ['Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'İç Giyim', 'Spor', 'Aksesuar'];
const ALT_KATEGORILER = {
    'Üst Giyim': ['Gömlek', 'Tişört', 'Kazak', 'Hırka', 'Bluz'],
    'Alt Giyim': ['Pantolon', 'Etek', 'Tayt', 'Şort'],
    'Dış Giyim': ['Mont', 'Kaban', 'Ceket', 'Yağmurluk'],
    'İç Giyim': ['İç Çamaşırı', 'Pijama', 'Çorap'],
    'Spor': ['Eşofman', 'Spor Tişört', 'Spor Tayt'],
    'Aksesuar': ['Kemer', 'Çanta', 'Şapka', 'Fular'],
};

const BOSH_URUN = {
    urun_kodu: '', urun_adi: '', urun_adi_ar: '',
    satis_fiyati_tl: '', satis_fiyati_usd: '', birim_maliyet_tl: '',
    bedenler: '', renkler: '', stok_adeti: '', min_stok: '50',
    durum: 'aktif', kategori_ust: '', kategori_alt: '',
    fotograf_url: '', fotograf_url2: '', fotograf_url3: '', sku_not: '',
};

const DURUMLAR = ['aktif', 'pasif', 'tukenmek_uzere'];
const KATEGORILER = ['genel', 'gomlek', 'pantolon', 'elbise', 'dis_giyim', 'ic_giyim', 'spor', 'aksesuar'];
const KAT_LABEL = { genel: 'Genel', gomlek: 'Gömlek', pantolon: 'Pantolon', elbise: 'Elbise', dis_giyim: 'Dış Giyim', ic_giyim: 'İç Giyim', spor: 'Spor', aksesuar: 'Aksesuar' };

export default function KatalogMainContainer() {
    const { kullanici: rawKullanici, sayfaErisim } = useAuth();
    const kullanici = typeof rawKullanici === 'object' ? rawKullanici : {};
    const erisim = typeof sayfaErisim === 'function' ? sayfaErisim('/katalog') : true;

    const { lang } = useLang();
    const router = useRouter();

    const [usdKur, setUsdKur] = useState(32.5);
    const [finansGizli, setFinansGizli] = useState(true);

    const [urunler, setUrunler] = useState([]);
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOSH_URUN);
    const [duzenleId, setDuzenleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    const [barkodAcik, setBarkodAcik] = useState(false);
    const [seciliUrun, setSeciliUrun] = useState(null);
    const [arama, setArama] = useState('');
    const [kategoriFiltre, setKategoriFiltre] = useState('tumu');

    const [skuAcik, setSkuAcik] = useState(false);
    const [fiyatGecmisiAcik, setFiyatGecmisiAcik] = useState(false);
    const [fiyatGecmisi, setFiyatGecmisi] = useState([]);

    const [skuBedenler, setSkuBedenler] = useState(['S', 'M', 'L', 'XL']);
    const [skuRenkler, setSkuRenkler] = useState(['Siyah', 'Beyaz']);
    const [varyantStoklar, setVaryantStoklar] = useState({});

    const [topluFiyatAcik, setTopluFiyatAcik] = useState(false);
    const [topluFiyatForm, setTopluFiyatForm] = useState({ yuzde: '', kategori: 'tumu' });

    const [topluYuklemeAcik, setTopluYuklemeAcik] = useState(false);
    const [topluYukleniyor, setTopluYukleniyor] = useState(false);
    const [islemdeId, setIslemdeId] = useState(null);

    useEffect(() => {
        let isMounted = true;

        let debounceTimer = null;
        const kanal = supabase.channel('katalog-realtime-v3')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_urun_katalogu' }, (payload) => {
                if (!isMounted) return;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (!isMounted) return;
                    const { eventType, new: yeni, old: eski } = payload;
                    if (eventType === 'INSERT' && yeni) setUrunler(prev => [yeni, ...prev]);
                    else if (eventType === 'UPDATE' && yeni) setUrunler(prev => prev.map(u => u.id === yeni.id ? yeni : u));
                    else if (eventType === 'DELETE' && eski) setUrunler(prev => prev.filter(u => u.id !== eski.id));
                }, 300);
            }).subscribe();

        yukle();
        return () => { isMounted = false; clearTimeout(debounceTimer); supabase.removeChannel(kanal); };
    }, []);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 6000); };

    const yukle = async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), 10000));
            const data = await fetchKatalogUrunleri(timeout);
            if (data) setUrunler(data);
        } catch (error) { goster('Yüklenemedi', 'error'); }
        setLoading(false);
    };

    const kaydet = async () => {
        if (!form.urun_kodu.trim() || !form.urun_adi.trim() || !form.satis_fiyati_tl) return goster('Lütfen (*) işaretli alanları doldurun.', 'error');
        setLoading(true);
        try {
            const payload = { ...form, updated_at: new Date().toISOString() };
            if (payload.satis_fiyati_tl) payload.satis_fiyati_tl = parseFloat(payload.satis_fiyati_tl.toString() || '0');
            if (payload.birim_maliyet_tl) payload.birim_maliyet_tl = parseFloat(payload.birim_maliyet_tl.toString() || '0');
            // IDB Kalkan save bypass
            await saveUrun(duzenleId, payload);
            goster(`✅ Ürün ${duzenleId ? 'güncellendi' : 'eklendi'}!`);
            setForm(BOSH_URUN); setFormAcik(false); setDuzenleId(null); await yukle();
        } catch (e) { goster('Hata: ' + e.message, 'error'); }
        setLoading(false);
    };

    const sil = async (id, urun_kodu) => {
        if (islemdeId === 'sil_' + id) return;
        setIslemdeId('sil_' + id);
        if (!confirm(`"${urun_kodu}" kodlu ürün KALICI OLARAK silinecek. Onaylıyor musunuz?`)) { setIslemdeId(null); return; }
        try {
            await deleteUrun(id, urun_kodu, kullanici);
            goster('🗑️ Kayıt kalıcı olarak silindi.'); await yukle();
        } catch (e) { goster('Silinemedi', 'error'); }
        setIslemdeId(null);
    };

    const whatsappTeklif = async (u) => {
        const mesajMetni = `Merhaba! *${u.urun_adi}* (${u.urun_kodu}) için teklif: ₺${u.satis_fiyati_tl} | Stok: ${u.stok_adeti || 0} adet. Bilgi almak ister misiniz?`;
        window.open(`https://wa.me/?text=${encodeURIComponent(mesajMetni)}`, '_blank');
        logWhatsappTeklif({ teklif_icerik: mesajMetni, kanal: 'whatsapp', gonderim_durumu: 'gonderildi', gonderen: kullanici?.label || 'Saha' }).catch(() => { });
    };

    const fiyatGecmisiniAc = async (u) => {
        setSeciliUrun(u); setFiyatGecmisiAcik(true); setFiyatGecmisi([]);
        try {
            const data = await fiyatGecmisiniGetir(u.urun_kodu);
            const gecmis = data || [];
            if (gecmis.length === 0) gecmis.push({ satis_fiyati_tl: u.satis_fiyati_tl, birim_maliyet_tl: u.birim_maliyet_tl, updated_at: u.updated_at || u.created_at, not_str: 'Mevcut fiyat' });
            setFiyatGecmisi(gecmis);
        } catch { }
    };

    const skuMatrisiAc = async (u) => {
        setSeciliUrun(u); setVaryantStoklar({}); setSkuAcik(true);
        try {
            const stoks = await fetchVaryantStok(u.id);
            const map = {};
            (stoks || []).forEach(v => { map[`${v.beden}-${v.renk}`] = v.stok_adeti; });
            setVaryantStoklar(map);
        } catch { }
    };

    const varyantKaydet = async () => {
        if (!seciliUrun) return;
        const arr = [];
        for (const [key, qty] of Object.entries(varyantStoklar)) {
            if (qty !== '' && qty !== null) {
                const [sb, sr] = key.split('-');
                arr.push({ urun_id: seciliUrun.id, beden: sb, renk: sr, stok_adeti: qty });
            }
        }
        if (arr.length === 0) return goster('Hiçbir stok doldurulmadı', 'error');
        try {
            await upsertVaryantStok(arr);
            goster('✅ Matris Stokları Sisteme Aktarıldı!'); setSkuAcik(false);
        } catch (e) { goster('Kayıt edilemedi', 'error'); }
    };

    const m13MaliyetSync = async () => {
        setIslemdeId('sync');
        try {
            const r = await syncMaliyetFromM8();
            if (r.count > 0) { goster(`✅ ${r.count} kalem ürünün "Birim Maliyeti" (M13) sisteminden güncellendi.`); await yukle(); }
            else goster('⚠️ Tüm maliyetler zaten güncel.');
        } catch (e) { goster('Eşitleme hatası.', 'error'); }
        setIslemdeId(null);
    };

    const exceldenTopluSecData = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setTopluYukleniyor(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetNames = workbook.SheetNames;
            if (sheetNames.length === 0) throw new Error("Excel boş");
            const sheet = workbook.Sheets[sheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);
            const uret = json.map((r, i) => ({
                urun_kodu: (r["Ürün Kodu"] || `R-${Date.now()}-${i}`).toString(),
                urun_adi: r["Ürün Adı"] || 'İsimsiz Ürün',
                satis_fiyati_tl: parseFloat(r["Fiyat (TL)"]) || 0,
                kategori_ust: r["Kategori"] || 'Genel',
                stok_adeti: parseInt(r["Stok"]) || 0,
                durum: 'aktif'
            }));
            await insertBulkUrunler(uret);
            goster(`✅ ${uret.length} ürün başarıyla yüklendi!`);
            setTopluYuklemeAcik(false); await yukle();
        } catch (error) { goster("Excel Okuma Hatası: " + error.message, 'error'); }
        setTopluYukleniyor(false);
    };

    const filtreli = urunler.filter(u => {
        const textAra = arama.toLowerCase();
        const aYok = !arama || [u.urun_kodu, u.urun_adi].some(v => v?.toLowerCase().includes(textAra));
        const kYok = kategoriFiltre === 'tumu' || u.kategori_ust === kategoriFiltre;
        return aYok && kYok;
    });

    const isAR = lang === 'ar';

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(5,150,105,0.3)]">
                        <BookOpen size={24} className="text-emerald-50" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight m-0">{isAR ? 'كتالوج المنتجات' : 'Vitrin & Katalog (M10)'}</h1>
                        <p className="text-xs font-bold text-emerald-200 mt-1 uppercase tracking-wider">{isAR ? '...' : 'Otonom Fiyat ve SKU Motoru'}</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    <button onClick={m13MaliyetSync} disabled={islemdeId === 'sync'} className={`bg-blue-900/50 hover:bg-blue-800 border-2 border-blue-900 text-blue-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer ${islemdeId === 'sync' ? 'animate-pulse' : ''}`}>
                        <RefreshCw size={14} /> M13'ten Maliyet Çek
                    </button>
                    <button onClick={() => setFinansGizli(!finansGizli)} className="bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer">
                        {finansGizli ? '👁️ Zırhı Aç (Ciro)' : '🙈 Zırhı Kapat (Maliyet)'}
                    </button>
                    <button onClick={() => setTopluYuklemeAcik(true)} className="bg-slate-900 border-b-4 border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer">
                        📦 Toplu Excel / CSV Yükle
                    </button>
                    <button onClick={() => { setForm(BOSH_URUN); setDuzenleId(null); setFormAcik(!formAcik); }} className="bg-emerald-600 border-b-4 border-emerald-800 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer">
                        <Plus size={18} /> {isAR ? 'إضافة' : 'Yeni Kart'}
                    </button>
                </div>
            </div>

            <KatalogIstatistikleriTab urunler={urunler} />

            {mesaj.text && (
                <div className={`p-4 mb-6 rounded-xl font-bold flex items-center shadow-sm border-2 animate-pulse ${mesaj.type === 'error' ? 'bg-red-950/20 text-red-500 border-red-500/50' : 'bg-emerald-950/20 text-emerald-500 border-emerald-500/50'}`}>
                    {mesaj.text}
                </div>
            )}

            <div className="flex gap-2 mb-6 flex-wrap items-center bg-[#0d1117] text-white p-2 rounded-xl border border-[#1e4a43]">
                <div className="flex-[2] min-w-[200px]">
                    <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Ürün Adı veya Kodunda arayın (Anında)..."
                        className="w-full bg-[#122b27] border border-[#1e4a43] text-white font-bold text-sm px-4 py-2 rounded-lg outline-none focus:border-emerald-500" />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <select value={kategoriFiltre} onChange={e => setKategoriFiltre(e.target.value)} className="w-full bg-[#122b27] border border-[#1e4a43] text-white font-bold text-sm px-4 py-2 rounded-lg outline-none focus:border-emerald-500">
                        <option value="tumu">Tüm Kategoriler</option>
                        {ANA_KATEGORILER.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-[#122b27] px-3 py-1.5 rounded-lg border border-[#1e4a43]">{filtreli.length} Adet Model</span>
            </div>

            <KatalogFormDrawer
                formAcik={formAcik} setFormAcik={setFormAcik} form={form} setForm={setForm}
                BOSH_URUN={BOSH_URUN} duzenleId={duzenleId} setDuzenleId={setDuzenleId} kaydet={kaydet} loading={loading}
                DURUMLAR={DURUMLAR} KATEGORILER={KATEGORILER} KAT_LABEL={KAT_LABEL} ANA_KATEGORILER={ANA_KATEGORILER} ALT_KATEGORILER={ALT_KATEGORILER}
            />

            <KatalogGridTab
                filtreli={filtreli} setBarkodAcik={setBarkodAcik} setSeciliUrun={setSeciliUrun}
                skuMatrisiAc={skuMatrisiAc} fiyatGecmisiniAc={fiyatGecmisiniAc} BOSH_URUN={BOSH_URUN}
                setForm={setForm} setDuzenleId={setDuzenleId} setFormAcik={setFormAcik}
                whatsappTeklif={whatsappTeklif} sil={sil} islemdeId={islemdeId} finansGizli={finansGizli}
            />

            <SkuMatrisiModal
                skuAcik={skuAcik} setSkuAcik={setSkuAcik} seciliUrun={seciliUrun} varyantStoklar={varyantStoklar} setVaryantStoklar={setVaryantStoklar}
                skuBedenler={skuBedenler} setSkuBedenler={setSkuBedenler} skuRenkler={skuRenkler} setSkuRenkler={setSkuRenkler} varyantKaydet={varyantKaydet}
            />
            <FiyatGecmisiModal acik={fiyatGecmisiniAcik} setAcik={setFiyatGecmisiAcik} seciliUrun={seciliUrun} fiyatGecmisi={fiyatGecmisi} />

            <SilBastanModal acik={barkodAcik} onClose={() => setBarkodAcik(false)} title="Ürün Barkodu (Fiziksel Mağaza / Depo)">
                <div className="flex flex-col items-center justify-center py-4 bg-white rounded">
                    {seciliUrun && <FizikselQRBarkod urun={seciliUrun} />}
                </div>
            </SilBastanModal>

            <SilBastanModal acik={topluYuklemeAcik} onClose={() => setTopluYuklemeAcik(false)} title="📦 Toplu Yükleme (Katalog)">
                <div className="bg-[#122b27] p-6 rounded-xl border border-[#1e4a43]">
                    <h4 className="text-emerald-400 font-black mb-2 uppercase">Excel (XLSX) Otonom Aktarım</h4>
                    <p className="text-slate-400 text-xs font-bold mb-4">Sütunlar: "Ürün Kodu", "Ürün Adı", "Fiyat (TL)", "Stok", "Kategori"</p>
                    <input type="file" accept=".xlsx, .csv" onChange={exceldenTopluSecData} className="w-full bg-[#0d1117] text-slate-300 p-3 rounded-lg border-2 border-dashed border-emerald-900 cursor-pointer" />
                    {topluYukleniyor && <div className="mt-4 text-amber-500 font-bold text-center animate-pulse">⏳ Sisteme basılıyor... Göçürülen kayıtlar: {'>'}100+ olabilir</div>}
                </div>
            </SilBastanModal>
        </div>
    );
}
