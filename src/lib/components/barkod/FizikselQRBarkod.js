'use client';
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Fason Atölyeye giden İrsaliyede veya Kumaş Kesim Kartında basılan FİZİKSEL DÜNYA QR'I
export default function FizikselQRBarkod({ veriKodu, baslik = "Kumaş Barkodu", aciklama = "" }) {

    const fizikselYazdir = () => {
        // QR Kodun SVG datasını HTML içine gömmek için çekiyoruz
        const svgEl = document.getElementById('lokal-qr-el');
        const svgSource = new XMLSerializer().serializeToString(svgEl);

        const pencere = window.open('', '_blank');
        pencere.document.write(`
            <html>
                <head>
                    <title>47 SİL BAŞTAN FİZİKSEL ETİKET - ${baslik}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; color: #000; }
                        h2 { font-size: 1.5rem; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
                        h3 { font-size: 1.2rem; color: #333; margin-bottom: 15px; }
                        img { margin: 20px 0; border: 4px solid #000; padding: 10px; border-radius: 8px; }
                        .veri { font-size: 1.4rem; font-weight: 900; letter-spacing: 3px; font-family: monospace; background: #f0f0f0; padding: 10px 20px; border-radius: 6px; }
                        .alt { font-size: 0.9rem; margin-top: 15px; color: #666; }
                    </style>
                </head>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="font-size: 2.5rem; margin: 0; padding: 0; letter-spacing: 4px; border-bottom: 4px solid #000; display: inline-block;">THE ORDER</h1>
                        <h2 style="font-size: 1.2rem; margin: 5px 0 0 0; letter-spacing: 6px; color: #555;">47 NİZAM</h2>
                    </div>
                    <h3>${baslik}</h3>
                    <div style="margin: 20px 0; border: 4px solid #000; padding: 10px; border-radius: 8px; display: inline-block;">
                        ${svgSource}
                    </div>
                    <div class="veri">${veriKodu}</div>
                    <div class="alt">${aciklama}</div>
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        pencere.document.close();
    };

    return (
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#1e293b' }}>{baslik}</h4>
            <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <QRCodeSVG id="lokal-qr-el" value={veriKodu} size={150} level="M" />
            </div>
            <p style={{ margin: '10px 0', fontSize: '1rem', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{veriKodu}</p>
            <button onClick={fizikselYazdir} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', width: '100%', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = '#1e293b'}
                onMouseOut={(e) => e.target.style.background = '#0f172a'}
            >
                🖨️ Etiketi Yazdır
            </button>
        </div>
    );
}
