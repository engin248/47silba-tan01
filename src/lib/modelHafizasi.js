/**
 * NIZAM MODEL HAFIZASI — Ajan Yardımcı Fonksiyonu
 * 
 * Kullanım: Her üretim aşaması geçişinde (M5→M6, vb.) çağrılır.
 * Ajanlar bu fonksiyonu kullanarak modelin geçmişini okur,
 * kritik not varsa üretim bandına uyarı gönderir.
 *
 * Örnek:
 *   const sonuc = await modelHafizasiOku({ model_kodu: 'MODEL-47-A' });
 *   if (sonuc.ogrenme.uyari_var) {
 *       await uretimBandinaAlert(sonuc.ogrenme.mesaj);
 *   }
 */

/**
 * Modelin tüm geçmiş notlarını okur ve ajan için öğrenme analizi döndürür.
 * @param {{ model_id?: string, model_kodu?: string, sadece_kritik?: boolean }} params
 * @returns {Promise<ModelHafizasi>}
 */
export async function modelHafizasiOku({ model_id, model_kodu, sadece_kritik = false }) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const params = new URLSearchParams();

    if (model_id) params.set('model_id', model_id);
    if (model_kodu) params.set('model_kodu', model_kodu);
    if (sadece_kritik) params.set('sadece_kritik', 'true');

    const res = await fetch(`${baseUrl}/api/model-hafizasi?${params}`);
    if (!res.ok) throw new Error('Model hafıza sorgusu başarısız: ' + res.status);
    return res.json();
}

/**
 * Zincirci Ajan Üretim Geçiş Kontrolü
 * M5 (Kesim bitti) → M6 (Üretim başlamadan önce)
 *
 * @param {{ model_kodu: string, model_id?: string }} params
 * @param {Function} telegramBildirimFn - mevcut telegramBildirim utility
 * @returns {Promise<{ devamEdebilir: boolean, uyariMesaji: string | null }>}
 */
export async function uretimOncesiModelKontrolu({ model_kodu, model_id }, telegramBildirimFn) {
    try {
        // Yalnızca kritik notları hızlı çek
        const hafiza = await modelHafizasiOku({
            model_id,
            model_kodu,
            sadece_kritik: true,
        });

        const { uyari_var, mesaj, kritik_notlar } = hafiza.ogrenme;

        if (!uyari_var) {
            return {
                devamEdebilir: true,
                uyariMesaji: null,
                kritikNotSayisi: 0,
            };
        }

        // Telegram bildirimi — Koordinatör + Üretim
        if (telegramBildirimFn && mesaj) {
            await telegramBildirimFn(
                `🤖 AJAN ÖĞRENME UYARISI\n` +
                `Model: ${model_kodu || model_id}\n` +
                `Kritik Not Sayısı: ${kritik_notlar.length}\n\n` +
                mesaj
            );
        }

        return {
            devamEdebilir: true,   // Üretim durdurulamaz, ama uyarılır
            uyariMesaji: mesaj,
            kritikNotSayisi: kritik_notlar.length,
            kritikNotlar: kritik_notlar,
        };

    } catch (err) {
        // Hafıza okunamasa bile üretim durmamalı — silent fail
        console.error('[modelHafizasi] Okuma hatası:', err.message);
        return { devamEdebilir: true, uyariMesaji: null, hata: err.message };
    }
}

/*
 * ─────────────────────────────────────────────────────────────────
 * AKIŞ DİYAGRAMI
 * ─────────────────────────────────────────────────────────────────
 *
 * M5 Kesim Tamamlandı
 *         │
 *         ▼
 * uretimOncesiModelKontrolu({ model_kodu: 'MODEL-47-A' })
 *         │
 *         ├── kritik_not var mı?
 *         │     │
 *         │     ├── EVET ──► Telegram + Üretim Bandı Uyarısı
 *         │     │             "Dikiş sorunu yaşanmış, geçmişi oku"
 *         │     │
 *         │     └── HAYIR ──► Sessiz geçiş, M6 başlar
 *         │
 *         ▼
 * M6 Üretim Başlar (bilgili başlar)
 *
 * ─────────────────────────────────────────────────────────────────
 * ENTEGRASYON:
 * Ajanlar modülünde (AjanlarMainContainer) veya
 * zincir tetikleyicide şu şekilde kullan:
 *
 *   const { uyariMesaji } = await uretimOncesiModelKontrolu(
 *       { model_kodu: siparis.model_kodu },
 *       telegramBildirim
 *   );
 *   if (uyariMesaji) setUyari(uyariMesaji);
 * ─────────────────────────────────────────────────────────────────
 */
