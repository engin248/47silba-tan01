import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cauptlsnqieegdrgotob.supabase.co';
const supabaseKey = 'sb_publishable_6htr6a2WnfuZuOG-zYVBHA_JcGE7s3R';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log("Antigravity -> Supabase V2 Bağlantı Testi Başlıyor...");

    try {
        const { data, error } = await supabase
            .from('v2_models')
            .insert([
                {
                    model_name: 'Antigravity Otomatik Test Modeli - 01',
                    difficulty_score: 9.9,
                    description: 'Sistem tarafından otomatik test amaçlı eklendi.'
                }
            ])
            .select();

        if (error) {
            console.error("⛔ HATA: Supabase'e Yazılamadı!", error.message);
        } else {
            console.log("✅ BAŞARILI! Veritabanına Yazılan Veri:", data);
            console.log("✅ 1. BİRİM SUPABASE VERİTABANI %100 ÇALIŞIYOR.");
        }
    } catch (err) {
        console.error("Beklenmeyen Hata:", err);
    }
}

runTest();
