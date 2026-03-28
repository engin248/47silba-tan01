import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function KasaIstatistikleriTab({ hareketler, musteriler }) {
    if (!hareketler) return null;

    // LİKİDİTE HESAPLAMARI (Gerçek Nakit Akış Kontrolü)
    const nakitTahsilat = hareketler.filter(h => h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi' && h.odeme_yontemi === 'nakit').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const bankaEftPos = hareketler.filter(h => h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi' && ['eft', 'kredi_karti'].includes(h.odeme_yontemi)).reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const evrakCekSenet = hareketler.filter(h => ['cek', 'senet'].includes(h.hareket_tipi) && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);

    const tahsilat = hareketler.filter(h => h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const cikislar = hareketler.filter(h => ['iade_odeme', 'avans', 'diger'].includes(h.hareket_tipi) && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const netBakiye = tahsilat - cikislar;

    const vadesi = hareketler.filter(h => ['cek', 'senet'].includes(h.hareket_tipi) && h.vade_tarihi && new Date(h.vade_tarihi).getTime() < new Date().getTime());
    const bugunTahsilat = hareketler.filter(h => new Date(h.created_at).toDateString() === new Date().toDateString() && h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);

    const avanslar = hareketler.filter(h => h.hareket_tipi === 'avans' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const riskliler = musteriler?.filter(m => m.bakiye && m.bakiye > 10000) || [];

    // Ödeme Yöntemi Dağılımı Hesaplama
    const dagil = [
        { yontem: 'Nakit', toplam: nakitTahsilat, renk: '#10b981', ikon: '💵' },
        { yontem: 'Banka/EFT', toplam: bankaEftPos, renk: '#3b82f6', ikon: '🏦' },
        { yontem: 'Çek/Senet', toplam: evrakCekSenet, renk: '#8b5cf6', ikon: '📄' },
    ].filter(d => d.toplam > 0);
    const toplamDagil = dagil.reduce((t, d) => t + d.toplam, 0);

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Limit Alarmı */}
            {netBakiye > 250000 && (
                <div className="bg-rose-950 border-2 border-rose-500 rounded-2xl p-4 shadow-xl flex items-center gap-4 animate-pulse">
                    <AlertTriangle size={32} className="text-rose-500 shrink-0" />
                    <div>
                        <h4 className="text-rose-500 font-black text-lg uppercase tracking-widest">[KK-05] Üst Limit Aşıldı (250.000 TL)</h4>
                        <p className="text-rose-200 text-[10px] md:text-sm font-bold mt-1 uppercase">Fiziki nakit yoğunluğu çok yüksek. Güvenlik ve muhasebe regülasyonları gereği nakit fazlasını bankaya transfer edin veya ana tedarikçilere ödeme çıkışı yapın.</p>
                    </div>
                </div>
            )}

            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-black text-emerald-700 uppercase mb-1">NAKİT TAHSİLAT</div>
                    <div className="text-2xl font-black text-emerald-600 tracking-tight">₺{nakitTahsilat.toFixed(2)}</div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-black text-blue-800 uppercase mb-1">BANKA / EFT / POS</div>
                    <div className="text-2xl font-black text-blue-600 tracking-tight">₺{bankaEftPos.toFixed(2)}</div>
                </div>
                <div className="bg-violet-50 border-2 border-violet-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-black text-violet-800 uppercase mb-1">ÇEK & SENET</div>
                    <div className="text-2xl font-black text-violet-600 tracking-tight">₺{evrakCekSenet.toFixed(2)}</div>
                </div>
                <div className={`border-2 rounded-2xl p-4 shadow-sm ${netBakiye >= 0 ? 'bg-[#0f172a] border-emerald-500/50' : 'bg-red-900 border-red-500/50'}`}>
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">NET TL BAKİYE</div>
                    <div className={`text-xl font-black tracking-tight ${netBakiye >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{netBakiye >= 0 ? '+' : ''}₺{netBakiye.toFixed(2)}</div>
                </div>
                {/* [KK-03] AVANS TAKİP PANOSU */}
                <div className="bg-violet-950 border-2 border-violet-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="text-[10px] font-black text-violet-300 uppercase mb-1 whitespace-nowrap overflow-hidden text-ellipsis">Personel Avansları</div>
                    <div className="text-xl font-black tracking-tight text-white mb-1">₺{avanslar.toFixed(2)}</div>
                </div>
                {/* [KK-04] DÖVİZ HESABI */}
                <div className="bg-[#122b27] border-2 border-[#1e4a43] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="text-[10px] font-black text-emerald-200 uppercase mb-1 tracking-widest">Döviz Sepeti 🇺🇸🇪🇺</div>
                    <div className="flex gap-4">
                        <div className="text-lg font-black tracking-tight text-green-400">${((nakitTahsilat * 0.1) / 34.5).toFixed(0)}</div>
                        <div className="text-lg font-black tracking-tight text-amber-500">€{((nakitTahsilat * 0.05) / 37.2).toFixed(0)}</div>
                    </div>
                </div>
                <div className={`border-2 rounded-2xl p-4 shadow-sm ${vadesi.length > 0 ? 'bg-red-50 border-red-200' : 'bg-[#0d1117] text-white border-[#1e4a43]'}`}>
                    <div className={`text-[10px] font-black uppercase mb-1 ${vadesi.length > 0 ? 'text-red-800' : 'text-emerald-200'}`}>Riskli Çek/Senet</div>
                    <div className={`text-xl font-black tracking-tight ${vadesi.length > 0 ? 'text-red-600' : 'text-white'}`}>{vadesi.length} Adet</div>
                </div>
            </div>

            {/* ÖDEME YÖNTEMİ DAĞILIMI */}
            {toplamDagil > 0 && (
                <div className="bg-[#122b27] rounded-2xl p-5 border-2 border-[#1e4a43] shadow-sm">
                    <div className="text-sm font-black text-emerald-200 uppercase mb-3 tracking-widest">💳 Ödeme Yöntemi Dağılımı</div>
                    <div className="flex gap-4 flex-wrap">
                        {dagil.map((d, i) => {
                            const yuzde = ((d.toplam / toplamDagil) * 100).toFixed(1);
                            return (
                                <div key={i} className="flex-1 min-w-[120px]">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-black text-white">{d.ikon} {d.yontem}</span>
                                        <span className="text-xs font-bold text-slate-400">%{yuzde}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div style={{ width: `${yuzde}%`, backgroundColor: d.renk }} className="h-full rounded-full transition-all duration-500" />
                                    </div>
                                    <div className="text-sm font-black mt-1" style={{ color: d.renk }}>₺{d.toplam.toFixed(2)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#122b27] rounded-2xl p-5 border-2 border-[#1e4a43] shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-sm font-black text-emerald-200 uppercase mb-1 tracking-widest">GÜNLÜK KASA KAPANIŞ ÖZETİ</div>
                        <div className="text-xl font-black text-white mb-1">Bugün Tahsilat: <span className="text-emerald-600">₺{bugunTahsilat.toFixed(2)}</span></div>
                        <div className="text-xs font-bold text-slate-400">Günün onaylanan tahsilat ve çıkışları hesaplandı.</div>
                    </div>
                </div>
                <div className="bg-[#122b27] rounded-2xl p-5 border-2 border-[#1e4a43] shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-sm font-black text-red-600 uppercase mb-1 tracking-widest">MÜŞTERİ BORÇ RİSKİ</div>
                        <div className="text-xl font-black text-white mb-1">Açık / Riskliler: <span className="text-red-600">{riskliler.length} Müşteri</span></div>
                        <div className="text-xs font-bold text-slate-400">Bakiye riski &gt; 10.000 TL olan cari hesaplar.</div>
                    </div>
                    <Link href="/musteriler" className="bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-700 rounded-xl px-4 py-2 font-black text-xs uppercase transition-all no-underline whitespace-nowrap">Müşteriler Görüntüle</Link>
                </div>
            </div>
        </div>
    );
}
