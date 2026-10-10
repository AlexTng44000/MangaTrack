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

        const entry =
            await libraryService.add(input);

        return res.status(201).json(entry);
    });

    return router;
}