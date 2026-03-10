/**
 * __tests__/lib/aiOneri.test.js
 * Jest unit tests for KN-7 AI öneri motoru
 */

// Mock supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
    },
}));

describe('aiOneriUret', () => {
    it('boş veri ile hata fırlatmamalı', async () => {
        const { aiOneriUret } = await import('@/lib/aiOneri');
        const sonuc = await aiOneriUret();
        expect(Array.isArray(sonuc)).toBe(true);
    });
});

describe('dipArsiv', () => {
    it('dipArsiveKaldir fonksiyonu export edilmeli', async () => {
        const mod = await import('@/lib/dipArsiv');
        expect(typeof mod.dipArsiveKaldir).toBe('function');
        expect(typeof mod.arsivdenGeriYukle).toBe('function');
    });
});
