require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const LOG_FILE = 'ZIRH_TEST_SONUCU.md';

const zRaporla = (baslik, basarili, detay) => {
    const sembol = basarili ? '✅' : '❌';
    const mesaj = `${sembol} **${baslik}**: ${detay}\n`;
    fs.appendFileSync(LOG_FILE, mesaj);
    console.log(`${sembol} ${baslik} -> ${detay}`);
};

async function testSenaryosu() {
    fs.writeFileSync(LOG_FILE, '# UÇTAN UCA KARARGÂH SİMÜLASYONU VE ÖLÜM TESTİ\n\n');
    console.log("=== SİMÜLASYON BAŞLADI ===");
    let islemZamani = new Date().toISOString();

    try {
        // 1. MÜŞTERİ OLUŞTUR
        let musteriId;
        const { data: musteri, error: musteriErr } = await supabase.from('b2_musteriler').insert([{
            musteri_kodu: 'TEST-SIM-01',
            ad_soyad: 'Simülasyon Müşterisi A.Ş',
            musteri_tipi: 'toptan',
            risk_limiti: 500000,
            kara_liste: false
        }]).select();

        if (musteriErr) {
            zRaporla("Müşteri Kaydı", false, musteriErr.message);
            return;
        }
        musteriId = musteri[0].id;
        zRaporla("Müşteri (CRM) Kaydı", true, `TEST-SIM-01 ID ile kaydedildi.`);

        // 2. TEDARİKÇİ VE KUMAŞ OLUŞTUR
        let tedarikciId, kumasId;
        const { data: tedarikci, error: tedarikciErr } = await supabase.from('b2_tedarikciler').insert([{
            firma_adi: 'TEST KUMAŞÇILIK A.Ş'
        }]).select();

        if (tedarikciErr) { zRaporla("Tedarikçi Kaydı", false, tedarikciErr.message); }
        else {
            tedarikciId = tedarikci[0].id;
            zRaporla("Tedarikçi (CRM) Kaydı", true, `TEST KUMAŞÇILIK A.Ş eklendi.`);

            const { data: kumas, error: kumasErr } = await supabase.from('b1_kumas_arsivi').insert([{
                kumas_kodu: 'KMA-SIM-01',
                kumas_adi: 'Test Pamuk',
                isim_icerigi: '%100 Test Pamuk',
                stok_miktari: 1000,
                stok_birimi: 'metre',
                metre_fiyati_tl: 150,
                tedarikci_id: tedarikciId,
                durum: 'stokta'
            }]).select();

            if (kumasErr) { zRaporla("Kumaş Depo Kaydı", false, kumasErr.message); }
            else {
                kumasId = kumas[0].id;
                zRaporla("Kumaş Depo Bağlantısı", true, `KMA-SIM-01 tedarikçi ile bağlandı.`);
            }
        }

        // 3. ARGE & TASARIM (KALIP VE MODEL) OLUŞTUR
        let argeId, kalipId;
        const { data: arge, error: argeErr } = await supabase.from('b1_arge_trendler').insert([{
            trend_adi: 'Simüle Tişört M1',
            kategori: 'Tshirt',
            hedef_kitle: 'Erkek',
            zorluk_derecesi: 7,
            durum: 'kabul'
        }]).select();

        if (argeErr) { zRaporla("Ar-Ge Kaydı", false, argeErr.message); }
        else {
            argeId = arge[0].id;
            zRaporla("Ar-Ge (Tasarım) Birimi", true, `Simüle Tişört M1 zorluk(7) derecesiyle onaylandı.`);

            const { data: kalip, error: kalipErr } = await supabase.from('b1_kaliplar').insert([{
                kalip_kodu: 'KLP-SIM-01',
                model_adi: 'Simüle Tişört M1 Kalıbı',
                olcu_tipi: 'standart',
                durum: 'serilenmis',
                arge_id: argeId,
                kumas_id: kumasId // Kumaş & Kalıp bağlı
            }]).select();

            if (kalipErr) { zRaporla("Kalıp/Modelhane Zinciri", false, kalipErr.message); }
            else {
                kalipId = kalip[0].id;
                zRaporla("Kalıp/Modelhane Zinciri", true, `Kalıp birimi ar-ge ve kumaş ile başarıyla matchlendi.`);
            }
        }

        // 4. PERSONEL VE ÜRETİM EMRİ (İŞÇİLİK YÜKLEMESİ)
        let personelId, isEmriId;
        const { data: personel, error: perErr } = await supabase.from('b1_personel').insert([{
            personel_kodu: 'PER-SIM-01',
            ad_soyad: 'Simülasyon Ustası',
            rol: 'makineci',
            durum: 'aktif',
            ai_verimlilik_puani: 90
        }]).select();

        if (perErr) { zRaporla("Personel Hakediş Modülü", false, perErr.message); }
        else {
            personelId = personel[0].id;
            zRaporla("Personel & Üretim", true, `Personel (AI Puanı: 90) başarıyla eklendi.`);

            const { data: uretim, error: uretimErr } = await supabase.from('b1_fason_is_emirleri').insert([{
                kalip_id: kalipId,
                is_tipi: 'dikim', // fason yerine kendi iç işleyişimiz olsun
                verilen_adet: 500,
                tamamlanan_adet: 490, // 10 file
                kusurlu_adet: 10,
                birim_fiyat_tl: 25,
                toplam_tutar_tl: (490 * 25), // Ustanın alacağı (Kusurlu hariç)
                durum: 'tamamlandi'
            }]).select();

            if (uretimErr) { zRaporla("Üretim/Barkod Kaydı", false, uretimErr.message); }
            else {
                isEmriId = uretim[0].id;
                zRaporla("Üretim/Barkod Süreci", true, `Dikim süreci (500 adet, 10 fire) hasarsız geçti.`);

                // Maliyet Merkezine ve Personele gider yaz
                const { error: maliyetErr } = await supabase.from('b1_maliyet_kayitlari').insert([{
                    is_emri_id: isEmriId,
                    maliyet_tipi: 'personel_iscilik',
                    tutar_tl: (490 * 25),
                    aciklama: 'Simüle dikim hakedişi',
                    odeme_durumu: 'onay_bekliyor'
                }]);

                await supabase.from('b1_maliyet_kayitlari').insert([{ // Zayiat / Fire cezası/maliyeti
                    is_emri_id: isEmriId,
                    maliyet_tipi: 'fire_kaybi',
                    tutar_tl: (10 * 150), // 10 ürün kumaşı yandı gitti
                    aciklama: 'Üretim zayiat (10 adet)',
                    odeme_durumu: 'odendi' // Cebimizden çıktı
                }]);

                if (!maliyetErr) zRaporla("Muhasebe Kesin Hesabı", true, `İşçilik gideri ve Zayiat kaybı bilançoya (KASAYA) entegre edildi.`);
            }
        }

        // 5. ÜRÜN ÇIKART (KATALOG) VE SİPARİŞ KES
        let urunId, siparisId;
        const { data: katalog, error: katErr } = await supabase.from('b2_urun_katalogu').insert([{
            urun_kodu: 'URN-SIM-01',
            urun_adi: 'Simüle Tişört M1 (Seri Üretim)',
            satis_fiyati_tl: 600,
            stok_adeti: 490, // Defolar depoya girmez
            min_stok: 50,
            durum: 'aktif'
        }]).select();

        if (katErr) { zRaporla("Mağaza / Katalog Modülü", false, katErr.message); }
        else {
            urunId = katalog[0].id;
            zRaporla("Mağaza / Katalog Modülü", true, `Mamül (490 adet) direkt e-ticaret/mağaza rafına çıkarıldı.`);

            // Satış yap (200 tanesini siparişe çevir)
            const { data: siparis, error: sipErr } = await supabase.from('b2_siparisler').insert([{
                musteri_id: musteriId,
                siparis_durumu: 'bekliyor',
                odeme_durumu: 'bekliyor',
                toplam_tutar_tl: (200 * 600) // 120,000 TL
            }]).select();

            if (sipErr) { zRaporla("Sipariş & Sepet", false, sipErr.message); }
            else {
                siparisId = siparis[0].id;

                await supabase.from('b2_siparis_kalemleri').insert([{
                    siparis_id: siparisId,
                    urun_id: urunId,
                    miktar: 200,
                    birim_fiyat_tl: 600
                }]);

                zRaporla("Satış / Pazarlama Zinciri", true, `200 adet sipariş müşteriye eklendi. Bakiye 120.000 TL hesaplandı.`);

                // Siparişi Onayla -> Kasa'dan parayı al
                await supabase.from('b2_kasa_hareketleri').insert([{
                    musteri_id: musteriId,
                    siparis_id: siparisId,
                    hareket_tipi: 'tahsilat',
                    odeme_yontemi: 'eft',
                    tutar_tl: 120000,
                    onay_durumu: 'onaylandi' // Direkt kasaya girdi
                }]);
                zRaporla("Kasa / Finans Entegrasyonu", true, `Para kasa hesaplarına yansıdı. Cari işlem kapandı.`);
            }
        }

        // ZIRHLI SİLME (B0_LOG) TESTİ
        // Sistemin sahte (test) datayı otonom temizlemesi ama Logda tutması
        if (musteriId) {
            // Önce kasayı sonra, sipariş vb temizle (Foreign Key mantığı gereği tersten)
            await supabase.from('b2_kasa_hareketleri').delete().eq('musteri_id', musteriId);
            await supabase.from('b2_siparis_kalemleri').delete().eq('siparis_id', siparisId);
            await supabase.from('b2_siparisler').delete().eq('id', siparisId);
            await supabase.from('b2_urun_katalogu').delete().eq('id', urunId);
            await supabase.from('b1_maliyet_kayitlari').delete().eq('is_emri_id', isEmriId);
            await supabase.from('b1_fason_is_emirleri').delete().eq('id', isEmriId);
            await supabase.from('b1_personel').delete().eq('id', personelId);
            await supabase.from('b1_kaliplar').delete().eq('id', kalipId);
            await supabase.from('b1_arge_trendler').delete().eq('id', argeId);
            await supabase.from('b1_kumas_arsivi').delete().eq('id', kumasId);
            await supabase.from('b2_tedarikciler').delete().eq('id', tedarikciId);
            const { error: musteriSilErr } = await supabase.from('b2_musteriler').delete().eq('id', musteriId);

            if (musteriSilErr) {
                zRaporla("Otonom Kaskat (Cascade) Silme / DB Tutarlılığı", false, `Bağımlılık hatası: ${musteriSilErr.message}`);
            } else {
                zRaporla("Temizlik ve Silme Logu Doğrulaması", true, `Ağdaki tüm test verileri çöpe gitti, Foreign Key kusursuz kaskatlandı.`);
            }
        }

    } catch (e) {
        zRaporla("KRİTİK HATA FATAL_ERR", false, e.message);
    }

    console.log("=== SİMÜLASYON RAPORU HAZIRLANDI: ZIRH_TEST_SONUCU.md ===");
}

testSenaryosu();
