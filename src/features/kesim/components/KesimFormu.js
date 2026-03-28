import { Scissors } from 'lucide-react';

const DURUMLAR = ['kesimde', 'tamamlandi', 'iptal'];
const BEDENLER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export default function KesimFormu({
    form, setForm, isAR, duzenleId, modeller, kumaslar, BOSH_KESIM,
    setFormAcik, setDuzenleId, kaydetKesim, loading
}) {
    return (
        <div className="bg-[#161b22] border border-emerald-500/30 rounded-xl p-6 mb-8 shadow-lg shadow-emerald-500/5">
            <h3 className="font-black text-emerald-400 mb-5 text-lg flex items-center gap-2 uppercase tracking-wide">
                <Scissors size={20} /> {duzenleId ? 'Kesim Düzenle' : (isAR ? 'تسجيل عملية قص جديدة' : 'Yeni Kesim Kaydı')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                <div className="xl:col-span-3">
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-1">{isAR ? 'النموذج المراد قصه *' : 'Kesilecek Model *'}</label>
                    <select value={form.model_taslak_id} onChange={e => setForm({ ...form, model_taslak_id: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none">
                        <option value="">— {isAR ? 'اختر النموذج' : 'Model Seçiniz'} —</option>
                        {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} | {m.model_adi}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-1">{isAR ? 'عدد طبقات الباستال *' : 'Pastal Kat Sayısı *'}</label>
                    <input type="number" dir="ltr" value={form.pastal_kat_sayisi} placeholder="Örn: 200"
                        onChange={e => setForm({ ...form, pastal_kat_sayisi: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-1">{isAR ? 'الكمية الصافية المقطوعة' : 'Net Çıkan Adet'}</label>
                    <input type="number" dir="ltr" value={form.kesilen_net_adet} placeholder="Örn: 195"
                        onChange={e => setForm({ ...form, kesilen_net_adet: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-1">Toplam Harcanan Kumaş (MT)</label>
                    <input type="number" dir="ltr" value={form.kullanilan_kumas_mt || ''} placeholder="Örn: 150 mt"
                        onChange={e => setForm({ ...form, kullanilan_kumas_mt: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-1">Fire Oranı (%) ⚙️</label>
                    <input type="number" dir="ltr" value={form.fire_orani} disabled={false}
                        onChange={e => setForm({ ...form, fire_orani: e.target.value })}
                        className={`w-full bg-[#0d1117] border rounded-lg px-3 py-2 text-xs text-white outline-none ${parseFloat(form.fire_orani) > 5 ? 'border-rose-500 focus:border-rose-400' : 'border-[#30363d] focus:border-emerald-500'}`} />
                </div>

                <div>
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-1">{isAR ? 'الحالة' : 'Durum'}</label>
                    <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none">
                        {DURUMLAR.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-1">Kesimci Personel</label>
                    <input type="text" value={form.kesimci_adi} onChange={e => setForm({ ...form, kesimci_adi: e.target.value })}
                        placeholder="Kesimci adı soyadı..." className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none" maxLength={100} />
                </div>

                <div>
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-1">Kesim Tarihi</label>
                    <input type="date" value={form.kesim_tarihi} onChange={e => setForm({ ...form, kesim_tarihi: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#8b949e] focus:border-emerald-500 outline-none style-date-picker" />
                </div>

                <div>
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-1">Kumaş Topu / Renk Kodu</label>
                    <select value={form.kumas_topu_no} onChange={e => setForm({ ...form, kumas_topu_no: e.target.value })}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none">
                        <option value="">— Opsiyonel: Stoktan Kumaş Seçin —</option>
                        {kumaslar.map(k => (
                            <option key={k.id} value={k.kumas_kodu}>{k.kumas_kodu} {k.renk_tanimi ? `- ${k.renk_tanimi}` : ''}</option>
                        ))}
                    </select>
                </div>

                <div className="xl:col-span-3">
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-2">Beden Dağılımı (Adet)</label>
                    <div className="grid grid-cols-7 gap-2">
                        {BEDENLER.map(b => {
                            let bData = {};
                            try { bData = JSON.parse(form.beden_dagilimi || '{}'); } catch (e) { console.error('KesimMainContainer.js Beden Dağılımı Hatası'); }
                            return (
                                <div key={b} className="flex flex-col gap-1 bg-[#0b121a] p-2 rounded-lg border border-[#21262d]">
                                    <span className="font-bold text-sm text-emerald-400 text-center">{b}</span>
                                    <input type="number" placeholder="0" min="0" value={bData[b] || ''}
                                        onChange={e => {
                                            try { bData = JSON.parse(form.beden_dagilimi || '{}'); } catch (e) { console.error('KesimMainContainer.js Beden Dağılım Hatası'); }
                                            if (e.target.value) bData[b] = parseInt(e.target.value);
                                            else delete bData[b];
                                            setForm({ ...form, beden_dagilimi: JSON.stringify(bData) });
                                        }}
                                        className="w-full bg-transparent border-b border-[#30363d] text-center text-xs text-white focus:border-emerald-500 outline-none py-1" />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="xl:col-span-3">
                    <label className="block text-sm font-black text-[#8b949e] tracking-widest uppercase mb-1">Notlar / Özel Talimat</label>
                    <textarea rows={2} maxLength={400} value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })}
                        placeholder="Kesimci notu, özel talimat, sorun kaydı..." className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none resize-y" />
                </div>

            </div>
            <div className="flex gap-4 mt-6 justify-end border-t border-[#21262d] pt-4">
                <button onClick={() => { setForm(BOSH_KESIM); setFormAcik(false); setDuzenleId(null); }} className="px-5 py-2 border border-[#30363d] bg-[#0d1117] rounded-lg font-bold text-[#8b949e] hover:text-white transition-colors text-xs">{isAR ? 'إلغاء' : 'İptal'}</button>
                <button onClick={kaydetKesim} disabled={loading}
                    className={`px-6 py-2 rounded-lg font-bold text-white transition-colors shadow-lg text-xs ${loading ? 'bg-[#30363d] cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}>
                    {loading ? 'İşleniyor...' : (duzenleId ? 'Kesimi Güncelle' : (isAR ? 'بدء القص' : 'Kesimi Başlat ve Kaydet'))}
                </button>
            </div>
        </div>
    );
}
