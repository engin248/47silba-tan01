"use client";
import { useState, useEffect, useRef } from 'react';

// Emir Komuta Zincirindeki Askeri Telsiz Arayüzü
export default function AskeriTelsiz({ odaIsmi }) {
    const [mesajlar, setMesajlar] = useState([]);
    const [yeniMesaj, setYeniMesaj] = useState('');
    const [hedefSecim, setHedefSecim] = useState('KARARGAH'); // Varsayılan hedef
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    const Rütbeler = ['KARARGAH', 'ALBAY', 'BASMIMAR', 'MUFETTIS'];

    const mesajlariCek = async () => {
        try {
            const res = await fetch(`/api/haberlesme/oku?oda=${odaIsmi}`);
            if (res.ok) {
                const data = await res.json();
                if (data.mesajlar) setMesajlar(data.mesajlar);
            }
        } catch (e) {
            console.error("Telsiz Bağlantı Hatası:", e);
        }
    };

    // Her 5 saniyede bir yeni mesajları kriptodan çözüp yeniler
    useEffect(() => {
        mesajlariCek();
        const interval = setInterval(mesajlariCek, 5000);
        return () => clearInterval(interval);
    }, [odaIsmi]);

    // Otomatik aşağı kaydırma
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [mesajlar]);

    const mesajGonder = async () => {
        if (!yeniMesaj.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/haberlesme/gonder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gonderen_rutbe: odaIsmi,
                    hedef_oda: hedefSecim,
                    mesaj_metni: yeniMesaj
                })
            });
            if (res.ok) {
                setYeniMesaj('');
                mesajlariCek();
            } else {
                alert("Şifreli Telsiz Bağlantısı Reddedildi.");
            }
        } catch (e) {
            alert("İletişim koptu.");
        }
        setLoading(false);
    };

    return (
        <div className="w-[340px] h-[450px] bg-slate-900 border-2 border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden font-mono text-xs">
            {/* Telsiz Üst Bar */}
            <div className="bg-slate-800 p-2 border-b border-slate-700 flex justify-between items-center text-slate-300">
                <span className="font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    {odaIsmi} TELSİZİ
                </span>
                <span className="text-[10px] opacity-50">AES-256 GCM ŞİFRELİ</span>
            </div>

            {/* Mesaj Ekranı */}
            <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto bg-[#0a0f18] space-y-3">
                {mesajlar.length === 0 ? (
                    <div className="text-center text-slate-600 mt-10">Kriptolu Bağlantı Bekleniyor...</div>
                ) : (
                    mesajlar.map((msg, i) => {
                        const benMiyim = msg.gonderen === odaIsmi;
                        return (
                            <div key={i} className={`flex flex-col ${benMiyim ? 'items-end' : 'items-start'}`}>
                                <div className="text-[9px] text-slate-500 mb-1 flex gap-2">
                                    <span>{msg.tarih}</span>
                                    {!benMiyim && <span className="text-amber-500 font-bold">{msg.gonderen} {'>'} </span>}
                                    {benMiyim && <span>{'->'} {msg.hedef}</span>}
                                </div>
                                <div className={`px-3 py-1.5 rounded-md max-w-[85%] break-words ${benMiyim ? 'bg-emerald-800/80 text-emerald-100 border border-emerald-700/50' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}>
                                    {msg.metin}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Gönderim Alanı */}
            <div className="p-2 bg-slate-800 border-t border-slate-700 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-400">
                    <span>Hedef:</span>
                    <select
                        className="bg-slate-900 border border-slate-700 rounded text-slate-300 p-1 flex-1 outline-none"
                        value={hedefSecim}
                        onChange={e => setHedefSecim(e.target.value)}
                    >
                        {Rütbeler.filter(r => r !== odaIsmi).map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Emir yazın..."
                        className="bg-slate-900 border border-slate-700 text-white flex-1 px-2 py-1 rounded outline-none w-full"
                        value={yeniMesaj}
                        onChange={(e) => setYeniMesaj(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && mesajGonder()}
                        disabled={loading}
                    />
                    <button
                        onClick={mesajGonder}
                        disabled={loading}
                        className="bg-emerald-700 hover:bg-emerald-600 px-3 py-1 rounded text-white font-bold transition-colors"
                    >
                        ILETI
                    </button>
                </div>
            </div>
        </div>
    );
}
