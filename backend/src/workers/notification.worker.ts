import { Worker } from 'bullmq';

import type {
    NotificationJobData,
} from '../modules/notifications/notification.types.js';

import {
    FakeEmailAdapter,
} from '../integrations/email/fakeEmail.adapter.js';

import {
    db,
} from '../infrastructure/database/database.js';

import {
    PostgresReminderRepository,
} from '../infrastructure/database/postgresReminder.repository.js';

const emailService =
    new FakeEmailAdapter();

const reminderRepository =
    new PostgresReminderRepository(
        db,
    );

const worker =
    new Worker<NotificationJobData>(
        'notifications',

        async (job) => {
            await emailService.send(
                job.data.email,
                job.data.message,
            );

            if (job.data.reminderId) {
                await reminderRepository.updateStatus(
                    job.data.reminderId,
                    'sent',
                );
            }
        },

        {
            connection: {
                host: 'localhost',
                port: 6379,
            },
        },
    );

worker.on(
    'completed',
    (job) => {
        console.log(
            `Notification ${job.id} envoyée`,
        );
    },
);

worker.on(
    'failed',
    async (
        job,
        error,
    ) => {
        if (!job) {
            console.error(
                'Notification inconnue échouée',
                error,
            );

            return;
        }

        const maxAttempts =
            job.opts.attempts ??
            1;

        const attemptsMade =
            job.attemptsMade;

        if (
            attemptsMade >=
            maxAttempts
        ) {
            console.error(
                `Notification ${job.id} définitivement échouée après ${attemptsMade} tentative(s)`,
                error,
            );

            if (
                job.data.reminderId
            ) {
                try {
                    await reminderRepository.updateStatus(
                        job.data.reminderId,
                        'failed',
                    );
                } catch (
                updateError
                ) {
                    console.error(
                        `Impossible de marquer le rappel ${job.data.reminderId} comme failed`,
                        updateError,
                    );
                }
            }

            return;
        }

        console.warn(
            `Notification ${job.id} échouée - nouvelle tentative prévue (${attemptsMade}/${maxAttempts})`,
        );
    },
);

console.log(
    'Worker notifications démarré',
);