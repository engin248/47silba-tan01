const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testTrigger() {
    console.log('--- M9 SİPARİŞ FİYAT KORUMA ZIRHI TESTİ ---');
    try {
        console.log('1. TEST_SIPARIS_ZIRH_001 adında ONAYLANMIŞ sahte sipariş ekleniyor...');
        const { data: musteri } = await supabase.from('b2_musteriler').select('id').limit(1).single();

        const testSiparis = {
            siparis_no: 'TEST_SIPARIS_ZIRH_001',
            musteri_id: musteri ? musteri.id : null,
            durum: 'onaylandi',
            toplam_tutar_tl: 2500.00,
            kanal: 'magaza'
        };

        const { data: insData, error: insErr } = await supabase.from('b2_siparisler').insert(testSiparis).select().single();

        if (insErr) {
            console.error('Sipariş eklenemedi (RLS/Trigger hatası olabilir):', insErr.message);
            return;
        }

        const siparisId = insData.id;
        console.log(`✅ Sipariş eklendi (ID: ${siparisId}, Tutar: 2500 TL). Şimdi Toplam Tutar güncellenmeye çalışılıyor...`);

        // M9 Katalog Zammı Simülasyonu --> Sipariş tutarını 3500 yapmaya çalışıyoruz
        const { error: updErr } = await supabase.from('b2_siparisler')
            .update({ toplam_tutar_tl: 3500.00 })
            .eq('id', siparisId);

        if (updErr) {
            console.log('\n🛡️ SİSTEM ZIRHI DEVREYE GİRDİ! GÜNCELLEME REDDEDİLDİ:');
            console.log('HATA MESAJI:', updErr.message);
            if (updErr.message.includes('ZIRH AKTİF')) {
                console.log('✅ TEST BAŞARILI: Veritabanı koruma kalkanı hatasız çalıştı!');
            } else {
                console.log('⚠️ FARKLI BİR HATA: Zırh dışı bir engel oluştu.');
            }
        } else {
            console.log('\n❌ TEST BAŞARISIZ! Sipariş toplam tutarı GÜNCELLENDİ (Zırh Delindi). Trigger çalışmıyor.');
        }

        // Temizlik
        await supabase.from('b2_siparisler').delete().eq('id', siparisId);
        console.log('🧹 Test siparişi temizlendi.');

    } catch (e) {
        console.error('Kritik Test Hatası:', e);
    }
    process.exit(0);
}

testTrigger();
