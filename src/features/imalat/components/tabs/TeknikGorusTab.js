import { UploadCloud, Database } from 'lucide-react';

export default function TeknikGorusTab({
    isAR, yeniFoy, setYeniFoy, teknikFoyKaydet, loading, teknikFoyler
}) {
    return (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form Alanı */}
            <div className="card shadow-xl border-t-8 border-blue-500 bg-white p-6 rounded-2xl">
                <div className="flex items-center gap-3 border-b pb-4 mb-6">
                    <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><UploadCloud size={24} /></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">TEKNİK GÖRÜŞ (Ürün Dosyası Açma)</h2>
                        <p className="text-sm text-gray-500 font-bold mt-1">Dışarıdan (Firma/ArGe) gelen modelin anayasası burada yazılır. Alt limitler burada kilitlenir.</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Ürün / Model Resmi Adı</label>
                        <input maxLength={200} type="text" className="form-input text-lg font-bold w-full border-2 border-slate-200 focus:border-blue-500 p-3 rounded-xl" placeholder="Örn: X Marka Kaşe Kaban (Erkek)" value={yeniFoy.model_name} onChange={e => setYeniFoy({ ...yeniFoy, model_name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Orijinal Model Görseli (Dosya/URL) <span>(Zorunlu)</span></label>
                        <input maxLength={1000} type="text" className="form-input w-full bg-slate-50 p-3 rounded-xl border border-slate-200" placeholder="https://ornek.com/model_resmi.jpg" value={yeniFoy.orjinal_gorsel_url} onChange={e => setYeniFoy({ ...yeniFoy, orjinal_gorsel_url: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide text-red-600">Maliyet Sınırı Başına (TL)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-slate-400 font-bold">₺</span>
                                <input type="number" className="form-input w-full pl-8 font-black text-red-600 border-red-200 p-3 rounded-xl border-2" placeholder="0.00" value={yeniFoy.maliyet_siniri_tl} onChange={e => setYeniFoy({ ...yeniFoy, maliyet_siniri_tl: e.target.value })} />
                            </div>
                            <p className="text-xs text-gray-400 mt-1 italic">Bu tutar geçilirse sistem kırmızı alarm verir.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide text-emerald-600">Zorunlu Kumaş (Metre)</label>
                            <input type="number" step="0.1" className="form-input w-full font-bold text-emerald-700 border-emerald-200 p-3 rounded-xl border-2" placeholder="1.2" value={yeniFoy.zorunlu_kumas_miktari_mt} onChange={e => setYeniFoy({ ...yeniFoy, zorunlu_kumas_miktari_mt: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Kumaş Esneme Payı Toleransı (%)</label>
                        <input type="number" className="form-input w-full bg-slate-50 p-3 rounded-xl border border-slate-200" placeholder="%5" value={yeniFoy.esneme_payi_yuzde} onChange={e => setYeniFoy({ ...yeniFoy, esneme_payi_yuzde: e.target.value })} />
                    </div>

                    <button onClick={teknikFoyKaydet} disabled={loading} className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-wait">
                        <Database /> {isAR ? 'ختم وحفظ في الخزنة כملف فني' : 'MÜHÜRLE VE TEKNİK FÖY OLARAK KASAYA AT'}
                    </button>
                </div>
            </div>

            {/* Veritabanı Görüntüleme */}
            <div className="card shadow-xl border border-slate-200 bg-slate-50 p-6 rounded-2xl">
                <h2 className="text-xl font-black text-slate-700 mb-4 border-b pb-2 flex items-center gap-2"><Database size={20} /> {isAR ? 'الملفات الفنية المعتمدة' : 'Onaylanmış Teknik Föyler (Kasa)'}</h2>
                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
                    {teknikFoyler.length === 0 && <p className="text-center text-gray-400 font-bold p-8">{isAR ? 'لا يوجد موديلات معتمدة حتى الآن' : 'Sistemde teknik görüşü onaylanmış model yok.'}</p>}
                    {teknikFoyler.map((model) => (
                        <div key={model.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-2 transition hover:shadow-md">
                            <div className="flex justify-between items-start">
                                <h3 className="font-black text-slate-800 text-lg">{model.model_kodu || model.model_name}</h3>
                                <span className="bg-red-100 text-red-700 font-black px-3 py-1 rounded text-sm shrink-0">MAX: {model.numune_maliyeti || 0}₺</span>
                            </div>
                            <p className="text-sm text-gray-600 font-medium">{model.notlar || model.description}</p>
                            <div className="text-xs text-gray-400 font-bold uppercase mt-2 pt-2 border-t">ID: {model.id}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
