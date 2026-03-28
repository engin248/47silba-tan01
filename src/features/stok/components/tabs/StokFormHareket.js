import { ArrowUpRight } from 'lucide-react';

export default function StokFormHareket({
    formAcik, setFormAcik, setYeniHareket, BOSH_HAREKET, isAR,
    yeniHareket, stokEnvanteri, stokHareketiKaydet, loading
}) {
    if (!formAcik) return null;

    return (
        <div className="bg-[#122b27] border-2 border-emerald-900 rounded-[18px] p-8 mb-8 shadow-[0_10px_40px_rgba(4,120,87,0.08)] relative animate-fade-in">
            <div className="absolute top-0 right-0 sm:left-auto sm:right-0 bg-amber-600 text-white px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-widest rounded-bl-[18px] md:rounded-tr-[16px] shadow-sm">
                {isAR ? 'منطقة ٙمنة أوفلاين' : 'Offline Zırhlı Bölge'}
            </div>

            <h3 className="font-black text-emerald-400 mb-6 text-lg flex items-center gap-2 m-0 mt-2 border-b border-[#1e4a43] pb-3">
                <ArrowUpRight size={20} className="text-emerald-500" />
                {isAR ? 'تسجيل إدخال / إخراج مستودع' : 'YENİ DEPO GİRİŞ/ÇIKIŞ ONAYI'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-[0.75rem] font-black text-emerald-200 mb-1.5 uppercase tracking-wider">{isAR ? 'اختر المنتج *' : 'Kimlik / Tanım Seç *'}</label>
                    <select
                        value={yeniHareket.urun_id}
                        onChange={e => setYeniHareket({ ...yeniHareket, urun_id: e.target.value })}
                        className="w-full bg-[#0b1d1a] border-2 border-slate-700 text-white font-bold text-sm py-3 px-4 rounded-xl outline-none focus:border-emerald-500 cursor-pointer transition-colors"
                    >
                        <option value="">--- {isAR ? 'اختر' : 'HEDEF ÜRÜN'} ---</option>
                        {stokEnvanteri.map(s => <option key={s.id} value={s.id}>{s.urun_kodu} ({s.net_stok} {isAR ? 'متوفر' : 'Mevcut'})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[0.75rem] font-black text-emerald-200 mb-1.5 uppercase tracking-wider">{isAR ? 'نوع الحركة *' : 'Hareket Yönü *'}</label>
                    <select
                        value={yeniHareket.hareket_tipi}
                        onChange={e => setYeniHareket({ ...yeniHareket, hareket_tipi: e.target.value })}
                        className="w-full bg-[#0b1d1a] border-2 border-slate-700 text-white font-bold text-sm py-3 px-4 rounded-xl outline-none focus:border-emerald-500 cursor-pointer transition-colors"
                    >
                        <option value="giris">🟢 {isAR ? 'إدخال (+)' : 'MERKEZ GİRİŞ (+)'}</option>
                        <option value="cikis">🔴 {isAR ? 'إخراج (-)' : 'SATIŞ ÇIKIŞ (-)'}</option>
                        <option value="iade">🟣 {isAR ? 'إرجاع (+)' : 'İADE GİRİŞ (+)'}</option>
                        <option value="fire">🟠 {isAR ? 'تالف (-)' : 'FİRE / HASARLI (-)'}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[0.75rem] font-black text-emerald-200 mb-1.5 uppercase tracking-wider">{isAR ? 'الكمية *' : 'İşlem Adeti *'}</label>
                    <input
                        type="number" dir="ltr" min="1"
                        value={yeniHareket.adet}
                        placeholder="Örn: 50"
                        onChange={e => setYeniHareket({ ...yeniHareket, adet: e.target.value })}
                        className="w-full bg-[#122b27] border-2 border-[#1e4a43] text-emerald-400 font-black text-lg py-2.5 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 placeholder:font-bold placeholder:text-sm"
                    />
                </div>
                <div>
                    <label className="block text-[0.75rem] font-black text-emerald-200 mb-1.5 uppercase tracking-wider">{isAR ? 'المسؤول / الملاحظات' : 'Sorumlu / Fiş / Kargo'}</label>
                    <input
                        type="text"
                        value={yeniHareket.aciklama}
                        placeholder={isAR ? 'السائق، فاتورة العودة...' : 'Aras Kargo Gönderimi vb.'}
                        onChange={e => setYeniHareket({ ...yeniHareket, aciklama: e.target.value })}
                        className="w-full bg-[#122b27] border-2 border-[#1e4a43] text-white font-bold text-sm py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
                    />
                </div>
            </div>

            <div className="flex gap-4 mt-8 justify-end flex-wrap border-t border-[#1e4a43] pt-4">
                <button
                    onClick={() => setFormAcik(false)}
                    className="px-6 py-3 border-2 border-slate-700 bg-slate-800 text-slate-300 font-black tracking-wider text-sm rounded-xl cursor-pointer hover:bg-slate-700 transition-colors"
                >
                    {isAR ? 'إلغاء' : 'İPTAL ET'}
                </button>
                <button
                    onClick={stokHareketiKaydet}
                    disabled={loading}
                    className={`px-8 py-3 text-white font-black tracking-widest text-sm border-0 border-b-4 rounded-xl shadow-[0_4px_15px_rgba(4,120,87,0.3)] transition-all ${loading ? 'bg-slate-500 border-slate-700 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-800 cursor-pointer'}`}
                >
                    {loading ? 'YÜKLENİYOR...' : (isAR ? 'حفظ في المستودع' : 'DEPO ONAYLANMIŞ KAYIT')}
                </button>
            </div>
        </div>
    );
}
