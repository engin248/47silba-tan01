// =========================================================================
// 4. EKİP: "KÖPRÜ AJANI" (Bridge Agent)
// GÖREVİ: Yargıç'ın verdiği kararları aksiyona çevirir.
//         1. Yüksek skorlu ürünler için Telegram bildirimi gönderir
//         2. 7 günden eski reddedilmiş kayıtları temizler
// SINIR:  Sadece okuma + bildirim. Hiçbir karara müdahale etmez.
// =========================================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env.local') });

// ─── GÜVENLİK DÜZELTME: Service Role Key kullanılıyor ─────────
// ─── SUPABASE BAĞLANTISI (Service Role Key — DELETE işlemi için RLS bypass gerekli) ───
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[KÖPRÜ] ⚠️ UYARI: SUPABASE_SERVICE_ROLE_KEY bulunamadı, anon key ile devam ediliyor.');
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ─── TELEGRAM BİLDİRİM ────────────────────────────────────────
async function telegramBildirimGonder(urunAdi, firsatSkoru, karar, agentNote) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('[KÖPRÜ] ⚠️ Telegram token/chat_id yok. Bildirim atlanadı.');
        return false;
    }

    const emoji = karar === 'ÜRETİM' ? '🏭' : '🧪';
    const mesaj = `${emoji} *THE ORDER — YENİ KARAR*

📦 *Ürün:* ${urunAdi}
📊 *Fırsat Skoru:* ${firsatSkoru.toFixed(1)}/100
⚡ *Karar:* ${karar}

📝 _${agentNote || 'Detay yok.'}_

_Karargah panelinden onaylayın._`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mesaj,
                parse_mode: 'Markdown'
            })
        });

        if (res.ok) {
            console.log(`[KÖPRÜ] 📱 Telegram bildirimi gönderildi: ${urunAdi.substring(0, 30)}...`);
            return true;
        } else {
            console.log(`[KÖPRÜ] ⚠️ Telegram hata: HTTP ${res.status}`);
            return false;
        }
    } catch (err) {
        console.log(`[KÖPRÜ] ⚠️ Telegram bağlantı hatası: ${err.message}`);
        return false;
    }
}

// ─── YENİ KARARLARI TARA VE BİLDİR ───────────────────────────
async function yeniKararlariTara() {
    console.log('[KÖPRÜ] 🔍 Son 1 saatteki yeni kararlar taranıyor...');

    const birSaatOnce = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: yeniKararlar, error } = await supabase
        .from('b1_arge_strategy')
        .select('*')
        .in('nizam_decision', ['ÜRETİM', 'TEST ÜRETİMİ (Numune)'])
        .gte('created_at', birSaatOnce)
        .order('opportunity_score', { ascending: false });

    if (error) {
        console.log(`[KÖPRÜ] ⚠️ Strateji tablosu okunamadı: ${error.message}`);
        return;
    }

    if (!yeniKararlar || yeniKararlar.length === 0) {
        console.log('[KÖPRÜ] Bildirilecek yeni karar yok.');
        return;
    }

    console.log(`[KÖPRÜ] ${yeniKararlar.length} adet yeni karar bulundu. Telegram bildirimleri gönderiliyor...`);

    let gonderilen = 0;
    for (const karar of yeniKararlar) {
        const basarili = await telegramBildirimGonder(
            karar.product_name || 'Bilinmeyen Ürün',
            karar.opportunity_score || 0,
            karar.nizam_decision,
            karar.agent_note
        );
        if (basarili) gonderilen++;

        // Telegram rate limit koruması — mesajlar arası 1sn bekle
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`[KÖPRÜ] ✅ ${gonderilen}/${yeniKararlar.length} bildirim gönderildi.`);
}

// ─── KORUNMASI ZORUNLU TABLOLAR (ASLA SİLİNMEZ) ───────────────
// Model resimleri, kumaş/aksesuar örnekleri, üretim arşivleri,
// personel maliyet kayıtları bu listede yer alan tablolara dokunulmaz.
const KORUNAN_TABLOLAR = [
    'b1_kumas',            // Kumaş & Materyal Arşivi
    'b1_aksesuar',         // Aksesuar Örnekleri
    'b1_model_taslaklari', // Model Resimleri & Tasarım Arşivi
    'b1_maliyet_kayitlari',// Personel & İşletme Maliyet Kayıtları (5 yıl yasal zorunluluk)
    'b1_muhasebe_raporlari',// Muhasebe / Finans Arşivi
    'production_orders',   // Üretim Arşivi (Eski siparişler)
    'b1_personel',         // Personel Kayıtları
    'b1_personel_performans', // Performans Arşivi
    'b0_arsiv',            // Ana Arşiv Katmanı — ASLA SİLİNMEZ
    'b0_sistem_loglari',   // Sistem Denetim Logları
];

// ─── GÜVENLİ ARŞİV SONRASI SİL (ÖNEMLİ!) ─────────────────────
// Silmeden ÖNCE b0_arsiv tablosuna yedek alır.
// Arşivleme başarısız olursa silme işlemi de iptal edilir (Güvenli mod).
async function arsivleSonraSil(tablo, kayitlar) {
    if (KORUNAN_TABLOLAR.includes(tablo)) {
        console.log(`[KÖPRÜ] 🛡️ KORUMA: '${tablo}' tablosu kalıcı korumalı listede. Silme işlemi engellendi.`);
        return 0;
    }

    if (!kayitlar || kayitlar.length === 0) return 0;

    let basariliSilme = 0;

    for (const kayit of kayitlar) {
        try {
            // 1. ADIM: b0_arsiv tablosuna kopyala
            const { error: arsivHata } = await supabase.from('b0_arsiv').insert([{
                kaynak_tablo: tablo,
                kaynak_id: kayit.id,
                veri: kayit,
                silen_kullanici: 'KOPRU_AJAN_OTOMASYONU',
                silme_tarihi: new Date().toISOString(),
                silme_sebebi: `Köprü Ajani otomatik temizlik (7 gun gecmis, islenen_durum: islendi)`,
                geri_yuklenebilir: true,
            }]);

            if (arsivHata) {
                // Arşivleme başarısız → silme iptal, güvenli kalma
                console.warn(`[KÖPRÜ] ⚠️ ARŞİV HATASI (ID: ${kayit.id}): ${arsivHata.message} — Bu kayıt SİLİNMEDİ.`);
                continue; // Bu kaydı atla, sonrakine geç
            }

            // 2. ADIM: Arşiv başarılıysa asıl tablodan sil
            const { error: silHata } = await supabase.from(tablo).delete().eq('id', kayit.id);

            if (silHata) {
                console.warn(`[KÖPRÜ] ⚠️ SİLME HATASI (ID: ${kayit.id}): ${silHata.message}`);
                continue;
            }

            basariliSilme++;
        } catch (e) {
            console.warn(`[KÖPRÜ] ⚠️ İşlem hatası (ID: ${kayit.id}): ${e.message}`);
        }
    }

    return basariliSilme;
}

// ─── ÇÖP SÜPÜRGESİ (ARŞİVLEYEREK TEMİZLE) ───────────────────
async function copSupurgesi() {
    console.log('[KÖPRÜ] 🧹 7 günden eski işlenmiş kayıtlar ARŞİVLENEREK temizleniyor...');
    console.log('[KÖPRÜ] 🛡️ KORUMA AKTIF: Model/Kumaş/Aksesuar/Maliyet/Üretim verileri hiçbir zaman silinmez.');

    const yediGunOnce = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Önce kayıtları ÇEK (silmeden önce arşivleyeceğiz)
    const { data: eskiKayitlar, error } = await supabase
        .from('b1_arge_products')
        .select('*')                    // Tüm alanları al (arşiv için)
        .eq('islenen_durum', 'islendi')
        .lt('created_at', yediGunOnce);

    if (error) {
        console.log(`[KÖPRÜ] ⚠️ Temizlik sorgu hatası: ${error.message}`);
        return;
    }

    if (!eskiKayitlar || eskiKayitlar.length === 0) {
        console.log('[KÖPRÜ] 🧹 Temizlenecek eski kayıt bulunamadı.');
        return;
    }

    console.log(`[KÖPRÜ] 📦 ${eskiKayitlar.length} kayıt arşivlenip silinecek...`);

    const silinen = await arsivleSonraSil('b1_arge_products', eskiKayitlar);
    console.log(`[KÖPRÜ] ✅ ${silinen}/${eskiKayitlar.length} kayıt güvenle arşivlendi ve temizlendi.`);
    if (silinen < eskiKayitlar.length) {
        console.warn(`[KÖPRÜ] ⚠️ ${eskiKayitlar.length - silinen} kayıt arşivlenemediği için SİLİNMEDİ ve korundu.`);
    }
}

// ─── ANA ÇALIŞTIRICI ──────────────────────────────────────────
async function kopruAjaniCalistir() {
    console.log('\n[KÖPRÜ] 🌉 Köprü Ajanı başlatıldı...');
    console.log(`[KÖPRÜ] Telegram: ${TELEGRAM_BOT_TOKEN ? '✅ Aktif' : '❌ Token yok'}`);

    await yeniKararlariTara();
    await copSupurgesi();

    console.log('[KÖPRÜ] ✅ Tüm görevler tamamlandı.\n');
}

// Çalıştırma: node src/scripts/ai_mastermind/kopru_ajan.js
kopruAjaniCalistir();
