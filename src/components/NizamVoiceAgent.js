// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NizamVoiceAgent() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('NİZAM Sesli Asistan. Bekleniyor...');
    const router = useRouter();
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.lang = 'tr-TR';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                recognition.onresult = (event) => {
                    const str = event.results[0][0].transcript.toLowerCase();
                    setTranscript(str);
                    processCommand(str);
                };

                recognition.onspeechend = () => {
                    setIsListening(false);
                    recognition.stop();
                };

                recognition.onerror = (event) => {
                    console.error('SES HATASI:', event.error);
                    setFeedback('Hata: Ses anlaşılamadı (' + event.error + ')');
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            } else {
                setFeedback('Tarayıcınız Sesli Asistanı Desteklemiyor.');
            }
        }
    }, []);

    const toggleListen = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            setFeedback('Asistan Durduruldu.');
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                setFeedback('Dinleniyor... Konuşun (örn: "Karargaha git", "Siparişleri aç")');
                setTranscript('');
            } catch (err) {
                console.error('Başlatma hatası:', err);
                setIsListening(false);
            }
        }
    };

    const processCommand = (cmd) => {
        setFeedback(`Algılandı: "${cmd}"`);

        // Komut Analizi
        if (cmd.includes('karargah')) {
            router.push('/karargah');
            setTimeout(() => setFeedback('M0: Karargah komuta stiline geçildi.'), 1000);
        } else if (cmd.includes('yeni sipariş') || cmd.includes('sipariş aç') || cmd.includes('siparişler')) {
            router.push('/siparisler');
            setTimeout(() => setFeedback('[SI-04] Sipariş (M9) Modülü açıldı.'), 1000);
        } else if (cmd.includes('kasay') || cmd.includes('para') || cmd.includes('tahsilat')) {
            router.push('/kasa');
            setTimeout(() => setFeedback('[KK-06] Tahsilat kasası (M8) hazır.'), 1000);
        } else if (cmd.includes('üretim') || cmd.includes('banda gönder')) {
            router.push('/imalat');
            setTimeout(() => setFeedback('M5 İmalat ve Band ekranına geçiliyor.'), 1000);
        } else if (cmd.includes('şablon') || cmd.includes('kalıp')) {
            router.push('/kalip');
            setTimeout(() => setFeedback('M3 Kalıphane açılıyor.'), 1000);
        } else if (cmd.includes('arge') || cmd.includes('ajan')) {
            router.push('/arge');
            setTimeout(() => setFeedback('M1: İstihbarat ve AR-GE Ekranı açıldı.'), 1000);
        } else if (cmd.includes('malzeme') || cmd.includes('kumaş')) {
            router.push('/malzeme');
            setTimeout(() => setFeedback('M2 Kumaş Deposu hazır.'), 1000);
        } else {
            setTimeout(() => setFeedback(`Komut eşleşmedi. Algılanan: ${cmd}`), 1000);
        }

        setIsListening(false);
    };

    if (!recognitionRef.current) return null; // Sunucuda veya desteksiz tarayıcıda render edilmez

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
            {/* Animasyonlu Bildirim Kutusu */}
            <div className={`transition-all duration-300 transform origin-bottom-right ${isListening || transcript ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} bg-[#161b22] border-2 border-[#30363d] p-3 rounded-2xl shadow-2xl flex flex-col gap-1 w-64`}>
                <span className="text-[10px] font-black text-[#8b949e] tracking-widest uppercase flex items-center gap-1">
                    <Command size={10} className="text-blue-500" /> NİZAM GÖLGE ASİSTAN
                </span>
                <span className="text-xs font-bold text-white leading-tight">
                    {feedback}
                </span>
                {isListening && (
                    <div className="flex justify-center mt-1">
                        <div className="flex gap-1 h-3 items-center">
                            <div className="w-1 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                            <div className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '450ms' }}></div>
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Float Buton */}
            <button
                onClick={toggleListen}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-4 outline-none
                    ${isListening
                        ? 'bg-red-500 text-white border-red-900/50 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-bounce'
                        : 'bg-emerald-600 text-white border-[#161b22] hover:bg-emerald-500 shadow-emerald-500/20'
                    }`}
                title="Sesli Komut Asistanı"
            >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
        </div>
    );
}
