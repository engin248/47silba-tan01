const { Redis } = require('@upstash/redis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') }); // [H10 FIX] göreli path → mutlak path
const crypto = require('crypto');

// Lazy Redis bağlantısı — modül yüklenirken değil, kullanıldığında bağlan
let _redis = null;
function getRedis() {
    if (_redis) return _redis;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        console.warn('[REDIS] UPSTASH_REDIS_REST_URL veya TOKEN tanımlı değil — Redis devre dışı.');
        return null;
    }
    _redis = new Redis({ url, token });
    return _redis;
}

/**
 * Görevi (Job) belirtilen kuyruğa ekler.
 */
async function KuyrugaEkle(queueName, jobData) {
    const redis = getRedis();
    if (!redis) return null;
    try {
        const dataString = JSON.stringify({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            data: jobData,
            status: 'bekliyor'
        });
        const length = await redis.lpush(queueName, dataString);
        console.log(`[REDIS] Görev eklendi. Kuyruk: ${queueName}, Uzunluk: ${length}`);
        return length;
    } catch (error) {
        console.error(`[REDIS ERROR] KuyrugaEkle başarısız:`, error);
        return null;
    }
}

/**
 * Belirtilen kuyruktan işlenecek ilk görevi alır (Listeden çıkarır).
 */
async function KuyruktanAl(queueName) {
    const redis = getRedis();
    if (!redis) return null;
    try {
        const jobString = await redis.rpop(queueName);
        if (!jobString) return null;
        return JSON.parse(jobString);
    } catch (error) {
        console.error(`[REDIS ERROR] KuyruktanAl başarısız:`, error);
        return null;
    }
}

async function KuyrukUzunlugu(queueName) {
    const redis = getRedis();
    if (!redis) return 0;
    try {
        return await redis.llen(queueName);
    } catch (error) {
        return 0;
    }
}

module.exports = {
    KuyrugaEkle,
    KuyruktanAl,
    KuyrukUzunlugu
};
