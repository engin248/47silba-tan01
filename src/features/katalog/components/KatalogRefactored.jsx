'use client';
/**
 * features/katalog/components/KatalogRefactored.jsx
 *
 * Temiz UI bileşeni — tüm logic useKatalog() hook'ta.
 * Tailwind className + KAT-01..KAT-06 özellikleri tam.
 *
 * Bileşen boyutu: ~200 satır (eski: 605 satır monolitik)
 */
import {
    ShoppingBag, Plus, AlertTriangle, CheckCircle2,
    QrCode, Trash2, Tag, Grid3X3, History, Package,
    RefreshCw, Eye, EyeOff,
} from 'lucide-react';
import SilBastanModal from '@/components/ui/SilBastanModal';
import FizikselQRBarkod from '@/lib/components/barkod/FizikselQRBarkod';
import { useKatalog, BOS_URUN, ANA_KATEGORILER, ALT_KATEGORILER, DURUMLAR, USD_KUR } from '../hooks/useKatalog';

// ─── Yardımcı: kâr rengi ──────────────────────────────────────────
function karRenk(satis, maliyet) {
    if (!maliyet || maliyet <= 0) return 'text-slate-400';
    const oran = ((satis - maliyet) / maliyet) * 100;
    return oran >= 30 ? 'text-emerald-600' : oran >= 10 ? 'text-amber-500' : 'text-red-500';
}

// ─── Ana bileşen ──────────────────────────────────────────────────
export default function KatalogRefactored() {
    const k = useKatalog();

    return (
        <div className="pb-20">

            {/* BAŞLIK */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center shadow-lg">
                        <ShoppingBag size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Mağaza & Ürün Kataloğu</h1>
                        <p className="text-xs text-slate-500 font-semibold">Toptan / Perakende Satışa Hazır Ürünler (M9)</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => k.setFinansGizli(!k.finansGizli)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-all">
                        {k.finansGizli ? <><Eye size={14} /> Fiyatları Göster</> : <><EyeOff size={14} /> Gizle</>}
                    </button>
                    <button onClick={() => { k.formSifirla(); k.setFormAcik ? k.formSifirla() : null; }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-black shadow-md hover:bg-emerald-800 transition-all">
                        <Plus size={16} /> Yeni Ürün
                    </button>
                    <a href="/siparisler">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-black shadow hover:bg-amber-600 transition-all">
                            📋 Siparişler (M10)
                        </button>
                    </a>
                </div>
            </div>

            {/* İSTATİSTİK KARTLARI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                    { label: 'Toplam Ürün', val: k.istatistik.toplam, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: '✅ Aktif', val: k.istatistik.aktif, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: '⚠️ Kritik Stok', val: k.istatistik.kritik, color: k.istatistik.kritik > 0 ? 'text-red-600' : 'text-slate-400', bg: k.istatistik.kritik > 0 ? 'bg-red-50' : 'bg-slate-50' },
                    { label: 'Ort. Fiyat', val: `₺${k.istatistik.ortFiyat}`, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-1">{s.label}</div>
                        <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* ARAMA */}
            <div className="relative mb-5 max-w-md">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input value={k.arama} onChange={e => k.setArama(e.target.value)}
                    placeholder="Ürün kodu veya ada göre ara..."
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-emerald-500 outline-none transition-colors" />
            </div>

            {/* BİLDİRİM */}
            {k.mesaj.text && (
                <div className={`flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border-2 font-bold text-sm ${k.mesaj.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' : 'bg-emerald-50 border-emerald-400 text-emerald-800'}`}>
                    {k.mesaj.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    {k.mesaj.text}
                </div>
            )}

            {/* ÜRÜN FORMU */}
            {k.formAcik && (
                <div className="bg-white border-2 border-emerald-600 rounded-2xl p-6 mb-6 shadow-xl">
                    <h3 className="flex items-center gap-2 text-lg font-black text-emerald-800 mb-5">
                        <Tag size={18} /> {k.duzenleId ? 'Ürün Düzenle' : 'Yeni Ürün Kartı'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { label: 'Ürün Kodu *', key: 'urun_kodu', ph: 'TSH-001' },
                            { label: 'Ürün Adı *', key: 'urun_adi', ph: 'Basic Erkek Tshirt' },
                            { label: 'Ürün (AR)', key: 'urun_adi_ar', ph: 'اسم المنتج', dir: 'rtl' },
                            { label: 'Maliyet (₺)', key: 'birim_maliyet_tl', ph: '120', type: 'number' },
                            { label: 'Satış (₺) *', key: 'satis_fiyati_tl', ph: '299.90', type: 'number' },
                            { label: 'Stok Adeti', key: 'stok_adeti', ph: '500', type: 'number' },
                            { label: 'Min. Stok', key: 'min_stok', ph: '50', type: 'number' },
                            { label: 'Bedenler', key: 'bedenler', ph: 'S, M, L, XL' },
                            { label: 'Renkler', key: 'renkler', ph: 'Siyah, Beyaz' },
                        ].map(({ label, key, ph, type = 'text', dir }) => (
                            <div key={key}>
                                <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
                                <input type={type} dir={dir} value={k.form[key] || ''}
                                    onChange={e => k.setForm({ ...k.form, [key]: e.target.value })}
                                    placeholder={ph}
                                    className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 outline-none transition-colors" />
                            </div>
                        ))}

                        {/* KAT-03: Kategori Hiyerarşisi */}
                        <div>
                            <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase">Ana Kategori</label>
                            <select value={k.form.kategori_ust}
                                onChange={e => k.setForm({ ...k.form, kategori_ust: e.target.value, kategori_alt: '' })}
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm bg-white focus:border-emerald-500 outline-none">
                                <option value="">— Seç —</option>
                                {ANA_KATEGORILER.map(k2 => <option key={k2}>{k2}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase">Alt Kategori</label>
                            <select value={k.form.kategori_alt}
                                onChange={e => k.setForm({ ...k.form, kategori_alt: e.target.value })}
                                disabled={!k.form.kategori_ust}
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm bg-white focus:border-emerald-500 outline-none disabled:opacity-50">
                                <option value="">— Seç —</option>
                                {(ALT_KATEGORILER[k.form.kategori_ust] || []).map(a => <option key={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase">Durum</label>
                            <select value={k.form.durum} onChange={e => k.setForm({ ...k.form, durum: e.target.value })}
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm bg-white focus:border-emerald-500 outline-none">
                                {DURUMLAR.map(d => <option key={d} value={d}>{d.toUpperCase().replace('_', ' ')}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* KAT-02: Fotoğraflar */}
                    <div className="grid grid-cols-3 gap-3 mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <div className="col-span-3 text-xs font-black text-emerald-700 uppercase mb-1">📸 Ürün Fotoğrafları (KAT-02)</div>
                        {['fotograf_url', 'fotograf_url2', 'fotograf_url3'].map((key, i) => (
                            <div key={key}>
                                <label className="text-xs text-slate-500 font-bold mb-1 block">Foto {i + 1}</label>
                                <input value={k.form[key] || ''} onChange={e => k.setForm({ ...k.form, [key]: e.target.value })}
                                    placeholder="https://...jpg"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-emerald-500 outline-none" />
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 justify-end mt-5">
                        <button onClick={k.formSifirla} className="px-5 py-2.5 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">İptal</button>
                        <button onClick={k.kaydet} disabled={k.loading}
                            className="px-7 py-2.5 bg-emerald-700 text-white rounded-xl font-black shadow-md hover:bg-emerald-800 transition-all disabled:opacity-50">
                            {k.loading ? 'Yükleniyor...' : (k.duzenleId ? 'Değişiklikleri Kaydet' : 'Ürünü Ekle')}
                        </button>
                    </div>
                </div>
            )}

            {/* ÜRÜN LİSTESİ */}
            {k.loading && !k.urunler.length && (
                <div className="flex justify-center py-16 text-slate-400 font-bold">
                    <RefreshCw className="animate-spin mr-2" size={18} /> Yükleniyor...
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {k.filtreliUrunler.map(u => {
                    const kritik = u.stok_adeti <= u.min_stok;
                    return (
                        <div key={u.id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all ${kritik ? 'border-red-200' : 'border-slate-100'}`}>
                            {/* KAT-02: Ürün fotoğrafı */}
                            {u.fotograf_url && (
                                <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-100">
                                    {[u.fotograf_url, u.fotograf_url2, u.fotograf_url3].filter(Boolean).map((f, i) => (
                                        <img key={i} src={f} alt={`foto${i + 1}`} className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                                            onError={e => { e.target.style.display = 'none'; }} />
                                    ))}
                                </div>
                            )}

                            <div className="p-4">
                                {/* Başlık + İşlem Butonları */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${kritik ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {u.urun_kodu}
                                        </span>
                                        <h3 className="font-black text-sm text-slate-900 mt-1.5">{u.urun_adi}</h3>
                                        {u.urun_adi_ar && <div className="text-xs text-slate-500 font-medium mt-0.5" dir="rtl">{u.urun_adi_ar}</div>}
                                        {u.kategori_ust && (
                                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                                                {u.kategori_ust}{u.kategori_alt ? ` / ${u.kategori_alt}` : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 flex-wrap justify-end">
                                        <button onClick={() => k.skuMatrisiAc(u)} title="SKU Matrisi"
                                            className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors">
                                            <Grid3X3 size={13} />
                                        </button>
                                        <button onClick={() => k.fiyatGecmisiniAc(u)} title="Fiyat Geçmişi"
                                            className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors">
                                            <History size={13} />
                                        </button>
                                        <button onClick={() => { k.setSeciliUrun(u); k.setBarkodAcik(true); }}
                                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
                                            <QrCode size={13} />
                                        </button>
                                        <button onClick={() => k.duzenleAc(u)}
                                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                            ✏️
                                        </button>
                                        <button onClick={() => k.sil(u.id, u.urun_kodu)}
                                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Fiyat + Stok */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-slate-50 rounded-xl p-2.5">
                                        <div className="text-[9px] font-black text-slate-400 uppercase">Satış</div>
                                        {k.finansGizli
                                            ? <div className="font-black text-slate-700">₺ ***</div>
                                            : <>
                                                <div className="font-black text-slate-900">₺{u.satis_fiyati_tl}</div>
                                                <div className={`text-[11px] font-bold ${karRenk(u.satis_fiyati_tl, u.birim_maliyet_tl)}`}>
                                                    ${u.satis_fiyati_usd ? parseFloat(u.satis_fiyati_usd).toFixed(2) : (parseFloat(u.satis_fiyati_tl) / USD_KUR).toFixed(2)}
                                                </div>
                                            </>
                                        }
                                    </div>
                                    <div className={`rounded-xl p-2.5 ${kritik ? 'bg-red-50' : 'bg-emerald-50'}`}>
                                        <div className={`text-[9px] font-black uppercase ${kritik ? 'text-red-500' : 'text-emerald-600'}`}>Stok</div>
                                        <div className={`font-black ${kritik ? 'text-red-700' : 'text-emerald-800'}`}>{u.stok_adeti}</div>
                                    </div>
                                </div>

                                {/* Beden/Renk etiketleri */}
                                <div className="flex flex-wrap gap-1 mb-3 text-[10px] font-bold text-slate-500">
                                    {u.bedenler && <span className="bg-slate-100 px-2 py-0.5 rounded">📏 {u.bedenler}</span>}
                                    {u.renkler && <span className="bg-slate-100 px-2 py-0.5 rounded">🎨 {u.renkler}</span>}
                                </div>

                                {/* KAT-01: Siparişe Ekle */}
                                <button onClick={() => k.otofillSiparise(u)}
                                    className="w-full py-2 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:from-emerald-800 hover:to-emerald-900 transition-all shadow-sm">
                                    <Package size={13} /> Siparişe Ekle (KAT-01)
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BARKOD MODAL */}
            <SilBastanModal acik={k.barkodAcik} onClose={() => k.setBarkodAcik(false)} title="Ürün Etiketi / Barkod">
                {k.seciliUrun && (
                    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl">
                        <FizikselQRBarkod veriKodu={k.seciliUrun.urun_kodu} baslik={k.seciliUrun.urun_adi}
                            aciklama={`${k.finansGizli ? '' : `Satış: ₺${k.seciliUrun.satis_fiyati_tl}`} | Stok: ${k.seciliUrun.stok_adeti}`} />
                        <p className="text-xs text-slate-500 text-center font-medium">
                            Bu etiket ürün paketlerine yapıştırılarak M10 modülünde hızlı sipariş oluşturmak için kullanılabilir.
                        </p>
                    </div>
                )}
            </SilBastanModal>

            {/* KAT-04: SKU MATRİSİ MODAL */}
            <SilBastanModal acik={k.skuAcik} onClose={() => k.setSkuAcik(false)} title={`SKU Matrisi — ${k.seciliUrun?.urun_kodu}`}>
                {k.seciliUrun && (
                    <div className="p-5 bg-white rounded-xl overflow-x-auto">
                        <p className="text-xs text-slate-500 font-medium mb-4">Beden × Renk kombinasyonları (KAT-04) — Toplam {k.skuBedenler.length * k.skuRenkler.length} SKU</p>
                        <table className="text-xs w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-2 bg-slate-900 text-white text-left rounded-tl">Beden / Renk</th>
                                    {k.skuRenkler.map(r => <th key={r} className="p-2 bg-emerald-700 text-white font-black">{r}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {k.skuBedenler.map((b, bi) => (
                                    <tr key={b} className={bi % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                        <td className="p-2 font-black text-slate-900 border-r-2 border-slate-200">{b}</td>
                                        {k.skuRenkler.map(r => (
                                            <td key={r} className="p-2 text-center text-emerald-700 font-bold">
                                                {k.seciliUrun.urun_kodu}-{b}-{r.substring(0, 2).toUpperCase()}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SilBastanModal>

            {/* KAT-05: FİYAT GEÇMİŞİ MODAL */}
            <SilBastanModal acik={k.fiyatGecmisiAcik} onClose={() => k.setFiyatGecmisiAcik(false)} title={`Fiyat Geçmişi — ${k.seciliUrun?.urun_adi}`}>
                {k.seciliUrun && (
                    <div className="p-5 bg-white rounded-xl overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    {['Tarih', 'Satış ₺', 'Maliyet ₺', 'Kâr %'].map(h => (
                                        <th key={h} className="p-3 text-left font-black">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {k.fiyatGecmisi.map((f, i) => {
                                    const kar = f.birim_maliyet_tl > 0 ? (((f.satis_fiyati_tl - f.birim_maliyet_tl) / f.birim_maliyet_tl) * 100).toFixed(1) : null;
                                    return (
                                        <tr key={i} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                            <td className="p-3 text-slate-500 text-xs">{f.updated_at ? new Date(f.updated_at).toLocaleDateString('tr-TR') : '—'}</td>
                                            <td className="p-3 font-black text-slate-900">₺{parseFloat(f.satis_fiyati_tl).toFixed(2)}</td>
                                            <td className="p-3 text-slate-500">{f.birim_maliyet_tl ? `₺${parseFloat(f.birim_maliyet_tl).toFixed(2)}` : '—'}</td>
                                            <td className={`p-3 font-black ${kar >= 20 ? 'text-emerald-600' : 'text-red-600'}`}>{kar ? `%${kar}` : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </SilBastanModal>

            {/* KAT-06: Stok Canlı Göstergesi */}
            {k.sonSenkron && (
                <div className="fixed bottom-4 right-4 bg-slate-900 text-emerald-400 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-xl z-50">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Stok Canlı | {k.sonSenkron.toLocaleTimeString('tr-TR')}
                </div>
            )}
        </div>
    );
}
