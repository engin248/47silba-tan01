import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const response = NextResponse.json({ success: true, message: 'ıkış başarılı' });

        // HttpOnly olan JWT token cookie'sini sil
        response.cookies.set({
            name: 'sb47_token',
            value: '',
            httpOnly: true,
            expires: new Date(0),
            path: '/',
            sameSite: 'lax',
        });

        return response;
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
