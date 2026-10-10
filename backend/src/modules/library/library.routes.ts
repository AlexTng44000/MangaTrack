import { Router } from 'express';

import { LibraryService } from './library.service.js';
import type {
    CreateLibraryEntryInput,
} from './library.types.js';

export const libraryRouter = Router();

const libraryService = new LibraryService();

libraryRouter.get('/', (_req, res) => {
    res.json(libraryService.getAll());
});

libraryRouter.post('/', (req, res) => {
    const input = req.body as CreateLibraryEntryInput;

    if (
        !input.userId ||
        !input.catalogItemId ||
        !input.status
    ) {
        return res.status(400).json({
            error: 'userId, catalogItemId et status sont obligatoires',
        });
    }

    const entry = libraryService.add(input);

    return res.status(201).json(entry);
});