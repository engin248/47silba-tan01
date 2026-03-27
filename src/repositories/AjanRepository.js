import { supabase } from '@/lib/supabase';

export class AjanRepository {
    /**
     * Kamera hareket olaylarını (Event) loglar
     */
    async logCameraEvent({ kameraId, eventType, videoUrl }) {
        // HATA 2 GİDERİLDİ (Sürdürüldü): Supabase hatası sessizce geçilemez, console.error'a basılmalıdır.
        const { data, error } = await supabase.from('camera_events').insert([{
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
