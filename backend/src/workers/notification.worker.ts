import { Worker } from 'bullmq';

import type {
    NotificationJobData,
} from '../infrastructure/queue/notification.queue.js';

const worker =
    new Worker<NotificationJobData>(
        'notifications',
        async (job) => {
            console.log(
                `[EMAIL SIMULÉ] À ${job.data.email}`,
            );

            console.log(job.data.message);

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