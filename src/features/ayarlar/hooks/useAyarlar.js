'use client';
/**
 * features/ayarlar/hooks/useAyarlar.js
 * M17 Sistem Ayarları — Tüm State & İş Mantığı
 *
 *   import { useAyarlar } from '@/features/ayarlar';
 *   const { ayarlar, setAlt, kaydet, yetkiliMi, loading, mesaj } = useAyarlar(kullanici);
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

// ── Sabitler ──────────────────────────────────────────────────────────────────
export const VARSAYILAN_AYARLAR = {
    teknik_foy_zorunlu: true,
    vidan_hesaplayici: true,
    siraladim_adim: true,
    aktif_dil: 'ar',
    max_video_sn: 300,
    goruntu_sikiştirma: 'yuksek',
    dakika_basi_ucret: 2.50,
    prim_orani: 0.15,
    yillik_izin_hakki: 15,
    firma_adi: '',
    firma_logo_url: '',
    firma_adres: '',
    firma_vergi_no: '',
    bildirim_uretim: true,
    bildirim_stok: true,
    bildirim_siparis: true,
    bildirim_personel: false,
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAyarlar(kullanici) {
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [ayarlar, setAyarlar] = useState(VARSAYILAN_AYARLAR);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    // Ayar değeri güncelle (kısayol)
    const setAlt = (anahtar, deger) => setAyarlar(p => ({ ...p, [anahtar]: deger }));

    const yukle = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('b1_sistem_ayarlari')
                .select('*')
                .limit(1)
                .maybeSingle();
            if (error) throw error;
            if (data?.deger) {
                try { setAyarlar({ ...VARSAYILAN_AYARLAR, ...JSON.parse(data.deger) }); } catch (e) { console.error('[AYARLAR] JSON parse hatası:', e?.message); }
            }
        } catch (e) { goster('Ayarlar yüklenemedi: ' + e.message, 'error'); }
    }, []);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);
        if (!erisebilir) return;
        const kanal = supabase.channel('ayarlar-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_sistem_ayarlari' }, yukle)
            .subscribe();
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [kullanici, yukle]);

    const kaydet = async () => {
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            kullanici, 'Sistem Ayarlarını kaydetmek için Yönetici PIN girin:'
        );
        if (!yetkili) return goster(yetkiMesaj || 'Hatalı yetki! İşlem engellendi.', 'error');

        // Sınır güvenliği (X Kriteri)
        if (ayarlar.dakika_basi_ucret < 0 || ayarlar.dakika_basi_ucret > 500) return goster('Dakika ücreti mantıksız (Max ₺500)', 'error');
        if (ayarlar.prim_orani < 0 || ayarlar.prim_orani >= 1) return goster('Prim oranı %0 ile %99 arası olmalı', 'error');
        if (ayarlar.yillik_izin_hakki < 0 || ayarlar.yillik_izin_hakki > 90) return goster('İzin hakkı çok yüksek (Max 90 gün)', 'error');

        setLoading(true);
        try {
            const deger = JSON.stringify(ayarlar);
            const { data: mevcut, error: eqErr } = await supabase.from('b1_sistem_ayarlari').select('id').limit(1).maybeSingle();
            if (eqErr) throw eqErr;
            const { error } = mevcut
                ? await supabase.from('b1_sistem_ayarlari').update({ deger, updated_at: new Date().toISOString() }).eq('id', mevcut.id)
                : await supabase.from('b1_sistem_ayarlari').insert([{ anahtar: 'sistem_genel', deger }]);
            if (error) throw error;
            goster('✅ Ayarlar kaydedildi.');
            telegramBildirim(`⚙️ SİSTEM AYARLARI GÜNCELLENDİ\nPrim: %${(ayarlar.prim_orani * 100).toFixed(0)}\nDk Mlyt: ₺${ayarlar.dakika_basi_ucret}`);
        } catch (e) {
            if (!navigator.onLine || e.message?.includes('fetch')) {
                await cevrimeKuyrugaAl({ tablo: 'b1_sistem_ayarlari', islem_tipi: 'UPSERT', veri: { anahtar: 'sistem_genel', deger: JSON.stringify(ayarlar) } });
                goster('İnternet yok: Ayarlar kuyruğa alındı.', 'success');
            } else {
                goster('Hata: ' + e.message, 'error');
            }
        }
        setLoading(false);
    };

    return { yetkiliMi, ayarlar, setAyarlar, setAlt, loading, mesaj, kaydet, yukle };
}
