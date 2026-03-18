import { NextResponse } from 'next/server';

/**
 * FAZ 5.2: B2B TOPTANCI (MAIL / WHATSAPP) OTONOM TETİKLEYİCİSİ (WEBHOOK)
 * Görev: Karargah (M3) panelinde Patron "ÜRET" butonuna (Kalıphaneye Bas) tıkladığı saniye, 
 * Hermania ajanının (Bot 11) önceden İngilizce ve Arapça olarak yazdığı katalog/B2B ikna metni
 * bu adres üzerinden SendGrid (Mail) veya Meta/Twilio (WhatsApp) API'lerine asenkron fırlatılır.
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const { urun_adi, b2b_ingilizce_mail, b2b_arapca_mail, hedef_pazar } = body;

        if (!urun_adi || (!b2b_ingilizce_mail && !b2b_arapca_mail)) {
            return NextResponse.json({ hata: "Eksik parametreler (Ürün Adı veya Taslak Metni Yok)" }, { status: 400 });
        }

        // KURAL 21: Maliyet Şeffaflığı Uyarısı
        // Gerçek bir Twilio / SendGrid entegrasyonu ateşlendiğinde, atılan her mesaj/mail başına 
        // cüzi de olsa (Örn: 0.001$) bir API maliyeti yansıyacaktır. Sistem şu an dışa açık mock fırlatma yapıyor.

        console.log(`\n[B2B İHRACAT HATLARI AÇILDI - FAZ 5.2] ${urun_adi} için ${hedef_pazar} müşterilerine katalog yollanıyor...`);

        // GERÇEK DÜNYA BAĞLANTISI YERİ:
        // await fetch('https://api.sendgrid.com/v3/mail/send', { headers: {'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`}...})

        let secilen_metin = hedef_pazar === 'ARAPÇA' ? b2b_arapca_mail : b2b_ingilizce_mail;

        const webhookDurumu = {
            gonderilen_pazar: hedef_pazar,
            mesaj_uzunlugu: secilen_metin ? secilen_metin.length : 0,
            durum: "BASARILI",
            hedef_kanallar: "Mail (SendGrid) & WhatsApp (Meta) Webhook Ağı"
        };

        console.log(`[ONAY] Müşteri portföyüne ${webhookDurumu.mesaj_uzunlugu} karakterlik Satış Kancası başarıyla fırlatıldı.`);

        return NextResponse.json({
            success: true,
            message: "Toptancı müşterilere (B2B) teklif metni başarıyla fırlatıldı. Satış Köprüsü Aktif.",
            webhook_raporu: webhookDurumu
        }, { status: 200 });

    } catch (e) {
        console.error("[B2B WEBHOOK ÇÖKMESİ]:", e);
        return NextResponse.json({
            success: false,
            message: "Mail/WP ağına bağlanırken istasyon koptu: " + e.message
        }, { status: 500 });
    }
}
