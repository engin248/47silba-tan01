'use client';
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, TerminalSquare } from 'lucide-react';

export default function VoiceCommandTerminal({ onSesliKomutGonder }) {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let recognition = null;
        if (typeof window !== 'undefined') {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRec) {
                recognition = new SpeechRec();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'tr-TR';

                recognition.onresult = (event) => {
                    let text = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        text += event.results[i][0].transcript;
                    }
                    setTranscript(text);
                };

                recognition.onerror = (e) => {
                    if (e.error !== 'no-speech') setError('Mikrofon/Ses hatası: ' + e.error);
                };

                recognition.onend = () => {
                    if (listening && recognition) {
                        try { recognition.start(); } catch (e) { }
                    }
                };
            } else {
                setError('Tarayıcı Sesli Komut desteklemiyor (Chrome/Edge kullanın).');
            }
        }

        if (listening && recognition) {
            setError('');
            setTranscript('');
            try { recognition.start(); } catch (e) { }
        } else if (!listening && recognition) {
            try { recognition.stop(); } catch (e) { }
        }

        return () => {
            if (recognition) recognition.stop();
        };
    }, [listening]);

    const handleGonder = () => {
        if (transcript.trim().length > 2) {
            onSesliKomutGonder(transcript.trim());
            setTranscript('');
            setListening(false);
        }
    };

    return (
        <div className="bg-[#030604] p-1.5 flex items-center justify-between gap-1.5 relative overflow-hidden w-full h-10 z-20 shadow-[0_0_15px_rgba(16,185,129,0.15)] border-2 border-[#059669]">
            {listening && <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ef4444] shadow-[0_0_10px_#ef4444] animate-[pulse_1s_infinite]" />}

            <button onClick={() => setListening(!listening)} className={`outline-none cursor-pointer flex-none w-20 flex items-center justify-center gap-1.5 border transition-all h-full ${listening ? 'border-[#ef4444] bg-[#ef4444]/20 text-[#fca5a5]' : 'border-[#059669] bg-[#051008] text-[#34d399] hover:bg-[#10b981]/20 hover:text-white'}`}>
                {listening ? <Mic size={14} className="animate-pulse" /> : <MicOff size={14} />}
                <span className="text-[10px] font-black tracking-widest uppercase">{listening ? 'SES: ON' : 'SES: OFF'}</span>
            </button>

            <div className="flex-1 h-full border-2 border-[#059669]/60 bg-[#020503] px-2 overflow-hidden flex items-center relative gap-2">
                {error && <span className="text-[9px] text-[#ef4444] font-black truncate">{error}</span>}
                {!transcript && !listening && !error && <span className="text-[9px] text-[#10b981]/60 font-mono tracking-widest font-bold">AKIS BEKLENIYOR.</span>}
                {!transcript && listening && !error && <span className="text-[9px] text-[#ef4444] animate-pulse font-mono tracking-[0.2em] bg-[#ef4444]/10 px-1 font-black">SINYAL ALINIYOR...</span>}
                <span className="text-xs text-[#6ee7b7] font-mono leading-tight truncate font-black">{transcript}</span>
            </div>

            <button
                onClick={handleGonder} disabled={!transcript.trim()}
                className={`outline-none border-none flex-none h-full px-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${transcript.trim() ? 'bg-[#10b981] text-[#030604] shadow-[0_0_12px_rgba(16,185,129,0.8)] cursor-pointer hover:bg-[#34d399] hover:text-black' : 'border-2 border-[#059669]/40 text-[#059669] cursor-not-allowed bg-transparent'}`}
            >
                <TerminalSquare size={12} /> ILET
            </button>
        </div>
    );
}
