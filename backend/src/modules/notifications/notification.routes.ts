import { Router } from 'express';

import type {
    NotificationService,
} from './notification.service.js';

import {
    createNotificationSchema,
} from './notification.schema.js';

export function createNotificationRouter(
    notificationService: NotificationService,
): Router {
    const router = Router();

    router.post('/', async (req, res) => {
        const validation =
            createNotificationSchema.safeParse(
                req.body,
            );

        if (!validation.success) {
            return res.status(400).json({
                error: 'Données invalides',
                details:
                    validation.error.flatten(),
            });
        }

        const input = validation.data;

        try {
            const result =
                await notificationService.createReminder(
                    input,
                );

            return res.status(202).json(result);
        } catch (error) {
            return res.status(400).json({
                error:
                    error instanceof Error
                        ? error.message
                        : 'Rappel invalide',
            });
        }
    });

    return router;
}