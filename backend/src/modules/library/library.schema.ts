import { z } from 'zod';

export const createLibraryEntrySchema =
    z.object({
        userId: z
            .number()
            .int()
            .positive(),

        catalogItemId: z
            .number()
            .int()
            .positive(),

        status: z.enum([
            'a_commencer',
            'en_cours',
            'termine',
            'abandonne',
        ]),
    });