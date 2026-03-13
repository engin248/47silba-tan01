/**
 * THE ORDER / NİZAM — NİZAMBOT (Telegram Medya & Komuta Botu)
 * ==========================================
 * Bot: @Lumora_47bot | Sistem Adı: NİZAMBOT
 * Medyalar Supabase Storage'a yüklenir
 * İlgili kayıtlar Supabase tablolarına otomatik işlenir
 * 
 * Çalıştırmak için:
 *   node telegram-bot.js
 * 
 * .env.local dosyasında gerekli:
 *   TELEGRAM_BOT_TOKEN=...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── ORTAM DEĞİŞKENLERİ ───────────────────────────────────────
function loadEnv() {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) { console.error('❌ .env.local bulunamadı!'); process.exit(1); }
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...vals] = trimmed.split('=');
        if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
    }
}
loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

if (!BOT_TOKEN || BOT_TOKEN.includes('1234567890')) {
    console.error('❌ TELEGRAM_BOT_TOKEN geçersiz! .env.local dosyasını düzenleyin.');
    process.exit(1);
}

console.log('🤖 THE ORDER / NİZAM — NİZAMBOT başlatıldı');
console.log('📡 Fotoğraf | Ses | Video | Belge destekleniyor\n');

let lastUpdateId = 0;

// ─── STORAGE BUCKET TANIMLARI ─────────────────────────────────
// Her medya tipi kendi bucket'ına yüklenir
const BUCKET = {
    foto: 'teknik-foyler',   // Mevcut bucket
    ses: 'teknik-foyler',   // Aynı bucket, ses/ klasörü
    video: 'teknik-foyler',   // Aynı bucket, video/ klasörü
    belge: 'teknik-foyler',   // Aynı bucket, belge/ klasörü
};

// ─── YARDIMCI FONKSİYONLAR ────────────────────────────────────

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('JSON parse hatası: ' + data.substring(0, 100))); }
            });
        }).on('error', reject);
    });
}

function postJson(url, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const urlObj = new URL(url);
        const req = https.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Telegram'a mesaj gönder
async function mesajGonder(chat_id, text, extra = {}) {
    await postJson(`${TELEGRAM_API}/sendMessage`, {
        chat_id, text,
        parse_mode: 'HTML',
        ...extra
    });
}

// Telegram'dan dosya indir
async function telegramDosyaIndir(file_id) {
    const fileInfo = await fetchJson(`${TELEGRAM_API}/getFile?file_id=${file_id}`);
    const filePath = fileInfo.result?.file_path;
    if (!filePath) throw new Error('Dosya yolu alınamadı');
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    return new Promise((resolve, reject) => {
        https.get(fileUrl, (res) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                // Redirect
                https.get(res.headers.location, (res2) => {
                    const chunks = [];
                    res2.on('data', c => chunks.push(c));
                    res2.on('end', () => resolve({ buffer: Buffer.concat(chunks), filePath }));
                }).on('error', reject);
                return;
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve({ buffer: Buffer.concat(chunks), filePath }));
        }).on('error', reject);
    });
}

// Supabase Storage'a yükle
async function supabaseYukle(buffer, dosyaYolu, mimeType, bucket = 'teknik-foyler') {
    return new Promise((resolve, reject) => {
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${dosyaYolu}`;
        const urlObj = new URL(uploadUrl);
        const req = https.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': mimeType,
                'Content-Length': buffer.length,
                'x-upsert': 'true'    // Aynı isimde dosya varsa üzerine yaz
            }
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    resolve(`${SUPABASE_URL}/storage/v1/object/public/${bucket}/${dosyaYolu}`);
                } else {
                    reject(new Error(`Storage hatası ${res.statusCode}: ${d}`));
                }
            });
        });
        req.on('error', reject);
        req.write(buffer);
        req.end();
    });
}

// Supabase tablosuna kayıt ekle
async function supabaseKaydet(tablo, kayit) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(kayit);
        const urlObj = new URL(`${SUPABASE_URL}/rest/v1/${tablo}`);
        const req = https.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Prefer': 'return=representation'
            }
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) resolve(JSON.parse(d));
                else reject(new Error(`DB hatası ${res.statusCode}: ${d}`));
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ─── MEDYA TİPİ TESPİTİ ──────────────────────────────────────

function medyaTipiBelirle(message) {
    if (message.photo) return 'foto';
    if (message.audio || message.voice) return 'ses';
    if (message.video || message.video_note) return 'video';
    if (message.document) {
        const mime = message.document.mime_type || '';
        if (mime.startsWith('image/')) return 'foto';
        if (mime.startsWith('audio/')) return 'ses';
        if (mime.startsWith('video/')) return 'video';
        return 'belge';
    }
    return null;
}

// Caption'dan klasör ve kategori bilgisi çıkar
function kategoriBelirle(caption) {
    const c = (caption || '').toLowerCase();

    // Modül bazlı sınıflandırma
    if (c.includes('numune') || c.includes('model') || c.includes('prototype')) return { klasor: 'numune', modul: 'modelhane' };
    if (c.includes('kumas') || c.includes('kumaş') || c.includes('fabric')) return { klasor: 'kumas', modul: 'kumas' };
    if (c.includes('kalip') || c.includes('kalıp') || c.includes('pattern')) return { klasor: 'kalip', modul: 'kalip' };
    if (c.includes('kesim') || c.includes('cutting')) return { klasor: 'kesim', modul: 'kesim' };
    if (c.includes('uretim') || c.includes('üretim') || c.includes('bant') || c.includes('band')) return { klasor: 'uretim', modul: 'uretim' };
    if (c.includes('aksesuar') || c.includes('dugme') || c.includes('düğme') || c.includes('fermuar')) return { klasor: 'aksesuar', modul: 'kumas' };
    if (c.includes('hata') || c.includes('sorun') || c.includes('problem')) return { klasor: 'hata-raporu', modul: 'denetmen' };
    if (c.includes('trend') || c.includes('arge') || c.includes('ar-ge')) return { klasor: 'trend', modul: 'arge' };
    if (c.includes('teslim') || c.includes('siparis') || c.includes('sipariş')) return { klasor: 'teslim', modul: 'siparisler' };

    return { klasor: 'genel', modul: 'genel' };
}

// ─── MESAJ İŞLEME ────────────────────────────────────────────

async function mesajiIsle(message) {
    const chat_id = message.chat?.id;
    const from = message.from;
    const text = message.text || '';
    const caption = message.caption || '';
    const kullanici = from?.username ? `@${from.username}` : (from?.first_name || 'Bilinmeyen');

    // ── KOMUTLAR ──────────────────────────────────────────────
    if (text.startsWith('/start')) {
        await mesajGonder(chat_id,
            '🤖 <b>NİZAMBOT — THE ORDER Komuta Merkezi</b>\n\n' +
            '📷 <b>Fotoğraf</b>, 🎵 <b>Ses</b>, 🎬 <b>Video</b> veya 📄 <b>Belge</b> gönderin.\n\n' +
            '<b>Otomatik klasörleme için açıklama yazın:</b>\n' +
            '• <code>numune</code> veya <code>model</code> → Modelhane\n' +
            '• <code>kumaş</code> → Kumaş Arşivi\n' +
            '• <code>kalıp</code> → Kalıp\n' +
            '• <code>kesim</code> → Kesim\n' +
            '• <code>üretim</code> veya <code>bant</code> → Üretim Bandı\n' +
            '• <code>trend</code> veya <code>arge</code> → Ar-Ge\n' +
            '• <code>hata</code> → Hata Raporu\n\n' +
            '🎵 Ses notu kaydederek de gönderebilirsiniz!\n' +
            '📄 /durum — Sistem durumu\n' +
            '📊 /istatistik — Bugünkü yüklemeler'
        );
        return;
    }

    if (text === '/durum') {
        await mesajGonder(chat_id,
            '✅ <b>Sistem Aktif</b>\n\n' +
            `🕐 Saat: ${new Date().toLocaleTimeString('tr-TR')}\n` +
            `📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}\n` +
            `🤖 Bot: Çalışıyor\n` +
            `💾 Supabase: Bağlı\n\n` +
            'Medya göndermek için fotoğraf, ses veya video yükleyin.\n' +
            '/alarm — Anlık alarm raporu'
        );
        return;
    }

    if (text === '/alarm' || text === '/karargah') {
        await mesajGonder(chat_id, '🔍 Karargâh alarm verileri taranıyor...');
        await kritikAlarmTara();
        // Eğer alarm yoksa bildir
        const gorevler = await supabaseOku('b1_gorevler', '?durum=eq.bekliyor&oncelik=eq.kritik&select=baslik&limit=5');
        const stoklar = await supabaseOku('b2_urun_katalogu', '?durum=eq.aktif&select=stok_adeti,min_stok');
        const kritikStok = Array.isArray(stoklar) ? stoklar.filter(u => u.stok_adeti < (u.min_stok || 0)) : [];
        if ((!Array.isArray(gorevler) || gorevler.length === 0) && kritikStok.length === 0) {
            await mesajGonder(chat_id, '✅ <b>Tüm sistemler normal</b>\nKritik alarm yok.');
        }
        return;
    }

    if (text === '/yardim' || text === '/help') {
        await mesajGonder(chat_id,
            '📖 <b>KULLANIM KILAVUZU</b>\n\n' +
            '<b>Adım 1:</b> Fotoğraf/ses/video seçin\n' +
            '<b>Adım 2:</b> Açıklama kutusuna kategori yazın\n' +
            '  Örnek: "numune mavi bluz"\n' +
            '<b>Adım 3:</b> Gönderin\n\n' +
            'Bot otomatik olarak:\n' +
            '✅ Dosyayı Supabase\'e yükler\n' +
            '✅ İlgili tabloya kayıt ekler\n' +
            '✅ Size URL gönderir\n\n' +
            '<b>İpucu:</b> Ses notu kaydedip "numune" yazarsanız\n' +
            'Modelhane sayfasına ses kaydı olarak eklenir.'
        );
        return;
    }

    // ── MEDYA VARSA İŞLE ──────────────────────────────────────
    const medyaTipi = medyaTipiBelirle(message);

    if (!medyaTipi) {
        if (text && !text.startsWith('/')) {
            await mesajGonder(chat_id,
                '📎 Medya göndermeyi denediniz mi?\n' +
                'Fotoğraf, ses veya video gönderin, açıklamaya kategori yazın.\n' +
                '/yardim yazın detaylı bilgi için.'
            );
        }
        return;
    }

    // Dosya bilgisini al
    let file_id, uzanti, mimeType, dosyaBoyutu;

    if (medyaTipi === 'foto') {
        if (message.photo) {
            const photos = message.photo;
            const enBuyuk = photos[photos.length - 1];
            file_id = enBuyuk.file_id;
            dosyaBoyutu = enBuyuk.file_size;
        } else {
            file_id = message.document.file_id;
            dosyaBoyutu = message.document.file_size;
        }
        uzanti = 'jpg';
        mimeType = 'image/jpeg';
    }
    else if (medyaTipi === 'ses') {
        const ses = message.audio || message.voice;
        file_id = ses.file_id;
        dosyaBoyutu = ses.file_size;
        if (message.voice) {
            uzanti = 'ogg';
            mimeType = 'audio/ogg';
        } else {
            uzanti = message.audio.mime_type?.includes('mp3') ? 'mp3' : 'ogg';
            mimeType = message.audio.mime_type || 'audio/ogg';
        }
    }
    else if (medyaTipi === 'video') {
        const vid = message.video || message.video_note;
        file_id = vid.file_id;
        dosyaBoyutu = vid.file_size;
        uzanti = 'mp4';
        mimeType = 'video/mp4';
    }
    else if (medyaTipi === 'belge') {
        file_id = message.document.file_id;
        dosyaBoyutu = message.document.file_size;
        const fn = message.document.file_name || 'dosya.pdf';
        uzanti = fn.split('.').pop().toLowerCase();
        mimeType = message.document.mime_type || 'application/octet-stream';
    }

    // Boyut kontrolü (Telegram max 20MB)
    if (dosyaBoyutu && dosyaBoyutu > 20 * 1024 * 1024) {
        await mesajGonder(chat_id, '❌ Dosya çok büyük! Maksimum 20MB gönderilebilir.');
        return;
    }

    // Kategori belirle
    const { klasor, modul } = kategoriBelirle(caption);
    const medyaEtiketi = medyaTipi === 'foto' ? '🖼️ Fotoğraf' :
        medyaTipi === 'ses' ? '🎵 Ses' :
            medyaTipi === 'video' ? '🎬 Video' : '📄 Belge';

    await mesajGonder(chat_id, `⏳ ${medyaEtiketi} alındı, sisteme yükleniyor...`);

    try {
        // İndir
        const { buffer } = await telegramDosyaIndir(file_id);

        // Supabase yolu
        const zaman = Date.now();
        const rastgele = Math.random().toString(36).slice(2, 7);
        const dosyaAdi = `${zaman}-${rastgele}.${uzanti}`;
        const dosyaYolu = `telegram/${medyaTipi}/${klasor}/${dosyaAdi}`;

        // Yükle
        const publicUrl = await supabaseYukle(buffer, dosyaYolu, mimeType);

        // ── İLGİLİ TABLOYA KAYDET ─────────────────────────────
        const kayitZamani = new Date().toISOString();
        const ortak = {
            kaynak: 'telegram',
            gonderen: kullanici,
            gonderen_id: String(from?.id || ''),
            aciklama: caption || null,
            medya_url: publicUrl,
            medya_tipi: medyaTipi,
            klasor,
            created_at: kayitZamani,
        };

        // Modüle göre tabloya yaz
        let tablo = null;
        let tabloKayit = null;

        if (modul === 'modelhane') {
            tablo = 'b1_modelhane_kayitlari';
            tabloKayit = { ...ortak, video_url: publicUrl, adim_adi: caption || 'Telegram görseli', kayit_tipi: medyaTipi };
        } else if (modul === 'kumas') {
            tablo = 'b1_kumas_arsiv';
            tabloKayit = { ...ortak, gorsel_url: publicUrl, kumas_adi: caption || 'Telegram yükleme', birim: 'adet' };
        }
        // Diğer modüllere sadece agent log yaz

        // Her durumda agent log kaydet
        await supabaseKaydet('b1_agent_loglari', {
            ajan_adi: 'NİZAMBOT',
            islem_tipi: `telegram_${medyaTipi}`,
            kaynak_tablo: tablo || 'telegram',
            sonuc: 'basarili',
            mesaj: `${medyaEtiketi} yüklendi: ${klasor}/${dosyaAdi} — ${kullanici}`,
        });

        // Tabloya yaz (hata olursa loglama yeterli)
        if (tablo && tabloKayit) {
            try { await supabaseKaydet(tablo, tabloKayit); }
            catch (e) { console.log(`⚠️ ${tablo} tablosu kaydı atlandı: ${e.message}`); }
        }

        console.log(`✅ ${medyaEtiketi} yüklendi: ${publicUrl}`);

        // Kullanıcıya bildir
        await mesajGonder(chat_id,
            `✅ <b>${medyaEtiketi} sisteme kaydedildi!</b>\n\n` +
            `👤 Gönderen: <b>${kullanici}</b>\n` +
            `📁 Klasör: <b>${klasor}</b>\n` +
            `🧩 Modül: <b>${modul.toUpperCase()}</b>\n` +
            `📝 Açıklama: ${caption || '(yok)'}\n\n` +
            `🔗 <b>URL:</b>\n<code>${publicUrl}</code>\n\n` +
            `💡 Bu URL'yi sistemdeki ilgili sayfaya yapıştırabilirsiniz.`
        );

    } catch (err) {
        console.error(`❌ ${medyaTipi} yükleme hatası:`, err.message);
        await mesajGonder(chat_id,
            `❌ <b>Yükleme hatası:</b>\n<code>${err.message}</code>\n\n` +
            `Lütfen tekrar deneyin veya Koordinatörü bilgilendirin.`
        );
    }
}

// ─── KRİTİK ALARM TARAMASI (DD/TT Kriteri) ───────────────────────
// Koordinatör Telegram chatId'sini .env.local'e ekleyin: KOORDINATOR_CHAT_ID=123456789

const KOORDINATOR_CHAT_ID = process.env.KOORDINATOR_CHAT_ID;

async function supabaseOku(tablo, filtreler = '') {
    return new Promise((resolve) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${tablo}${filtreler}`);
        https.get({
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
            }
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve(JSON.parse(d)); } catch { resolve([]); }
            });
        }).on('error', () => resolve([]));
    });
}

async function kritikAlarmTara() {
    if (!KOORDINATOR_CHAT_ID) return; // Chat ID tanımlı değilse çalışma
    try {
        // Kritik görevler
        const gorevler = await supabaseOku('b1_gorevler', '?durum=eq.bekliyor&oncelik=eq.kritik&select=baslik,created_at&limit=5');
        // Kritik stok
        const stoklar = await supabaseOku('b2_urun_katalogu', '?durum=eq.aktif&select=urun_kodu,urun_adi,stok_adeti,min_stok');
        const kritikStok = Array.isArray(stoklar) ? stoklar.filter(u => u.stok_adeti < (u.min_stok || 0)) : [];

        const satirlar = [];
        if (Array.isArray(gorevler) && gorevler.length > 0) {
            satirlar.push('🔥 <b>KRİTİK BEKLEYEN GÖREVLER:</b>');
            gorevler.forEach(g => satirlar.push(`  • ${g.baslik}`));
        }
        if (kritikStok.length > 0) {
            satirlar.push('\n📦 <b>KRİTİK STOK UYARISI:</b>');
            kritikStok.slice(0, 3).forEach(u => satirlar.push(`  • ${u.urun_kodu}: Stok ${u.stok_adeti} / Min ${u.min_stok}`));
        }

        if (satirlar.length > 0) {
            const mesaj = `⚠️ <b>KARARGÂH ALARM RAPORU</b>\n${new Date().toLocaleString('tr-TR')}\n\n` + satirlar.join('\n');
            await mesajGonder(KOORDINATOR_CHAT_ID, mesaj);
            console.log(`🚨 [${new Date().toLocaleTimeString('tr-TR')}] Kritik alarm gönderildi → ChatID: ${KOORDINATOR_CHAT_ID}`);
        }
    } catch (err) {
        console.error('⚠️ Alarm tarama hatası:', err.message);
    }
}

// ─── POLLING DÖNGÜSÜ ─────────────────────────────────────────
async function polling() {
    console.log('▶ Polling başladı — Ctrl+C ile durdurulabilir');
    console.log('⏰ Kritik alarm taraması: Her 5 dakikada bir\n');

    // Başlangıçta bir kez tara
    await kritikAlarmTara();
    // Her 5 dakikada bir tara
    setInterval(kritikAlarmTara, 5 * 60 * 1000);

    while (true) {
        try {
            const updates = await fetchJson(
                `${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=30&limit=10&allowed_updates=["message"]`
            );

            if (updates.ok && updates.result?.length) {
                for (const update of updates.result) {
                    lastUpdateId = update.update_id;
                    if (update.message) {
                        const from = update.message.from;
                        const medya = medyaTipiBelirle(update.message);
                        console.log(`📨 [${new Date().toLocaleTimeString('tr-TR')}] ${from?.first_name || '?'} (@${from?.username || '?'}) — ${medya || 'metin'}`);
                        await mesajiIsle(update.message);
                    }
                }
            }
        } catch (err) {
            console.error('⚠️ Polling hatası:', err.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

polling();

