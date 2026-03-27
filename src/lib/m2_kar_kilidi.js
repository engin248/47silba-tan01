/**
 * M2 KÂR KİLİDİ VE FİNANSAL VETO MOTORU (Maliyet Algoritması)
 * Görev: M1'den "BİNGO - ÇOK SATAR" onayı alan ürünün üretim maliyetlerini, kargosunu,
 *        ve iade oranlarını matematiksel olarak hesaplamak. Zarar etme riski varsa VETO EDER.
 * 
 * Patron Prensibi: "Zamanla oluşan tecrübeden (gerçekleşen iadelerden) beslenir. Zarar edeceksek BİNGO bile olsa üretme!"
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') }); // [FIX] kısmi yol → mutlak yol

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // [FIX] undefined lint
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

async function m2KarKilidiHesapla(urun_id, kumas_mt_fiyat, kumas_sarfiyat_mt, iscililik_fiyati) {
    console.log(`\n[M2 KÂR KİLİDİ] Ürün ID: ${urun_id} için Finansal Veto Analizi Başlıyor...`);

    // 1. ZAMANLA ÖĞRENEN DİNAMİK SABİTLER (İleride DB'den çekilecek, şimdilik statik öğrenme simülasyonu)
    const PAZARYERI_KOMISYONU = 0.20; // %20 Pazar Yeri
    const VERGI_ORANI = 0.20;        // %20 KDV

    // Geçmiş verilere dayalı risk öngörüleri
    const fireRiskOrani = 0.05;      // %5 Kumaş/Kesim Firesi
    const iadeRiskOrani = 0.15;      // %15 E-Ticaret Ortalama İade Orani

    const kargoGidis = 55.0;         // TL
    const kargoIadeDonus = 55.0;     // TL

    // 2. TEMEL ÜRETİM MALİYETİ
    const safKumasMaliyeti = kumas_mt_fiyat * kumas_sarfiyat_mt;
    const fireMaliyeti = safKumasMaliyeti * fireRiskOrani;
    const gercekKumasMaliyeti = safKumasMaliyeti + fireMaliyeti;

    const uretimBirimMaliyeti = gercekKumasMaliyeti + iscililik_fiyati;
    console.log(`-> Üretim Saf Maliyeti (Fire Dahil): ${uretimBirimMaliyeti.toFixed(2)} TL`);

    // 3. İADE SİGORTASI (Risk Primi) VE NİHAİ MALİYET
    // Her satılan ürün için iade ihtimalinin kargo-zararını birim fiyata yedirmek (Zamanla beslenecek algoritma)
    const iadeZararRiski = (kargoGidis + kargoIadeDonus) * iadeRiskOrani;

    const gizliGiderler = 15.0; // Paketleme, etiket, operasyon
    const nihaiMaliyet = uretimBirimMaliyeti + kargoGidis + iadeZararRiski + gizliGiderler;

    // 4. KÂR HEDEFİ VE TAVSİYE SATIŞ FİYATI
    // Patron Kararı: Net kâr marjı maliyetin üzerinden en az %40 olmalı ki şirket büyüsün.
    const hedeflenenNetKar = uretimBirimMaliyeti * 0.40;

    // Brut Satış Fiyatı Formülü: (Nihai Maliyet + Hedef Kar) / (1 - Pazar Komisyonu - KDV)
    let tavsiyeSatisFiyati = (nihaiMaliyet + hedeflenenNetKar) / (1 - PAZARYERI_KOMISYONU - VERGI_ORANI);

    // Psikolojik Fiyatlama
    tavsiyeSatisFiyati = Math.ceil(tavsiyeSatisFiyati / 10) * 10 - 0.10; // Örn: 499.90

    // 5. SAĞLAMA VE VETO KONTROLÜ
    const kesintiler = (tavsiyeSatisFiyati * PAZARYERI_KOMISYONU) + (tavsiyeSatisFiyati * VERGI_ORANI);
    const gerceklesenNetKar = tavsiyeSatisFiyati - nihaiMaliyet - kesintiler;
    const karYuzdesi = (gerceklesenNetKar / uretimBirimMaliyeti) * 100;

    let karKilidiOnayi = true;
    let finansYorumu = "";

    if (gerceklesenNetKar < (uretimBirimMaliyeti * 0.25)) {
        karKilidiOnayi = false;
        finansYorumu = `VETO EDİLDİ: Riskli! Beklenen net kâr (${gerceklesenNetKar.toFixed(2)} TL - %${karYuzdesi.toFixed(0)}) şirketi çevirmeye yetmez. Kumaş veya işçilik çok pahalı. Fiyatı artırırsak rakip satamaz. ÜRETME!`;
    } else {
        finansYorumu = `ONAYLANDI: Net kâr güvenli bölgede (${gerceklesenNetKar.toFixed(2)} TL - %${karYuzdesi.toFixed(0)}). Fire ve İade kargo riskleri fiyata gömüldü. Tavsiye Satış: ${tavsiyeSatisFiyati.toFixed(2)} TL`;
    }

    console.log(`-> Karar: ${karKilidiOnayi ? 'YEŞİL IŞIK' : 'KIRMIZI VETO'} | Net Kâr: ${gerceklesenNetKar.toFixed(2)} TL`);

    const kayitVerisi = {
        urun_id: urun_id,
        kumas_maliyeti: gercekKumasMaliyeti.toFixed(2),
        iscilik_maliyeti: iscililik_fiyati,
        kargo_ve_paketleme: (kargoGidis + gizliGiderler).toFixed(2),
        beklenen_fire_orani: fireRiskOrani,
        tahmini_iade_orani: iadeRiskOrani,
        net_birim_maliyet: nihaiMaliyet.toFixed(2),
        tavsiye_satis_fiyati: tavsiyeSatisFiyati.toFixed(2),
        beklenen_net_kar: gerceklesenNetKar.toFixed(2),
        kar_kilidi_onayi: karKilidiOnayi,
        ai_finans_yorumu: finansYorumu
    };

    // Güvenli Veritabanına Yaz
    const { error } = await supabase.from('m2_finans_veto').insert([kayitVerisi]);

    if (error) {
        console.error(`[M2 KİLT HATA] Supabase'e yazılamadı! Tablo olmayabilir.`, error.message);
    } else {
        // Eğer VETO edildiyse, ana Ürün Tablosundaki (B1) ai_satis_karari'ni 'SATMAZ' yap ki Kalıphaneye inmesin.
        if (!karKilidiOnayi) {
            await supabase.from('b1_arge_products').update({
                ai_satis_karari: 'SATMAZ',
                hermania_karar_yorumu: `[M2 FİNANS YASASI İLE İPTAL] ${finansYorumu}`
            }).eq('id', urun_id);
        }
    }

    return kayitVerisi;
}

// Test Run (Manuel 1 Ürün İçin Simülasyon)
if (require.main === module) {
    // Kumaş: Metresi 120 TL, Sarfiyat 1.5 Metre, İşçilik (Kesim/Dikim/Ütü) 80 TL
    m2KarKilidiHesapla(null, 120.0, 1.5, 80.0);
}

module.exports = { m2KarKilidiHesapla };
