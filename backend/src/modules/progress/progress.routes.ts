import { Router } from 'express';

import type {
    ProgressService,
} from './progress.service.js';

import {
    progressParamsSchema,
    updateProgressSchema,
} from './progress.schema.js';

import type {
    RequestHandler,
} from 'express';

export function createProgressRouter(
    progressService: ProgressService,
    requireAuth: RequestHandler,
): Router {
    const router = Router();

    router.patch(
        '/:libraryEntryId',
        requireAuth,
        async (req, res) => {
            const paramsValidation =
                progressParamsSchema.safeParse(
                    req.params,
                );

            if (!paramsValidation.success) {
                return res.status(400).json({
                    error:
                        'Identifiant invalide',
                    details:
                        paramsValidation.error.flatten(),
                });
            }

            const bodyValidation =
                updateProgressSchema.safeParse(
                    req.body,
                );

            if (!bodyValidation.success) {
                return res.status(400).json({
                    error:
                        'Progression invalide',
                    details:
                        bodyValidation.error.flatten(),
                });
            }

            const { libraryEntryId } =
                paramsValidation.data;

            const { progress } =
                bodyValidation.data;

            const entry =
                await progressService.updateProgress(
                    req.auth!.userId,
                    libraryEntryId,
                    progress,
                );

            if (!entry) {
                return res.status(404).json({
                    error:
                        'Œuvre introuvable dans la bibliothèque',
                });
            }

            return res.json(entry);
        },
    );

    return router;
}