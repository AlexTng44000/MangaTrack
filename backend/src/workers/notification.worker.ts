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

            console.log(
                `Notification ${job.id} envoyée`,
            );
        },

        {
            connection: {
                host: 'localhost',
                port: 6379,
            },
        },
    );

worker.on('completed', (job) => {
    console.log(
        `Notification ${job.id} envoyée`,
    );
});

worker.on('failed', (job, error) => {
    console.error(
        `Notification ${job?.id} échouée`,
        error,
    );
});

console.log(
    'Worker notifications démarré',
);