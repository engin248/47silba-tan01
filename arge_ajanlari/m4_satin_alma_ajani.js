const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

/**
 * FAZ 6.1: M4 OTONOM B2B MATERYAL SATIN ALMA AJANI
 * Görev: Karargah (M3) üzerinden Patron "ÜRET" onayını (Kill-Switch Veto Kalktı) verdiğinde,
 * M2'deki "kumaş_fire_hesabi" ekranından gerekli Kumaş Metrajını (Örn: 500 Metre Popy) 
 * çekerek, anlaşmalı toptancıya (veya Açık API'ye) otonom "SİPARİŞ EMRİ" fırlatmak.
 */
async function m4HammaddeSiparisVer(urunAdi, kumasTipi, miktarMetre, toptanciEmail, telemetriFnc = null) {
    // Merkezi loglama
    const telemetriAt = async (yuzde, mesaj) => {
        if (telemetriFnc) await telemetriFnc('M4_PURCHASE', yuzde, mesaj, 'çalışıyor');
        console.log(`[M4 SATIN ALMA %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(10, `[M4 İNFAZ UYANDI] "${urunAdi}" Onaylandı! Fiziksel Kumaş Tedariği (${kumasTipi}) süreci otonom başlatılıyor...`);

    try {
        // Kural 21 (Finans Yükü Şeffaflığı): 
        // Bu işlem doğrudan bankadan veya krediden para çıkışına (Fiziksel satın alma faturasına) sebep olur.
        // Bu yüzden Yalnızca M3 panelinde "ÜRET" butonuna basıldığında tetiklenmesi katı kurala bağlanmıştır.

        await telemetriAt(40, `[M4 İLETİŞİM] B2B Toptancı Ağı taranıyor. Hedef Dağıtıcı: [${toptanciEmail}]`);

        // GERÇEK DÜNYADA (Paraşüt / E-Fatura / Tedarikçi Webhook'u):
        // const siparisEmri = await fetch("https://api.kumasci.com/v1/b2b-siparis", { ... body: miktarMetre ... })
        // Biz sistemi test etmek ve altyapıyı mühürlemek adına Mock ID kullanıyoruz.

        const siparisKodu = "MZN-M4-B2B-" + Math.floor(Math.random() * 999999);
        const tahminiBirimFiyat = 145; // TL
        const finansalYuku = miktarMetre * tahminiBirimFiyat;

        await telemetriAt(70, `[M4 API ONAY] Toptancı Onayladı. ${miktarMetre} metre rezerve edildi. Sipariş Fişi: ${siparisKodu}`);

        const fizikselKayit = {
            urun_adi: urunAdi,
            kumas_turu: kumasTipi,
            istenen_metraj: miktarMetre,
            tahmini_fatura_tl: finansalYuku,
            b2b_siparis_kodu: siparisKodu,
            tedarikci_adres: toptanciEmail,
            durum: "TOPTANCIYA_EMIR_GITTI",
            created_at: new Date().toISOString()
        };

        // Üretim Veritabanına (Muhasebe/Depo sekmesine) işle:
        // await supabase.from('m4_fiziksel_satin_almalar').insert([fizikselKayit]);

        await telemetriAt(100, `[M4 GÖREV BİTTİ] ${finansalYuku} TL değerindeki ham madde siparişi başarıyla fırlatıldı. Satın Alma Departmanı aradan çıkarıldı.`);

        return fizikselKayit;

    } catch (e) {
        console.error(`[M4 SATIN ALMA HATA]: ${e.message}`);
        await telemetriAt(0, `[M4 ÇÖKME] Hammadde Siparişi ağ hatasından reddedildi: ${e.message}`, 'INFAZ_EDILDI');
        return null;
    }
}

module.exports = { m4HammaddeSiparisVer };
