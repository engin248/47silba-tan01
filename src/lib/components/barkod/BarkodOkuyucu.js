'use client';
import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import SilBastanModal from '../ui/SilBastanModal';
import { Camera, XCircle } from 'lucide-react';

export default function BarkodOkuyucu({ acik, onClose, onOkundu }) {
    const [okundu, setOkundu] = useState(false);

    useEffect(() => {
        if (!acik) {
            setOkundu(false);
            return;
        }

        // Barkod okutulduğunda sürekli taramayı durdurmak için ufak bir bekleme
        let scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
            /* verbose= */ false
        );

        scanner.render((decodedText) => {
            if (!okundu) {
                setOkundu(true);
                scanner.clear();
                onOkundu(decodedText);
            }
        }, (errorMessage) => {
            // Sürekli okuma denediği için hata basar, görmezden gel
        });

        return () => {
            scanner.clear().catch(error => console.error("Scanner temizlenemedi", error));
        };
    }, [acik, okundu, onOkundu]);

    return (
        <SilBastanModal acik={acik} onClose={onClose} title="📷 Barkod / QR Tarama Modu">
            <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                <p style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                    Kumaş veya İrsaliye üzerindeki QR kodu kameraya gösterin. Sistem anında tanıyacaktır.
                </p>
                <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', border: '3px solid #10b981', borderRadius: '12px', overflow: 'hidden' }}></div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 20px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                        <XCircle size={16} /> İptal Et
                    </button>
                </div>
            </div>
        </SilBastanModal>
    );
}
