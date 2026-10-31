import {
    Worker,
} from 'bullmq';

import Redis from 'ioredis';

import type {
    NotificationJobData,
} from '../modules/notifications/notification.types.js';

import {
    BrevoEmailAdapter,
} from '../integrations/email/brevoEmail.adapter.js';

import {
    env,
} from '../config/env.js';

import {
    db,
} from '../infrastructure/database/database.js';

import {
    PostgresReminderRepository,
} from '../infrastructure/database/postgresReminder.repository.js';

// Starting an API does not require SMTP, but an enabled delivery worker does.
if (!env.SMTP_USER || !env.SMTP_PASSWORD || env.MAIL_FROM_EMAIL.endsWith('.invalid')) {
    console.error('Configure SMTP_USER, SMTP_PASSWORD and a valid MAIL_FROM_EMAIL before starting the notification worker.');
    process.exit(1);
}

const redisConnection =
    new Redis(
        env.REDIS_URL,
        {
            maxRetriesPerRequest: null,
        },
    );

const emailService =
    new BrevoEmailAdapter({
        host:
            env.SMTP_HOST,

        port:
            env.SMTP_PORT,

        user:
            env.SMTP_USER,

        password:
            env.SMTP_PASSWORD,

        fromName:
            env.MAIL_FROM_NAME,

        fromEmail:
            env.MAIL_FROM_EMAIL,
    });

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
            connection:
                redisConnection,
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
    'Worker notifications démarré avec Brevo SMTP',
);