import React from 'react';

// KOD PARÇALAMASI (Componentization) Altyapısı - 1
export default function SilBastanModal({ acik, onClose, title, children }) {
    // KÖR NOKTA: Modal açıkken arka planın kaymasını (Scroll) engelle (Body Kilit)
    React.useEffect(() => {
        if (acik) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [acik]);

    if (!acik) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            style={{
                position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)'
            }}>
            <div className="responsive-modal-box" style={{
                background: '#1e293b',
                width: '100%',
                maxWidth: 500,
                borderRadius: '16px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 id="modal-title" style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 800 }}>{title}</h3>
                    <button onClick={onClose} style={{
                        background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171',
                        width: 32, height: 32, borderRadius: '8px', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'all 0.2s'
                    }}>✕</button>
                </div>
                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
            {/* Modal Responsive Style */}
            <style>{`
                @media (max-width: 480px) {
                    .responsive-modal-box {
                        max-width: 100% !important;
                        height: 100% !important;
                        max-height: 100vh !important;
                        border-radius: 0px !important;
                        border: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
