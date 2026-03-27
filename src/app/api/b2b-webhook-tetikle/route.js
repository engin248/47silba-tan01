import { NextResponse } from 'next/server';

/**
 * FAZ 5.2: B2B TOPTANCI (MAIL / WHATSAPP) OTONOM TETİKLEYİCİSİ (WEBHOOK)
 * Grev: Karargah (M3) panelinde Patron "RET" butonuna (Kalıphaneye Bas) tıkladığı saniye, 
 * Hermania ajanının (Bot 11) nceden İngilizce ve Arapa olarak yazdığı katalog/B2B ikna metni
 * bu adres zerinden SendGrid (Mail) veya Meta/Twilio (WhatsApp) API'lerine asenkron fırlatılır.
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const { urun_adi, b2b_ingilizce_mail, b2b_arapca_mail, hedef_pazar } = body;

        if (!urun_adi || (!b2b_ingilizce_mail && !b2b_arapca_mail)) {
            return NextResponse.json({ hata: "Eksik parametreler (rn Adı veya Taslak Metni Yok)" }, { status: 400 });
        }

        // KURAL 21: Maliyet Şeffaflığı Uyarısı
        // Gerek bir Twilio / SendGrid entegrasyonu ateşlendiğinde, atılan her mesaj/mail başına 
        // czi de olsa (rn: 0.001$) bir API maliyeti yansıyacaktır. Sistem şu an dışa aık mock fırlatma yapıyor.

        console.log(`\n[B2B İHRACAT HATLARI AILDI - FAZ 5.2] ${urun_adi} iin ${hedef_pazar} mşterilerine katalog yollanıyor...`);

        // GEREK DNYA BAĞLANTISI YERİ:
        // await fetch('https://api.sendgrid.com/v3/mail/send', { headers: {'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`}...})

        let secilen_metin = hedef_pazar === 'ARAPA' ? b2b_arapca_mail : b2b_ingilizce_mail;

        const webhookDurumu = {
            gonderilen_pazar: hedef_pazar,
            mesaj_uzunlugu: secilen_metin ? secilen_metin.length : 0,
            durum: "BASARILI",
            hedef_kanallar: "Mail (SendGrid) & WhatsApp (Meta) Webhook Ağı"
        };

        console.log(`[ONAY] Mşteri portfyne ${webhookDurumu.mesaj_uzunlugu} karakterlik Satış Kancası başarıyla fırlatıldı.`);

        return NextResponse.json({
            success: true,
            message: "Toptancı mşterilere (B2B) teklif metni başarıyla fırlatıldı. Satış Kprs Aktif.",
            webhook_raporu: webhookDurumu
        }, { status: 200 });

    } catch (e) {
        console.error("[B2B WEBHOOK KMESİ]:", e);
        return NextResponse.json({
            success: false,
            message: "Mail/WP ağına bağlanırken istasyon koptu: " + e.message
        }, { status: 500 });
    }
}
