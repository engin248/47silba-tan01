import { Activity, Clock, ShieldCheck, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import M6_KameraSayaci from '@/features/uretim/components/M6_KameraSayaci';

export default function UretimHattiTab({
    isAR, imalatGorunum, setImalatGorunum, sahadakiIsler, personeller, islemdeId, sahadakiIsiBaslat, sahadakiArizayiBildir, sahadakiIsiBitir
}) {
    return (
        <div className="animate-fade-in">
            {/* KANBAN TOGGLE */}
            <div className="flex justify-between mb-4 items-center">
                <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase flex items-center gap-2">
                    <Activity size={20} className="text-orange-500" /> ÜRETİM HATTI KONTROLÜ
                </h3>
                <button
                    onClick={() => setImalatGorunum(v => v === 'liste' ? 'kanban' : 'liste')}
                    className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md ${imalatGorunum === 'kanban' ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                    {imalatGorunum === 'kanban' ? (isAR ? '📋 عرض القائمة' : '📋 Liste Görünümü') : (isAR ? '📦 لوحة كانبان' : '📦 Kanban Board')}
                </button>
            </div>

            {/* IM-06 OEE DASHBOARD */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 mb-6 shadow-xl text-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black flex items-center gap-2 text-emerald-400 tracking-widest text-sm">
                        <Activity size={18} /> [IM-06] CANLI OEE (EKİPMAN & BANT VERİMLİLİĞİ)
                    </h3>
                    <span className="text-xs font-bold text-slate-400 tracking-wider">Dünya Standardı: %85</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 rounded-xl p-4 text-center border-b-4 border-blue-500">
                        <div className="text-slate-400 text-xs font-black mb-1 uppercase tracking-widest">Kullanılabilirlik (A)</div>
                        <div className="text-2xl font-black text-white font-mono">%94.5</div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 text-center border-b-4 border-amber-500">
                        <div className="text-slate-400 text-xs font-black mb-1 uppercase tracking-widest">Performans (P)</div>
                        <div className="text-2xl font-black text-white font-mono">
                            {sahadakiIsler.length > 0 ? (100 - (sahadakiIsler.filter(i => i.status === 'blocked_machine').length * 15)).toFixed(1) : '90.0'}%
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 text-center border-b-4 border-emerald-500">
                        <div className="text-slate-400 text-xs font-black mb-1 uppercase tracking-widest">Kalite Oranı (Q)</div>
                        <div className="text-2xl font-black text-white font-mono">%98.2</div>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-4 text-center border-b-4 border-purple-500 shadow-inner">
                        <div className="text-purple-400 text-[10px] font-black mb-1 uppercase tracking-widest">OEE SKORU (A × P × Q)</div>
                        <div className="text-3xl font-black text-purple-400 font-mono">
                            {sahadakiIsler.length > 0 ? (0.945 * (1 - (sahadakiIsler.filter(i => i.status === 'blocked_machine').length * 0.15)) * 0.982 * 100).toFixed(1) : '83.5'}%
                        </div>
                    </div>
                </div>
            </div>

            {/* OTONOM YAPAY ZEKA KAMERA TAKİBİ (İLERİYE ERTELENMEYEN ENTEGRASYON) */}
            <div className="mb-6">
                <M6_KameraSayaci />
            </div>

            {/* IM-02 & IM-04 OPERASYON BAZLI İZLEME VE QC GEÇİTLERİ (MOCKUP) */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 mb-6 shadow-xl text-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black flex items-center gap-2 text-blue-400 tracking-widest text-sm uppercase">
                        <ShieldCheck size={18} /> [IM-02] & [IM-04] ZORUNLU İSTASYON GEÇİŞLERİ VE QC BARKODLARI
                    </h3>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold uppercase transition">Toplu Pas Geç (Admin)</button>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full bg-[#122b27] border border-[#1e4a43] p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <div className="text-emerald-400 font-black text-xs uppercase mb-1 drop-shadow-md">İstasyon 1 / Operasyon</div>
                            <div className="text-white font-black text-[1.1rem]">🧵 DİKİŞ HATTI</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-400 mb-1">Geçen Ürün</div>
                            <div className="text-xl font-mono font-black text-emerald-400">1,250</div>
                        </div>
                    </div>
                    <div className="text-slate-500 font-black">➔</div>
                    <div className="flex-[1.5] w-full bg-[#1e1b4b] border-2 border-purple-500/50 p-4 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden">
                        <div className="absolute -right-6 top-2 bg-purple-600 text-[9px] font-black uppercase text-white px-8 py-1 rotate-45">QC-01 GEÇİDİ</div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-purple-300 font-black text-[10px] uppercase tracking-widest mb-1 drop-shadow-md flex gap-1 items-center"><ShieldCheck size={12} /> KALİTE KONTROL 1</div>
                                <div className="text-white font-black text-[1.1rem]">🔥 ÜTÜ / LEKE KONTROL</div>
                                <div className="text-[10px] text-purple-200 mt-1 opacity-80">(Reddedilen: 14 Adet — Fasona Döndü)</div>
                            </div>
                            <button className="bg-purple-600 hover:bg-purple-700 text-white font-black px-4 py-2 rounded-lg text-sm border-b-2 border-purple-800 active:border-b-0 active:translate-y-[2px] shadow-md transition">Bant Onayı</button>
                        </div>
                    </div>
                    <div className="text-slate-500 font-black">➔</div>
                    <div className="flex-[1.5] w-full bg-[#312e81] border-2 border-indigo-500/50 p-4 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.15)] relative overflow-hidden">
                        <div className="absolute -right-6 top-2 bg-indigo-600 text-[9px] font-black uppercase text-white px-8 py-1 rotate-45">QC-02 FİNAL</div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-indigo-300 font-black text-[10px] uppercase tracking-widest mb-1 drop-shadow-md flex gap-1 items-center"><CheckCircle2 size={12} /> FİNAL KONTROL</div>
                                <div className="text-white font-black text-[1.1rem]">📦 PAKET VE KOLİLEME</div>
                                <div className="text-[10px] text-indigo-200 mt-1 opacity-80">(Hazır: 1,236 Adet — Depoya Gidiyor)</div>
                            </div>
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-lg text-sm border-b-2 border-indigo-800 active:border-b-0 active:translate-y-[2px] shadow-md transition">Depoya Gönder</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KANBAN BOARD */}
            {imalatGorunum === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { key: 'assigned', label: isAR ? '📋 تم التعيين' : '📋 Atandı', renk: 'blue', border: 'border-blue-500/30', bg: 'bg-slate-50' },
                        { key: 'in_progress', label: isAR ? '⚙️ قيد الإنتاج' : '⚙️ Üretimde', renk: 'amber', border: 'border-amber-500/30', bg: 'bg-slate-50' },
                        { key: 'waiting_for_proof', label: isAR ? '🔍 قيد المراجعة' : '🔍 Onay Bekl.', renk: 'violet', border: 'border-violet-500/30', bg: 'bg-slate-50' },
                        { key: 'blocked_machine', label: isAR ? '🔴 عطل' : '🔴 Arıza', renk: 'rose', border: 'border-rose-500/30', bg: 'bg-slate-50' },
                    ].map(kolon => (
                        <div key={kolon.key} className={`${kolon.bg} border-2 ${kolon.border} rounded-2xl p-4 min-h-[220px]`}>
                            <div className="flex justify-between items-center mb-3">
                                <span className={`font-black text-sm text-${kolon.renk}-600`}>{kolon.label}</span>
                                <span className={`bg-${kolon.renk}-100 text-${kolon.renk}-700 font-bold text-xs px-2.5 py-1 rounded-lg`}>
                                    {sahadakiIsler.filter(i => i.status === kolon.key).length}
                                </span>
                            </div>
                            {sahadakiIsler.filter(i => i.status === kolon.key).map(is => (
                                <div key={is.id} className={`bg-white rounded-xl p-3 mb-2 shadow-sm border border-${kolon.renk}-100 transition hover:shadow-md`}>
                                    <div className="font-black text-xs text-slate-800">{is.production_orders?.order_code || (isAR ? 'الطلب' : 'Sipariş')}</div>
                                    <div className="text-sm font-bold text-slate-500 mb-2">{is.production_orders?.b1_model_taslaklari?.model_kodu || '—'}</div>

                                    {/* IM-05: Darboğaz Uyarı Rozeti */}
                                    {kolon.key === 'in_progress' && (() => {
                                        const nowUnix = new Date().getTime();
                                        const updatedUnix = new Date(is.updated_at || is.created_at).getTime();
                                        const sureDk = Math.floor((nowUnix - updatedUnix) / 60000);
                                        // 120 dakikayı geçenlere sistem darboğaz alarmı çalsın
                                        return sureDk > 120 ? (
                                            <div className="mb-3 bg-rose-100 border border-rose-300 text-rose-700 text-[10px] font-black uppercase px-2 py-1 rounded-full flex items-center justify-center gap-1 animate-pulse shadow-sm">
                                                <AlertTriangle size={12} /> DARBOĞAZ: {sureDk} Dk Gecikme
                                            </div>
                                        ) : (
                                            <div className="mb-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Clock size={10} /> {sureDk} DK SÜRÜYOR
                                            </div>
                                        );
                                    })()}

                                    {kolon.key === 'assigned' && (
                                        <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBaslat(is.id)} className={`mt-1 font-black text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg transition-colors w-full active:scale-95 ${islemdeId === is.id ? 'opacity-50 cursor-wait' : ''}`}>
                                            {islemdeId === is.id ? '...' : (isAR ? '▶ ابدأ' : '▶ Başlat')}
                                        </button>
                                    )}
                                    {kolon.key === 'in_progress' && (
                                        <div className="flex gap-2 mt-1">
                                            <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBitir(is.id)} className={`flex-1 font-black text-sm bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2 py-2 rounded-lg transition-colors active:scale-95 ${islemdeId === is.id ? 'opacity-50 cursor-wait' : ''}`}>
                                                {islemdeId === is.id ? '...' : (isAR ? '✓ إنهاء' : '✓ Bitir')}
                                            </button>
                                            <button disabled={islemdeId === is.id} onClick={() => sahadakiArizayiBildir(is.id)} className={`flex-1 font-black text-sm bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-2 py-2 rounded-lg transition-colors active:scale-95 ${islemdeId === is.id ? 'opacity-50 cursor-wait' : ''}`}>
                                                {islemdeId === is.id ? '...' : (isAR ? '⚠ عطل' : '⚠ Arıza')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {sahadakiIsler.filter(i => i.status === kolon.key).length === 0 && (
                                <div className="text-center p-4 text-slate-400 text-sm font-bold uppercase">{isAR ? 'فارغ' : 'Görev Yok'}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* LİSTE görünümü (eski grid) */}
            {imalatGorunum === 'liste' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* SAHA KRONOMETRE PANELI */}
                    <div className="card shadow-xl border-t-8 border-orange-500 bg-white p-6 rounded-2xl">
                        <div className="border-b pb-4 mb-4">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Activity className="text-orange-500" /> {isAR ? 'شاشة العامل في الموقع / الخط' : 'FASON / BANT İŞÇİSİ SAHA EKRANI'}</h2>
                            <p className="text-xs text-gray-500 font-bold mt-1">{isAR ? 'تظهر المهام هنا. يبدأ المعلم الميقاتية وينهي العمل...' : 'İşler buraya düşer. Usta saati başlatır, bitirince kanıtla kapatır. İp koptuğunda "Arıza" diyerek faturayı dükkana yıkar.'}</p>
                        </div>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {sahadakiIsler.length === 0 && <div className="p-8 text-center text-gray-400 font-bold border-2 border-dashed rounded-xl">{isAR ? 'لا يوجد ترتيب إنتاج مخصص' : 'Ustaya/Fasona atanmış bir üretim sırası yok.'}</div>}
                            {sahadakiIsler.map(is => (
                                <div key={is.id} className={`border-2 rounded-xl p-5 flex flex-col shadow-sm transition-all hover:shadow hover:-translate-y-1 ${is.status === 'in_progress' ? 'border-orange-400 bg-orange-50/50' : 'border-slate-200 bg-white'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-black text-lg text-slate-800 uppercase">[{isAR ? 'الرمز' : 'KOD'}: {is.production_orders?.order_code}]</h3>
                                            <p className="text-sm text-slate-600 font-bold mt-1">{isAR ? 'الطلب' : 'Sipariş'}: {is.production_orders?.b1_model_taslaklari?.model_kodu || (isAR ? 'نموذج مخفي' : 'Gizli Model')}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded font-black border uppercase">{is.status}</span>
                                            <span className="text-xs font-bold text-gray-500">{isAR ? 'الكمية' : 'Miktar'}: {is.production_orders?.quantity} {isAR ? 'قطعة' : 'Adet'}</span>
                                        </div>
                                    </div>

                                    {/* IM-05 LİSTE GÖRÜNÜMÜ DARBOĞAZ Rozeti */}
                                    {is.status === 'in_progress' && (() => {
                                        const nowUnix = new Date().getTime();
                                        const updatedUnix = new Date(is.updated_at || is.created_at).getTime();
                                        const sureDk = Math.floor((nowUnix - updatedUnix) / 60000);
                                        return sureDk > 120 ? (
                                            <div className="mb-4 bg-rose-100 border border-rose-300 text-rose-700 text-xs font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-2 animate-pulse w-fit">
                                                <AlertTriangle size={14} /> DARBOĞAZ: Bekleme Haddi Aşıldı ({sureDk} Dk)
                                            </div>
                                        ) : (
                                            <div className="mb-4 text-orange-600 bg-orange-100/50 text-[10px] font-black uppercase px-2 py-1 rounded-md w-fit flex items-center gap-1">
                                                <Clock size={12} /> Geçen Süre: {sureDk} Dk
                                            </div>
                                        );
                                    })()}

                                    {/* Operasyon Butonları */}
                                    <div className="flex flex-col gap-2 mt-2">
                                        {is.status === 'assigned' && (
                                            <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBaslat(is.id)} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black hover:bg-black focus:ring-4 focus:ring-slate-300 flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait">
                                                <Clock /> {islemdeId === is.id ? (isAR ? 'جاري المعالجة...' : 'İŞLEMDE...') : (isAR ? 'ابدأ العمل والميقاتية' : 'İŞE VE KRONOMETREYE BAŞLA')}
                                            </button>
                                        )}
                                        {is.status === 'in_progress' && (
                                            <div className="flex gap-2">
                                                <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBitir(is.id)} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 shadow-md transition-all active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-wait"><CheckCircle2 className="inline mr-1" /> {islemdeId === is.id ? '...' : (isAR ? 'انتهى العمل (أغلق)' : 'İŞ BİTTİ (KAPAT)')}</button>
                                                <button disabled={islemdeId === is.id} onClick={() => sahadakiArizayiBildir(is.id)} className="flex-1 border-2 border-red-500 text-red-600 py-4 rounded-xl font-black hover:bg-red-50 focus:ring-4 focus:ring-red-100 transition-all active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-wait"><AlertTriangle className="inline mr-1" /> {islemdeId === is.id ? '...' : (isAR ? 'الإبلاغ عن عطل (توقف)' : 'ARIZA BİLDİR (DUR)')}</button>
                                            </div>
                                        )}
                                        {is.status === 'blocked_machine' && (
                                            <div className="w-full bg-red-100 text-red-800 p-4 rounded-xl font-black text-center border-2 border-red-200 text-sm">
                                                {isAR ? '🔴 تم اكتشاف عطل - توقف العداد - بانتظار التدخل' : '🔴 ARIZA TESPİT EDİLDİ - SAYAÇ DURDU - MÜDAHALE BEKLENİYOR'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PERSONEL GİRDİSİ (LİYAKAT VE VİCDAN) PANELI */}
                    <div className="card shadow-xl border-t-8 border-indigo-500 bg-white p-6 rounded-2xl">
                        <div className="border-b pb-4 mb-4">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Users className="text-indigo-500" /> PERSONEL GİRDİLERİ (VİCDAN & HATA ORANI)</h2>
                            <p className="text-xs text-gray-500 font-bold mt-1">İşçinin ürettiği hatasız mal (FPY) skoru ve insan kaynakları müdahalesi buradadır.</p>
                        </div>

                        <div className="overflow-x-auto border rounded-xl shadow-inner bg-slate-50">
                            <table className="w-full text-left">
                                <thead className="bg-slate-200/50 border-b border-slate-300">
                                    <tr>
                                        <th className="p-4 font-black text-xs uppercase text-slate-600 tracking-wider">Sicil / Kullanıcı</th>
                                        <th className="p-4 font-black text-xs uppercase text-slate-600 tracking-wider text-center">FPY (Kusursuzluk %'si)</th>
                                        <th className="p-4 font-black text-xs uppercase text-slate-600 tracking-wider text-center">Sosyal Liyakat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {personeller.filter(p => !p.email?.includes('admin')).map(p => (
                                        <tr key={p.id} className="border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-black text-sm text-slate-800 truncate max-w-[150px]">{p.ad_soyad || p.full_name || 'Usta'}</div>
                                                <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">{p.gorev || p.unvan || '—'}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 font-black rounded text-sm shadow-sm inline-block min-w-[70px] ${(p.fp_yield || 0) >= 1.0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>% {Number((p.fp_yield || 0) * 100).toFixed(0)}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="font-black text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-md border border-indigo-100 min-w-[80px]">{p.social_points || 0} Puan</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {personeller.length === 0 && <tr><td colSpan={3} className="p-6 text-center font-bold text-gray-400">Personel verisi yok.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
