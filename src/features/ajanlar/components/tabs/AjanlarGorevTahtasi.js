import { Send, Bot, Loader2, Play, RefreshCw, Trash2, CheckCircle2, Clock, XCircle, Square } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatTarih } from '@/lib/utils';

export const GOREV_TIPLERI = [
    { deger: 'arastirma', etiket: 'Araştırma', ikon: '🔍' },
    { deger: 'analiz', etiket: 'Analiz', ikon: '📊' },
    { deger: 'kontrol', etiket: 'Kontrol', ikon: '✅' },
    { deger: 'rapor', etiket: 'Rapor', ikon: '📄' },
];

export const ONCELIK = [
    { deger: 'acil', etiket: 'Acil', renk: '#ef4444', bg: '#fef2f2' },
    { deger: 'yuksek', etiket: 'Yüksek', renk: '#f59e0b', bg: '#fffbeb' },
    { deger: 'normal', etiket: 'Normal', renk: '#3b82f6', bg: '#eff6ff' },
    { deger: 'dusuk', etiket: 'Düşük', renk: '#94a3b8', bg: '#f8fafc' },
];

export const DURUM_CONFIG = {
    bekliyor: { renk: '#94a3b8', bg: '#f8fafc', ikon: Clock, etiket: 'Bekliyor' },
    'calisıyor': { renk: '#f59e0b', bg: '#fffbeb', ikon: Loader2, etiket: 'Çalışıyor' },
    tamamlandi: { renk: '#10b981', bg: '#ecfdf5', ikon: CheckCircle2, etiket: 'Tamamlandı' },
    hata: { renk: '#ef4444', bg: '#fef2f2', ikon: XCircle, etiket: 'Hata' },
    iptal: { renk: '#6b7280', bg: '#f9fafb', ikon: Square, etiket: 'İptal' },
};

export const AJAN_LISTESI = [
    { ad: 'Trend Kâşifi', ikon: '🔍', renk: '#3b82f6', modul: 'arge', aciklama: 'Trendyol, Amazon araştırır' },
    { ad: 'Üretim Kontrol', ikon: '⚙️', renk: '#f59e0b', modul: 'uretim', aciklama: 'Üretim takibi' },
    { ad: 'Muhasebe', ikon: '📊', renk: '#6366f1', modul: 'muhasebe', aciklama: 'Raporlar üretir' },
    { ad: 'Stok Kontrol', ikon: '📦', renk: '#ef4444', modul: 'stok', aciklama: 'Stok alarmları' },
    { ad: 'Personel', ikon: '👤', renk: '#f97316', modul: 'personel', aciklama: 'Personel analizi' },
    { ad: 'Genel', ikon: '🤖', renk: '#64748b', modul: 'genel', aciklama: 'Genel analiz' },
];

export default function AjanlarGorevTahtasi({
    formAcik, setFormAcik, form, setForm, gorevGonder, islemdeId,
    filtre, setFiltre, gorevler, loading, secilenGorev, setSecilenGorev,
    calistiriliyor, gorevCalistir, gorevSil, yukleSessiz, goster
}) {
    const sure = (bas, bit) => { if (!bas || !bit) return null; const ms = new Date(bit) - new Date(bas); if (ms < 1000) return `${ms}ms`; if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`; return `${Math.floor(ms / 60000)}dk`; };
    const ajanBilgisi = (ad) => AJAN_LISTESI.find(a => a.ad === ad) || AJAN_LISTESI[5];
    const oncelikBilgisi = (d) => ONCELIK.find(o => o.deger === d) || ONCELIK[2];
    const durumBilgisi = (d) => DURUM_CONFIG[d] || DURUM_CONFIG.bekliyor;
    const filtreliGorevler = filtre === 'hepsi' ? gorevler : gorevler.filter(g => g.durum === filtre);

    return (
        <div className="animate-fade-in">
            {formAcik && (
                <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-3xl p-8 mb-6 border-2 border-indigo-500 shadow-[0_20px_60px_rgba(99,102,241,0.3)]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <Send size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-lg m-0">🎖️ Yeni Görev Emri</h3>
                                <p className="text-slate-400 text-xs font-bold mt-1">Tüm ajanlar bu görev tahtasını okur</p>
                            </div>
                        </div>
                        <button onClick={() => setFormAcik(false)} className="bg-transparent border-0 text-emerald-200 hover:text-white cursor-pointer font-black text-lg transition-colors p-2">✕</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="col-span-full">
                            <label className="block text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2">🏷️ Görev Adı *</label>
                            <input value={form.gorev_adi} onChange={e => setForm({ ...form, gorev_adi: e.target.value })} placeholder="Örn: Trendyol Fiyat/Puan Rekabet Analizi"
                                className="w-full px-4 py-3 bg-[#1e293b] border-2 border-slate-700 rounded-xl text-white font-bold outline-none focus:border-indigo-500 transition-colors" />
                        </div>

                        {/* Tip Seçimi */}
                        <div>
                            <label className="block text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2">⚡ Görev Tipi</label>
                            <div className="grid grid-cols-4 gap-2">
                                {GOREV_TIPLERI.map(tip => (
                                    <button key={tip.deger} onClick={() => setForm({ ...form, gorev_tipi: tip.deger })}
                                        className={`py-2 px-1 rounded-lg border-2 text-[0.7rem] font-black cursor-pointer transition-colors ${form.gorev_tipi === tip.deger ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                        {tip.ikon} {tip.etiket}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Öncelik */}
                        <div>
                            <label className="block text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2">🚨 Öncelik</label>
                            <div className="grid grid-cols-4 gap-2">
                                {ONCELIK.map(o => (
                                    <button key={o.deger} onClick={() => setForm({ ...form, oncelik: o.deger })}
                                        className={`py-2 px-1 rounded-lg border-2 text-[0.7rem] font-black cursor-pointer transition-colors`}
                                        style={form.oncelik === o.deger ? { background: o.renk, borderColor: o.renk, color: 'white' } : { background: '#1e293b', borderColor: '#334155', color: '#94a3b8' }}>
                                        {o.etiket}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Ajan Seçimi */}
                        <div>
                            <label className="block text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2">🤖 Ajan</label>
                            <select value={form.ajan_adi} onChange={e => setForm({ ...form, ajan_adi: e.target.value })}
                                className="w-full px-4 py-3 bg-[#1e293b] border-2 border-slate-700 rounded-xl text-white font-bold outline-none focus:border-indigo-500 transition-colors appearance-none">
                                {AJAN_LISTESI.map(a => <option key={a.ad} value={a.ad}>{a.ikon} {a.ad}</option>)}
                            </select>
                        </div>

                        {/* Yetkiler */}
                        <div>
                            <label className="block text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2">🔐 Yetkiler</label>
                            <div className="flex gap-2 flex-wrap">
                                {[{ alan: 'yetki_internet', etiket: '🌐 Bağlantı' }, { alan: 'yetki_ai_kullan', etiket: '🤖 LLM (Gemini)' }, { alan: 'yetki_supabase_oku', etiket: '📥 Okuma' }, { alan: 'yetki_supabase_yaz', etiket: '📤 Yazma' }]
                                    .map(y => (
                                        <button key={y.alan} onClick={() => setForm({ ...form, [y.alan]: !form[y.alan] })}
                                            className={`py-1.5 px-3 rounded-lg border-2 text-[0.7rem] font-black cursor-pointer transition-colors flex items-center gap-1 ${form[y.alan] ? 'bg-emerald-800 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                            {y.etiket} {form[y.alan] ? '✓' : '✗'}
                                        </button>
                                    ))}
                            </div>
                        </div>

                        {/* Görev Emri (Prompt) */}
                        <div className="col-span-full">
                            <label className="block text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2">📋 Görev Emri / Sistem Promptu *</label>
                            <textarea rows={4} maxLength={1000} value={form.gorev_emri} onChange={e => setForm({ ...form, gorev_emri: e.target.value })} placeholder="Ajan tam olarak ne yapmalı? Hangi verileri kontrol edip nereye kaydetsin?"
                                className="w-full px-4 py-3 bg-[#1e293b] border-2 border-slate-700 rounded-xl text-white font-bold outline-none focus:border-indigo-500 transition-colors custom-scrollbar resize-y" />
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-3 mt-6 pt-4 border-t border-slate-700/50">
                        <button onClick={() => setFormAcik(false)} className="px-6 py-2.5 bg-transparent border-2 border-slate-600 text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-800 transition-colors">İptal Pano</button>
                        <button onClick={gorevGonder} disabled={islemdeId === 'yeniGorev'} className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white rounded-xl font-black cursor-pointer flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50">
                            {islemdeId === 'yeniGorev' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {islemdeId === 'yeniGorev' ? 'Ajan Hesaplanıyor...' : 'Ajanı Ateşle (Görevlendir)'}
                        </button>
                    </div>
                </div>
            )}

            {/* Filtre Barı */}
            <div className="flex gap-2 flex-wrap mb-4">
                {['hepsi', 'bekliyor', 'calisıyor', 'tamamlandi', 'hata', 'iptal'].map(f => (
                    <button key={f} onClick={() => setFiltre(f)}
                        className={`px-4 py-2 rounded-full border-2 text-[0.75rem] font-black cursor-pointer transition-colors ${filtre === f ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}>
                        {f === 'hepsi' ? '🔘 Tüm Liste' : f === 'bekliyor' ? `⏳ Bekleyen (${gorevler.filter(g => g.durum === 'bekliyor').length})` : f === 'calisıyor' ? '⚡ Çalışanlar' : f === 'tamamlandi' ? `✅ Biten (${gorevler.filter(g => g.durum === 'tamamlandi').length})` : f === 'hata' ? '❌ Hata' : '🚫 İptal'}
                    </button>
                ))}
            </div>

            {/* Tablo Render */}
            <div className="bg-[#122b27] overflow-hidden rounded-2xl border border-[#1e4a43] shadow-md">
                <div className="overflow-x-auto min-h-[400px]">
                    <div className="min-w-[850px]">
                        {/* Tablo Başlık */}
                        <div className="grid grid-cols-[2fr_120px_90px_100px_130px_90px_160px] gap-2 px-5 py-3.5 bg-[#0b1d1a] border-b border-[#1e4a43] text-[0.65rem] font-black text-emerald-400/80 uppercase tracking-widest">
                            <span>Görev Kartı</span><span>Ajan Yetkili</span><span>Analiz Türü</span><span>Ağırlık Seviyesi</span><span>Operasyon Durumu</span><span>Süre</span><span>Aksiyon Kontrol</span>
                        </div>

                        {loading && <div className="text-center py-16 text-emerald-200 font-bold animate-pulse">AI Kuyruğu Taranıyor...</div>}
                        {!loading && filtreliGorevler.length === 0 && (
                            <div className="text-center py-24 text-slate-500">
                                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                                <div className="font-extrabold text-lg">Bu filtrede aktif ajan gözükmüyor</div>
                                <div className="text-sm font-semibold mt-1">Stratejik araştırma boşlukta.</div>
                            </div>
                        )}

                        {/* Liste */}
                        {filtreliGorevler.map(gorev => {
                            const dur = durumBilgisi(gorev.durum); const DurumIcon = dur.ikon;
                            const ajan = ajanBilgisi(gorev.ajan_adi); const onc = oncelikBilgisi(gorev.oncelik);
                            const calisiyor = calistiriliyor[gorev.id]; const secili = secilenGorev?.id === gorev.id;

                            return (
                                <div key={gorev.id} className="border-b border-[#1e4a43]/50 last:border-0">
                                    <div className={`grid grid-cols-[2fr_120px_90px_100px_130px_90px_160px] gap-2 px-5 py-3.5 items-center cursor-pointer transition-colors ${secili ? 'bg-indigo-950/20 shadow-inner' : 'hover:bg-[#0d1117]'}`}
                                        onClick={() => setSecilenGorev(secili ? null : gorev)}>

                                        <div>
                                            <div className="text-[0.85rem] font-black text-white leading-tight mb-1">{gorev.gorev_adi}</div>
                                            <div className="text-[0.65rem] font-bold text-slate-500">{formatTarih(gorev.created_at)} — {gorev.hedef_modul?.toUpperCase() || 'GENEL AĞ'}</div>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="text-[0.7rem] font-bold" style={{ color: ajan.renk }}>{ajan.ikon} {ajan.ad}</span>
                                        </div>

                                        <div><span className="text-[0.65rem] font-black bg-[#0b1d1a] border border-[#1e4a43] text-emerald-100 px-2 py-0.5 rounded tracking-widest uppercase">{GOREV_TIPLERI.find(t => t.deger === gorev.gorev_tipi)?.ikon} {gorev.gorev_tipi}</span></div>

                                        <div><span className="text-[0.65rem] font-black border px-2 py-0.5 rounded-full tracking-wider" style={{ background: onc.bg, color: onc.renk, borderColor: onc.renk }}>{onc.etiket}</span></div>

                                        <div><span className="inline-flex items-center gap-1.5 text-[0.65rem] font-black border px-2 py-0.5 rounded-full tracking-wider uppercase" style={{ background: dur.bg, color: dur.renk, borderColor: dur.renk }}>
                                            <DurumIcon size={12} className={gorev.durum === 'calisıyor' ? 'animate-spin' : ''} /> {dur.etiket}
                                        </span></div>

                                        <div className="text-[0.7rem] font-bold text-slate-400 font-mono">{sure(gorev.baslangic_tarihi, gorev.bitis_tarihi) || '—'}</div>

                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            {gorev.hibrit_onay_gerekli && gorev.yonetici_onayi === 'bekliyor' ? (
                                                <button onClick={async () => {
                                                    if (!confirm('Otonom işlem başlasın mı?')) return;
                                                    await supabase.from('b1_ajan_gorevler').update({ yonetici_onayi: 'onaylandi' }).eq('id', gorev.id);
                                                    yukleSessiz(); goster('Operasyon onayı verildi.', 'success');
                                                }} className="bg-red-600 hover:bg-red-500 text-white font-bold text-[0.65rem] px-2.5 py-1.5 rounded-lg border-b-2 border-red-800 cursor-pointer shadow-md uppercase">🛡️ HİBRİT ONAY</button>
                                            ) : (
                                                <>
                                                    {gorev.durum === 'bekliyor' && (
                                                        <button onClick={() => gorevCalistir(gorev.id)} disabled={calisiyor} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[0.65rem] px-2.5 py-1.5 rounded-lg flex items-center gap-1 border-b-2 border-indigo-800 cursor-pointer shadow-md disabled:opacity-50">
                                                            {calisiyor ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} BAŞLAT
                                                        </button>
                                                    )}
                                                    {gorev.durum === 'tamamlandi' && (
                                                        <button onClick={() => gorevCalistir(gorev.id)} className="bg-[#122b27] border border-indigo-500/50 hover:bg-[#0b1d1a] text-indigo-400 font-bold text-[0.65rem] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer">
                                                            <RefreshCw size={11} /> TEKRARLA
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            <button disabled={islemdeId === 'sil_' + gorev.id} onClick={() => gorevSil(gorev.id)} className="bg-red-950/20 hover:bg-red-950/50 border border-red-900/50 text-red-500 p-1.5 rounded-lg cursor-pointer disabled:opacity-30">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Açılır Panel */}
                                    {secili && (
                                        <div className="p-5 bg-[#0b1d1a] border-t border-[#1e4a43] grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in shadow-inner">
                                            <div>
                                                <div className="font-extrabold text-[0.65rem] text-slate-500 uppercase tracking-widest mb-1.5">Sistem Promptu (Görev Tanımı)</div>
                                                <div className="bg-[#122b27] border border-[#1e4a43] rounded-xl p-4 text-[0.8rem] text-emerald-100 font-semibold leading-relaxed shadow-sm">
                                                    {gorev.gorev_emri}
                                                </div>
                                                {gorev.hibrit_onay_gerekli && (
                                                    <div className={`mt-2 text-[0.7rem] font-bold ${gorev.yonetici_onayi === 'onaylandi' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {gorev.yonetici_onayi === 'onaylandi' ? '✅ Yönetici Onaylı İşlem (Güvenli)' : '🛡️ İşlem İçin Sistemsel Yönetici Onayı (Hibrit Kalkan) Şart!'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-[0.65rem] text-slate-500 uppercase tracking-widest mb-1.5">Yapay Zeka (Otonom) Operasyon Çıktısı</div>
                                                {gorev.sonuc_ozeti ? (
                                                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4 text-[0.8rem] text-emerald-400 font-medium leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar shadow-sm">
                                                        {gorev.sonuc_ozeti}
                                                    </div>
                                                ) : (
                                                    <div className="bg-[#122b27]/50 border border-[#1e4a43] border-dashed rounded-xl p-6 text-center text-slate-500 font-bold text-sm">
                                                        {gorev.durum === 'bekliyor' ? '— Tetik Bekleniyor —' : '— Düşünüyor... Analiz ediliyor... —'}
                                                    </div>
                                                )}
                                                {gorev.hata_mesaji && <div className="mt-2 bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-[0.7rem] font-bold text-red-400">🚨 HATA: {gorev.hata_mesaji}</div>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
