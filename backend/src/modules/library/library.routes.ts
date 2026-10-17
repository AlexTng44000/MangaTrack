import { Router } from 'express';

import type { LibraryService } from './library.service.js';
import type {
    CreateLibraryEntryInput,
} from './library.types.js';
import {
    createLibraryEntrySchema,
} from './library.schema.js';

import type {
    RequestHandler,
} from 'express';

export function createLibraryRouter(
    libraryService: LibraryService,
    requireAuth: RequestHandler,
): Router {
    const router = Router();

    router.get(
        '/',
        requireAuth,
        async (req, res) => {
            const entries =
                await libraryService.getAll(
                    req.auth!.userId,
                );

            return res.json(entries);
        },
    );

    router.post(
        '/',
        requireAuth,
        async (req, res) => {
            const validation =
                createLibraryEntrySchema.safeParse(
                    req.body,
                );

            if (!validation.success) {
                return res.status(400).json({
                    error: 'Données invalides',
                    details:
                        validation.error.flatten(),
                });
            }

            try {
                const entry =
                    await libraryService.add(
                        req.auth!.userId,
                        validation.data,
                    );

                return res
                    .status(201)
                    .json(entry);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message ===
                    'LIBRARY_ENTRY_ALREADY_EXISTS'
                ) {
                    return res.status(409).json({
                        error:
                            'Cette œuvre est déjà dans la bibliothèque',
                    });
                }

                return res.status(500).json({
                    error: 'Erreur interne',
                });
            }
        },
    );

    router.delete(
        '/:id',
        requireAuth,
        async (req, res) => {
            const id =
                Number(req.params.id);

            if (
                !Number.isInteger(id) ||
                id < 1
            ) {
                return res.status(400).json({
                    error:
                        'Identifiant invalide',
                });
            }

            try {
                await libraryService.delete(
                    id,
                    req.auth!.userId,
                );

                return res.status(204).send();
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message ===
                    'LIBRARY_ENTRY_NOT_FOUND'
                ) {
                    return res.status(404).json({
                        error:
                            'Œuvre introuvable dans la bibliothèque',
                    });
                }

                throw error;
            }
        },
    );

    return router;
}