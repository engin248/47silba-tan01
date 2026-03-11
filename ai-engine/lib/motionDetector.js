import axios from 'axios';
import jpeg from 'jpeg-js';
import pixelmatch from 'pixelmatch';

// Memorize the last frame of each camera to compare
const KAMERA_GECMIS_KARELERI = {};

/**
 * NVR uzerinden go2rtc araciligiyla bagli olan bir kameranin anlik karesini indirir
 */
export async function getCameraFrame(go2rtcUrl, cameraSrc) {
    try {
        const url = `${go2rtcUrl}/api/frame.jpeg?src=${cameraSrc}`;
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 3000 });
        if (response.status !== 200) return null;

        // JPEG datayi decode et (Raw piksel verisi cikar)
        const frameData = jpeg.decode(response.data, { useTArray: true });
        return frameData;
    } catch (error) {
        console.error(`[AĞ HATASI] ${cameraSrc} karesi alinamadi. Sebep: ${error.message}`);
        return null;
    }
}

/**
 * Iki kare arasindaki pikselleri "Bedava ve Yerel CPU" ile analiz eder.
 * Hareket oranini binde cinsinden dondurur.
 */
export function analyzeMotion(cameraId, currentFrame) {
    const previousFrame = KAMERA_GECMIS_KARELERI[cameraId];

    // Hafizada kare tutarak sonrakine kiyasla
    KAMERA_GECMIS_KARELERI[cameraId] = currentFrame;

    if (!previousFrame) {
        return { isAnomaly: false, reason: 'Ilk okuma', motionScore: 0 };
    }

    if (currentFrame.width !== previousFrame.width || currentFrame.height !== previousFrame.height) {
        return { isAnomaly: false, reason: 'Cozunurluk Degisti', motionScore: 0 };
    }

    const diffCount = pixelmatch(
        currentFrame.data,
        previousFrame.data,
        null,
        currentFrame.width,
        currentFrame.height,
        { threshold: 0.1 }
    );

    const totalPixels = currentFrame.width * currentFrame.height;
    const motionScore = (diffCount / totalPixels) * 100; // % yuzde cinsinden hareketlilik

    return {
        motionScore: motionScore.toFixed(3)
    };
}
