import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            return NextResponse.json({ success: false, error: 'Telegram Bot Token veya Chat ID eksik.' }, { status: 500 });
        }

        const formData = await request.formData();
        const photo = formData.get('photo'); // Blob
        const caption = formData.get('caption') || '';

        if (!photo) {
            return NextResponse.json({ success: false, error: 'Fotograf verisi (photo) eksik.' }, { status: 400 });
        }

        const telegramFormData = new FormData();
        telegramFormData.append('chat_id', TELEGRAM_CHAT_ID);
        telegramFormData.append('photo', photo);
        telegramFormData.append('caption', caption);

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
        const res = await fetch(url, {
            method: 'POST',
            body: telegramFormData
        });

        const data = await res.json();
        return NextResponse.json({ success: data.ok, data });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
