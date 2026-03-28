import { Database, TrendingUp, AlertTriangle, RefreshCw, Lock, UploadCloud } from 'lucide-react';

export default function DenetmenBuyukVeriTab() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '1.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 8px 32px rgba(49, 46, 129, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}><Database size={20} color="#a78bfa" /> Büyük Veri (Big Data) Öngörü ve Öğrenme Merkezi</h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#c7d2fe' }}>Geçmiş verileri analiz eder, anomalileri öğrenir ve anlık "Satranç Hamlesi" tarzı kararlar sunar.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '1rem' }}>

                    {/* 116. Kriter: İade Veri Öğrenmesi */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={14} /> Tüketici Reaksiyon Öğrenmesi</div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 8px 0', color: '#fca5a5' }}>Kırmızı Kumaş İade Analizi (Geçen Yıl)</h3>
                        <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>AI Öğrenme Modeli geçen sezonun verilerini işledi: Kırmızı renkli ceketlerdeki iade oranı <strong>%42</strong> daha yüksek tespit edildi. M1 Ar-Ge aşamasında kırmızı ceket tasarımlarının trend puanı otomatik düşürülüp uyarılacak.</p>
                        <div style={{ marginTop: 10, fontSize: '0.75rem', background: '#7f1d1d', color: '#fecaca', display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>Karar: Kırmızı renk ağırlığını %15'in altına çek.</div>
                    </div>

                    {/* 118. Kriter: Makine Öğrenme Grafiği (Hammadde) */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={14} /> Hammadde Fiyat Öğrenmesi</div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 8px 0', color: '#6ee7b7' }}>Zaman Serisi: İplik Enflasyon Modeli</h3>
                        <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>Son 3 yıllık Nisan ayı satın alma verileri incelendiğinde, bahar talebi yüzünden Toptancı Pamuk İplik fiyatlarında her Nisan ayında spesifik <strong>~%24</strong> şişme öngörülüyor.</p>
                        <div style={{ marginTop: 10, fontSize: '0.75rem', background: '#064e3b', color: '#a7f3d0', display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>Öneri: Mart ayında tedarik stoklarını %40 artırın.</div>
                    </div>

                    {/* 119. Kriter: Hata Öğrenmesi (Çevresel/Personel) */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> Ortam ve Verimlilik Öğrenimi</div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 8px 0', color: '#fde047' }}>Kış Aylarında Sabah Mesaisi Düşüşü</h3>
                        <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>08:30 - 09:30 arası Makine devir verileri analiz edildiğinde Aralık-Ocak aylarında günlük üretim hızının ilk saatte <strong>%18</strong> genlik kaybettiği Hata Öğrenmesiyle teyit edildi (Soğuk Etkisi).</p>
                        <div style={{ marginTop: 10, fontSize: '0.75rem', background: '#713f12', color: '#fef08a', display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>Otonom Eylem: Isıtıcı sistemini saat 07:45'te başlat.</div>
                    </div>

                    {/* 120. Kriter: Canlı Karar Destek Sistemi ("Satranç Hamlesi") */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={14} /> Canlı Karar Destek Sistemi</div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 8px 0', color: '#38bdf8' }}>Üretim Bandı Dengeleyici (Satranç Modülü)</h3>
                        <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>Sensör Verisi: Sağ Kesim bandında <strong>%92</strong> doluluk (darboğaz riski), sol Kalıp bandında <strong>%34</strong> boşta kalma süresi algılandı. Üretim senkronizasyonu tehlikede.</p>
                        <div style={{ marginTop: 10, fontSize: '0.75rem', background: '#0c4a6e', color: '#bae6fd', display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>Satranç Hamlesi: Sol banttan 3 kalıpçıyı, 2 saatliğine Sağ Kesime çekin.</div>
                    </div>
                </div>

                {/* 117. Kriter: Kapalı Devre Model Eğitimi (Fine-Tuning) */}
                <div style={{ marginTop: '1rem', background: '#020617', padding: '1rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={16} /> Kapalı Devre "Model Özel Eğitimi" Mimarisi</h3>
                            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Dışarı veri sızdırmadan sadece atölyenin verileriyle Fine-Tuning yapılan yerel AI modeli.</p>
                        </div>
                        <button style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}><UploadCloud size={14} /> Eğitimi Başlat</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 800 }}>Mevcut Ağırlık Dosyası</div>
                            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, marginTop: 4 }}>v4_47sb_local_weights.safetensors</div>
                        </div>
                        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 800 }}>Eğitim Veriseti</div>
                            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, marginTop: 4 }}>18,450 Üretim Logu (Sadece Fabrika)</div>
                        </div>
                        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 800 }}>Durum</div>
                            <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginTop: 4 }}>Özel Model (Fine-Tuned) Hazır</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
