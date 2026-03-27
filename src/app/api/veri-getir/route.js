import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─── GÜVENLİK YAMASI: Parametre Doğrulama ───────────────────────────
// SQL injection ve tehlikeli select kalıplarını engelle
const GUVENLI_KOLON_REGEX = /^[a-zA-Z0-9_,.*() ]+$/;
const TEHLIKELI_KALIPLAR = /(\b(DROP|DELETE|INSERT|UPDATE|ALTER|EXEC|UNION|SELECT\s+\*\s+FROM)\b|--|;|\/\*)/i;

function parametreGuvenliMi(deger) {
    if (!deger || typeof deger !== 'string') return false;
    if (TEHLIKELI_KALIPLAR.test(deger)) return false;
    if (!GUVENLI_KOLON_REGEX.test(deger)) return false;
    return true;
}

export async function POST(request) {
    try {
        const { tablo, filtreler, sutunlar, limit, order } = await request.json();

        const IZINLI_TABLOLAR = [
            'b2_musteriler', 'b2_siparisler', 'b2_siparis_kalemleri',
            'b2_urun_katalogu', 'b2_stok_hareketleri', 'b2_tedarikciler',
            'b2_cek_senet_vade', 'b2_teklif_logs', 'notifications',
            'b2_personel', 'b2_gorevler', 'b2_operasyonlar', 'b2_is_emirleri',
            'b2_kumas_arsiv', 'b2_kalip_arsiv', 'b2_maliyet_merkezi',
            'b0_sistem_loglari', 'b3_operasyonlar',
        ];

        if (!IZINLI_TABLOLAR.includes(tablo)) {
            return NextResponse.json({ hata: 'Bu tabloya erisim izni yok.' }, { status: 403 });
        }

        // ─── SUTUNLAR DOĞRULAMASI ───────────────────────────────
        // ESKİ: sutunlar doğrudan supabase.select() içine geçiriliyordu
        //        → SQL injection riski (örn: "*, (SELECT password FROM users)")
        // YENİ: Regex whitelist + tehlikeli kalıp engeli
        let secimKolonlari = '*';
        if (sutunlar && typeof sutunlar === 'string' && sutunlar !== '*') {
            if (!parametreGuvenliMi(sutunlar)) {
                return NextResponse.json(
                    { hata: 'Geçersiz sutunlar parametresi. Sadece alfanümerik, virgül ve alt çizgi kabul edilir.' },
                    { status: 400 }
                );
            }
            secimKolonlari = sutunlar;
        }

        let sorgu = supabaseAdmin.from(tablo).select(secimKolonlari);

        if (filtreler && typeof filtreler === 'object') {
            for (const [alan, deger] of Object.entries(filtreler)) {
                // Filtre alan adı doğrulaması
                if (!parametreGuvenliMi(alan)) {
                    return NextResponse.json(
                        { hata: `Geçersiz filtre alan adı: ${alan}` },
                        { status: 400 }
                    );
                }
                if (deger !== undefined && deger !== null) {
                    sorgu = sorgu.eq(alan, deger);
                }
            }
        }

        if (order?.alan) {
            // Order alan adı doğrulaması
            if (!parametreGuvenliMi(order.alan)) {
                return NextResponse.json(
                    { hata: `Geçersiz sıralama alan adı: ${order.alan}` },
                    { status: 400 }
                );
            }
            sorgu = sorgu.order(order.alan, { ascending: order.artan ?? false });
        }

        if (limit) {
            // Limit doğrulama — sadece 1-1000 arasında
            const sayi = Number(limit);
            if (!Number.isInteger(sayi) || sayi < 1 || sayi > 1000) {
                return NextResponse.json(
                    { hata: 'Limit 1-1000 arasında bir tam sayı olmalıdır.' },
                    { status: 400 }
                );
            }
            sorgu = sorgu.limit(sayi);
        }

        const { data, error } = await sorgu;
        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ hata: error.message }, { status: 500 });
    }
}
