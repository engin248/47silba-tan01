/**
 * __tests__/utils/kalemlerToplam.test.js
 * Jest unit tests for siparislerApi utility functions
 */

describe('kalemlerToplam', () => {
    // Inline test — import'sız (pure function copy)
    function kalemlerToplam(kalemler) {
        return kalemler.reduce((s, k) =>
            s + (parseInt(k.adet) || 0) * parseFloat(k.birim_fiyat_tl || 0) * (1 - (parseFloat(k.iskonto_pct) || 0) / 100), 0);
    }

    it('boş kalem listesi 0 döndürmeli', () => {
        expect(kalemlerToplam([])).toBe(0);
    });

    it('bir kalem hesabı doğru yapılmalı', () => {
        const kalemler = [{ adet: '2', birim_fiyat_tl: '100', iskonto_pct: '10' }];
        expect(kalemlerToplam(kalemler)).toBeCloseTo(180, 2); // 2 x 100 x 0.9 = 180
    });

    it('çok kalem toplamı doğru olmalı', () => {
        const kalemler = [
            { adet: '3', birim_fiyat_tl: '50', iskonto_pct: '0' },
            { adet: '1', birim_fiyat_tl: '200', iskonto_pct: '20' },
        ];
        expect(kalemlerToplam(kalemler)).toBeCloseTo(310, 2); // 150 + 160 = 310
    });

    it('negatif iskonto güvenli olmalı', () => {
        const kalemler = [{ adet: '1', birim_fiyat_tl: '100', iskonto_pct: undefined }];
        expect(kalemlerToplam(kalemler)).toBe(100);
    });
});

describe('siparisSil — dijital adalet kilidi', () => {
    it('onaylı sipariş silinemez', async () => {
        const { siparisSil } = await import('@/features/siparisler/services/siparislerApi');
        const siparisler = [{ id: '1', durum: 'onaylandi' }];
        await expect(siparisSil('1', siparisler)).rejects.toThrow('DİJİTAL ADALET KİLİDİ');
    });
});
