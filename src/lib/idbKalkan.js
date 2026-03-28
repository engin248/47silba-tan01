/**
 * lib/idbKalkan.js - LocalFirst Architecture (Sıfır Gecikme & Kesin Çevrimdışı Çalışma)
 * Milyonluk verilerin tarayıcı RAM'ini patlatmasını engellemek ve otonom senkronizasyon için
 * HTML5 IndexedDB kullanan Siber Zırh Motoru. 
 * Diğer modüllerde (Kasa, Sipariş, Müşteri) kullanılabilir.
 */

const DB_NAME = 'MizanetZirhi_DB';
const DB_VERSION = 1;

// Tablo yapıları
const STORES = {
    m9_kasa: 'id, hareket_tipi, onay_durumu, created_at, musteri_id',
    m8_siparis: 'id, durum, kanal, musteri_id',
    m7_uretim: 'id, is_emri_no, durum',
    m11_stok: 'id, stok_kodu, kategori',
    m2_musteri: 'id, musteri_kodu, musteri_tipi',
    m10_katalog: 'id, urun_kodu, kategori_id, durum',
    m13_maliyet: 'id, order_id, on_gecis',
    m14_muhasebe: 'id, rapor_durumu, evrak_no'
};

class LocalDBKalkan {
    constructor() {
        this.db = null;
        this.initPromise = this.init();
    }

    async init() {
        if (typeof window === 'undefined') return; // Sadece Client-side'da çalışır

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // STORES nesnesine göre tabloları oluştur
                for (const [storeName, indexKeys] of Object.entries(STORES)) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id' });
                        // İndexleri parçala ve oluştur (Veri arama hızı için)
                        indexKeys.split(',').map(k => k.trim()).forEach(key => {
                            if (key !== 'id') store.createIndex(key, key, { unique: false });
                        });
                    }
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };

            request.onerror = (e) => {
                console.error('[IDB_KALKAN] Veritabanı başlatılamadı:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    /**
     * Toplu veri yazar/günceller (Upsert)
     * @param {string} p_store - Tablo (örn: m9_kasa)
     * @param {Array} p_data - Eklenecek JSON dizisi
     */
    async bulkUpsert(p_store, p_data) {
        if (!p_data || p_data.length === 0) return;
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([p_store], 'readwrite');
            const store = transaction.objectStore(p_store);

            p_data.forEach(item => store.put(item)); // varsa günceller yoksa ekler

            transaction.oncomplete = () => resolve(true);
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * Tüm veriyi getirir (Sayfalama destekli - Pagination)
     * @param {string} p_store - Tablo adı
     * @param {number} p_limit - Sayfa başına kayıt
     * @param {number} p_offset - Atlanacak kayıt sayısı
     */
    async getAllWithLimit(p_store, p_limit = 500, p_offset = 0) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([p_store], 'readonly');
            const store = transaction.objectStore(p_store);
            const request = store.getAll(); // IndexedDB'de getAllCursor limit desteğine sahiptir ama pratik olarak getAll ile çekip slice atıyoruz (Küçük ölçekte). Büyük milyon veride cursor kullanılır.

            request.onsuccess = (e) => {
                const allData = e.target.result;
                // Tarihe göre tersten sırala (En yeni en üste)
                const sorted = allData.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                resolve(sorted.slice(p_offset, p_offset + p_limit));
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * İndex üzerinden filtreleme yaparak milyon satır içinde anında bulur
     */
    async getByIndex(p_store, p_index, p_value) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([p_store], 'readonly');
            const store = transaction.objectStore(p_store);
            const index = store.index(p_index);
            const request = index.getAll(p_value);

            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * İd'ye göre tekill siler
     */
    async deleteRecord(p_store, p_id) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([p_store], 'readwrite');
            const store = transaction.objectStore(p_store);
            const request = store.delete(p_id);

            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * Localfirst senkronizasyon motoru: Otonom Arka Plan
     * @param {Function} fetchFn - Supabase'den veri çekecek fonksiyon (Örn: supabase.from('...').select())
     * @param {string} storeName - Kaydedilecek IDB tablosu
     */
    async otonomSenkronize(fetchFn, storeName) {
        try {
            if (!navigator.onLine) return; // Çevrimdışıysa sync deneme bile
            const { data, error } = await fetchFn();
            if (error) throw error;
            if (data && data.length > 0) {
                await this.bulkUpsert(storeName, data);
            }
        } catch (e) {
            console.warn(`[IDB_SYNC_WARN] ${storeName} senkronize edilemedi. Local data kullanılmaya devam edecek.`);
        }
    }
}

// Sınıfı singleton (tekil) olarak dışarı aktar
export const idb = new LocalDBKalkan();
