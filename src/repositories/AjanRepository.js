import { supabaseAdmin } from '@/lib/supabaseAdmin';

export class AjanRepository {
    /**
     * Kamera hareket olaylarını (Event) loglar
     */
    async logCameraEvent({ kameraId, eventType, videoUrl }) {
        // HATA 2 GİDERİLDİ (Sürdürüldü): Supabase hatası sessizce geçilemez. RLS Hatası engellendi (Admin Key eklendi).
        const { data, error } = await supabaseAdmin.from('camera_events').insert([{
            camera_id: kameraId || null,
            event_type: eventType,
            video_url: videoUrl,
        }]);

        if (error) {
            console.error('[AjanRepository] Supabase Log Hatası:', error.message);
            throw new Error(`Veritabanı Kayıt Hatası: ${error.message}`);
        }

        return data;
    }
}
