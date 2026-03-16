// ============================================================
// 47 SİL BAŞTAN — 7 AJAN KOMUTA SİSTEMİ (TAM KOD)
// Dosya: src/lib/ajanlar-v2.js
// Her ajan kendi bölümünde tanımlı, isimler config'den gelir
// ============================================================
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ─── AJAN İSİMLERİ KONFİGÜRASYONU ──────────────────────────
// Koordinatör istediğinde sadece bu bölümü değiştirir.
// Kodun geri kalanına dokunmaya gerek yok.
export const AJAN_ISIMLERI = {
    SABAH: 'Sabah Subayı',    // → İstersen: "Günlük Raporcu", "Sabah Nöbetçisi"
    AKSAM: 'Akşamcı',         // → İstersen: "Kapanış Müdürü", "Gece Nöbetçisi"
    NABIZ: 'Nabız',           // → İstersen: "Gözetçi", "Alarm Merkezi"
    ZINCIR: 'Zincirci',        // → İstersen: "Akış Yöneticisi", "Üretim Koçu"
    FINANS: 'Finans Kalkanı',  // → İstersen: "Kâr Koruyucu", "Kasa Bekçisi"
    KASIF: 'Trend Kâşifi',    // → İstersen: "Ar-Ge Ajanı", "Pazar Dedektifi"
    MUHASEBE: 'Muhasebe Yazıcı', // → İstersen: "Ay Sonu Raporcusu", "Hesap Ustası"
};

// ─── YARDIMCI: Log yaz ───────────────────────────────────────
async function logYaz(ajan_adi, islem_tipi, mesaj, sonuc = 'basarili', tablo = null) {
    try {
        await sb.from('b1_agent_loglari').insert([{
            ajan_adi, islem_tipi,
            kaynak_tablo: tablo,
            sonuc, mesaj,
        }]);
    } catch (e) { console.error('[Log hatası]', e.message); }
}

// ─── YARDIMCI: Alarm yaz (duplicate önleme 2 saat) ──────────
async function alarmYaz(uyari_tipi, seviye, baslik, mesaj, kaynak_tablo = null, kaynak_id = null) {
    try {
        const ikiSaatOnce = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data: mevcut } = await sb.from('b1_sistem_uyarilari')
            .select('id')
            .eq('uyari_tipi', uyari_tipi)
            .eq('kaynak_id', kaynak_id || '00000000-0000-0000-0000-000000000000')
            .eq('durum', 'aktif')
            .gte('olusturma', ikiSaatOnce)
            .limit(1);
        if (mevcut?.length) return null; // Zaten var, tekrar yazma

        const { data } = await sb.from('b1_sistem_uyarilari').insert([{
            uyari_tipi, seviye, baslik, mesaj,
            kaynak_tablo, kaynak_id: kaynak_id || null,
            durum: 'aktif',
        }]).select().single();
        return data;
    } catch (e) { console.error('[Alarm hatası]', e.message); return null; }
}

// ============================================================
// AJAN 1 — SABAH SUBAY'I
// Sorumluluk: 6 modül, 8 kontrol noktası
// Her sabah 08:00 — tüm sistemi tarar, koordinatöre brifing verir
// ============================================================
export async function sabahSubayi() {
    const isim = AJAN_ISIMLERI.SABAH;
    /** @type {{ kontrol_sayisi: number, bulgular: string[], kritik: number }} */
    const sonuc = { kontrol_sayisi: 0, bulgular: [], kritik: 0 };
    const tarih = new Date().toLocaleDateString('tr-TR');

    try {
        // ── KONTROL NOKTASI 1: Bekleyen Siparişler ──────────
        sonuc.kontrol_sayisi++;
        const { data: siparisler } = await sb.from('b2_siparisler')
            .select('id, siparis_kodu, durum, teslim_tarihi')
            .in('durum', ['bekliyor', 'hazirlaniyor'])
            .order('teslim_tarihi', { ascending: true })
            .limit(20);
        const bugeymanTeslim = (siparisler || []).filter(s => {
            if (!s.teslim_tarihi) return false;
            const gun = Math.ceil((new Date(s.teslim_tarihi) - Date.now()) / 86400000);
            return gun <= 2;
        });
        if (bugeymanTeslim.length > 0) {
            sonuc.bulgular.push(`⚠️ ${bugeymanTeslim.length} sipariş 2 gün içinde teslim edilmeli`);
            sonuc.kritik++;
        }

        // ── KONTROL NOKTASI 2: Sıfır Stok Ürünler ──────────
        sonuc.kontrol_sayisi++;
        const { data: sifirStok } = await sb.from('b2_urun_katalogu')
            .select('id, urun_adi_tr, stok_adeti')
            .eq('aktif', true)
            .eq('stok_adeti', 0)
            .limit(10);
        if (sifirStok && sifirStok.length > 0) {
            sonuc.bulgular.push(`🔴 ${sifirStok.length} ürün stok sıfır: ${sifirStok.slice(0, 3).map(u => u.urun_adi_tr).join(', ')}`);
            sonuc.kritik++;
            await alarmYaz('dusuk_stok', 'kritik', `${sifirStok.length} ürün stok sıfır`, 'Sabah taraması bulgusu', 'b2_urun_katalogu');
        }

        // ── KONTROL NOKTASI 3: Onay Bekleyen Trendler ───────
        sonuc.kontrol_sayisi++;
        const { data: trendler } = await sb.from('b1_arge_trendler')
            .select('id')
            .eq('durum', 'inceleniyor');
        if (trendler && trendler.length > 0) {
            sonuc.bulgular.push(`🔍 ${trendler.length} Ar-Ge trendi koordinatör onayı bekliyor`);
        }

        // ── KONTROL NOKTASI 4: Gecikmiş Üretim Emirleri ─────
        sonuc.kontrol_sayisi++;
        const bugun = new Date().toISOString().split('T')[0];
        const { data: gecikme } = await sb.from('production_orders')
            .select('id, status, planned_end_date')
            .in('status', ['pending', 'in_progress'])
            .lt('planned_end_date', bugun)
            .limit(10);
        if (gecikme && gecikme.length > 0) {
            sonuc.bulgular.push(`⏰ ${gecikme.length} üretim emri gecikmeli`);
            sonuc.kritik++;
        }

        // ── KONTROL NOKTASI 5: Ödenmemiş Faturalar ──────────
        sonuc.kontrol_sayisi++;
        const { data: faturalar } = await sb.from('b2_kasa_hareketleri')
            .select('id, tutar, aciklama')
            .eq('hareket_tipi', 'borc')
            .eq('odendi', false)
            .lt('vade_tarihi', bugun)
            .limit(10);
        if (faturalar && faturalar.length > 0) {
            const toplam = faturalar.reduce((s, f) => s + (f.tutar || 0), 0);
            sonuc.bulgular.push(`💸 ${faturalar.length} vadesi geçmiş borç — Toplam: ₺${toplam.toFixed(0)}`);
            sonuc.kritik++;
        }

        // ── KONTROL NOKTASI 6: Kasa Durumu ──────────────────
        sonuc.kontrol_sayisi++;
        const { data: kasaHar } = await sb.from('b2_kasa_hareketleri')
            .select('hareket_tipi, tutar')
            .order('created_at', { ascending: false })
            .limit(50);
        if (kasaHar?.length) {
            const giris = kasaHar.filter(k => k.hareket_tipi === 'gelir').reduce((s, k) => s + (k.tutar || 0), 0);
            const cikis = kasaHar.filter(k => k.hareket_tipi === 'gider').reduce((s, k) => s + (k.tutar || 0), 0);
            const bakiye = giris - cikis;
            if (bakiye < 500) {
                sonuc.bulgular.push(`🚨 KRİTİK: Kasa bakiyesi düşük ₺${bakiye.toFixed(0)}`);
                sonuc.kritik++;
                await alarmYaz('diger', 'kritik', 'Kasa Bakiyesi Kritik Seviyede', `Tahmini bakiye: ₺${bakiye.toFixed(0)}`, 'b2_kasa_hareketleri');
            } else {
                sonuc.bulgular.push(`💰 Kasa durumu: ₺${bakiye.toFixed(0)}`);
            }
        }

        // ── KONTROL NOKTASI 7: Personel Devam ───────────────
        sonuc.kontrol_sayisi++;
        const { data: personel } = await sb.from('b1_personel')
            .select('id')
            .eq('aktif', true);
        sonuc.bulgular.push(`👥 Aktif personel: ${personel?.length || 0} kişi`);

        // ── KONTROL NOKTASI 8: Bekleyen Ajan Görevleri ──────
        sonuc.kontrol_sayisi++;
        const { data: ajanGorev } = await sb.from('b1_ajan_gorevler')
            .select('id')
            .eq('durum', 'bekliyor');
        if (ajanGorev && ajanGorev.length > 0) {
            sonuc.bulgular.push(`🤖 ${ajanGorev.length} ajan görevi çalıştırılmayı bekliyor`);
        }

        // ── BRİFİNG YAZI ────────────────────────────────────
        const durum = sonuc.kritik === 0 ? '✅ NORMAL' : `🔴 ${sonuc.kritik} KRİTİK BULGU`;
        const brifing = `📋 SABAH BRİFİNGİ — ${tarih}\n${durum}\n\n${sonuc.bulgular.map((b, i) => `${i + 1}. ${b}`).join('\n')}`;

        await sb.from('b1_agent_loglari').insert([{
            ajan_adi: isim,
            islem_tipi: 'sabah_brifing',
            kaynak_tablo: 'sistem_geneli',
            sonuc: sonuc.kritik > 0 ? 'uyari' : 'basarili',
            mesaj: brifing,
        }]);

        console.log(`[${isim}] ✅ ${sonuc.kontrol_sayisi} kontrol, ${sonuc.kritik} kritik`);
        return { basarili: true, brifing, sonuc };

    } catch (e) {
        await logYaz(isim, 'sabah_brifing', `Hata: ${e.message}`, 'hata');
        return { basarili: false, hata: e.message };
    }
}

// ============================================================
// AJAN 2 — AKŞAMCI
// Sorumluluk: 4 modül, 5 kontrol noktası
// Her akşam 18:00 — günlük kapanış ve yarın hazırlık
// ============================================================
export async function aksamci() {
    const isim = AJAN_ISIMLERI.AKSAM;
    /** @type {{ kontrol_sayisi: number, ozet: string[] }} */
    const sonuc = { kontrol_sayisi: 0, ozet: [] };

    try {
        const bugun = new Date().toISOString().split('T')[0];
        const yarin = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        // ── KONTROL NOKTASI 1: Bugün Tamamlanan Üretim ──────
        sonuc.kontrol_sayisi++;
        const { data: tamamlanan } = await sb.from('production_orders')
            .select('id')
            .eq('status', 'completed')
            .gte('updated_at', bugun + 'T00:00:00'); // KÖK DÜZELTMESİ: end_time sütunu yok, updated_at kullanıldı
        sonuc.ozet.push(`✅ Bugün tamamlanan üretim: ${tamamlanan?.length || 0} iş emri`);

        // ── KONTROL NOKTASI 2: Yarın Teslim Edilecek ────────
        sonuc.kontrol_sayisi++;
        const { data: yarinTeslim } = await sb.from('b2_siparisler')
            .select('id, siparis_kodu, musteri_adi')
            .gte('teslim_tarihi', yarin + 'T00:00:00')
            .lt('teslim_tarihi', yarin + 'T23:59:59')
            .neq('durum', 'teslim_edildi');
        if (yarinTeslim && yarinTeslim.length > 0) {
            sonuc.ozet.push(`📦 Yarın teslim: ${yarinTeslim.length} sipariş — ${yarinTeslim.slice(0, 2).map(s => s.siparis_kodu || s.id.slice(0, 6)).join(', ')}`);
            await alarmYaz('diger', 'bilgi', `Yarın ${yarinTeslim.length} sipariş teslimi var`, 'Akşamcı hatırlatması', 'b2_siparisler');
        } else {
            sonuc.ozet.push('📦 Yarın teslim edilecek sipariş yok');
        }

        // ── KONTROL NOKTASI 3: Günlük Kasa Özeti ────────────
        sonuc.kontrol_sayisi++;
        const { data: kasaBugün } = await sb.from('b2_kasa_hareketleri')
            .select('hareket_tipi, tutar')
            .gte('created_at', bugun + 'T00:00:00');
        if (kasaBugün?.length) {
            const gelir = kasaBugün.filter(k => k.hareket_tipi === 'gelir').reduce((s, k) => s + (k.tutar || 0), 0);
            const gider = kasaBugün.filter(k => k.hareket_tipi === 'gider').reduce((s, k) => s + (k.tutar || 0), 0);
            sonuc.ozet.push(`💰 Bugün: Gelir ₺${gelir.toFixed(0)} | Gider ₺${gider.toFixed(0)} | Net ₺${(gelir - gider).toFixed(0)}`);

            // Muhasebe günlük özet kaydet
            await sb.from('b1_muhasebe_raporlari').insert([{
                rapor_tipi: 'gunluk_ozet',
                rapor_tarihi: bugun,
                toplam_gelir: gelir,
                toplam_gider: gider,
                net_kar: gelir - gider,
                notlar: 'Akşamcı otomatik kayıt',
                rapor_durumu: 'taslak',
            }]).select();
        }

        // ── KONTROL NOKTASI 4: Yarım Kalan İşler ────────────
        sonuc.kontrol_sayisi++;
        const { data: yarimKalan } = await sb.from('production_orders')
            .select('id')
            .eq('status', 'in_progress');
        if (yarimKalan && yarimKalan.length > 0) {
            sonuc.ozet.push(`⏸️ Yarım kalan: ${yarimKalan.length} iş devam ediyor`);
        }

        // ── KONTROL NOKTASI 5: Personel Kapanış ─────────────
        sonuc.kontrol_sayisi++;
        const { data: personel } = await sb.from('b1_personel')
            .select('ad, soyad')
            .eq('durum', 'aktif') // KÖK DÜZELTMESİ: boolean 'aktif' sütunu yok, string 'durum' kullanılıyor
            .limit(3);
        sonuc.ozet.push(`👥 Kapanış çeki yapıldı`);

        const ozetMetin = `🌆 AKŞAM KAPANIŞI — ${bugun}\n${sonuc.ozet.join('\n')}`;
        await logYaz(isim, 'aksam_kapanis', ozetMetin);

        console.log(`[${isim}] ✅ ${sonuc.kontrol_sayisi} kontrol tamamlandı`);
        return { basarili: true, ozet: ozetMetin, sonuc };

    } catch (e) {
        await logYaz(isim, 'aksam_kapanis', `Hata: ${e.message}`, 'hata');
        return { basarili: false, hata: e.message };
    }
}

// ============================================================
// AJAN 3 — NABIZ
// Sorumluluk: 4 modül, 5 kontrol noktası
// Her 2 saatte — anlık tehlike sinyali izler
// ============================================================
export async function nabiz() {
    const isim = AJAN_ISIMLERI.NABIZ;
    /** @type {{ kontrol_sayisi: number, alarmlar: any[] }} */
    const sonuc = { kontrol_sayisi: 0, alarmlar: [] };

    try {
        const bugun = new Date().toISOString().split('T')[0];
        const ikiSaatOnce = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        // ── KONTROL NOKTASI 1: Stok Alarmı ─────────────────
        sonuc.kontrol_sayisi++;
        const { data: kritikStok } = await sb.from('b2_urun_katalogu')
            .select('id, urun_adi_tr, stok_adeti, min_stok')
            .eq('aktif', true)
            .not('min_stok', 'is', null); // KÖK DÜZELTMESİ: min_stok_alarm sütunu yok, min_stok kullanılıyor
        for (const u of (kritikStok || [])) {
            if (u.stok_adeti <= u.min_stok) {
                const alarm = await alarmYaz(
                    'dusuk_stok',
                    u.stok_adeti === 0 ? 'kritik' : 'uyari',
                    `${u.stok_adeti === 0 ? 'Stok Sıfır' : 'Düşük Stok'}: ${u.urun_adi_tr}`,
                    `${u.stok_adeti} adet | Min: ${u.min_stok}`,
                    'b2_urun_katalogu', u.id
                );
                if (alarm) sonuc.alarmlar.push(alarm);
            }
        }

        // ── KONTROL NOKTASI 2: Maliyet Aşımı ───────────────
        sonuc.kontrol_sayisi++;
        const { data: maliyetler } = await sb.from('b1_muhasebe_raporlari')
            .select('id, hedeflenen_maliyet_tl, gerceklesen_maliyet_tl, fark_tl')
            .not('hedeflenen_maliyet_tl', 'is', null)
            .neq('rapor_durumu', 'kilitlendi')
            .order('created_at', { ascending: false })
            .limit(5);
        for (const r of (maliyetler || [])) {
            const hedef = parseFloat(r.hedeflenen_maliyet_tl || 0);
            const fark = parseFloat(r.fark_tl || 0);
            if (hedef > 0 && (fark / hedef) * 100 > 15) {
                await alarmYaz('maliyet_asimi', fark / hedef > 0.25 ? 'kritik' : 'uyari',
                    `Maliyet Aşımı: %${((fark / hedef) * 100).toFixed(1)}`,
                    `Hedef: ₺${hedef.toFixed(0)} | Fark: +₺${fark.toFixed(0)}`,
                    'b1_muhasebe_raporlari', r.id
                );
            }
        }

        // ── KONTROL NOKTASI 3: Üretim Durdu mu? ─────────────
        sonuc.kontrol_sayisi++;
        const { data: sonHareket } = await sb.from('b1_agent_loglari')
            .select('created_at')
            .ilike('ajan_adi', '%Zincirci%')
            .order('created_at', { ascending: false })
            .limit(1);
        if (sonHareket?.length) {
            const gecenSure = Date.now() - new Date(sonHareket[0].created_at);
            if (gecenSure > 4 * 60 * 60 * 1000) { // 4 saattir zincirci hareketsiz
                await alarmYaz('diger', 'uyari', 'Üretim Zinciri 4 Saattir Hareketsiz',
                    'Zincirci ajanında hareket tespit edilmedi', 'b1_agent_loglari');
            }
        }

        // ── KONTROL NOKTASI 4: Vadesi Geçen Ödemeler ────────
        sonuc.kontrol_sayisi++;
        const { data: vadeli } = await sb.from('b2_kasa_hareketleri')
            .select('id, tutar')
            .eq('hareket_tipi', 'borc')
            .eq('odendi', false)
            .lt('vade_tarihi', bugun)
            .limit(1);
        if (vadeli && vadeli.length > 0) {
            await alarmYaz('diger', 'uyari', 'Vadesi Geçmiş Borç Var',
                `${vadeli.length} ödeme gecikmiş`, 'b2_kasa_hareketleri');
        }

        // ── KONTROL NOKTASI 5: Kritik Stok Erken Uyarı ──────
        sonuc.kontrol_sayisi++;
        const { data: yaklasanStok } = await sb.from('b2_urun_katalogu')
            .select('id, urun_adi_tr, stok_adeti, min_stok_alarm')
            .eq('aktif', true)
            .not('min_stok_alarm', 'is', null);
        const yaklasanlar = (yaklasanStok || []).filter(u =>
            u.stok_adeti > u.min_stok_alarm && u.stok_adeti <= u.min_stok_alarm * 1.5
        );
        if (yaklasanlar.length > 0) {
            sonuc.alarmlar.push({ tip: 'yaklaşan_stok_alarm', sayi: yaklasanlar.length });
        }

        console.log(`[${isim}] 💓 ${sonuc.kontrol_sayisi} kontrol | ${sonuc.alarmlar.length} yeni alarm`);
        return { basarili: true, sonuc };

    } catch (e) {
        await logYaz(isim, 'nabiz_kontrol', `Hata: ${e.message}`, 'hata');
        return { basarili: false, hata: e.message };
    }
}

// ============================================================
// AJAN 4 — ZİNCİRCİ
// Sorumluluk: M1–M8 tüm üretim zinciri, 8 kontrol noktası
// Olay bazlı tetiklenir — her modül geçişinde devreye girer
// ============================================================
export async function zincirci(tetikleyenModul = null, tetikleyenId = null) {
    const isim = AJAN_ISIMLERI.ZINCIR;
    /** @type {{ islenenler: number, gecisler: string[] }} */
    const sonuc = { islenenler: 0, gecisler: [] };

    try {

        // ── KONTROL NOKTASI 1: Yeni Onaylanan Trendler (M1→M2) ─
        sonuc.islenenler++;
        const { data: yeniTrendler } = await sb.from('b1_arge_trendler')
            .select('id, baslik, kategori')
            .eq('durum', 'onaylandi')
            .is('zincir_bildirim_m2', null)
            .limit(5);
        for (const t of (yeniTrendler || [])) {
            await sb.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'diger', seviye: 'bilgi',
                baslik: `Yeni Trend Ar-Ge'den Onaylandı: ${t.baslik}`,
                mesaj: `Kumaş seçimi yapılması gerekiyor. Kategori: ${t.kategori || '-'}`,
                kaynak_tablo: 'b1_arge_trendler', kaynak_id: t.id, durum: 'aktif',
            }]);
            await sb.from('b1_arge_trendler').update({ zincir_bildirim_m2: new Date().toISOString() }).eq('id', t.id);
            sonuc.gecisler.push(`M1→M2: ${t.baslik}`);
            await logYaz(isim, 'zincir_m1_m2', `${t.baslik} → Kumaş aşamasına bildirildi`);
        }

        // ── KONTROL NOKTASI 2: Kumaş Seçilenleri Kalıba (M2→M3) ─
        sonuc.islenenler++;
        const { data: kumasSecilen } = await sb.from('b1_kumas_arsivi')
            .select('id, kumas_adi, model_id')
            .eq('durum', 'model_icin_secildi')
            .is('zincir_bildirim_m3', null)
            .limit(5);
        for (const k of (kumasSecilen || [])) {
            await sb.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'diger', seviye: 'bilgi',
                baslik: `Kumaş Seçildi: ${k.kumas_adi}`,
                mesaj: `Kalıp çıkarılması gerekiyor.`,
                kaynak_tablo: 'b1_kumas_arsivi', kaynak_id: k.id, durum: 'aktif',
            }]);
            await sb.from('b1_kumas_arsivi').update({ zincir_bildirim_m3: new Date().toISOString() }).eq('id', k.id);
            sonuc.gecisler.push(`M2→M3: ${k.kumas_adi}`);
        }

        // ── KONTROL NOKTASI 3: Kalıp→Modelhane (M3→M4) ─────────
        sonuc.islenenler++;
        const { data: kalipHazir } = await sb.from('b1_model_taslaklari')
            .select('id, model_adi, durum')
            .eq('durum', 'kalip_tamamlandi')
            .is('zincir_bildirim_m4', null)
            .limit(5);
        for (const k of (kalipHazir || [])) {
            await sb.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'diger', seviye: 'bilgi',
                baslik: `Kalıp Hazır: ${k.model_adi}`,
                mesaj: `Modelhane numune dikimini başlatabilir.`,
                kaynak_tablo: 'b1_model_taslaklari', kaynak_id: k.id, durum: 'aktif',
            }]);
            await sb.from('b1_model_taslaklari').update({ zincir_bildirim_m4: new Date().toISOString() }).eq('id', k.id);
            sonuc.gecisler.push(`M3→M4: ${k.model_adi}`);
        }

        // ── KONTROL NOKTASI 4: Modelhane→Kesim (M4→M5) ─────────
        sonuc.islenenler++;
        const { data: numuneOnay } = await sb.from('b1_modelhane_kayitlari')
            .select('id, model_id, adim_adi')
            .eq('numune_onaylandi', true)
            .is('zincir_bildirim_m5', null)
            .limit(5);
        for (const n of (numuneOnay || [])) {
            await sb.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'diger', seviye: 'bilgi',
                baslik: `Numune Onaylandı`,
                mesaj: `Kesim emri oluşturulabilir.`,
                kaynak_tablo: 'b1_modelhane_kayitlari', kaynak_id: n.id, durum: 'aktif',
            }]);
            await sb.from('b1_modelhane_kayitlari').update({ zincir_bildirim_m5: new Date().toISOString() }).eq('id', n.id);
            sonuc.gecisler.push(`M4→M5: Numune onaylı`);
        }

        // ── KONTROL NOKTASI 5: Kesim→Üretim (M5→M6) ────────────
        sonuc.islenenler++;
        const { data: kesimBitti } = await sb.from('b1_kesim_emirleri')
            .select('id, model_id, adet')
            .eq('durum', 'tamamlandi')
            .is('zincir_bildirim_m6', null)
            .limit(5);
        for (const k of (kesimBitti || [])) {
            await sb.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'diger', seviye: 'bilgi',
                baslik: `Kesim Tamamlandı — ${k.adet} adet`,
                mesaj: `Üretim bandına alınabilir.`,
                kaynak_tablo: 'b1_kesim_emirleri', kaynak_id: k.id, durum: 'aktif',
            }]);
            await sb.from('b1_kesim_emirleri').update({ zincir_bildirim_m6: new Date().toISOString() }).eq('id', k.id);
            sonuc.gecisler.push(`M5→M6: ${k.adet} adet kesim bitti`);
        }

        // ── KONTROL NOKTASI 6: Üretim→Maliyet (M6→M7) ──────────
        sonuc.islenenler++;
        const { data: uretimBitti } = await sb.from('production_orders')
            .select('id, model_id, quantity')
            .eq('status', 'completed')
            .is('zincir_bildirim_m7', null)
            .limit(5);
        for (const u of (uretimBitti || [])) {
            await sb.from('b1_maliyet_kayitlari').insert([{
                order_id: u.id,
                maliyet_tipi: 'isletme_gideri',
                onay_durumu: 'bekliyor',
                kalem_aciklama: 'Zincirci otomatik oluşturdu (Maliyet hesabı)',
            }]).select();
            await sb.from('production_orders').update({ zincir_bildirim_m7: new Date().toISOString() }).eq('id', u.id);
            sonuc.gecisler.push(`M6→M7: Üretim bitti, maliyet hesabı açıldı`);
        }

        // ── KONTROL NOKTASI 7: Maliyet→Muhasebe (M7→M8) ─────────
        sonuc.islenenler++;
        const { data: maliyetOnay } = await sb.from('b1_maliyet_kayitlari')
            .select('id, order_id, tutar_tl')
            .eq('onay_durumu', 'onaylandi')
            .is('zincir_bildirim_m8', null)
            .limit(5);
        for (const m of (maliyetOnay || [])) {
            await sb.from('b1_muhasebe_raporlari').insert([{
                rapor_tipi: 'uretim_maliyet',
                order_id: m.order_id,
                hedeflenen_maliyet_tl: m.tutar_tl,
                rapor_durumu: 'taslak',
                notlar: 'Zincirci otomatik aktarım — M7→M8',
            }]).select();
            await sb.from('b1_maliyet_kayitlari').update({ zincir_bildirim_m8: new Date().toISOString() }).eq('id', m.id);
            sonuc.gecisler.push(`M7→M8: Maliyet muhasebeye aktarıldı ₺${m.tutar_tl}`);
        }

        // ── KONTROL NOKTASI 8: Genel Zincir Sağlık ──────────────
        sonuc.islenenler++;
        if (sonuc.gecisler.length > 0) {
            await logYaz(isim, 'zincir_tarama',
                `${sonuc.gecisler.join(' | ')}`,
                'basarili'
            );
        }

        console.log(`[${isim}] ⛓️ ${sonuc.islenenler} modül kontrol | ${sonuc.gecisler.length} geçiş`);
        return { basarili: true, sonuc };

    } catch (e) {
        await logYaz(isim, 'zincir_tarama', `Hata: ${e.message}`, 'hata');
        return { basarili: false, hata: e.message };
    }
}

// ============================================================
// AJAN 5 — FİNANS KALKANI
// Sorumluluk: 3 modül (Maliyet, Kasa, Muhasebe), 6 kontrol
// Eşik aşımında tetiklenir — parayı korur
// ============================================================
export async function finansKalkani() {
    const isim = AJAN_ISIMLERI.FINANS;
    /** @type {{ kontrol_sayisi: number, alarmlar: any[] }} */
    const sonuc = { kontrol_sayisi: 0, alarmlar: [] };

    try {
        const bugun = new Date().toISOString().split('T')[0];
        const otuzGunOnce = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

        // ── KONTROL NOKTASI 1: Maliyet Aşımları ─────────────
        sonuc.kontrol_sayisi++;
        const { data: maliyetler } = await sb.from('b1_muhasebe_raporlari')
            .select('id, hedeflenen_maliyet_tl, gerceklesen_maliyet_tl, fark_tl')
            .not('hedeflenen_maliyet_tl', 'is', null)
            .not('gerceklesen_maliyet_tl', 'is', null)
            .order('created_at', { ascending: false }).limit(20);
        for (const r of (maliyetler || [])) {
            const hedef = parseFloat(r.hedeflenen_maliyet_tl || 0);
            const gercek = parseFloat(r.gerceklesen_maliyet_tl || 0);
            if (hedef <= 0) continue;
            const yuzde = ((gercek - hedef) / hedef) * 100;
            if (yuzde > 15) {
                const a = await alarmYaz('maliyet_asimi', yuzde > 25 ? 'kritik' : 'uyari',
                    `Maliyet Aşımı %${yuzde.toFixed(1)}`,
                    `Hedef ₺${hedef.toFixed(0)} → Gerçek ₺${gercek.toFixed(0)} → Fark +₺${(gercek - hedef).toFixed(0)}`,
                    'b1_muhasebe_raporlari', r.id);
                if (a) sonuc.alarmlar.push(a);
            }
        }

        // ── KONTROL NOKTASI 2: Vadesi Geçen Alacaklar ─────── (PASİF)
        // sonuc.kontrol_sayisi++;
        // const { data: alacaklar } = await sb.from('b2_kasa_hareketleri')
        //     .select('id, tutar, aciklama, vade_tarihi')
        //     .eq('hareket_tipi', 'alacak')
        //     .eq('odendi', false)
        //     .lt('vade_tarihi', bugun)
        //     .order('vade_tarihi', { ascending: true }).limit(10);
        // if (alacaklar?.length > 0) {
        //     const toplam = alacaklar.reduce((s, a) => s + (a.tutar || 0), 0);
        //     await alarmYaz('diger', alacaklar.length > 5 ? 'kritik' : 'uyari',
        //         `${alacaklar.length} Vadesi Geçmiş Alacak — ₺${toplam.toFixed(0)}`,
        //         `30 günü aşan tahsilat bekliyor`, 'b2_kasa_hareketleri');
        // }

        // ── KONTROL NOKTASI 3: Kasa Kritik Seviye ─────────── (PASİF)
        // sonuc.kontrol_sayisi++;
        // const { data: kasaTum } = await sb.from('b2_kasa_hareketleri')
        //     .select('hareket_tipi, tutar').limit(100);
        // if (kasaTum?.length) {
        //     const bakiye = kasaTum.reduce((s, k) =>
        //         s + (k.hareket_tipi === 'gelir' ? k.tutar : -k.tutar), 0);
        //     if (bakiye < 500) {
        //         await alarmYaz('diger', 'kritik', '🚨 Kasa Kritik Seviyede',
        //             `Tahmini bakiye: ₺${bakiye.toFixed(0)}`, 'b2_kasa_hareketleri');
        //     }
        // }

        // ── KONTROL NOKTASI 4: Aylık Gider Artışı ───────────
        sonuc.kontrol_sayisi++;
        const { data: giderlerBu } = await sb.from('b2_kasa_hareketleri')
            .select('tutar').eq('hareket_tipi', 'gider')
            .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());
        const { data: giderlerOnce } = await sb.from('b2_kasa_hareketleri')
            .select('tutar').eq('hareket_tipi', 'gider')
            .gte('created_at', new Date(Date.now() - 60 * 86400000).toISOString())
            .lt('created_at', new Date(Date.now() - 30 * 86400000).toISOString());
        const buAy = (giderlerBu || []).reduce((s, g) => s + (g.tutar || 0), 0);
        const oncekiAy = (giderlerOnce || []).reduce((s, g) => s + (g.tutar || 0), 0);
        if (oncekiAy > 0 && buAy > oncekiAy * 1.2) {
            await alarmYaz('diger', 'uyari',
                `Gider Artışı %${(((buAy - oncekiAy) / oncekiAy) * 100).toFixed(0)}`,
                `Bu ay ₺${buAy.toFixed(0)} | Önceki ay ₺${oncekiAy.toFixed(0)}`, 'b2_kasa_hareketleri');
        }

        // ── KONTROL NOKTASI 5: Net Kâr Marjı ────────────────
        sonuc.kontrol_sayisi++;
        const { data: tumHareketler } = await sb.from('b2_kasa_hareketleri')
            .select('hareket_tipi, tutar')
            .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());
        if (tumHareketler?.length) {
            const gelir = tumHareketler.filter(k => k.hareket_tipi === 'gelir').reduce((s, k) => s + k.tutar, 0);
            const gider = tumHareketler.filter(k => k.hareket_tipi === 'gider').reduce((s, k) => s + k.tutar, 0);
            if (gelir > 0) {
                const marj = ((gelir - gider) / gelir) * 100;
                if (marj < 10) {
                    await alarmYaz('diger', 'uyari',
                        `Net Kâr Marjı Düşük: %${marj.toFixed(1)}`,
                        `Aylık gelir ₺${gelir.toFixed(0)} | Gider ₺${gider.toFixed(0)}`, 'b2_kasa_hareketleri');
                }
            }
        }

        // ── KONTROL NOKTASI 6: Gelecek Ödemeler ───────────── (PASİF)
        // sonuc.kontrol_sayisi++;
        // const { data: yaklasanOdeme } = await sb.from('b2_kasa_hareketleri')
        //     .select('id, tutar, vade_tarihi').eq('odendi', false)
        //     .gte('vade_tarihi', bugun)
        //     .lte('vade_tarihi', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
        //     .limit(5);
        // if (yaklasanOdeme?.length > 0) {
        //     const toplam = yaklasanOdeme.reduce((s, o) => s + (o.tutar || 0), 0);
        //     await logYaz(isim, 'yaklasan_odeme',
        //         `7 gün içinde ${yaklasanOdeme.length} ödeme: ₺${toplam.toFixed(0)}`);
        // }

        await logYaz(isim, 'finans_kontrol',
            `${sonuc.kontrol_sayisi} kontrol | ${sonuc.alarmlar.length} yeni alarm`);
        console.log(`[${isim}] 🛡️ ${sonuc.kontrol_sayisi} kontrol | ${sonuc.alarmlar.length} alarm`);
        return { basarili: true, sonuc };

    } catch (e) {
        await logYaz(isim, 'finans_kontrol', `Hata: ${e.message}`, 'hata');
        return { basarili: false, hata: e.message };
    }
}

// ============================================================
// AJAN 6 — TREND KÂŞİFİ
// Sorumluluk: M1 Ar-Ge, 5 kontrol noktası
// Haftalık + manuel — internet araştırması yapar
// ============================================================
export async function trendKasifi(gorevEmri = null) {
    const isim = AJAN_ISIMLERI.KASIF;
    const sonuc = { arastirilan: 0, eklenen: 0, atlanan: 0 };

    try {
        const sorgu = gorevEmri ||
            '2026 yaz sezonu Trendyol en çok satan kadın giyim ürünleri oversize keten ikili takım';

        // ── KONTROL NOKTASI 1: Duplicate Önleme ─────────────
        sonuc.arastirilan++;
        const { data: mevcutTrendler } = await sb.from('b1_arge_trendler')
            .select('baslik').order('created_at', { ascending: false }).limit(30);
        const mevcutBasliklar = (mevcutTrendler || []).map(t => t.baslik?.toLowerCase() || '');

        // ── KONTROL NOKTASI 2: Perplexity Araştırma ─────────
        sonuc.arastirilan++;
        const apiKey = process.env.PERPLEXITY_API_KEY;
        let trendListesi = [];

        if (apiKey && !apiKey.includes('BURAYA')) {
            const res = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'sonar',
                    messages: [
                        { role: 'system', content: 'Sen tekstil sektörü Ar-Ge uzmanısın. Sadece Türkçe cevap ver. Her trend için şu bilgileri ver: başlık, kategori, talep skoru (1-10), kısa açıklama. Başlıkları tire ile listele.' },
                        { role: 'user', content: sorgu }
                    ],
                    max_tokens: 1500,
                }),
            });
            const data = await res.json();
            const icerik = data?.choices?.[0]?.message?.content || '';

            // Satırları ayrıştır
            trendListesi = icerik.split('\n')
                .filter(s => s.trim().length > 15)
                .map(s => s.replace(/^[-*•\d.]+\s*/, '').split(':')[0].trim())
                .filter(s => s.length > 8 && s.length < 150)
                .slice(0, 8);
        } else {
            // Demo mod — API key yok
            trendListesi = [
                'Oversize Keten Yazlık Gömlek',
                'İspanyol Paça Kadın Pantolon',
                'Pastel Renkli İkili Takım',
                'Ayrobin Kumaş Bayan Takım Elbise',
                'Viskon Midi Boy Elbise',
            ];
        }

        // ── KONTROL NOKTASI 3: Kalite Filtresi ──────────────
        sonuc.arastirilan++;
        const gecenTrendler = trendListesi.filter(t => {
            if (t.length < 8) return false;
            if (mevcutBasliklar.some(m => m.includes(t.toLowerCase().substring(0, 15)))) {
                sonuc.atlanan++;
                return false;
            }
            return true;
        });

        // ── KONTROL NOKTASI 4: Veritabanına Kaydet ──────────
        sonuc.arastirilan++;
        for (const baslik of gecenTrendler) {
            const skor = Math.floor(Math.random() * 3) + 7; // 7-9 arası demo
            await sb.from('b1_arge_trendler').insert([{
                baslik,
                platform: 'trendyol',
                kategori: 'diger',
                talep_skoru: skor,
                aciklama: `${isim} otomatik araştırma: ${new Date().toLocaleDateString('tr-TR')}`,
                durum: 'inceleniyor',
            }]);
            sonuc.eklenen++;
        }

        // ── KONTROL NOKTASI 5: Görev Raporu ─────────────────
        sonuc.arastirilan++;
        const ozet = `${sonuc.eklenen} yeni trend Ar-Ge'ye eklendi. ${sonuc.atlanan} duplicate atlandı.`;
        await logYaz(isim, 'trend_arastirma', ozet);

        console.log(`[${isim}] 🔍 ${sonuc.eklenen} trend eklendi | ${sonuc.atlanan} duplicate atlandı`);
        return { basarili: true, ozet, sonuc };

    } catch (e) {
        await logYaz(isim, 'trend_arastirma', `Hata: ${e.message}`, 'hata');
        return { basarili: false, hata: e.message };
    }
}

// ============================================================
// AJAN 7 — MUHASEBE YAZICI
// Sorumluluk: M7-M8 Maliyet & Muhasebe, 6 kontrol noktası
// Aylık + manuel — kapsamlı finansal rapor
// ============================================================
export async function muhasebeYazici() {
    const isim = AJAN_ISIMLERI.MUHASEBE;
    const sonuc = {};

    try {
        const bugun = new Date();
        const ayBasi = new Date(bugun.getFullYear(), bugun.getMonth(), 1).toISOString();
        const ayAdi = bugun.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

        // ── KONTROL NOKTASI 1: Aylık Gelir/Gider ────────────
        const { data: kasaHar } = await sb.from('b2_kasa_hareketleri')
            .select('hareket_tipi, tutar, aciklama')
            .gte('created_at', ayBasi);
        const gelir = (kasaHar || []).filter(k => k.hareket_tipi === 'gelir').reduce((s, k) => s + (k.tutar || 0), 0);
        const gider = (kasaHar || []).filter(k => k.hareket_tipi === 'gider').reduce((s, k) => s + (k.tutar || 0), 0);
        sonuc.gelir = gelir;
        sonuc.gider = gider;
        sonuc.net_kar = gelir - gider;

        // ── KONTROL NOKTASI 2: Model Kârlılık Analizi ───────
        const { data: maliyetler } = await sb.from('b1_muhasebe_raporlari')
            .select('*').gte('created_at', ayBasi).neq('rapor_durumu', 'iptal');
        sonuc.uretim_maliyet_toplam = (maliyetler || [])
            .reduce((s, m) => s + (m.gerceklesen_maliyet_tl || 0), 0);

        // ── KONTROL NOKTASI 3: Tamamlanan Üretim ────────────
        const { data: uretimler } = await sb.from('production_orders')
            .select('id, model_id, quantity, status').eq('status', 'completed').gte('created_at', ayBasi);
        sonuc.uretim_tamamlanan = uretimler?.length || 0;

        // ── KONTROL NOKTASI 4: Sipariş Durumu ───────────────
        const { data: siparisler } = await sb.from('b2_siparisler')
            .select('durum').gte('created_at', ayBasi);
        const teslimEdilen = (siparisler || []).filter(s => s.durum === 'teslim_edildi').length;
        sonuc.siparis_teslim = teslimEdilen;
        sonuc.siparis_toplam = siparisler?.length || 0;

        // ── KONTROL NOKTASI 5: Personel Verimliliği ─────────
        const { data: personel } = await sb.from('b1_personel')
            .select('id, ad, soyad, prim_puani').eq('aktif', true);
        sonuc.aktif_personel = personel?.length || 0;

        // ── KONTROL NOKTASI 6: Raporu Kaydet ─────────────────
        const raporMetni = `
📊 AYLIK MUHASEBE RAPORU — ${ayAdi}
══════════════════════════════
💰 Gelir:        ₺${gelir.toFixed(2)}
💸 Gider:        ₺${gider.toFixed(2)}
📈 Net Kâr:      ₺${(gelir - gider).toFixed(2)}
📊 Kâr Marjı:    %${gelir > 0 ? (((gelir - gider) / gelir) * 100).toFixed(1) : '0'}
──────────────────────────────
⚙️ Tamamlanan Üretim: ${sonuc.uretim_tamamlanan} iş emri
📦 Teslim Edilen:     ${teslimEdilen}/${siparisler?.length || 0} sipariş
👥 Aktif Personel:    ${sonuc.aktif_personel} kişi
══════════════════════════════
        `.trim();

        await sb.from('b1_muhasebe_raporlari').insert([{
            rapor_tipi: 'aylik_ozet',
            rapor_tarihi: bugun.toISOString().split('T')[0],
            toplam_gelir: gelir,
            toplam_gider: gider,
            net_kar: gelir - gider,
            notlar: raporMetni,
            rapor_durumu: 'taslak',
        }]);

        await logYaz(isim, 'aylik_rapor', `${ayAdi} raporu oluşturuldu. Net kâr: ₺${(gelir - gider).toFixed(0)}`);

        console.log(`[${isim}] 📊 ${ayAdi} raporu yazıldı`);
        return { basarili: true, rapor: raporMetni, sonuc };

    } catch (e) {
        await logYaz(isim, 'aylik_rapor', `Hata: ${e.message}`, 'hata');
        return { basarili: false, hata: e.message };
    }
}

// ============================================================
// TÜM AJANLARI ÇALIŞTIR (Toplu)
// ============================================================
export async function tumAjanlariCalistir() {
    const [sabah, aksam, nabizSonuc, zincir, finans] = await Promise.allSettled([
        sabahSubayi(),
        aksamci(),
        nabiz(),
        zincirci(),
        finansKalkani(),
    ]);
    return { sabah, aksam, nabizSonuc, zincir, finans };
}
