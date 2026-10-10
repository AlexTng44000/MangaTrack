import { Worker } from 'bullmq';

import type {
    NotificationJobData,
} from '../modules/notifications/notification.types.js';

import type {
    EmailPort,
} from '../modules/notifications/email.port.js';

import {
    FakeEmailAdapter,
} from '../integrations/email/fakeEmail.adapter.js';

const emailService: EmailPort =
    new FakeEmailAdapter();

const worker =
    new Worker<NotificationJobData>(
        'notifications',
        async (job) => {
            await emailService.send(
                job.data.email,
                job.data.message,
            );

            return {
                sent: true,
            };
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