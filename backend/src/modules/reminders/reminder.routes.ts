import {
    Router,
} from 'express';

import type {
    RequestHandler,
} from 'express';

import type {
    ReminderService,
} from './reminder.service.js';

import {
    createReminderSchema,
} from './reminder.schema.js';

export function createReminderRouter(
    reminderService: ReminderService,
    requireAuth: RequestHandler,
): Router {
    const router =
        Router();

    router.get(
        '/',
        requireAuth,
        async (req, res) => {
            const reminders =
                await reminderService.getAll(
                    req.auth!.userId,
                );

            return res.json(
                reminders,
            );
        },
    );

    router.post(
        '/',
        requireAuth,
        async (req, res) => {
            const parsed =
                createReminderSchema.safeParse(
                    req.body,
                );

            if (!parsed.success) {
                return res.status(400).json({
                    error:
                        'Rappel invalide',

                    details:
                        parsed.error.flatten(),
                });
            }

            const reminder =
                await reminderService.create(
                    req.auth!.userId,
                    parsed.data,
                );

            return res
                .status(201)
                .json(reminder);
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
                const reminder =
                    await reminderService.cancel(
                        id,
                        req.auth!.userId,
                    );

                return res.json(
                    reminder,
                );
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message ===
                    'REMINDER_NOT_FOUND'
                ) {
                    return res.status(404).json({
                        error:
                            'Rappel introuvable',
                    });
                }

                if (
                    error instanceof Error &&
                    error.message ===
                    'REMINDER_NOT_PENDING'
                ) {
                    return res.status(409).json({
                        error:
                            'Ce rappel ne peut plus être annulé',
                    });
                }

                if (
                    error instanceof Error &&
                    error.message ===
                    'REMINDER_JOB_NOT_FOUND'
                ) {
                    return res.status(409).json({
                        error:
                            'Le job associé au rappel est introuvable',
                    });
                }

                throw error;
            }
        },
    );
    return router;
}