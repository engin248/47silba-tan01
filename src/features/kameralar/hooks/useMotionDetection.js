import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL || 'http://localhost:1984';

export default function useMotionDetection(kameralar, aktif = true) {
    const [hareketDurumlari, setHareketDurumlari] = useState({});
    const canvasRef = useRef(null);
    const oncekiPikseller = useRef({});
    const hareketsizlikSayaci = useRef({});
    const islemDurdur = useRef(false);

    // Hareketsizlik limiti: 120 saniye (2 dakika)
    const HAREKETSIZLIK_LIMITI_SN = 120;
    // Tarama hızı
    const KONTROL_ARALIGI_MS = 2000;

    useEffect(() => {
        if (!aktif || !kameralar || kameralar.length === 0) {
            islemDurdur.current = true;
            return;
        }
        islemDurdur.current = false;

        if (!canvasRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = 320; // Düşük çözünürlükte piksel taraması (Sıfır RAM yükü)
            canvas.height = 180;
            canvasRef.current = canvas;
        }

        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        let guncelKameraIndex = 0;

        const tespitDONGUSU = async () => {
            if (islemDurdur.current) return;

            const kam = kameralar[guncelKameraIndex];
            if (kam && kam.status === 'online') {
                try {
                    // CORS yasağını aşmak için go2rtc'nin yerel JPEG api'sinden anlık kare çekilir
                    const res = await fetch(`${GO2RTC_URL}/api/frame.jpeg?src=${kam.src}_sub`, { cache: 'no-store' });

                    if (res.ok) {
                        const blob = await res.blob();
                        const img = new Image();
                        img.src = URL.createObjectURL(blob);

                        await new Promise(r => {
                            img.onload = () => {
                                ctx.drawImage(img, 0, 0, 320, 180);
                                const frameVerisi = ctx.getImageData(0, 0, 320, 180);
                                URL.revokeObjectURL(img.src);
                                r();

                                // Piksel Karşılaştırma Algoritması (Zero-Cost Motion Detection)
                                const mevcutPikseller = frameVerisi.data;
                                const eskiPikseller = oncekiPikseller.current[kam.id];
                                let degisimSayisi = 0;

                                if (eskiPikseller) {
                                    // Sadece her 4. pikseli tarayarak (Performans tavanı) CPU %1 altında tutulur
                                    for (let i = 0; i < mevcutPikseller.length; i += 16) {
                                        const rFark = Math.abs(mevcutPikseller[i] - eskiPikseller[i]);
                                        const gFark = Math.abs(mevcutPikseller[i + 1] - eskiPikseller[i + 1]);
                                        const bFark = Math.abs(mevcutPikseller[i + 2] - eskiPikseller[i + 2]);

                                        // Işık yansıması (Tolerance: 30) hassas yapıldı. En ufak ışık yansıması hareket sayılacak.
                                        if (rFark > 25 || gFark > 25 || bFark > 25) {
                                            degisimSayisi++;
                                        }
                                    }

                                    // Toplam tararan piksel sayısının %1.5'u değiştiyse HAREKET VAR kuralı
                                    const yuzdeDegisim = (degisimSayisi / (mevcutPikseller.length / 16)) * 100;
                                    const hareketVar = yuzdeDegisim > 1.5;

                                    setHareketDurumlari(prev => ({ ...prev, [kam.id]: { hareketVar, yuzde: yuzdeDegisim.toFixed(1) } }));

                                    if (hareketVar) {
                                        // Hareket varsa sayacı sıfırla
                                        hareketsizlikSayaci.current[kam.id] = 0;
                                    } else {
                                        // Hareket yoksa sayacı artır
                                        const suAnki = (hareketsizlikSayaci.current[kam.id] || 0) + (KONTROL_ARALIGI_MS / 1000);
                                        hareketsizlikSayaci.current[kam.id] = suAnki;

                                        // KRİZ DOĞRULAMASI: 120 saniye (2 dk) boyunca hareket hiç yoksa!
                                        if (suAnki >= HAREKETSIZLIK_LIMITI_SN) {
                                            // Alarm at ve sayacı resetle ki sürekli atmasın
                                            hareketsizlikSayaci.current[kam.id] = 0;
                                            krizLoguAt(kam.id, kam.name);
                                        }
                                    }
                                }

                                oncekiPikseller.current[kam.id] = new Uint8ClampedArray(mevcutPikseller);
                            };
                            img.onerror = () => r(); // hata durumunda pas geç
                        });
                    }
                } catch (err) {
                    // Frame çekilemedi, bağlantı koptu veya offline
                }
            }

            // Sonraki kameraya geç
            guncelKameraIndex = (guncelKameraIndex + 1) % kameralar.length;

            if (!islemDurdur.current) {
                setTimeout(tespitDONGUSU, KONTROL_ARALIGI_MS); // 2 saniyede bir sıradaki kamerayı tara
            }
        };

        tespitDONGUSU();

        return () => {
            islemDurdur.current = true;
        };
    }, [kameralar, aktif]);

    const krizLoguAt = async (kameraId, kameraAdi) => {
        try {
            // AŞAMA 2/FAZ 4 HAZIRLIĞI: Supabase'e log atılır. Gelecekte AI Vision buradan tetiklenir.
            await supabase.from('camera_events').insert([{
                camera_id: null, // Test için null geçildi, gerçek DB relation'larına göre revize edilebilir
                event_type: 'motion_detected', // Hareketsizlik krizi
                video_url: null,
                metadata: { kamera_adi: kameraAdi, uyari: `2 Dakikadır [${kameraAdi}] kamerasında HİÇBİR HAREKET YOK!` }
            }]);

            // Opsiyonel Telegram bildirimi eklenebilir
        } catch (e) { console.error('Kriz logu atılamadı', e); }
    };

    return hareketDurumlari;
}
