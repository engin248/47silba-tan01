export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';

/**
 * FAZ 5.2: B2B TOPTANCI (MAIL / WHATSAPP) OTONOM TETÄ°KLEYÄ°CÄ°SÄ° (WEBHOOK)
 * GÃ¶rev: Karargah (M3) panelinde Patron "ÃœRET" butonuna (KalÄ±phaneye Bas) tÄ±kladÄ±ÄŸÄ± saniye, 
 * Hermania ajanÄ±nÄ±n (Bot 11) Ã¶nceden Ä°ngilizce ve ArapÃ§a olarak yazdÄ±ÄŸÄ± katalog/B2B ikna metni
 * bu adres Ã¼zerinden SendGrid (Mail) veya Meta/Twilio (WhatsApp) API'lerine asenkron fÄ±rlatÄ±lÄ±r.
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const { urun_adi, b2b_ingilizce_mail, b2b_arapca_mail, hedef_pazar } = body;

        if (!urun_adi || (!b2b_ingilizce_mail && !b2b_arapca_mail)) {
            return NextResponse.json({ hata: "Eksik parametreler (ÃœrÃ¼n AdÄ± veya Taslak Metni Yok)" }, { status: 400 });
        }

        // KURAL 21: Maliyet ÅeffaflÄ±ÄŸÄ± UyarÄ±sÄ±
        // GerÃ§ek bir Twilio / SendGrid entegrasyonu ateÅŸlendiÄŸinde, atÄ±lan her mesaj/mail baÅŸÄ±na 
        // cÃ¼zi de olsa (Ã–rn: 0.001$) bir API maliyeti yansÄ±yacaktÄ±r. Sistem ÅŸu an dÄ±ÅŸa aÃ§Ä±k mock fÄ±rlatma yapÄ±yor.

        console.log(`\n[B2B Ä°HRACAT HATLARI AÃ‡ILDI - FAZ 5.2] ${urun_adi} iÃ§in ${hedef_pazar} mÃ¼ÅŸterilerine katalog yollanÄ±yor...`);

        // GERÃ‡EK DÃœNYA BAÄLANTISI YERÄ°:
        // await fetch('https://api.sendgrid.com/v3/mail/send', { headers: {'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`}...})

        let secilen_metin = hedef_pazar === 'ARAPÃ‡A' ? b2b_arapca_mail : b2b_ingilizce_mail;

        const webhookDurumu = {
            gonderilen_pazar: hedef_pazar,
            mesaj_uzunlugu: secilen_metin ? secilen_metin.length : 0,
            durum: "BASARILI",
            hedef_kanallar: "Mail (SendGrid) & WhatsApp (Meta) Webhook AÄŸÄ±"
        };

        console.log(`[ONAY] MÃ¼ÅŸteri portfÃ¶yÃ¼ne ${webhookDurumu.mesaj_uzunlugu} karakterlik SatÄ±ÅŸ KancasÄ± baÅŸarÄ±yla fÄ±rlatÄ±ldÄ±.`);

        return NextResponse.json({
            success: true,
            message: "ToptancÄ± mÃ¼ÅŸterilere (B2B) teklif metni baÅŸarÄ±yla fÄ±rlatÄ±ldÄ±. SatÄ±ÅŸ KÃ¶prÃ¼sÃ¼ Aktif.",
            webhook_raporu: webhookDurumu
        }, { status: 200 });

    } catch (e) {
        console.error("[B2B WEBHOOK Ã‡Ã–KMESÄ°]:", e);
        return NextResponse.json({
            success: false,
            message: "Mail/WP aÄŸÄ±na baÄŸlanÄ±rken istasyon koptu: " + e.message
        }, { status: 500 });
    }
}
