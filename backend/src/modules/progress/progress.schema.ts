import { z } from 'zod';

export const progressParamsSchema =
    z.object({
        libraryEntryId: z.coerce
            .number()
            .int()
            .positive(),
    });

export const updateProgressSchema =
    z.object({
        progress: z
            .number()
            .int()
            .min(0),
    });