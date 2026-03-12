'use client';
/**
 * features/katalog/components/KatalogMainContainer.js
 * Kaynak: app/katalog/page.js → features mimarisine taşındı
 * UI logic burada, state/data → hooks/useKatalog.js
 */
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { BookOpen, ShoppingBag, Plus, RefreshCw, AlertTriangle, CheckCircle2, QrCode, Trash2, Tag, ShieldCheck, Image, Grid3X3, History, Link as LinkIcon, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula'; // [B-08 FIX]
import SilBastanModal from '@/lib/components/ui/SilBastanModal';
import FizikselQRBarkod from '@/lib/components/barkod/FizikselQRBarkod';
import * as XLSX from 'xlsx'; // B-04: Excel/CSV Import kütüphanesi eklendi
import Link from 'next/link';

const USD_KUR_VARSAYILAN = 32.5; // [A-02] Yedek değer — /api/kur erişilemezse kullanılır

// KAT-03: Kategori Hiyerarşisi
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
    durum: 'aktif',
    // KAT-03
    kategori_ust: '', kategori_alt: '',
    // KAT-02
    fotograf_url: '', fotograf_url2: '', fotograf_url3: '',
    // KAT-04
    sku_not: '',
};
const DURUMLAR = ['aktif', 'pasif', 'tukenmek_uzere'];
const KATEGORILER = ['genel', 'gomlek', 'pantolon', 'elbise', 'dis_giyim', 'ic_giyim', 'spor', 'aksesuar'];
const KAT_LABEL = { genel: 'Genel', gomlek: 'Gömlek', pantolon: 'Pantolon', elbise: 'Elbise', dis_giyim: 'Dış Giyim', ic_giyim: 'İç Giyim', spor: 'Spor', aksesuar: 'Aksesuar' };

export default function KatalogSayfasi() {
    const { kullanici, sayfaErisim } = useAuth();
    const erisim = sayfaErisim('/katalog');

    const [usdKur, setUsdKur] = useState(USD_KUR_VARSAYILAN); // [A-02] Canlı döviz kuru
    const [kurTarihi, setKurTarihi] = useState('');
    const [mounted, setMounted] = useState(false);
    const { lang } = useLang();

    // [A-02] Canlı döviz kuru çek
    useEffect(() => {
        fetch('/api/kur')
            .then(r => r.json())
            .then(d => { if (d?.usd_tl) { setUsdKur(d.usd_tl); setKurTarihi(d.tarih || ''); } })
            .catch(() => { }); // hata durumunda varsayılan 32.5 kalır
    }, []);
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
    // KAT-04/05: SKU & Fiyat Geçmişi modal
    const [skuAcik, setSkuAcik] = useState(false);
    const [fiyatGecmisiAcik, setFiyatGecmisiAcik] = useState(false);
    const [fiyatGecmisi, setFiyatGecmisi] = useState([]);
    // KAT-06: Stok sync timestamp
    const [sonSenkron, setSonSenkron] = useState(null);
    // KAT-04: SKU varyant oluşturucu
    const [skuBedenler, setSkuBedenler] = useState(['S', 'M', 'L', 'XL']);
    const [skuRenkler, setSkuRenkler] = useState(['Siyah', 'Beyaz']);

    // KAT-04 (B-04): Toplu Ürün Yükleme (Excel/CSV)
    const [topluYuklemeAcik, setTopluYuklemeAcik] = useState(false);
    const [topluYukleniyor, setTopluYukleniyor] = useState(false);
    const [islemdeId, setIslemdeId] = useState(null); // [SPAM ZIRHI]

    useEffect(() => {
        setMounted(true);
        let isMounted = true;
        const kanal = supabase.channel('m9-gercek-zamanli')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_urun_katalogu' }, () => {
                if (isMounted) yukle();
            })
            .subscribe();
        yukle();
        return () => { isMounted = false; supabase.removeChannel(kanal); };
    }, []);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 6000); };

    // [WhatsApp Teklif]: Seçilen ürün bilgilerini WA ile fırlat + log kaydet
    const whatsappTeklif = async (u) => {
        const mesajMetni = `Merhaba! *${u.urun_adi}* (${u.urun_kodu}) için teklif:  ₺${u.satis_fiyati_tl} | Stok: ${u.stok_adeti} adet. Bilgi almak ister misiniz?`;
        const waUrl = `https://wa.me/?text=${encodeURIComponent(mesajMetni)}`;
        window.open(waUrl, '_blank');
        // Log kaydı
        try {
            await supabase.from('b2_teklif_logs').insert([{
                teklif_icerik: mesajMetni,
                kanal: 'whatsapp',
                gonderim_durumu: 'gonderildi',
                gonderen: kullanici?.label || 'Satış Yetkilisi',
            }]);
        } catch { }
    };


    const yukle = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('b2_urun_katalogu').select('*').order('created_at', { ascending: false }).limit(300);
            if (error) throw error;
            if (data) setUrunler(data);
            setSonSenkron(new Date()); // KAT-06: stok sync timestamp
        } catch (error) {
            goster('Liste yüklenemedi: ' + error.message, 'error');
        }
        setLoading(false);
    };

    // KAT-01: Siparişe Otofill Geçiş
    const otofillSiparise = (u) => {
        const params = new URLSearchParams({
            urun_kodu: u.urun_kodu,
            urun_adi: u.urun_adi,
            fiyat: u.satis_fiyati_tl,
            stok: u.stok_adeti
        });
        window.location.href = `/siparisler?${params.toString()}`;
    };

    // KAT-05: Fiyat Geçmişi yükle
    const fiyatGecmisiniAc = async (u) => {
        setSeciliUrun(u);
        setFiyatGecmisi([]);
        setFiyatGecmisiAcik(true);
        try {
            const { data } = await supabase
                .from('b2_urun_katalogu')
                .select('satis_fiyati_tl, birim_maliyet_tl, updated_at')
                .eq('urun_kodu', u.urun_kodu)
                .order('updated_at', { ascending: false })
                .limit(10);
            // Gerçek fiyat geçmişi tablosu yoksa mevcut kaydı satır olarak göster
            const gecmis = data || [];
            if (gecmis.length === 0) gecmis.push({ satis_fiyati_tl: u.satis_fiyati_tl, birim_maliyet_tl: u.birim_maliyet_tl, updated_at: u.updated_at || u.created_at, not: 'Mevcut fiyat' });
            setFiyatGecmisi(gecmis);
        } catch { }
    };

    // KAT-04: SKU Matrisi Ac
    const skuMatrisiAc = (u) => {
        setSeciliUrun(u);
        if (u.bedenler) setSkuBedenler(u.bedenler.split(',').map(s => s.trim()).filter(Boolean));
        if (u.renkler) setSkuRenkler(u.renkler.split(',').map(s => s.trim()).filter(Boolean));
        setSkuAcik(true);
    };

    const kaydet = async () => {
        if (islemdeId === 'kayit') return;
        setIslemdeId('kayit');
        if (!form.urun_kodu.trim()) { setIslemdeId(null); return goster('Ürün Kodu zorunludur.', 'error'); }
        if (!form.urun_adi.trim()) { setIslemdeId(null); return goster('Ürün Adı zorunludur.', 'error'); }
        if (!form.satis_fiyati_tl || form.satis_fiyati_tl <= 0) { setIslemdeId(null); return goster('Geçerli bir Satış Fiyatı girin.', 'error'); }

        setLoading(true);
        const payload = {
            urun_kodu: form.urun_kodu.toUpperCase().trim(),
            urun_adi: form.urun_adi.trim(),
            urun_adi_ar: form.urun_adi_ar.trim() || null,
            satis_fiyati_tl: parseFloat(form.satis_fiyati_tl) || 0,
            satis_fiyati_usd: form.satis_fiyati_usd ? parseFloat(form.satis_fiyati_usd) : (parseFloat(form.satis_fiyati_tl) / USD_KUR) || null,
            birim_maliyet_tl: parseFloat(form.birim_maliyet_tl) || 0,
            bedenler: form.bedenler.trim() || null,
            renkler: form.renkler.trim() || null,
            stok_adeti: parseInt(form.stok_adeti) || 0,
            min_stok: parseInt(form.min_stok) || 0,
            durum: form.durum,
            // KAT-03: Kategori hiyerarşisi
            kategori_ust: form.kategori_ust || null,
            kategori_alt: form.kategori_alt || null,
            // KAT-02: Fotoğraf galerisi
            fotograf_url: form.fotograf_url.trim() || null,
            fotograf_url2: form.fotograf_url2?.trim() || null,
            fotograf_url3: form.fotograf_url3?.trim() || null,
        };

        if (payload.satis_fiyati_tl > 0 && payload.birim_maliyet_tl > 0) {
            payload.kar_marji_yuzde = ((payload.satis_fiyati_tl - payload.birim_maliyet_tl) / payload.birim_maliyet_tl) * 100;
        } else { payload.kar_marji_yuzde = 0; }

        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b2_urun_katalogu', payload);
            goster('✅ Çevrimdışı: Ürün kuyruğa eklendi. Bağlantı gelince yollanacak.', 'success');
            setForm(BOSH_URUN); setFormAcik(false); setDuzenleId(null);
            setLoading(false);
            setIslemdeId(null);
            return;
        }

        try {
            // Çifte kayıt engeli (yeni kayıt ise)
            if (!duzenleId) {
                const { data: mevcut } = await supabase.from('b2_urun_katalogu').select('id').eq('urun_kodu', payload.urun_kodu);
                if (mevcut && mevcut.length > 0) {
                    setLoading(false);
                    setIslemdeId(null);
                    return goster('⚠️ Bu Ürün Kodu zaten katalogda mevcut!', 'error');
                }
            }

            if (duzenleId) {
                const { error } = await supabase.from('b2_urun_katalogu').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Ürün güncellendi!');
            } else {
                const { error } = await supabase.from('b2_urun_katalogu').insert([payload]);
                if (error) throw error;
                goster('✅ Yeni Ürün Kataloğa Eklendi!');
                telegramBildirim(`🛍️ YENİ ÜRÜN (M9)\nKodu: ${payload.urun_kodu}\nFiyat: ${payload.satis_fiyati_tl} TL\nStok: ${payload.stok_adeti}`);
            }
            setForm(BOSH_URUN); setFormAcik(false); setDuzenleId(null);
            yukle();
        } catch (error) {
            goster('Hata oluştu: ' + error.message, 'error');
        }
        finally { setLoading(false); setIslemdeId(null); }
    };

    // ==========================================
    // B-04: TOPLU EXCEL/CSV İÇE AKTARMA (IMPORT)
    // ==========================================
    const sablonIndir = () => {
        const sablon_verisi = [
            {
                'Ürün Kodu *': 'TSH-101',
                'Ürün Adı (TR) *': 'Yazlık Tişört',
                'Ürün Adı (AR)': 'تي شيرت صيفي',
                'Birim Maliyet (TL)': 120,
                'Satış Fiyatı (TL) *': 299.90,
                'Satış Fiyatı (USD)': 9.50,
                'Stok *': 150,
                'Kritik Stok': 20,
                'Bedenler': 'S, M, L',
                'Renkler': 'Beyaz, Siyah',
                'Ana Kategori': 'Üst Giyim',
                'Alt Kategori': 'Tişört',
                'Foto URL 1': '',
                'Foto URL 2': '',
                'Foto URL 3': '',
                'Durum': 'aktif'
            }
        ];
        const ws = XLSX.utils.json_to_sheet(sablon_verisi);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Katalog_Sablonu");
        XLSX.writeFile(wb, "47_SilBastan_Katalog_Yukleme_Sablonu.xlsx");
        goster('⬇️ Excel Şablonu İndirildi.', 'success');
    };

    const excelBasariylaYukle = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setTopluYukleniyor(true);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    setTopluYukleniyor(false);
                    return goster('⚠️ Eklenen dosya boş veya beklenen formatta değil.', 'error');
                }

                let eklendi = 0;
                let hataSayisi = 0;
                let payloadlar = [];

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    // Zorunlu alan kontrolü
                    if (!row['Ürün Kodu *'] || !row['Ürün Adı (TR) *'] || !row['Satış Fiyatı (TL) *']) {
                        hataSayisi++;
                        continue;
                    }

                    const u_kodu = row['Ürün Kodu *'].toString().toUpperCase().trim();
                    const s_fiyat = parseFloat(row['Satış Fiyatı (TL) *']) || 0;
                    const maliyet = parseFloat(row['Birim Maliyet (TL)']) || 0;
                    const usd_fiyati = row['Satış Fiyatı (USD)'] ? parseFloat(row['Satış Fiyatı (USD)']) : (s_fiyat / USD_KUR);

                    let kar_orani = 0;
                    if (s_fiyat > 0 && maliyet > 0) kar_orani = ((s_fiyat - maliyet) / maliyet) * 100;

                    payloadlar.push({
                        urun_kodu: u_kodu,
                        urun_adi: row['Ürün Adı (TR) *'].toString().trim(),
                        urun_adi_ar: row['Ürün Adı (AR)'] ? row['Ürün Adı (AR)'].toString().trim() : null,
                        birim_maliyet_tl: maliyet,
                        satis_fiyati_tl: s_fiyat,
                        satis_fiyati_usd: usd_fiyati,
                        stok_adeti: parseInt(row['Stok *']) || 0,
                        min_stok: parseInt(row['Kritik Stok']) || 10,
                        bedenler: row['Bedenler'] ? row['Bedenler'].toString().trim() : null,
                        renkler: row['Renkler'] ? row['Renkler'].toString().trim() : null,
                        kategori_ust: row['Ana Kategori'] ? row['Ana Kategori'].toString().trim() : null,
                        kategori_alt: row['Alt Kategori'] ? row['Alt Kategori'].toString().trim() : null,
                        fotograf_url: row['Foto URL 1'] ? row['Foto URL 1'].toString().trim() : null,
                        fotograf_url2: row['Foto URL 2'] ? row['Foto URL 2'].toString().trim() : null,
                        fotograf_url3: row['Foto URL 3'] ? row['Foto URL 3'].toString().trim() : null,
                        durum: row['Durum'] ? row['Durum'].toString().trim().toLowerCase() : 'aktif',
                        kar_marji_yuzde: kar_orani
                    });
                }

                if (payloadlar.length > 0) {
                    const { error } = await supabase.from('b2_urun_katalogu').insert(payloadlar);
                    if (error) {
                        setTopluYukleniyor(false);
                        return goster('Bulk Insert Hatası. Kod çakışması olabilir: ' + error.message, 'error');
                    }
                    eklendi = payloadlar.length;
                }

                setTopluYukleniyor(false);
                setTopluYuklemeAcik(false);
                yukle();
                goster(`✅ Toplu İşlem Tamamlandı! EKLENEN: ${eklendi} | HATALI SATIR: ${hataSayisi}`, eklendi > 0 ? 'success' : 'error');

                if (eklendi > 0) {
                    telegramBildirim(`📦 KATALOG TOPLU YÜKLEME\n${kullanici?.label || 'M9 Yetkilisi'} tarafından Excel aracıyla kataloga ${eklendi} yeni ürün eklendi.`);
                }

            } catch (err) {
                setTopluYukleniyor(false);
                goster('Dosya okuma hatası. Geçerli bir şablon doldurunuz.', 'error');
            }
        };
        reader.readAsBinaryString(file);
    };

    const sil = async (id, m_kodu) => {
        if (islemdeId === 'sil_' + id) return;
        setIslemdeId('sil_' + id);
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            kullanici,
            'Bu ürünü silmek için Yönetici PIN girin:'
        );
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error'); }

        if (!confirm('Ürünü katalogdan SİLERSENİZ, bağlantılı siparişlerde hata olabilir. Emin misiniz?')) { setIslemdeId(null); return; }

        try {
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b2_urun_katalogu', islem_tipi: 'SILME', kullanici_adi: kullanici?.label || 'M9 Yetkilisi',
                    eski_veri: { durum: 'M9 Urun kalici silindi.', urun_kodu: m_kodu }
                }]).catch(() => { });
            } catch (e) { }

            await supabase.from('b2_urun_katalogu').delete().eq('id', id);
            yukle(); goster('Silindi');
            telegramBildirim(`🗑️ ÜRÜN SİLİNDİ\n${m_kodu} stoklardan ve katalogdan kaldırıldı.`);
        } catch (error) {
            if (error.code === '23503') goster('HATA: Bu ürün Siparişlerde (M10) kullanıldığı için silinemez. Durumunu Pasif yapın.', 'error');
            else goster('Silme hatası: ' + error.message, 'error');
        }
        finally { setIslemdeId(null); }
    };

    const isAR = mounted && lang === 'ar';
    const inp = { width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

    const filtreliUrunler = urunler.filter(u =>
        u.urun_kodu?.toLowerCase().includes(arama.toLowerCase()) ||
        u.urun_adi?.toLowerCase().includes(arama.toLowerCase()) ||
        u.urun_adi_ar?.toLowerCase().includes(arama.toLowerCase())
    );
    const istatistik = {
        toplam: urunler.length,
        aktif: urunler.filter(u => u.durum === 'aktif').length,
        kritik: urunler.filter(u => u.stok_adeti <= u.min_stok).length,
        ortFiyat: urunler.length ? (urunler.reduce((s, u) => s + parseFloat(u.satis_fiyati_tl || 0), 0) / urunler.length).toFixed(0) : 0,
    };

    if (!mounted) return null;

    if (erisim === 'yok') {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <ShieldCheck size={56} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase' }}>
                    {isAR ? 'تم حظر الوصول غير المصرح به' : 'YETKİSİZ GİRİŞ ENGELLENDİ (M9)'}
                </h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 12 }}>Katalog verileri yöneticilere özeldir.</p>
            </div>
        );
    }

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>

            {/* BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingBag size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            {isAR ? 'كتالوج المنتجات والمتجر' : 'Mağaza & Ürün Kataloğu'}
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                            {isAR ? 'المنتجات الجاهزة للبيع (M9)' : 'Toptan / Perakende Satışa Hazır Ürünler (M9)'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setFinansGizli(!finansGizli)} style={{ background: finansGizli ? '#0f172a' : '#f87171', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                        {finansGizli ? '👁️ Fiyatları Göster' : '🙈 Fiyatları Gizle'}
                    </button>
                    {erisim === 'full' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setTopluYuklemeAcik(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', color: '#047857', border: '2px solid #047857', padding: '8px 16px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                                ⬇️ Excel ile Toplu Yükle
                            </button>
                            <button onClick={() => { setFormAcik(!formAcik); setDuzenleId(null); setForm(BOSH_URUN); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                                <Plus size={18} /> Yeni Ürün
                            </button>
                        </div>
                    )}
                    <Link href="/siparisler" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#d97706', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(217,119,6,0.35)' }}>
                            📋 Siparişler (M10)
                        </button>
                    </Link>
                </div>
            </div>

            {/* B-04: EXCEL TOPLU YÜKLEME MODALI */}
            <SilBastanModal acik={topluYuklemeAcik} onClose={() => setTopluYuklemeAcik(false)} title="📥 Excel ile Toplu Katalog Yükleme (M9)">
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: 14 }}>
                    <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: 10, border: '1px solid #10b981', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 8px', color: '#065f46', fontSize: '0.9rem', fontWeight: 800 }}>📌 Toplu Yükleme Talimatı</h4>
                        <ol style={{ margin: 0, paddingLeft: 20, color: '#047857', fontSize: '0.8rem', lineHeight: 1.6, fontWeight: 600 }}>
                            <li>Öncelikle boş <b>Örnek Şablonu</b> cihazınıza indirin.</li>
                            <li>Tüm ürünleri örnek formata ve sütun isimlerine dokunmadan doldurun.</li>
                            <li>'Satış Fiyatı (USD)' boş bırakılırsa TL kuru ve TCMB güncel piyasa değeriyle otomatik hesaplanıp kaydedilir.</li>
                            <li>Doldurduğunuz dosyayı aşağıdaki alandan sisteme yükleyin.</li>
                        </ol>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexDirection: 'column' }}>
                        <button onClick={sablonIndir} style={{ width: '100%', padding: '12px', background: 'white', border: '2px dashed #047857', color: '#047857', borderRadius: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 8 }}>
                            📄 Örnek Şablonu (Excel) İndir
                        </button>

                        <div style={{ width: '100%', position: 'relative' }}>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                id="excel-upload"
                                style={{ display: 'none' }}
                                onChange={excelBasariylaYukle}
                                disabled={topluYukleniyor}
                            />
                            <label htmlFor="excel-upload" style={{ width: '100%', padding: '14px', background: topluYukleniyor ? '#94a3b8' : '#047857', color: 'white', borderRadius: 12, fontWeight: 900, cursor: topluYukleniyor ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' }}>
                                {topluYukleniyor ? '⏳ Veriler İşleniyor, Lütfen Bekleyin...' : '🚀 Doldurulan Excel Dosyasını Yükle'}
                            </label>
                        </div>
                    </div>
                </div>
            </SilBastanModal>

            {/* İSTATİSTİK KARTLARI + ARAMA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam Ürün', val: istatistik.toplam, color: '#047857', bg: '#ecfdf5' },
                    { label: '✅ Aktif', val: istatistik.aktif, color: '#10b981', bg: '#f0fdf4' },
                    { label: '⚠️ Kritik Stok', val: istatistik.kritik, color: istatistik.kritik > 0 ? '#ef4444' : '#94a3b8', bg: istatistik.kritik > 0 ? '#fef2f2' : '#f8fafc' },
                    { label: 'Ort. Fiyat', val: `₺${istatistik.ortFiyat}`, color: '#D4AF37', bg: '#fffbeb' },
                ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 12, padding: '0.875rem 1rem' }}>
                        <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>
            <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 440 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                <input value={arama} onChange={e => setArama(e.target.value)}
                    placeholder={isAR ? 'ابحث عن منتج...' : 'Ürün kodu veya ada göre ara...'}
                    style={{ ...inp, paddingLeft: 40 }} />
            </div>

            {/* BİLDİRİM BÖLGESİ */}
            {mesaj.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', marginBottom: '1.5rem', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                    {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />} {mesaj.text}
                </div>
            )}

            {/* HIZLI FORM (M9) */}
            {formAcik && erisim === 'full' && (
                <div style={{ background: 'white', border: '2px solid #047857', borderRadius: 18, padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 40px rgba(4,120,87,0.08)' }}>
                    <h3 style={{ fontWeight: 900, color: '#065f46', marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag size={18} /> {duzenleId ? 'Ürün Düzenle' : 'Yeni Ürün Kartı'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={lbl}>Ürün Kodu / SKU *</label>
                            <input type="text" value={form.urun_kodu} onChange={e => setForm({ ...form, urun_kodu: e.target.value })} placeholder="TSH-001" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Ürün Adı (TR) *</label>
                            <input type="text" value={form.urun_adi} onChange={e => setForm({ ...form, urun_adi: e.target.value })} placeholder="Basic Erkek Tshirt" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Ürün Adı (Arapça)</label>
                            <input type="text" dir="rtl" value={form.urun_adi_ar} onChange={e => setForm({ ...form, urun_adi_ar: e.target.value })} placeholder="اسم المنتج..." style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Birim Maliyeti (TL)</label>
                            <input type="number" dir="ltr" value={form.birim_maliyet_tl} onChange={e => setForm({ ...form, birim_maliyet_tl: e.target.value })} placeholder="120" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Satış Fiyatı (TL) *</label>
                            <input type="number" dir="ltr" value={form.satis_fiyati_tl}
                                onChange={e => setForm({ ...form, satis_fiyati_tl: e.target.value })}
                                placeholder="299.90" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Satış Fiyatı (USD $) <span style={{ fontWeight: 600, color: '#94a3b8', textTransform: 'none', fontSize: '0.65rem' }}>boş bırakılırsa TL/kur otomatik</span></label>
                            <input type="number" dir="ltr" value={form.satis_fiyati_usd}
                                onChange={e => setForm({ ...form, satis_fiyati_usd: e.target.value })}
                                placeholder={form.satis_fiyati_tl ? `≈ $${(parseFloat(form.satis_fiyati_tl) / USD_KUR).toFixed(2)}` : '0.00'}
                                style={{ ...inp, borderColor: '#d97706' }} />
                        </div>
                        <div>
                            <label style={lbl}>Mevcut Stok Adeti</label>
                            <input type="number" dir="ltr" value={form.stok_adeti} onChange={e => setForm({ ...form, stok_adeti: e.target.value })} placeholder="500" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Kritik Stok Sınırı</label>
                            <input type="number" dir="ltr" value={form.min_stok} onChange={e => setForm({ ...form, min_stok: e.target.value })} placeholder="50" style={inp} />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            {/* KAT-03: Ana Kategori */}
                            <div>
                                <label style={lbl}>Ana Kategori (KAT-03)</label>
                                <select value={form.kategori_ust} onChange={e => setForm({ ...form, kategori_ust: e.target.value, kategori_alt: '' })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                    <option value="">— Ana Kategori —</option>
                                    {ANA_KATEGORILER.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                            {/* KAT-03: Alt Kategori */}
                            <div>
                                <label style={lbl}>Alt Kategori (KAT-03)</label>
                                <select value={form.kategori_alt} onChange={e => setForm({ ...form, kategori_alt: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }} disabled={!form.kategori_ust}>
                                    <option value="">— Alt Kategori —</option>
                                    {(ALT_KATEGORILER[form.kategori_ust] || []).map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={lbl}>Katalog Durumu</label>
                                <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                    {DURUMLAR.map(d => <option key={d} value={d}>{d.toUpperCase().replace('_', ' ')}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={lbl}>Beden Dağılımı (virgülle)</label>
                                <input type="text" value={form.bedenler} onChange={e => setForm({ ...form, bedenler: e.target.value })} placeholder="S, M, L, XL" style={inp} />
                            </div>
                            <div>
                                <label style={lbl}>Renkler (virgülle)</label>
                                <input type="text" value={form.renkler} onChange={e => setForm({ ...form, renkler: e.target.value })} placeholder="Siyah, Beyaz, Lacivert" style={inp} />
                            </div>
                        </div>
                        {/* KAT-02: Fotoğraf Galerisi */}
                        <div style={{ gridColumn: '1 / -1', background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px dashed #cbd5e1' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', marginBottom: 8, textTransform: 'uppercase' }}>📸 Ürün Fotoğrafları (KAT-02)</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                <div><label style={{ ...lbl, color: '#64748b' }}>Foto 1 (URL)</label><input value={form.fotograf_url} onChange={e => setForm({ ...form, fotograf_url: e.target.value })} placeholder="https://...jpg" style={inp} /></div>
                                <div><label style={{ ...lbl, color: '#64748b' }}>Foto 2 (URL)</label><input value={form.fotograf_url2 || ''} onChange={e => setForm({ ...form, fotograf_url2: e.target.value })} placeholder="https://...jpg" style={inp} /></div>
                                <div><label style={{ ...lbl, color: '#64748b' }}>Foto 3 (URL)</label><input value={form.fotograf_url3 || ''} onChange={e => setForm({ ...form, fotograf_url3: e.target.value })} placeholder="https://...jpg" style={inp} /></div>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH_URUN); setFormAcik(false); setDuzenleId(null); }} style={{ padding: '10px 20px', border: '2px solid #e2e8f0', borderRadius: 10, background: 'white', fontWeight: 800, cursor: 'pointer', color: '#475569' }}>İptal</button>
                        <button onClick={kaydet} disabled={loading}
                            style={{ padding: '10px 28px', background: loading ? '#cbd5e1' : '#047857', color: 'white', border: 'none', borderRadius: 10, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.3)' }}>
                            {loading ? 'Yükleniyor...' : (duzenleId ? 'Değişiklikleri Kaydet' : 'Ürünü Ekle')}
                        </button>
                    </div>
                </div>
            )}

            {/* ÜRÜN LİSTESİ */}
            {loading && !urunler.length && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem', fontWeight: 800 }}>Yükleniyor...</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
                {filtreliUrunler.map(u => {
                    const kritik = u.stok_adeti <= u.min_stok;
                    return (
                        <div key={u.id} style={{ background: 'white', border: '2px solid', borderColor: kritik ? '#fecaca' : '#f1f5f9', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s' }}>
                            <div style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, background: kritik ? '#fef2f2' : '#ecfdf5', color: kritik ? '#dc2626' : '#047857', padding: '3px 10px', borderRadius: 6 }}>{u.urun_kodu}</span>
                                        <h3 style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', margin: '6px 0 0' }}>{u.urun_adi}</h3>
                                        {u.urun_adi_ar && <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginTop: 2 }} dir="rtl">{u.urun_adi_ar}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                        {/* KAT-04: SKU Matrisi */}
                                        <button onClick={() => skuMatrisiAc(u)} title="SKU Matrisi" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#047857', padding: '5px 7px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Grid3X3 size={14} /></button>
                                        {/* KAT-05: Fiyat Geçmişi */}
                                        <button onClick={() => fiyatGecmisiniAc(u)} title="Fiyat Geçmişi" style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#d97706', padding: '5px 7px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><History size={14} /></button>
                                        {/* QR */}
                                        <button onClick={() => { setSeciliUrun(u); setBarkodAcik(true); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '5px 7px', borderRadius: 7, cursor: 'pointer', display: 'flex' }}><QrCode size={14} /></button>
                                        {erisim === 'full' && (
                                            <>
                                                <button onClick={() => { setForm({ urun_kodu: u.urun_kodu, urun_adi: u.urun_adi, urun_adi_ar: u.urun_adi_ar || '', satis_fiyati_tl: u.satis_fiyati_tl, birim_maliyet_tl: u.birim_maliyet_tl || '', bedenler: u.bedenler || '', renkler: u.renkler || '', stok_adeti: u.stok_adeti, min_stok: u.min_stok, durum: u.durum, kategori_ust: u.kategori_ust || '', kategori_alt: u.kategori_alt || '', fotograf_url: u.fotograf_url || '', fotograf_url2: u.fotograf_url2 || '', fotograf_url3: u.fotograf_url3 || '' }); setDuzenleId(u.id); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: '#eff6ff', border: 'none', color: '#2563eb', padding: '5px 7px', borderRadius: 7, cursor: 'pointer' }}>✏️</button>
                                                <button disabled={islemdeId === 'sil_' + u.id} onClick={() => sil(u.id, u.urun_kodu)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '5px 7px', borderRadius: 7, cursor: islemdeId === 'sil_' + u.id ? 'wait' : 'pointer', opacity: islemdeId === 'sil_' + u.id ? 0.5 : 1 }}><Trash2 size={14} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>SATIŞ FİYATI</div>
                                        {finansGizli ? (
                                            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>₺ ***</div>
                                        ) : (
                                            <div>
                                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>₺{u.satis_fiyati_tl}</div>
                                                <div style={{ fontWeight: 700, color: '#d97706', fontSize: '0.78rem', marginTop: 1 }}>
                                                    ${u.satis_fiyati_usd ? parseFloat(u.satis_fiyati_usd).toFixed(2) : (parseFloat(u.satis_fiyati_tl) / USD_KUR).toFixed(2)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ background: kritik ? '#fef2f2' : '#ecfdf5', borderRadius: 8, padding: '8px 12px' }}>
                                        <div style={{ fontSize: '0.6rem', color: kritik ? '#dc2626' : '#059669', fontWeight: 800, letterSpacing: '0.05em' }}>GÜNCEL STOK</div>
                                        <div style={{ fontWeight: 900, color: kritik ? '#b91c1c' : '#065f46', fontSize: '1rem' }}>{u.stok_adeti} ADET</div>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                    {/* KAT-03: Kategori etiketi */}
                                    {u.kategori_ust && <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 7px', borderRadius: 4, fontWeight: 800 }}>{u.kategori_ust}{u.kategori_alt ? ` / ${u.kategori_alt}` : ''}</span>}
                                    {u.bedenler && <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>📏 {u.bedenler}</span>}
                                    {u.renkler && <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>🎨 {u.renkler}</span>}
                                </div>
                                {/* KAT-02: Fotoğraf Galerisi */}
                                {(u.fotograf_url || u.fotograf_url2 || u.fotograf_url3) && (
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                        {[u.fotograf_url, u.fotograf_url2, u.fotograf_url3].filter(Boolean).map((f, i) => (
                                            <img key={i} src={f} alt={`foto${i + 1}`} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} onError={e => { e.target.style.display = 'none'; }} />
                                        ))}
                                    </div>
                                )}
                                {/* KAT-01: Siparişe Otofill Butonu */}
                                <button onClick={() => otofillSiparise(u)} style={{ width: '100%', padding: '7px', background: 'linear-gradient(135deg,#047857,#065f46)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    <Package size={14} /> Siparişe Ekle (KAT-01)
                                </button>
                                {/* [WA-TEKLIF]: WhatsApp Teklif Fırlatıcı */}
                                <button onClick={() => whatsappTeklif(u)}
                                    style={{ width: '100%', marginTop: 6, padding: '7px', background: 'linear-gradient(135deg,#25d366,#128c7e)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                    <span style={{ fontSize: '1rem' }}>📲</span> WhatsApp Teklif Gönder
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BARKOD MODALI */}
            <SilBastanModal acik={barkodAcik} onClose={() => setBarkodAcik(false)} title="Ürün Etiketi / Barkodu">
                {seciliUrun && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'white', padding: '2rem', borderRadius: '12px' }}>
                        <FizikselQRBarkod
                            veriKodu={seciliUrun.urun_kodu}
                            baslik={seciliUrun.urun_adi}
                            aciklama={`${finansGizli ? '' : `Satış: ₺${seciliUrun.satis_fiyati_tl}`} | Stok: ${seciliUrun.stok_adeti}`}
                        />
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
                            Bu etiket ürün paketlerine yapıştırılarak M10 modülünde hızlı sipariş oluşturmak için kullanılabilir.
                        </p>
                    </div>
                )}
            </SilBastanModal>

            {/* KAT-04: SKU MATRİSİ MODALI */}
            <SilBastanModal acik={skuAcik} onClose={() => setSkuAcik(false)} title={`SKU Matrisi — ${seciliUrun?.urun_kodu}`}>
                {seciliUrun && (
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: 14 }}>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 12, fontWeight: 600 }}>Beden × Renk kombinasyonları (KAT-04)</p>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.78rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '6px 10px', background: '#0f172a', color: 'white', borderRadius: '4px 0 0 0' }}>Beden / Renk</th>
                                        {skuRenkler.map(r => <th key={r} style={{ padding: '6px 10px', background: '#047857', color: 'white', fontWeight: 800 }}>{r}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {skuBedenler.map((b, bi) => (
                                        <tr key={b} style={{ background: bi % 2 === 0 ? '#f8fafc' : 'white' }}>
                                            <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0f172a', borderRight: '2px solid #e2e8f0' }}>{b}</td>
                                            {skuRenkler.map(r => (
                                                <td key={r} style={{ padding: '6px 10px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>
                                                    {seciliUrun.urun_kodu}-{b}-{r.substring(0, 2).toUpperCase()}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 10 }}>Toplam {skuBedenler.length * skuRenkler.length} SKU kombinasyonu</p>
                    </div>
                )}
            </SilBastanModal>

            {/* KAT-05: FİYAT GEÇMİŞİ MODALI */}
            <SilBastanModal acik={fiyatGecmisiAcik} onClose={() => setFiyatGecmisiAcik(false)} title={`Fiyat Geçmişi — ${seciliUrun?.urun_adi}`}>
                {seciliUrun && (
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: 14 }}>
                        {fiyatGecmisi.length === 0 ? (
                            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem', fontWeight: 700 }}>Yükleniyor...</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ background: '#0f172a', color: 'white' }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Tarih</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Satış Fiyatı</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Maliyet</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Kâr Marjı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fiyatGecmisi.map((f, i) => {
                                        const kar = f.birim_maliyet_tl > 0 ? (((f.satis_fiyati_tl - f.birim_maliyet_tl) / f.birim_maliyet_tl) * 100).toFixed(1) : null;
                                        return (
                                            <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white', borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '8px 12px', color: '#64748b' }}>{f.updated_at ? new Date(f.updated_at).toLocaleDateString('tr-TR') : '-'}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>₺{parseFloat(f.satis_fiyati_tl).toFixed(2)}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>{f.birim_maliyet_tl ? `₺${parseFloat(f.birim_maliyet_tl).toFixed(2)}` : '-'}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: kar >= 20 ? '#059669' : '#dc2626' }}>{kar ? `%${kar}` : '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </SilBastanModal>

            {/* KAT-06: STOK SENKRON GÖSTERGESİ */}
            {sonSenkron && (
                <div style={{ position: 'fixed', bottom: 16, right: 16, background: '#0f172a', color: '#34d399', padding: '8px 14px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, zIndex: 999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                    Stok Canlı | {sonSenkron.toLocaleTimeString('tr-TR')}
                </div>
            )}
        </div>
    );
}
