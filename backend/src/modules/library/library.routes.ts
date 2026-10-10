import { Router } from 'express';

import type { LibraryService } from './library.service.js';
import type {
    CreateLibraryEntryInput,
} from './library.types.js';

export function createLibraryRouter(
    libraryService: LibraryService,
): Router {
    const router = Router();

    router.get('/', async (_req, res) => {
        const entries =
            await libraryService.getAll();

        return res.json(entries);
    });

    router.post('/', async (req, res) => {
        const input =
            req.body as CreateLibraryEntryInput;

        if (
            !input.userId ||
            !input.catalogItemId ||
            !input.status
        ) {
            return res.status(400).json({
                error:
                    'userId, catalogItemId et status sont obligatoires',
            });
        }

        try {
            const entry =
                await libraryService.add(input);

            return res.status(201).json(entry);
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
    });

    return router;
}