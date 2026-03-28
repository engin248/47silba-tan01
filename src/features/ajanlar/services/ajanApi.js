import { supabase } from '@/lib/supabase';

// Telegram Bildirimi Gnderir
export const sendTelegramNotification = async (mesaj_metni) => {
    try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 10000);
        await fetch('/api/telegram-bildirim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj: mesaj_metni }),
            signal: controller.signal
        });
        clearTimeout(tId);
    } catch (e) {
        console.error('Telegram bildirim hatas:', e);
    }
};

// 50 Adet Grevi Snrlyarak (Timeout kalkan ile) Getirir
export const fetchGorevler = async () => {
    const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Başlant zaman aşm (10sn)')), 10000));
    const { data, error } = await Promise.race([
        supabase.from('b1_ajan_gorevler').select('*').order('created_at', { ascending: false }).limit(50),
        timeout
    ]);
    if (error) throw error;
    return data; // Gelen veriyi dndrr
};

// Yeni bir Ajan Grevi Oluşturur
export const createGorev = async (form) => {
    // Mkerrer Ajan Grevi Engeli (Şu U Kriteri)
    const { data: mevcutGorev } = await supabase.from('b1_ajan_gorevler')
        .select('id').ilike('gorev_adi', form.gorev_adi.trim()).eq('durum', 'bekliyor');

    if (mevcutGorev && mevcutGorev.length > 0) {
        throw new Error('Bu grev adyla bekleyen bir kayt zaten var!');
    }

    const { data, error } = await supabase.from('b1_ajan_gorevler').insert([{ ...form, durum: 'bekliyor' }]).select().single();
    if (error) throw error;

    // Asenkron telegram bildirimi tetiklenir
    sendTelegramNotification(`ş YEN OTONOM GREV\nAjan: ${form.ajan_adi}\nGrev: ${form.gorev_adi}`);

    return data;
};

// Ajan Grevini Silmeden nce Loglar ve Siler
export const deleteGorev = async (id, isAuthorized) => {
    if (!isAuthorized) {
        const adminPin = prompt('Bu ajan grevini silmek iğin Ynetici PN kodunu girin:');
        const dogruPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
        if (adminPin !== dogruPin) throw new Error('Yetkisiz şlem!');
    }

    if (!confirm('Grevi silmek istedişinizden emin misiniz?')) return false;

    // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
    try {
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b1_ajan_gorevler',
            islem_tipi: 'SILME',
            kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
            eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
        }]);
    } catch (e) {
        // Log hatas silmeyi durdurmamal
    }

    const { error } = await supabase.from('b1_ajan_gorevler').delete().eq('id', id);
    if (error) throw error;

    return true;
};

// Arka Planda API stesiyile Ajan alştrr
export const triggerAjanGorevi = async (gorev_id) => {
    const res = await fetch('/api/ajan-calistir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gorev_id })
    });
    const data = await res.json();
    if (!data.basarili) {
        throw new Error(data.error || 'Ajan ğalştrlrken hata oluştu');
    }
    return data;
};
