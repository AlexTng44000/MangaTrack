import { Router } from 'express';

import type {
    NotificationService,
} from './notification.service.js';

import type {
    CreateNotificationInput,
} from './notification.types.js';

export function createNotificationRouter(
    notificationService: NotificationService,
): Router {
    const router = Router();

    router.post('/', async (req, res) => {
        const input =
            req.body as CreateNotificationInput;

        if (
            !input.userId ||
            !input.email ||
            !input.message
        ) {
            return res.status(400).json({
                error:
                    'userId, email et message sont obligatoires',
            });
        }

        const result =
            await notificationService.createReminder(input);

        return res.status(202).json(result);
    });

    return router;
}