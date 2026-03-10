import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Kriter 141: Zamanlanmış Görev (CRON) Planlayıcı 
export async function GET(req) {
    const authHeader = req.headers.get('Authorization');
    // Vercel Cron Güvenlik Doğrulaması
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Yetkisiz Cron İsteği' }, { status: 401 });
    }

    const unlem = new URL(req.url).searchParams.get('gorev');
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        if (unlem === 'sabah_ozeti') {
            await supabaseAdmin.from('b1_ajan_gorevler').insert([{
                ajan_adi: 'Genel',
                gorev_adi: 'Otomatik Sabah Özeti Raporu',
                gorev_tipi: 'rapor',
                durum: 'bekliyor',
                oncelik: 'yuksek',
                gorev_emri: 'Dünkü üretim rakamlarını topla ve yönetime telegram at'
            }]);
            return NextResponse.json({ success: true, mesaj: 'Sabah cronu kuyruğa eklendi' });
        }

        if (unlem === 'gece_yedekleme_ve_temizlik') {
            // Gece 3 - Soft Delete temizliği veya log arşivleme
            await supabaseAdmin.from('b1_ajan_gorevler').insert([{
                ajan_adi: 'Sistem',
                gorev_adi: 'Gece Log Arşivleme',
                gorev_tipi: 'kontrol',
                durum: 'bekliyor',
                oncelik: 'normal',
                gorev_emri: '7 günden eski logları arşivle.'
            }]);
            return NextResponse.json({ success: true, mesaj: 'Gece cronu kuyruğa eklendi' });
        }

        return NextResponse.json({ success: true, mesaj: 'Bilinmeyen Cron Parametresi Ancak Yetkili Giriş. Boş dönüldü.' });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
