import { supabase } from '@/lib/supabase';
import { telegramBildirim, telegramFotoGonder } from '@/lib/utils';

export const logCameraAccess = async (payload) => {
    try {
        await fetch('/api/camera-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch { /* sessiz geç */ }
};

export const checkStreamStatus = async () => {
    try {
        const res = await fetch('/api/stream-durum', { signal: AbortSignal.timeout(5000), cache: 'no-store' });
        const data = await res.json();
        return data.durum === 'aktif' ? 'aktif' : 'kapali';
    } catch {
        return 'kapali';
    }
};

export const fetchCameras = async () => {
    try {
        const { data, error } = await supabase
            .from('cameras')
            .select('*')
            .order('id', { ascending: true });
        if (!error && data && data.length > 0) return data;
        return null; // DB table missing or empty, use defaults UI side
    } catch {
        return null;
    }
};

export const fetchAIEvents = async () => {
    try {
        const { data } = await supabase
            .from('camera_events')
            .select('*')
            .in('event_type', ['motion_detected', 'anomaly'])
            .order('created_at', { ascending: false })
            .limit(5);
        return data || [];
    } catch {
        return [];
    }
};

export const subscribeCameraEvents = (callback) => {
    return supabase.channel('ai-anomaly-channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'camera_events' }, callback)
        .subscribe();
};

export const sendCameraSnapshot = async (kam, GO2RTC_URL) => {
    try {
        const frameUrl = `${GO2RTC_URL}/api/frame.jpeg?src=${kam.src}_main`;
        const req = await fetch(frameUrl, { cache: 'no-store' });

        if (!req.ok) throw new Error('Frame alınamadı');

        const blob = await req.blob();
        const caption = `🚨 KAMERA SNAPSHOT\nKamera: ${kam.name}\nKonum: ${kam.work_center || '—'}\nTarih: ${new Date().toLocaleString('tr-TR')}\n\n⚠️ Görüntü go2rtc native frame üzerinden aktarılmıştır.`;

        const result = await telegramFotoGonder(blob, caption);

        // Log to DB
        try {
            await supabase.from('camera_events').insert([{
                camera_id: kam.id,
                event_type: 'snapshot',
                video_url: null,
            }]);
        } catch { }

        return { success: result.success, error: null };
    } catch (error) {
        // Fallback email/telegram
        telegramBildirim(`🚨 KAMERA (GÖRÜNTÜ ALINAMADI)\nKamera: ${kam.name}\nTarih: ${new Date().toLocaleString('tr-TR')}\nHata: NVR Frame timeout.`);
        try {
            await supabase.from('camera_events').insert([{
                camera_id: kam.id,
                event_type: 'snapshot',
                video_url: null,
            }]);
        } catch { }

        return { success: false, error: error.message };
    }
};
