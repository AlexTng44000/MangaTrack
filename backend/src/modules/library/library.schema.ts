import { z } from 'zod';

export const createLibraryEntrySchema =
    z.object({
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

export const updateLibraryStatusSchema =
    z.object({
        status: z.enum([
            'a_commencer',
            'en_cours',
            'termine',
            'abandonne',
        ]),
    });