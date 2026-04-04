'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Trash2, ArrowLeft, ExternalLink, Activity, Info, AlertTriangle, Eye } from 'lucide-react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth';

export default function ScraperKarantinaContainer() {
    const { kullanici, yukleniyor } = useAuth();
    const [karantinaListesi, setKarantinaListesi] = useState([]);
    const [loading, setLoading] = useState(true);
    const [islemdeId, setIslemdeId] = useState(null);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    // Sadece yetkili (Tam veya Üretim Pin'i) görebilir
    const isYetkili = kullanici?.grup === 'tam' || (typeof window !== 'undefined' && !!sessionStorage.getItem('sb47_uretim_token'));

    useEffect(() => {
        if (!isYetkili && !yukleniyor) {
            setLoading(false);
            return;
        }
        verileriCek();
    }, [isYetkili, yukleniyor]);

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 6000);
    };

    const verileriCek = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('b1_arge_products_karantina')
                .select('*')
                .eq('karantina_durumu', 'bekliyor')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setKarantinaListesi(data || []);
        } catch (error) {
            goster('Hata: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const onaylaVeAsilTabloyaAktar = async (urun) => {
        if (islemdeId) return;
        setIslemdeId(urun.id);

        try {
            // [KORUMA]: Ana tabloda (b1_arge_products) eski kayıt var mı kontrolü?
            const { data: mevcutKayit } = await supabase
                .from('b1_arge_products')
                .select('id')
                .eq('ham_veri->>urunLink', urun.urun_linki)
                .limit(1);

            if (mevcutKayit && mevcutKayit.length > 0) {
                // Eğer daha önce kaydedilmişse karantinadaki de çöpe çevirebiliriz ya da baştan uyarabiliriz.
                const onay = confirm('⚠️ DİKKAT: Bu ürünün linki Mizanet ana veritabanında (b1_arge_products) ZATEN VAR! Yine de aktaralım mı? (İptal derseniz karantinadan silinecek)');
                if (!onay) {
                    // Karantinadan sil
                    await supabase.from('b1_arge_products_karantina').update({ karantina_durumu: 'reddedildi_mukerrer' }).eq('id', urun.id);
                    setKarantinaListesi(prev => prev.filter(p => p.id !== urun.id));
                    goster('Mükerrer kayıt engellendi ve karantinadan temizlendi.', 'success');
                    setIslemdeId(null);
                    return;
                }
            }

            // 1. Asıl Tabloya Yaz
            const { error: insertError } = await supabase.from('b1_arge_products').insert([{
                veri_kaynagi: urun.veri_kaynagi || 'Karantina Onayı',
                islenen_durum: 'bekliyor',
                isleyen_ajan: 'bot_oluisci_onayli',
                ham_veri: {
                    ...urun, // Tüm 15 maddeyi ham_veri JSON'una gömüyoruz
                    isim: urun.urun_ismi, // Ajanların okuduğu eski format uyumluluğu
                    fiyatSayi: urun.indirimli_fiyat > 0 ? urun.indirimli_fiyat : urun.orjinal_fiyat,
                    resimUrl: urun.urun_fotografi,
                    urunLink: urun.urun_linki,
                    onaylayan: kullanici?.ad || 'Atölye Lideri'
                }
            }]);

            if (insertError) throw new Error('Ana tabloya aktarım reddedildi: ' + insertError.message);

            // 2. Karantinadaki durumunu güncelle
            const { error: updateError } = await supabase
                .from('b1_arge_products_karantina')
                .update({ karantina_durumu: 'onaylandi' })
                .eq('id', urun.id);

            if (updateError) throw updateError;

            goster('✅ Ürün onaylandı ve ana veritabanına aktarıldı.');
            setKarantinaListesi(prev => prev.filter(p => p.id !== urun.id));

        } catch (error) {
            goster('Aktarım hatası: ' + error.message, 'error');
        } finally {
            setIslemdeId(null);
        }
    };

    const reddetVeCopeAt = async (id) => {
        if (!confirm('Bu kusurlu/istenmeyen veriyi çöpe atmak istiyor musunuz?')) return;
        if (islemdeId) return;
        setIslemdeId(id);

        try {
            const { error } = await supabase
                .from('b1_arge_products_karantina')
                .update({ karantina_durumu: 'reddedildi' })
                .eq('id', id);

            if (error) throw error;
            goster('🗑️ Kayıt reddedildi (Çöpe atıldı).', 'success');
            setKarantinaListesi(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            goster('Silme hatası: ' + error.message, 'error');
        } finally {
            setIslemdeId(null);
        }
    };

    const tumunuOnayla = async () => {
        if (karantinaListesi.length === 0) return;
        if (!confirm(`Ekrandaki ${karantinaListesi.length} verinin tamamını (eski kayıtları atlayarak) ONAYLAMAK istediğinize emin misiniz?`)) return;

        setIslemdeId('toplu_onay');
        let basarili = 0;
        let atlanan = 0;

        for (const urun of karantinaListesi) {
            try {
                // Toplu işlemde de mükerrer kontrolü
                const { data: mevcutKayit } = await supabase
                    .from('b1_arge_products')
                    .select('id')
                    .eq('ham_veri->>urunLink', urun.urun_linki)
                    .limit(1);

                if (mevcutKayit && mevcutKayit.length > 0) {
                    await supabase.from('b1_arge_products_karantina').update({ karantina_durumu: 'reddedildi_mukerrer' }).eq('id', urun.id);
                    atlanan++;
                    continue;
                }

                const { error: insErr } = await supabase.from('b1_arge_products').insert([{
                    veri_kaynagi: urun.veri_kaynagi || 'Karantina Onayı',
                    islenen_durum: 'bekliyor',
                    isleyen_ajan: 'bot_oluisci_onayli',
                    ham_veri: {
                        ...urun, isim: urun.urun_ismi, fiyatSayi: urun.indirimli_fiyat > 0 ? urun.indirimli_fiyat : urun.orjinal_fiyat, resimUrl: urun.urun_fotografi, urunLink: urun.urun_linki, onaylayan: kullanici?.ad || 'Atölye Lideri'
                    }
                }]);
                if (!insErr) {
                    await supabase.from('b1_arge_products_karantina').update({ karantina_durumu: 'onaylandi' }).eq('id', urun.id);
                    basarili++;
                }
            } catch (err) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: ScraperKarantinaContainer.js | Hata:', err ? err.message || err : 'Bilinmiyor'); }
        }

        goster(`✅ Toplu işlem bitti. ${basarili} eklendi, ${atlanan} eski/mükerrer kayıt çöpe atıldı.`);
        verileriCek();
        setIslemdeId(null);
    };

    if (!isYetkili && !yukleniyor) {
        return (
            <div className="p-12 text-center text-red-500 font-bold bg-red-50 border border-red-200 rounded-3xl m-8">
                <ShieldAlert size={48} className="mx-auto mb-4 text-red-600" />
                <h1>YETKİSİZ GİRİŞ ENGELLENDİ</h1>
                <p className="mt-2 text-red-900 font-medium">Bu ekrana (Veri Karantinası) sadece yetkili komutanlar erişebilir.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* HEADERS */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex gap-4 items-center">
                            <NextLink href="/arge" className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition animate-pulse">
                                <ArrowLeft size={24} className="text-emerald-400" />
                            </NextLink>
                            <div>
                                <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-wide">
                                    <ShieldCheck className="text-emerald-500" size={32} />
                                    B1 AR-GE <span className="text-emerald-500">KARANTİNA</span> MERKEZİ
                                </h1>
                                <p className="text-slate-400 font-medium mt-1">Ölü İşçi botunun çektiği HAM veriler burada bekler. Zararlı/Kirli verileri ayıklayın.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {karantinaListesi.length > 0 && (
                            <button
                                onClick={tumunuOnayla}
                                disabled={islemdeId !== null}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 flex items-center gap-2 transition disabled:opacity-50"
                            >
                                <CheckCircle2 size={20} />
                                Tümü Güvenli (Onayla)
                            </button>
                        )}
                        <div className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-3 font-bold shadow-inner">
                            <Activity className="text-blue-400" size={20} />
                            <span>{karantinaListesi.length} Bekleyen</span>
                        </div>
                    </div>
                </div>

                {mesaj.text && (
                    <div className={`p-4 mb-6 rounded-xl font-bold flex flex-row items-center gap-3 ${mesaj.type === 'error' ? 'bg-red-900/50 text-red-300 border border-red-700/50' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'}`}>
                        {mesaj.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                        {mesaj.text}
                    </div>
                )}

                {loading ? (
                    <div className="py-24 text-center">
                        <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400 font-bold animate-pulse">Karantina Havuzu Taranıyor...</p>
                    </div>
                ) : karantinaListesi.length === 0 ? (
                    <div className="py-24 text-center bg-slate-800/30 border border-slate-700/50 rounded-3xl backdrop-blur-sm">
                        <ShieldCheck size={64} className="mx-auto text-slate-600 mb-6" />
                        <h2 className="text-xl font-bold text-slate-400">Karantina Bölgesi Temiz</h2>
                        <p className="text-slate-500 mt-2">İncelenmeyi bekleyen ham veri bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {karantinaListesi.map(urun => (
                            <div key={urun.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl hover:border-emerald-500/30 transition-all flex flex-col md:flex-row relative">

                                {/* Kusurlu Veri Sinyali (Örn isim yoksa, fiyat saçmaysa) */}
                                {(!urun.urun_ismi || urun.indirimli_fiyat === 0) && (
                                    <div className="absolute top-0 right-0 bg-red-600/90 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 z-10 shadow-lg">
                                        <AlertTriangle size={12} /> Kusurlu/Eksik Veri İhtimali
                                    </div>
                                )}

                                {/* Resim */}
                                <div className="w-full md:w-64 bg-slate-900 flex-shrink-0 relative overflow-hidden group">
                                    {urun.urun_fotografi ? (
                                        <img src={urun.urun_fotografi} alt={urun.urun_ismi} className="w-full h-full object-cover aspect-[3/4] md:aspect-auto opacity-80 group-hover:opacity-100 transition duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full min-h-[200px] flex items-center justify-center text-slate-600 bg-slate-800/50"><Eye size={48} /></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                                    <div className="absolute bottom-3 left-3 flex gap-2">
                                        <span className="bg-slate-950/80 backdrop-blur text-blue-400 text-xs font-bold px-2 py-1 rounded">#{urun.id.split('-')[0]}</span>
                                        <span className="bg-emerald-900/80 backdrop-blur text-emerald-300 text-xs font-bold px-2 py-1 rounded">{urun.veri_kaynagi}</span>
                                    </div>
                                </div>

                                {/* Analiz İçeriği */}
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2 gap-4">
                                            <div>
                                                <h3 className="text-xl font-black text-white leading-tight">{urun.urun_ismi || 'İsimsiz Ürün'}</h3>
                                                <p className="text-emerald-400 font-bold tracking-wide uppercase text-sm mt-1">{urun.marka_ismi}</p>
                                            </div>
                                            <a href={urun.urun_linki} target="_blank" rel="noreferrer" className="text-slate-400 flex-shrink-0 hover:text-white bg-slate-700/50 p-2 rounded-lg transition" title="Kaynağa Git">
                                                <ExternalLink size={20} />
                                            </a>
                                        </div>

                                        {/* Fiyat ve Performans Grid */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-6">
                                            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                                                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Satış Fiyatı</div>
                                                <div className="font-black text-rose-400 text-lg">₺{urun.indirimli_fiyat || urun.orjinal_fiyat}</div>
                                                {urun.indirimli_fiyat > 0 && urun.indirimli_fiyat < urun.orjinal_fiyat && (
                                                    <div className="text-xs text-slate-500 line-through">₺{urun.orjinal_fiyat}</div>
                                                )}
                                            </div>
                                            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                                                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Müşteri Puanı</div>
                                                <div className="font-black text-amber-400 text-lg">{urun.urun_puani > 0 ? urun.urun_puani.toFixed(1) : 'Bilinmiyor'} <span className="text-sm font-normal text-slate-500">/ 5</span></div>
                                            </div>
                                            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                                                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Yorum Sayısı</div>
                                                <div className="font-black text-blue-400 text-lg">{urun.urun_degerlendirme_sayisi || 0}</div>
                                            </div>
                                            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                                                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Favori Sayısı</div>
                                                <div className="font-black text-emerald-400 text-lg">{urun.favori_sayisi || 0}</div>
                                            </div>
                                        </div>

                                        {/* Ekstra Özellikler / Badge'ler */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {urun.sepete_ekleme_notu && <span className="bg-rose-900/30 text-rose-300 border border-rose-800/50 px-3 py-1 rounded-full text-xs font-bold">{urun.sepete_ekleme_notu}</span>}
                                            {urun.siparis_begenisi_notu && <span className="bg-blue-900/30 text-blue-300 border border-blue-800/50 px-3 py-1 rounded-full text-xs font-bold">{urun.siparis_begenisi_notu}</span>}
                                        </div>

                                        {/* Kumaş Özellikleri (JSON) Kısaltılmış Gösterimi */}
                                        {urun.urun_ozellikleri && Array.isArray(urun.urun_ozellikleri) && urun.urun_ozellikleri.length > 0 && (
                                            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 mb-4">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2"><Info size={14} /> Ürün Kimliği (JSON)</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {urun.urun_ozellikleri.slice(0, 5).map((attr, idx) => (
                                                        <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-1 text-xs rounded shadow-sm border border-slate-700/50">
                                                            <span className="text-slate-500 mr-1">{attr.key}:</span>{attr.value}
                                                        </span>
                                                    ))}
                                                    {urun.urun_ozellikleri.length > 5 && <span className="text-xs text-slate-500 self-center">+{urun.urun_ozellikleri.length - 5} daha...</span>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Ek Analiz Özeti */}
                                        {urun.urun_yorum_ozeti && urun.urun_yorum_ozeti !== 'Değerlendirilmedi' && (
                                            <div className="mt-2 text-sm text-slate-400 italic bg-slate-900/30 p-3 rounded-lg border-l-2 border-emerald-500">
                                                "{urun.urun_yorum_ozeti}"
                                            </div>
                                        )}
                                    </div>

                                    {/* Alt Bar: Aksiyonlar */}
                                    <div className="mt-6 pt-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center pl-0 gap-4">
                                        <div className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                                            <Clock size={14} /> Çekilme: {urun.cekildigi_gun}
                                        </div>
                                        <div className="flex gap-3 w-full sm:w-auto">
                                            <button
                                                onClick={() => reddetVeCopeAt(urun.id)}
                                                disabled={islemdeId && islemdeId !== urun.id}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-red-900/40 text-rose-400 hover:text-red-300 border border-slate-700 hover:border-red-800/50 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                                            >
                                                {islemdeId === urun.id ? <div className="w-4 h-4 border-2 border-slate-400 border-t-rose-400 rounded-full animate-spin" /> : <Trash2 size={16} />}
                                                Çöpe At
                                            </button>
                                            <button
                                                onClick={() => onaylaVeAsilTabloyaAktar(urun)}
                                                disabled={islemdeId && islemdeId !== urun.id}
                                                className="flex-1 sm:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                                            >
                                                {islemdeId === urun.id ? <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
                                                Onayla ve Ekle
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
