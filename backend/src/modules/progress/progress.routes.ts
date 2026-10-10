import { Router } from 'express';

import type { ProgressService } from './progress.service.js';
import type { UpdateProgressInput } from './progress.types.js';

export function createProgressRouter(
    progressService: ProgressService,
): Router {
    const router = Router();

    router.patch('/:libraryEntryId', (req, res) => {
        const libraryEntryId = Number(req.params.libraryEntryId);
        const input = req.body as UpdateProgressInput;

        if (
            Number.isNaN(libraryEntryId) ||
            typeof input.progress !== 'number' ||
            input.progress < 0
        ) {
            return res.status(400).json({
                error: 'Une progression valide est obligatoire',
            });
        }

        const entry = progressService.updateProgress(
            libraryEntryId,
            input.progress,
        );

        if (!entry) {
            return res.status(404).json({
                error: 'Œuvre introuvable dans la bibliothèque',
            });
        }

        return res.json(entry);
    });

    return router;
}