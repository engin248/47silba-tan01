// @ts-nocheck
// ─── OFFLINE (ÇEVRİMDIŞI) VERİTABANI MOTORU (INDEXED-DB) ───
// İnternet koptuğunda verileri tarayıcı hafızasına (IndexedDB) kilitler ve
// İnternet geldiğinde Supabase'e gönderir.

import { supabase } from './supabase';

const DB_ADI = 'Mizanet_Offline_DB';
const STORE_ADI = 'bekleyen_kuyruk';

export function baglantiAc() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_ADI, 1);

        request.onerror = (event) => reject('IndexedDB Açılamadı: ' + event.target.error);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_ADI)) {
                // Her çevrimdışı işlemin bir ID'si, Tablo Adı, Operasyonu ve Payload'ı olur
                db.createObjectStore(STORE_ADI, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
    });
}

// 1. İŞÇİ İNTERNETSİZKEN VERİYİ KAYDEDİNCE ÇAĞRILACAK FONKSİYON
export async function cevrimeKuyrugaAl(tabloAdi, operasyonTipi = 'INSERT', veri) {
    const db = await baglantiAc();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_ADI, 'readwrite');
        const store = transaction.objectStore(STORE_ADI);

        // 💥 KÖR NOKTA ÇÖZÜMÜ: Mükerrer Kaydı (Race Condition) Önlemek İçin 
        // Veriye istemcide (offline iken) bir UUID basıyoruz ki, internet gelince 
        // aynı buton tıklamasından 3 kere INSERT atılmasın (Idempotency).
        const guvenliVeri = { ...veri };
        if (operasyonTipi === 'INSERT' && !guvenliVeri.id) {
            guvenliVeri.id = crypto.randomUUID();
        }

        // V2 Imalatında kullanılan is_offline_sync Sütunu da işaretleniyor:
        if (operasyonTipi === 'INSERT' || operasyonTipi === 'UPDATE') {
            guvenliVeri.is_offline_sync = true;
        }

        const islemOzet = {
            tablo: tabloAdi,
            operasyon: operasyonTipi, // 'INSERT', 'UPDATE', 'DELETE'
            veri: guvenliVeri,
            tarih: new Date().toISOString()
        };

        const request = store.add(islemOzet);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

// 2. İNTERNET GELDİĞİNDE KUYRUKTAKİLERİ GETİR (ARKA PLANDA OKUMAK İÇİN)
export async function bekleyenleriGetir() {
    const db = await baglantiAc();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_ADI, 'readonly');
        const store = transaction.objectStore(STORE_ADI);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 3. KUYRUKTAKİ İŞLEM SUPABASE'E BAŞARIYLA GİDİNCE KUYRUKTAN SİL
export async function kuyruktanSil(id) {
    const db = await baglantiAc();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_ADI, 'readwrite');
        const store = transaction.objectStore(STORE_ADI);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// 💥 4. ANA SENKRONİZASYON MOTORU (İnternet Geldiği Saniye Çalışır)
export async function offlineSenkronizasyonuBaslat() {
    if (!navigator.onLine) return { basarili: 0, basarisiz: 0 };

    try {
        const kuyruk = await bekleyenleriGetir();
        if (!kuyruk || kuyruk.length === 0) return { basarili: 0, basarisiz: 0 };

        let basariliAdet = 0;
        let basarisizAdet = 0;

        for (const islem of kuyruk) {
            let hataliMi = false;

            try {
                if (islem.operasyon === 'INSERT') {
                    // [M11 STOK ZIRHI]: Stok eklemelerini Backend API (ZOD Kalkanı) üzerinden geçir, bypass'ı durdur!
                    if (islem.tablo === 'b2_stok_hareketleri') {
                        const apiYanit = await fetch('/api/stok-hareket-ekle', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(islem.veri)
                        });
                        if (!apiYanit.ok) {
                            const errData = await apiYanit.json().catch(() => ({}));
                            throw new Error(errData.hata || 'ZOD API Reddi (Bypass Engellendi)');
                        }
                    } else {
                        // Diğer tablolar için normal Upsert (Çift kayıtları engeller)
                        const { error } = await supabase.from(islem.tablo).upsert([islem.veri], { onConflict: 'id' });
                        if (error) throw error;
                    }
                } else if (islem.operasyon === 'UPDATE') {
                    const { error } = await supabase.from(islem.tablo).update(islem.veri).eq('id', islem.veri.id);
                    if (error) throw error;
                } else if (islem.operasyon === 'DELETE') {
                    const { error } = await supabase.from(islem.tablo).delete().eq('id', islem.veri.id);
                    if (error) throw error;
                }

                // Başarılıysa kuyruktan sil (Mükerrer olmasın)
                await kuyruktanSil(islem.id);
                basariliAdet++;

            } catch (err) {
                console.error(`[OFFLINE HATA] ${islem.tablo} tablosuna aktarım çöktü:`, err);
                basarisizAdet++;
            }
        }

        return { basarili: basariliAdet, basarisiz: basarisizAdet };

    } catch (dbHata) {
        console.error("Kuyruk okunamadı", dbHata);
        return { basarili: 0, basarisiz: 0 };
    }
}
