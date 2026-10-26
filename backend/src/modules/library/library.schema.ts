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

export const updateFavoriteSchema =
    z.object({
        isFavorite:
            z.boolean(),
    });

export const updateRatingSchema =
    z.object({
        rating:
            z.number()
                .int()
                .min(0)
                .max(10)
                .nullable(),
    });

export const updateResumePointSchema =
    z.object({
        resumeCatalogItemId:
            z.number()
                .int()
                .positive()
                .nullable(),

        resumeChapter:
            z.number()
                .int()
                .positive()
                .nullable(),
    })
        .refine(
            (data) =>
                (
                    data.resumeCatalogItemId ===
                    null &&
                    data.resumeChapter ===
                    null
                ) ||
                (
                    data.resumeCatalogItemId !==
                    null &&
                    data.resumeChapter !==
                    null
                ),
            {
                message:
                    'Le manga de reprise et le chapitre doivent être renseignés ensemble.',
            },
        );