import { Router } from 'express';

import type {
    NotificationService,
} from './notification.service.js';

import {
    createNotificationSchema,
} from './notification.schema.js';

import type {
    RequestHandler,
} from 'express';

export function createNotificationRouter(
    notificationService:
        NotificationService,
    requireAuth: RequestHandler,
): Router {
    const router = Router();

    router.post(
        '/',
        requireAuth,
        async (req, res) => {
            const validation =
                createNotificationSchema.safeParse(
                    req.body,
                );

            if (!validation.success) {
                return res.status(400).json({
                    error:
                        'Données invalides',
                    details:
                        validation.error.flatten(),
                });
            }

            try {
                const result =
                    await notificationService
                        .createReminder(
                            req.auth!.userId,
                            validation.data,
                        );

                return res
                    .status(202)
                    .json(result);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message ===
                    'USER_NOT_FOUND'
                ) {
                    return res.status(404).json({
                        error:
                            'Utilisateur introuvable',
                    });
                }

                return res.status(400).json({
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Rappel invalide',
                });
            }
        },
    );

    return router;
}