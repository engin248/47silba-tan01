import { CheckSquare, PlaySquare, Trash2, Camera, Video } from 'lucide-react';

export default function ModelhaneTab({
    isAR, seciliModel, setSeciliModel, teknikFoyler, uretimAdeti, setUretimAdeti,
    videoKayitAktif, setVideoKayitAktif, yeniAdim, setYeniAdim, islemAdimlari, adimEkle, adimSil, uretimBandiVeyaFasonaFirlat, loading
}) {
    return (
        <div className="animate-fade-in card shadow-xl border-t-8 border-emerald-500 bg-white p-6 rounded-2xl">
            <div className="flex items-center gap-3 border-b pb-4 mb-6">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg"><CheckSquare size={24} /></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800">{isAR ? 'تجهيز المنتج الأول (قالب المقاول)' : 'İLK ÜRÜN HAZIRLAMA (FASONA ŞABLON ÇIKARMA)'}</h2>
                    <p className="text-sm text-gray-500 font-bold mt-1">{isAR ? 'تحديد خطوات الإنتاج بالثانية. لا يمكن للعمال الخروج عن هذا الترتيب.' : 'Teknik Görüşü alınan modelin işlemleri burada saniye saniye belirlenir. İşçi/Fason bu sıranın dışına çıkamaz.'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sol Taraf: Model Seçimi ve Kanıt Videosu */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">{isAR ? '1. اختر أمر الإنتاج (M3) لإعداد القالب' : '1. Şablon Çıkarılacak Üretim Emrini (M3) Seç'}</label>
                    <select className="form-select w-full font-bold text-slate-700 mb-4 border-2 border-slate-300 h-12 rounded-xl px-4"
                        value={seciliModel ? (seciliModel.id || '') : ''}
                        onChange={(e) => {
                            const secili = teknikFoyler.find(m => m.id === e.target.value);
                            setSeciliModel(secili || null);
                            if (secili) setUretimAdeti(secili.quantity || '');
                        }}>
                        <option value="">--- {isAR ? 'اختر أمر الإنتاج' : 'Üretim Emri Seçin'} ---</option>
                        {teknikFoyler.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.b1_model_taslaklari?.model_kodu || 'BİLİNMİYOR'} — ADET: {m.quantity} ({m.order_code})
                            </option>
                        ))}
                    </select>

                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase text-orange-600">Üretim Adedi (V2 Bant Adedi)</label>
                    <input type="number" className="form-input w-full font-bold text-orange-600 mb-6 border-2 border-orange-200 h-12 rounded-xl px-4" placeholder="Üretime Başlanacak Adet" value={uretimAdeti} onChange={e => setUretimAdeti(e.target.value)} />

                    <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 relative">
                        <span className="absolute -top-3 left-4 bg-red-600 text-white text-sm px-2 py-1 font-black rounded uppercase tracking-wider">Mecburi İşlem</span>
                        <h3 className="font-black text-slate-800 mb-2 flex items-center gap-2"><Video className="text-red-500" /> KENDİ MODELHANEMİZDE İLK DİKİM VİDEOSU</h3>
                        <p className="text-xs text-gray-600 font-medium mb-4">"Böyle anladım" yalanını bitirmek için, ilk numune atölyemizde VİDEO eşliğinde dikilir ve fasona izlemesi şart koşulur.</p>

                        <div className={`h-32 border-4 border-dashed rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${videoKayitAktif ? 'border-red-500 bg-red-50 shadow-inner' : 'border-slate-300 hover:border-slate-400 bg-white'}`}
                            onClick={() => setVideoKayitAktif(!videoKayitAktif)}>
                            {videoKayitAktif ? (
                                <div className="flex flex-col items-center">
                                    <div className="flex animate-pulse items-center gap-2 mb-2">
                                        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                        <span className="font-black text-red-600">KAMERA KAYITTA... (TIKLA DURDUR)</span>
                                    </div>
                                </div>
                            ) : (
                                <span className="font-black text-slate-500 flex items-center gap-2"><Camera /> KAMERAYI BAŞLATMAK İÇİN TIKLA</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf: Fasona gidecek iş sırası */}
                <div className={`border-${isAR ? 'r' : 'l'}-2 p${isAR ? 'r' : 'l'}-8`}>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">{isAR ? '2. تحديد العمليات التفاعلية (المهام الفرعية)' : '2. Dinamik İşlemleri (Alt Görevleri) Belirle'}</label>
                    <p className="text-xs text-gray-500 font-medium mb-4">{isAR ? 'هذا هو القالب المقرر. لا يُسمح بإجراء أعمال خارج القائمة.' : 'Seri üretime/fasona gidecek şablon budur. Bu liste dışı hiçbir iş yapılamaz veya iddia edilemez.'}</p>

                    <div className="flex gap-2 mb-4 bg-slate-100 p-2 rounded-lg items-center">
                        <input maxLength={150} type="text" className="form-input flex-1 font-bold p-2 rounded-lg border-slate-300 border focus:ring-2 focus:ring-emerald-500 outline-none" placeholder={isAR ? 'مثال: الطباعة أو التطريز' : 'Örn: Yaka İlikleme veya Baskı'} value={yeniAdim.islem_adi} onChange={e => setYeniAdim({ ...yeniAdim, islem_adi: e.target.value })} />
                        <input type="number" className="form-input w-24 text-center font-bold text-orange-600 p-2 rounded-lg border-orange-300 border focus:ring-2 focus:ring-orange-500 outline-none" placeholder={isAR ? 'دقيقة' : 'Tahmini Dk'} value={yeniAdim.ideal_sure_dk} onChange={e => setYeniAdim({ ...yeniAdim, ideal_sure_dk: e.target.value })} />
                        <button onClick={adimEkle} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-black uppercase text-sm h-full transition">{isAR ? 'أضف' : 'Ekle'}</button>
                    </div>

                    <div className="h-48 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-2 mb-6">
                        {islemAdimlari.length === 0 && <p className="text-center text-gray-400 text-sm font-bold mt-10">{isAR ? 'لم تتم إضافة خطوات للإنتاج بعد' : 'Henüz fasona verilecek bir işlem sırası eklenmedi.'}</p>}
                        {islemAdimlari.map((a, i) => (
                            <div key={a.id} className="flex justify-between items-center border border-slate-200 p-2 text-sm bg-white shadow-sm mb-2 rounded transition hover:border-slate-300 hover:shadow">
                                <span className="font-bold text-slate-700"><span className={`bg-slate-800 text-white px-2 py-1 rounded m${isAR ? 'l' : 'r'}-2 text-sm`}>{isAR ? `خطوة` : `ADIM`} {i + 1}</span>{a.islem_adi}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-orange-600 font-black">{a.ideal_sure_dk} {isAR ? 'دقيقة' : 'dk limit'}</span>
                                    <button onClick={() => adimSil(a.id)} className="text-red-400 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded transition"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={uretimBandiVeyaFasonaFirlat} disabled={loading} className="w-full bg-slate-800 text-emerald-400 border-b-4 border-slate-950 font-black text-lg py-5 rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-wait active:border-b-0 active:translate-y-1">
                        <PlaySquare size={24} /> {isAR ? 'تأكيد وإرسال إلى خط الإنتاج!' : 'ONAYLA VE SERİ ÜRETİME / FASONA YÜKLE!'}
                    </button>
                </div>
            </div>
        </div>
    );
}
