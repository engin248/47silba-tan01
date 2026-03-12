import { z } from 'zod';

export const komutSchema = z.object({
    komut: z.string().min(1, 'Komut bos olamaz').max(100, 'Komut cok uzun (max 100 karakter)')
});
