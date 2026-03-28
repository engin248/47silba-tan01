import { Receipt, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';

export default function MaliyetMuhasebeTab({
    isAR, onayBekleyenIsler, islemdeId, finaleOnayVerMuhasebeyeYaz, hataliMalReddet
}) {
    return (
        <div className="animate-fade-in card shadow-xl border-t-8 border-purple-700 bg-slate-50 p-6 rounded-2xl">
            <div className="flex items-center gap-4 border-b border-purple-200 pb-5 mb-6">
                <div className="p-4 bg-purple-700 text-white rounded-xl shadow-lg"><Receipt size={32} /></div>
                <div>
                    <h2 className="text-3xl font-black text-purple-900 tracking-tight">{isAR ? 'شباك الإغلاق / تقرير المحاسبة والتحليل' : 'KAPANIŞ GİŞESİ / MUHASEBE VE ANALİZ RAPORU'}</h2>
                    <p className="text-sm text-purple-700 font-bold mt-1">{isAR ? 'تتحول دقائق الإنتاج إلى أموال. تُفحص الأخطاء، وترسل الفاتورة للمحاسبة.' : 'Üretimden çıkan malzemenin harcadığı dakikalar paraya çevrilir. Hatalar kontrol edilir, son onay verilirse finans merkezine faturası yollanır.'}</p>
                </div>
            </div>

            <div className="space-y-6">
                {onayBekleyenIsler.length === 0 && <div className="p-12 text-center text-purple-400 bg-white rounded-xl border-2 border-dashed border-purple-200 font-black text-lg shadow-sm">{isAR ? 'لا يوجد إنتاج متسلسل ينتظر الموافقة والمحاسبة.' : 'Gişede onay ve maliyet hesabı bekleyen seri üretim işi yok.'}</div>}

                {onayBekleyenIsler.map(is => (
                    <div key={is.id} className="bg-white border-2 border-purple-300 rounded-2xl p-6 shadow-md relative overflow-hidden transition-all hover:shadow-lg hover:border-purple-400">
                        <div className={`absolute top-0 right-0 bg-yellow-400 text-slate-800 px-5 py-1 text-sm font-black rounded-b${isAR ? 'r' : 'l'}-xl uppercase tracking-widest shadow-sm`}>{isAR ? 'بانتظار موافقة المفتش' : 'Müfettiş Onayı Bekliyor'}</div>

                        <div className="flex justify-between items-start mb-6 border-b pb-4">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase mb-1">{is.production_orders?.b1_model_taslaklari?.model_kodu || is.production_orders?.b1_model_taslaklari?.model_adi || 'Gizli Model'}</h3>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">SİPARİŞ KODU: {is.production_orders?.order_code} | MİKTAR: <span className="text-slate-700">{is.production_orders?.quantity} ADET</span></p>
                            </div>
                        </div>

                        {/* Maliyet ve Analiz Raporu Tablosu */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center shadow-inner">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">{isAR ? 'المدة المحسوبة' : 'Kronometre Fişi'}</span>
                                <div className="font-black text-3xl text-slate-800 tracking-tight">42 <span className="text-base text-gray-400 tracking-normal">{isAR ? 'دقيقة/قطعة' : 'Dk'}</span></div>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center shadow-inner">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">{isAR ? 'معدل جودة المعلم' : 'Parti Kusursuzluk'}</span>
                                <div className="font-black text-3xl text-emerald-600 flex items-center justify-center gap-1 tracking-tight">
                                    <ShieldCheck size={28} /> %99.2
                                </div>
                            </div>
                            <div className="bg-purple-50 border-2 border-purple-200 p-5 rounded-xl text-center shadow-sm relative overflow-hidden">
                                <DollarSign className="absolute -right-4 -bottom-4 text-purple-200 opacity-50" size={100} />
                                <span className="text-xs font-black text-purple-700 uppercase tracking-widest block mb-1 relative z-10">{isAR ? 'التكلفة الإجمالية المؤقتة' : 'Hesaplanan Hakediş'}</span>
                                <div className="font-black text-3xl text-purple-800 relative z-10 flex items-center justify-center tracking-tight">
                                    <span className="text-xl mr-1">₺</span> 168.00
                                </div>
                                <div className="text-[10px] text-purple-500 font-bold uppercase relative z-10 mt-1">42 Dk × 4₺ (Dk/Birim)</div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 border-t pt-5">
                            <div className="flex-1">
                                <h4 className="font-black text-slate-700 mb-2 uppercase text-xs tracking-widest">{isAR ? 'إجراءات المفتش الحساسة' : 'MÜFETTİŞ (KALİTE VE MALİ ONAY) İŞLEMLERİ'}</h4>
                                <p className="text-xs text-slate-500 font-bold mb-4">{isAR ? 'اللون الأحمر: عطل, الأخضر: حوّل الأموال إلى الخزينة!' : 'Bu onay verildiği an, ustaya hak edişi yazılır ve yukarıdaki para MUHASEBE kasasından resmileşerek çıkar.'}</p>
                                <div className="flex gap-3">
                                    <button
                                        disabled={islemdeId === is.id}
                                        onClick={() => finaleOnayVerMuhasebeyeYaz(is)}
                                        className={`flex-1 flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] ${islemdeId === is.id ? 'opacity-50 cursor-wait' : ''}`}>
                                        <CheckCircle2 size={24} /> {islemdeId === is.id ? '...' : (isAR ? 'تأكيد الحساب والخزينة' : 'ONAYLA VE MUHASEBEYE BİLDİR')}
                                    </button>
                                    <button
                                        disabled={islemdeId === is.id}
                                        onClick={() => hataliMalReddet(is)}
                                        className={`px-6 flex flex-col items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 font-black rounded-xl transition-all active:scale-[0.98] ${islemdeId === is.id ? 'opacity-50 cursor-wait' : ''}`}>
                                        <span className="text-sm tracking-wider uppercase">{islemdeId === is.id ? '...' : (isAR ? 'رفض' : 'REDDET')}</span>
                                        <span className="text-[10px] uppercase">{isAR ? 'إعادة الخياطة' : '(Tamire Yolla)'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
